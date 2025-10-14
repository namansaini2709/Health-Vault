import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Crown, 
  Calendar, 
  MapPin, 
  FileText, 
  Shield, 
  Clock, 
  CheckCircle,
  XCircle
} from 'lucide-react';

interface PlanFeature {
  name: string;
  available: boolean;
  description?: string;
}

interface CurrentPlanProps {
  tier: 'free' | 'premium';
  nearbyScansRemaining: number;
  scanResetAt: Date;
}

const CurrentPlan: React.FC<CurrentPlanProps> = ({ 
  tier = 'free', 
  nearbyScansRemaining = 0, 
  scanResetAt = new Date(Date.now() + 30*24*60*60*1000) // 30 days from now
}) => {
  const isPremium = tier === 'premium';
  
  const features: PlanFeature[] = [
    { 
      name: 'Medical Record Storage', 
      available: true, 
      description: 'Store unlimited medical records securely' 
    },
    { 
      name: 'QR Code Sharing', 
      available: true, 
      description: 'Share your health records with QR code' 
    },
    { 
      name: 'AI Health Insights', 
      available: true, 
      description: 'Get personalized health recommendations' 
    },
    { 
      name: 'Doctor Search & Booking', 
      available: isPremium, 
      description: 'Find and book appointments with nearby doctors' 
    },
    { 
      name: 'Advanced Encryption', 
      available: isPremium, 
      description: 'Enhanced security for sensitive records' 
    },
    { 
      name: 'Priority Support', 
      available: isPremium, 
      description: 'Get help when you need it' 
    },
  ];

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isPremium ? (
                <>
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <span className="text-2xl">Premium Plan</span>
                </>
              ) : (
                <span className="text-2xl">Free Plan</span>
              )}
            </CardTitle>
            <CardDescription>
              {isPremium 
                ? "Full access to all HealthVault features" 
                : "Basic access to HealthVault features"}
            </CardDescription>
          </div>
          <Badge className={isPremium ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"}>
            {isPremium ? "PREMIUM" : "FREE"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Nearby Doctor Scans
            </h3>
            <span className="text-sm font-semibold">
              {nearbyScansRemaining} scans remaining
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${Math.min(100, (nearbyScansRemaining / 500) * 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Resets on {formatDate(scanResetAt)}
          </p>
        </div>

        <div className="mb-6">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Plan Features
          </h3>
          <div className="space-y-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                {feature.available ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${feature.available ? 'text-gray-900' : 'text-gray-500'}`}>
                    {feature.name}
                  </p>
                  {feature.description && (
                    <p className="text-sm text-gray-500">
                      {feature.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t">
          {isPremium ? (
            <div className="text-center text-sm text-green-600 font-medium">
              <CheckCircle className="h-4 w-4 inline mr-1" />
              You have premium access to all features
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Upgrade to Premium for full access to advanced features
              </p>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Premium
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CurrentPlan;