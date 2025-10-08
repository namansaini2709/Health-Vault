import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, FileText, Calendar, CheckCircle } from 'lucide-react';
import { AccessRequest, formatDate } from '@/lib/accessControlService';

interface MyPatientsProps {
  patients: AccessRequest[];
  onPatientClick: (request: AccessRequest) => void;
}

export default function MyPatients({ patients, onPatientClick }: MyPatientsProps) {
  if (patients.length === 0) {
    return (
      <div className="text-center py-12">
        <User className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">No Patients Yet</h3>
        <p className="text-gray-500 dark:text-gray-400">
          Patients with granted access will appear here
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
          Scan a patient's QR code to request access
        </p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {patients.map((request) => (
        <Card
          key={request._id}
          className="cursor-pointer hover:shadow-lg transition-all border-2 border-green-200 dark:border-green-700 hover:border-green-400 dark:hover:border-green-500 dark:bg-gray-800"
          onClick={() => onPatientClick(request)}
        >
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-300 text-xl">
                  {request.patientName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="w-full">
                <h3 className="font-semibold text-lg dark:text-white">{request.patientName}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">{request.patientEmail}</p>
              </div>

              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                <CheckCircle className="h-3 w-3 mr-1" />
                Access Granted
              </Badge>

              <div className="w-full pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Records
                  </span>
                  <span className="font-medium dark:text-white">{request.recordCount || 0}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Granted
                  </span>
                  <span className="font-medium text-xs dark:text-white">
                    {formatDate(request.respondedAt || request.requestedAt).split(',')[0]}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
