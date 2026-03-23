# GitHub Auto Push Script
$RepoPath = "C:\myPrjt01\myHome"

# Move to repo folder
Set-Location -Path $RepoPath -ErrorAction Stop

Write-Host ""
Write-Host "========================================"
Write-Host "  GitHub Auto Push - giths-ops"
Write-Host "========================================"
Write-Host ""

# Show changes
Write-Host "[1] Checking changes..."
git status

Write-Host ""
Write-Host "[2] Adding all files..."
git add -A

Write-Host ""
$CommitMsg = Read-Host "Commit message (Enter = auto date)"
if ([string]::IsNullOrWhiteSpace($CommitMsg)) {
    $CommitMsg = "update " + (Get-Date -Format "yyyy-MM-dd HH:mm")
}

Write-Host ""
Write-Host "[3] Committing: $CommitMsg"
git commit -m "$CommitMsg"

Write-Host ""
Write-Host "[4] Pushing to GitHub..."
git push origin master

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] https://giths-ops.github.io" -ForegroundColor Green
} else {
    Write-Host "[FAILED] Push error occurred." -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
