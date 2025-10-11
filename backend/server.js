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
const pdfParse = require('pdf-parse');
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
    patientSummary: String,
    doctorSummary: String,
    generatedAt: Date,
    model: String
  },
  // Encryption fields - stored in database for reliable access
  encryptionKey: String, // Hex string of the encryption key
  encryptionIV: [Number], // Initialization vector as array of numbers
  originalFileName: String, // Original filename before encryption
  originalFileType: String, // Original file type before encryption
  // Extracted PDF text (extracted client-side before encryption)
  pdfText: String // Extracted text content from PDF for AI analysis
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

// Access Request Schema for patient-doctor access control
const accessRequestSchema = new mongoose.Schema({
  doctorId: { type: String, required: true },
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  patientEmail: { type: String, required: true },
  patientQRCode: { type: String, required: true },
  doctorName: { type: String, required: true },
  doctorSpecialty: { type: String, required: true },
  requestedAt: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['pending', 'granted', 'denied', 'revoked'],
    default: 'pending'
  },
  respondedAt: Date,
  encryptionKeys: [{
    recordId: String,
    key: String,
    iv: [Number],
    originalFileName: String,
    originalFileType: String
  }],
  seenByDoctor: { type: Boolean, default: false }
}, { timestamps: true });

const AccessRequest = mongoose.model('AccessRequest', accessRequestSchema);

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

// Extract text from PDF
async function extractPDFText(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return data.text;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return null;
  }
}

