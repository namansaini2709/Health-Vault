import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Crown, Bot, MapPin, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Pricing() {
  const navigate = useNavigate();

  return (
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
              <Button className="w-full mt-8" variant="outline" onClick={() => navigate('/login')}>
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
  );
}