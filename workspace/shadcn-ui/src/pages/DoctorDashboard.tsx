import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, LogOut, Search, User, FileText, Calendar } from 'lucide-react';
import { HealthVaultService, Doctor, Patient, MedicalRecord } from '@/lib/healthVault';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import QRScanner from '@/components/QRScanner';
import RecordSummary from '@/components/RecordSummary';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [allPatients, setAllPatients] = useState<Patient[]>([]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const currentUser = await HealthVaultService.getCurrentUser();
      if (!currentUser || currentUser.type !== 'doctor') {
        navigate('/');
        return;
      }
      
      const doctorData = currentUser.user as Doctor;
      setDoctor(doctorData);

      const patients = await HealthVaultService.getAllPatients();
      setAllPatients(patients);
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
        setSelectedPatient(patient);
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
    const patient = await HealthVaultService.getPatient(patientId);
    if (patient) {
      setSelectedPatient(patient);
      toast.success(`Viewing records for ${patient.name}`);
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

  if (!doctor) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">HealthVault Provider</h1>
              <p className="text-gray-600">Dr. {doctor.name} - {doctor.specialty}</p>
            </div>
            <div className="flex gap-2">
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
                        <p className="font-medium text-gray-500">Email</p>
                        <p>{selectedPatient.email}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500">Phone</p>
                        <p>{selectedPatient.phone}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500">Emergency Contact</p>
                        <p>{selectedPatient.emergencyContact}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-500">Total Records</p>
                        <p>{selectedPatient.records.length}</p>
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
                          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No medical records</h3>
                          <p className="text-gray-600">This patient hasn't uploaded any medical records yet.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {selectedPatient.records.map((record: MedicalRecord) => (
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
                    <RecordSummary records={selectedPatient.records} />
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Patient Access</CardTitle>
                    <CardDescription>
                      Scan a patient's QR code or search for existing patients
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button onClick={() => setShowScanner(true)} className="w-full">
                      <QrCode className="h-4 w-4 mr-2" />
                      Scan Patient QR Code
                    </Button>
                    
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>How to scan:</strong><br />
                        1. Ask the patient to log in to their HealthVault account<br />
                        2. Have them click "Show QR Code" in their dashboard<br />
                        3. Use your device's camera to scan the displayed QR code<br />
                        4. Or manually enter the QR code text if scanning isn't available
                      </p>
                    </div>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search patients by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardContent>
                </Card>

                {searchQuery && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Search Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {filteredPatients.length === 0 ? (
                        <p className="text-gray-600 text-center py-4">No patients found matching your search.</p>
                      ) : (
                        <div className="space-y-2">
                          {filteredPatients.map((patient) => (
                            <div
                              key={patient.id}
                              className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
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
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Provider Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Name</p>
                  <p className="text-sm">Dr. {doctor.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Specialty</p>
                  <p className="text-sm">{doctor.specialty}</p>
                </div>
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
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Patients</span>
                    <span className="font-medium">{allPatients.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Records</span>
                    <span className="font-medium">
                      {allPatients.reduce((sum, p) => sum + p.records.length, 0)}
                    </span>
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
    </div>
  );
}