// AI Summarization Service using Google Generative AI SDK
async function summarizeWithGemini(fileName, fileType, category, pdfText) {
  try {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.warn('Gemini API key not configured, using mock summarization');
      return getIntelligentMockSummary(fileName, category);
    }

    // Use Google Generative AI SDK with gemini-2.5-flash
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Only generate summary if we have actual PDF text content
    if (!pdfText) {
      console.warn('No PDF text provided, returning empty summary');
      return {
        text: `${category} document: ${fileName}`,
        keyFindings: [],
        medications: [],
        conditions: [],
        recommendations: [],
        riskFactors: [],
        patientSummary: 'This document was uploaded but text extraction was not available. Please consult with your healthcare provider to review the contents.',
        doctorSummary: 'Document uploaded without extracted text content. Manual review recommended to assess clinical significance and incorporate findings into patient care plan.',
        generatedAt: new Date(),
        model: 'no-content'
      };
    }

    console.log(`Using extracted PDF text (${pdfText.length} chars) for AI analysis`);

    const promptText = `You are an AI medical assistant analyzing a medical document.

-----------------------------
DOCUMENT METADATA
File Name: ${fileName}
Category: ${category}

DOCUMENT CONTENT:
${pdfText}
-----------------------------

TASK: Extract structured data AND create two distinct summaries.

## STEP 1: EXTRACT STRUCTURED DATA (from document only)
- keyFindings: Clinical findings, lab values, symptoms
- medications: Medication names mentioned
- conditions: Diagnoses or medical conditions stated
- recommendations: Follow-up or treatment recommendations
- riskFactors: Risk factors mentioned

## STEP 2: PATIENT SUMMARY (MAX 2-3 SHORT SENTENCES)
Write for someone with no medical background. DO NOT repeat the report text.
Focus ONLY on:
✓ Bottom line: What does this mean for the patient's health?
✓ What should they know or do next?
✓ Use simple analogies or everyday language

Example style: "Your heart is working well with no concerning issues found. The slight cholesterol elevation means you should focus on healthy eating. Follow up with your doctor in 3 months to recheck levels."

## STEP 3: DOCTOR SUMMARY (MAX 3-4 SENTENCES)
Write like a consulting physician. DO NOT just copy the report.
Focus ONLY on:
✓ Clinical significance of findings
✓ Risk stratification (if applicable)
✓ Differential considerations or patterns
✓ Evidence-based next steps

Example style: "Findings suggest early-stage metabolic syndrome with LDL 145 mg/dL and fasting glucose 118 mg/dL. ASCVD risk score approximately 7.5% over 10 years. Consider statins per ACC/AHA guidelines and lifestyle modification. Reassess lipid panel and HbA1c in 3 months."

---

OUTPUT FORMAT (valid JSON only):
{
  "text": "One sentence technical summary",
  "keyFindings": [],
  "medications": [],
  "conditions": [],
  "recommendations": [],
  "riskFactors": [],
  "patientSummary": "2-3 concise sentences in plain English",
  "doctorSummary": "3-4 concise clinical sentences with assessment & plan"
}

CRITICAL RULES:
- DO NOT copy or paraphrase report text
- Patient summary: Simple, actionable, reassuring or concerning as needed
- Doctor summary: Clinical interpretation, not description
- Be concise - quality over quantity`;

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

  // Lung / Respiratory / Pulmonary specific
  if (lowerFileName.includes('lung') || lowerFileName.includes('pulmonary') || lowerFileName.includes('respiratory') || lowerFileName.includes('copd') || lowerFileName.includes('asthma')) {
    return {
      text: `Pulmonary assessment report for ${fileName.split('-')[0] || 'patient'}. Detailed evaluation of lung function and respiratory health with imaging findings.`,
      keyFindings: [
        'Chest X-ray shows bilateral infiltrates',
        'Pulmonary function tests indicate reduced lung capacity',
        'Oxygen saturation levels monitored',
        'Chronic obstructive changes noted'
      ],
      medications: ['Bronchodilators (Albuterol)', 'Inhaled corticosteroids (Budesonide)', 'Oxygen therapy as needed'],
      conditions: ['Chronic Obstructive Pulmonary Disease (COPD)', 'Chronic Bronchitis', 'Reduced Lung Function'],
      recommendations: [
        'Use prescribed inhalers regularly',
        'Pulmonary rehabilitation program',
        'Avoid smoking and air pollutants',
        'Monitor oxygen levels at home',
        'Follow-up chest imaging in 3 months'
      ],
      riskFactors: ['Progressive lung function decline', 'Risk of respiratory infections', 'Potential for acute exacerbations', 'Reduced exercise tolerance'],
      patientSummary: 'Your lung tests show some breathing difficulties that need management with inhalers. Using your prescribed medications regularly and avoiding smoke will help you breathe better and prevent flare-ups. We will recheck your lungs in 3 months to track your progress.',
      doctorSummary: 'Patient presents with COPD and chronic bronchitis with bilateral infiltrates on chest imaging. PFTs show reduced lung capacity. Recommend combination bronchodilator and inhaled corticosteroid therapy, pulmonary rehabilitation, and smoking cessation if applicable. Monitor for acute exacerbations and consider oxygen supplementation if SpO2 <88%. Repeat imaging in 3 months to assess progression.',
      generatedAt: new Date(),
      model: 'intelligent-mock'
    };
  }

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
      patientSummary: 'Your heart examination shows you have high blood pressure and some irregular heartbeats that need medication management. Take your prescribed heart medications every day, check your blood pressure at home, and eat a low-salt diet. Regular exercise and follow-up appointments will help keep your heart healthy.',
      doctorSummary: 'Cardiac evaluation reveals hypertension and arrhythmia with possible CAD. ECG shows irregular rhythm. Recommend beta-blocker and ACE inhibitor therapy with aspirin for cardiovascular protection. Monitor BP response and consider Holter monitoring if palpitations persist. Assess for ischemia with stress testing if clinically indicated. Follow-up in 3-6 months with repeat ECG and lipid panel.',
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
      riskFactors: [],
      patientSummary: 'Your doctor has prescribed medications to help manage your diabetes and blood pressure. Take them as directed every day, and monitor your blood pressure at home to track how well the treatment is working.',
      doctorSummary: 'Patient prescribed standard first-line therapy for T2DM and hypertension. Monitor adherence, blood glucose levels, and BP response. Consider titration if targets not met in 3 months. Watch for side effects and medication interactions.'
    },
    'lab-result': {
      text: 'Laboratory test results showing biomarker measurements within reference ranges.',
      keyFindings: ['Normal glucose levels', 'Slightly elevated cholesterol'],
      medications: [],
      conditions: ['High Cholesterol'],
      recommendations: ['Follow-up in 3 months', 'Consider lifestyle modifications'],
      riskFactors: ['Cardiovascular risk'],
      patientSummary: 'Your blood tests show mostly normal results, but your cholesterol is a bit high. Focus on eating healthier foods with less saturated fat and getting regular exercise. We will recheck your levels in 3 months.',
      doctorSummary: 'Labs within normal limits except for borderline hyperlipidemia. LDL slightly elevated. Recommend therapeutic lifestyle changes including diet modification and increased physical activity. Consider statin therapy if lipid goals not achieved with lifestyle modifications in 3 months.'
    },
    'scan': {
      text: 'Medical imaging scan showing normal findings with no acute abnormalities detected.',
      keyFindings: ['No acute findings', 'Normal structure'],
      medications: [],
      conditions: [],
      recommendations: ['No immediate follow-up required'],
      riskFactors: [],
      patientSummary: 'Your scan looks normal with no problems found. This is good news and means there are no concerning issues at this time. No immediate follow-up is needed unless you develop new symptoms.',
      doctorSummary: 'Imaging study shows no acute abnormalities. Normal anatomical structures visualized. No masses, lesions, or acute pathology identified. Routine follow-up as clinically indicated. Consider surveillance imaging only if symptoms develop.'
    },
    'report': {
      text: 'Comprehensive medical report with clinical findings and assessment.',
      keyFindings: ['Clinical assessment completed'],
      medications: [],
      conditions: [],
      recommendations: ['Follow-up as scheduled'],
      riskFactors: [],
      patientSummary: 'Your medical assessment has been completed and reviewed by your healthcare team. Follow the recommendations given by your doctor and attend your scheduled follow-up appointments to monitor your progress.',
      doctorSummary: 'Comprehensive clinical evaluation completed with detailed findings documented. Continue current management plan and reassess at scheduled follow-up. Adjust treatment as needed based on patient response and clinical evolution.'
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

    const { category, summary, patientId, encryptionKey, encryptionIV, originalFileName, originalFileType, pdfText } = req.body;

    // Parse encryption metadata if provided (sent as JSON strings)
    const parsedIV = encryptionIV ? JSON.parse(encryptionIV) : null;

    // Log extracted PDF text
    if (pdfText) {
      console.log(`Received extracted PDF text (${pdfText.length} chars)`);
    }

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
      originalFileType: originalFileType || null,
      // Store extracted PDF text
      pdfText: pdfText || null
    });

    const savedRecord = await medicalRecord.save();

    // Associate the record with the patient
    await User.findByIdAndUpdate(patientId, { $push: { records: savedRecord._id } });

    // Automatically share encryption key with doctors who have granted access
    if (encryptionKey && parsedIV) {
      console.log('Sharing encryption key with doctors who have access...');
      console.log(`Looking for granted access requests for patient: ${patientId} (type: ${typeof patientId})`);

      // Find all granted access requests for this patient
      const grantedAccessRequests = await AccessRequest.find({
        patientId: patientId,
        status: 'granted'
      });

      console.log(`Found ${grantedAccessRequests.length} granted access request(s)`);

      // Add encryption key to each granted access request
      for (const request of grantedAccessRequests) {
        const keyData = {
          recordId: savedRecord._id.toString(),
          key: encryptionKey,
          iv: parsedIV,
          originalFileName: originalFileName || savedRecord.fileName,
          originalFileType: originalFileType || savedRecord.fileType
        };

        await AccessRequest.findByIdAndUpdate(
          request._id,
          { $push: { encryptionKeys: keyData } }
        );

        console.log(`Added encryption key for record ${savedRecord._id} to access request ${request._id}`);
      }
    }

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
    res.json(records.map(record => formatMedicalRecord(record, true))); // Include encryption metadata
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

    // Generate AI summary with file path
    console.log('Generating new AI summary with Gemini...');
    const filePath = path.join(__dirname, record.fileUrl);
    const aiSummary = await summarizeWithGemini(
      record.fileName,
      record.fileType,
      record.category,
      filePath
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
    const { force } = req.query; // Allow forcing regeneration
    console.log('Generating AI summaries for patient:', patientId, force ? '(force regenerate)' : '');

    const records = await MedicalRecord.find({ patientId });

    if (records.length === 0) {
      return res.status(404).json({ error: 'No records found for this patient' });
    }

    const summaries = [];
    for (const record of records) {
      // Force regenerate all summaries or only generate if missing
      if (force || !record.aiSummary || !record.aiSummary.text) {
        console.log(`Generating AI summary for ${record.fileName}...`);
        // Use stored PDF text (extracted client-side before encryption)
        const aiSummary = await summarizeWithGemini(
          record.fileName,
          record.fileType,
          record.category,
          record.pdfText // Use stored extracted text instead of file path
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

// Migration endpoint to share existing encryption keys with doctors who have access
app.post('/api/migrate-encryption-keys', async (req, res) => {
  try {
    console.log('Starting encryption key migration...');

    // Find all granted access requests
    const grantedAccessRequests = await AccessRequest.find({ status: 'granted' });
    console.log(`Found ${grantedAccessRequests.length} granted access requests`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const request of grantedAccessRequests) {
      // Get all medical records for this patient
      const records = await MedicalRecord.find({ patientId: request.patientId });
      console.log(`Processing ${records.length} records for patient ${request.patientId}`);

      for (const record of records) {
        // Check if this record has encryption data
        if (record.encryptionKey && record.encryptionIV) {
          // Check if this key is already in the access request
          const keyExists = request.encryptionKeys.some(
            k => k.recordId === record._id.toString()
          );

          if (!keyExists) {
            // Add the encryption key to the access request
            const keyData = {
              recordId: record._id.toString(),
              key: record.encryptionKey,
              iv: record.encryptionIV,
              originalFileName: record.originalFileName || record.fileName,
              originalFileType: record.originalFileType || record.fileType
            };

            await AccessRequest.findByIdAndUpdate(
              request._id,
              { $push: { encryptionKeys: keyData } }
            );

            migratedCount++;
            console.log(`Migrated key for record ${record._id} to access request ${request._id}`);
          } else {
            skippedCount++;
          }
        }
      }
    }

    console.log(`Migration complete: ${migratedCount} keys migrated, ${skippedCount} keys skipped (already exist)`);
    res.json({
      success: true,
      migratedCount,
      skippedCount,
      totalAccessRequests: grantedAccessRequests.length
    });
  } catch (error) {
    console.error('Error during encryption key migration:', error);
    res.status(500).json({ error: 'Migration failed', message: error.message });
  }
});

// ============================================
// ACCESS CONTROL ENDPOINTS
// ============================================

// Doctor sends access request to patient via QR code
app.post('/api/access-requests', async (req, res) => {
  try {
    const { doctorId, patientQRCode } = req.body;

    // Find patient by QR code
    const patient = await User.findOne({ qrCode: patientQRCode });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found with this QR code' });
    }

    // Find doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    // Check if request already exists
    const existingRequest = await AccessRequest.findOne({
      doctorId,
      patientId: patient._id.toString(),
      status: { $in: ['pending', 'granted'] }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Access request already exists' });
    }

    // Create new access request
    const accessRequest = new AccessRequest({
      doctorId,
      patientId: patient._id.toString(),
      patientName: patient.name,
      patientEmail: patient.email,
      patientQRCode: patient.qrCode,
      doctorName: doctor.name,
      doctorSpecialty: doctor.specialty,
      encryptionKeys: [],
      seenByDoctor: false
    });

    await accessRequest.save();
    res.status(201).json(accessRequest);
  } catch (error) {
    console.error('Error creating access request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get doctor's pending access requests
app.get('/api/access-requests/doctor/:doctorId/pending', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const requests = await AccessRequest.find({ doctorId, status: 'pending' }).sort({ requestedAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get doctor's granted patients
app.get('/api/access-requests/doctor/:doctorId/granted', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const requests = await AccessRequest.find({ doctorId, status: 'granted' }).sort({ respondedAt: -1 });

    // Add actual record count for each patient
    const requestsWithCount = await Promise.all(requests.map(async (request) => {
      const recordCount = await MedicalRecord.countDocuments({ patientId: request.patientId });
      return {
        ...request.toObject(),
        recordCount
      };
    }));

    res.json(requestsWithCount);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get doctor's request history (granted, denied, revoked)
app.get('/api/access-requests/doctor/:doctorId/history', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const requests = await AccessRequest.find({
      doctorId,
      status: { $in: ['granted', 'denied', 'revoked'] }
    }).sort({ respondedAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get unseen count for doctor
app.get('/api/access-requests/doctor/:doctorId/unseen-count', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const count = await AccessRequest.countDocuments({
      doctorId,
      status: { $in: ['granted', 'denied'] },
      seenByDoctor: false
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark request as seen by doctor
app.put('/api/access-requests/:requestId/mark-seen', async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await AccessRequest.findByIdAndUpdate(
      requestId,
      { seenByDoctor: true },
      { new: true }
    );
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }
    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient's pending access requests
app.get('/api/access-requests/patient/:patientId/pending', async (req, res) => {
  try {
    const { patientId } = req.params;
    const requests = await AccessRequest.find({ patientId, status: 'pending' }).sort({ requestedAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get patient's granted permissions
app.get('/api/access-requests/patient/:patientId/granted', async (req, res) => {
  try {
    const { patientId } = req.params;
    const requests = await AccessRequest.find({ patientId, status: 'granted' }).sort({ respondedAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Patient grants access to doctor
app.put('/api/access-requests/:requestId/grant', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { encryptionKeys } = req.body;

    const request = await AccessRequest.findByIdAndUpdate(
      requestId,
      {
        status: 'granted',
        respondedAt: new Date(),
        encryptionKeys: encryptionKeys || [],
        seenByDoctor: false
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Patient denies access request
app.put('/api/access-requests/:requestId/deny', async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await AccessRequest.findByIdAndUpdate(
      requestId,
      {
        status: 'denied',
        respondedAt: new Date(),
        seenByDoctor: false
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Patient revokes previously granted access
app.put('/api/access-requests/:requestId/revoke', async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await AccessRequest.findByIdAndUpdate(
      requestId,
      {
        status: 'revoked',
        respondedAt: new Date(),
        encryptionKeys: [], // Clear encryption keys when revoking
        seenByDoctor: false
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check if doctor has access to patient
app.get('/api/access-requests/check/:doctorId/:patientId', async (req, res) => {
  try {
    const { doctorId, patientId } = req.params;

    const request = await AccessRequest.findOne({
      doctorId,
      patientId,
      status: 'granted'
    });

    res.json({
      hasAccess: !!request,
      request: request || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get decryption key for a specific record
app.get('/api/access-requests/doctor/:doctorId/patient/:patientId/keys/:recordId', async (req, res) => {
  try {
    const { doctorId, patientId, recordId } = req.params;

    // Find granted access request
    const accessRequest = await AccessRequest.findOne({
      doctorId,
      patientId,
      status: 'granted'
    });

    if (!accessRequest) {
      return res.status(403).json({ error: 'Access not granted' });
    }

    // Find encryption key for this record
    const encryptionKey = accessRequest.encryptionKeys.find(
      k => k.recordId === recordId
    );

    if (!encryptionKey) {
      return res.status(404).json({ error: 'Encryption key not found' });
    }

    res.json(encryptionKey);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});