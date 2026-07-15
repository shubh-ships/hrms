"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createDepartment } from "@/features/departments/departmentSlice";
import type { CreateDepartmentRequest } from "@/lib/types/api/department";
import Link from "next/link";
import Image from "next/image";
import movebackIcon from '@/assets/Dashicons/move-back-icon.png'

interface DepartmentForm {
  name: string;
  alias: string;
  description: string;
  is_active: boolean;
  is_verified: boolean;
  organizationId: string;
}

export default function CreateDepartment() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.departments);
  const authState = useAppSelector((state) => state.auth);
  const isOrganizer = useAppSelector((state) => state.auth.isOrganizer);
  const userRole = useAppSelector((state) => state.auth.role);

  const initialOrganizationId = authState?.user?.organizationId || "";

  const [formData, setFormData] = useState<DepartmentForm>({
    name: "",
    alias: "",
    description: "",
    is_active: true,
    is_verified: false,
    organizationId: initialOrganizationId,
  });

  const handleInputChange = (
    field: keyof DepartmentForm,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetForm = () => {
    setFormData({
      name: "",
      alias: "",
      description: "",
      is_active: true,
      is_verified: false,
      organizationId: initialOrganizationId,
    });
  };

  const getCreateRoute = () => {
    if (isOrganizer || userRole?.toLowerCase() === 'admin') {
      return "/dashboard/admin/department/";
    } else {
      return "/dashboard/dynamic/department/";
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Department name is required");
      return;
    }
    if (!formData.alias.trim()) {
      toast.error("Department alias is required");
      return;
    }
    if (!formData.organizationId) {
      toast.error("Organization ID is required");
      return;
    }

    try {
      const departmentData: any = {
        name: formData.name,
        alias: formData.alias,
        description: formData.description || undefined,
        is_active: formData.is_active,
        is_verified: formData.is_verified,
        organization_id: formData.organizationId,
      };

      await dispatch(createDepartment(departmentData)).unwrap();
      toast.success("Department created successfully");
      router.push(getCreateRoute());
    } catch (error) {
      toast.error("Failed to create department");
    }
  };

  const handleCancel = () => {
    router.push(getCreateRoute());
  };

  return (
    <div className="bg-[#f8f9fa]">
      <div className="flex-1 md:p-8 space-y-8 pb-28">
        <div>
          <Link href={`./`}>
            <Image src={movebackIcon} alt="back" className="w-[80px] my-6" />
          </Link>
          <h1 className="text-[26px] font-bold text-slate-800">Create New Department</h1>
        </div>

        <Card className="border border-slate-200 shadow-sm bg-white rounded-xl overflow-hidden mb-8">
          <CardContent className="p-8 space-y-10">
            {/* Basic Information */}
            <div>
              <h3 className="text-[16px] font-bold text-slate-800 mb-2">Basic Information</h3>
              <p className="text-[13px] text-slate-400 mb-6">Fill in the details to create a new department.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[13px] text-slate-500 font-normal">
                    Department Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Marketing Department"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    disabled={loading}
                    className="h-12 bg-white border-slate-200 rounded-lg text-[15px] focus-visible:ring-0 shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alias" className="text-[13px] text-slate-500 font-normal">
                    Department Alias <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="alias"
                    placeholder="e.g. MKT"
                    value={formData.alias}
                    onChange={(e) => handleInputChange("alias", e.target.value)}
                    className="h-12 bg-white border-slate-200 rounded-lg text-[15px] focus-visible:ring-0 shadow-sm font-mono"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationId" className="text-[13px] text-slate-500 font-normal">
                    Organization ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="organizationId"
                    placeholder="Enter Organization ID"
                    value={formData.organizationId}
                    onChange={(e) => handleInputChange("organizationId", e.target.value)}
                    disabled={loading || !!initialOrganizationId}
                    className="h-12 bg-white border-slate-200 rounded-lg text-[15px] focus-visible:ring-0 shadow-sm disabled:bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div className="h-px w-full bg-slate-100" />

            {/* Description */}
            <div>
              <h3 className="text-[16px] font-bold text-slate-800 mb-6">Description</h3>
              <Textarea
                id="description"
                placeholder="Enter a brief description of the department's responsibilities..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
                className="resize-none bg-white border-slate-200 rounded-lg text-[15px] focus-visible:ring-0 shadow-sm p-4 placeholder:text-slate-400"
                disabled={loading}
              />
            </div>

            <div className="h-px w-full bg-slate-100" />

            {/* Status Settings */}
            <div>
              <h3 className="text-[16px] font-bold text-slate-800 mb-6">Status Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between p-5 bg-[#f8f9fa] rounded-xl border border-transparent">
                  <div>
                    <Label htmlFor="is_active" className="font-semibold text-[15px] text-slate-800">
                      Active Status
                    </Label>
                    <p className="text-[14px] text-slate-400 mt-0.5">
                      Enable this department
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                    disabled={loading}
                    className="data-[state=checked]:bg-[#3f5a54]"
                  />
                </div>

                <div className="flex items-center justify-between p-5 bg-[#f8f9fa] rounded-xl border border-transparent">
                  <div>
                    <Label htmlFor="is_verified" className="font-semibold text-[15px] text-slate-800">
                      Verified Status
                    </Label>
                    <p className="text-[14px] text-slate-400 mt-0.5">
                      Mark as verified
                    </p>
                  </div>
                  <Switch
                    id="is_verified"
                    checked={formData.is_verified}
                    onCheckedChange={(checked) => handleInputChange("is_verified", checked)}
                    disabled={loading}
                    className="data-[state=checked]:bg-[#3f5a54]"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed bottom action bar */}
      <div className="fixed left-0 bottom-0 right-0 bg-white border-t border-slate-200 p-4 px-8 flex justify-end items-center gap-4 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] z-30">
        <Button
          variant="outline"
          onClick={handleResetForm}
          disabled={loading}
          className="h-11 px-6 rounded-lg border-slate-300 text-slate-600 hover:bg-slate-50 font-medium text-[15px]"
        >
          Reset Form
        </Button>
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={loading}
          className="h-11 px-8 rounded-lg border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 font-medium text-[15px]"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className="h-11 px-10 rounded-lg bg-[#3d5951] hover:bg-[#2d423b] text-white font-medium text-[15px]"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create"
          )}
        </Button>
      </div>
    </div>
  );
}