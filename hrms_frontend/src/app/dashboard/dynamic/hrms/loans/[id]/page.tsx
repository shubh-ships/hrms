import React from 'react';
import LoanDetailPage from '@/components/dashboard/ViewAllDashboards/Member/hrms/loans/LoanDetailPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <LoanDetailPage id={resolvedParams.id} />;
}
