# Project API Testing Script
# PowerShell script to test all project endpoints

$baseUrl = "http://localhost:3001"
$adminEmail = "admin@cetraproapp.com"
$adminPassword = "admin123"
$user1Email = "user1@cetraproapp.com"
$user1Password = "user123"
$user2Email = "user2@cetraproapp.com"
$user2Password = "user123"

Write-Host "=== CetaProjectsManager - Project API Testing ===" -ForegroundColor Cyan
Write-Host ""

# Function to make API calls
function Invoke-API {
    param($Method, $Endpoint, $Body, $Token)

    $headers = @{
        "Content-Type" = "application/json"
    }

    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }

    $params = @{
        Method = $Method
        Uri = "$baseUrl$Endpoint"
        Headers = $headers
    }

    if ($Body) {
        $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
    }

    try {
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        Write-Host "Error: $_" -ForegroundColor Red
        return $null
    }
}

# 1. Login as Admin
Write-Host "1. Logging in as Admin..." -ForegroundColor Yellow
$adminLogin = Invoke-API -Method POST -Endpoint "/api/auth/login" -Body @{
    email = $adminEmail
    password = $adminPassword
}

if (!$adminLogin) {
    Write-Host "Failed to login as admin. Exiting." -ForegroundColor Red
    exit 1
}

$adminToken = $adminLogin.data.tokens.accessToken
Write-Host "✓ Admin logged in" -ForegroundColor Green
Write-Host ""

# 2. Create a Project
Write-Host "2. Creating a new project..." -ForegroundColor Yellow
$newProject = Invoke-API -Method POST -Endpoint "/api/projects" -Token $adminToken -Body @{
    title = "Test Project - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    description = "This is a test project created via PowerShell script for testing the project API"
    proposedAmount = 50000
    requiredApprovals = 2
}

if (!$newProject) {
    Write-Host "Failed to create project. Exiting." -ForegroundColor Red
    exit 1
}

$projectId = $newProject.data.project.id
Write-Host "✓ Project created with ID: $projectId" -ForegroundColor Green
Write-Host "  Status: $($newProject.data.project.status)" -ForegroundColor Gray
Write-Host ""

# 3. Get Project Details
Write-Host "3. Fetching project details..." -ForegroundColor Yellow
$projectDetails = Invoke-API -Method GET -Endpoint "/api/projects/$projectId" -Token $adminToken
if ($projectDetails) {
    Write-Host "✓ Project: $($projectDetails.data.project.title)" -ForegroundColor Green
    Write-Host "  Current Approvals: $($projectDetails.data.project.currentApprovals)/$($projectDetails.data.project.requiredApprovals)" -ForegroundColor Gray
}
Write-Host ""

# 4. Login as User1
Write-Host "4. Logging in as User1..." -ForegroundColor Yellow
$user1Login = Invoke-API -Method POST -Endpoint "/api/auth/login" -Body @{
    email = $user1Email
    password = $user1Password
}

if (!$user1Login) {
    Write-Host "Failed to login as user1. Exiting." -ForegroundColor Red
    exit 1
}

$user1Token = $user1Login.data.tokens.accessToken
$user1Id = $user1Login.data.user.id
Write-Host "✓ User1 logged in" -ForegroundColor Green
Write-Host ""

# 5. User1 Views Pending Projects
Write-Host "5. User1 checking pending projects..." -ForegroundColor Yellow
$pendingProjects = Invoke-API -Method GET -Endpoint "/api/projects/pending/me" -Token $user1Token
if ($pendingProjects) {
    Write-Host "✓ Found $($pendingProjects.data.count) pending projects" -ForegroundColor Green
}
Write-Host ""

# 6. User1 Accepts Project
Write-Host "6. User1 accepting project..." -ForegroundColor Yellow
$acceptance1 = Invoke-API -Method POST -Endpoint "/api/projects/$projectId/accept" -Token $user1Token -Body @{
    notes = "I am interested and available to work on this project"
}

if ($acceptance1) {
    Write-Host "✓ User1 accepted project" -ForegroundColor Green
}
Write-Host ""

# 7. Login as User2
Write-Host "7. Logging in as User2..." -ForegroundColor Yellow
$user2Login = Invoke-API -Method POST -Endpoint "/api/auth/login" -Body @{
    email = $user2Email
    password = $user2Password
}

if (!$user2Login) {
    Write-Host "Failed to login as user2. Exiting." -ForegroundColor Red
    exit 1
}

