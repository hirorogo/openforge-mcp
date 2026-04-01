#
# test-connection.ps1
# Tests the OpenForge MCP server by building, starting, and sending requests.
# For Windows PowerShell.

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$ServerDir = Join-Path $ProjectRoot "packages\mcp-server"
$ServerProcess = $null
$PassCount = 0
$FailCount = 0
$Port = 19810

function Pass($msg) {
    Write-Host "[PASS] $msg" -ForegroundColor Green
    $script:PassCount++
}

function Fail($msg) {
    Write-Host "[FAIL] $msg" -ForegroundColor Red
    $script:FailCount++
}

function Cleanup {
    if ($null -ne $script:ServerProcess -and !$script:ServerProcess.HasExited) {
        Write-Host ""
        Write-Host "Stopping server (PID $($script:ServerProcess.Id))..."
        Stop-Process -Id $script:ServerProcess.Id -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "OpenForge MCP Connection Test"
Write-Host "=============================="
Write-Host ""

try {
    # Step 1: Build the MCP server
    Write-Host "Step 1: Building MCP server..."
    Push-Location $ServerDir
    try {
        $buildOutput = & npm run build 2>&1
        if ($LASTEXITCODE -eq 0) {
            Pass "MCP server build succeeded"
        } else {
            Fail "MCP server build failed"
            Write-Host ""
            Write-Host "Result: FAIL (build failed, cannot continue)"
            exit 1
        }
    } finally {
        Pop-Location
    }

    # Step 2: Start the server in the background
    Write-Host ""
    Write-Host "Step 2: Starting MCP server..."
    $ServerProcess = Start-Process -FilePath "node" `
        -ArgumentList (Join-Path $ServerDir "dist\index.js") `
        -PassThru -NoNewWindow

    # Step 3: Wait for server to start
    Write-Host "Waiting for server to start..."
    Start-Sleep -Seconds 2

    if ($ServerProcess.HasExited) {
        Fail "Server process exited unexpectedly"
        $ServerProcess = $null
        Write-Host ""
        Write-Host "Result: FAIL (server crashed on startup)"
        exit 1
    }
    Pass "Server started (PID $($ServerProcess.Id))"

    # Step 4: Test /api/status endpoint
    Write-Host ""
    Write-Host "Step 3: Testing /api/status..."
    try {
        $statusResponse = Invoke-WebRequest -Uri "http://localhost:$Port/api/status" -UseBasicParsing -TimeoutSec 5
        if ($statusResponse.StatusCode -eq 200) {
            Pass "/api/status returned HTTP 200"
            Write-Host "  Response: $($statusResponse.Content)"
        } else {
            Fail "/api/status returned HTTP $($statusResponse.StatusCode) (expected 200)"
        }
    } catch {
        Fail "/api/status request failed: $($_.Exception.Message)"
    }

    # Step 5: Test /api/categories endpoint
    Write-Host ""
    Write-Host "Step 4: Testing /api/categories..."
    try {
        $categoriesResponse = Invoke-WebRequest -Uri "http://localhost:$Port/api/categories" -UseBasicParsing -TimeoutSec 5
        if ($categoriesResponse.StatusCode -eq 200) {
            Pass "/api/categories returned HTTP 200"
            Write-Host "  Response: $($categoriesResponse.Content)"
        } else {
            Fail "/api/categories returned HTTP $($categoriesResponse.StatusCode) (expected 200)"
        }
    } catch {
        Fail "/api/categories request failed: $($_.Exception.Message)"
    }

    # Step 6: Report results
    Write-Host ""
    Write-Host "=============================="
    Write-Host "Results: $PassCount passed, $FailCount failed"
    Write-Host ""

    if ($FailCount -gt 0) {
        Write-Host "OVERALL: FAIL"
        exit 1
    } else {
        Write-Host "OVERALL: PASS"
        exit 0
    }
} finally {
    Cleanup
}
