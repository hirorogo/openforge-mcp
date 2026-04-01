#!/bin/bash
#
# test-connection.sh
# Tests the OpenForge MCP server by building, starting, and sending requests.
# Works on Mac, Linux, and Windows (Git Bash).

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVER_DIR="$PROJECT_ROOT/packages/mcp-server"
SERVER_PID=""
PASS_COUNT=0
FAIL_COUNT=0
PORT=19810

cleanup() {
    if [ -n "$SERVER_PID" ]; then
        echo ""
        echo "Stopping server (PID $SERVER_PID)..."
        kill "$SERVER_PID" 2>/dev/null || true
        wait "$SERVER_PID" 2>/dev/null || true
    fi
}
trap cleanup EXIT

pass() {
    echo "[PASS] $1"
    PASS_COUNT=$((PASS_COUNT + 1))
}

fail() {
    echo "[FAIL] $1"
    FAIL_COUNT=$((FAIL_COUNT + 1))
}

echo "OpenForge MCP Connection Test"
echo "=============================="
echo ""

# Step 1: Build the MCP server
echo "Step 1: Building MCP server..."
cd "$SERVER_DIR"
if npm run build > /dev/null 2>&1; then
    pass "MCP server build succeeded"
else
    fail "MCP server build failed"
    echo ""
    echo "Result: FAIL (build failed, cannot continue)"
    exit 1
fi

# Step 2: Start the server in the background
echo ""
echo "Step 2: Starting MCP server..."
node dist/index.js &
SERVER_PID=$!

# Step 3: Wait for server to start
echo "Waiting for server to start..."
sleep 2

# Verify the server process is still running
if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    fail "Server process exited unexpectedly"
    SERVER_PID=""
    echo ""
    echo "Result: FAIL (server crashed on startup)"
    exit 1
fi
pass "Server started (PID $SERVER_PID)"

# Step 4: Test /api/status endpoint
echo ""
echo "Step 3: Testing /api/status..."
STATUS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/api/status" 2>/dev/null || echo "000")
if [ "$STATUS_RESPONSE" = "200" ]; then
    pass "/api/status returned HTTP 200"
    STATUS_BODY=$(curl -s "http://localhost:$PORT/api/status" 2>/dev/null)
    echo "  Response: $STATUS_BODY"
else
    fail "/api/status returned HTTP $STATUS_RESPONSE (expected 200)"
fi

# Step 5: Test /api/categories endpoint
echo ""
echo "Step 4: Testing /api/categories..."
CATEGORIES_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/api/categories" 2>/dev/null || echo "000")
if [ "$CATEGORIES_RESPONSE" = "200" ]; then
    pass "/api/categories returned HTTP 200"
    CATEGORIES_BODY=$(curl -s "http://localhost:$PORT/api/categories" 2>/dev/null)
    echo "  Response: $CATEGORIES_BODY"
else
    fail "/api/categories returned HTTP $CATEGORIES_RESPONSE (expected 200)"
fi

# Step 6: Report results
echo ""
echo "=============================="
echo "Results: $PASS_COUNT passed, $FAIL_COUNT failed"
echo ""

if [ "$FAIL_COUNT" -gt 0 ]; then
    echo "OVERALL: FAIL"
    exit 1
else
    echo "OVERALL: PASS"
    exit 0
fi
