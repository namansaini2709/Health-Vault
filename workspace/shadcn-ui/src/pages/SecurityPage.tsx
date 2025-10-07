import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Shield, Lock, Key, Eye, EyeOff, UserCheck, FileCheck, Server, AlertTriangle, CheckCircle, Smartphone, Cloud, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SecurityPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
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
            <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-200">
              Bank-Level Security
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Your Health Data is
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent block">
                Protected by Design
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Military-grade encryption, zero-knowledge architecture, and complete patient control over medical records
            </p>
          </div>
        </div>
      </section>

      {/* Core Security Features */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Core Security Features</h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* End-to-End Encryption */}
            <Card className="border-2 border-green-200 hover:shadow-xl transition-all">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                    <Lock className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">End-to-End Encryption</CardTitle>
                    <CardDescription>AES-256 bit encryption</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Your medical records are encrypted on your device before they ever leave it. Files are encrypted using AES-256 encryption, the same standard used by banks and government agencies.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong>Client-side encryption:</strong> Files encrypted before upload</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong>Unique keys:</strong> Each file has its own encryption key</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong>Zero-knowledge:</strong> We cannot decrypt your files</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Patient-Only Access */}
            <Card className="border-2 border-blue-200 hover:shadow-xl transition-all">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Patient-Only Access</CardTitle>
                    <CardDescription>You control who sees your data</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Only you can decrypt and view your medical files. Healthcare providers can only see AI-generated summaries unless you explicitly grant them access.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong>No provider access:</strong> Doctors cannot decrypt your files</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong>Permission-based:</strong> Share only what you want</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong>Revokable access:</strong> Withdraw permissions anytime</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Google Authentication */}
            <Card className="border-2 border-purple-200 hover:shadow-xl transition-all">
              <CardHeader>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Key className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Google OAuth 2.0</CardTitle>
                    <CardDescription>Secure authentication</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Sign in securely using Google Authentication. We never store your Google password, and you benefit from Google's enterprise-grade security infrastructure.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong>OAuth 2.0:</strong> Industry-standard authentication</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong>No password storage:</strong> We never see your password</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <span><strong>2FA support:</strong> Use Google's two-factor auth</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">How Your Data is Protected</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">1. Encryption on Device</h3>
              <p className="text-gray-600">
                Files are encrypted with a unique key on your device before upload. The encryption happens locally in your browser.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cloud className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">2. Secure Storage</h3>
              <p className="text-gray-600">
                Encrypted files are stored in secure cloud storage. Even our servers cannot decrypt your files without your keys.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Key className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">3. Controlled Access</h3>
              <p className="text-gray-600">
                Only you hold the decryption keys. You decide who can access your records and for how long.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Security Measures */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Additional Security Measures</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Server className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Secure Infrastructure</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">AWS cloud infrastructure with redundancy and automatic failover</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Database className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Database Encryption</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">All database connections encrypted with TLS/SSL protocols</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileCheck className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Regular Audits</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">Third-party security audits and penetration testing</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <AlertTriangle className="h-10 w-10 text-blue-600 mb-2" />
                <CardTitle>Incident Response</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">24/7 monitoring with immediate breach notification protocols</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Privacy Guarantee */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Shield className="h-16 w-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Privacy Guarantee</h2>
            <p className="text-lg text-gray-600 mb-8">
              We believe your medical data belongs to you and only you. We've built HealthVault from the ground up
              with a zero-knowledge architecture, meaning we cannot access your files even if we wanted to.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <EyeOff className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold mb-2">We Can't See Your Files</h3>
                <p className="text-sm text-gray-600">Files are encrypted before leaving your device</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <UserCheck className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold mb-2">You Control Access</h3>
                <p className="text-sm text-gray-600">Grant and revoke permissions at will</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <Lock className="h-8 w-8 text-green-600 mb-3" />
                <h3 className="font-semibold mb-2">No Data Selling</h3>
                <p className="text-sm text-gray-600">We never sell or share your health data</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Your Health Data, Secured
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands who trust HealthVault to protect their most sensitive information
          </p>
          <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100" onClick={() => navigate('/patient-register')}>
            Get Started Securely
          </Button>
        </div>
      </section>
    </div>
  );
}
