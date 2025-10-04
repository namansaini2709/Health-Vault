import { MedicalRecord } from './healthVault';

export interface MedicalSummary {
  keyFindings: string[];
  conditions: string[];
  medications: string[];
  recommendations: string[];
  riskFactors: string[];
  lastUpdated: string;
}

export class AISummarizer {
  // Mock AI summarization - in production, this would call an actual AI service
  static summarizeRecord(record: MedicalRecord): string {
    const { fileName, category, fileType } = record;
    
    // Mock analysis based on file name and category
    const summaries = this.getMockSummaries();
    
    // Simple keyword matching for demo purposes
    const keywords = fileName.toLowerCase();
    
    for (const [key, summary] of Object.entries(summaries)) {
      if (keywords.includes(key)) {
        return summary;
      }
    }
    
    // Default summary based on category
    return this.getDefaultSummary(category);
  }

  static generatePatientSummary(records: MedicalRecord[]): MedicalSummary {
    const summary: MedicalSummary = {
      keyFindings: [],
      conditions: [],
      medications: [],
      recommendations: [],
      riskFactors: [],
      lastUpdated: new Date().toISOString()
    };

    records.forEach(record => {
      const recordSummary = this.summarizeRecord(record);
      
      // Extract information based on record category
      switch (record.category) {
        case 'prescription':
          this.extractMedications(recordSummary, summary);
          break;
        case 'lab-result':
          this.extractLabFindings(recordSummary, summary);
          break;
        case 'scan':
          this.extractScanFindings(recordSummary, summary);
          break;
        case 'report':
          this.extractReportFindings(recordSummary, summary);
          break;
      }
    });

    // Remove duplicates
    summary.keyFindings = [...new Set(summary.keyFindings)];
    summary.conditions = [...new Set(summary.conditions)];
    summary.medications = [...new Set(summary.medications)];
    summary.recommendations = [...new Set(summary.recommendations)];
    summary.riskFactors = [...new Set(summary.riskFactors)];

    return summary;
  }

  private static getMockSummaries(): Record<string, string> {
    return {
      'blood': 'Blood test results show normal glucose levels (95 mg/dL), slightly elevated cholesterol (220 mg/dL). Hemoglobin within normal range.',
      'pressure': 'Blood pressure reading: 140/90 mmHg - indicates Stage 1 Hypertension. Recommend lifestyle modifications and monitoring.',
      'diabetes': 'HbA1c: 7.2% - indicates diabetes management needed. Fasting glucose: 145 mg/dL (elevated).',
      'heart': 'ECG shows normal sinus rhythm. No signs of arrhythmia or ischemia detected.',
      'xray': 'Chest X-ray: Clear lung fields, normal heart size and position. No acute findings.',
      'mri': 'MRI scan shows normal brain structure with no signs of abnormalities or lesions.',
      'prescription': 'Prescribed: Metformin 500mg twice daily for diabetes management. Lisinopril 10mg daily for hypertension.',
      'covid': 'COVID-19 test result: Negative. Patient asymptomatic at time of testing.',
      'vaccine': 'Vaccination record: COVID-19 vaccine (2 doses completed), Flu vaccine (annual), up to date.',
      'allergy': 'Allergy test results: Positive for pollen, dust mites. Negative for common food allergens.'
    };
  }

  private static getDefaultSummary(category: string): string {
    const defaults = {
      'prescription': 'Prescription medication record - contains prescribed medications and dosage instructions.',
      'lab-result': 'Laboratory test results - contains various biomarker measurements and reference ranges.',
      'scan': 'Medical imaging scan - radiological examination results and findings.',
      'report': 'Medical report - comprehensive health assessment and clinical findings.',
      'other': 'Medical document - contains health-related information and clinical data.'
    };
    
    return defaults[category as keyof typeof defaults] || defaults.other;
  }

  private static extractMedications(summary: string, patientSummary: MedicalSummary): void {
    const commonMeds = ['metformin', 'lisinopril', 'aspirin', 'atorvastatin', 'amlodipine', 'insulin'];
    commonMeds.forEach(med => {
      if (summary.toLowerCase().includes(med)) {
        patientSummary.medications.push(med.charAt(0).toUpperCase() + med.slice(1));
      }
    });
  }

  private static extractLabFindings(summary: string, patientSummary: MedicalSummary): void {
    if (summary.includes('elevated')) {
      patientSummary.keyFindings.push('Elevated lab values detected');
    }
    if (summary.includes('glucose') || summary.includes('diabetes')) {
      patientSummary.conditions.push('Diabetes/Pre-diabetes');
    }
    if (summary.includes('cholesterol')) {
      patientSummary.conditions.push('High Cholesterol');
      patientSummary.riskFactors.push('Cardiovascular risk');
    }
  }

  private static extractScanFindings(summary: string, patientSummary: MedicalSummary): void {
    if (summary.includes('normal')) {
      patientSummary.keyFindings.push('Normal imaging findings');
    }
    if (summary.includes('abnormal') || summary.includes('lesion')) {
      patientSummary.keyFindings.push('Abnormal findings detected');
      patientSummary.recommendations.push('Follow-up imaging recommended');
    }
  }

  private static extractReportFindings(summary: string, patientSummary: MedicalSummary): void {
    if (summary.includes('hypertension')) {
      patientSummary.conditions.push('Hypertension');
      patientSummary.recommendations.push('Blood pressure monitoring');
    }
    if (summary.includes('risk')) {
      patientSummary.riskFactors.push('Multiple risk factors identified');
    }
  }
}