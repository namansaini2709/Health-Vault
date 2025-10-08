import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, AlertTriangle, Pill, FileText, TrendingUp, RefreshCw } from 'lucide-react';
import { MedicalRecord } from '@/lib/healthVault';
import { AISummarizer, MedicalSummary } from '@/lib/aiSummarizer';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface RecordSummaryProps {
  records: MedicalRecord[];
  onReload?: () => Promise<void>;
}

export default function RecordSummary({ records, onReload }: RecordSummaryProps) {
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
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardContent className="py-16 text-center">
          <Brain className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No data to analyze</h3>
          <p className="text-gray-600 dark:text-gray-300">Upload medical records to see AI-powered insights</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2 dark:text-white">
                <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                AI Health Summary
              </CardTitle>
              <CardDescription className="dark:text-gray-300">
                AI-powered insights from medical records • Last updated: {formatDate(summary.lastUpdated)}
              </CardDescription>
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

      {/* Patient-Friendly Summary (for patients) */}
      {(combinedPatientSummary && userType === 'patient') && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white text-lg">
              <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              What This Means For You
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed text-gray-800 dark:text-gray-200">{combinedPatientSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Doctor Summary (for doctors) */}
      {(combinedDoctorSummary && userType === 'doctor') && (
        <Card className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white text-lg">
              <Brain className="h-5 w-5 text-green-600 dark:text-green-400" />
              Clinical Assessment & Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed text-gray-800 dark:text-gray-200">{combinedDoctorSummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Key Findings */}
      {summary.keyFindings.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Key Findings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.keyFindings.map((finding, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm dark:text-gray-300">{finding}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conditions */}
      {summary.conditions.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              Medical Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {summary.conditions.map((condition, index) => (
                <Badge key={index} variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
                  {condition}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Medications */}
      {summary.medications.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Pill className="h-5 w-5 text-green-600 dark:text-green-400" />
              Current Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.medications.map((medication, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium dark:text-gray-300">{medication}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Factors */}
      {summary.riskFactors.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <TrendingUp className="h-5 w-5 text-red-600 dark:text-red-400" />
              Risk Factors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summary.riskFactors.map((risk, index) => (
                <div key={index} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm dark:text-gray-300">{risk}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {summary.recommendations.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summary.recommendations.map((recommendation, index) => (
                <div key={index} className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800">
                  <p className="text-sm text-purple-800 dark:text-purple-300">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Record Statistics */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Record Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{records.length}</p>
              <p className="text-sm text-blue-800 dark:text-blue-300">Total Records</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {records.filter(r => r.category === 'prescription').length}
              </p>
              <p className="text-sm text-green-800 dark:text-green-300">Prescriptions</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {records.filter(r => r.category === 'lab-result').length}
              </p>
              <p className="text-sm text-purple-800 dark:text-purple-300">Lab Results</p>
            </div>
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {records.filter(r => r.category === 'scan').length}
              </p>
              <p className="text-sm text-orange-800 dark:text-orange-300">Scans</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium mb-1">Medical Disclaimer</p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
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