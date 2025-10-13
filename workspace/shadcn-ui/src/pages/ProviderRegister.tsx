
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { HealthVaultService } from "@/lib/healthVault";
import { toast } from "sonner";
import PasswordStrength from "@/components/PasswordStrength";
import apiClient from "@/lib/apiService";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const ProviderRegister = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [existingDoctor, setExistingDoctor] = useState(null);

  const handleGoogleLoginSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    setName(decoded.name || "");
    setEmail(decoded.email || "");
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validate all required fields
    if (!name || !email || !specialty || !licenseNumber || !password || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      let profilePictureUrl = "";
      if (profilePicture) {
        const formData = new FormData();
        formData.append("file", profilePicture);
        const response = await apiClient.post("/v1/upload-profile-picture", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        profilePictureUrl = response.data.url;
      }

      // Check for duplicate email
      let doctorByEmail = await HealthVaultService.getDoctorByEmail(email);

      // Check for duplicate license number
      const allDoctors = await HealthVaultService.getAllDoctors();
      let doctorByLicense = allDoctors.find(d => d.license === licenseNumber);

      if (doctorByEmail || doctorByLicense) {
        // User already exists - show dialog
        setExistingDoctor(doctorByEmail || doctorByLicense);
        setShowDuplicateDialog(true);
        return;
      }

      // Create new doctor
      const doctor = await HealthVaultService.createDoctor({
        name,
        email,
        specialty,
        license: licenseNumber,
        profilePictureUrl,
        password,
      });
      toast.success("Registration successful!");

      HealthVaultService.setCurrentUser(doctor, 'doctor');
      navigate("/doctor-dashboard");
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 dark:text-white">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-lg dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Provider Registration</CardTitle>
          <CardDescription className="dark:text-gray-300">Fill in the details to create your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="space-y-2">
              <Label htmlFor="name">Name <span className="text-red-500">*</span></Label>
              <Input id="name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
              <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialty">Specialty <span className="text-red-500">*</span></Label>
              <Input id="specialty" placeholder="e.g., Cardiology" value={specialty} onChange={(e) => setSpecialty(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license-number">License Number <span className="text-red-500">*</span></Label>
              <Input id="license-number" placeholder="Enter your license number" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
              <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <PasswordStrength password={password} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password <span className="text-red-500">*</span></Label>
              <Input id="confirm-password" type="password" placeholder="Confirm your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <ProfilePictureUpload onFileSelect={setProfilePicture} />
            </div>
            <Button type="submit" className="w-full">Register</Button>
          </form>
          <div className="my-4 flex items-center">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            <span className="mx-4 text-gray-500 dark:text-gray-400">OR</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={() => {
              console.log("Login Failed");
            }}
          />
        </CardContent>
      </Card>

      {/* Duplicate User Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Account Already Exists</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              You are already registered as a provider with this email or license number. Would you like to login instead?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDuplicateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderRegister;
