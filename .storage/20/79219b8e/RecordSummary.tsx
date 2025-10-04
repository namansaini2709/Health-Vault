import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertTriangle, Pill, FileText, TrendingUp } from 'lucide-react';
import { MedicalRecord } from '@/lib/healthVault';
import { AISummarizer, MedicalSummary } from '@/lib/aiSummarizer';
import { useMemo } from 'react';

interface RecordSummaryProps {
  records: MedicalRecord[];
}

export default function RecordSummary({ records }: RecordSummaryProps) {
  const summary: MedicalSummary = useMemo(() => {
    return AISummarizer.generatePatientSummary(records);
  }, [records]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data to analyze</h3>
          <p className="text-gray-600">Upload medical records to see AI-powered insights</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI Health Summary
          </CardTitle>
          <CardDescription>
            AI-powered insights from your medical records • Last updated: {formatDate(summary.lastUpdated)}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Key Findings */}
      {summary.keyFindings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Key Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.keyFindings.map((finding, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">{finding}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conditions */}
      {summary.conditions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Medical Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.conditions.map((condition, index) => (
                <Badge key={index} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {condition}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medications */}
      {summary.medications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-green-600" />
              Current Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.medications.map((medication, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{medication}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Factors */}
      {summary.riskFactors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
              Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.riskFactors.map((risk, index) => (
                <div key={index} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{risk}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {summary.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.recommendations.map((recommendation, index) => (
                <div key={index} className="bg-purple-50 p-3 rounded-lg">
                  <p className="text-sm text-purple-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Record Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Record Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{records.length}</p>
              <p className="text-sm text-blue-800">Total Records</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {records.filter(r => r.category === 'prescription').length}
              </p>
              <p className="text-sm text-green-800">Prescriptions</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {records.filter(r => r.category === 'lab-result').length}
              </p>
              <p className="text-sm text-purple-800">Lab Results</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">
                {records.filter(r => r.category === 'scan').length}
              </p>
              <p className="text-sm text-orange-800">Scans</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-800 font-medium mb-1">Medical Disclaimer</p>
              <p className="text-xs text-yellow-700">
                This AI summary is for informational purposes only and should not replace professional medical advice. 
                Always consult with qualified healthcare providers for medical decisions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}