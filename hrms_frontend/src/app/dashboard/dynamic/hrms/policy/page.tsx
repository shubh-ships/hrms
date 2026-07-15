

import PolicyDashboard from '@/components/dashboard/ViewAllDashboards/Hrms/policy/PolicyDashboard'
import React from 'react'

const page = () => {
  return (
   <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Policy Management</h1>
        <p className="text-muted-foreground">
          Configure attendance policies for your organization
        </p>
      </div>
      <PolicyDashboard />
    </div>
  )
}

export default page