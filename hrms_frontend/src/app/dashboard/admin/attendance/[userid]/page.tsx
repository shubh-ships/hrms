import AdminUserAttendanceDetail from '@/components/dashboard/ViewAllDashboards/Hrms/AttendanceOverview/AdminUserAttendanceDetail';
import React from 'react';

// Next.js dynamic route segment
export default async function UserAttendancePage({ params }: { params: Promise<{ userid: string }> }) {
  const resolvedParams = await params;
  return <AdminUserAttendanceDetail userId={resolvedParams.userid} />;
}
