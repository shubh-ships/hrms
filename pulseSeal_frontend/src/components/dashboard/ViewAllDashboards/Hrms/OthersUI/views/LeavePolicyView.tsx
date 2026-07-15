"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import movebackIcon from '@/assets/Dashicons/Cloud.png';
import { Plus, MoreVertical, X } from "lucide-react";
import axiosClient from "@/lib/api/client";

const LeavePolicyView = () => {
  const router = useRouter();
  const [leavePolicies, setLeavePolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Auto-dismiss error toast
  useEffect(() => {
    if (!errorMsg) return;
    const t = setTimeout(() => setErrorMsg(null), 4000);
    return () => clearTimeout(t);
  }, [errorMsg]);

  // Fetch all leave templates from API
  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await axiosClient.get("/leave/templates");
        // API returns { data: { data: [...], pagination: {...} } }
        const raw = res.data?.data?.data || res.data?.data || [];
        const mapped = raw.map((t: any) => ({
          id: String(t._id),
          name: t.name,
          status: t.status === "ACTIVE" ? "Active" : "Inactive",
          totalLeaves: (t.leaveCategories || []).reduce(
            (sum: number, c: any) => sum + (c.leaveCount || 0),
            0
          ),
          assignedStaff: 0, // populated below
        }));

        // Fetch each template's assigned staff count in parallel
        const withCounts = await Promise.all(
          mapped.map(async (policy: any) => {
            try {
              const staffRes = await axiosClient.get(
                `/leave/templates/${policy.id}/staff?limit=1`
              );
              const total = staffRes.data?.data?.pagination?.total ?? 0;
              return { ...policy, assignedStaff: total };
            } catch {
              return policy; // leave count as 0 on error
            }
          })
        );

        setLeavePolicies(withCounts);
      } catch (err: any) {
        console.error("Failed to fetch leave policies:", err);
        setErrorMsg(err?.response?.data?.message || "Failed to load leave policies.");
      } finally {
        setLoading(false);
      }
    };
    fetchPolicies();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId !== null) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  const handleDelete = async (id: string) => {
    try {
      await axiosClient.delete(`/leave/templates/${id}?permanent=true`);
      setLeavePolicies(prev => prev.filter(p => p.id !== id));
      setDeleteModalId(null);
    } catch (err: any) {
      console.error("Failed to delete leave policy:", err);
      setErrorMsg(err?.response?.data?.message || "Failed to delete policy. Please try again.");
      setDeleteModalId(null);
    }
  };

  const handleEdit = (id: string) => {
    sessionStorage.setItem('editLeavePolicyId', id);
    router.push("/dashboard/admin/hrms/others/leave-policy/new-template");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-2 border-[#3e554d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#fcfcfc]">
      {/* Main Container Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] p-8">

        {leavePolicies.length === 0 ? (
          // === EMPTY STATE ===
          <div className="flex flex-col items-center justify-center min-h-[450px] animate-in fade-in duration-300">
            <div className="w-[124px] h-[124px] mb-6 relative">
              <Image
                src={movebackIcon}
                alt="No Leave Policy"
                fill
                className="object-contain opacity-80"
                priority
              />
            </div>
            <h3 className="text-[20px] font-bold text-slate-800 mb-2 font-sans tracking-tight">Create a Leave policy</h3>
            <p className="text-[13px] text-gray-500 mb-8 font-medium">Create and manage your leave policies here</p>
            <Link
              href="/dashboard/admin/hrms/others/leave-policy/new-template"
              onClick={() => sessionStorage.removeItem('editLeavePolicyId')}
              className="flex items-center justify-center gap-1.5 bg-[#3e554d] text-white px-8 py-[10px] rounded-[8px] text-[13px] font-medium hover:bg-[#32453e] transition-colors shadow-sm"
            >
              <Plus size={16} strokeWidth={2.5} />
              Create Leave Policy
            </Link>
          </div>
        ) : (
          // === POPULATED STATE ===
          <>
            {/* Header Section */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-[20px] font-bold text-slate-900 leading-tight">Leave Templates</h2>
                <p className="text-[12px] text-gray-400 mt-1 font-medium opacity-70">Add and save templates of Leave policies</p>
              </div>
              <Link
                href="/dashboard/admin/hrms/others/leave-policy/new-template"
                onClick={() => sessionStorage.removeItem('editLeavePolicyId')}
                className="flex items-center gap-2 bg-[#3e554d] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold hover:bg-[#344641] transition-all shadow-md cursor-pointer"
              >
                <Plus size={18} strokeWidth={2.5} />
                New Template
              </Link>
            </div>

            {/* Policy List Content */}
            <div className="flex flex-col gap-4">
              {leavePolicies.map((policy) => (
                <div
                  key={policy.id}
                  className="group flex items-center justify-between p-5 border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all bg-white"
                >
                  {/* Left Side: Info */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-[15px] font-bold text-slate-800 tracking-tight">{policy.name}</h4>
                      <span className="bg-[#effff6] text-[#3f5a54] text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        {policy.status}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-400 font-medium tracking-tight">
                      Total Leaves: {policy.totalLeaves}
                    </p>
                  </div>

                  {/* Right Side: Actions & Stats */}
                  <div className="flex items-center gap-8 text-[13px] font-semibold text-gray-500">
                    <Link
                      href="/dashboard/admin/hrms/others/leave-policy/assign-staff"
                      className="tracking-tight opacity-80 hover:text-[#3e554d] hover:underline transition-colors cursor-pointer"
                      onClick={() => sessionStorage.setItem('assignStaffPolicyId', policy.id)}
                    >
                      Assigned Staff: {policy.assignedStaff}
                    </Link>
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === policy.id ? null : policy.id)}
                        className={`p-1.5 rounded-lg transition-colors ${openMenuId === policy.id ? 'bg-gray-100 text-[#3e554d]' : 'text-gray-400 hover:bg-gray-50'}`}
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openMenuId === policy.id && (
                        <div ref={menuRef} className="absolute right-0 mt-2 w-[140px] bg-white border border-gray-100 rounded-[10px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-50 py-1 flex flex-col animate-in fade-in zoom-in-95 duration-200">
                          <button
                            onClick={() => { setOpenMenuId(null); handleEdit(policy.id); }}
                            className="flex items-center px-4 py-2.5 text-[13px] text-slate-700 hover:bg-slate-50 transition-colors text-left font-medium w-full"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => { setDeleteModalId(policy.id); setOpenMenuId(null); }}
                            className="flex items-center px-4 py-2 text-[13px] text-red-500 hover:bg-red-50 transition-colors text-left font-medium w-full"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Error Toast */}
      {errorMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] bg-red-500 text-white text-[13px] font-semibold px-5 py-3 rounded-xl shadow-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
          {errorMsg}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalId !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-[400px] rounded-[12px] shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">

            <div className="flex items-center justify-between mb-4 mt-2">
              <h3 className="text-[17px] font-bold text-slate-800">Delete</h3>
              <button
                onClick={() => setDeleteModalId(null)}
                className="p-1 hover:bg-slate-100 text-slate-500 rounded-[6px] transition-colors -mr-2 -mt-2"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            <p className="text-[13.5px] text-slate-500 mb-8 leading-relaxed font-medium">
              Are you sure you want to delete template? This action cannot be reversed.
            </p>

            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setDeleteModalId(null)}
                className="flex-1 py-[9px] rounded-[8px] text-[13.5px] font-bold border border-[#3f5a54] text-[#3f5a54] hover:bg-[#f3f6f5] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteModalId)}
                className="flex-1 py-[9px] rounded-[8px] text-[13.5px] font-bold bg-[#ef4444] text-white hover:bg-red-600 transition-colors shadow-sm cursor-pointer"
              >
                Delete
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default LeavePolicyView;