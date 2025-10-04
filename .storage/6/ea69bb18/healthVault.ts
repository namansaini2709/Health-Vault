export interface MedicalRecord {
  id: string;
  patientId: string;
  fileName: string;
  fileType: string;
  fileData: string; // base64 encoded
  category: 'prescription' | 'lab-result' | 'scan' | 'report' | 'other';
  uploadDate: string;
  summary?: string;
}

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  emergencyContact: string;
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
}

const STORAGE_KEYS = {
  PATIENTS: 'healthvault_patients',
  DOCTORS: 'healthvault_doctors',
  CURRENT_USER: 'healthvault_current_user',
  USER_TYPE: 'healthvault_user_type'
};

export class HealthVaultService {
  // Patient Management
  static createPatient(patientData: Omit<Patient, 'id' | 'qrCode' | 'records' | 'createdAt'>): Patient {
    const id = this.generateId();
    const patient: Patient = {
      ...patientData,
      id,
      qrCode: this.generateQRCode(id),
      records: [],
      createdAt: new Date().toISOString()
    };
    
    this.savePatient(patient);
    return patient;
  }

  static savePatient(patient: Patient): void {
    const patients = this.getAllPatients();
    const existingIndex = patients.findIndex(p => p.id === patient.id);
    
    if (existingIndex >= 0) {
      patients[existingIndex] = patient;
    } else {
      patients.push(patient);
    }
    
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
  }

  static getPatient(id: string): Patient | null {
    const patients = this.getAllPatients();
    return patients.find(p => p.id === id) || null;
  }

  static getAllPatients(): Patient[] {
    const data = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    return data ? JSON.parse(data) : [];
  }

  // Medical Records Management
  static addMedicalRecord(patientId: string, recordData: Omit<MedicalRecord, 'id' | 'patientId' | 'uploadDate'>): MedicalRecord | null {
    const patient = this.getPatient(patientId);
    if (!patient) return null;

    const record: MedicalRecord = {
      ...recordData,
      id: this.generateId(),
      patientId,
      uploadDate: new Date().toISOString()
    };

    patient.records.push(record);
    this.savePatient(patient);
    return record;
  }

  static getMedicalRecords(patientId: string): MedicalRecord[] {
    const patient = this.getPatient(patientId);
    return patient?.records || [];
  }

  // Doctor Management
  static createDoctor(doctorData: Omit<Doctor, 'id'>): Doctor {
    const doctor: Doctor = {
      ...doctorData,
      id: this.generateId()
    };
    
    const doctors = this.getAllDoctors();
    doctors.push(doctor);
    localStorage.setItem(STORAGE_KEYS.DOCTORS, JSON.stringify(doctors));
    return doctor;
  }

  static getAllDoctors(): Doctor[] {
    const data = localStorage.getItem(STORAGE_KEYS.DOCTORS);
    return data ? JSON.parse(data) : [];
  }

  // Authentication & Session
  static setCurrentUser(user: Patient | Doctor, type: 'patient' | 'doctor'): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.USER_TYPE, type);
  }

  static getCurrentUser(): { user: Patient | Doctor; type: 'patient' | 'doctor' } | null {
    const userData = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    const userType = localStorage.getItem(STORAGE_KEYS.USER_TYPE);
    
    if (userData && userType) {
      return {
        user: JSON.parse(userData),
        type: userType as 'patient' | 'doctor'
      };
    }
    return null;
  }

  static logout(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.USER_TYPE);
  }

  // QR Code Management
  static getPatientByQRCode(qrCode: string): Patient | null {
    const patients = this.getAllPatients();
    return patients.find(p => p.qrCode === qrCode) || null;
  }

  // Utility Functions
  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private static generateQRCode(patientId: string): string {
    return `HV_${patientId}_${Date.now().toString(36)}`;
  }

  // File Handling
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }
}