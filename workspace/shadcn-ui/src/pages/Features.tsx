import { QrCode, Shield, Bot, UserCheck } from 'lucide-react';

export default function Features() {
  return (
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
  );
}