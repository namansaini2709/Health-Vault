import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Upload, QrCode, FileText, Calendar, LogOut, Plus, User, Settings, Bell, Activity, Heart, Shield, Smartphone, Edit, Lock, Unlock } from 'lucide-react';
import { HealthVaultService, Patient, MedicalRecord } from '@/lib/healthVault';
import { AISummarizer } from '@/lib/aiSummarizer';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import FileUpload from '@/components/FileUpload';
import QRGenerator from '@/components/QRGenerator';
import PatientHealthSummary from '@/components/PatientHealthSummary';
import EncryptedRecordSummary from '@/components/EncryptedRecordSummary';
import AccessManagement from '@/components/AccessManagement';
import { createEncryptedFile, generateEncryptionKey, keyToHexString, storeKeyInSession } from '@/lib/encryptionUtils';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { extractPDFText } from '@/lib/pdfExtractor';
import apiClient from '@/lib/apiService';
import EditProfileForm from "@/components/EditProfileForm";

type RecordCategory = 'prescription' | 'lab-result' | 'scan' | 'report' | 'other';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const handleProfileUpdate = async (updatedData: Partial<Patient> & { profilePicture?: File | null }) => {
    if (!patient) return;
    try {
      let profilePictureUrl = patient.profilePictureUrl;
      if (updatedData.profilePicture) {
        const formData = new FormData();
        formData.append("file", updatedData.profilePicture);
        const response = await apiClient.post("/v1/upload-profile-picture", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        profilePictureUrl = response.data.url;
      }

      const updatedPatientData = { ...updatedData, profilePictureUrl };
      delete updatedPatientData.profilePicture;

      const updatedPatient = await HealthVaultService.updatePatient(patient.id, updatedPatientData);
      console.log("Updated patient data:", JSON.stringify(updatedPatient, null, 2));
      setPatient(updatedPatient);
      setShowEditProfile(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const currentUser = await HealthVaultService.getCurrentUser();
      if (!currentUser || currentUser.type !== 'patient') {
        navigate('/');
        return;
      }

      // The user object from getCurrentUser is now the full patient object
      const patientData = currentUser.user as Patient;
      console.log("Patient data on dashboard:", patientData);
      setPatient(patientData);
      setRecords(patientData.records || []);
    };

    fetchCurrentUser();
  }, [navigate]);

  const handleLogout = () => {
    HealthVaultService.logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const refreshPatientData = async () => {
    if (!patient) return;

    try {
      // Force regenerate AI summaries for all records with PDF content extraction
      await HealthVaultService.generatePatientSummaries(patient.id, true);

      // Fetch the updated patient data with the new summaries
      const updatedPatient = await HealthVaultService.getPatient(patient.id);
      if (updatedPatient) {
        setPatient(updatedPatient);
        setRecords(updatedPatient.records || []);
      }
    } catch (error) {
      console.error('Error refreshing patient data:', error);
      throw error;
    }
  };

  const handleFileUpload = async (file: File, category: string) => {
    if (!patient) {
      console.error('No patient data available for upload');
      toast.error('No patient data available. Please log in again.');
      return;
    }

    // Validate file size
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error(`File size too large. Maximum allowed size is ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    try {
      console.log('Selected file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });

      // Extract PDF text before encryption (if PDF)
      let pdfText = '';
      if (file.type === 'application/pdf') {
        toast.loading('Extracting text from PDF...');
        pdfText = await extractPDFText(file);
        console.log(`Extracted ${pdfText.length} characters from PDF`);
      }

      toast.loading('Encrypting file...');

      // Generate encryption key and encrypt file
      const encryptionKey = await generateEncryptionKey();
      const { encryptedFile, encryptionMetadata } = await createEncryptedFile(file, encryptionKey);

      console.log('After encryption:', {
        encryptedFileName: encryptedFile.name,
        encryptedFileSize: encryptedFile.size,
        metadata: encryptionMetadata
      });

      // Convert key to hex string for storage
      const encryptionKeyHex = keyToHexString(encryptionKey);

      console.log('Encryption metadata before upload:', encryptionMetadata);
      console.log('Encryption key hex:', encryptionKeyHex);

      // Generate AI summary
      const summary = AISummarizer.summarizeRecord({
        fileName: file.name,
        category: category as RecordCategory,
      } as MedicalRecord);

      // Upload encrypted file with encryption metadata to backend
      toast.loading('Uploading encrypted file...');
      const newRecord = await HealthVaultService.addMedicalRecord(
        patient.id,
        encryptedFile,
        category as RecordCategory,
        summary,
        encryptionKeyHex, // Send encryption key to backend
        encryptionMetadata, // Send metadata to backend
        pdfText // Send extracted PDF text
      );

      console.log('Record uploaded successfully:', newRecord);

      // Store encryption key in sessionStorage for current session
      storeKeyInSession(encryptionKeyHex, newRecord.id);

      // Update local state
      setRecords([...records, newRecord]);

      // Refresh patient data from backend
      const updatedPatient = await HealthVaultService.getPatient(patient.id);
      if (updatedPatient) {
        setPatient(updatedPatient);
      }

      toast.dismiss();
      toast.success('Medical record securely encrypted and uploaded!');
      setShowUpload(false);
    } catch (error: any) {
      console.error('Failed to upload file:', error);
      toast.dismiss();
      toast.error(error.message || 'Upload failed. Please try again.');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'prescription': 'bg-blue-100 text-blue-800',
      'lab-result': 'bg-green-100 text-green-800',
      'scan': 'bg-purple-100 text-purple-800',
      'report': 'bg-orange-100 text-orange-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!patient) return;

    try {
      await HealthVaultService.deleteMedicalRecord(recordId);

      // Update local state
      setRecords(records.filter(r => r.id !== recordId));

      // Update patient object with new records list
      const updatedPatient = { ...patient, records: records.filter(r => r.id !== recordId) };
      setPatient(updatedPatient);

      toast.success('Record deleted successfully');
    } catch (error) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete record');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProfileCompleteness = () => {
    if (!patient) return 0;
    let completeness = 0;
    if (patient.name) completeness += 20;
    if (patient.email) completeness += 20;
    if (patient.phone) completeness += 20;
    if (patient.dateOfBirth) completeness += 20;
    if (patient.emergencyContact) completeness += 20;
    return completeness;
  };

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-white">
      {/* Mobile-First Header */}
      <div className="bg-white border-b sticky top-0 z-30 dark:bg-gray-800 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">HealthVault</h1>
                <p className="text-sm text-gray-600 hidden sm:block dark:text-gray-300">Welcome back, {patient.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={() => setShowQR(true)} className="flex-1 sm:flex-none">
                <QrCode className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">My QR</span>
                <span className="sm:hidden">QR</span>
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout} className="flex-1 sm:flex-none">
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Exit</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        {/* Mobile Welcome Card */}
        <div className="mb-6 sm:hidden">
          <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                  {patient.profilePictureUrl && <AvatarImage src={`http://localhost:3001${patient.profilePictureUrl}`} />}
                  <AvatarFallback className="bg-white text-blue-600 text-lg font-semibold dark:bg-gray-700 dark:text-blue-300">
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold">{patient.name}</h2>
                  <p className="text-blue-100 text-sm">Patient ID: {patient.id.slice(-8)}</p>
                  {patient.tier === 'premium' && (
                                          <Badge className="mt-2 bg-yellow-400 text-yellow-900">Premium</Badge>
                  )}
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Profile Complete</span>
                      <span>{getProfileCompleteness()}%</span>
                    </div>
                    <Progress value={getProfileCompleteness()} className="mt-1 h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop/Tablet Layout */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Quick Stats Cards - Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{records.length}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Total Records</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{records.filter(r => r.category === 'lab-result').length}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Lab Results</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{records.filter(r => r.category === 'prescription').length}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Prescriptions</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Smartphone className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{records.filter(r => r.category === 'scan').length}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Scans</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                <TabsTrigger value="records" className="text-xs sm:text-sm">Records</TabsTrigger>
                <TabsTrigger value="insights" className="text-xs sm:text-sm">AI Insights</TabsTrigger>
                <TabsTrigger value="access" className="text-xs sm:text-sm">
                  <Shield className="h-3 w-3 mr-1" />
                  Access
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                {/* Recent Activity */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {records.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4 dark:text-gray-500" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-white">No activity yet</h3>
                        <p className="text-gray-600 mb-4 dark:text-gray-300">Upload your first medical document to get started</p>
                        <Button onClick={() => setShowUpload(true)} size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload First Record
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {records.slice(0, 3).map((record) => (
                          <div key={record.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg dark:bg-gray-700/50">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate dark:text-white">{record.fileName}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(record.uploadDate)}</p>
                            </div>
                            <Badge className={getCategoryColor(record.category)} variant="outline">
                              {record.category}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Button onClick={() => setShowUpload(true)} className="h-auto p-4 flex-col space-y-2" variant="outline">
                        <Upload className="h-6 w-6" />
                        <span className="text-sm">Upload Record</span>
                      </Button>
                      <Button onClick={() => setShowQR(true)} className="h-auto p-4 flex-col space-y-2" variant="outline">
                        <QrCode className="h-6 w-6" />
                        <span className="text-sm">Show QR Code</span>
                      </Button>
                      <Button className="h-auto p-4 flex-col space-y-2" variant="outline">
                        <Settings className="h-6 w-6" />
                        <span className="text-sm">Settings</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="records" className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Encrypted Medical Records
                  </h2>
                  <Button onClick={() => setShowUpload(true)} size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Record
                  </Button>
                </div>

                {records.length === 0 ? (
                  <Card>
                    <CardContent className="py-16 text-center">
                      <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4 dark:text-gray-500" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-white">No medical records yet</h3>
                      <p className="text-gray-600 mb-4 dark:text-gray-300">Upload your first medical document to get started</p>
                      <Button onClick={() => setShowUpload(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload First Record
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <EncryptedRecordSummary records={records} patientId={patient.id} onDelete={handleDeleteRecord} />
                )}
              </TabsContent>
              
              <TabsContent value="insights">
                <PatientHealthSummary records={records} onReload={refreshPatientData} />
              </TabsContent>

              <TabsContent value="access">
                <AccessManagement patientId={patient.id} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Hidden on mobile */}
          <div className="hidden lg:block space-y-6">
            {/* Profile Card */}
            <Card>
              <CardHeader className="text-center pb-2">
                <Avatar className="h-20 w-20 mx-auto mb-4">
                  {patient.profilePictureUrl && <AvatarImage src={`http://localhost:3001${patient.profilePictureUrl}`} />}
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xl">
                    {patient.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-lg">{patient.name}</CardTitle>
                {patient.tier === 'premium' && (
                  <Badge className="mt-2 bg-yellow-400 text-yellow-900">Premium</Badge>
                )}
                <CardDescription>Patient ID: {patient.id.slice(-8)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-300">Profile Complete</span>
                    <span className="font-medium">{getProfileCompleteness()}%</span>
                  </div>
                  <Progress value={getProfileCompleteness()} className="h-2" />
                </div>
                <Button variant="outline" className="w-full" size="sm" onClick={() => setShowEditProfile(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </CardContent>
            </Card>

            {/* QR Code Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <QrCode className="h-5 w-5" />
                  Quick Access
                </CardTitle>
                <CardDescription className="text-sm">
                  Your unique health QR code
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => setShowQR(true)} size="sm">
                  <QrCode className="h-4 w-4 mr-2" />
                  Show QR Code
                </Button>
              </CardContent>
            </Card>

            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Email</p>
                  <p className="text-sm mt-1 dark:text-gray-300">{patient.email}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Phone</p>
                  <p className="text-sm mt-1 dark:text-gray-300">{patient.phone}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Date of Birth</p>
                  <p className="text-sm mt-1 dark:text-gray-300">{formatDate(patient.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Emergency Contact</p>
                  <p className="text-sm mt-1 dark:text-gray-300">{patient.emergencyContact}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showUpload && (
        <FileUpload
          onUpload={handleFileUpload}
          onClose={() => setShowUpload(false)}
        />
      )}

      {showQR && patient && (
        <QRGenerator
          patient={patient}
          onClose={() => setShowQR(false)}
        />
      )}

      {showEditProfile && patient && (
        <EditProfileForm
          patient={patient}
          onClose={() => setShowEditProfile(false)}
          onSave={handleProfileUpdate}
        />
      )}
    </div>
  );
}
