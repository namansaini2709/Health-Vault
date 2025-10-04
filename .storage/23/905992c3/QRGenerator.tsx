import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Download, Share2 } from 'lucide-react';
import { Patient } from '@/lib/healthVault';
import { toast } from 'sonner';

interface QRGeneratorProps {
  patient: Patient;
  onClose: () => void;
}

export default function QRGenerator({ patient, onClose }: QRGeneratorProps) {
  // Generate QR code as SVG (simple implementation for demo)
  const generateQRCodeSVG = (data: string) => {
    // This is a simplified QR code representation
    // In production, you'd use a proper QR code library like qrcode
    const size = 200;
    const modules = 25;
    const moduleSize = size / modules;
    
    // Create a simple pattern based on the data
    const pattern = [];
    for (let i = 0; i < modules; i++) {
      pattern[i] = [];
      for (let j = 0; j < modules; j++) {
        // Simple hash-based pattern generation
        const hash = (data.charCodeAt((i + j) % data.length) + i * j) % 2;
        pattern[i][j] = hash === 1;
      }
    }

    let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
    svg += `<rect width="${size}" height="${size}" fill="white"/>`;
    
    for (let i = 0; i < modules; i++) {
      for (let j = 0; j < modules; j++) {
        if (pattern[i][j]) {
          svg += `<rect x="${j * moduleSize}" y="${i * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
        }
      }
    }
    
    svg += '</svg>';
    return svg;
  };

  const qrCodeSVG = generateQRCodeSVG(patient.qrCode);

  const handleDownload = () => {
    const blob = new Blob([qrCodeSVG], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `healthvault-qr-${patient.name.replace(/\s+/g, '-').toLowerCase()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('QR code downloaded successfully!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HealthVault QR Code',
          text: `My HealthVault QR Code: ${patient.qrCode}`,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(patient.qrCode);
        toast.success('QR code copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(patient.qrCode);
      toast.success('QR code copied to clipboard!');
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
              <div 
                dangerouslySetInnerHTML={{ __html: qrCodeSVG }}
                className="block"
              />
            </div>
          </div>

          {/* Patient Info */}
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">{patient.name}</h3>
            <p className="text-sm text-gray-600">Patient ID: {patient.id}</p>
            <p className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded">
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
              <li>• Keep this code secure and don't share publicly</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button onClick={handleDownload} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button onClick={handleShare} variant="outline" className="flex-1">
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