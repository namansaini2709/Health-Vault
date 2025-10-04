import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Heart, QrCode, Shield, Smartphone, UserCheck, Stethoscope, ArrowRight, CheckCircle, Zap, Crown, Bot, MapPin, Calendar, Check } from 'lucide-react';
import { HealthVaultService } from '@/lib/healthVault';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import AIAssistant from '@/components/AIAssistant';

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
      const existingPatients = HealthVaultService.getAllPatients();
      let patient = existingPatients.find(p => p.email === email);

      if (!patient) {
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
      const existingDoctors = HealthVaultService.getAllDoctors();
      let doctor = existingDoctors.find(d => d.email === email);

      if (!doctor) {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                HealthVault
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="#security" className="text-gray-600 hover:text-gray-900 transition-colors">Security</a>
              <Button variant="outline" size="sm">Contact</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <Zap className="w-4 h-4 mr-2" />
                  Revolutionary Healthcare Platform
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  One Patient,
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block">
                    One Record
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Your complete medical history, accessible anywhere with just a QR code. 
                  Secure, portable, and AI-powered health records that put you in control.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg">
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">HIPAA Compliant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">End-to-End Encrypted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">AI-Powered</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Health Dashboard</h3>
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <QrCode className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium">Upload Medical Records</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Securely store your health documents</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium">Generate QR Code</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Share with healthcare providers instantly</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium">AI Health Insights</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Get personalized health recommendations</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-full p-3 shadow-lg">
                <Shield className="h-6 w-6 text-green-500" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-full p-3 shadow-lg">
                <Smartphone className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Revolutionary Healthcare Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the future of healthcare with our cutting-edge platform designed for patients and providers.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="group p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <QrCode className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">QR Code Access</h3>
              <p className="text-gray-600 text-sm">Instant access to medical records with a simple scan. No more waiting or paperwork.</p>
            </div>

            <div className="group p-6 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Secure Storage</h3>
              <p className="text-gray-600 text-sm">Military-grade encryption keeps your sensitive health data protected and private.</p>
            </div>

            <div className="group p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-violet-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Bot className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Assistant</h3>
              <p className="text-gray-600 text-sm">Smart AI analyzes your records and helps navigate the platform in multiple languages.</p>
            </div>

            <div className="group p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
              <div className="bg-orange-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <UserCheck className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient Control</h3>
              <p className="text-gray-600 text-sm">You decide who can access your records. Complete control over your health data.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start with our free basic plan or upgrade to premium for advanced AI features and appointment booking.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Basic Plan */}
            <Card className="relative border-2 border-gray-200 rounded-2xl overflow-hidden">
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-gray-900">Basic Plan</CardTitle>
                <CardDescription className="text-gray-600 mt-2">Perfect for personal health record management</CardDescription>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">Free</span>
                  <span className="text-gray-600 ml-2">forever</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">Unlimited medical record storage</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">QR code generation and sharing</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">Basic AI health insights</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">End-to-end encryption</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">Mobile responsive design</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">Basic multilingual support</span>
                  </div>
                </div>
                <Button className="w-full mt-8" variant="outline">
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="relative border-2 border-blue-500 rounded-2xl overflow-hidden shadow-xl">
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-2 text-sm font-medium">
                Most Popular
              </div>
              <CardHeader className="text-center pb-8 pt-12">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Crown className="h-6 w-6 text-yellow-500" />
                  <CardTitle className="text-2xl font-bold text-gray-900">Premium Plan</CardTitle>
                </div>
                <CardDescription className="text-gray-600 mt-2">Advanced AI features with appointment booking</CardDescription>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-gray-900">$9.99</span>
                  <span className="text-gray-600 ml-2">per month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">Everything in Basic Plan</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Bot className="h-5 w-5 text-blue-500" />
                    <span className="text-gray-700">Advanced AI Assistant</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-blue-500" />
                    <span className="text-gray-700">Doctor search within 10km radius</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    <span className="text-gray-700">Automated appointment booking</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">Priority customer support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">Advanced health analytics</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="text-gray-700">Smart health reminders</span>
                  </div>
                </div>
                <Button className="w-full mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  Upgrade to Premium
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Login Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Get Started Today
            </h2>
            <p className="text-xl text-gray-600">
              Join the future of healthcare with HealthVault
            </p>
          </div>

          <Card className="shadow-2xl border-0 overflow-hidden">
            <CardContent className="p-0">
              <Tabs defaultValue="patient" className="w-full">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                  <TabsList className="grid w-full grid-cols-2 bg-white/20 backdrop-blur-sm">
                    <TabsTrigger value="patient" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600">
                      <Heart className="h-4 w-4" />
                      Patient Portal
                    </TabsTrigger>
                    <TabsTrigger value="doctor" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-blue-600">
                      <Stethoscope className="h-4 w-4" />
                      Provider Access
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <div className="p-8">
                  <TabsContent value="patient" className="space-y-6 mt-0">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-semibold text-gray-900 mb-2">Patient Dashboard</h3>
                      <p className="text-gray-600">Manage your health records and share with providers instantly</p>
                    </div>
                    
                    <form onSubmit={handlePatientLogin} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                          <Input id="name" name="name" required className="h-12" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                          <Input id="email" name="email" type="email" required className="h-12" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                          <Input id="phone" name="phone" type="tel" required className="h-12" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dob" className="text-sm font-medium">Date of Birth</Label>
                          <Input id="dob" name="dob" type="date" required className="h-12" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergency" className="text-sm font-medium">Emergency Contact</Label>
                        <Input id="emergency" name="emergency" placeholder="Name and phone number" required className="h-12" />
                      </div>
                      <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Access Patient Dashboard'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="doctor" className="space-y-6 mt-0">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-semibold text-gray-900 mb-2">Provider Portal</h3>
                      <p className="text-gray-600">Access patient records securely with QR code scanning</p>
                    </div>
                    
                    <form onSubmit={handleDoctorLogin} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="doc-name" className="text-sm font-medium">Full Name</Label>
                          <Input id="doc-name" name="name" required className="h-12" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="doc-email" className="text-sm font-medium">Email Address</Label>
                          <Input id="doc-email" name="email" type="email" required className="h-12" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="specialty" className="text-sm font-medium">Medical Specialty</Label>
                          <Input id="specialty" name="specialty" placeholder="e.g., Cardiology" required className="h-12" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="license" className="text-sm font-medium">License Number</Label>
                          <Input id="license" name="license" required className="h-12" />
                        </div>
                      </div>
                      <Button type="submit" className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Access Provider Dashboard'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold">HealthVault</span>
              </div>
              <p className="text-gray-400 text-sm">
                Revolutionizing healthcare with secure, portable medical records accessible anywhere.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div>Features</div>
                <div>Security</div>
                <div>Pricing</div>
                <div>API</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div>About</div>
                <div>Careers</div>
                <div>Contact</div>
                <div>Blog</div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <div>Help Center</div>
                <div>Documentation</div>
                <div>Status</div>
                <div>Privacy</div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            © 2024 HealthVault. All rights reserved. Built with ❤️ for better healthcare.
          </div>
        </div>
      </footer>

      {/* AI Assistant */}
      <AIAssistant isPremium={false} />
    </div>
  );
}