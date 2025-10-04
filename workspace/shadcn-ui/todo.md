# HealthVault MVP - Development Plan

## Core Features to Implement

### 1. Digital Health Locker
- Patient dashboard to upload medical documents (PDFs/images)
- Document storage using localStorage for MVP
- Document categorization (prescriptions, lab results, scans, reports)
- File preview functionality

### 2. QR Code Access System
- Generate unique QR codes for each patient profile
- QR code scanner for healthcare providers
- Patient consent mechanism before sharing data
- Doctor/provider dashboard to view patient records

### 3. AI Record Summarizer
- Mock AI summarizer for medical documents
- Key insights extraction (conditions, medications, dates)
- Summary display in easy-to-read format

### 4. Multi-Platform Access
- Responsive web dashboard
- Patient and Doctor/Provider interfaces
- Mobile-optimized design

## Files to Create/Modify

1. **src/pages/Index.tsx** - Landing page with role selection
2. **src/pages/PatientDashboard.tsx** - Patient interface for uploading/managing records
3. **src/pages/DoctorDashboard.tsx** - Healthcare provider interface
4. **src/pages/QRScanner.tsx** - QR code scanning interface
5. **src/components/FileUpload.tsx** - Document upload component
6. **src/components/QRGenerator.tsx** - QR code generation component
7. **src/components/RecordSummary.tsx** - AI summary display component
8. **src/lib/healthVault.ts** - Core business logic and localStorage management
9. **src/lib/aiSummarizer.ts** - Mock AI summarization logic
10. **index.html** - Update title and metadata

## Implementation Strategy
- Use localStorage for data persistence (MVP)
- Mock AI summarization with predefined medical insights
- QR codes contain patient IDs for data lookup
- Simple consent mechanism with checkboxes
- Responsive design using Tailwind CSS and Shadcn components