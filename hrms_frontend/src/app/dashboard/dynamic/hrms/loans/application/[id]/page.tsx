import React from 'react';
import ApplicationDetailPage from '@/components/dashboard/ViewAllDashboards/Member/hrms/loans/ApplicationDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <ApplicationDetailPage id={resolvedParams.id} />;
}
