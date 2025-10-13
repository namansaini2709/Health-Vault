import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { QrCode, LogOut, User, FileText, Clock, History } from 'lucide-react';
import { HealthVaultService, Doctor } from '@/lib/healthVault';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import QRScanner from '@/components/QRScanner';
import MyPatients from '@/components/MyPatients';
import PendingRequests from '@/components/PendingRequests';
import RequestHistory from '@/components/RequestHistory';
import PatientProfileView from '@/components/PatientProfileView';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  AccessRequest,
  getDoctorGrantedPatients,
  getDoctorPendingRequests,
  sendAccessRequest,
  getUnseenCount
} from '@/lib/accessControlService';

export default function DoctorDashboard() {
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [grantedPatients, setGrantedPatients] = useState<AccessRequest[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<AccessRequest | null>(null);
  const [activeTab, setActiveTab] = useState('patients');

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const currentUser = await HealthVaultService.getCurrentUser();
      if (!currentUser || currentUser.type !== 'doctor') {
        navigate('/');
        return;
      }

      const doctorData = currentUser.user as Doctor;
      setDoctor(doctorData);

      // Fetch access control data
      await fetchDoctorData(doctorData.id);
    };

    fetchCurrentUser();
  }, [navigate]);

  const fetchDoctorData = async (doctorId: string) => {
    try {
      const [granted, pending, unseenData] = await Promise.all([
        getDoctorGrantedPatients(doctorId),
        getDoctorPendingRequests(doctorId),
        getUnseenCount(doctorId)
      ]);

      setGrantedPatients(granted);
      setPendingRequests(pending);
      setUnseenCount(unseenData.count);
    } catch (error) {
      console.error('Error fetching doctor data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const handleLogout = () => {
    HealthVaultService.logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  const handleQRScan = async (qrCode: string) => {
    try {
      if (!doctor) return;

      console.log('Scanning QR code:', qrCode);
      await sendAccessRequest(doctor.id, qrCode);
      toast.success('Access request sent successfully!');
      setShowScanner(false);

      // Refresh pending requests
      const pending = await getDoctorPendingRequests(doctor.id);
      setPendingRequests(pending);
      setActiveTab('pending');
    } catch (error: any) {
      console.error('Error scanning QR code:', error);
      toast.error(error.message || 'Failed to send access request');
    }
  };

  const handlePatientClick = (request: AccessRequest) => {
    setSelectedPatient(request);
  };

  const handleBackToList = () => {
    setSelectedPatient(null);
    // Refresh data when going back
    if (doctor) {
      fetchDoctorData(doctor.id);
    }
  };

  const handleUnseenUpdate = async () => {
    if (doctor) {
      const unseenData = await getUnseenCount(doctor.id);
      setUnseenCount(unseenData.count);
    }
  };

  // Refresh unseen count when switching to history tab
  useEffect(() => {
    if (activeTab === 'history' && doctor) {
      getUnseenCount(doctor.id).then(data => setUnseenCount(data.count));
    }
  }, [activeTab, doctor]);

  if (!doctor) {
    return (
      <div className="flex items-center justify-center min-h-screen dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
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
                Scan Patient QR
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
              <PatientProfileView
                accessRequest={selectedPatient}
                doctorId={doctor.id}
                onBack={handleBackToList}
              />
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="patients">
                    <User className="h-4 w-4 mr-2" />
                    My Patients
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    <Clock className="h-4 w-4 mr-2" />
                    Pending
                    {pendingRequests.length > 0 && (
                      <Badge className="ml-2 bg-yellow-500">{pendingRequests.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    <History className="h-4 w-4 mr-2" />
                    History
                    {unseenCount > 0 && (
                      <Badge className="ml-2 bg-red-500">{unseenCount}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="patients" className="mt-6">
                  <MyPatients
                    patients={grantedPatients}
                    onPatientClick={handlePatientClick}
                  />
                </TabsContent>

                <TabsContent value="pending" className="mt-6">
                  <PendingRequests requests={pendingRequests} />
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                  <RequestHistory
                    doctorId={doctor.id}
                    unseenCount={unseenCount}
                    onUnseenUpdate={handleUnseenUpdate}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-20 w-20 mx-auto mb-4">
                  {doctor.profilePictureUrl && <AvatarImage src={`http://localhost:5001${doctor.profilePictureUrl}`} />}
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xl">
                    {doctor.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <CardTitle>Dr. {doctor.name}</CardTitle>
                <CardDescription>{doctor.specialty}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">License</p>
                  <p className="text-sm dark:text-gray-300">{doctor.license}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm dark:text-gray-300">{doctor.email}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">My Patients</p>
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{grantedPatients.length}</p>
                    </div>
                    <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <div>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Pending Requests</p>
                      <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{pendingRequests.length}</p>
                    </div>
                    <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">Total Records Access</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {grantedPatients.reduce((sum, p) => sum + p.encryptionKeys.length, 0)}
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-green-600 dark:text-green-400" />
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
