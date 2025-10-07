import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MedicalRecord } from '@/lib/healthVault';
import { FileText, Calendar, Unlock, Eye, EyeOff, Trash2 } from 'lucide-react';
import { decryptFile, hexStringToKey, getKeyFromSession } from '@/lib/encryptionUtils';
import { toast } from 'sonner';

interface EncryptedRecordSummaryProps {
  records: MedicalRecord[];
  patientId?: string;
  onDelete?: (recordId: string) => void;
}

export default function EncryptedRecordSummary({ records, patientId, onDelete }: EncryptedRecordSummaryProps) {
  const [visibleRecords, setVisibleRecords] = useState<Record<string, boolean>>({});
  const [decryptedFiles, setDecryptedFiles] = useState<Record<string, File>>({});

  const toggleVisibility = (id: string) => {
    setVisibleRecords(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleDecryptAndPreview = async (record: MedicalRecord) => {
    try {
      console.log('Attempting to decrypt record:', record.id);

      // Check if record has encryption metadata
      if (!record.encryptionMetadata) {
        toast.error('No encryption metadata found for this record');
        return;
      }

      const { encryptionKey, iv, originalName, originalType } = record.encryptionMetadata;

      if (!encryptionKey || !iv) {
        toast.error('Incomplete encryption metadata');
        return;
      }

      // Try to get key from sessionStorage first
      let keyArrayBuffer = getKeyFromSession(record.id);

      // If not in session, use the key from the record (from database)
      if (!keyArrayBuffer) {
        console.log('Key not in session, using key from database');
        keyArrayBuffer = hexStringToKey(encryptionKey);
        // Optionally store it in session for future use
        // storeKeyInSession(encryptionKey, record.id);
      }

      console.log('Fetching encrypted file...');
      const response = await fetch(`http://localhost:5000${record.fileUrl}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const encryptedBlob = await response.blob();
      const encryptedFile = new File([encryptedBlob], record.fileName, { type: record.fileType });

      console.log('Decrypting file...');
      const decryptedFile = await decryptFile(
        encryptedFile,
        keyArrayBuffer,
        { iv, originalName, originalType }
      );

      console.log('File decrypted successfully!');
      console.log('Decrypted file details:', {
        name: decryptedFile.name,
        size: decryptedFile.size,
        type: decryptedFile.type
      });

      // Store decrypted file
      setDecryptedFiles(prev => ({
        ...prev,
        [record.id]: decryptedFile
      }));

      // Create object URL and open in new tab
      const url = URL.createObjectURL(decryptedFile);
      console.log('Created blob URL:', url);

      // Open in new tab
      window.open(url, '_blank');

      toast.success('File decrypted and opened successfully!');

      // Don't revoke URL immediately - give browser time to load the file
      // Clean up after 30 seconds
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } catch (error: any) {
      console.error('Failed to decrypt file:', error);
      toast.error(`Decryption failed: ${error.message || 'Unknown error'}`);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'prescription': 'bg-blue-100 text-blue-800',
      'lab-result': 'bg-green-100 text-green-800',
      'scan': 'bg-purple-100 text-purple-800',
      'report': 'bg-orange-100 text-orange-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Unlock className="h-5 w-5 text-green-600" />
          Encrypted Medical Records
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Record Summary Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Security</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map(record => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      {record.encryptionMetadata?.originalName || record.fileName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(record.category)}>
                      {record.category.replace('-', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Unlock className="h-4 w-4 text-green-600" />
                      <span className="text-xs">Encrypted</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(record.uploadDate)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDecryptAndPreview(record)}
                      >
                        <Unlock className="h-4 w-4 mr-2" />
                        Decrypt & View
                      </Button>
                      {onDelete && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this record?')) {
                              onDelete(record.id);
                              toast.success('Record deleted successfully');
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Preview for recent records */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Recent Records</h3>
            {records.slice(0, 3).map(record => (
              <Card key={record.id || `temp-${record.fileName}`} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Unlock className="h-4 w-4 text-green-600" />
                      <p className="font-medium truncate">
                        {record.encryptionMetadata?.originalName || record.fileName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {formatDate(record.uploadDate)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleVisibility(record.id)}
                  >
                    {visibleRecords[record.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {visibleRecords[record.id] && record.summary && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">{record.summary}</p>
                  </div>
                )}
                <div className="mt-3 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDecryptAndPreview(record)}
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    Decrypt & View
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
