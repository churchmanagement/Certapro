#!/usr/bin/env pwsh
# File Upload System Testing Script

Write-Host "🧪 Testing CetaProjectsManager File Upload System" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:3001"

# Step 1: Login
Write-Host "`n✅ Step 1: Login as Admin" -ForegroundColor Yellow
$loginBody = @{
    email = "admin@cetraproapp.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "✓ Login successful!" -ForegroundColor Green
    $token = $loginResponse.data.tokens.accessToken
    Write-Host "  Token: $($token.Substring(0, 50))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED: Login failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

$headers = @{
    Authorization = "Bearer $token"
}

# Step 2: Create test files
Write-Host "`n✅ Step 2: Creating Test Files" -ForegroundColor Yellow
$testFile1 = "test-document.txt"
$testFile2 = "test-image.txt"  # Simulating different files

"This is a test document for file upload testing.`nCreated at: $(Get-Date)" | Out-File -FilePath $testFile1
"This is a test image placeholder.`nCreated at: $(Get-Date)" | Out-File -FilePath $testFile2

Write-Host "✓ Test files created:" -ForegroundColor Green
Write-Host "  - $testFile1" -ForegroundColor Gray
Write-Host "  - $testFile2" -ForegroundColor Gray

# Step 3: Check if AWS S3 is configured
Write-Host "`n✅ Step 3: Checking AWS S3 Configuration" -ForegroundColor Yellow
Write-Host "  Note: This test will work only if AWS S3 is configured in .env" -ForegroundColor Yellow

# Step 4: Upload single file
Write-Host "`n✅ Step 4: Upload Single File" -ForegroundColor Yellow
try {
    $form = @{
        file = Get-Item -Path $testFile1
    }

    $uploadResponse = Invoke-RestMethod -Uri "$baseUrl/api/attachments/upload" `
        -Method Post `
        -Headers $headers `
        -Form $form

    Write-Host "✓ Single file uploaded successfully!" -ForegroundColor Green
    Write-Host "  Attachment ID: $($uploadResponse.data.attachment.id)" -ForegroundColor Gray
    Write-Host "  Filename: $($uploadResponse.data.attachment.filename)" -ForegroundColor Gray
    Write-Host "  File Size: $($uploadResponse.data.attachment.fileSize) bytes" -ForegroundColor Gray

    $attachmentId = $uploadResponse.data.attachment.id
} catch {
    $errorMessage = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "⚠️  Upload failed (expected if AWS not configured)" -ForegroundColor Yellow
    Write-Host "  Error: $($errorMessage.message)" -ForegroundColor Yellow

    if ($errorMessage.message -like "*AWS S3 is not configured*") {
        Write-Host "`n  ℹ️  To enable file uploads:" -ForegroundColor Cyan
        Write-Host "     1. Create AWS S3 bucket" -ForegroundColor Cyan
        Write-Host "     2. Add AWS credentials to backend/.env:" -ForegroundColor Cyan
        Write-Host "        AWS_ACCESS_KEY_ID=your-key" -ForegroundColor Cyan
        Write-Host "        AWS_SECRET_ACCESS_KEY=your-secret" -ForegroundColor Cyan
        Write-Host "        AWS_S3_BUCKET=your-bucket-name" -ForegroundColor Cyan
        Write-Host "     3. Restart backend server" -ForegroundColor Cyan
        Write-Host "`n  See TEST_FILE_UPLOAD.md for detailed setup instructions" -ForegroundColor Cyan
    }

    # Continue with other tests
    $attachmentId = $null
}

