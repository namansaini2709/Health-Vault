import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Lock, Clock, AlertCircle } from 'lucide-react';
import { AccessRequest, formatDate } from '@/lib/accessControlService';

interface PendingRequestsProps {
  requests: AccessRequest[];
}

export default function PendingRequests({ requests }: PendingRequestsProps) {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">No Pending Requests</h3>
        <p className="text-gray-500 dark:text-gray-400">
          Your pending access requests will appear here
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Scan a patient's QR code to send a request
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {requests.map((request) => (
        <Card
          key={request._id}
          className="border-2 border-yellow-200 dark:border-yellow-700 bg-yellow-50/30 dark:bg-yellow-900/10 opacity-75 cursor-not-allowed dark:bg-gray-800/50"
        >
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xl">
                    {request.patientName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1 bg-yellow-500 dark:bg-yellow-600 rounded-full p-1">
                  <Lock className="h-4 w-4 text-white" />
                </div>
              </div>

              <div className="w-full">
                <h3 className="font-semibold text-lg text-gray-700 dark:text-gray-300">{request.patientName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{request.patientEmail}</p>
              </div>

              <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                <Clock className="h-3 w-3 mr-1" />
                Waiting for Permission
              </Badge>

              <div className="w-full pt-3 border-t border-yellow-200 dark:border-yellow-700">
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Clock className="h-4 w-4" />
                  <span>Requested {formatDate(request.requestedAt).split(',')[0]}</span>
                </div>
              </div>

              <div className="w-full bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                <p className="text-xs text-yellow-800 dark:text-yellow-300 flex items-center justify-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Cannot access until patient grants permission
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
