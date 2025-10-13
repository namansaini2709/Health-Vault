import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Heart, QrCode, Shield, Smartphone, UserCheck, Stethoscope, ArrowRight, CheckCircle, Zap, Crown, Bot, MapPin, Calendar, Check } from 'lucide-react';
import { HealthVaultService } from '@/lib/healthVault';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import axios from 'axios';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function Index() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handlePatientLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData(e.target);
      const patientData = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        dateOfBirth: formData.get('dob'),
        emergencyContact: formData.get('emergency')
      };

      const response = await axios.post('http://localhost:5001/api/patients', patientData);
      const patient = response.data;

      // Store patient info in localStorage (simulating auth)
      localStorage.setItem('healthvault_patient_id', patient.id);
      localStorage.setItem('healthvault_user_type', 'patient');
      
      toast.success("Patient account created successfully!");
      navigate('/patient-dashboard');
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error("Failed to create patient account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoctorLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const formData = new FormData(e.target);
      const doctorData = {
        name: formData.get('name'),
        email: formData.get('email'),
        specialty: formData.get('specialty'),
        license: formData.get('license')
      };

      const response = await axios.post('http://localhost:5001/api/doctors', doctorData);
      const doctor = response.data;

      // Store doctor info in localStorage (simulating auth)
      localStorage.setItem('healthvault_doctor_id', doctor.id);
      localStorage.setItem('healthvault_user_type', 'doctor');
      
      toast.success("Provider account created successfully!");
      navigate('/doctor-dashboard');
    } catch (error) {
      console.error('Error creating doctor:', error);
      toast.error("Failed to create provider account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-900">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 dark:bg-gray-900/90 dark:border-gray-700">
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
            <div className="hidden md:flex items-center space-x-6">
              <a onClick={() => navigate('/features')} className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer dark:text-gray-300 dark:hover:text-white font-medium">Features</a>
              <a onClick={() => navigate('/pricing')} className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer dark:text-gray-300 dark:hover:text-white font-medium">Pricing</a>
              <a onClick={() => navigate('/security')} className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer dark:text-gray-300 dark:hover:text-white font-medium">Security</a>
              <Button variant="outline" size="sm" onClick={() => navigate('/login')} className="dark:border-gray-600 dark:text-white dark:hover:bg-gray-800 dark:hover:text-white font-medium">Login</Button>
              <div className="ml-4">
                <ThemeToggle />
              </div>
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
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                  <Zap className="w-4 h-4 mr-2" />
                  Revolutionary Healthcare Platform
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight dark:text-white">
                  One Patient,
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block dark:from-blue-400 dark:to-indigo-400">
                    One Record
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed dark:text-gray-300">
                  Your complete medical history, accessible anywhere with just a QR code. 
                  Secure, portable, and AI-powered health records that put you in control.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                      Get Started Free
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Get Started</DialogTitle>
                      <DialogDescription>
                        Are you a patient or a provider?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <Link to="/patient-register">
                        <Button className="w-full">Patient Portal</Button>
                      </Link>
                      <Link to="/provider-register">
                        <Button className="w-full">Provider Portal</Button>
                      </Link>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="lg">
                      Watch Demo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden bg-black/95 dark:bg-black/95 border-gray-800">
                    <div className="relative aspect-video w-full">
                      <video
                        controls
                        autoPlay
                        className="w-full h-full"
                        poster="/images/video-poster.jpg"
                      >
                        <source src="/videos/demo.mp4" type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">HIPAA Compliant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">End-to-End Encrypted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">AI-Powered</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300 dark:bg-gray-800 dark:text-gray-100">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold dark:text-white">Health Dashboard</h3>
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <QrCode className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 dark:bg-gray-700 dark:text-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium dark:text-white">Upload Medical Records</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 dark:text-gray-300">Securely store your health documents</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 dark:bg-gray-700 dark:text-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-sm font-medium dark:text-white">Generate QR Code</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 dark:text-gray-300">Share with healthcare providers instantly</p>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 dark:bg-gray-700 dark:text-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm font-medium dark:text-white">AI Health Insights</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 dark:text-gray-300">Get personalized health recommendations</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-full p-3 shadow-lg dark:bg-gray-700">
                <Shield className="h-6 w-6 text-green-500 dark:text-green-400" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white rounded-full p-3 shadow-lg dark:bg-gray-700">
                <Smartphone className="h-6 w-6 text-blue-500 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 dark:text-white">
              Everything You Need for Digital Health Records
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto dark:text-gray-300">
              Secure, accessible, and intelligent healthcare management at your fingertips
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-2 hover:border-blue-500 transition-all duration-300 hover:shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <QrCode className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle>QR Code Access</CardTitle>
                <CardDescription>
                  Instantly share your medical history with healthcare providers using a secure QR code
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 2 */}
            <Card className="border-2 hover:border-green-500 transition-all duration-300 hover:shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle>End-to-End Encryption</CardTitle>
                <CardDescription>
                  Your medical records are encrypted with bank-level security, ensuring complete privacy
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 3 */}
            <Card className="border-2 hover:border-purple-500 transition-all duration-300 hover:shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Bot className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle>AI-Powered Insights</CardTitle>
                <CardDescription>
                  Get intelligent health summaries and personalized recommendations from AI analysis
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 4 */}
            <Card className="border-2 hover:border-orange-500 transition-all duration-300 hover:shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Smartphone className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle>Access Anywhere</CardTitle>
                <CardDescription>
                  View your medical records from any device, anywhere in the world, 24/7
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 5 */}
            <Card className="border-2 hover:border-red-500 transition-all duration-300 hover:shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <UserCheck className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle>Patient Control</CardTitle>
                <CardDescription>
                  You decide who can access your records and for how long - complete control over your data
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Feature 6 */}
            <Card className="border-2 hover:border-indigo-500 transition-all duration-300 hover:shadow-xl">
              <CardHeader>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Stethoscope className="h-6 w-6 text-indigo-600" />
                </div>
                <CardTitle>Provider Dashboard</CardTitle>
                <CardDescription>
                  Healthcare providers get instant access to authorized patient records with analytics
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 dark:text-white">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto dark:text-gray-300">
              Choose the plan that's right for you
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Basic Plan */}
            <Card className="border-2 hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-2xl">Basic Plan</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Free</span>
                </div>
                <p className="text-sm text-gray-500 mt-2 dark:text-gray-400">Free forever</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm dark:text-gray-300">Perfect for personal health record management</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Unlimited medical record storage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>QR code generation and sharing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Basic AI health insights</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>End-to-end encryption</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Mobile responsive design</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Basic multilingual support</span>
                  </li>
                </ul>
                <Button className="w-full mt-6" variant="outline" onClick={() => navigate('/patient-register')}>Get Started Free</Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="border-2 border-blue-500 hover:shadow-2xl transition-all duration-300 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-1">
                  Most Popular
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Premium Plan</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$9.99</span>
                  <span className="text-gray-600 dark:text-gray-300"> per month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm dark:text-gray-300">Advanced AI features with appointment booking</p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span className="font-medium">Everything in Basic Plan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span className="font-medium">Advanced AI Assistant</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Doctor search within 10 km radius</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Automated appointment booking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Priority customer support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Advanced health analytics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Smart health reminders</span>
                  </li>
                </ul>
                <Button className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600" onClick={() => navigate('/patient-register')}>Upgrade to Premium</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 dark:bg-gray-950">
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
    </div>
  );
}
