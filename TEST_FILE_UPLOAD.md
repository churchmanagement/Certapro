# File Upload System - Testing Guide

## Overview

The file upload system supports:
- ✅ Single and multiple file uploads
- ✅ AWS S3 cloud storage
- ✅ Secure signed download URLs
- ✅ File type validation
- ✅ File size limits (10MB max per file)
- ✅ Project-based file organization
- ✅ Access control and permissions

---

## Supported File Types

### Documents
- PDF (`.pdf`)
- Microsoft Word (`.doc`, `.docx`)
- Microsoft Excel (`.xls`, `.xlsx`)

### Images
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- GIF (`.gif`)
- WebP (`.webp`)

### Compressed
- ZIP (`.zip`)
- RAR (`.rar`)

**Maximum File Size:** 10MB per file
**Maximum Files Per Upload:** 10 files

---

## Prerequisites

### AWS S3 Setup (Required for File Upload)

1. **Create AWS Account** - https://aws.amazon.com/

2. **Create S3 Bucket:**
   - Go to AWS S3 Console
   - Click "Create bucket"
   - Name: `cetraproapp-files` (or your choice)
   - Region: `us-east-1` (or your choice)
   - Block all public access: ✅ (recommended)
   - Enable versioning: ✅ (optional)

3. **Create IAM User with S3 Access:**
   - Go to IAM Console
   - Create new user: `cetraproapp-s3`
   - Attach policy: `AmazonS3FullAccess` (or custom policy)
   - Create access key
   - Save Access Key ID and Secret Access Key

4. **Add credentials to `.env`:**
   ```env
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=cetraproapp-files
   ```

5. **Restart backend server** to load new credentials

---

## Testing Without AWS S3

If you don't want to set up AWS S3 yet, the API will return a helpful error:

```json
{
  "status": "error",
  "message": "File upload is not available. AWS S3 is not configured."
}
```

This is expected and won't break the application.

---

## API Endpoints

### 1. Upload Single File

**Endpoint:** `POST /api/attachments/upload`

**Headers:**
- `Authorization: Bearer YOUR_ACCESS_TOKEN`
- `Content-Type: multipart/form-data`

**Body (form-data):**
- `file` - The file to upload (required)
- `projectId` - UUID of project (optional)

**Example with curl:**
```bash
curl -X POST http://localhost:3001/api/attachments/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/document.pdf"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "attachment": {
      "id": "uuid",
      "filename": "document.pdf",
      "fileType": "application/pdf",
      "fileSize": 123456,
      "uploadedAt": "2026-02-10T..."
    }
  }
}
```

---

### 2. Upload Multiple Files

**Endpoint:** `POST /api/attachments/upload-multiple`

**Headers:**
- `Authorization: Bearer YOUR_ACCESS_TOKEN`
- `Content-Type: multipart/form-data`

**Body (form-data):**
- `files` - Multiple files (max 10)
- `projectId` - UUID of project (optional)

**Example with curl:**
```bash
curl -X POST http://localhost:3001/api/attachments/upload-multiple \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@/path/to/file1.pdf" \
  -F "files=@/path/to/file2.docx" \
  -F "files=@/path/to/image.jpg"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "attachments": [
      {
        "id": "uuid1",
        "filename": "file1.pdf",
        "fileType": "application/pdf",
        "fileSize": 123456,
        "uploadedAt": "2026-02-10T..."
      },
      {
        "id": "uuid2",
        "filename": "file2.docx",
        "fileType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "fileSize": 234567,
        "uploadedAt": "2026-02-10T..."
      }
    ],
    "count": 2
  }
}
```

---

### 3. Get Download URL

**Endpoint:** `GET /api/attachments/:attachmentId/download`

**Headers:**
- `Authorization: Bearer YOUR_ACCESS_TOKEN`

**Query Parameters:**
- `expiresIn` - URL expiration in seconds (60-604800, default: 3600)

**Example:**
```bash
curl -X GET "http://localhost:3001/api/attachments/ATTACHMENT_ID/download?expiresIn=7200" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "downloadUrl": "https://cetraproapp-files.s3.amazonaws.com/...",
    "expiresIn": 7200,
    "filename": "document.pdf",
    "fileType": "application/pdf",
    "fileSize": 123456
  }
}
```

---

### 4. List Attachments

**Endpoint:** `GET /api/attachments`

**Headers:**
- `Authorization: Bearer YOUR_ACCESS_TOKEN`

**Query Parameters:**
- `projectId` - Filter by project UUID (optional)

**Example:**
```bash
curl -X GET "http://localhost:3001/api/attachments?projectId=PROJECT_UUID" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "attachments": [
      {
        "id": "uuid",
        "filename": "1234567890-uuid-document.pdf",
        "originalFilename": "document.pdf",
        "fileType": "application/pdf",
        "fileSize": 123456,
        "uploadedAt": "2026-02-10T...",
        "projectId": "project-uuid"
      }
    ],
    "count": 1
  }
}
```

---

### 5. Get Attachment Info

**Endpoint:** `GET /api/attachments/:attachmentId`

**Headers:**
- `Authorization: Bearer YOUR_ACCESS_TOKEN`

**Example:**
```bash
curl -X GET http://localhost:3001/api/attachments/ATTACHMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "attachment": {
      "id": "uuid",
      "filename": "1234567890-uuid-document.pdf",
      "originalFilename": "document.pdf",
      "fileType": "application/pdf",
      "fileSize": 123456,
      "uploadedAt": "2026-02-10T...",
      "projectId": "project-uuid",
      "project": {
        "id": "project-uuid",
        "title": "Project Title",
        "createdBy": {
          "id": "user-uuid",
          "name": "User Name",
          "email": "user@example.com"
        }
      }
    }
  }
}
```

