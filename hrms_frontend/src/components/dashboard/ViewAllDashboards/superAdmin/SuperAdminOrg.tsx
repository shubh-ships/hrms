"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Building2,
  Plus,
  Trash2,
  Users,
  Calendar,
  Upload,
  X,
  Search,
  Filter,
  Eye,
  Loader2,
  AlertTriangle,
  ShieldAlert,
  MapPin,
  Mail,
  Phone,
  Check,
  Edit,
  Moon,
  Sun,
  Settings,
  ClipboardList,
  UserCheck,
  Menu,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  createOrganization,
  fetchOrganizations,
  deleteOrganization,
  clearOrganizationError,
  updateOrganization,
} from "@/features/organization/organizationSlice";
import { toast } from "sonner";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";

interface Organization {
  _id: string;
  name: string;
  org_alias: string;
  description?: string;
  org_photo?: {
    public_id: string;
    url: string;
    _id: string;
  };
  email?: string;
  phone_number?: string;
  is_active: boolean;
  is_verified: boolean;
  city?: string;
  state?: string;
  country?: string;
  member_count?: number;
  isHRMS_enabled?: boolean;
  isTaskManagement_enabled?: boolean;
  social_links?: Array<{ [key: string]: string }>;
  createdAt: string;
  updatedAt: string;
}

interface CreateOrgFormData {
  name: string;
  org_alias: string;
  description: string;
  email: string;
  phone_number: string;
  username: string;
  city?: string;
  state?: string;
  country?: string;
  member_count: number;
  isHRMS_enabled: boolean;
  isTaskManagement_enabled: boolean;
  organizationPicture?: File;
}

interface EditOrgFormData {
  name: string;
  description: string;
  email: string;
  phone_number: string;
  city?: string;
  state?: string;
  country?: string;
  member_count: number;
  isHRMS_enabled: boolean;
  isTaskManagement_enabled: boolean;
  organizationPicture?: File;
}

