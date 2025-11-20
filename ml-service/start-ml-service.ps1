# Start ML Service Script
# Run with: .\start-ml-service.ps1

Write-Host "🚀 Starting ML Service..." -ForegroundColor Green
Write-Host ""

# Activate conda environment
Write-Host "📦 Activating conda environment: geo_ml" -ForegroundColor Cyan
conda activate geo_ml

# Check if activation was successful
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to activate conda environment" -ForegroundColor Red
    exit 1
}

# Navigate to ml-service directory
Set-Location -Path "d:\Projects\GEO Enabled\ml-service"

# Display configuration
Write-Host ""
Write-Host "⚙️  ML Service Configuration:" -ForegroundColor Yellow
Write-Host "   Port: 8000" -ForegroundColor White
Write-Host "   Confidence Threshold: 70% (0.70)" -ForegroundColor White
Write-Host "   Embedding Size: 512-D FaceNet" -ForegroundColor White
Write-Host "   Distance Metric: Cosine Similarity" -ForegroundColor White
Write-Host ""

# Start the service
Write-Host "🔥 Starting FastAPI server..." -ForegroundColor Green
Write-Host ""

conda run -n geo_ml python app.py
