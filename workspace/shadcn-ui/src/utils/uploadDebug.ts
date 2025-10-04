import { toast } from 'sonner';
import { HealthVaultService } from '@/lib/healthVault';

// Debug function to test file upload functionality
export const testFileUpload = async (file: File, patientId: string, category: string) => {
  console.log('Testing file upload with parameters:', { file, patientId, category });
  
  try {
    // Validate inputs
    if (!file) {
      throw new Error('No file provided for upload');
    }
    
    if (!patientId) {
      throw new Error('No patient ID provided for upload');
    }
    
    if (!category) {
      throw new Error('No category provided for upload');
    }
    
    // Check file size (max 10MB for Supabase free tier)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(`File size too large. Maximum allowed size is ${maxSize / (1024 * 1024)}MB`);
    }
    
    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.warn(`File type ${file.type} may not be supported. Recommended types: PDF, JPG, PNG, GIF`);
    }
    
    // Test the upload
    console.log('Attempting to upload file to Supabase...');
    const result = await HealthVaultService.addMedicalRecord(patientId, file, category as any);
    console.log('Upload successful:', result);
    
    toast.success(`File ${file.name} uploaded successfully!`);
    return result;
  } catch (error: any) {
    console.error('Upload failed:', error);
    let errorMessage = 'Upload failed: ';
    
    if (error.message.includes('NetworkError')) {
      errorMessage += 'Check your network connection and Supabase configuration.';
    } else if (error.message.includes('403') || error.message.includes('permission') || error.message.includes('auth')) {
      errorMessage += 'Authentication error. Check your Supabase anon key.';
    } else if (error.message.includes('database')) {
      errorMessage += 'Database error. Check if the "medical_records" table exists in your Supabase database.';
    } else if (error.message.includes('Storage')) {
      errorMessage += 'Storage error. Check if the "medical-records" bucket exists in Supabase.';
    } else {
      errorMessage += error.message || 'Unknown error occurred';
    }
    
    toast.error(errorMessage);
    throw error;
  }
};

// Function to validate Supabase configuration
export const validateSupabaseConfig = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('Checking Supabase configuration...');
  console.log('Supabase URL exists:', !!supabaseUrl);
  console.log('Supabase Anon Key exists:', !!supabaseAnonKey);
  
  if (!supabaseUrl) {
    console.error('Missing VITE_SUPABASE_URL in environment variables');
    return false;
  }
  
  if (!supabaseAnonKey) {
    console.error('Missing VITE_SUPABASE_ANON_KEY in environment variables');
    return false;
  }
  
  return true;
};