$user2Token = $user2Login.data.tokens.accessToken
Write-Host "✓ User2 logged in" -ForegroundColor Green
Write-Host ""

# 8. User2 Accepts Project
Write-Host "8. User2 accepting project..." -ForegroundColor Yellow
$acceptance2 = Invoke-API -Method POST -Endpoint "/api/projects/$projectId/accept" -Token $user2Token -Body @{
    notes = "I have experience with similar projects"
}

if ($acceptance2) {
    Write-Host "✓ User2 accepted project" -ForegroundColor Green
}
Write-Host ""

# 9. Check Project Status (should be APPROVED now)
Write-Host "9. Checking project status..." -ForegroundColor Yellow
$projectAfterAcceptances = Invoke-API -Method GET -Endpoint "/api/projects/$projectId" -Token $adminToken
if ($projectAfterAcceptances) {
    Write-Host "✓ Project Status: $($projectAfterAcceptances.data.project.status)" -ForegroundColor Green
    Write-Host "  Current Approvals: $($projectAfterAcceptances.data.project.currentApprovals)/$($projectAfterAcceptances.data.project.requiredApprovals)" -ForegroundColor Gray
}
Write-Host ""

# 10. Get Acceptances
Write-Host "10. Fetching project acceptances..." -ForegroundColor Yellow
$acceptances = Invoke-API -Method GET -Endpoint "/api/projects/$projectId/acceptances" -Token $adminToken
if ($acceptances) {
    Write-Host "✓ Found $($acceptances.data.count) acceptances:" -ForegroundColor Green
    foreach ($acc in $acceptances.data.acceptances) {
        Write-Host "  - $($acc.user.name) ($($acc.user.email))" -ForegroundColor Gray
    }
}
Write-Host ""

# 11. Admin Assigns Project to User1
Write-Host "11. Admin assigning project to User1..." -ForegroundColor Yellow
$assignment = Invoke-API -Method POST -Endpoint "/api/projects/$projectId/assign" -Token $adminToken -Body @{
    assignedToId = $user1Id
}

if ($assignment) {
    Write-Host "✓ Project assigned to: $($assignment.data.project.assignedTo.name)" -ForegroundColor Green
    Write-Host "  Status: $($assignment.data.project.status)" -ForegroundColor Gray
}
Write-Host ""

# 12. User1 Checks Assigned Projects
Write-Host "12. User1 checking assigned projects..." -ForegroundColor Yellow
$assignedProjects = Invoke-API -Method GET -Endpoint "/api/projects/assigned/me" -Token $user1Token
if ($assignedProjects) {
    Write-Host "✓ User1 has $($assignedProjects.data.count) assigned projects" -ForegroundColor Green
}
Write-Host ""

# 13. Get Project Statistics
Write-Host "13. Fetching project statistics..." -ForegroundColor Yellow
$stats = Invoke-API -Method GET -Endpoint "/api/projects/stats" -Token $adminToken
if ($stats) {
    Write-Host "✓ Project Statistics:" -ForegroundColor Green
    Write-Host "  Total: $($stats.data.stats.total)" -ForegroundColor Gray
    Write-Host "  Pending: $($stats.data.stats.byStatus.pending)" -ForegroundColor Gray
    Write-Host "  Approved: $($stats.data.stats.byStatus.approved)" -ForegroundColor Gray
    Write-Host "  Assigned: $($stats.data.stats.byStatus.assigned)" -ForegroundColor Gray
    Write-Host "  Deleted: $($stats.data.stats.byStatus.deleted)" -ForegroundColor Gray
}
Write-Host ""

# 14. Update Project
Write-Host "14. Updating project..." -ForegroundColor Yellow
$updated = Invoke-API -Method PUT -Endpoint "/api/projects/$projectId" -Token $adminToken -Body @{
    proposedAmount = 55000
}

if ($updated) {
    Write-Host "✓ Project updated. New amount: $($updated.data.project.proposedAmount)" -ForegroundColor Green
}
Write-Host ""

# 15. Get All Projects
Write-Host "15. Fetching all projects..." -ForegroundColor Yellow
$allProjects = Invoke-API -Method GET -Endpoint "/api/projects" -Token $adminToken
if ($allProjects) {
    Write-Host "✓ Found $($allProjects.data.count) total projects" -ForegroundColor Green
}
Write-Host ""

Write-Host "=== All Tests Completed ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Test Project ID: $projectId" -ForegroundColor Yellow
Write-Host "You can now test additional endpoints or clean up the test data." -ForegroundColor Gray
