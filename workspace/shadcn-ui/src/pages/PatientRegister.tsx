
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import apiClient from "@/lib/apiService";
import { useNavigate } from "react-router-dom";
import { HealthVaultService } from "@/lib/healthVault";
import { toast } from "sonner";
import PasswordStrength from "@/components/PasswordStrength";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const PatientRegister = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [user, setUser] = useState(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [existingPatient, setExistingPatient] = useState(null);

  const login = useGoogleLogin({
    onSuccess: (codeResponse) => setUser(codeResponse),
    onError: (error) => console.log("Login Failed:", error),
    scope: "https://www.googleapis.com/auth/user.birthday.read https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email",
  });

  useEffect(() => {
    if (user) {
      const getUserInfo = axios.get(`https://www.googleapis.com/oauth2/v3/userinfo`,
        {
          headers: { Authorization: `Bearer ${user.access_token}` },
        }
      );

      const getBirthday = axios.get("https://people.googleapis.com/v1/people/me?personFields=birthdays",
        {
          headers: { Authorization: `Bearer ${user.access_token}` },
        }
      );

      Promise.all([getUserInfo, getBirthday])
        .then((responses) => {
          const userInfo = responses[0].data;
          const birthdayInfo = responses[1].data;

          console.log("User Info:", userInfo);
          console.log("Birthday Info:", birthdayInfo);

          setName(userInfo.name || "");
          setEmail(userInfo.email || "");

          if (birthdayInfo.birthdays && birthdayInfo.birthdays.length > 0) {
            const birthday = birthdayInfo.birthdays.find(b => b.metadata.primary);
            if (birthday && birthday.date) {
              const { year, month, day } = birthday.date;
              setDateOfBirth(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
            }
          }
        })
        .catch((err) => console.log(err));
    }
  }, [user]);

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validate all required fields
    if (!name || !email || !phone || !dateOfBirth || !emergencyContact || !password || !confirmPassword) {
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
        console.log("Profile picture uploaded, URL:", profilePictureUrl);
      }

      let patient = (await HealthVaultService.getAllPatients()).find(p => p.email === email);
      if (patient) {
        // User already exists - show dialog
        setExistingPatient(patient);
        setShowDuplicateDialog(true);
        return;
      }

      // Create new patient
      console.log("Creating new patient with profile picture URL:", profilePictureUrl);
      patient = await HealthVaultService.createPatient({
        name,
        email,
        phone,
        emergencyContact,
        dateOfBirth,
        profilePictureUrl,
        password,
      });
      toast.success("Registration successful!");

      HealthVaultService.setCurrentUser(patient, 'patient');
      navigate("/patient-dashboard");
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
          <CardTitle className="dark:text-white">Patient Registration</CardTitle>
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
              <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
              <Input id="phone" placeholder="Enter your phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-of-birth">Date of Birth <span className="text-red-500">*</span></Label>
              <Input id="date-of-birth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency-contact">Emergency Contact <span className="text-red-500">*</span></Label>
              <Input id="emergency-contact" placeholder="Enter your emergency contact" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} required />
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
          <Button onClick={() => login()} className="w-full">Sign in with Google</Button>
        </CardContent>
      </Card>

      {/* Duplicate User Dialog */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="dark:bg-gray-800 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Account Already Exists</DialogTitle>
            <DialogDescription className="dark:text-gray-300">
              You are already registered as a user with this email. Would you like to login instead?
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

export default PatientRegister;
