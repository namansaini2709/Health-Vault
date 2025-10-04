import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, QrCode, FileText, Calendar, LogOut, Plus, Eye } from 'lucide-react';
import { HealthVaultService, Patient, MedicalRecord } from '@/lib/healthVault';
import { AISummarizer } from '@/lib/aiSummarizer';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import FileUpload from '@/components/FileUpload';
import QRGenerator from '@/components/QRGenerator';
import RecordSummary from '@/components/RecordSummary';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const currentUser = HealthVaultService.getCurrentUser();
    if (!currentUser || currentUser.type !== 'patient') {
      navigate('/');
      return;
    }
    
    const patientData = currentUser.user as Patient;
    setPatient(patientData);
    setRecords(patientData.records || []);
  }, [navigate]);

  const handleLogout = () => {
    HealthVaultService.logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handleFileUpload = async (file: File, category: string) => {
    if (!patient) return;

    try {
      const fileData = await HealthVaultService.fileToBase64(file);
      const record = HealthVaultService.addMedicalRecord(patient.id, {
        fileName: file.name,
        fileType: file.type,
        fileData,
        category: category as any,
        summary: AISummarizer.summarizeRecord({
          fileName: file.name,
          category: category as any
        } as MedicalRecord)
      });

      if (record) {
        // Refresh patient data
        const updatedPatient = HealthVaultService.getPatient(patient.id);
        if (updatedPatient) {
          setPatient(updatedPatient);
          setRecords(updatedPatient.records);
        }
        toast.success('Medical record uploaded successfully!');
        setShowUpload(false);
      }
    } catch (error) {
      toast.error('Failed to upload file. Please try again.');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!patient) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">HealthVault</h1>
              <p className="text-gray-600">Welcome back, {patient.name}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowQR(true)}>
                <QrCode className="h-4 w-4 mr-2" />
                My QR Code
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="records" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="records">Medical Records</TabsTrigger>
                <TabsTrigger value="summary">AI Summary</TabsTrigger>
              </TabsList>
              
              <TabsContent value="records" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Your Medical Records</h2>
                  <Button onClick={() => setShowUpload(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Record
                  </Button>
                </div>

                {records.length === 0 ? (
                  <Card>
                    <CardContent className="py-16 text-center">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No medical records yet</h3>
                      <p className="text-gray-600 mb-4">Upload your first medical document to get started</p>
                      <Button onClick={() => setShowUpload(true)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload First Record
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {records.map((record) => (
                      <Card key={record.id}>
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 mb-1">{record.fileName}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="h-4 w-4" />
                                {formatDate(record.uploadDate)}
                              </div>
                            </div>
                            <Badge className={getCategoryColor(record.category)}>
                              {record.category.replace('-', ' ')}
                            </Badge>
                          </div>
                          {record.summary && (
                            <div className="bg-blue-50 p-3 rounded-lg">
                              <p className="text-sm text-blue-800">{record.summary}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="summary">
                <RecordSummary records={records} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Quick Access
                </CardTitle>
                <CardDescription>
                  Your unique health QR code for instant access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" onClick={() => setShowQR(true)}>
                  <QrCode className="h-4 w-4 mr-2" />
                  Show QR Code
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm">{patient.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-sm">{patient.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Date of Birth</p>
                  <p className="text-sm">{formatDate(patient.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Emergency Contact</p>
                  <p className="text-sm">{patient.emergencyContact}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Records</span>
                    <span className="font-medium">{records.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Prescriptions</span>
                    <span className="font-medium">
                      {records.filter(r => r.category === 'prescription').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Lab Results</span>
                    <span className="font-medium">
                      {records.filter(r => r.category === 'lab-result').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Scans</span>
                    <span className="font-medium">
                      {records.filter(r => r.category === 'scan').length}
                    </span>
                  </div>
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
    </div>
  );
}