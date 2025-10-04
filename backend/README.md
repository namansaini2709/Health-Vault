# HealthVault Backend - MongoDB Implementation

This is the backend server for the HealthVault application that connects to MongoDB Atlas.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root of the backend directory with your MongoDB Atlas connection string:
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string_here
   JWT_SECRET=your_jwt_secret_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   
   Or for production:
   ```bash
   npm start
   ```

## API Endpoints

### Patients
- `POST /api/patients` - Create a new patient
- `GET /api/patients/:id` - Get patient by ID
- `GET /api/patients` - Get all patients (with optional qrCode or email query params)

### Medical Records
- `POST /api/medical-records` - Upload a medical record (file upload)
- `GET /api/medical-records?patientId=<id>` - Get medical records for a patient

### Doctors
- `POST /api/doctors` - Create a new doctor
- `GET /api/doctors/:id` - Get doctor by ID
- `GET /api/doctors` - Get all doctors (with optional email query param)

## Database Schema

### User/Patient
- name: String
- email: String (unique)
- phone: String
- dateOfBirth: String
- emergencyContact: String
- qrCode: String (unique)
- createdAt: Date

### Medical Record
- patientId: String
- fileName: String
- fileType: String
- fileUrl: String
- category: String
- uploadDate: Date
- summary: String

### Doctor
- name: String
- email: String (unique)
- specialty: String
- license: String