import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, QrCode, Shield, Smartphone, UserCheck, Stethoscope } from 'lucide-react';
import { HealthVaultService } from '@/lib/healthVault';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Index() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handlePatientLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const dob = formData.get('dob') as string;
    const emergency = formData.get('emergency') as string;

    try {
      // Check if patient exists
      const existingPatients = HealthVaultService.getAllPatients();
      let patient = existingPatients.find(p => p.email === email);

      if (!patient) {
        // Create new patient
        patient = HealthVaultService.createPatient({
          name,
          email,
          phone,
          dateOfBirth: dob,
          emergencyContact: emergency
        });
        toast.success('Welcome to HealthVault! Your account has been created.');
      } else {
        toast.success('Welcome back!');
      }

      HealthVaultService.setCurrentUser(patient, 'patient');
      navigate('/patient-dashboard');
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoctorLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const specialty = formData.get('specialty') as string;
    const license = formData.get('license') as string;

    try {
      // Check if doctor exists
      const existingDoctors = HealthVaultService.getAllDoctors();
      let doctor = existingDoctors.find(d => d.email === email);

      if (!doctor) {
        // Create new doctor
        doctor = HealthVaultService.createDoctor({
          name,
          email,
          specialty,
          license
        });
        toast.success('Doctor account created successfully!');
      } else {
        toast.success('Welcome back, Dr. ' + doctor.name);
      }

      HealthVaultService.setCurrentUser(doctor, 'doctor');
      navigate('/doctor-dashboard');
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-100 p-4 rounded-full">
              <Heart className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            HealthVault
          </h1>
          <p className="text-xl text-gray-600 mb-2">One Patient, One Record</p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Your complete medical history, accessible anywhere with just a QR code. 
            Secure, portable, and AI-powered health records.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
            <QrCode className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">QR Code Access</h3>
            <p className="text-sm text-gray-600">Instant access to medical records with a simple scan</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
            <Shield className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Secure Storage</h3>
            <p className="text-sm text-gray-600">Your data is encrypted and stored securely</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
            <Smartphone className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">AI Summarizer</h3>
            <p className="text-sm text-gray-600">Smart insights from your medical records</p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border">
            <UserCheck className="h-8 w-8 text-orange-600 mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Patient Control</h3>
            <p className="text-sm text-gray-600">You decide who can access your records</p>
          </div>
        </div>

        {/* Login Section */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Get Started</CardTitle>
              <CardDescription className="text-center">
                Choose your role to access HealthVault
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="patient" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="patient" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Patient
                  </TabsTrigger>
                  <TabsTrigger value="doctor" className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4" />
                    Healthcare Provider
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="patient">
                  <form onSubmit={handlePatientLogin} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" name="name" required />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input id="phone" name="phone" type="tel" required />
                      </div>
                      <div>
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input id="dob" name="dob" type="date" required />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="emergency">Emergency Contact</Label>
                      <Input id="emergency" name="emergency" placeholder="Name and phone number" required />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating Account...' : 'Access Patient Dashboard'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="doctor">
                  <form onSubmit={handleDoctorLogin} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="doc-name">Full Name</Label>
                        <Input id="doc-name" name="name" required />
                      </div>
                      <div>
                        <Label htmlFor="doc-email">Email</Label>
                        <Input id="doc-email" name="email" type="email" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="specialty">Specialty</Label>
                        <Input id="specialty" name="specialty" placeholder="e.g., Cardiology" required />
                      </div>
                      <div>
                        <Label htmlFor="license">License Number</Label>
                        <Input id="license" name="license" required />
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating Account...' : 'Access Provider Dashboard'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}