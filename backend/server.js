// This is the backend server structure for HealthVault
// It connects to MongoDB Atlas and provides API endpoints
// for the frontend to interact with the database

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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
}, { timestamps: true });

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

// Doctor Schema
const doctorSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  specialty: String,
  license: String,
  profilePictureUrl: String,
}, { timestamps: true });

const Doctor = mongoose.model('Doctor', doctorSchema);

// API Routes
// Users
app.post('/api/patients', async (req, res) => {
  try {
    console.log('Creating patient with data:', req.body);
    
    // Generate QR code
    const qrCode = `HV_${Date.now().toString(36)}_${Math.random().toString(36).substr(2)}`;
    
    const patient = new User({
      ...req.body,
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
      records: records.map(record => ({
        id: record._id.toString(),
        patientId: record.patientId,
        fileName: record.fileName,
        fileType: record.fileType,
        fileUrl: record.fileUrl,
        category: record.category,
        uploadDate: record.uploadDate,
        summary: record.summary
      }))
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
        records: records.map(record => ({
          id: record._id.toString(),
          patientId: record.patientId,
          fileName: record.fileName,
          fileType: record.fileType,
          fileUrl: record.fileUrl,
          category: record.category,
          uploadDate: record.uploadDate,
          summary: record.summary
        }))
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
    // In a real implementation, you would upload the file to cloud storage
    // For this mock, we'll just save the filename
    const { category, summary, patientId } = req.body;
    
    const medicalRecord = new MedicalRecord({
      patientId,
      fileName: req.file.filename,
      fileType: req.file.mimetype,
      // In a real implementation, you would generate a cloud storage URL
      fileUrl: `/uploads/${req.file.filename}`,
      category,
      summary,
    });
    
    const savedRecord = await medicalRecord.save();

    // Associate the record with the patient
    await User.findByIdAndUpdate(patientId, { $push: { records: savedRecord._id } });

    res.status(201).json(savedRecord);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/medical-records', async (req, res) => {
  try {
    const { patientId } = req.query;
    const records = await MedicalRecord.find({ patientId });
    res.json(records);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Doctor endpoints
app.post('/api/doctors', async (req, res) => {
  try {
    console.log('Creating doctor with data:', req.body);
    
    const doctor = new Doctor(req.body);
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

// Serve static files
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});