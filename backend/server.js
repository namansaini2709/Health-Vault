// This is the backend server structure for HealthVault
// It connects to MongoDB Atlas and provides API endpoints
// for the frontend to interact with the database

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// TODO: Add authentication middleware here

// Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthvault';
console.log('Attempting to connect to MongoDB with URI:', mongoURI ? 'URI provided' : 'Using default local URI');

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Successfully connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB:', err));

// User Schema
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  dateOfBirth: String,
  emergencyContact: String,
  profilePictureUrl: String,
  password: { type: String, required: true },
  qrCode: { type: String, unique: true },
  records: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord' }],
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Medical Record Schema
const medicalRecordSchema = new mongoose.Schema({
  patientId: String,
  fileName: String,
  fileType: String,
  fileUrl: String,
  category: String,
  uploadDate: { type: Date, default: Date.now },
  summary: String,
  aiSummary: {
    text: String,
    keyFindings: [String],
    medications: [String],
    conditions: [String],
    recommendations: [String],
    riskFactors: [String],
    generatedAt: Date,
    model: String
  },
  // Encryption fields - stored in database for reliable access
  encryptionKey: String, // Hex string of the encryption key
  encryptionIV: [Number], // Initialization vector as array of numbers
  originalFileName: String, // Original filename before encryption
  originalFileType: String // Original file type before encryption
}, { timestamps: true });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

// Doctor Schema
const doctorSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  specialty: String,
  license: String,
  profilePictureUrl: String,
  password: { type: String, required: true },
}, { timestamps: true });

const Doctor = mongoose.model('Doctor', doctorSchema);

// Helper function to format medical record with encryption metadata
// includeEncryptionMetadata: Set to true only for patient viewing their own records
function formatMedicalRecord(record, includeEncryptionMetadata = false) {
  const formatted = {
    id: record._id.toString(),
    patientId: record.patientId,
    fileName: record.fileName,
    fileType: record.fileType,
    fileUrl: record.fileUrl,
    category: record.category,
    uploadDate: record.uploadDate,
    summary: record.summary,
    aiSummary: record.aiSummary
  };

  // Only include encryption metadata if explicitly requested (patient viewing own records)
  if (includeEncryptionMetadata && record.encryptionKey) {
    formatted.encryptionMetadata = {
      encryptionKey: record.encryptionKey,
      iv: record.encryptionIV,
      originalName: record.originalFileName,
      originalType: record.originalFileType
    };
  }

  return formatted;
}

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// AI Summarization Service using Google Generative AI SDK
async function summarizeWithGemini(fileName, fileType, category) {
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.warn('Gemini API key not configured, using mock summarization');
      return getIntelligentMockSummary(fileName, category);
    }

    // Use Google Generative AI SDK with gemini-2.5-flash
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const promptText = `You are a medical AI assistant analyzing a medical document.

File Name: ${fileName}
File Type: ${fileType}
Category: ${category}

Based on the file name and category, please provide an intelligent analysis of what this medical record likely contains:

1. A brief summary (2-3 sentences) of what this type of medical document typically includes
2. Key findings that would be relevant for this category
3. Medications that might be mentioned (empty array if unlikely for this category)
4. Medical conditions that might be identified (empty array if not applicable)
5. Recommendations for follow-up based on this document type
6. Risk factors that might be relevant (empty array if not applicable)

Respond in this exact JSON format:
{
  "text": "summary text here",
  "keyFindings": ["finding1", "finding2"],
  "medications": ["med1", "med2"],
  "conditions": ["condition1"],
  "recommendations": ["recommendation1"],
  "riskFactors": ["risk1"]
}

IMPORTANT: Only return valid JSON, no additional text.`;

    const result = await model.generateContent(promptText);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response - handle markdown code blocks
    const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonText = jsonMatch[1] || jsonMatch[0];
      const summary = JSON.parse(jsonText);
      return {
        ...summary,
        generatedAt: new Date(),
        model: 'gemini-2.5-flash'
      };
    }

    // Fallback to mock if parsing fails
    console.warn('Failed to parse Gemini response, using mock');
    return getIntelligentMockSummary(fileName, category);
  } catch (error) {
    console.error('Error with Gemini AI:', error.message);
    return getIntelligentMockSummary(fileName, category);
  }
}

