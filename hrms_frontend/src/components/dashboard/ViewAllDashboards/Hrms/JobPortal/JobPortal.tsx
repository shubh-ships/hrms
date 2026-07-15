'use client';
import React from 'react';
import { useParams, usePathname } from 'next/navigation';
import PublicJobPortal from './PublicJobPortal/PublicJobPortal';
import AdminJobManagement from './AdminJobManagement';

const JobPortal = () => {
  const params = useParams();
  const pathname = usePathname();
  const org_alias = params.org_alias as string;

  // Check if this is a public view or admin view
  const isPublicView = pathname?.includes('/career/') && org_alias;
  const isAdminView = pathname?.includes('/dashboard/jobs') || pathname?.includes('/admin/jobs');

  if (isPublicView) {
    return (
      <PublicJobPortal 
        orgAlias={org_alias}
        organization={{ name: org_alias.replace(/[-_]/g, ' ') }} 
      />
    );
  }

  if (isAdminView) {
    return <AdminJobManagement />;
  }

  return (
    <div>Loading...</div>
  );
};

export default JobPortal;