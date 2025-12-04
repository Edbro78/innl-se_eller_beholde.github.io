# Deploy script for GitHub Pages
$ErrorActionPreference = "Stop"

# Get the script directory (project root)
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "Current directory: $(Get-Location)"

# Initialize git if not already initialized
if (-not (Test-Path .git)) {
    Write-Host "Initializing git repository..."
    git init
}

# Add remote if not exists
$remoteUrl = "https://github.com/edbro78/innl-se_eller_beholde.github.io.git"
$existingRemote = git remote get-url origin 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Adding remote origin..."
    git remote add origin $remoteUrl
} elseif ($existingRemote -ne $remoteUrl) {
    Write-Host "Updating remote origin..."
    git remote set-url origin $remoteUrl
}

# Add all files
Write-Host "Adding files..."
git add .

# Commit changes
Write-Host "Committing changes..."
$commitMessage = "Update: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
git commit -m $commitMessage

# Push to GitHub
Write-Host "Pushing to GitHub..."
git push -u origin main --force

Write-Host "Deployment complete!"

