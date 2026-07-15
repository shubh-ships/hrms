"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  User,
  CheckCircle2,
  BadgeCheck,
  Search,
  Edit2,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  deleteDepartment,
  clearError,
} from "@/features/departments/departmentSlice";

import EditDepartmentModal from "./EditDepartmentModal";

export default function Department() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { departments, loading, error } = useAppSelector(
    (state) => state.departments
  );
  const isOrganizer = useAppSelector((state) => state.auth.isOrganizer);
  const userRole = useAppSelector((state) => state.auth.role);

  const [searchTerm, setSearchTerm] = useState("");
  const [editingDepartment, setEditingDepartment] = useState<any>(null);

  const getCreateRoute = () => {
    if (isOrganizer || userRole?.toLowerCase() === "admin") {
      return "/dashboard/admin/department/create";
    } else {
      return "/dashboard/dynamic/department/create";
    }
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const departmentsArray = Array.isArray(departments) ? departments : [];

  const filteredDepartments = departmentsArray.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dept.category &&
        dept.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const metrics = {
    total: departmentsArray.length,
    active: departmentsArray.filter((d) => d.is_active).length,
    verified: departmentsArray.filter((d) => d.is_verified).length,
    totalUsers: departmentsArray.reduce(
      (sum, d) => sum + (d.userCount || 0),
      0
    ),
  };

  const handleDeleteDepartment = async (alias: string) => {
    if (window.confirm("Are you sure you want to delete this department?")) {
      try {
        await dispatch(deleteDepartment(alias)).unwrap();
        toast.success("Department deleted successfully");
      } catch (error) {
        // Error is handled by the useEffect
      }
    }
  };

  const handleEditDepartment = (department: any) => {
    setEditingDepartment(department);
  };

  const handleCloseEditModal = () => {
    setEditingDepartment(null);
  };

  const getStatusBadge = (isActive: boolean, isVerified: boolean) => {
    if (!isActive) {
      return (
        <span className="inline-flex items-center justify-center px-3 py-1 bg-[#fce8e8] text-[#d93025] rounded-full text-[11px] font-semibold tracking-wide">
          Inactive
        </span>
      );
    }
    if (!isVerified) {
      return (
        <span className="inline-flex items-center justify-center px-3 py-1 bg-[#fef7e0] text-[#f29900] rounded-full text-[11px] font-semibold tracking-wide">
          Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center px-3 py-1 bg-[#e6f4ea] text-[#1e8e3e] rounded-full text-[11px] font-semibold tracking-wide">
        Active
      </span>
    );
  };

  if (loading && departmentsArray.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-[#3f5a54]" />
          <span>Loading departments...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="md:p-8 space-y-8 bg-[#f8f9fa] min-h-screen">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-[20px] font-bold text-slate-800">Department Management</h1>
        <Button
          onClick={() => router.push(getCreateRoute())}
          disabled={loading}
          className="bg-[#48635c] hover:bg-[#344a44] text-white rounded-md h-9 px-4 font-medium shadow-sm transition-colors text-[13px]"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Department
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border border-slate-100 shadow-sm rounded-[10px] bg-white flex flex-col items-center justify-center py-5">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
            <Building2 className="h-[18px] w-[18px] text-slate-500" />
          </div>
          <h3 className="text-[22px] font-bold text-slate-800 mb-0.5">{metrics.total}</h3>
          <p className="text-[12px] text-[#8b98a5] font-medium">Total Departments</p>
        </Card>

        <Card className="border border-slate-100 shadow-sm rounded-[10px] bg-white flex flex-col items-center justify-center py-5">
          <div className="w-10 h-10 rounded-lg bg-[#ebf7ec] flex items-center justify-center mb-3">
            <CheckCircle2 className="h-[18px] w-[18px] text-[#34a853]" />
          </div>
          <h3 className="text-[22px] font-bold text-slate-800 mb-0.5">{metrics.active}</h3>
          <p className="text-[12px] text-[#8b98a5] font-medium">Active Departments</p>
        </Card>

        <Card className="border border-slate-100 shadow-sm rounded-[10px] bg-white flex flex-col items-center justify-center py-5">
          <div className="w-10 h-10 rounded-lg bg-[#e8f0fe] flex items-center justify-center mb-3">
            <BadgeCheck className="h-[18px] w-[18px] text-[#4285f4]" />
          </div>
          <h3 className="text-[22px] font-bold text-slate-800 mb-0.5">{metrics.verified}</h3>
          <p className="text-[12px] text-[#8b98a5] font-medium">Verified Departments</p>
        </Card>

        <Card className="border border-slate-100 shadow-sm rounded-[10px] bg-white flex flex-col items-center justify-center py-5">
          <div className="w-10 h-10 rounded-lg bg-[#f3e8fd] flex items-center justify-center mb-3">
            <User className="h-[18px] w-[18px] text-[#a142f4]" />
          </div>
          <h3 className="text-[22px] font-bold text-slate-800 mb-0.5">{metrics.totalUsers}</h3>
          <p className="text-[12px] text-[#8b98a5] font-medium">Total Users</p>
        </Card>
      </div>

      {/* Departments Table Card */}
      <Card className="border border-slate-100 shadow-sm rounded-[10px] bg-white overflow-hidden pb-4">
        <div className="px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-[17px] font-bold text-slate-800">All Departments</h2>

          <div className="flex justify-between sm:justify-end items-center gap-4 text-[#8b98a5] text-[13px] w-full sm:w-auto">
            <div className="relative w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8b98a5] h-[16px] w-[16px]" />
              <Input
                placeholder="Search Department"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-[42px] border-slate-200 bg-white shadow-none focus-visible:ring-0 rounded-[8px] text-[13px] text-slate-600 placeholder:text-[#8b98a5]"
              />
            </div>
            <div className="whitespace-nowrap font-medium pr-2">
              Showing {filteredDepartments.length} of {departmentsArray.length} Department{departmentsArray.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="w-full">
          <Table>
            <TableHeader className="bg-[#f4f5f7]">
              <TableRow className="border-y border-slate-200 hover:bg-transparent">
                <TableHead className="font-bold text-[12px] text-slate-700 h-11 px-6">Department Name</TableHead>
                <TableHead className="font-bold text-[12px] text-slate-700 h-11">Alias</TableHead>
                <TableHead className="font-bold text-[12px] text-slate-700 h-11">Category</TableHead>
                <TableHead className="font-bold text-[12px] text-slate-700 h-11">Description</TableHead>
                <TableHead className="font-bold text-[12px] text-slate-700 h-11 text-center">Status</TableHead>
                <TableHead className="font-bold text-[12px] text-slate-700 h-11">Created</TableHead>
                <TableHead className="font-bold text-[12px] text-slate-700 h-11 px-6 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && departmentsArray.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 border-b-0">
                    <div className="flex items-center justify-center gap-3 text-slate-500">
                      <Loader2 className="h-5 w-5 animate-spin text-[#48635c]" />
                      <span className="text-[13px]">Loading departments...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredDepartments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-12 text-slate-500 text-[13px] border-b-0"
                  >
                    No departments found.{" "}
                    {searchTerm && "Try adjusting your search terms."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredDepartments.map((dept, index) => (
                  <TableRow
                    key={dept._id}
                    className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${index === filteredDepartments.length - 1 ? 'border-b-0' : ''}`}
                  >
                    <TableCell className="font-medium text-[#2d3748] text-[13px] px-6 py-4">{dept.name}</TableCell>
                    <TableCell>
                      <span className="inline-flex font-mono text-[11px] px-2.5 py-0.5 rounded-full border border-slate-200 bg-white text-slate-600">
                        {dept.alias}
                      </span>
                    </TableCell>
                    <TableCell className="text-[#5e6a75] text-[13px]">{dept.category || "-"}</TableCell>
                    <TableCell
                      className="max-w-[200px] truncate text-[#5e6a75] text-[13px]"
                      title={dept.description}
                    >
                      {dept.description || "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(dept.is_active, dept.is_verified)}
                    </TableCell>
                    <TableCell className="text-[#5e6a75] text-[13px]">
                      {new Date(dept.createdAt).toLocaleDateString('en-GB')}
                    </TableCell>
                    <TableCell className="px-6 relative">
                      <div className="flex justify-center items-center gap-3">
                        <button
                          title="Edit Department"
                          onClick={() => handleEditDepartment(dept)}
                          disabled={loading}
                          className="text-[#34a853] hover:opacity-70 transition-opacity focus:outline-none disabled:opacity-50"
                        >
                          <Edit2 className="h-[14px] w-[14px]" />
                        </button>
                        <button
                          title="Delete Department"
                          onClick={() => handleDeleteDepartment(dept.alias)}
                          disabled={loading}
                          className="text-[#ea4335] hover:opacity-70 transition-opacity focus:outline-none disabled:opacity-50"
                        >
                          <Trash2 className="h-[14px] w-[14px]" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Edit Department Modal */}
      {editingDepartment && (
        <EditDepartmentModal
          department={editingDepartment}
          onClose={handleCloseEditModal}
          loading={loading}
        />
      )}
    </div>
  );
}