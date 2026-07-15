"use client";
import React, { useState, useEffect } from "react";
import {
  Camera,
  X,
  Mail,
  MapPin,
  Globe,
  Linkedin,
  Hash,
  Key,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  updateProfile,
  getProfile,
  changePassword,
} from "@/features/auth/authSlice";

interface FormData {
  name: string;
  email: string;
  phoneNumber: string;
  address: string | null;
  city: string | null;
  country: string | null;
  pincode: string | null;
  linkedin: string | null;
  profileImage?: string;
}

interface PasswordData {
  oldPassword: string;
  newPassword: string;
}

const SettingsPage = () => {
  const dispatch = useAppDispatch();
  const {
    user,
    role,
    loading: authLoading,
    error: authError,
  } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phoneNumber: "",
    address: null,
    city: null,
    country: null,
    pincode: null,
    linkedin: null,
    profileImage: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordData>({
    oldPassword: "",
    newPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        await dispatch(getProfile()).unwrap();
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch user data");
        setLoading(false);
        console.error(err);
      }
    };

    fetchUserData();
  }, [dispatch]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.userId?.name || "",
        email: user.userId?.email || "",
        phoneNumber: user.userId?.phoneNumber?.toString() || "",
        address: user.userId?.address || null,
        city: user.userId?.city || null,
        country: user.userId?.country || null,
        pincode: user.userId?.pincode || null,
        linkedin: user.userId?.linkedin || null,
        profileImage:
          (typeof user.profilePicture === "string"
            ? user.profilePicture
            : (user.profilePicture as any)?.url) || "",
      });
    }
  }, [user]);
  console.log("Form Data:", formData);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordChange = (field: keyof PasswordData, value: string) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            profileImage: event.target?.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const formDataToSend = new FormData();

      formDataToSend.append("name", formData.name);

      if (role === "ADMIN") {
        formDataToSend.append("email", formData.email);
        formDataToSend.append("phoneNumber", formData.phoneNumber);
      }

      if (profileImageFile) {
        formDataToSend.append("profilePicture", profileImageFile);
      }

      if (formData.address) formDataToSend.append("address", formData.address);
      if (formData.city) formDataToSend.append("city", formData.city);
      if (formData.country) formDataToSend.append("country", formData.country);
      if (formData.pincode) formDataToSend.append("pincode", formData.pincode);
      if (formData.linkedin)
        formDataToSend.append("linkedin", formData.linkedin);

      await dispatch(updateProfile(formDataToSend)).unwrap();

      setSuccess("Profile updated successfully!");
      setProfileImageFile(null);
      setIsEditing(false);
      setLoading(false);
    } catch (err) {
      setError("Failed to update profile");
      setLoading(false);
      console.error(err);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      setPasswordError("Both fields are required");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      return;
    }

    try {
      setLoading(true);
      setPasswordError("");
      await dispatch(
        changePassword({
          currentPassword: passwordData.oldPassword,
          newPassword: passwordData.newPassword,
        })
      ).unwrap();
      setPasswordSuccess("Password changed successfully!");
      setPasswordData({ oldPassword: "", newPassword: "" });
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess("");
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.payload || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Profile Settings
          </h1>
          {(error || authError) && (
            <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-md">
              {error || authError}
            </div>
          )}
          {success && (
            <div className="mt-2 p-2 bg-green-100 text-green-700 rounded-md">
              {success}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Personal Information
            </h2>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>

          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-8">
              <div className="flex-shrink-0 relative">
                <div className="relative group">
                  {formData.profileImage ? (
                    <>
                      <img
                        src={formData.profileImage}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/default-profile.png";
                        }}
                      />
                      {isEditing && (
                        <button
                          onClick={() => handleInputChange("profileImage", "")}
                          className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Remove profile picture"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-semibold">
                      {user?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                  )}
                  {isEditing && (
                    <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer">
                      <Camera className="w-3 h-3" />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    formData.name
                  )}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {role === "ADMIN"
                    ? "Administrator"
                    : role === "MANAGER"
                    ? "Manager"
                    : "Member"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gray-500 mt-1" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email Address
                  </label>
                  {isEditing && role === "ADMIN" ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {formData.email}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Hash className="w-5 h-5 text-gray-500 mt-1" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone Number
                  </label>
                  {isEditing && role === "ADMIN" ? (
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        handleInputChange("phoneNumber", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {formData.phoneNumber || "Not provided"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.address || ""}
                      onChange={(e) =>
                        handleInputChange("address", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your address"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {formData.address || "Not provided"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.city || ""}
                      onChange={(e) =>
                        handleInputChange("city", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your city"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {formData.city || "Not provided"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-gray-500 mt-1" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Country
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.country || ""}
                      onChange={(e) =>
                        handleInputChange("country", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your country"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {formData.country || "Not provided"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Hash className="w-5 h-5 text-gray-500 mt-1" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pincode
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.pincode || ""}
                      onChange={(e) =>
                        handleInputChange("pincode", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your pincode"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {formData.pincode || "Not provided"}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Linkedin className="w-5 h-5 text-gray-500 mt-1" />
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    LinkedIn Profile
                  </label>
                  {isEditing ? (
                    <input
                      type="url"
                      value={formData.linkedin || ""}
                      onChange={(e) =>
                        handleInputChange("linkedin", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your LinkedIn URL"
                    />
                  ) : (
                    <p className="text-gray-900 dark:text-white">
                      {formData.linkedin ? (
                        <a
                          href={formData.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {formData.linkedin}
                        </a>
                      ) : (
                        "Not provided"
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end mt-8">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className={`px-6 py-2 bg-green-500 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                    loading
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-green-600"
                  }`}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Change Password
            </h2>
            <button
              onClick={() => setShowChangePassword(!showChangePassword)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              {showChangePassword ? "Cancel" : "Change Password"}
            </button>
          </div>

          {showChangePassword && (
            <div className="p-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.oldPassword}
                      onChange={(e) =>
                        handlePasswordChange("oldPassword", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your current password"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-gray-500 mt-1" />
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        handlePasswordChange("newPassword", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your new password"
                    />
                  </div>
                </div>

                {passwordError && (
                  <div className="p-2 bg-red-100 text-red-700 rounded-md">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-2 bg-green-100 text-green-700 rounded-md">
                    {passwordSuccess}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={handlePasswordSubmit}
                    disabled={loading}
                    className={`px-6 py-2 bg-green-500 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                      loading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-green-600"
                    }`}
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
