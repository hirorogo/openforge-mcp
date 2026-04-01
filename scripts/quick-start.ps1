#
# quick-start.ps1
# OpenForge MCP Quick Start -- installs dependencies and builds the server.
# For Windows PowerShell.

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Write-Host "OpenForge MCP Quick Start"
Write-Host "========================="
Write-Host ""

# Check Node.js
try {
    $nodeVersion = & node -v 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Node.js not found" }
    Write-Host "[OK] Node.js $nodeVersion"
} catch {
    Write-Host "[ERROR] Node.js is not installed. Download from https://nodejs.org"
    exit 1
}

# Check npm
try {
    $npmVersion = & npm -v 2>&1
    if ($LASTEXITCODE -ne 0) { throw "npm not found" }
    Write-Host "[OK] npm $npmVersion"
} catch {
    Write-Host "[ERROR] npm is not installed. It should come with Node.js."
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..."
Push-Location (Join-Path $ProjectRoot "packages\mcp-server")
try {
    & npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

    & npm run build
    if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }

    Write-Host "[OK] MCP Server built"

    # Run setup
    Write-Host ""
    Write-Host "Running setup..."
    & node dist/cli/index.js setup
} finally {
    Pop-Location
}
