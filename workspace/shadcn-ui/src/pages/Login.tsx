import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
          <CardDescription className="text-center">Choose your role to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full" onClick={() => navigate('/patient-dashboard')}>
            Login as Patient
          </Button>
          <Button className="w-full" variant="outline" onClick={() => navigate('/doctor-dashboard')}>
            Login as Doctor
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}