function getIntelligentMockSummary(fileName, category) {
  const lowerFileName = fileName.toLowerCase();

  // Cardiology specific
  if (lowerFileName.includes('cardio') || lowerFileName.includes('heart') || lowerFileName.includes('ecg') || lowerFileName.includes('ekg')) {
    return {
      text: `Cardiology evaluation report for ${fileName.split('-')[0] || 'patient'}. Clinical assessment shows cardiac examination with detailed findings on heart function and cardiovascular health.`,
      keyFindings: [
        'Comprehensive cardiac examination performed',
        'Heart rhythm and function assessed',
        'Blood pressure measurements recorded',
        'ECG findings documented'
      ],
      medications: ['Beta-blockers (e.g., Metoprolol)', 'ACE inhibitors (e.g., Lisinopril)', 'Aspirin as antiplatelet therapy'],
      conditions: ['Hypertension (High Blood Pressure)', 'Coronary Artery Disease (CAD)', 'Arrhythmia (Irregular Heartbeat)'],
      recommendations: [
        'Regular cardiac follow-up every 3-6 months',
        'Monitor blood pressure daily',
        'Maintain heart-healthy diet (low sodium, low fat)',
        'Exercise 30 minutes daily as tolerated',
        'Follow prescribed medication regimen strictly'
      ],
      riskFactors: ['Family history of heart disease', 'Hypertension', 'High cholesterol', 'Sedentary lifestyle'],
      generatedAt: new Date(),
      model: 'intelligent-mock'
    };
  }

  // Generic summaries by category
  const summaries = {
    'prescription': {
      text: 'Prescription medication record containing dosage instructions and prescribed medications.',
      keyFindings: ['Medication prescribed'],
      medications: ['Metformin 500mg', 'Lisinopril 10mg'],
      conditions: ['Type 2 Diabetes', 'Hypertension'],
      recommendations: ['Follow dosage instructions', 'Monitor blood pressure regularly'],
      riskFactors: []
    },
    'lab-result': {
      text: 'Laboratory test results showing biomarker measurements within reference ranges.',
      keyFindings: ['Normal glucose levels', 'Slightly elevated cholesterol'],
      medications: [],
      conditions: ['High Cholesterol'],
      recommendations: ['Follow-up in 3 months', 'Consider lifestyle modifications'],
      riskFactors: ['Cardiovascular risk']
    },
    'scan': {
      text: 'Medical imaging scan showing normal findings with no acute abnormalities detected.',
      keyFindings: ['No acute findings', 'Normal structure'],
      medications: [],
      conditions: [],
      recommendations: ['No immediate follow-up required'],
      riskFactors: []
    },
    'report': {
      text: 'Comprehensive medical report with clinical findings and assessment.',
      keyFindings: ['Clinical assessment completed'],
      medications: [],
      conditions: [],
      recommendations: ['Follow-up as scheduled'],
      riskFactors: []
    }
  };

  const defaultSummary = summaries[category] || summaries['report'];
  return {
    ...defaultSummary,
    generatedAt: new Date(),
    model: 'intelligent-mock'
  };
}

function getMockSummary(fileName, category) {
  return getIntelligentMockSummary(fileName, category);
}

