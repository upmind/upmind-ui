---
name: deploy
description: Deploy the cart app to Firebase hosting and post a notification to slack
---

# /deploy — Deploy cart and notify Slack

Deploy the cart app to Firebase hosting and post a notification to #fe-headless.

## Usage
```
/deploy <target> ["optional summary override"]
```

**Targets:** `sprighost` | `staging` | `production`

**Example:**
```
/deploy sprighost
/deploy staging "auth redirect fix + guest checkout"
```

## Steps

1. **Parse arguments.** Extract `<target>` from the user's message. If missing, ask. Summary is optional — auto-generated if omitted.

// turbo
2. **Check Firebase auth.** Run:
```bash
firebase projects:list 2>&1 | head -5
```
If this fails with an auth error, tell the user to run `firebase login --reauth` in their terminal and wait for them to confirm before continuing.

// turbo
3. **Get branch, version, and auto-summary.** Run:
```bash
cd "$(git rev-parse --show-toplevel)" && echo "BRANCH=$(git branch --show-current)" && echo "VERSION=$(node -p "require('./apps/cart/package.json').version")" && echo "---COMMITS---" && git log --oneline -10
```

If the user didn't provide a summary, generate one from the recent commits:
- Look at commits since the last `cart-v*` tag
- Distill into a short, human-readable one-liner (e.g., "fix free basket showing payment methods")
- If the commits span multiple changes, use a comma-separated list
- **Present the summary to the user for confirmation before deploying**

4. **Deploy.** Run (NOT auto-run — user must approve):
```bash
cd "$(git rev-parse --show-toplevel)/apps/cart" && pnpm run deploy:<target>
```
This builds and deploys. Wait for it to complete.

5. **Generate Slack message.** Format:
```
deploy: `<Target>`
changes: `cart-v<version>`
> <summary>
```

6. **Post to Slack.** If the `slack` MCP server is available, use `slack_post_message` to post the message to `#fe-headless`. Otherwise, fall back to copying to clipboard:

// turbo
```bash
printf '%s' '<slack message>' | pbcopy
```

Tell the user the message is on their clipboard and to paste into **#fe-headless**.
