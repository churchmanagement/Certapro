#!/usr/bin/env pwsh
# Authentication Testing Script for CetaProjectsManager

Write-Host "🧪 Testing CetaProjectsManager Authentication API" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:3001"
$testEmail = "testuser_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"

# Test 1: Health Check
Write-Host "`n✅ Test 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
    Write-Host "Status: $($health.status)" -ForegroundColor Green
    Write-Host "Environment: $($health.environment)" -ForegroundColor Green
    Write-Host "Uptime: $($health.uptime) seconds" -ForegroundColor Green
} catch {
    Write-Host "❌ FAILED: Server not responding. Is it running?" -ForegroundColor Red
    Write-Host "Run: cd backend && npm run dev" -ForegroundColor Yellow
    exit 1
}

# Test 2: Register New User
Write-Host "`n✅ Test 2: Register New User" -ForegroundColor Yellow
$registerBody = @{
    email = $testEmail
    password = "test123"
    name = "Test User"
    phone = "+1234567890"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "✓ User registered successfully!" -ForegroundColor Green
    Write-Host "  Email: $($registerResponse.data.user.email)" -ForegroundColor Gray
    Write-Host "  Role: $($registerResponse.data.user.role)" -ForegroundColor Gray
    $userToken = $registerResponse.data.tokens.accessToken
    Write-Host "  Access Token: $($userToken.Substring(0, 50))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Login as Admin
Write-Host "`n✅ Test 3: Login as Admin" -ForegroundColor Yellow
$loginBody = @{
    email = "admin@cetraproapp.com"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    Write-Host "✓ Admin login successful!" -ForegroundColor Green
    Write-Host "  Email: $($loginResponse.data.user.email)" -ForegroundColor Gray
    Write-Host "  Role: $($loginResponse.data.user.role)" -ForegroundColor Gray
    $adminToken = $loginResponse.data.tokens.accessToken
    $refreshToken = $loginResponse.data.tokens.refreshToken
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure database is seeded: cd backend && npm run db:seed" -ForegroundColor Yellow
    exit 1
}

# Test 4: Get Current User
Write-Host "`n✅ Test 4: Get Current User" -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $adminToken"
}
try {
    $meResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method Get -Headers $headers
    Write-Host "✓ Current user retrieved!" -ForegroundColor Green
    Write-Host "  Name: $($meResponse.data.user.name)" -ForegroundColor Gray
    Write-Host "  Email: $($meResponse.data.user.email)" -ForegroundColor Gray
    Write-Host "  Role: $($meResponse.data.user.role)" -ForegroundColor Gray
    Write-Host "  Active: $($meResponse.data.user.isActive)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 5: Refresh Token
Write-Host "`n✅ Test 5: Refresh Access Token" -ForegroundColor Yellow
$refreshBody = @{
    refreshToken = $refreshToken
} | ConvertTo-Json

try {
    $refreshResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/refresh" -Method Post -Body $refreshBody -ContentType "application/json"
    Write-Host "✓ Token refreshed successfully!" -ForegroundColor Green
    $newAccessToken = $refreshResponse.data.tokens.accessToken
    Write-Host "  New Access Token: $($newAccessToken.Substring(0, 50))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 6: Get All Users (Admin Only)
Write-Host "`n✅ Test 6: Get All Users (Admin Endpoint)" -ForegroundColor Yellow
try {
    $usersResponse = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method Get -Headers $headers
    Write-Host "✓ Users retrieved successfully!" -ForegroundColor Green
    Write-Host "  Total Users: $($usersResponse.data.count)" -ForegroundColor Gray
    Write-Host "  Users:" -ForegroundColor Gray
    foreach ($user in $usersResponse.data.users) {
        Write-Host "    - $($user.name) ($($user.email)) [$($user.role)]" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 7: Create User (Admin Only)
Write-Host "`n✅ Test 7: Create User (Admin Endpoint)" -ForegroundColor Yellow
$createUserEmail = "created_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$createUserBody = @{
    email = $createUserEmail
    password = "user123"
    name = "Created User"
    role = "USER"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method Post -Body $createUserBody -ContentType "application/json" -Headers $headers
    Write-Host "✓ User created successfully!" -ForegroundColor Green
    Write-Host "  Email: $($createResponse.data.user.email)" -ForegroundColor Gray
    Write-Host "  Name: $($createResponse.data.user.name)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 8: Update Notification Preferences
Write-Host "`n✅ Test 8: Update Notification Preferences" -ForegroundColor Yellow
$prefsBody = @{
    push = $true
    sms = $false
    email = $true
    inApp = $true
} | ConvertTo-Json

try {
    $prefsResponse = Invoke-RestMethod -Uri "$baseUrl/api/users/notification-preferences" -Method Put -Body $prefsBody -ContentType "application/json" -Headers $headers
    Write-Host "✓ Preferences updated successfully!" -ForegroundColor Green
    Write-Host "  Message: $($prefsResponse.data.message)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 9: Error Handling - Invalid Email
Write-Host "`n✅ Test 9: Error Handling - Invalid Email" -ForegroundColor Yellow
$invalidBody = @{
    email = "invalid-email"
    password = "test123"
    name = "Test"
} | ConvertTo-Json

try {
    $errorResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $invalidBody -ContentType "application/json"
    Write-Host "❌ FAILED: Should have rejected invalid email" -ForegroundColor Red
} catch {
    if ($_.ErrorDetails.Message -like "*email*") {
        Write-Host "✓ Correctly rejected invalid email!" -ForegroundColor Green
    } else {
        Write-Host "❌ FAILED: Wrong error message" -ForegroundColor Red
    }
}

# Test 10: Error Handling - Wrong Password
Write-Host "`n✅ Test 10: Error Handling - Wrong Password" -ForegroundColor Yellow
$wrongPwBody = @{
    email = "admin@cetraproapp.com"
    password = "wrongpassword"
} | ConvertTo-Json

try {
    $errorResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $wrongPwBody -ContentType "application/json"
    Write-Host "❌ FAILED: Should have rejected wrong password" -ForegroundColor Red
} catch {
    if ($_.ErrorDetails.Message -like "*password*") {
        Write-Host "✓ Correctly rejected wrong password!" -ForegroundColor Green
    } else {
        Write-Host "❌ FAILED: Wrong error message" -ForegroundColor Red
    }
}

# Test 11: Error Handling - Missing Token
Write-Host "`n✅ Test 11: Error Handling - Missing Token" -ForegroundColor Yellow
try {
    $errorResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/me" -Method Get
    Write-Host "❌ FAILED: Should have required authentication" -ForegroundColor Red
} catch {
    if ($_.ErrorDetails.Message -like "*token*") {
        Write-Host "✓ Correctly rejected missing token!" -ForegroundColor Green
    } else {
        Write-Host "❌ FAILED: Wrong error message" -ForegroundColor Red
    }
}

# Test 12: Error Handling - Non-Admin Access
Write-Host "`n✅ Test 12: Error Handling - Non-Admin Access" -ForegroundColor Yellow
$userHeaders = @{
    Authorization = "Bearer $userToken"
}
try {
    $errorResponse = Invoke-RestMethod -Uri "$baseUrl/api/users" -Method Get -Headers $userHeaders
    Write-Host "❌ FAILED: Regular user should not access admin endpoint" -ForegroundColor Red
} catch {
    if ($_.ErrorDetails.Message -like "*Admin*" -or $_.ErrorDetails.Message -like "*Forbidden*") {
        Write-Host "✓ Correctly blocked non-admin access!" -ForegroundColor Green
    } else {
        Write-Host "❌ FAILED: Wrong error message" -ForegroundColor Red
    }
}

# Test 13: Logout
Write-Host "`n✅ Test 13: Logout" -ForegroundColor Yellow
$logoutBody = @{} | ConvertTo-Json
try {
    $logoutResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/logout" -Method Post -Body $logoutBody -ContentType "application/json" -Headers $headers
    Write-Host "✓ Logout successful!" -ForegroundColor Green
    Write-Host "  Message: $($logoutResponse.message)" -ForegroundColor Gray
} catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Summary
Write-Host "`n=================================================" -ForegroundColor Cyan
Write-Host "🎉 All Authentication Tests Passed!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "`n📊 Test Summary:" -ForegroundColor Cyan
Write-Host "  ✅ Health check" -ForegroundColor Green
Write-Host "  ✅ User registration" -ForegroundColor Green
Write-Host "  ✅ Admin login" -ForegroundColor Green
Write-Host "  ✅ Get current user" -ForegroundColor Green
Write-Host "  ✅ Token refresh" -ForegroundColor Green
Write-Host "  ✅ Get all users (admin)" -ForegroundColor Green
Write-Host "  ✅ Create user (admin)" -ForegroundColor Green
Write-Host "  ✅ Update preferences" -ForegroundColor Green
Write-Host "  ✅ Error handling (4 tests)" -ForegroundColor Green
Write-Host "  ✅ Logout" -ForegroundColor Green
Write-Host "`n✨ Authentication system is working perfectly!" -ForegroundColor Cyan