// API Routes
// Users
app.post('/api/patients', async (req, res) => {
  try {
    console.log('Creating patient with data:', req.body);

    // Generate QR code
    const qrCode = `HV_${Date.now().toString(36)}_${Math.random().toString(36).substr(2)}`;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const patient = new User({
      ...req.body,
      password: hashedPassword,
      qrCode,
      createdAt: new Date(),
    });
    
    const savedPatient = await patient.save();
    console.log('Patient created successfully with ID:', savedPatient._id);
    
    // Format the patient object to match frontend expectations
    const formattedPatient = {
      id: savedPatient._id.toString(),
      name: savedPatient.name,
      email: savedPatient.email,
      phone: savedPatient.phone,
      dateOfBirth: savedPatient.dateOfBirth,
      emergencyContact: savedPatient.emergencyContact,
      profilePictureUrl: savedPatient.profilePictureUrl,
      qrCode: savedPatient.qrCode,
      createdAt: savedPatient.createdAt,
      records: []
    };
    
    console.log('Sending formatted patient data:', formattedPatient);
    res.status(201).json(formattedPatient);
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/patients/:id', async (req, res) => {
  try {
    console.log('Fetching patient with ID:', req.params.id);
    
    // Validate that we have an ID
    if (!req.params.id) {
      console.log('Patient ID is missing from request');
      return res.status(400).json({ error: 'Patient ID is required' });
    }
    
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid patient ID format:', req.params.id);
      return res.status(400).json({ error: 'Invalid patient ID format' });
    }
    
    const patient = await User.findById(req.params.id);
    if (!patient) {
      console.log('Patient not found with ID:', req.params.id);
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    console.log('Found patient:', patient.name);
    // Fetch associated medical records
    const records = await MedicalRecord.find({ patientId: patient._id });

    // Format the patient object to match frontend expectations
    // Include encryption metadata since patient is viewing their own records
    const formattedPatient = {
      id: patient._id.toString(),
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      emergencyContact: patient.emergencyContact,
      profilePictureUrl: patient.profilePictureUrl,
      qrCode: patient.qrCode,
      createdAt: patient.createdAt,
      records: records.map(record => formatMedicalRecord(record, true)) // true = include encryption metadata
    };
    
    console.log('Sending formatted patient data:', formattedPatient);
    res.json(formattedPatient);
  } catch (error) {
    console.error('Error fetching patient:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

app.get('/api/patients', async (req, res) => {
  try {
    const { qrCode, email } = req.query;
    
    if (qrCode) {
      const patient = await User.findOne({ qrCode });
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      // Fetch associated medical records
      const records = await MedicalRecord.find({ patientId: patient._id });
      
      // Format the patient object to match frontend expectations
      const formattedPatient = {
        id: patient._id.toString(),
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        emergencyContact: patient.emergencyContact,
        qrCode: patient.qrCode,
        createdAt: patient.createdAt,
        records: records.map(formatMedicalRecord)
      };
      
      console.log('Sending formatted patient data for QR code:', formattedPatient);
      return res.json(formattedPatient);
    } else if (email) {
      const patient = await User.findOne({ email });
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }
      
      // Format the patient object to match frontend expectations
      const formattedPatient = {
        id: patient._id.toString(),
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        emergencyContact: patient.emergencyContact,
        qrCode: patient.qrCode,
        createdAt: patient.createdAt,
        records: []
      };
      
      return res.json([formattedPatient]);
    } else {
      const patients = await User.find();
      
      // Format all patients to match frontend expectations
      const formattedPatients = patients.map(patient => ({
        id: patient._id.toString(),
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        emergencyContact: patient.emergencyContact,
        qrCode: patient.qrCode,
        createdAt: patient.createdAt,
        records: []
      }));
      
      res.json(formattedPatients);
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/patients/:id', async (req, res) => {
  try {
    const patient = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const formattedPatient = {
      id: patient._id.toString(),
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      emergencyContact: patient.emergencyContact,
      profilePictureUrl: patient.profilePictureUrl,
      qrCode: patient.qrCode,
      createdAt: patient.createdAt,
      records: patient.records
    };

    res.json(formattedPatient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Medical Records
app.post('/api/upload-profile-picture', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});

app.post('/api/medical-records', upload.single('file'), async (req, res) => {
  try {
    console.log('--- File Upload Request ---');
    console.log('Request Body:', req.body);
    console.log('File Object:', req.file);

    const { category, summary, patientId, encryptionKey, encryptionIV, originalFileName, originalFileType } = req.body;

    // Parse encryption metadata if provided (sent as JSON strings)
    const parsedIV = encryptionIV ? JSON.parse(encryptionIV) : null;

    const medicalRecord = new MedicalRecord({
      patientId,
      fileName: req.file.filename,
      fileType: req.file.mimetype,
      fileUrl: `/uploads/${req.file.filename}`,
      category,
      summary,
      // Store encryption metadata in database
      encryptionKey: encryptionKey || null,
      encryptionIV: parsedIV,
      originalFileName: originalFileName || null,
      originalFileType: originalFileType || null
    });

    const savedRecord = await medicalRecord.save();

    // Associate the record with the patient
    await User.findByIdAndUpdate(patientId, { $push: { records: savedRecord._id } });

    // Convert MongoDB _id to id and include encryption metadata for frontend
    const recordResponse = {
      id: savedRecord._id.toString(),
      patientId: savedRecord.patientId,
      fileName: savedRecord.fileName,
      fileType: savedRecord.fileType,
      fileUrl: savedRecord.fileUrl,
      category: savedRecord.category,
      summary: savedRecord.summary,
      uploadDate: savedRecord.uploadDate,
      createdAt: savedRecord.createdAt,
      updatedAt: savedRecord.updatedAt,
      // Include encryption metadata in response
      encryptionMetadata: savedRecord.encryptionKey ? {
        encryptionKey: savedRecord.encryptionKey,
        iv: savedRecord.encryptionIV,
        originalName: savedRecord.originalFileName,
        originalType: savedRecord.originalFileType
      } : null
    };

    console.log('Sending record response:', recordResponse);
    res.status(201).json(recordResponse);
  } catch (error) {
    console.error('--- File Upload Error ---');
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/medical-records', async (req, res) => {
  try {
    const { patientId } = req.query;
    const records = await MedicalRecord.find({ patientId });
    res.json(records.map(formatMedicalRecord));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/medical-records/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    console.log('Deleting medical record:', recordId);

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      return res.status(400).json({ error: 'Invalid record ID format' });
    }

    // Find and delete the record
    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ error: 'Medical record not found' });
    }

    // Delete the file from uploads directory
    const filePath = path.join(__dirname, record.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('File deleted:', filePath);
    }

    // Remove record reference from patient
    await User.findByIdAndUpdate(record.patientId, { $pull: { records: recordId } });

    // Delete the record from database
    await MedicalRecord.findByIdAndDelete(recordId);

    console.log('Medical record deleted successfully');
    res.json({ message: 'Record deleted successfully', recordId });
  } catch (error) {
    console.error('Error deleting medical record:', error);
    res.status(500).json({ error: 'Failed to delete record', message: error.message });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    let userType = 'patient';

    if (!user) {
      user = await Doctor.findOne({ email });
      userType = 'doctor';
    }

    if (!user || !user.password) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        type: userType,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'mysecrettoken',
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;

        const formattedUser = {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          dateOfBirth: user.dateOfBirth,
          emergencyContact: user.emergencyContact,
          profilePictureUrl: user.profilePictureUrl,
          qrCode: user.qrCode,
          createdAt: user.createdAt,
          records: user.records,
          specialty: user.specialty,
          license: user.license,
        };

        res.json({ token, user: formattedUser, userType });
      }
    );
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server error');
  }
});

// Doctor endpoints
app.post('/api/doctors', async (req, res) => {
  try {
    console.log('Creating doctor with data:', req.body);

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    const doctor = new Doctor({ ...req.body, password: hashedPassword });
    const savedDoctor = await doctor.save();
    
    console.log('Doctor created successfully with ID:', savedDoctor._id);
    
    // Format the doctor object to match frontend expectations
    const formattedDoctor = {
      id: savedDoctor._id.toString(),
      name: savedDoctor.name,
      email: savedDoctor.email,
      specialty: savedDoctor.specialty,
      license: savedDoctor.license,
      profilePictureUrl: savedDoctor.profilePictureUrl
    };
    
    console.log('Sending formatted doctor data:', formattedDoctor);
    res.status(201).json(formattedDoctor);
  } catch (error) {
    console.error('Error creating doctor:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/doctors/:id', async (req, res) => {
  try {
    console.log('Fetching doctor with ID:', req.params.id);
    
    // Validate that we have an ID
    if (!req.params.id) {
      console.log('Doctor ID is missing from request');
      return res.status(400).json({ error: 'Doctor ID is required' });
    }
    
    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('Invalid doctor ID format:', req.params.id);
      return res.status(400).json({ error: 'Invalid doctor ID format' });
    }
    
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      console.log('Doctor not found with ID:', req.params.id);
      return res.status(404).json({ error: 'Doctor not found' });
    }
    
    console.log('Found doctor:', doctor.name);
    
    // Format the doctor object to match frontend expectations
    const formattedDoctor = {
      id: doctor._id.toString(),
      name: doctor.name,
      email: doctor.email,
      specialty: doctor.specialty,
      license: doctor.license,
      profilePictureUrl: doctor.profilePictureUrl,
      profilePictureUrl: doctor.profilePictureUrl
    };
    
    console.log('Sending formatted doctor data:', formattedDoctor);
    res.json(formattedDoctor);
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

app.get('/api/doctors', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (email) {
      const doctor = await Doctor.findOne({ email });
      if (!doctor) {
        return res.status(404).json([]);
      }
      
      // Format the doctor object to match frontend expectations
      const formattedDoctor = {
        id: doctor._id.toString(),
        name: doctor.name,
        email: doctor.email,
        specialty: doctor.specialty,
        license: doctor.license
      };
      
      return res.json([formattedDoctor]);
    } else {
      const doctors = await Doctor.find();
      
      // Format all doctors to match frontend expectations
      const formattedDoctors = doctors.map(doctor => ({
        id: doctor._id.toString(),
        name: doctor.name,
        email: doctor.email,
        specialty: doctor.specialty,
        license: doctor.license,
        profilePictureUrl: doctor.profilePictureUrl
      }));
      
      res.json(formattedDoctors);
    }
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/doctors/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }
    const formattedDoctor = {
      id: doctor._id.toString(),
      name: doctor.name,
      email: doctor.email,
      specialty: doctor.specialty,
      license: doctor.license,
      profilePictureUrl: doctor.profilePictureUrl
    };
    res.json(formattedDoctor);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// AI Summarization endpoint
app.post('/api/summarize-record/:recordId', async (req, res) => {
  try {
    const { recordId } = req.params;
    const { force } = req.query; // Allow forcing regeneration
    console.log('Generating AI summary for record:', recordId, force ? '(force regenerate)' : '');

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      return res.status(400).json({ error: 'Invalid record ID format' });
    }

    // Find the medical record
    const record = await MedicalRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ error: 'Medical record not found' });
    }

    // Check if summary already exists (unless force regenerate is requested)
    if (record.aiSummary && record.aiSummary.text && !force) {
      console.log('Using existing AI summary');
      return res.json({
        id: record._id.toString(),
        aiSummary: record.aiSummary,
        cached: true
      });
    }

    // Generate AI summary
    console.log('Generating new AI summary with Gemini...');
    const aiSummary = await summarizeWithGemini(
      record.fileName,
      record.fileType,
      record.category
    );

    // Update the record with AI summary
    record.aiSummary = aiSummary;
    await record.save();

    console.log('AI summary generated successfully');
    res.json({
      id: record._id.toString(),
      aiSummary: aiSummary,
      cached: false
    });
  } catch (error) {
    console.error('Error generating AI summary:', error);
    res.status(500).json({ error: 'Failed to generate AI summary', message: error.message });
  }
});

// Batch summarize all records for a patient
app.post('/api/summarize-patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    console.log('Generating AI summaries for patient:', patientId);

    const records = await MedicalRecord.find({ patientId });

    if (records.length === 0) {
      return res.status(404).json({ error: 'No records found for this patient' });
    }

    const summaries = [];
    for (const record of records) {
      if (!record.aiSummary || !record.aiSummary.text) {
        const aiSummary = await summarizeWithGemini(
          record.fileName,
          record.fileType,
          record.category
        );
        record.aiSummary = aiSummary;
        await record.save();
        summaries.push({
          recordId: record._id.toString(),
          aiSummary,
          cached: false
        });
      } else {
        summaries.push({
          recordId: record._id.toString(),
          aiSummary: record.aiSummary,
          cached: true
        });
      }
    }

    res.json({
      patientId,
      totalRecords: records.length,
      summaries
    });
  } catch (error) {
    console.error('Error generating batch AI summaries:', error);
    res.status(500).json({ error: 'Failed to generate AI summaries', message: error.message });
  }
});

// Serve static files
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});