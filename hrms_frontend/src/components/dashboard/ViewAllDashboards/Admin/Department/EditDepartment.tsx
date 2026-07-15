"use client";
 
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Building2, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getDepartment,
  updateDepartment,
  clearCurrentDepartment,
} from "@/features/departments/departmentSlice";
import type { UpdateDepartmentRequest } from "@/lib/types/api/department";
import Department from "./Department";
 
export default function EditDepartment() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const alias = searchParams.get("alias");
 
  const dispatch = useAppDispatch();
  const { currentDepartment, loading } = useAppSelector(
    (state) => state.departments
  );
 

 
 
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    is_active: true,
    is_verified: false,
  });
 
  // Fetch department data when component mounts
  useEffect(() => {
    if (alias) {
      dispatch(getDepartment(alias));
    }
    return () => {
      dispatch(clearCurrentDepartment());
    };
  }, [alias, dispatch]);
 
  // Update form data when department is loaded
  useEffect(() => {
    if (currentDepartment) {
      setFormData({
        name: currentDepartment.name,
        description: currentDepartment.description || "",
        category: currentDepartment.category || "",
        is_active: currentDepartment.is_active,
        is_verified: currentDepartment.is_verified,
      });
    }
  }, [currentDepartment]);
 
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
 
  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Department name is required");
      return;
    }
 
    if (!currentDepartment) {
      toast.error("Department not found");
      return;
    }
 
    try {
      const updateData: UpdateDepartmentRequest = {
        name: formData.name,
        description: formData.description || undefined,
        category: formData.category || undefined,
        is_active: formData.is_active,
        is_verified: formData.is_verified,
      };
 
      await dispatch(
        updateDepartment({ alias: currentDepartment.alias, data: updateData })
      ).unwrap();
      toast.success("Department updated successfully");
      router.push("/dashboard/admin/department");
    } catch (error) {
      toast.error("Failed to update department");
    }
  };
 
  const handleCancel = () => {
    router.push("/dashboard/admin/department");
  };
 
  if (loading && !currentDepartment) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading department...</span>
        </div>
      </div>
    );
  }
 
  if (!currentDepartment && !loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Department not found</p>
          <Button onClick={handleCancel}>Back to Departments</Button>
        </div>
      </div>
    );
  }
 
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Departments
        </Button>
        <h1 className="text-2xl font-bold">Edit Department</h1>
      </div>
 
      {/* Edit Department Form */}
      <Card className="bg-white border-2 border-blue-200 max-w-4xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Department Information
          </CardTitle>
          <p className="text-sm text-gray-600">
            Make changes to department information.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Department Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={loading}
                />
              </div>
              {/* <div className="space-y-2">
                <Label htmlFor="alias">Department Alias</Label>
                <Input
                  id="alias"
                  value={currentDepartment?.alias || ""}
                  disabled
                  className="font-mono bg-gray-100"
                />
              </div> */}
            </div>
          </div>
 
          {/* Category */}
          <div>
            <h3 className="text-lg font-medium mb-4">Classification</h3>
            <div className="max-w-md">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Technical">Technical</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Support">Support</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="HR">Human Resources</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
 
          {/* Description */}
          <div>
            <h3 className="text-lg font-medium mb-4">Description</h3>
            <div className="space-y-2">
              <Label htmlFor="description">Department Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={3}
                disabled={loading}
              />
            </div>
          </div>
 
          {/* Status Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">Status Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="is_active" className="font-medium">
                    Active Status
                  </Label>
                  <p className="text-sm text-gray-600">
                    Enable this department
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    handleInputChange("is_active", checked)
                  }
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <Label htmlFor="is_verified" className="font-medium">
                    Verified Status
                  </Label>
                  <p className="text-sm text-gray-600">Mark as verified</p>
                </div>
                <Switch
                  id="is_verified"
                  checked={formData.is_verified}
                  onCheckedChange={(checked) =>
                    handleInputChange("is_verified", checked)
                  }
                  disabled={loading}
                />
              </div>
            </div>
          </div>
 
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
 
 