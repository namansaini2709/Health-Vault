import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QrCode, LogOut, Search, User, FileText, Calendar, Unlock, Lock, RefreshCw, Brain } from 'lucide-react';
import { HealthVaultService, Doctor, Patient, MedicalRecord } from '@/lib/healthVault';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import QRScanner from '@/components/QRScanner';
import RecordSummary from '@/components/RecordSummary';
import DashboardStats from '@/components/DashboardStats';
import AIInsights from '@/components/AIInsights';
import { summarizePatientRecords } from '@/lib/apiService';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [recordForSummary, setRecordForSummary] = useState<MedicalRecord | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const currentUser = await HealthVaultService.getCurrentUser();
      if (!currentUser || currentUser.type !== 'doctor') {
        navigate('/');
        return;
      }
      
      const doctorData = currentUser.user as Doctor;
      setDoctor(doctorData);

      // Fetch all patients without records first
      const patientsWithoutRecords = await HealthVaultService.getAllPatients();
      
      // For each patient, fetch their medical records separately
      const patientsWithRecords = await Promise.all(
        patientsWithoutRecords.map(async (patient) => {
          const records = await HealthVaultService.getMedicalRecords(patient.id);
          // Return a new patient object with records
          return { ...patient, records };
        })
      );
      
      setAllPatients(patientsWithRecords);
    };

    fetchCurrentUser();
  }, [navigate]);

  const handleLogout = () => {
    HealthVaultService.logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handleQRScan = async (qrCode: string) => {
    try {
      console.log('Scanning QR code:', qrCode);
      const patient = await HealthVaultService.getPatientByQRCode(qrCode);
      console.log('Patient retrieved:', patient);
      if (patient) {
        // Fetch the patient's medical records
        const records = await HealthVaultService.getMedicalRecords(patient.id);
        // Return patient object with records
        const patientWithRecords = { ...patient, records };
        setSelectedPatient(patientWithRecords);
        setShowScanner(false);
        toast.success(`Accessing records for ${patient.name}`);
      } else {
        toast.error('Invalid QR code or patient not found');
      }
    } catch (error) {
      console.error('Error scanning QR code:', error);
      toast.error('An error occurred while scanning the QR code.');
    }
  };

  const handlePatientSearch = async (patientId: string) => {
    try {
      const patient = await HealthVaultService.getPatient(patientId);
      if (patient) {
        // Fetch the patient's medical records
        const records = await HealthVaultService.getMedicalRecords(patientId);
        // Return patient object with records
        const patientWithRecords = { ...patient, records };
        setSelectedPatient(patientWithRecords);
        toast.success(`Viewing records for ${patient.name}`);
      }
    } catch (error) {
      console.error('Error fetching patient records:', error);
      toast.error('Error fetching patient details.');
    }
  };

  const filteredPatients = allPatients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  // Doctors cannot decrypt patient files - patient privacy protection
  const handleViewEncryptedFile = (record: MedicalRecord) => {
    toast.error('Patient files are encrypted for privacy. Only the patient can decrypt and view their files.');
  };

  const handleRegenerateAllSummaries = async () => {
    if (!selectedPatient) return;

    setIsRegenerating(true);
    toast.loading('Regenerating AI summaries for all records...');

    try {
      const result = await summarizePatientRecords(selectedPatient.id);

      // Refresh the patient data to get updated summaries
      const updatedPatient = await HealthVaultService.getPatient(selectedPatient.id);
      if (updatedPatient) {
        setSelectedPatient(updatedPatient);
      }

      toast.success(`Successfully regenerated ${result.totalRecords} AI summaries!`);
    } catch (error) {
      console.error('Error regenerating summaries:', error);
      toast.error('Failed to regenerate AI summaries');
    } finally {
      setIsRegenerating(false);
    }
  };

  if (!doctor) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-white">
      {/* Header */}
      <div className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">HealthVault Provider</h1>
              <p className="text-gray-600 dark:text-gray-300">Dr. {doctor.name} - {doctor.specialty}</p>
            </div>
            <div className="flex gap-2">
              <ThemeToggle />
              <Button variant="outline" onClick={() => setShowScanner(true)}>
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR Code
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
            {selectedPatient ? (
              <div className="space-y-6">
                {/* Patient Header */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          {selectedPatient.name}
                        </CardTitle>
                        <CardDescription>
                          Patient ID: {selectedPatient.id} | DOB: {formatDate(selectedPatient.dateOfBirth)}
                        </CardDescription>
                      </div>
                      <Button variant="outline" onClick={() => setSelectedPatient(null)}>
                        Back to Search
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-500 dark:text-gray-400">Email</p>
                        <p>{selectedPatient.email}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="dark:text-gray-300">{selectedPatient.phone}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500 dark:text-gray-400">Emergency Contact</p>
                        <p className="dark:text-gray-300">{selectedPatient.emergencyContact}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500 dark:text-gray-400">Total Records</p>
                        <p className="dark:text-gray-300">{selectedPatient.records.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Patient Records */}
                <Tabs defaultValue="records" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="records">Medical Records</TabsTrigger>
                    <TabsTrigger value="summary">AI Summary</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="records" className="space-y-4">
                    {selectedPatient.records.length === 0 ? (
                      <Card>
                        <CardContent className="py-16 text-center">
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4 dark:text-gray-500" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-white">No medical records</h3>
                          <p className="text-gray-600 dark:text-gray-300">This patient hasn't uploaded any medical records yet.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {selectedPatient.records.map((record: MedicalRecord) => (
                          <Card key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <CardContent className="p-6">
                              <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium text-gray-900 dark:text-white">{record.fileName}</h3>
                                    <Lock className="h-4 w-4 text-green-600" title="Patient-encrypted file" />
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                    <Calendar className="h-4 w-4" />
                                    {formatDate(record.uploadDate)}
                                  </div>
                                </div>
                                <Badge className={getCategoryColor(record.category)}>
                                  {record.category.replace('-', ' ')}
                                </Badge>
                              </div>
                              {record.summary && (
                                <div className="bg-blue-50 p-3 rounded-lg mb-2">
                                  <p className="text-sm text-blue-800">{record.summary}</p>
                                </div>
                              )}
                              <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => toast.info('View Report feature coming soon!')}>
                                <FileText className="h-3 w-3 mr-1" />
                                View Report (Coming Soon)
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="summary" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-600" />
                        <h3 className="text-lg font-semibold">AI-Powered Health Insights</h3>
                      </div>
                      <Button
                        onClick={handleRegenerateAllSummaries}
                        disabled={isRegenerating || selectedPatient.records.length === 0}
                        variant="outline"
                        size="sm"
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                        {isRegenerating ? 'Regenerating...' : 'Regenerate All'}
                      </Button>
                    </div>
                    <RecordSummary records={selectedPatient.records} />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Tabs defaultValue="patients" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="patients">Patients</TabsTrigger>
                  <TabsTrigger value="stats">Statistics</TabsTrigger>
                </TabsList>
                <TabsContent value="patients">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>All Patients</CardTitle>
                        <CardDescription>Select a patient to view their records</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="relative mb-4">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search patients by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        {filteredPatients.length === 0 ? (
                          <p className="text-gray-600 text-center py-4">No patients found.</p>
                        ) : (
                          <div className="space-y-2">
                            {filteredPatients.map((patient) => (
                              <div
                                key={patient.id}
                                className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer dark:hover:bg-gray-800 dark:border-gray-700"
                                onClick={() => handlePatientSearch(patient.id)}
                              >
                                <div>
                                  <p className="font-medium">{patient.name}</p>
                                  <p className="text-sm text-gray-600">{patient.email}</p>
                                </div>
                                <Badge variant="outline">
                                  {patient.records.length} records
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                <TabsContent value="stats">
                  <div className="space-y-6">
                    <DashboardStats allPatients={allPatients} />
                    <AIInsights allPatients={allPatients} />
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-4">
                  {doctor.profilePictureUrl && <AvatarImage src={`http://localhost:5000${doctor.profilePictureUrl}`} />}
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xl">
                    {doctor.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>Dr. {doctor.name}</CardTitle>
                <CardDescription>{doctor.specialty}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">License</p>
                  <p className="text-sm">{doctor.license}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm">{doctor.email}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Total Patients</p>
                      <p className="text-2xl font-bold text-blue-700">{allPatients.length}</p>
                    </div>
                    <User className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="text-xs text-green-600 font-medium">Total Records</p>
                      <p className="text-2xl font-bold text-green-700">
                        {allPatients.reduce((sum, p) => sum + p.records.length, 0)}
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="text-xs text-purple-600 font-medium">Avg Records/Patient</p>
                      <p className="text-2xl font-bold text-purple-700">
                        {allPatients.length > 0
                          ? (allPatients.reduce((sum, p) => sum + p.records.length, 0) / allPatients.length).toFixed(1)
                          : '0'}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="text-xs text-orange-600 font-medium">Recent Uploads</p>
                      <p className="text-2xl font-bold text-orange-700">
                        {allPatients.reduce((sum, p) =>
                          sum + p.records.filter(r =>
                            new Date(r.uploadDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                          ).length, 0
                        )}
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {recordForSummary && (
        <Dialog open={!!recordForSummary} onOpenChange={() => setRecordForSummary(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>AI Summary for {recordForSummary.fileName}</DialogTitle>
              <DialogDescription>
                {recordForSummary.summary}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}