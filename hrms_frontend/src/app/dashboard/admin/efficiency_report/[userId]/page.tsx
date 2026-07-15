import React from 'react';
import EfficiencyIndicatorView from '@/components/dashboard/ViewAllDashboards/Admin/efficiency-report/EfficiencyIndicatorView';

interface PageProps {
  params: {
    userId: string;
  };
}

export default function EfficiencyReportPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <EfficiencyIndicatorView />
    </div>
  );
}
