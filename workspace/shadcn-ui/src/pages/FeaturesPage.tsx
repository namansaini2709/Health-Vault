import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, QrCode, Shield, Smartphone, UserCheck, Stethoscope, ArrowRight, Lock, Zap, FileText, Users, BarChart, Bell, Cloud, Activity, Brain, Calendar, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';

export default function FeaturesPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-900 dark:text-white">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 dark:bg-gray-900/90 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                HealthVault
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={() => navigate('/')}>Back to Home</Button>
              <Button size="sm" onClick={() => navigate('/patient-register')}>Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200">
              Comprehensive Features
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 dark:text-white">
              Everything You Need for
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent block dark:from-blue-400 dark:to-indigo-400">
                Modern Healthcare
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto dark:text-gray-300">
              Powerful features designed to revolutionize how you manage and share medical records
            </p>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center dark:text-white">Core Features</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* QR Code Access */}
            <Card className="border-2 hover:shadow-xl transition-all dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <QrCode className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl dark:text-white">QR Code Access</CardTitle>
                    <CardDescription className="dark:text-gray-300">Instant medical history sharing</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Generate a unique QR code that gives healthcare providers instant access to your complete medical history. No apps, no delays - just scan and view.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>One-time or temporary access codes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Works in any hospital or clinic</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Automatic access logging</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Encryption */}
            <Card className="border-2 hover:shadow-xl transition-all dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl dark:text-white">End-to-End Encryption</CardTitle>
                    <CardDescription className="dark:text-gray-300">Bank-level security</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Your medical records are encrypted with AES-256 encryption before they leave your device. Only you hold the keys.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Client-side encryption</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>HIPAA compliant storage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Zero-knowledge architecture</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="border-2 hover:shadow-xl transition-all dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl dark:text-white">AI-Powered Insights</CardTitle>
                    <CardDescription className="dark:text-gray-300">Intelligent health analysis</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Advanced AI analyzes your medical records to provide personalized health insights and recommendations.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Automated health summaries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Risk factor identification</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Medication interaction alerts</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Mobile Access */}
            <Card className="border-2 hover:shadow-xl transition-all dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                    <Smartphone className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl dark:text-white">Access Anywhere</CardTitle>
                    <CardDescription className="dark:text-gray-300">Cross-platform availability</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Access your medical records from any device, anywhere in the world, 24/7. Your health data travels with you.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Web, iOS, and Android apps</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Offline viewing capability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span>Automatic cloud sync</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center dark:text-white">Advanced Capabilities</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <UserCheck className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-2" />
                <CardTitle className="dark:text-white">Patient Control</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">Full control over who can access your records and for how long. Revoke access anytime.</p>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <Stethoscope className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-2" />
                <CardTitle className="dark:text-white">Provider Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">Healthcare providers get dedicated dashboards with patient analytics and insights.</p>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <FileText className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-2" />
                <CardTitle className="dark:text-white">Document Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">Upload, organize, and categorize all types of medical documents in one place.</p>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <BarChart className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-2" />
                <CardTitle className="dark:text-white">Health Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">Visualize trends in your health data with interactive charts and graphs.</p>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <Bell className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-2" />
                <CardTitle className="dark:text-white">Smart Reminders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">Get notifications for medication refills, appointments, and health checkups.</p>
              </CardContent>
            </Card>

            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardHeader>
                <Users className="h-10 w-10 text-blue-600 dark:text-blue-400 mb-2" />
                <CardTitle className="dark:text-white">Family Sharing</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">Manage medical records for your entire family from a single account.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Healthcare?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who trust HealthVault with their medical records
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-blue-300 dark:hover:bg-gray-700" onClick={() => navigate('/patient-register')}>
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800" onClick={() => navigate('/pricing')}>
              View Pricing
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
