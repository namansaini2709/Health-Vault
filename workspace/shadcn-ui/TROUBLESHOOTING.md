# HealthVault File Upload Troubleshooting Guide

## Common Upload Issues and Solutions

### 1. File Upload Not Working
**Symptoms**: Clicking upload does nothing or shows an error

**Solutions**:
1. Verify your Supabase configuration in `.env`:
   - `VITE_SUPABASE_URL` should be your project URL
   - `VITE_SUPABASE_ANON_KEY` should be your anon key
2. Make sure the Supabase storage bucket "medical-records" exists
3. Check that the "medical_records" table exists in your database with the correct schema
4. Ensure your Supabase authentication rules allow uploads

### 2. CORS Issues
**Symptoms**: Network errors when uploading files

**Solutions**:
1. Check your Supabase project settings:
   - Go to your Supabase dashboard
   - Navigate to Settings > API
   - Ensure your domain is added to the "URLs allowed to access your database" list
   - For local development, add `http://localhost:5173` (or your dev server port)

### 3. Authentication Issues
**Symptoms**: 401/403 errors when trying to upload

**Solutions**:
1. Regenerate your Supabase anon key:
   - Go to your Supabase dashboard
   - Navigate to Project Settings > API
   - Copy the new anon key and update your `.env` file
2. Make sure your `.env` file is properly named and not ignored by git

### 4. File Size Limits
**Symptoms**: Large files fail to upload

**Solutions**:
- The current implementation supports files up to 10MB
- To increase the limit, modify the check in `FileUpload.tsx` and update your Supabase storage settings

### 5. Invalid File Types
**Symptoms**: File type errors during upload

**Supported file types**:
- PDF (application/pdf)
- JPEG (image/jpeg)
- JPG (image/jpg)
- PNG (image/png)
- GIF (image/gif)
- WebP (image/webp)

## How to Check Your Setup

### 1. Validate Environment Variables
Make sure your `.env` file contains:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Check Supabase Database Structure
Make sure your database has the required tables:
- `patients` table with columns: id, name, email, phone, date_of_birth, emergency_contact, qr_code, created_at
- `medical_records` table with columns: id, patient_id, file_name, file_type, file_url, category, upload_date, summary

### 3. Check Supabase Storage
Make sure your Supabase project has a storage bucket named `medical-records` with appropriate permissions.

## Debugging Steps

1. Open browser developer tools (F12)
2. Go to the Console tab
3. Try to upload a file
4. Look for error messages in the console
5. Check the Network tab for failed requests to Supabase

## Testing Upload Functionality

You can test the upload functionality by running:

```bash
cd /workspace/shadcn-ui
npm run dev
```

Then open your browser and navigate to the Patient Dashboard to test file uploads.

## Common Error Messages and Solutions

- `NetworkError when attempting to fetch resource`: Check your Supabase URL and internet connection
- `403 Forbidden`: Verify your Supabase anon key and permissions
- `File size too large`: The file exceeds 10MB limit
- `Invalid file type`: The file format is not supported
- `Storage upload error`: Check that the storage bucket exists and has proper permissions
- `Bucket not found` or `Storage bucket "medical-records" does not exist`: You need to create the storage bucket in your Supabase dashboard (see below)

## Specific Fix for "Bucket not found" Error

If you're getting a "bucket not found" or "Storage bucket 'medical-records' does not exist" error, you need to create the storage bucket in your Supabase project:

1. Go to your [Supabase dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to the "Storage" section in the sidebar
4. Click "New bucket"
5. Enter "medical-records" as the bucket name
6. Set the bucket to "Public" (for this demo app) or configure RLS policies as needed
7. Click "Create bucket"

After creating the bucket, try uploading a file again.

## Specific Fix for "Row-level security policy violation" Error

If you're getting an "new row violates row-level security policy" or "Row-level security policy violation" error, you need to configure the RLS policies for your database tables:

1. Go to your [Supabase dashboard](https://app.supabase.com/)
2. Select your project
3. Navigate to the "Database" section in the sidebar
4. Click on the "Tables" tab
5. Find the "medical_records" table
6. Click on the table name to view its structure
7. Go to the "Permissions" tab
8. If RLS is enabled, you need to ensure your policies allow authenticated users to insert records

For basic functionality, you can create a policy like this:
- Policy Name: "Allow authenticated users to insert their own records"
- Type: "INSERT"
- Using: `auth.uid() IS NOT NULL` (or similar)
- With Check: `auth.uid() IS NOT NULL AND patient_id = (SELECT id FROM patients WHERE user_id = auth.uid())` (adapt as needed)

Alternatively, for development purposes, you can temporarily disable RLS:
1. In the same table view, go to the "RLS" tab
2. Toggle off "Enable Row Level Security" (not recommended for production)

Remember to adjust these policies according to your application's security requirements.

## Need More Help?

If you're still experiencing issues after following this guide:

1. Check the browser console for specific error messages
2. Review your Supabase project configuration
3. Ensure all environment variables are properly set
4. Confirm the "medical-records" storage bucket exists
5. Check that RLS policies are properly configured for the "medical_records" table
6. Contact support with the specific error message from the console