import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, Heart, Pill, AlertCircle, CheckCircle, FileText, RefreshCw } from 'lucide-react';
import { MedicalRecord } from '@/lib/healthVault';
import { AISummarizer, MedicalSummary } from '@/lib/aiSummarizer';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface PatientHealthSummaryProps {
  records: MedicalRecord[];
  onReload?: () => Promise<void>;
}

export default function PatientHealthSummary({ records, onReload }: PatientHealthSummaryProps) {
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = async () => {
    if (onReload) {
      setIsReloading(true);
      try {
        await onReload();
        toast.success('Summary refreshed!');
      } catch (error) {
        toast.error('Failed to refresh summary');
      } finally {
        setIsReloading(false);
      }
    }
  };

  // Check user role for displaying appropriate summary
  const userType = localStorage.getItem('healthvault_user_type');

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

  // Get combined summaries for display
  const combinedPatientSummary = useMemo(() => {
    const recordsWithSummaries = records.filter(r => r.aiSummary?.patientSummary);
    if (recordsWithSummaries.length === 0) return null;
    return recordsWithSummaries.map(r => r.aiSummary!.patientSummary).join(' ');
  }, [records]);

  const combinedDoctorSummary = useMemo(() => {
    const recordsWithSummaries = records.filter(r => r.aiSummary?.doctorSummary);
    if (recordsWithSummaries.length === 0) return null;
    return recordsWithSummaries.map(r => r.aiSummary!.doctorSummary).join(' ');
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
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4 dark:text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900 mb-2 dark:text-white">No health data yet</h3>
          <p className="text-gray-600 dark:text-gray-300">Upload your medical records to see your personalized health summary</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
                <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Your Health Summary
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-400">
                Easy-to-understand insights from your medical records
              </CardDescription>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Last updated: {formatDate(summary.lastUpdated)}</p>
            </div>
            {onReload && (
              <Button
                onClick={handleReload}
                variant="outline"
                size="sm"
                disabled={isReloading}
                className="ml-4"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isReloading ? 'animate-spin' : ''}`} />
                Reload
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Quick Overview */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{records.length}</p>
            <p className="text-sm text-green-600 dark:text-green-400">Records Uploaded</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
          <CardContent className="p-4 text-center">
            <Pill className="h-8 w-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{summary.medications.length}</p>
            <p className="text-sm text-orange-600 dark:text-orange-400">Current Medications</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800">
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{summary.conditions.length}</p>
            <p className="text-sm text-purple-600 dark:text-purple-400">Health Conditions</p>
          </CardContent>
        </Card>
      </div>

      {/* Patient-Friendly Summary (for patients) */}
      {(combinedPatientSummary && userType === 'patient') && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-300">
              <Heart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              What This Means For You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed text-purple-900 dark:text-purple-200">{combinedPatientSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Doctor Summary (for doctors) */}
      {(combinedDoctorSummary && userType === 'doctor') && (
        <Card className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-300">
              <Brain className="h-5 w-5 text-green-600 dark:text-green-400" />
              Clinical Summary & Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed text-green-900 dark:text-green-200">{combinedDoctorSummary}</p>
          </CardContent>
        </Card>
      )}

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
                <div key={index} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full flex-shrink-0"></div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{medication}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
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
                <Badge key={index} className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800 text-sm">
                  {condition}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
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
                <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">{finding}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Things to Watch For */}
      {summary.riskFactors.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-yellow-900 dark:text-yellow-300">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              Things to Watch For
            </CardTitle>
            <CardDescription className="text-yellow-700 dark:text-yellow-400">
              Areas where you might need extra attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.riskFactors.map((risk, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">{risk}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {summary.recommendations.length > 0 && (
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-purple-900 dark:text-purple-300">
              <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              Health Tips for You
            </CardTitle>
            <CardDescription className="text-purple-700 dark:text-purple-400">
              Simple steps to stay healthy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-center w-6 h-6 bg-purple-600 dark:bg-purple-500 text-white rounded-full flex-shrink-0 text-sm font-bold">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Record Breakdown */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg dark:text-white">Your Record Types</CardTitle>
          <CardDescription className="dark:text-gray-300">What documents you've uploaded</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{records.length}</p>
              <p className="text-xs text-blue-800 dark:text-blue-300">Total Records</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {records.filter(r => r.category === 'prescription').length}
              </p>
              <p className="text-xs text-green-800 dark:text-green-300">Prescriptions</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {records.filter(r => r.category === 'lab-result').length}
              </p>
              <p className="text-xs text-purple-800 dark:text-purple-300">Lab Results</p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {records.filter(r => r.category === 'scan').length}
              </p>
              <p className="text-xs text-orange-800 dark:text-orange-300">Scans</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Important Disclaimer */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">📋 Please Note</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
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
