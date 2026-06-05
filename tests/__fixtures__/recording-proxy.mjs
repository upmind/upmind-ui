#!/usr/bin/env node
/**
 * Fixture Recording Proxy Server
 *
 * A real HTTP proxy that forwards requests to the API while:
 * 1. Preserving Origin/Referer headers from the browser
 * 2. Capturing responses and saving them to disk
 *
 * Usage:
 *   TARGET_API=https://api.staging.upmind.io node tests/__fixtures__/recording-proxy.mjs
 */

import { createServer } from "http";
import https from "https";
import http from "http";
import { createGunzip, createBrotliDecompress, createInflate } from "zlib";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  generateFixtureName,
  generateReadableKey,
  sanitize
} from "./fixture-naming.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PROXY_PORT = 3001;
const TARGET_API = process.env.TARGET_API || "https://api.staging.upmind.io";
const FIXTURES_DIR = join(__dirname, "recordings");

// Parse target URL
const targetParsed = new URL(TARGET_API);

// Ensure fixtures directory exists
if (!existsSync(FIXTURES_DIR)) {
  mkdirSync(FIXTURES_DIR, { recursive: true });
}

// sanitize, generateFixtureName, generateReadableKey imported from ./fixture-naming.mjs

// Fixture index map - maps readable keys to filenames
const fixtureIndex = {};
const INDEX_PATH = join(FIXTURES_DIR, "_index.json");

// Load existing index
try {
  if (existsSync(INDEX_PATH)) {
    Object.assign(fixtureIndex, JSON.parse(readFileSync(INDEX_PATH, "utf-8")));
  }
} catch {
  // Start fresh
}

function updateIndex(method, path, filename, actorType = null) {
  const readableKey = generateReadableKey(method, path, actorType);

  fixtureIndex[readableKey] = {
    file: filename,
    path: path,
    method: method
  };

  writeFileSync(INDEX_PATH, JSON.stringify(fixtureIndex, null, 2));
}

const SENSITIVE_HEADERS = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "x-auth-token"
]);

function sanitizeHeaders(headers) {
  const result = {};
  for (const [key, value] of Object.entries(headers)) {
    if (SENSITIVE_HEADERS.has(key.toLowerCase())) {
      // Preserve scheme prefix (e.g. "Bearer <REDACTED>") for readability
      const stringValue = String(value);
      const schemeMatch = stringValue.match(/^(\S+)\s+/);
      result[key] = schemeMatch ? `${schemeMatch[1]} <REDACTED>` : "<REDACTED>";
    } else {
      result[key] = value;
    }
  }
  return result;
}

function parseJsonOrNull(body) {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function saveFixture(method, path, requestHeaders, requestBody, statusCode, responseBody) {
  try {
    const responseData = JSON.parse(responseBody);
    const name = generateFixtureName(method, path, responseData);
    const sanitizedResponse = sanitize(responseData);
    const filename = `${name}.json`;
    const filepath = join(FIXTURES_DIR, filename);

    const parsedRequest = parseJsonOrNull(requestBody);
    const sanitizedRequestBody = parsedRequest !== null ? sanitize(parsedRequest) : null;

    const fixture = {
      version: 2,
      request: {
        method,
        path,
        headers: sanitizeHeaders(requestHeaders),
        body: sanitizedRequestBody
      },
      response: {
        status: statusCode,
        body: sanitizedResponse
      },
      captured_at: new Date().toISOString(),
      brand_domain: requestHeaders["host"] || requestHeaders["Host"] || null
    };

    writeFileSync(filepath, JSON.stringify(fixture, null, 2));
    updateIndex(method, path, filename, responseData.actor_type);
    console.log(`💾 Saved: ${filename}`);
  } catch {
    console.log(`⏭️  Skipped (non-JSON): ${method} ${path}`);
  }
}

function getDecompressor(encoding) {
  switch (encoding) {
    case "gzip":
      return createGunzip();
    case "br":
      return createBrotliDecompress();
    case "deflate":
      return createInflate();
    default:
      return null;
  }
}

const server = createServer((req, res) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.writeHead(200, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "access-control-allow-headers":
        "Content-Type, Authorization, X-Requested-With, Accept, Origin, Referer"
    });
    res.end();
    return;
  }

  const isHttps = targetParsed.protocol === "https:";
  const httpModule = isHttps ? https : http;

  // Snapshot the original browser-sent headers BEFORE we mutate for upstream.
  // These are what we want to record in the fixture.
  const originalHeaders = { ...req.headers };

  // Prepare headers - preserve Origin and Referer from browser
  const headers = { ...req.headers };
  headers.host = targetParsed.host;
  // Request uncompressed to simplify handling
  delete headers["accept-encoding"];

  // Log request
  console.log(`🔄 ${req.method} ${req.url}`);

  // Buffer the incoming request body so we can capture AND forward it.
  const requestChunks = [];
  req.on("data", chunk => {
    requestChunks.push(chunk);
  });

  const proxyReq = httpModule.request(
    {
      hostname: targetParsed.hostname,
      port: targetParsed.port || (isHttps ? 443 : 80),
      path: req.url,
      method: req.method,
      headers
    },
    proxyRes => {
      const encoding = proxyRes.headers["content-encoding"];
      const decompressor = getDecompressor(encoding);

      // Stream to decompress or read directly
      const stream = decompressor ? proxyRes.pipe(decompressor) : proxyRes;

      const chunks = [];
      stream.on("data", chunk => {
        chunks.push(chunk);
      });

      stream.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf-8");
        const requestBody = Buffer.concat(requestChunks).toString("utf-8");

        // Save fixture
        saveFixture(req.method, req.url, originalHeaders, requestBody, proxyRes.statusCode, body);

        // Forward response headers (remove encoding since we decompressed)
        const responseHeaders = { ...proxyRes.headers };
        delete responseHeaders["content-encoding"];
        delete responseHeaders["content-length"];
        responseHeaders["access-control-allow-origin"] = "*";
        responseHeaders["access-control-allow-methods"] =
          "GET, POST, PUT, PATCH, DELETE, OPTIONS";
        responseHeaders["access-control-allow-headers"] =
          "Content-Type, Authorization, X-Requested-With, Accept, Origin, Referer";

        res.writeHead(proxyRes.statusCode, responseHeaders);
        res.end(body);
      });

      stream.on("error", err => {
        console.error(`❌ Stream error: ${err.message}`);
        res.writeHead(500);
        res.end(`Stream error: ${err.message}`);
      });
    }
  );

  proxyReq.on("error", err => {
    console.error(`❌ Proxy error: ${err.message}`);
    res.writeHead(502);
    res.end(`Proxy error: ${err.message}`);
  });

  // Forward request body
  req.pipe(proxyReq);
});

server.listen(PROXY_PORT, () => {
  console.log(`
🎬 Fixture Recording Proxy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 Proxy:      http://localhost:${PROXY_PORT}
🎯 Target API: ${TARGET_API}
📁 Fixtures:   ${FIXTURES_DIR}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Press Ctrl+C to stop.
`);
});
