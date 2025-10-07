
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Patient } from "@/lib/healthVault";
import { Lightbulb } from 'lucide-react';

const AIInsights = ({ allPatients }: { allPatients: Patient[] }) => {
  const insights = [];

  // Insight 1: Most common record category
  const recordCategories = allPatients.flatMap(p => p.records).reduce((acc, record) => {
    acc[record.category] = (acc[record.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommonCategory = Object.entries(recordCategories).sort((a, b) => b[1] - a[1])[0];
  if (mostCommonCategory) {
    insights.push(`The most common record type among your patients is '${mostCommonCategory[0]}'.`);
  }

  // Insight 2: Patients with a high number of records
  const patientWithMostRecords = allPatients.sort((a, b) => b.records.length - a.records.length)[0];
  if (patientWithMostRecords && patientWithMostRecords.records.length > 5) {
    insights.push(`${patientWithMostRecords.name} has a high number of records (${patientWithMostRecords.records.length}). Consider reviewing their case.`);
  }

  // Insight 3: Patients with recent scans
  const patientsWithRecentScans = allPatients.filter(p => 
    p.records.some(r => r.category === 'scan' && new Date(r.uploadDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  );
  if (patientsWithRecentScans.length > 0) {
    insights.push(`You have ${patientsWithRecentScans.length} patients with new scans in the last 30 days. Follow-up might be needed.`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.length > 0 ? (
          insights.map((insight, index) => (
            <div key={index} className="text-sm p-3 bg-blue-50 rounded-lg text-blue-800">
              {insight}
            </div>
          ))
        ) : (
          <p className="text-gray-600 text-center py-4 dark:text-gray-300">No specific insights to show at the moment.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AIInsights;
