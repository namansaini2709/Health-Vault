import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UserCheck, Shield, Clock, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AccessRequest,
  getPatientPendingRequests,
  getPatientActivePermissions,
  grantAccess,
  denyAccess,
  revokeAccess,
  formatDate,
  EncryptionKey
} from '@/lib/accessControlService';
import { HealthVaultService, MedicalRecord } from '@/lib/healthVault';
import { getKeyFromSession } from '@/lib/encryptionUtils';

interface AccessManagementProps {
  patientId: string;
}

export default function AccessManagement({ patientId }: AccessManagementProps) {
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [activePermissions, setActivePermissions] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const [showDenyDialog, setShowDenyDialog] = useState(false);

  useEffect(() => {
    fetchAccessData();
  }, [patientId]);

  const fetchAccessData = async () => {
    try {
      setLoading(true);
      const [pending, active] = await Promise.all([
        getPatientPendingRequests(patientId),
        getPatientActivePermissions(patientId)
      ]);
      setPendingRequests(pending);
      setActivePermissions(active);
    } catch (error) {
      console.error('Error fetching access data:', error);
      toast.error('Failed to load access permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async (request: AccessRequest) => {
    setSelectedRequest(request);
    setShowGrantDialog(true);
  };

  const confirmGrantAccess = async () => {
    if (!selectedRequest) return;

    try {
      toast.loading('Granting access...');

      // Fetch all patient records
      const records: MedicalRecord[] = await HealthVaultService.getMedicalRecords(patientId);

      // Package encryption keys for all records
      const encryptionKeys: EncryptionKey[] = records.map(record => {
        // Get encryption metadata from record
        const metadata = record.encryptionMetadata;
        if (!metadata) {
          console.warn(`Record ${record.id} has no encryption metadata`);
          return null;
        }

        return {
          recordId: record.id,
          key: metadata.encryptionKey,
          iv: metadata.iv,
          originalFileName: metadata.originalName,
          originalFileType: metadata.originalType
        };
      }).filter(Boolean) as EncryptionKey[];

      // Grant access with encryption keys
      await grantAccess(selectedRequest._id, encryptionKeys);

      toast.success(`Access granted to Dr. ${selectedRequest.doctorName}`);
      setShowGrantDialog(false);
      setSelectedRequest(null);
      fetchAccessData(); // Refresh the lists
    } catch (error) {
      console.error('Error granting access:', error);
      toast.error('Failed to grant access');
    }
  };

  const handleDenyAccess = async (request: AccessRequest) => {
    setSelectedRequest(request);
    setShowDenyDialog(true);
  };

  const confirmDenyAccess = async () => {
    if (!selectedRequest) return;

    try {
      await denyAccess(selectedRequest._id);
      toast.success(`Access denied for Dr. ${selectedRequest.doctorName}`);
      setShowDenyDialog(false);
      setSelectedRequest(null);
      fetchAccessData();
    } catch (error) {
      console.error('Error denying access:', error);
      toast.error('Failed to deny access');
    }
  };

  const handleRevokeAccess = async (request: AccessRequest) => {
    setSelectedRequest(request);
    setShowRevokeDialog(true);
  };

  const confirmRevokeAccess = async () => {
    if (!selectedRequest) return;

    try {
      await revokeAccess(selectedRequest._id);
      toast.success(`Access revoked for Dr. ${selectedRequest.doctorName}`);
      setShowRevokeDialog(false);
      setSelectedRequest(null);
      fetchAccessData();
    } catch (error) {
      console.error('Error revoking access:', error);
      toast.error('Failed to revoke access');
    }
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
      {/* Pending Requests Section */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                Pending Access Requests
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Doctors requesting access to your medical records
              </CardDescription>
            </div>
            {pendingRequests.length > 0 && (
              <Badge variant="secondary">{pendingRequests.length} Pending</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No pending access requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <Card key={request._id} className="border-2 border-yellow-200 dark:border-yellow-700 dark:bg-gray-700">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300">
                            {request.doctorName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-lg dark:text-white">Dr. {request.doctorName}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{request.doctorSpecialty}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Requested on {formatDate(request.requestedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleGrantAccess(request)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Grant Access
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDenyAccess(request)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Deny
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

      {/* Active Permissions Section */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <UserCheck className="h-5 w-5 text-green-600 dark:text-green-500" />
                Active Permissions
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Doctors who currently have access to your records
              </CardDescription>
            </div>
            {activePermissions.length > 0 && (
              <Badge className="bg-green-100 text-green-800">{activePermissions.length} Active</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activePermissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No active permissions</p>
              <p className="text-sm mt-1">You haven't granted access to any doctors yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activePermissions.map((request) => (
                <Card key={request._id} className="border-2 border-green-200 dark:border-green-700 dark:bg-gray-700">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300">
                            {request.doctorName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold text-lg flex items-center gap-2 dark:text-white">
                            Dr. {request.doctorName}
                            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Access Granted
                            </Badge>
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{request.doctorSpecialty}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Access granted on {formatDate(request.respondedAt || request.requestedAt)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRevokeAccess(request)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Revoke Access
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grant Access Dialog */}
      <AlertDialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Grant Access to Dr. {selectedRequest?.doctorName}?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-300">
              This will allow Dr. {selectedRequest?.doctorName} to view and decrypt all your medical records.
              They will be able to access:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All uploaded medical files</li>
                <li>AI-generated summaries</li>
                <li>Your personal health information</li>
              </ul>
              <p className="mt-3 font-medium">You can revoke this access at any time.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmGrantAccess}
              className="bg-green-600 hover:bg-green-700"
            >
              Grant Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deny Access Dialog */}
      <AlertDialog open={showDenyDialog} onOpenChange={setShowDenyDialog}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Deny Access Request?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-300">
              Dr. {selectedRequest?.doctorName} will not be able to access your medical records.
              You can always grant access later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDenyAccess}
              className="bg-red-600 hover:bg-red-700"
            >
              Deny Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Access Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Revoke Access for Dr. {selectedRequest?.doctorName}?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 dark:text-gray-300">
              <p>This will immediately remove Dr. {selectedRequest?.doctorName}'s access to your medical records.</p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded p-3 mt-2">
                <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Warning
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-1">
                  They will no longer be able to view or decrypt your files. This action will take effect immediately.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRevokeAccess}
              className="bg-red-600 hover:bg-red-700"
            >
              Revoke Access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
