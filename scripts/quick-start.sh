#!/bin/bash
#
# quick-start.sh
# OpenForge MCP Quick Start -- installs dependencies and builds the server.
# Works on Mac, Linux, and Windows (Git Bash).

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "OpenForge MCP Quick Start"
echo "========================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Download from https://nodejs.org"
    exit 1
fi
echo "[OK] Node.js $(node -v)"

# Check npm
if ! command -v npm &> /dev/null; then
    echo "[ERROR] npm is not installed. It should come with Node.js."
    exit 1
fi
echo "[OK] npm $(npm -v)"

# Install dependencies
echo ""
echo "Installing dependencies..."
cd "$PROJECT_ROOT/packages/mcp-server" && npm install && npm run build
echo "[OK] MCP Server built"

# Run setup
echo ""
echo "Running setup..."
node dist/cli/index.js setup
