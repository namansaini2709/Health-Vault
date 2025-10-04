import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, QrCode, Keyboard } from 'lucide-react';
import { toast } from 'sonner';

interface QRScannerProps {
  onScan: (qrCode: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [manualCode, setManualCode] = useState('');
  const [isManualEntry, setIsManualEntry] = useState(false);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    } else {
      toast.error('Please enter a valid QR code');
    }
  };

  // Simulate QR scanning for demo purposes with a more realistic approach
  const simulateQRScan = () => {
    // For demo, we'll explain that in a real app this would scan an actual QR code
    toast.info('In a real application, this would scan an actual QR code from a patient. For this demo, please enter a QR code manually.');
    setIsManualEntry(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Scan Patient QR Code</CardTitle>
              <CardDescription>
                Scan or manually enter the patient's health QR code
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isManualEntry ? (
            <>
              {/* QR Scanner Simulation */}
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    Position the QR code within the frame
                  </p>
                  <div className="border-2 border-dashed border-blue-500 rounded-lg p-8">
                    <p className="text-sm text-gray-500">QR Scanner Active</p>
                  </div>
                </div>

                {/* Demo Button */}
                <Button onClick={simulateQRScan} className="w-full">
                  <QrCode className="h-4 w-4 mr-2" />
                  Scan QR Code (Requires Camera)
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setIsManualEntry(true)}
                  className="w-full"
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  Enter Code Manually
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Manual Entry */}
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="qr-code">QR Code</Label>
                  <Input
                    id="qr-code"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Enter QR code (e.g., HV_xxxxxx_xxxx)"
                    className="font-mono"
                    autoFocus
                  />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>How to get a QR code:</strong><br />
                    1. Ask the patient to log in to their HealthVault account<br />
                    2. Have them click "Show QR Code" in their dashboard<br />
                    3. Copy the QR code text or scan the displayed QR image
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={!manualCode.trim()}>
                    Access Records
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsManualEntry(false)}
                  >
                    Back to Scanner
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Instructions:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Ensure patient consent before scanning</li>
              <li>• QR codes are unique to each patient</li>
              <li>• Access is logged for security purposes</li>
              <li>• Contact IT support if scanning fails</li>
            </ul>
          </div>

          <Button variant="outline" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}