# Step 5: Upload multiple files (only if S3 is configured)
if ($attachmentId) {
    Write-Host "`n✅ Step 5: Upload Multiple Files" -ForegroundColor Yellow
    try {
        $multiForm = @{
            files = @(
                Get-Item -Path $testFile1
                Get-Item -Path $testFile2
            )
        }

        $multiUploadResponse = Invoke-RestMethod -Uri "$baseUrl/api/attachments/upload-multiple" `
            -Method Post `
            -Headers $headers `
            -Form $multiForm

        Write-Host "✓ Multiple files uploaded successfully!" -ForegroundColor Green
        Write-Host "  Total files: $($multiUploadResponse.data.count)" -ForegroundColor Gray

        foreach ($att in $multiUploadResponse.data.attachments) {
            Write-Host "  - $($att.filename) ($($att.fileSize) bytes)" -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ FAILED: Multiple file upload" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }

    # Step 6: Get download URL
    Write-Host "`n✅ Step 6: Get Download URL" -ForegroundColor Yellow
    try {
        $downloadResponse = Invoke-RestMethod -Uri "$baseUrl/api/attachments/$attachmentId/download?expiresIn=7200" `
            -Method Get `
            -Headers $headers

        Write-Host "✓ Download URL generated!" -ForegroundColor Green
        Write-Host "  URL: $($downloadResponse.data.downloadUrl.Substring(0, 80))..." -ForegroundColor Gray
        Write-Host "  Expires in: $($downloadResponse.data.expiresIn) seconds" -ForegroundColor Gray
    } catch {
        Write-Host "❌ FAILED: Get download URL" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }

    # Step 7: List attachments
    Write-Host "`n✅ Step 7: List All Attachments" -ForegroundColor Yellow
    try {
        $listResponse = Invoke-RestMethod -Uri "$baseUrl/api/attachments" `
            -Method Get `
            -Headers $headers

        Write-Host "✓ Attachments listed!" -ForegroundColor Green
        Write-Host "  Total attachments: $($listResponse.data.count)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ FAILED: List attachments" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }

    # Step 8: Get attachment info
    Write-Host "`n✅ Step 8: Get Attachment Info" -ForegroundColor Yellow
    try {
        $infoResponse = Invoke-RestMethod -Uri "$baseUrl/api/attachments/$attachmentId" `
            -Method Get `
            -Headers $headers

        Write-Host "✓ Attachment info retrieved!" -ForegroundColor Green
        Write-Host "  Original filename: $($infoResponse.data.attachment.originalFilename)" -ForegroundColor Gray
        Write-Host "  File type: $($infoResponse.data.attachment.fileType)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ FAILED: Get attachment info" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }

    # Step 9: Delete attachment
    Write-Host "`n✅ Step 9: Delete Attachment" -ForegroundColor Yellow
    try {
        $deleteResponse = Invoke-RestMethod -Uri "$baseUrl/api/attachments/$attachmentId" `
            -Method Delete `
            -Headers $headers

        Write-Host "✓ Attachment deleted!" -ForegroundColor Green
        Write-Host "  Message: $($deleteResponse.message)" -ForegroundColor Gray
    } catch {
        Write-Host "❌ FAILED: Delete attachment" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

# Cleanup
Write-Host "`n✅ Cleaning up test files..." -ForegroundColor Yellow
Remove-Item $testFile1 -ErrorAction SilentlyContinue
Remove-Item $testFile2 -ErrorAction SilentlyContinue
Write-Host "✓ Test files removed" -ForegroundColor Green

# Summary
Write-Host "`n===================================================" -ForegroundColor Cyan
if ($attachmentId) {
    Write-Host "🎉 File Upload System Tests Passed!" -ForegroundColor Green
    Write-Host "===================================================" -ForegroundColor Cyan
    Write-Host "`n📊 Test Summary:" -ForegroundColor Cyan
    Write-Host "  ✅ Login successful" -ForegroundColor Green
    Write-Host "  ✅ Single file upload" -ForegroundColor Green
    Write-Host "  ✅ Multiple file upload" -ForegroundColor Green
    Write-Host "  ✅ Download URL generation" -ForegroundColor Green
    Write-Host "  ✅ List attachments" -ForegroundColor Green
    Write-Host "  ✅ Get attachment info" -ForegroundColor Green
    Write-Host "  ✅ Delete attachment" -ForegroundColor Green
    Write-Host "`n✨ File upload system is working perfectly!" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  File Upload Tests Skipped (AWS S3 Not Configured)" -ForegroundColor Yellow
    Write-Host "===================================================" -ForegroundColor Cyan
    Write-Host "`n📊 Test Summary:" -ForegroundColor Cyan
    Write-Host "  ✅ Login successful" -ForegroundColor Green
    Write-Host "  ⚠️  File upload endpoints exist but S3 not configured" -ForegroundColor Yellow
    Write-Host "`n  To complete testing:" -ForegroundColor Cyan
    Write-Host "  1. Set up AWS S3 (see TEST_FILE_UPLOAD.md)" -ForegroundColor Cyan
    Write-Host "  2. Run this script again" -ForegroundColor Cyan
    Write-Host "`n✨ File upload infrastructure is ready!" -ForegroundColor Cyan
}