---

### 6. Delete Attachment

**Endpoint:** `DELETE /api/attachments/:attachmentId`

**Headers:**
- `Authorization: Bearer YOUR_ACCESS_TOKEN`

**Example:**
```bash
curl -X DELETE http://localhost:3001/api/attachments/ATTACHMENT_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "status": "success",
  "message": "Attachment deleted successfully"
}
```

---

## Access Control

### Upload Permissions:
- ✅ Any authenticated user can upload files
- ✅ Only project creator can upload to specific projects
- ✅ Admins can upload to any project

### Download Permissions:
- ✅ Project creator
- ✅ Project assignee
- ✅ Users who accepted the project
- ✅ Admins

### Delete Permissions:
- ✅ Project creator
- ✅ Admins

---

## Testing with PowerShell

### Complete Test Flow:

```powershell
# 1. Login as admin
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" `
  -Method Post `
  -Body (@{email="admin@cetraproapp.com"; password="admin123"} | ConvertTo-Json) `
  -ContentType "application/json"

$token = $loginResponse.data.tokens.accessToken

# 2. Create a test file
"Test file content" | Out-File -FilePath "test.txt"

# 3. Upload single file
$headers = @{Authorization = "Bearer $token"}

# Note: PowerShell file upload
$form = @{
    file = Get-Item -Path "test.txt"
}

$uploadResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/attachments/upload" `
  -Method Post `
  -Headers $headers `
  -Form $form

Write-Host "Upload successful!"
Write-Host "Attachment ID: $($uploadResponse.data.attachment.id)"

$attachmentId = $uploadResponse.data.attachment.id

# 4. Get download URL
$downloadResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/attachments/$attachmentId/download" `
  -Method Get `
  -Headers $headers

Write-Host "Download URL: $($downloadResponse.data.downloadUrl)"

# 5. List attachments
$listResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/attachments" `
  -Method Get `
  -Headers $headers

Write-Host "Total attachments: $($listResponse.data.count)"

# 6. Delete attachment
$deleteResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/attachments/$attachmentId" `
  -Method Delete `
  -Headers $headers

Write-Host $deleteResponse.message

# Cleanup
Remove-Item "test.txt"
```

---

## Testing with HTML Form

Open `test-upload.html` in a browser and follow these steps:

1. Open browser to http://localhost:3001 (or use the HTML file directly)
2. Enter your access token (from login)
3. Click "Choose Files" and select file(s)
4. Click "Upload"
5. View results in the response area

---

## Error Handling

### File Type Not Allowed
```json
{
  "status": "error",
  "message": "Invalid file type: application/exe. Allowed types: .pdf, .doc, .docx, ..."
}
```

### File Too Large
```json
{
  "status": "error",
  "message": "File size exceeds maximum limit of 10MB"
}
```

### Too Many Files
```json
{
  "status": "error",
  "message": "Too many files uploaded"
}
```

### AWS S3 Not Configured
```json
{
  "status": "error",
  "message": "File upload is not available. AWS S3 is not configured."
}
```

### No File Uploaded
```json
{
  "status": "error",
  "message": "No file uploaded"
}
```

### Permission Denied
```json
{
  "status": "error",
  "message": "Only project creator can upload files"
}
```

---

## S3 Bucket Structure

Files are organized in S3 as follows:

```
cetraproapp-files/
├── projects/
│   ├── project-uuid-1/
│   │   ├── 1234567890-uuid-file1.pdf
│   │   └── 1234567891-uuid-file2.docx
│   └── project-uuid-2/
│       └── 1234567892-uuid-image.jpg
└── temp/
    └── 1234567893-uuid-temporary.pdf
```

- **Projects folder:** Files attached to specific projects
- **Temp folder:** Files uploaded without project association

---

## Security Features

1. ✅ **Authentication Required** - All endpoints require valid JWT token
2. ✅ **File Type Validation** - Only allowed types can be uploaded
3. ✅ **File Size Limits** - Maximum 10MB per file
4. ✅ **Access Control** - Permission checks on all operations
5. ✅ **Signed URLs** - Temporary download links (1 hour default)
6. ✅ **S3 Encryption** - Server-side encryption (AES256)
7. ✅ **Unique Filenames** - UUID-based naming prevents conflicts
8. ✅ **Sanitization** - Filename sanitization to prevent attacks

---

## Troubleshooting

### Problem: "AWS S3 is not configured"
**Solution:**
1. Set up AWS S3 bucket
2. Add credentials to `backend/.env`
3. Restart backend server

### Problem: "Invalid file type"
**Solution:**
Check that file type is in allowed list. See supported file types above.

### Problem: "File size exceeds maximum limit"
**Solution:**
Files must be under 10MB. Compress or reduce file size.

### Problem: "Permission denied"
**Solution:**
- Uploading to project: Must be project creator
- Downloading: Must have access to project
- Deleting: Must be project creator or admin

### Problem: Upload hangs or times out
**Solution:**
- Check internet connection to AWS
- Verify AWS credentials are correct
- Check S3 bucket permissions
- Review backend logs: `backend/logs/combined.log`

---

## Next Steps

1. ✅ Test file upload with curl or PowerShell
2. ✅ Verify files appear in S3 bucket
3. ✅ Test download URL generation
4. ✅ Test file deletion
5. ⏳ Integrate with project creation (coming next)
6. ⏳ Build frontend file upload component

---

## AWS S3 Custom Policy (Optional)

For tighter security, use this custom IAM policy instead of `AmazonS3FullAccess`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::cetraproapp-files/*",
        "arn:aws:s3:::cetraproapp-files"
      ]
    }
  ]
}
```

This grants only the minimum required permissions for the file upload system.
