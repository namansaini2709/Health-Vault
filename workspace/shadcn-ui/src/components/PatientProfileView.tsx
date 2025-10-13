import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Eye, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { AccessRequest, getDecryptionKey } from '@/lib/accessControlService';
import { HealthVaultService, MedicalRecord } from '@/lib/healthVault';
import { decryptFile, hexStringToKey } from '@/lib/encryptionUtils';
import RecordSummary from './RecordSummary';

interface PatientProfileViewProps {
  accessRequest: AccessRequest;
  doctorId: string;
  onBack: () => void;
}

export default function PatientProfileView({ accessRequest, doctorId, onBack }: PatientProfileViewProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingFile, setViewingFile] = useState<{ url: string; type: string; name: string } | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  useEffect(() => {
    fetchPatientRecords();
  }, [accessRequest.patientId]);

  const fetchPatientRecords = async () => {
    try {
      setLoading(true);
      const data = await HealthVaultService.getMedicalRecords(accessRequest.patientId);
      setRecords(data);
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Failed to load patient records');
    } finally {
      setLoading(false);
    }
  };

  const refreshPatientData = async () => {
    try {
      // Force regenerate AI summaries for all records with PDF content extraction
      await HealthVaultService.generatePatientSummaries(accessRequest.patientId, true);

      // Fetch the updated records with new summaries
      const data = await HealthVaultService.getMedicalRecords(accessRequest.patientId);
      setRecords(data);
    } catch (error) {
      console.error('Error refreshing patient data:', error);
      throw error;
    }
  };

  const handleViewFile = async (record: MedicalRecord) => {
    setDecrypting(true);
    try {
      // Fetch the encrypted file
      const response = await fetch(`http://localhost:5001${record.fileUrl}`);
      const encryptedBlob = await response.blob();
      const encryptedFile = new File([encryptedBlob], record.fileName, { type: record.fileType });

      // Try to get decryption key from access request first
      let keyData = accessRequest.encryptionKeys.find(k => k.recordId === record.id);

      // If not found in access request, fetch from API (for newly added records)
      if (!keyData) {
        try {
          keyData = await getDecryptionKey(doctorId, accessRequest.patientId, record.id);
        } catch (error) {
          console.error('Error fetching decryption key:', error);
          toast.error('Decryption key not found for this record');
          return;
        }
      }

      // Convert hex string key to ArrayBuffer
      const decryptionKey = hexStringToKey(keyData.key);

      // Decrypt the file
      const decryptedFile = await decryptFile(encryptedFile, decryptionKey, {
        iv: keyData.iv,
        originalName: keyData.originalFileName,
        originalType: keyData.originalFileType
      });

      // Create object URL for viewing
      const fileUrl = URL.createObjectURL(decryptedFile);

      setViewingFile({
        url: fileUrl,
        type: decryptedFile.type,
        name: decryptedFile.name
      });

      toast.success('File decrypted successfully');
    } catch (error) {
      console.error('Error decrypting file:', error);
      toast.error('Failed to decrypt file');
    } finally {
      setDecrypting(false);
    }
  };

  const handleViewSummary = (record: MedicalRecord) => {
    setSelectedRecord(record);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      'prescription': 'bg-blue-100 text-blue-800',
      'lab-result': 'bg-green-100 text-green-800',
      'scan': 'bg-purple-100 text-purple-800',
      'report': 'bg-orange-100 text-orange-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patients
        </Button>
      </div>

      {/* Patient Info Card */}
      <Card className="border-2 border-green-200 dark:border-green-700 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl dark:text-white">{accessRequest.patientName}</CardTitle>
          <CardDescription className="dark:text-gray-300">{accessRequest.patientEmail}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{records.length}</p>
              <p className="text-sm text-blue-600 dark:text-blue-300">Medical Records</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
              <Eye className="h-8 w-8 mx-auto mb-2 text-green-600 dark:text-green-400" />
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">Full Access</p>
              <p className="text-sm text-green-600 dark:text-green-300">Can View Files</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
              <Brain className="h-8 w-8 mx-auto mb-2 text-purple-600 dark:text-purple-400" />
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{records.filter(r => r.aiSummary).length}</p>
              <p className="text-sm text-purple-600 dark:text-purple-300">AI Summaries</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Medical Records and AI Summary */}
      <Tabs defaultValue="records" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="records">Medical Records</TabsTrigger>
          <TabsTrigger value="ai-summary">AI Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="records">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">Medical Records</CardTitle>
              <CardDescription className="dark:text-gray-300">Click on a record to view details or decrypt files</CardDescription>
            </CardHeader>
            <CardContent>
              {records.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p>No medical records available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {records.map((record) => (
                    <Card key={record.id} className="border hover:border-blue-300 dark:hover:border-blue-600 transition-colors dark:bg-gray-700 dark:border-gray-600">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                              <h4 className="font-semibold dark:text-white">{record.fileName}</h4>
                              <Badge className={getCategoryColor(record.category)}>
                                {record.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Uploaded on {formatDate(record.uploadDate)}
                            </p>
                            {record.summary && (
                              <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 line-clamp-2">
                                {record.summary}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => handleViewFile(record)}
                              size="sm"
                              disabled={decrypting}
                              className="whitespace-nowrap"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              {decrypting ? 'Decrypting...' : 'View File'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-summary">
          <RecordSummary records={records} onReload={refreshPatientData} />
        </TabsContent>
      </Tabs>

      {/* File Viewer Dialog */}
      <Dialog open={!!viewingFile} onOpenChange={() => setViewingFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">{viewingFile?.name}</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              Decrypted medical record file preview
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            {viewingFile && (
              <>
                {viewingFile.type.startsWith('image/') && (
                  <img src={viewingFile.url} alt={viewingFile.name} className="w-full" />
                )}
                {viewingFile.type === 'application/pdf' && (
                  <iframe
                    src={viewingFile.url}
                    className="w-full h-[70vh]"
                    title={viewingFile.name}
                  />
                )}
                {!viewingFile.type.startsWith('image/') && viewingFile.type !== 'application/pdf' && (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                    <p className="text-gray-600 dark:text-gray-300">Preview not available for this file type</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">File type: {viewingFile.type}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Summary Dialog */}
      {selectedRecord && (
        <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto dark:bg-gray-800 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="dark:text-white">AI Summary - {selectedRecord.fileName}</DialogTitle>
              <DialogDescription className="dark:text-gray-300">
                AI-generated clinical insights from this medical record
              </DialogDescription>
            </DialogHeader>
            <RecordSummary record={selectedRecord} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
