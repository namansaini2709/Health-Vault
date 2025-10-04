// Test script to validate Supabase configuration and connection
import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

console.log('✅ Supabase configuration found');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test the connection by trying to access public data
async function testConnection() {
  try {
    console.log('📡 Testing connection to Supabase...');
    
    // Test if we can access the patients table (without authentication)
    const { data, error } = await supabase
      .from('patients')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection works');
    console.log('📋 Found patient records:', data.length);
    
    // Test if storage bucket exists and is accessible
    try {
      const { data: bucketData } = await supabase.storage.listBuckets();
      if (bucketData) {
        console.log('✅ Storage service accessible');
        const medicalRecordsBucket = bucketData.find(bucket => bucket.name === 'medical-records');
        if (medicalRecordsBucket) {
          console.log('✅ "medical-records" storage bucket found');
        } else {
          console.log('⚠️  "medical-records" storage bucket not found');
          console.log('💡 Please create a storage bucket named "medical-records" in your Supabase dashboard');
        }
      }
    } catch (storageError: any) {
      console.error('❌ Storage service error:', storageError.message);
    }
    
    return true;
  } catch (error: any) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

console.log('🔍 Starting HealthVault connection diagnostics...');
testConnection().then(success => {
  if (success) {
    console.log('🎉 Connection diagnostics completed successfully');
    console.log('✅ Your Supabase configuration is valid');
  } else {
    console.log('❌ Connection diagnostics failed');
    console.log('💡 Please check the TROUBLESHOOTING.md file for common issues');
  }
});