interface FileWithPreview extends File {
  preview: string;
}

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  isLoading?: boolean;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isLoading = false,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
}) => {
  const { theme } = useTheme();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`w-[95vw] max-w-md mx-auto ${
          theme === "dark" ? "dark:bg-gray-900 dark:border-gray-700" : ""
        }`}
      >
        <DialogHeader>
          <div className="flex items-center space-x-2">
            {destructive && (
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
            )}
            <DialogTitle
              className={`text-base sm:text-lg ${
                theme === "dark" ? "dark:text-gray-100" : ""
              }`}
            >
              {title}
            </DialogTitle>
          </div>
          <DialogDescription
            className={`text-sm ${
              theme === "dark" ? "dark:text-gray-300" : ""
            }`}
          >
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className={`w-full sm:w-auto ${
              theme === "dark"
                ? "dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                : ""
            }`}
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full sm:w-auto ${
              destructive ? "bg-red-600 hover:bg-red-700" : ""
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {destructive && <Trash2 className="w-4 h-4 mr-2" />}
                {confirmText}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AccessDenied: React.FC = () => {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 sm:p-6 ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <Card
        className={`w-full max-w-md ${
          theme === "dark" ? "dark:bg-gray-800 dark:border-gray-700" : ""
        }`}
      >
        <CardContent className="p-6 sm:p-8 text-center">
          <ShieldAlert className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
          <h2
            className={`text-xl sm:text-2xl font-bold mb-2 ${
              theme === "dark" ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Access Denied
          </h2>
          <p
            className={`mb-6 text-sm sm:text-base ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            You need superuser privileges to access organization management.
          </p>
          <Button onClick={() => router.push("/dashboard")} className="w-full">
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const safeString = (value: string | undefined | null): string => {
  return value || "";
};

const SuperAdminOrg: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const {
    isSuperUser,
    token,
    loading: authLoading,
  } = useAppSelector((state) => state.auth);
  const { organizations, loading, error, totalCount } = useAppSelector(
    (state) => state.organizations
  );

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "createdAt" | "city">(
    "createdAt"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [formData, setFormData] = useState<CreateOrgFormData>({
    name: "",
    org_alias: "",
    description: "",
    email: "",
    phone_number: "",
    username: "",
    city: "",
    state: "",
    country: "",
    member_count: 1,
    isHRMS_enabled: false,
    isTaskManagement_enabled: false,
  });

  const [editFormData, setEditFormData] = useState<EditOrgFormData>({
    name: "",
    description: "",
    email: "",
    phone_number: "",
    city: "",
    state: "",
    country: "",
    member_count: 1,
    isHRMS_enabled: false,
    isTaskManagement_enabled: false,
  });

  const [orgImage, setOrgImage] = useState<FileWithPreview | null>(null);
  const [editOrgImage, setEditOrgImage] = useState<FileWithPreview | null>(
    null
  );

  const safeOrganizations = React.useMemo(() => {
    if (!Array.isArray(organizations)) {
      return [];
    }

    return organizations.filter((org): org is Organization => {
      return (
        org &&
        typeof org === "object" &&
        typeof org._id === "string" &&
        typeof org.name === "string" &&
        typeof org.org_alias === "string" &&
        typeof org.createdAt === "string"
      );
    });
  }, [organizations]);

  useEffect(() => {
    if (!authLoading) {
      if (!token) {
        router.push("/login");
        return;
      }

      if (!isSuperUser) {
        return;
      }

      dispatch(fetchOrganizations());
    }
  }, [token, isSuperUser, authLoading, dispatch, router]);

  if (!authLoading && token && !isSuperUser) {
    return <AccessDenied />;
  }

  if (authLoading || (!token && !authLoading)) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          theme === "dark" ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="flex items-center space-x-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span
            className={`${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Loading...
          </span>
        </div>
      </div>
    );
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const fileWithPreview = Object.assign(file, {
          preview: URL.createObjectURL(file),
        });
        setOrgImage(fileWithPreview);
      }
    },
  });

  const {
    getRootProps: getEditRootProps,
    getInputProps: getEditInputProps,
    isDragActive: isEditDragActive,
  } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        const fileWithPreview = Object.assign(file, {
          preview: URL.createObjectURL(file),
        });
        setEditOrgImage(fileWithPreview);
      }
    },
  });

  const handleUpdateOrganizationStatus = async (
    alias: string,
    isActive: boolean
  ) => {
    try {
      setStatusUpdating(alias);

      const formData = new FormData();
      formData.append("is_active", isActive.toString());

      await dispatch(
        updateOrganization({ alias, updateData: formData })
      ).unwrap();

      await dispatch(fetchOrganizations());

      toast.success(
        `Organization ${isActive ? "enabled" : "disabled"} successfully!`
      );
    } catch (error: any) {
      toast.error(
        error || `Failed to ${isActive ? "enable" : "disable"} organization`
      );
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleInputChange = (
    field: keyof CreateOrgFormData,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "name" && typeof value === "string" && !formData.org_alias) {
      const alias = value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "_")
        .substring(0, 20);
      setFormData((prev) => ({ ...prev, org_alias: alias }));
    }
  };

  const handleEditInputChange = (
    field: keyof EditOrgFormData,
    value: string | number | boolean
  ) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreateOrganization = async () => {
    try {
      setIsSubmitting(true);

      if (
        !formData.name ||
        !formData.org_alias ||
        !formData.email ||
        !formData.username ||
        !formData.phone_number
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      const phoneRegex = /^[+]?[\d\s-()]+$/;
      if (!phoneRegex.test(formData.phone_number)) {
        toast.error("Please enter a valid phone number");
        return;
      }

      if (formData.member_count < 1) {
        toast.error("Member count must be at least 1");
        return;
      }

      const orgFormData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          orgFormData.append(key, value.toString());
        }
      });

      if (orgImage) {
        orgFormData.append("organizationPicture", orgImage);
      }

      await dispatch(createOrganization(orgFormData)).unwrap();

      toast.success("Organization created successfully!");
      setCreateDialogOpen(false);
      resetForm();

      dispatch(fetchOrganizations());
    } catch (error: any) {
      toast.error(error || "Failed to create organization");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditOrganization = async () => {
    if (!selectedOrg) return;

    try {
      setIsSubmitting(true);

      if (
        !editFormData.name ||
        !editFormData.email ||
        !editFormData.phone_number
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editFormData.email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      const phoneRegex = /^[+]?[\d\s-()]+$/;
      if (!phoneRegex.test(editFormData.phone_number)) {
        toast.error("Please enter a valid phone number");
        return;
      }

      if (editFormData.member_count < 1) {
        toast.error("Member count must be at least 1");
        return;
      }

      const orgFormData = new FormData();
      Object.entries(editFormData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          orgFormData.append(key, value.toString());
        }
      });

      if (editOrgImage) {
        orgFormData.append("organizationPicture", editOrgImage);
      }

      await dispatch(
        updateOrganization({
          alias: selectedOrg.org_alias,
          updateData: orgFormData,
        })
      ).unwrap();

      toast.success("Organization updated successfully!");
      setEditDialogOpen(false);
      setSelectedOrg(null);
      resetEditForm();

      dispatch(fetchOrganizations());
    } catch (error: any) {
      toast.error(error || "Failed to update organization");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditDialog = (org: Organization) => {
    setSelectedOrg(org);
    setEditFormData({
      name: org.name || "",
      description: org.description || "",
      email: org.email || "",
      phone_number: org.phone_number || "",
      city: org.city || "",
      state: org.state || "",
      country: org.country || "",
      member_count: org.member_count || 1,
      isHRMS_enabled: org.isHRMS_enabled || false,
      isTaskManagement_enabled: org.isTaskManagement_enabled || false,
    });
    setEditOrgImage(null);
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      org_alias: "",
      description: "",
      email: "",
      phone_number: "",
      username: "",
      city: "",
      state: "",
      country: "",
      member_count: 1,
      isHRMS_enabled: false,
      isTaskManagement_enabled: false,
    });
    setOrgImage(null);
  };

  const resetEditForm = () => {
    setEditFormData({
      name: "",
      description: "",
      email: "",
      phone_number: "",
      city: "",
      state: "",
      country: "",
      member_count: 1,
      isHRMS_enabled: false,
      isTaskManagement_enabled: false,
    });
    setEditOrgImage(null);
  };

  const filteredAndSortedOrgs = React.useMemo(() => {
    let filtered = safeOrganizations.filter((org) => {
      const searchLower = searchTerm.toLowerCase();
      const name = safeString(org.name).toLowerCase();
      const orgAlias = safeString(org.org_alias).toLowerCase();
      const email = safeString(org.email).toLowerCase();
      const city = safeString(org.city).toLowerCase();

      return (
        name.includes(searchLower) ||
        orgAlias.includes(searchLower) ||
        email.includes(searchLower) ||
        city.includes(searchLower)
      );
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return safeString(a.name).localeCompare(safeString(b.name));
        case "createdAt":
          const dateA = new Date(a.createdAt || "").getTime();
          const dateB = new Date(b.createdAt || "").getTime();
          return dateB - dateA;
        case "city":
          return safeString(a.city).localeCompare(safeString(b.city));
        default:
          return 0;
      }
    });
  }, [safeOrganizations, searchTerm, sortBy]);

  useEffect(() => {
    return () => {
      if (orgImage) {
        URL.revokeObjectURL(orgImage.preview);
      }
      if (editOrgImage) {
        URL.revokeObjectURL(editOrgImage.preview);
      }
    };
  }, [orgImage, editOrgImage]);

  return (
    <div
      className={`min-h-screen p-3 sm:p-4 lg:p-6 ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex-1 min-w-0">
              <h1
                className={`text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3 ${
                  theme === "dark" ? "text-gray-100" : "text-gray-900"
                }`}
              >
                <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 shrink-0" />
                <span className="truncate">Organization Management</span>
              </h1>
              <p
                className={`mt-1 text-sm sm:text-base ${
                  theme === "dark" ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Create, manage, and monitor all organizations in the system
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-sm sm:text-base"
                size={
                  typeof window !== "undefined" && window?.innerWidth < 640
                    ? "sm"
                    : "lg"
                }
              >
                <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Create Organization</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 lg:mb-6">
            <Card
              className={
                theme === "dark" ? "dark:bg-gray-800 dark:border-gray-700" : ""
              }
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs sm:text-sm ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Total Organizations
                    </p>
                    <p
                      className={`text-lg sm:text-2xl font-bold truncate ${
                        theme === "dark" ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {totalCount || safeOrganizations.length}
                    </p>
                  </div>
                  <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card
              className={
                theme === "dark" ? "dark:bg-gray-800 dark:border-gray-700" : ""
              }
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs sm:text-sm ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Active Organizations
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-green-600 truncate">
                      {safeOrganizations.filter((org) => org.is_active).length}
                    </p>
                  </div>
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card
              className={
                theme === "dark" ? "dark:bg-gray-800 dark:border-gray-700" : ""
              }
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs sm:text-sm ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      HRMS Enabled
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-purple-600 truncate">
                      {
                        safeOrganizations.filter((org) => org.isHRMS_enabled)
                          .length
                      }
                    </p>
                  </div>
                  <UserCheck className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 shrink-0" />
                </div>
              </CardContent>
            </Card>

            <Card
              className={
                theme === "dark" ? "dark:bg-gray-800 dark:border-gray-700" : ""
              }
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs sm:text-sm ${
                        theme === "dark" ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      Task Management
                    </p>
                    <p className="text-lg sm:text-2xl font-bold text-orange-600 truncate">
                      {
                        safeOrganizations.filter(
                          (org) => org.isTaskManagement_enabled
                        ).length
                      }
                    </p>
                  </div>
                  <ClipboardList className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 shrink-0" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search organizations by name, alias, email, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 text-sm sm:text-base ${
                    theme === "dark"
                      ? "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      : ""
                  }`}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className={`px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600 text-gray-100"
                    : "border-gray-300"
                }`}
              >
                <option value="createdAt">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="city">Sort by City</option>
              </select>
              <Button
                variant="outline"
                onClick={() => dispatch(fetchOrganizations())}
                disabled={loading}
                className={`${
                  theme === "dark"
                    ? "dark:border-gray-600 dark:hover:bg-gray-800"
                    : ""
                }`}
                size="sm"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Filter className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span
              className={`ml-2 text-sm sm:text-base ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Loading organizations...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 xl:gap-8">
            {filteredAndSortedOrgs.map((org) => (
              <Card
                key={org._id}
                className={`p-0 relative rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col justify-between ${
                  theme === "dark"
                    ? "dark:bg-gray-800 dark:border-gray-700 dark:hover:shadow-gray-700/25"
                    : ""
                }`}
              >
                <div className="absolute  right-0   z-10">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      handleUpdateOrganizationStatus(
                        org.org_alias,
                        !org.is_active
                      )
                    }
                    className={`p-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 ${
                      theme === "dark" ? "dark:hover:bg-gray-700" : ""
                    }`}
                    title={
                      org.is_active
                        ? "Disable Organization"
                        : "Enable Organization"
                    }
                  >
                    {org.is_active ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <Check className="w-5 h-5" />
                    )}
                  </Button>
                </div>

                <CardHeader className="pb-0">
                  <div className="flex flex-row items-center gap-3 pt-6">
                    {org.org_photo?.url ? (
                      <Image
                        src={org.org_photo.url}
                        alt={safeString(org.name)}
                        width={48}
                        height={48}
                        className="rounded-full object-cover min-w-[48px] min-h-[48px] shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <Building2 className="w-6 h-6 text-blue-600" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <CardTitle className="text-lg sm:text-xl font-semibold tracking-tight mb-1 whitespace-normal break-words leading-snug max-w-full">
                        {safeString(org.name) || "Unnamed Organization"}
                      </CardTitle>
                      <p
                        className={`text-xs sm:text-sm truncate break-words mb-1 ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        @{safeString(org.org_alias) || "no-alias"}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mb-2 max-w-full">
                        <Badge
                          variant={org.is_active ? "default" : "secondary"}
                          className={`text-xs px-2 rounded-full ${
                            org.is_active
                              ? "bg-green-100 text-green-700 border-green-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {org.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {org.is_verified && (
                          <Badge
                            variant="outline"
                            className="text-xs border-blue-200 text-blue-600 bg-blue-50 px-2 rounded-full"
                          >
                            Verified
                          </Badge>
                        )}
                        {org.isHRMS_enabled && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-purple-50 text-purple-700 border-purple-200 px-2 rounded-full"
                          >
                            HRMS
                          </Badge>
                        )}
                        {org.isTaskManagement_enabled && (
                          <Badge
                            variant="outline"
                            className="text-xs bg-orange-50 text-orange-700 border-orange-200 px-2 rounded-full"
                          >
                            Tasks
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="py-0 flex-1">
                  <div className="space-y-2 sm:space-y-3">
                    <p
                      className={`text-sm sm:text-base line-clamp-2 break-words ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {safeString(org.description) ||
                        "No description available"}
                    </p>
                    {org.email && (
                      <div
                        className={`flex items-center space-x-2 text-xs sm:text-sm ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        <Mail className="w-4 h-4 shrink-0" />
                        <span className="truncate">{org.email}</span>
                      </div>
                    )}
                    {org.phone_number && (
                      <div
                        className={`flex items-center space-x-2 text-xs sm:text-sm ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        <Phone className="w-4 h-4 shrink-0" />
                        <span className="truncate">{org.phone_number}</span>
                      </div>
                    )}
                    <div
                      className={`flex items-center space-x-2 text-xs sm:text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      <Users className="w-4 h-4 shrink-0" />
                      <span>{org.member_count || 0} members</span>
                    </div>
                    {(org.city || org.state || org.country) && (
                      <div
                        className={`flex items-center space-x-2 text-xs sm:text-sm ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                          {[org.city, org.state, org.country]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          theme === "dark"
                            ? "dark:border-gray-600 dark:text-gray-300"
                            : ""
                        }`}
                      >
                        {org.createdAt
                          ? new Date(org.createdAt).toLocaleDateString()
                          : "Unknown date"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
                <div className="flex justify-end items-center gap-3 px-4 py-2 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedOrg(org);
                      setViewDialogOpen(true);
                    }}
                    className={`p-2 ${
                      theme === "dark" ? "dark:hover:bg-gray-700" : ""
                    }`}
                    title="View Details"
                  >
                    <Eye className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEditDialog(org)}
                    className={`p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 ${
                      theme === "dark" ? "dark:hover:bg-gray-700" : ""
                    }`}
                    title="Edit Organization"
                  >
                    <Edit className="w-5 h-5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {filteredAndSortedOrgs.length === 0 && !loading && (
          <div className="text-center py-12">
            <Building2
              className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 ${
                theme === "dark" ? "text-gray-600" : "text-gray-300"
              }`}
            />
            <h3
              className={`text-lg font-medium mb-2 ${
                theme === "dark" ? "text-gray-100" : "text-gray-900"
              }`}
            >
              No organizations found
            </h3>
            <p
              className={`text-sm sm:text-base ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              {searchTerm
                ? "Try adjusting your search criteria"
                : "Create your first organization to get started"}
            </p>
          </div>
        )}

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent
            className={`w-[95vw] max-w-4xl max-h-[95vh] overflow-y-auto ${
              theme === "dark" ? "dark:bg-gray-900 dark:border-gray-700" : ""
            }`}
          >
            <DialogHeader>
              <DialogTitle
                className={`text-lg sm:text-xl ${
                  theme === "dark" ? "dark:text-gray-100" : ""
                }`}
              >
                Create New Organization
              </DialogTitle>
              <DialogDescription
                className={`text-sm sm:text-base ${
                  theme === "dark" ? "dark:text-gray-300" : ""
                }`}
              >
                Fill in the details below to create a new organization. An admin
                user will be automatically created.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label
                  className={`text-sm sm:text-base ${
                    theme === "dark" ? "dark:text-gray-200" : ""
                  }`}
                >
                  Organization Logo
                </Label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-colors
                    ${
                      isDragActive
                        ? "border-blue-500 bg-blue-50"
                        : `${
                            theme === "dark"
                              ? "border-gray-600 hover:border-gray-500 bg-gray-800"
                              : "border-gray-300 hover:border-gray-400"
                          }`
                    }
                  `}
                >
                  <input {...getInputProps()} />
                  {orgImage ? (
                    <div className="space-y-2">
                      <Image
                        src={orgImage.preview}
                        alt="Preview"
                        width={80}
                        height={80}
                        className="mx-auto rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOrgImage(null);
                        }}
                        className={
                          theme === "dark"
                            ? "dark:border-gray-600 dark:hover:bg-gray-700"
                            : ""
                        }
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload
                        className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 ${
                          theme === "dark" ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Drag & drop an image here, or click to select
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          theme === "dark" ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        PNG, JPG, GIF up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "dark:text-gray-200" : ""
                    }`}
                  >
                    Organization Name *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter organization name"
                    required
                    className={`text-sm sm:text-base ${
                      theme === "dark"
                        ? "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                        : ""
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="org_alias"
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "dark:text-gray-200" : ""
                    }`}
                  >
                    Alias *
                  </Label>
                  <Input
                    id="org_alias"
                    value={formData.org_alias}
                    onChange={(e) =>
                      handleInputChange("org_alias", e.target.value)
                    }
                    placeholder="organization_alias"
                    required
                    className={`text-sm sm:text-base ${
                      theme === "dark"
                        ? "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                        : ""
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className={`text-sm sm:text-base ${
                    theme === "dark" ? "dark:text-gray-200" : ""
                  }`}
                >
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Describe the organization..."
                  rows={3}
                  className={`text-sm sm:text-base ${
                    theme === "dark"
                      ? "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      : ""
                  }`}
                />
              </div>

              <div className="border-t pt-4">
                <h3
                  className={`text-base sm:text-lg font-medium mb-3 sm:mb-4 ${
                    theme === "dark" ? "text-gray-100" : ""
                  }`}
                >
                  Organization Settings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="member_count"
                      className={`text-sm sm:text-base ${
                        theme === "dark" ? "dark:text-gray-200" : ""
                      }`}
                    >
                      Member Count *
                    </Label>
                    <Input
                      id="member_count"
                      type="number"
                      min="1"
                      value={formData.member_count}
                      onChange={(e) =>
                        handleInputChange(
                          "member_count",
                          parseInt(e.target.value) || 1
                        )
                      }
                      placeholder="1"
                      required
                      className={`text-sm sm:text-base ${
                        theme === "dark"
                          ? "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                          : ""
                      }`}
                    />
                  </div>

                  <div className="space-y-3 sm:col-span-2">
                    <Label
                      className={`text-sm sm:text-base ${
                        theme === "dark" ? "dark:text-gray-200" : ""
                      }`}
                    >
                      Features
                    </Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isHRMS_enabled"
                          checked={formData.isHRMS_enabled}
                          onCheckedChange={(checked) =>
                            handleInputChange(
                              "isHRMS_enabled",
                              checked as boolean
                            )
                          }
                          className={
                            theme === "dark" ? "dark:border-gray-600" : ""
                          }
                        />
                        <Label
                          htmlFor="isHRMS_enabled"
                          className={`text-sm cursor-pointer flex items-center space-x-2 ${
                            theme === "dark" ? "text-gray-200" : ""
                          }`}
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Enable HRMS</span>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isTaskManagement_enabled"
                          checked={formData.isTaskManagement_enabled}
                          onCheckedChange={(checked) =>
                            handleInputChange(
                              "isTaskManagement_enabled",
                              checked as boolean
                            )
                          }
                          className={
                            theme === "dark" ? "dark:border-gray-600" : ""
                          }
                        />
                        <Label
                          htmlFor="isTaskManagement_enabled"
                          className={`text-sm cursor-pointer flex items-center space-x-2 ${
                            theme === "dark" ? "text-gray-200" : ""
                          }`}
                        >
                          <ClipboardList className="w-4 h-4" />
                          <span>Enable Task Management</span>
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3
                  className={`text-base sm:text-lg font-medium mb-3 sm:mb-4 ${
                    theme === "dark" ? "text-gray-100" : ""
                  }`}
                >
                  Admin User Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="username"
                      className={`text-sm sm:text-base ${
                        theme === "dark" ? "dark:text-gray-200" : ""
                      }`}
                    >
                      Admin Name *
                    </Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) =>
                        handleInputChange("username", e.target.value)
                      }
                      placeholder="Admin user name"
                      required
                      className={`text-sm sm:text-base ${
                        theme === "dark"
                          ? "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                          : ""
                      }`}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className={`text-sm sm:text-base ${
                        theme === "dark" ? "dark:text-gray-200" : ""
                      }`}
                    >
                      Admin Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="admin@organization.com"
                      required
                      className={`text-sm sm:text-base ${
                        theme === "dark"
                          ? "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                          : ""
                      }`}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label
                      htmlFor="phone_number"
                      className={`text-sm sm:text-base ${
                        theme === "dark" ? "dark:text-gray-200" : ""
                      }`}
                    >
                      Admin Phone Number *
                    </Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) =>
                        handleInputChange("phone_number", e.target.value)
                      }
                      placeholder="+1 (555) 123-4567"
                      required
                      className={`text-sm sm:text-base ${
                        theme === "dark"
                          ? "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                          : ""
                      }`}
                    />
                  </div>
                </div>

                <div className="mt-4 sm:mt-6">
                  <h4
                    className={`text-sm sm:text-base font-medium mb-3 sm:mb-4 ${
                      theme === "dark" ? "text-gray-200" : ""
                    }`}
                  >
                    Location (Optional)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label
                        htmlFor="city"
                        className={`text-sm ${
                          theme === "dark" ? "dark:text-gray-200" : ""
                        }`}
                      >
                        City
                      </Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) =>
                          handleInputChange("city", e.target.value)
                        }
                        placeholder="City"
                        className={`text-sm ${
                          theme === "dark"
                            ? "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                            : ""
                        }`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="state"
                        className={`text-sm ${
                          theme === "dark" ? "dark:text-gray-200" : ""
                        }`}
                      >
                        State/Province
                      </Label>
                      <Input
                        id="state"
                        value={formData.state}
                        onChange={(e) =>
                          handleInputChange("state", e.target.value)
                        }
                        placeholder="State/Province"
                        className={`text-sm ${
                          theme === "dark"
                            ? "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                            : ""
                        }`}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="country"
                        className={`text-sm ${
                          theme === "dark" ? "dark:text-gray-200" : ""
                        }`}
                      >
                        Country
                      </Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) =>
                          handleInputChange("country", e.target.value)
                        }
                        placeholder="Country"
                        className={`text-sm ${
                          theme === "dark"
                            ? "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                            : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <p
                  className={`text-xs mt-2 ${
                    theme === "dark" ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Default password: "12345678" (user should change on first
                  login)
                </p>
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCreateDialogOpen(false);
                  resetForm();
                }}
                disabled={isSubmitting}
                className={`w-full sm:w-auto ${
                  theme === "dark"
                    ? "dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    : ""
                }`}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateOrganization}
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Organization
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent
            className={`w-[95vw] max-w-4xl max-h-[95vh] overflow-y-auto ${
              theme === "dark" ? "dark:bg-gray-900 dark:border-gray-700" : ""
            }`}
          >
            <DialogHeader>
              <DialogTitle
                className={`text-lg sm:text-xl ${
                  theme === "dark" ? "dark:text-gray-100" : ""
                }`}
              >
                Edit Organization
              </DialogTitle>
              <DialogDescription
                className={`text-sm sm:text-base ${
                  theme === "dark" ? "dark:text-gray-300" : ""
                }`}
              >
                Update the organization details below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 sm:space-y-6">
              {selectedOrg && (
                <div
                  className={`p-3 sm:p-4 rounded-lg ${
                    theme === "dark" ? "bg-gray-800" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {selectedOrg.org_photo?.url ? (
                      <Image
                        src={selectedOrg.org_photo.url}
                        alt={safeString(selectedOrg.name)}
                        width={40}
                        height={40}
                        className="rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p
                        className={`font-medium truncate ${
                          theme === "dark" ? "text-gray-100" : ""
                        }`}
                      >
                        {selectedOrg.name}
                      </p>
                      <p
                        className={`text-sm truncate ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        @{selectedOrg.org_alias}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label
                  className={`text-sm sm:text-base ${
                    theme === "dark" ? "dark:text-gray-200" : ""
                  }`}
                >
                  Update Organization Logo
                </Label>
                <div
                  {...getEditRootProps()}
                  className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer transition-colors
                    ${
                      isEditDragActive
                        ? "border-blue-500 bg-blue-50"
                        : `${
                            theme === "dark"
                              ? "border-gray-600 hover:border-gray-500 bg-gray-800"
                              : "border-gray-300 hover:border-gray-400"
                          }`
                    }
                  `}
                >
                  <input {...getEditInputProps()} />
                  {editOrgImage ? (
                    <div className="space-y-2">
                      <Image
                        src={editOrgImage.preview}
                        alt="Preview"
                        width={80}
                        height={80}
                        className="mx-auto rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditOrgImage(null);
                        }}
                        className={
                          theme === "dark"
                            ? "dark:border-gray-600 dark:hover:bg-gray-700"
                            : ""
                        }
                      >
                        <X className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload
                        className={`w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 ${
                          theme === "dark" ? "text-gray-500" : "text-gray-400"
                        }`}
                      />
                      <p
                        className={`text-sm ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        Drag & drop an image here, or click to select
                      </p>
                      <p
                        className={`text-xs mt-1 ${
                          theme === "dark" ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        PNG, JPG, GIF up to 10MB (Leave empty to keep current
                        image)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="edit_name"
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "dark:text-gray-200" : ""
                    }`}
                  >
                    Organization Name *
                  </Label>
                  <Input
                    id="edit_name"
                    value={editFormData.name}
                    onChange={(e) =>
                      handleEditInputChange("name", e.target.value)
                    }
                    placeholder="Enter organization name"
                    required
                    className={`text-sm sm:text-base ${
                      theme === "dark"
                        ? "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                        : ""
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="edit_email"
                    className={`text-sm sm:text-base ${
                      theme === "dark" ? "dark:text-gray-200" : ""
                    }`}
                  >
                    Email *
                  </Label>
                  <Input
                    id="edit_email"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) =>
                      handleEditInputChange("email", e.target.value)
                    }
                    placeholder="organization@example.com"
                    required
                    className={`text-sm sm:text-base ${
                      theme === "dark"
                        ? "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                        : ""
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="edit_phone"
                  className={`text-sm sm:text-base ${
                    theme === "dark" ? "dark:text-gray-200" : ""
                  }`}
                >
                  Phone Number *
                </Label>
                <Input
                  id="edit_phone"
                  value={editFormData.phone_number}
                  onChange={(e) =>
                    handleEditInputChange("phone_number", e.target.value)
                  }
                  placeholder="+1 (555) 123-4567"
                  required
                  className={`text-sm sm:text-base ${
                    theme === "dark"
                      ? "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      : ""
                  }`}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="edit_description"
                  className={`text-sm sm:text-base ${
                    theme === "dark" ? "dark:text-gray-200" : ""
                  }`}
                >
                  Description
                </Label>
                <Textarea
                  id="edit_description"
                  value={editFormData.description}
                  onChange={(e) =>
                    handleEditInputChange("description", e.target.value)
                  }
                  placeholder="Describe the organization..."
                  rows={3}
                  className={`text-sm sm:text-base ${
                    theme === "dark"
                      ? "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                      : ""
                  }`}
                />
              </div>

              <div className="border-t pt-4">
                <h3
                  className={`text-base sm:text-lg font-medium mb-3 sm:mb-4 ${
                    theme === "dark" ? "text-gray-100" : ""
                  }`}
                >
                  Organization Settings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="edit_member_count"
                      className={`text-sm sm:text-base ${
                        theme === "dark" ? "dark:text-gray-200" : ""
                      }`}
                    >
                      Member Count *
                    </Label>
                    <Input
                      id="edit_member_count"
                      type="number"
                      min="1"
                      value={editFormData.member_count}
                      onChange={(e) =>
                        handleEditInputChange(
                          "member_count",
                          parseInt(e.target.value) || 1
                        )
                      }
                      placeholder="1"
                      required
                      className={`text-sm sm:text-base ${
                        theme === "dark"
                          ? "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                          : ""
                      }`}
                    />
                  </div>

                  <div className="space-y-3 sm:col-span-2">
                    <Label
                      className={`text-sm sm:text-base ${
                        theme === "dark" ? "dark:text-gray-200" : ""
                      }`}
                    >
                      Features
                    </Label>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit_isHRMS_enabled"
                          checked={editFormData.isHRMS_enabled}
                          onCheckedChange={(checked) =>
                            handleEditInputChange(
                              "isHRMS_enabled",
                              checked as boolean
                            )
                          }
                          className={
                            theme === "dark" ? "dark:border-gray-600" : ""
                          }
                        />
                        <Label
                          htmlFor="edit_isHRMS_enabled"
                          className={`text-sm cursor-pointer flex items-center space-x-2 ${
                            theme === "dark" ? "text-gray-200" : ""
                          }`}
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Enable HRMS</span>
                        </Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="edit_isTaskManagement_enabled"
                          checked={editFormData.isTaskManagement_enabled}
                          onCheckedChange={(checked) =>
                            handleEditInputChange(
                              "isTaskManagement_enabled",
                              checked as boolean
                            )
                          }
                          className={
                            theme === "dark" ? "dark:border-gray-600" : ""
                          }
                        />
                        <Label
                          htmlFor="edit_isTaskManagement_enabled"
                          className={`text-sm cursor-pointer flex items-center space-x-2 ${
                            theme === "dark" ? "text-gray-200" : ""
                          }`}
                        >
                          <ClipboardList className="w-4 h-4" />
                          <span>Enable Task Management</span>
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="edit_city"
                    className={`text-sm ${
                      theme === "dark" ? "dark:text-gray-200" : ""
                    }`}
                  >
                    City
                  </Label>
                  <Input
                    id="edit_city"
                    value={editFormData.city}
                    onChange={(e) =>
                      handleEditInputChange("city", e.target.value)
                    }
                    placeholder="City"
                    className={`text-sm ${
                      theme === "dark"
                        ? "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                        : ""
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="edit_state"
                    className={`text-sm ${
                      theme === "dark" ? "dark:text-gray-200" : ""
                    }`}
                  >
                    State/Province
                  </Label>
                  <Input
                    id="edit_state"
                    value={editFormData.state}
                    onChange={(e) =>
                      handleEditInputChange("state", e.target.value)
                    }
                    placeholder="State/Province"
                    className={`text-sm ${
                      theme === "dark"
                        ? "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                        : ""
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="edit_country"
                    className={`text-sm ${
                      theme === "dark" ? "dark:text-gray-200" : ""
                    }`}
                  >
                    Country
                  </Label>
                  <Input
                    id="edit_country"
                    value={editFormData.country}
                    onChange={(e) =>
                      handleEditInputChange("country", e.target.value)
                    }
                    placeholder="Country"
                    className={`text-sm ${
                      theme === "dark"
                        ? "dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                        : ""
                    }`}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedOrg(null);
                  resetEditForm();
                }}
                disabled={isSubmitting}
                className={`w-full sm:w-auto ${
                  theme === "dark"
                    ? "dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    : ""
                }`}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditOrganization}
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" />
                    Update Organization
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent
            className={`w-[95vw] max-w-2xl max-h-[95vh] overflow-y-auto ${
              theme === "dark" ? "dark:bg-gray-900 dark:border-gray-700" : ""
            }`}
          >
            <DialogHeader>
              <DialogTitle
                className={`text-lg sm:text-xl ${
                  theme === "dark" ? "dark:text-gray-100" : ""
                }`}
              >
                Organization Details
              </DialogTitle>
            </DialogHeader>

            {selectedOrg && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                  {selectedOrg.org_photo?.url ? (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto sm:mx-0 shrink-0">
                      <Image
                        src={selectedOrg.org_photo.url}
                        alt={safeString(selectedOrg.name)}
                        width={20}
                        height={20}
                        className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto sm:mx-0 shrink-0">
                      <Building2 className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                    </div>
                  )}
                  <div className="text-center sm:text-left min-w-0 flex-1">
                    <h2
                      className={`text-xl sm:text-2xl font-bold truncate ${
                        theme === "dark" ? "text-gray-100" : ""
                      }`}
                    >
                      {safeString(selectedOrg.name) || "Unnamed Organization"}
                    </h2>
                    <p
                      className={`text-sm sm:text-base truncate ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      @{safeString(selectedOrg.org_alias) || "no-alias"}
                    </p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                      <Badge
                        variant={
                          selectedOrg.is_active ? "default" : "secondary"
                        }
                      >
                        {selectedOrg.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {selectedOrg.is_verified && (
                        <Badge variant="outline">Verified</Badge>
                      )}
                      {selectedOrg.isHRMS_enabled && (
                        <Badge
                          variant="outline"
                          className="bg-purple-50 text-purple-700"
                        >
                          HRMS Enabled
                        </Badge>
                      )}
                      {selectedOrg.isTaskManagement_enabled && (
                        <Badge
                          variant="outline"
                          className="bg-orange-50 text-orange-700"
                        >
                          Task Management
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label
                      className={`text-xs sm:text-sm font-medium ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Email
                    </Label>
                    <p
                      className={`mt-1 text-sm sm:text-base break-words ${
                        theme === "dark" ? "text-gray-200" : ""
                      }`}
                    >
                      {safeString(selectedOrg.email) || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <Label
                      className={`text-xs sm:text-sm font-medium ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Phone
                    </Label>
                    <p
                      className={`mt-1 text-sm sm:text-base ${
                        theme === "dark" ? "text-gray-200" : ""
                      }`}
                    >
                      {safeString(selectedOrg.phone_number) || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <Label
                      className={`text-xs sm:text-sm font-medium ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Member Count
                    </Label>
                    <p
                      className={`mt-1 text-sm sm:text-base ${
                        theme === "dark" ? "text-gray-200" : ""
                      }`}
                    >
                      {selectedOrg.member_count || 0} members
                    </p>
                  </div>
                  <div>
                    <Label
                      className={`text-xs sm:text-sm font-medium ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Location
                    </Label>
                    <p
                      className={`mt-1 text-sm sm:text-base break-words ${
                        theme === "dark" ? "text-gray-200" : ""
                      }`}
                    >
                      {[
                        selectedOrg.city,
                        selectedOrg.state,
                        selectedOrg.country,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <Label
                      className={`text-xs sm:text-sm font-medium ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Created
                    </Label>
                    <p
                      className={`mt-1 text-sm sm:text-base ${
                        theme === "dark" ? "text-gray-200" : ""
                      }`}
                    >
                      {selectedOrg.createdAt
                        ? new Date(selectedOrg.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <Label
                      className={`text-xs sm:text-sm font-medium ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Last Updated
                    </Label>
                    <p
                      className={`mt-1 text-sm sm:text-base ${
                        theme === "dark" ? "text-gray-200" : ""
                      }`}
                    >
                      {selectedOrg.updatedAt
                        ? new Date(selectedOrg.updatedAt).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <Label
                      className={`text-xs sm:text-sm font-medium ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      ID
                    </Label>
                    <p
                      className={`mt-1 text-xs break-all ${
                        theme === "dark" ? "text-gray-500" : "text-gray-400"
                      }`}
                    >
                      {selectedOrg._id}
                    </p>
                  </div>
                </div>

                {selectedOrg.description && (
                  <div>
                    <Label
                      className={`text-xs sm:text-sm font-medium ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      Description
                    </Label>
                    <p
                      className={`mt-1 text-sm sm:text-base ${
                        theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {selectedOrg.description}
                    </p>
                  </div>
                )}

                {selectedOrg.social_links &&
                  selectedOrg.social_links.length > 0 && (
                    <div>
                      <Label
                        className={`text-xs sm:text-sm font-medium ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Social Links
                      </Label>
                      <div className="mt-1 space-y-1">
                        {selectedOrg.social_links.map((link, index) => (
                          <div key={index} className="text-sm">
                            {Object.entries(link).map(([platform, url]) => (
                              <p
                                key={platform}
                                className="text-blue-600 break-all"
                              >
                                {platform}:{" "}
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline"
                                >
                                  {url}
                                </a>
                              </p>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {error && (
          <div
            className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md border px-4 py-3 rounded z-50 ${
              theme === "dark"
                ? "bg-red-900 border-red-700 text-red-100"
                : "bg-red-100 border-red-400 text-red-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm sm:text-base flex-1 pr-2">{error}</span>
              <button
                className={`shrink-0 hover:opacity-75 ${
                  theme === "dark" ? "text-red-300" : "text-red-500"
                }`}
                onClick={() => dispatch(clearOrganizationError())}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminOrg;
