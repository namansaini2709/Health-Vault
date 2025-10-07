import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Heart, Pill, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { MedicalRecord } from '@/lib/healthVault';
import { AISummarizer, MedicalSummary } from '@/lib/aiSummarizer';
import { useMemo } from 'react';

interface PatientHealthSummaryProps {
  records: MedicalRecord[];
}

export default function PatientHealthSummary({ records }: PatientHealthSummaryProps) {
  const summary: MedicalSummary = useMemo(() => {
    // Check if any records have real AI summaries
    const recordsWithAI = records.filter(r => r.aiSummary && r.aiSummary.text);

    if (recordsWithAI.length > 0) {
      // Aggregate all AI summaries from records
      const aggregated: MedicalSummary = {
        keyFindings: [],
        conditions: [],
        medications: [],
        recommendations: [],
        riskFactors: [],
        lastUpdated: new Date().toISOString()
      };

      recordsWithAI.forEach(record => {
        if (record.aiSummary) {
          aggregated.keyFindings.push(...(record.aiSummary.keyFindings || []));
          aggregated.conditions.push(...(record.aiSummary.conditions || []));
          aggregated.medications.push(...(record.aiSummary.medications || []));
          aggregated.recommendations.push(...(record.aiSummary.recommendations || []));
          aggregated.riskFactors.push(...(record.aiSummary.riskFactors || []));
        }
      });

      // Remove duplicates
      aggregated.keyFindings = [...new Set(aggregated.keyFindings)];
      aggregated.conditions = [...new Set(aggregated.conditions)];
      aggregated.medications = [...new Set(aggregated.medications)];
      aggregated.recommendations = [...new Set(aggregated.recommendations)];
      aggregated.riskFactors = [...new Set(aggregated.riskFactors)];

      return aggregated;
    }

    // Fallback to mock summarizer
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No health data yet</h3>
          <p className="text-gray-600">Upload your medical records to see your personalized health summary</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Brain className="h-5 w-5 text-blue-600" />
            Your Health Summary
          </CardTitle>
          <CardDescription className="text-blue-700">
            Easy-to-understand insights from your medical records
          </CardDescription>
          <p className="text-xs text-blue-600 mt-2">Last updated: {formatDate(summary.lastUpdated)}</p>
        </CardHeader>
      </Card>

      {/* Quick Overview */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700">{records.length}</p>
            <p className="text-sm text-green-600">Records Uploaded</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 text-center">
            <Pill className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-700">{summary.medications.length}</p>
            <p className="text-sm text-orange-600">Current Medications</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-700">{summary.conditions.length}</p>
            <p className="text-sm text-purple-600">Health Conditions</p>
          </CardContent>
        </Card>
      </div>

      {/* Your Medications */}
      {summary.medications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Pill className="h-5 w-5 text-green-600" />
              Your Medications
            </CardTitle>
            <CardDescription>Medicines you're currently taking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.medications.map((medication, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span className="text-sm font-medium text-gray-800">{medication}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              💡 Remember to take your medications as prescribed by your doctor.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Health Conditions */}
      {summary.conditions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="h-5 w-5 text-red-600" />
              Your Health Conditions
            </CardTitle>
            <CardDescription>What your records show</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.conditions.map((condition, index) => (
                <Badge key={index} className="bg-red-50 text-red-700 border-red-200 text-sm">
                  {condition}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              💡 Keep track of your conditions and discuss any changes with your healthcare provider.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Important Notes */}
      {summary.keyFindings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-blue-600" />
              Important Notes
            </CardTitle>
            <CardDescription>Key highlights from your medical records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.keyFindings.slice(0, 5).map((finding, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{finding}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Things to Watch For */}
      {summary.riskFactors.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-yellow-900">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Things to Watch For
            </CardTitle>
            <CardDescription className="text-yellow-700">
              Areas where you might need extra attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.riskFactors.map((risk, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{risk}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {summary.recommendations.length > 0 && (
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-purple-900">
              <Brain className="h-5 w-5 text-purple-600" />
              Health Tips for You
            </CardTitle>
            <CardDescription className="text-purple-700">
              Simple steps to stay healthy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-white rounded-lg">
                  <div className="flex items-center justify-center w-6 h-6 bg-purple-600 text-white rounded-full flex-shrink-0 text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Record Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Record Types</CardTitle>
          <CardDescription>What documents you've uploaded</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{records.length}</p>
              <p className="text-xs text-blue-800">Total Records</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {records.filter(r => r.category === 'prescription').length}
              </p>
              <p className="text-xs text-green-800">Prescriptions</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {records.filter(r => r.category === 'lab-result').length}
              </p>
              <p className="text-xs text-purple-800">Lab Results</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">
                {records.filter(r => r.category === 'scan').length}
              </p>
              <p className="text-xs text-orange-800">Scans</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Disclaimer */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">📋 Please Note</p>
              <p className="text-xs text-blue-700">
                This summary is created by AI to help you understand your health records. It's for information only
                and should not replace advice from your doctor. Always talk to your healthcare provider about your health
                concerns and before making any medical decisions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
