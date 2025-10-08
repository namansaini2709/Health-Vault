import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  AccessRequest,
  getDoctorRequestHistory,
  markRequestAsSeen,
  formatDate,
  getStatusColor,
  getStatusIcon
} from '@/lib/accessControlService';

interface RequestHistoryProps {
  doctorId: string;
  unseenCount: number;
  onUnseenUpdate: () => void;
}

export default function RequestHistory({ doctorId, unseenCount, onUnseenUpdate }: RequestHistoryProps) {
  const [history, setHistory] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [doctorId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await getDoctorRequestHistory(doctorId);
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load request history');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSeen = async (requestId: string) => {
    try {
      await markRequestAsSeen(requestId);
      // Update local state
      setHistory(prev => prev.map(req =>
        req._id === requestId ? { ...req, seenByDoctor: true } : req
      ));
      // Notify parent to update unseen count
      onUnseenUpdate();
    } catch (error) {
      console.error('Error marking as seen:', error);
      toast.error('Failed to mark as seen');
    }
  };

  const handleMarkAllAsSeen = async () => {
    try {
      const unseenRequests = history.filter(req => !req.seenByDoctor);
      await Promise.all(unseenRequests.map(req => markRequestAsSeen(req._id)));
      setHistory(prev => prev.map(req => ({ ...req, seenByDoctor: true })));
      onUnseenUpdate();
      toast.success('All requests marked as seen');
    } catch (error) {
      console.error('Error marking all as seen:', error);
      toast.error('Failed to mark all as seen');
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
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <History className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                Request History
                {unseenCount > 0 && (
                  <Badge className="bg-red-500 text-white ml-2">{unseenCount} New</Badge>
                )}
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                Track all your patient access request responses
              </CardDescription>
            </div>
            {unseenCount > 0 && (
              <Button onClick={handleMarkAllAsSeen} variant="outline" size="sm">
                Mark All as Seen
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <History className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No request history yet</p>
              <p className="text-sm mt-1">Your access request responses will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((request) => (
                <Card
                  key={request._id}
                  className={`border-2 ${
                    !request.seenByDoctor
                      ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  } dark:bg-gray-700`}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg dark:text-white">{request.patientName}</h4>
                          <Badge className={getStatusColor(request.status)}>
                            <span className="mr-1">{getStatusIcon(request.status)}</span>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </Badge>
                          {!request.seenByDoctor && (
                            <Badge className="bg-red-500 text-white">New</Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300 mt-2">
                          <div>
                            <span className="font-medium">Requested:</span> {formatDate(request.requestedAt)}
                          </div>
                          {request.respondedAt && (
                            <div>
                              <span className="font-medium">Responded:</span> {formatDate(request.respondedAt)}
                            </div>
                          )}
                        </div>

                        {request.status === 'granted' && (
                          <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded text-sm text-green-700 dark:text-green-300">
                            <CheckCircle className="h-4 w-4 inline mr-1" />
                            You can now access this patient's medical records
                          </div>
                        )}

                        {request.status === 'denied' && (
                          <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded text-sm text-red-700 dark:text-red-300">
                            <XCircle className="h-4 w-4 inline mr-1" />
                            Access request was denied by the patient
                          </div>
                        )}

                        {request.status === 'revoked' && (
                          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-sm text-gray-700 dark:text-gray-300">
                            <RefreshCw className="h-4 w-4 inline mr-1" />
                            Access was revoked by the patient
                          </div>
                        )}
                      </div>

                      {!request.seenByDoctor && (
                        <Button
                          onClick={() => handleMarkAsSeen(request._id)}
                          variant="outline"
                          size="sm"
                        >
                          Mark as Seen
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
