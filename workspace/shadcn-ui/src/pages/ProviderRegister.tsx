
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { HealthVaultService } from "@/lib/healthVault";
import { toast } from "sonner";
import axios from "axios";

const ProviderRegister = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);

  const handleGoogleLoginSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    setName(decoded.name || "");
    setEmail(decoded.email || "");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      let profilePictureUrl = "";
      if (profilePicture) {
        const formData = new FormData();
        formData.append("file", profilePicture);
        const response = await axios.post("http://localhost:5000/api/upload-profile-picture", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        profilePictureUrl = response.data.url;
      }

      let doctor = await HealthVaultService.getDoctorByEmail(email);
      if (!doctor) {
        doctor = await HealthVaultService.createDoctor({
          name,
          email,
          specialty,
          license: licenseNumber,
          profilePictureUrl,
        });
        toast.success("Registration successful!");
      } else {
        if (profilePictureUrl) {
          doctor = await HealthVaultService.updateDoctor(doctor.id, { profilePictureUrl });
        }
        toast.success("Welcome back!");
      }

      HealthVaultService.setCurrentUser(doctor, 'doctor');
      navigate("/doctor-dashboard");
    } catch (error) {
      console.error("Registration failed:", error);
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Provider Registration</CardTitle>
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
              <Label htmlFor="specialty">Specialty</Label>
              <Input id="specialty" placeholder="e.g., Cardiology" value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license-number">License Number</Label>
              <Input id="license-number" placeholder="Enter your license number" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
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
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={() => {
              console.log("Login Failed");
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderRegister;
