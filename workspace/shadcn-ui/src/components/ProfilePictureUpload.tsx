
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ProfilePictureUpload = ({ onFileSelect }) => {
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="profile-picture-file">Profile Picture</Label>
      <Input id="profile-picture-file" type="file" onChange={handleFileChange} />
    </div>
  );
};

export default ProfilePictureUpload;
