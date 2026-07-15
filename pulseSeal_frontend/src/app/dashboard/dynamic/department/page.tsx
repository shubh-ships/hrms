"use client";
 
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchDepartments,
  clearError,
} from "@/features/departments/departmentSlice";
import Department from "@/components/dashboard/ViewAllDashboards/Admin/Department/Department";
 
export default function DepartmentsPage() {
  const dispatch = useAppDispatch();
  const { departments, loading, error, totalCount } = useAppSelector(
    (state) => state.departments
  );
 

  useEffect(() => {
    dispatch(fetchDepartments({}));
  }, [dispatch]);
 
 

  const departmentsArray = Array.isArray(departments) ? departments : [];
 
 

 
  if (loading && departmentsArray.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading departments...</span>
        </div>
      </div>
    );
  }
 
  return (
    <div className="p-6 space-y-6">
      <Department />
    </div>
  );
}
 