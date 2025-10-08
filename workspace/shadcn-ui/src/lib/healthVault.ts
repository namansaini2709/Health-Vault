import apiClient from './apiService';

export interface AISummaryData {
  text: string;
  keyFindings?: string[];
  conditions?: string[];
  medications?: string[];
  recommendations?: string[];
  riskFactors?: string[];
  patientSummary?: string;
  doctorSummary?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  category: 'prescription' | 'lab-result' | 'scan' | 'report' | 'other';
  uploadDate: string;
  summary?: string;
  encryptionMetadata?: any; // For encrypted files
  aiSummary?: AISummaryData;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  emergencyContact: string;
  profilePictureUrl?: string;
  qrCode: string;
  records: MedicalRecord[];
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialty: string;
  license: string;
  profilePictureUrl?: string;
}

export class HealthVaultService {
  // Patient Management
  static async createPatient(patientData: Omit<Patient, 'id' | 'qrCode' | 'records' | 'createdAt'>): Promise<Patient> {
    try {
      console.log('Creating patient with data:', patientData);
      const response = await apiClient.post('/patients', patientData);
      console.log('Patient created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  }

  static async getPatient(id: string): Promise<Patient | null> {
    try {
      // Verify that we have a valid ID before making the request
      if (!id) {
        console.error('Invalid patient ID provided to getPatient');
        return null;
      }
      
      console.log('Making request to fetch patient with ID:', id);
      const response = await apiClient.get(`/patients/${id}`);
      console.log('Patient data received:', response.data);
      return response.data;
    } catch (error: unknown) {
      if (error.response?.status === 404) {
        console.log('Patient not found with ID:', id);
        return null;
      }
      console.error('Error fetching patient:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      throw error;
    }
  }

  static async updatePatient(id: string, patientData: Partial<Patient>): Promise<Patient> {
    try {
      const response = await apiClient.put(`/patients/${id}`, patientData);
      return response.data;
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }

  static async getAllPatients(): Promise<Patient[]> {
    try {
      const response = await apiClient.get('/patients');
      return response.data;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  }

  // Medical Records Management
  static async addMedicalRecord(
    patientId: string,
    file: File,
    category: 'prescription' | 'lab-result' | 'scan' | 'report' | 'other',
    summary?: string,
    encryptionKey?: string,
    encryptionMetadata?: any,
    pdfText?: string
  ): Promise<MedicalRecord> {
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      if (summary) {
        formData.append('summary', summary);
      }
      formData.append('patientId', patientId);

      // Add extracted PDF text if provided
      if (pdfText) {
        formData.append('pdfText', pdfText);
        console.log(`Adding extracted PDF text (${pdfText.length} chars) to form data`);
      }

      // Add encryption metadata if provided
      if (encryptionKey && encryptionMetadata) {
        console.log('Adding encryption metadata to form data:', { encryptionKey, encryptionMetadata });
        formData.append('encryptionKey', encryptionKey);
        formData.append('encryptionIV', JSON.stringify(encryptionMetadata.iv));
        formData.append('originalFileName', encryptionMetadata.originalName);
        formData.append('originalFileType', encryptionMetadata.originalType);

        // Debug: Log what's in FormData
        console.log('FormData entries:');
        for (const [key, value] of formData.entries()) {
          console.log(`  ${key}:`, value);
        }
      } else {
        console.warn('No encryption metadata provided!', { encryptionKey, encryptionMetadata });
      }

      // Make request to upload file and create record
      const response = await apiClient.post('/medical-records', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading medical record:', error);
      throw error;
    }
  }

  static async getMedicalRecords(patientId: string): Promise<MedicalRecord[]> {
    try {
      const response = await apiClient.get(`/medical-records?patientId=${patientId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching medical records:', error);
      throw error;
    }
  }

  // Doctor Management
  static async createDoctor(doctorData: Omit<Doctor, 'id'>): Promise<Doctor> {
    try {
      console.log('Creating doctor with data:', doctorData);
      const response = await apiClient.post('/doctors', doctorData);
      console.log('Doctor created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating doctor:', error);
      throw error;
    }
  }

  static async updateDoctor(id: string, doctorData: Partial<Doctor>): Promise<Doctor> {
    try {
      const response = await apiClient.put(`/doctors/${id}`, doctorData);
      return response.data;
    } catch (error) {
      console.error('Error updating doctor:', error);
      throw error;
    }
  }

  static async getAllDoctors(): Promise<Doctor[]> {
    try {
      const response = await apiClient.get('/doctors');
      return response.data;
    } catch (error) {
      console.error('Error fetching doctors:', error);
      throw error;
    }
  }

  static async getDoctorByEmail(email: string): Promise<Doctor | null> {
    try {
      const response = await apiClient.get(`/doctors?email=${encodeURIComponent(email)}`);
      const doctors = response.data;
      return doctors.length > 0 ? doctors[0] : null;
    } catch (error: unknown) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching doctor by email:', error);
      throw error;
    }
  }

  static async getDoctor(id: string): Promise<Doctor | null> {
    try {
      // Verify that we have a valid ID before making the request
      if (!id) {
        console.error('Invalid doctor ID provided to getDoctor');
        return null;
      }
      
      console.log('Making request to fetch doctor with ID:', id);
      const response = await apiClient.get(`/doctors/${id}`);
      console.log('Doctor data received:', response.data);
      return response.data;
    } catch (error: unknown) {
      if (error.response?.status === 404) {
        console.log('Doctor not found with ID:', id);
        return null;
      }
      console.error('Error fetching doctor:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      throw error;
    }
  }

  // Authentication & Session
  static setCurrentUser(user: Patient | Doctor, type: 'patient' | 'doctor'): void {
    localStorage.setItem('healthvault_user_id', user.id);
    localStorage.setItem('healthvault_user_type', type);
  }

  static async getCurrentUser(): Promise<{ user: Patient | Doctor; type: 'patient' | 'doctor' } | null> {
    const userId = localStorage.getItem('healthvault_user_id');
    const userType = localStorage.getItem('healthvault_user_type');
    
    if (userId && userType) {
      try {
        if (userType === 'patient') {
          const patient = await this.getPatient(userId);
          if (patient) {
            return { user: patient, type: 'patient' };
          }
        } else if (userType === 'doctor') {
          const doctor = await this.getDoctor(userId);
          if (doctor) {
            return { user: doctor, type: 'doctor' };
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        // Clear potentially invalid user data from localStorage
        localStorage.removeItem('healthvault_user_id');
        localStorage.removeItem('healthvault_user_type');
        return null;
      }
    }
    return null;
  }

  static logout(): void {
    localStorage.removeItem('healthvault_user_id');
    localStorage.removeItem('healthvault_user_type');
    localStorage.removeItem('healthvault_auth_token');
  }

  static async deleteMedicalRecord(recordId: string): Promise<void> {
    try {
      await apiClient.delete(`/medical-records/${recordId}`);
    } catch (error) {
      console.error('Error deleting medical record:', error);
      throw error;
    }
  }

  static async generatePatientSummaries(patientId: string, force: boolean = false): Promise<void> {
    try {
      console.log('Generating AI summaries for patient:', patientId, force ? '(force regenerate)' : '');
      const url = force ? `/summarize-patient/${patientId}?force=true` : `/summarize-patient/${patientId}`;
      await apiClient.post(url);
    } catch (error) {
      console.error('Error generating patient summaries:', error);
      throw error;
    }
  }

  static async getPatientByQRCode(qrCode: string): Promise<Patient | null> {
    try {
      console.log('Fetching patient by QR code:', qrCode);
      const response = await apiClient.get(`/patients?qrCode=${encodeURIComponent(qrCode)}`);
      console.log('Response received:', response);
      console.log('Response data:', response.data);

      // The backend returns a single patient object when querying by QR code
      // But we need to make sure it has the required properties
      const patientData = response.data;

      // Check if we got valid patient data
      if (patientData && patientData.id) {
        console.log('Valid patient found:', patientData);
        return patientData as Patient;
      }

      console.log('No valid patient data found in response');
      return null;
    } catch (error: unknown) {
      if (error.response?.status === 404) {
        console.log('Patient not found (404 error)');
        return null;
      }
      console.error('Error fetching patient by QR code:', error);
      throw error;
    }
  }

  // Utility Functions
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private static generateQRCode(patientId: string): string {
    return `HV_${patientId}_${Date.now().toString(36)}`;
  }
}