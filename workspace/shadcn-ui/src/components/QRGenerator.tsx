import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Download, Share2 } from 'lucide-react';
import { Patient } from '@/lib/healthVault';
import { toast } from 'sonner';
import QRCode from 'qrcode';

interface QRGeneratorProps {
  patient: Patient;
  onClose: () => void;
}

export default function QRGenerator({ patient, onClose }: QRGeneratorProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    const generateQRCode = async () => {
      try {
        const url = await QRCode.toDataURL(patient.qrCode, {
          width: 200,
          margin: 2,
        });
        setQrCodeUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code', err);
        toast.error('Failed to generate QR code');
      }
    };

    generateQRCode();
  }, [patient.qrCode]);

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    const a = document.createElement('a');
    a.href = qrCodeUrl;
    a.download = `healthvault-qr-${patient.name.replace(/\s+/g, '-').toLowerCase()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('QR code downloaded successfully!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        // Fetch the blob from the data URL to share the image file
        const response = await fetch(qrCodeUrl);
        const blob = await response.blob();
        const file = new File([blob], `healthvault-qr-${patient.name.replace(/\s+/g, '-').toLowerCase()}.png`, { type: 'image/png' });

        await navigator.share({
          title: 'HealthVault QR Code',
          text: `My HealthVault QR Code for ${patient.name}`,
          files: [file],
        });
      } catch (error) {
        console.error('Error sharing QR code:', error);
        // Fallback to clipboard
        await navigator.clipboard.writeText(patient.qrCode);
        toast.success('QR code data copied to clipboard!');
      }
    } else {
      await navigator.clipboard.writeText(patient.qrCode);
      toast.success('QR code data copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Your Health QR Code</CardTitle>
              <CardDescription>
                Show this code to healthcare providers for instant access
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* QR Code Display */}
          <div className="flex justify-center">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="HealthVault QR Code" className="block" />
              ) : (
                <div className="w-[200px] h-[200px] bg-gray-200 animate-pulse" />
              )}
            </div>
          </div>

          {/* Patient Info */}
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">{patient.name}</h3>
            <p className="text-sm text-gray-600">Patient ID: {patient.id}</p>
            <p className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded break-all">
              {patient.qrCode}
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How to use:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Show this QR code to your healthcare provider</li>
              <li>• They can scan it to access your medical records</li>
              <li>• Your consent is required before sharing any data</li>
              <li>• Keep this code secure and do not share publicly</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleDownload} variant="outline" className="flex-1" disabled={!qrCodeUrl}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1" disabled={!qrCodeUrl}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
