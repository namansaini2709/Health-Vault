import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, FileText, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

// Simple client-side encryption/decryption functions
// In a real application, use a proper library like Web Crypto API
const encryptFile = async (file: File): Promise<Blob> => {
  // In a real implementation, use proper encryption with Web Crypto API
  // This is a simplified version to demonstrate the concept
  
  // Convert the file to an ArrayBuffer
  const buffer = await file.arrayBuffer();
  
  // Using a simple XOR encryption with a generated key for demonstration
  // In production, implement proper encryption using Web Crypto API
  const key = crypto.getRandomValues(new Uint8Array(16));
  
  const encryptedBuffer = new Uint8Array(buffer);
  for (let i = 0; i < encryptedBuffer.length; i++) {
    encryptedBuffer[i] ^= key[i % key.length];
  }
  
  // In a real app, the key should be securely derived and handled
  // For now, we're just demonstrating the principle
  return new Blob([encryptedBuffer], { type: file.type });
};

const generateEncryptionKey = (): string => {
  // In a real implementation, this would be properly generated
  // and either stored in a secure vault or derived from user credentials
  return 'demo-key-' + Math.random().toString(36).substring(2, 15);
};

interface FileUploadProps {
  onUpload: (file: File, category: string) => void;
  onClose: () => void;
}

export default function FileUpload({ onUpload, onClose }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!category) {
      toast.error('Please select a document category');
      return;
    }

    // File validation
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Unsupported file type. Please upload PDF, JPG, PNG, GIF, or WebP files.');
      return;
    }

    if (selectedFile.size > maxSize) {
      toast.error(`File size too large. Maximum allowed size is ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    // Pass the original file to parent - encryption will be handled by PatientDashboard
    onUpload(selectedFile, category);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Lock className="h-5 w-5" />
                Upload Medical Record
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Add a new document to your health vault
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-2">
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto" />
                <p className="font-medium dark:text-white">{selectedFile.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{formatFileSize(selectedFile.size)}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto" />
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Drag and drop your file here, or{' '}
                  <label className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer">
                    browse
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Supports PDF, Images, and Documents
                </p>
              </div>
            )}
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category">Document Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="prescription">Prescription</SelectItem>
                <SelectItem value="lab-result">Lab Result</SelectItem>
                <SelectItem value="scan">Medical Scan</SelectItem>
                <SelectItem value="report">Medical Report</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
            <Lock className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-blue-800 dark:text-blue-200">Your file will be encrypted before upload for enhanced privacy</span>
          </div>

          {/* Upload Button */}
          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !category || isEncrypting}
              className="flex-1"
            >
              {isEncrypting ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                  Encrypting...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Encrypt & Upload
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}