#!/usr/bin/env node
/**
 * Fixture Recording Proxy Server
 *
 * A real HTTP proxy that forwards requests to the API while:
 * 1. Preserving Origin/Referer headers from the browser
 * 2. Capturing responses and saving them to disk
 *
 * Usage:
 *   TARGET_API=https://api.staging.upmind.io node tests/fixtures/recording-proxy.mjs
 */

import { createServer } from "http";
import https from "https";
import http from "http";
import { createGunzip, createBrotliDecompress, createInflate } from "zlib";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  generateFixtureName,
  parseJsonOrNull,
  redactValue,
  sanitize,
  sanitizeHeaders
} from "./fixture-naming.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const PROXY_PORT = 3001;
const TARGET_API = process.env.TARGET_API || "https://api.staging.upmind.io";
// Journey slug for v3 provenance; recordings land under recordings/journeys/<slug>/.
const JOURNEY = process.env.JOURNEY || "default";
const FIXTURES_DIR = join(__dirname, "recordings", "journeys", JOURNEY);

// Parse target URL
const targetParsed = new URL(TARGET_API);

// Ensure fixtures directory exists
if (!existsSync(FIXTURES_DIR)) {
  mkdirSync(FIXTURES_DIR, { recursive: true });
}

// No committed _index.json: each journey writes only its own fixture files
// under journeys/<slug>/. The loader (tests/fixtures/index.ts) builds any
// key lookup in memory by walking the pool, so the recorder never maintains a
// giant index that would balloon with every request of every journey.

function saveFixture(
  method,
  path,
  requestHeaders,
  requestBody,
  statusCode,
  responseBody
) {
  try {
    const responseData = JSON.parse(responseBody);
    // Scrub PII (UUIDs / emails / tokens) from the path too — not only the body
    // — so no real client/order/brand ids land in the stored path or filename.
    const safePath = redactValue(path);
    const name = generateFixtureName(method, safePath, responseData);
    const sanitizedResponse = sanitize(responseData);
    const filename = `${name}.json`;
    const filepath = join(FIXTURES_DIR, filename);

    const parsedRequest = parseJsonOrNull(requestBody);
    const sanitizedRequestBody =
      parsedRequest !== null ? sanitize(parsedRequest) : null;

    const fixture = {
      version: 3,
      request: {
        method,
        path: safePath,
        headers: sanitizeHeaders(requestHeaders),
        body: sanitizedRequestBody
      },
      response: {
        status: statusCode,
        headers: {},
        body: sanitizedResponse
      },
      captured_at: new Date().toISOString(),
      brand_domain:
        requestHeaders["host"] || requestHeaders["Host"] || "example.com",
      source: "journey",
      provenance: { journey: JOURNEY }
    };

    writeFileSync(filepath, JSON.stringify(fixture, null, 2));
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
        saveFixture(
          req.method,
          req.url,
          originalHeaders,
          requestBody,
          proxyRes.statusCode,
          body
        );

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
