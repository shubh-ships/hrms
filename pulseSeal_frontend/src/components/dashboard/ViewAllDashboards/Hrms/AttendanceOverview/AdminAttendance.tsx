"use client";
import React, { useEffect, useState } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchUsers } from "@/features/user/userSlice";
import { UserTable } from "./UserTable";
import { useRouter } from "next/navigation";

const AdminAttendance: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const allUsers = useAppSelector((state) => state.users.users);

  // Updated admin check to use isOrganizer from auth state
  const isOrganizer = useAppSelector((state) => state.auth.isOrganizer);
  const isSuperUser = useAppSelector((state) => state.auth.isSuperUser);
  const isAdmin = isOrganizer || isSuperUser;

  const [quickMarkDate, setQuickMarkDate] = useState<Date>(new Date());

  // Fetch all users
  useEffect(() => {
    if (user?.id && isAdmin && allUsers.length === 0) {
      dispatch(fetchUsers());
    }
  }, [user?.id, isAdmin, allUsers.length, dispatch]);

  const getUserId = (user: any): string | null => {
    if (!user) return null;
    if (user.user_id?._id) return user.user_id._id;
    return user._id || user.id || null;
  };

  const getUserName = (user: any): string => {
    if (!user) return "Unknown User";
    if (user.user_id?.name) return user.user_id.name;
    if (user.parentRoleId?.user_id?.name) return user.parentRoleId.user_id.name;
    return user.name || "Unknown User";
  };

  const getUserEmail = (user: any): string => {
    if (!user) return "No email";
    if (user.user_id?.email) return user.user_id.email;
    if (user.parentRoleId?.user_id?.email) return user.parentRoleId.user_id.email;
    return user.email || "No email";
  };

  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-600">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full bg-[#f8fafc] min-h-screen">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#111827] mb-6">Attendances</h1>
        <UserTable
          users={allUsers as any}
          selectedUserId={null}
          loadingAttendance={false}
          onViewAttendance={(selectedUser) => {
            const userId = getUserId(selectedUser);
            if (userId) {
              router.push(`/dashboard/admin/attendance/${userId}`);
            }
          }}
          quickMarkDate={quickMarkDate}
          onSetQuickMarkDate={setQuickMarkDate}
          getUserId={getUserId}
          getUserName={getUserName}
          getUserEmail={getUserEmail}
        />
      </div>
    </div>
  );
};

export default AdminAttendance;
