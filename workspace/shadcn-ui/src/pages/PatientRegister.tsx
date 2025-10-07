
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import { useGoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { HealthVaultService } from "@/lib/healthVault";
import { toast } from "sonner";

const PatientRegister = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [user, setUser] = useState(null);

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
    try {
      let profilePictureUrl = "";
      if (profilePicture) {
        console.log("Profile picture selected:", profilePicture);
        const formData = new FormData();
        formData.append("file", profilePicture);
        const response = await axios.post("http://localhost:5000/api/upload-profile-picture", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        profilePictureUrl = response.data.url;
        console.log("Profile picture uploaded, URL:", profilePictureUrl);
      }

      let patient = (await HealthVaultService.getAllPatients()).find(p => p.email === email);
      if (!patient) {
        console.log("Creating new patient with profile picture URL:", profilePictureUrl);
        patient = await HealthVaultService.createPatient({
          name,
          email,
          phone,
          emergencyContact,
          dateOfBirth,
          profilePictureUrl,
        });
        toast.success("Registration successful!");
      } else {
        if (profilePictureUrl) {
          patient = await HealthVaultService.updatePatient(patient.id, { profilePictureUrl });
        }
        toast.success("Welcome back!");
      }

      HealthVaultService.setCurrentUser(patient, 'patient');
      navigate("/patient-dashboard");
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Patient Registration</CardTitle>
          <CardDescription>Fill in the details to create your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" placeholder="Enter your phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-of-birth">Date of Birth</Label>
              <Input id="date-of-birth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency-contact">Emergency Contact</Label>
              <Input id="emergency-contact" placeholder="Enter your emergency contact" value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
            </div>
            <div className="space-y-2">
              <ProfilePictureUpload onFileSelect={setProfilePicture} />
            </div>
            <Button type="submit" className="w-full">Register</Button>
          </form>
          <div className="my-4 flex items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="mx-4 text-gray-500">OR</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>
          <Button onClick={() => login()} className="w-full">Sign in with Google</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientRegister;
