# Quick Setup Script for Tesseract PATH
# This script helps configure Tesseract OCR for the enhanced RAG features

Write-Host "🔍 Searching for Tesseract installation..." -ForegroundColor Cyan

# Common installation paths
$possiblePaths = @(
    "C:\Program Files\Tesseract-OCR\tesseract.exe",
    "C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
    "$env:LOCALAPPDATA\Programs\Tesseract-OCR\tesseract.exe"
)

$tesseractPath = $null

foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $tesseractPath = Split-Path $path -Parent
        Write-Host "✓ Found Tesseract at: $tesseractPath" -ForegroundColor Green
        break
    }
}

if (-not $tesseractPath) {
    Write-Host "❌ Tesseract not found in common locations" -ForegroundColor Red
    Write-Host "Please specify the installation directory:" -ForegroundColor Yellow
    $tesseractPath = Read-Host "Enter path (e.g., C:\Program Files\Tesseract-OCR)"
    
    if (-not (Test-Path "$tesseractPath\tesseract.exe")) {
        Write-Host "❌ tesseract.exe not found at specified path" -ForegroundColor Red
        exit 1
    }
}

# Add to current session PATH
$env:Path += ";$tesseractPath"
Write-Host "✓ Added to current session PATH" -ForegroundColor Green

# Test Tesseract
Write-Host "`n🧪 Testing Tesseract..." -ForegroundColor Cyan
try {
    $version = & tesseract --version 2>&1 | Select-Object -First 1
    Write-Host "✓ Tesseract is working: $version" -ForegroundColor Green
} catch {
    Write-Host "❌ Tesseract test failed: $_" -ForegroundColor Red
    exit 1
}

# Offer to add permanently
Write-Host "`n📌 Do you want to add Tesseract to your permanent PATH? (Y/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -eq 'Y' -or $response -eq 'y') {
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$tesseractPath*") {
        [Environment]::SetEnvironmentVariable("Path", "$currentPath;$tesseractPath", "User")
        Write-Host "✓ Added to permanent PATH (restart terminal to take effect)" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  Already in permanent PATH" -ForegroundColor Cyan
    }
}

Write-Host "`n✅ Setup complete! You can now use enhanced RAG features." -ForegroundColor Green
Write-Host "Run 'python test_dependencies.py' to verify all dependencies." -ForegroundColor Cyan
