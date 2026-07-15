// 'use client';
// import React, { useState, useEffect } from 'react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { toast } from 'sonner';
// import { Separator } from '@/components/ui/separator';
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from '@/components/ui/tooltip';
// import { 
//   Plus,
//   RefreshCw,
//   Building2,
//   Copy,
//   Eye,
//   Play,
//   Pause,
//   ExternalLink,
//   Calendar,
//   MapPin,
//   Briefcase,
//   DollarSign,
//   Users,
//   UserCheck,
//   ClipboardList,
//   Loader2,
//   Edit
// } from 'lucide-react';
// import { useJobManagement } from '@/hooks/useJobs';
// import CreateJobDialog from './CreateJobDialog';
// import AllApplicationsManagement from './AllApplicationManagement';
// import EditJobDialog from './EditJobDialog';

// interface TabPanelProps {
//   children?: React.ReactNode;
//   value: string;
//   currentValue: string;
// }

// function TabPanel({ children, value, currentValue }: TabPanelProps) {
//   return (
//     <div hidden={value !== currentValue}>
//       {value === currentValue && children}
//     </div>
//   );
// }

// // Admin Job Card Component
// const AdminJobCard = ({ job, orgAlias, onToggleStatus, onCopyLink, isOperationLoading, loading }: any) => {
//   const [viewPageUrl, setViewPageUrl] = useState('');

//   useEffect(() => {
//     if (orgAlias && job._id) {
//       setViewPageUrl(`${window.location.origin}/career/${orgAlias}/jobs/${job._id}`);
//     }
//   }, [orgAlias, job._id]);

//   const handleViewPage = () => {
//     if (viewPageUrl) {
//       window.open(viewPageUrl, '_blank', 'noopener,noreferrer');
//     }
//   };

//   const handleCopyViewPageLink = () => {
//     if (viewPageUrl) {
//       navigator.clipboard.writeText(viewPageUrl);
//       onCopyLink('Job link copied to clipboard!');
//     }
//   };

//   const getStatusIcon = () => {
//     return job.status === 'Active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />;
//   };

//   const getStatusTooltip = () => {
//     return job.status === 'Active' ? 'Pause Job' : 'Activate Job';
//   };

//   const getStatusVariant = () => {
//     switch (job.status) {
//       case 'Active': return 'default';
//       case 'Closed': return 'destructive';
//       case 'Draft': return 'secondary';
//       default: return 'outline';
//     }
//   };

//   const formatSalary = (salaryRange: any) => {
//     if (!salaryRange?.min || !salaryRange?.max) return null;
//     return `${salaryRange.currency} ${salaryRange.min.toLocaleString()} - ${salaryRange.max.toLocaleString()}`;
//   };

//   return (
//     <Card className="h-full flex flex-col transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
//       <CardContent className="flex-1 p-6">
//         <div className="flex justify-between items-start mb-4">
//           <h3 className="text-lg font-semibold flex-1 mr-2 line-clamp-2">
//             {job.title}
//           </h3>
//           <Badge variant={getStatusVariant()}>
//             {job.status}
//           </Badge>
//         </div>

//         <p className="text-muted-foreground mb-4 line-clamp-3 text-sm leading-relaxed">
//           {job.description.length > 120 ? `${job.description.substring(0, 120)}...` : job.description}
//         </p>

//         {/* Job Details */}
//         <div className="space-y-3 mb-4">
//           <div className="flex items-center gap-2 text-sm">
//             <MapPin className="h-4 w-4 text-muted-foreground" />
//             <span className="text-muted-foreground">{job.location}</span>
//           </div>

//           <div className="flex items-center gap-2 text-sm">
//             <Briefcase className="h-4 w-4 text-muted-foreground" />
//             <span className="text-muted-foreground">{job.department}</span>
//           </div>

//           <div className="flex items-center gap-2 text-sm">
//             <Users className="h-4 w-4 text-muted-foreground" />
//             <span className="text-muted-foreground">
//               {job.employmentType} • {job.experienceLevel}
//             </span>
//           </div>

//           {job.salaryRange?.min && (
//             <div className="flex items-center gap-2 text-sm">
//               <DollarSign className="h-4 w-4 text-muted-foreground" />
//               <span className="text-muted-foreground font-medium">
//                 {formatSalary(job.salaryRange)}
//               </span>
//             </div>
//           )}

//           {job.applicationDeadline && (
//             <div className="flex items-center gap-2 text-sm">
//               <Calendar className="h-4 w-4 text-muted-foreground" />
//               <span className="text-muted-foreground">
//                 Apply by: {new Date(job.applicationDeadline).toLocaleDateString()}
//               </span>
//             </div>
//           )}
//         </div>

//         <div className="text-sm text-muted-foreground mb-4">
//           {job.views || 0} views • {job.numberOfOpenings} opening(s)
//         </div>

//         {/* <div className="flex justify-between items-center pt-4 border-t">
//           <div className="flex gap-1">
//            <TooltipProvider>
//   <Tooltip>
//     <TooltipTrigger asChild>
//       <Button
//         variant={job.status === 'Active' ? 'outline' : 'default'}
//         size="sm"
//         onClick={() => onToggleStatus(job._id)}
//         disabled={isOperationLoading || loading}
//         className="flex items-center gap-2 min-w-[90px]"
//       >
//         {isOperationLoading ? (
//           <>
//             <Loader2 className="h-4 w-4 animate-spin" />
//             <span className="text-xs">Processing...</span>
//           </>
//         ) : (
//           <>
//             {getStatusIcon()}
//             <span className="text-xs font-medium">
//               {job.status === 'Active' ? 'Deactivate' : 'Activate'}
//             </span>
//           </>
//         )}
//       </Button>
//     </TooltipTrigger>
//     <TooltipContent>
//       {job.status === 'Active' 
//         ? 'Click to deactivate this job posting' 
//         : 'Click to activate this job posting'
//       }
//     </TooltipContent>
//   </Tooltip>
// </TooltipProvider>

//           </div>
          
//         </div> */}


//         // In AdminJobCard component, update the action buttons section
// <div className="flex justify-between items-center pt-4 border-t">
//   <div className="flex gap-1">
//     <TooltipProvider>
//       <Tooltip>
//         <TooltipTrigger asChild>
//           <Button
//             variant={job.status === 'Active' ? 'outline' : 'default'}
//             size="sm"
//             onClick={() => onToggleStatus(job._id)}
//             disabled={isOperationLoading || loading}
//             className="flex items-center gap-2 min-w-[90px]"
//           >
//             {isOperationLoading ? (
//               <>
//                 <Loader2 className="h-4 w-4 animate-spin" />
//                 <span className="text-xs">Processing...</span>
//               </>
//             ) : (
//               <>
//                 {getStatusIcon()}
//                 <span className="text-xs font-medium">
//                   {job.status === 'Active' ? 'Deactivate' : 'Activate'}
//                 </span>
//               </>
//             )}
//           </Button>
//         </TooltipTrigger>
//         <TooltipContent>
//           {job.status === 'Active' 
//             ? 'Click to deactivate this job posting' 
//             : 'Click to activate this job posting'
//           }
//         </TooltipContent>
//       </Tooltip>
//     </TooltipProvider>

//     {/* Add Edit Button */}
//     <TooltipProvider>
//       <Tooltip>
//         <TooltipTrigger asChild>
//           <Button
//             variant="outline"
//             size="sm"
//             onClick={() => onEditJob(job)}
//             disabled={loading}
//             className="flex items-center gap-2"
//           >
//             <Edit className="h-4 w-4" />
//             <span className="text-xs font-medium">Edit</span>
//           </Button>
//         </TooltipTrigger>
//         <TooltipContent>
//           Edit job details
//         </TooltipContent>
//       </Tooltip>
//     </TooltipProvider>
//   </div>
  
//   <div className="flex gap-1">
//     <TooltipProvider>
//       <Tooltip>
//         <TooltipTrigger asChild>
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={handleCopyViewPageLink}
//           >
//             <Copy className="h-4 w-4" />
//           </Button>
//         </TooltipTrigger>
//         <TooltipContent>Copy job link</TooltipContent>
//       </Tooltip>
//     </TooltipProvider>

//     <TooltipProvider>
//       <Tooltip>
//         <TooltipTrigger asChild>
//           <Button
//             variant="ghost"
//             size="sm"
//             onClick={handleViewPage}
//           >
//             <ExternalLink className="h-4 w-4" />
//           </Button>
//         </TooltipTrigger>
//         <TooltipContent>View public page</TooltipContent>
//       </Tooltip>
//     </TooltipProvider>
//   </div>
// </div>

//       </CardContent>
//     </Card>
//   );
// };

// // Job Grid Component
// const JobGrid = ({ jobs, orgAlias, onToggleStatus, onCopyLink, operationLoading, loading }: any) => (
//   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//     {jobs.map((job: any) => (
//       <AdminJobCard
//         key={job._id}
//         job={job}
//         orgAlias={orgAlias}
//         onToggleStatus={onToggleStatus}
//         onCopyLink={onCopyLink}
//         isOperationLoading={operationLoading === job._id}
//         loading={loading}
//       />
//     ))}
//   </div>
// );

// // Main AdminJobManagement Component
// const AdminJobManagement = () => {
//   const {
//     jobs,
//     organizationApplicationsCount,
//     loading,
//     createNewJob,
//     toggleJobActiveStatus,
//     fetchOrganizationAllJobs,
//     updateJob,
//     fetchOrganizationApplications,
//     currentOrganization
//   } = useJobManagement();
  
//   const [operationLoading, setOperationLoading] = useState<string | null>(null);
//   const [createDialogOpen, setCreateDialogOpen] = useState(false);
//     const [editDialogOpen, setEditDialogOpen] = useState(false); // Add this
//   const [selectedJob, setSelectedJob] = useState(null); // Add this
//   const [activeTab, setActiveTab] = useState('all');

//     // Add this function to handle edit job
//   const handleEditJob = (job: any) => {
//     setSelectedJob(job);
//     setEditDialogOpen(true);
//   };

//   // Add this function to handle update job
//   const handleUpdateJob = async (jobId: string, jobData: any) => {
//     try {
//       await updateJob({ jobId, data: jobData });
//       setEditDialogOpen(false);
//       setSelectedJob(null);
//       await fetchOrganizationAllJobs();
//       toast.success('Job updated successfully!');
//     } catch (error: any) {
//       toast.error(error.message || 'Failed to update job');
//       throw error;
//     }
//   };


//   useEffect(() => {
//     fetchOrganizationAllJobs();
//     fetchOrganizationApplications();
//   }, [fetchOrganizationAllJobs, fetchOrganizationApplications]);

//   const orgAlias = currentOrganization?.org_alias || '';

//   const handleToggleStatus = async (jobId: string) => {
//     if (!jobId) {
//       toast.error('Invalid job ID');
//       return;
//     }

//     setOperationLoading(jobId);
    
//     try {

      
//       const result = await toggleJobActiveStatus(jobId);
      
//       // Refresh the jobs list after successful toggle
//       await fetchOrganizationAllJobs();
      
//       toast.success('Job status updated successfully!');
//     } catch (error: any) {
//       console.error('Toggle status error:', error);
      
//       // More specific error handling
//       const errorMessage = error?.message || 
//                           error?.response?.data?.message || 
//                           'Failed to update job status';
      
//       toast.error(errorMessage);
//     } finally {
//       setOperationLoading(null);
//     }
//   };

//   const handleCopyLink = (message: string) => {
//     toast.success(message, { duration: 2000 });
//   };

//   const handleCreateJob = async (jobData: any) => {
//     try {
//       await createNewJob(jobData);
//       setCreateDialogOpen(false);
//       await fetchOrganizationAllJobs();
//       toast.success('Job created successfully!');
//     } catch (error: any) {
//       toast.error(error.message || 'Failed to create job');
//       throw error;
//     }
//   };

//   const handleRefresh = async () => {
//     try {
//       await fetchOrganizationAllJobs();
//       if (activeTab === 'all-applications') {
//         await fetchOrganizationApplications();
//       }
//       toast.success('Data refreshed!');
//     } catch (error: any) {
//       toast.error('Failed to refresh data');
//     }
//   };

//   const handleCopyCareerPageLink = () => {
//     if (!orgAlias) {
//       toast.error('Organization alias not available');
//       return;
//     }
    
//     const careerLink = `${window.location.origin}/career/${orgAlias}`;
//     navigator.clipboard.writeText(careerLink);
//     toast.success('Career page link copied to clipboard!');
//   };

//   const handleViewCareerPage = () => {
//     if (!orgAlias) return;
    
//     const careerLink = `${window.location.origin}/career/${orgAlias}`;
//     window.open(careerLink, '_blank', 'noopener,noreferrer');
//   };

//   const getFilteredJobs = () => {
//     switch (activeTab) {
//       case 'all': return jobs;
//       case 'active': return jobs.filter(job => job.status === 'Active');
//       case 'closed': return jobs.filter(job => job.status === 'Closed');
//       case 'draft': return jobs.filter(job => job.status === 'Draft');
//       default: return jobs;
//     }
//   };

//   const filteredJobs = getFilteredJobs();

//   if (loading && jobs.length === 0) {
//     return (
//       <div className="flex justify-center items-center min-h-[400px]">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto p-6 space-y-6">
//       {/* Header */}
//       <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
//         <div className="flex-1">
//           <h1 className="text-3xl font-bold tracking-tight mb-2">Job Management</h1>
          
//           {orgAlias && (
//             <div className="space-y-3">
//               <div className="flex items-center gap-2">
//                 <Building2 className="h-5 w-5" />
//                 <span className="text-lg font-semibold">{currentOrganization?.name}</span>
//               </div>
              
//               <div className="flex flex-wrap items-center gap-2">
//                 <span className="text-sm text-muted-foreground">Public Career Page:</span>
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   onClick={handleCopyCareerPageLink}
//                 >
//                   <Copy className="h-4 w-4 mr-2" />
//                   Copy Link
//                 </Button>
//                 <Button
//                   size="sm"
//                   variant="outline"
//                   onClick={handleViewCareerPage}
//                 >
//                   <Eye className="h-4 w-4 mr-2" />
//                   View Public Page
//                 </Button>
//               </div>
//             </div>
//           )}
//         </div>
        
//         <div className="flex gap-2">
//           <Button
//             variant="outline"
//             onClick={handleRefresh}
//             disabled={loading}
//           >
//             <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
//             Refresh
//           </Button>
//           <Button onClick={() => setCreateDialogOpen(true)}>
//             <Plus className="h-4 w-4 mr-2" />
//             Post New Job
//           </Button>
//         </div>
//       </div>

//       {/* Tabs */}
//       <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
//         <TabsList className="grid w-full grid-cols-6">
//           <TabsTrigger value="all">All Jobs ({jobs.length})</TabsTrigger>
//           <TabsTrigger value="active">Active ({jobs.filter(j => j.status === 'Active').length})</TabsTrigger>
//           <TabsTrigger value="closed">Closed ({jobs.filter(j => j.status === 'Closed').length})</TabsTrigger>
//           <TabsTrigger value="draft">Draft ({jobs.filter(j => j.status === 'Draft').length})</TabsTrigger>
//           <TabsTrigger value="all-applications" className="flex items-center gap-1">
//             <UserCheck className="h-4 w-4" />
//             All Applications ({organizationApplicationsCount})
//           </TabsTrigger>
//           <TabsTrigger value="job-applications" className="flex items-center gap-1">
//             <ClipboardList className="h-4 w-4" />
//             Job Applications
//           </TabsTrigger>
//         </TabsList>

//         <TabsContent value="all" className="mt-6">
//           <JobGrid 
//             jobs={filteredJobs}
//             orgAlias={orgAlias}
//             onToggleStatus={handleToggleStatus}
//             onCopyLink={handleCopyLink}
//             operationLoading={operationLoading}
//             loading={loading}
//           />
//         </TabsContent>

//         <TabsContent value="active" className="mt-6">
//           <JobGrid 
//             jobs={filteredJobs}
//             orgAlias={orgAlias}
//             onToggleStatus={handleToggleStatus}
//             onCopyLink={handleCopyLink}
//             operationLoading={operationLoading}
//             loading={loading}
//           />
//         </TabsContent>

//         <TabsContent value="closed" className="mt-6">
//           <JobGrid 
//             jobs={filteredJobs}
//             orgAlias={orgAlias}
//             onToggleStatus={handleToggleStatus}
//             onCopyLink={handleCopyLink}
//             operationLoading={operationLoading}
//             loading={loading}
//           />
//         </TabsContent>

//         <TabsContent value="draft" className="mt-6">
//           <JobGrid 
//             jobs={filteredJobs}
//             orgAlias={orgAlias}
//             onToggleStatus={handleToggleStatus}
//             onCopyLink={handleCopyLink}
//             operationLoading={operationLoading}
//             loading={loading}
//           />
//         </TabsContent>

//         <TabsContent value="all-applications" className="mt-6">
//           <AllApplicationsManagement />
//         </TabsContent>
//       </Tabs>

//       {/* Empty State for Jobs */}
//       {(['all', 'active', 'closed', 'draft'].includes(activeTab)) && filteredJobs.length === 0 && !loading && (
//         <Card>
//           <CardContent className="text-center py-12">
//             <h3 className="text-lg font-medium text-muted-foreground mb-2">
//               No jobs found
//             </h3>
//             <p className="text-sm text-muted-foreground mb-4">
//               {activeTab === 'all' 
//                 ? 'Create your first job posting to get started!' 
//                 : `No ${activeTab} jobs found`
//               }
//             </p>
//             {activeTab === 'all' && (
//               <Button onClick={() => setCreateDialogOpen(true)}>
//                 <Plus className="h-4 w-4 mr-2" />
//                 Post New Job
//               </Button>
//             )}
//           </CardContent>
//         </Card>
//       )}

//       {/* Create Job Dialog */}
//       <CreateJobDialog
//         open={createDialogOpen}
//         onClose={() => setCreateDialogOpen(false)}
//         onSubmit={handleCreateJob}
//         loading={loading}
//       />
//     </div>
//   );
// };

// export default AdminJobManagement;











'use client';
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Plus,
  RefreshCw,
  Building2,
  Copy,
  Eye,
  Play,
  Pause,
  ExternalLink,
  Calendar,
  MapPin,
  Briefcase,
  DollarSign,
  Users,
  UserCheck,
  ClipboardList,
  Loader2,
  Edit
} from 'lucide-react';
import { useJobManagement } from '@/hooks/useJobs';
import CreateJobDialog from './CreateJobDialog';
import AllApplicationsManagement from './AllApplicationManagement';
import EditJobDialog from './EditJobDialog';
import { UpdateJobRequest } from '@/lib/types/api/job';

interface TabPanelProps {
  children?: React.ReactNode;
  value: string;
  currentValue: string;
}

function TabPanel({ children, value, currentValue }: TabPanelProps) {
  return (
    <div hidden={value !== currentValue}>
      {value === currentValue && children}
    </div>
  );
}

// Admin Job Card Component
// const AdminJobCard = ({ 
//   job, 
//   orgAlias, 
//   onToggleStatus, 
//   onCopyLink, 
//   onEditJob, 
//   isOperationLoading, 
//   loading 
// }: any) => {
//   const [viewPageUrl, setViewPageUrl] = useState('');

//   useEffect(() => {
//     if (orgAlias && job._id) {
//       setViewPageUrl(`${window.location.origin}/career/${orgAlias}/jobs/${job._id}`);
//     }
//   }, [orgAlias, job._id]);

//   const handleViewPage = () => {
//     if (viewPageUrl) {
//       window.open(viewPageUrl, '_blank', 'noopener,noreferrer');
//     }
//   };

//   const handleCopyViewPageLink = () => {
//     if (viewPageUrl) {
//       navigator.clipboard.writeText(viewPageUrl);
//       onCopyLink('Job link copied to clipboard!');
//     }
//   };

//   const getStatusIcon = () => {
//     return job.status === 'Active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />;
//   };

//   const getStatusTooltip = () => {
//     return job.status === 'Active' ? 'Pause Job' : 'Activate Job';
//   };

//   const getStatusVariant = () => {
//     switch (job.status) {
//       case 'Active': return 'default';
//       case 'Closed': return 'destructive';
//       case 'Draft': return 'secondary';
//       default: return 'outline';
//     }
//   };

//   const formatSalary = (salaryRange: any) => {
//     if (!salaryRange?.min || !salaryRange?.max) return null;
//     return `${salaryRange.currency} ${salaryRange.min.toLocaleString()} - ${salaryRange.max.toLocaleString()}`;
//   };

//   return (
//     <Card className="h-full flex flex-col transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
//       <CardContent className="flex-1 p-6">
//         <div className="flex justify-between items-start mb-4">
//           <h3 className="text-lg font-semibold flex-1 mr-2 line-clamp-2">
//             {job.title}
//           </h3>
//           <Badge variant={getStatusVariant()}>
//             {job.status}
//           </Badge>
//         </div>

//         <p className="text-muted-foreground mb-4 line-clamp-3 text-sm leading-relaxed">
//           {job.description.length > 120 ? `${job.description.substring(0, 120)}...` : job.description}
//         </p>

//         {/* Job Details */}
//         <div className="space-y-3 mb-4">
//           <div className="flex items-center gap-2 text-sm">
//             <MapPin className="h-4 w-4 text-muted-foreground" />
//             <span className="text-muted-foreground">{job.location}</span>
//           </div>

//           <div className="flex items-center gap-2 text-sm">
//             <Briefcase className="h-4 w-4 text-muted-foreground" />
//             <span className="text-muted-foreground">{job.department}</span>
//           </div>

//           <div className="flex items-center gap-2 text-sm">
//             <Users className="h-4 w-4 text-muted-foreground" />
//             <span className="text-muted-foreground">
//               {job.employmentType} • {job.experienceLevel}
//             </span>
//           </div>

//           {job.salaryRange?.min && (
//             <div className="flex items-center gap-2 text-sm">
//               <DollarSign className="h-4 w-4 text-muted-foreground" />
//               <span className="text-muted-foreground font-medium">
//                 {formatSalary(job.salaryRange)}
//               </span>
//             </div>
//           )}

//           {job.applicationDeadline && (
//             <div className="flex items-center gap-2 text-sm">
//               <Calendar className="h-4 w-4 text-muted-foreground" />
//               <span className="text-muted-foreground">
//                 Apply by: {new Date(job.applicationDeadline).toLocaleDateString()}
//               </span>
//             </div>
//           )}
//         </div>

//         <div className="text-sm text-muted-foreground mb-4">
//           {job.views || 0} views • {job.numberOfOpenings} opening(s)
//         </div>

//         {/* Action Buttons */}
//         <div className="flex justify-between items-center pt-4 border-t">
//           <div className="flex gap-1">
//             <TooltipProvider>
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <Button
//                     variant={job.status === 'Active' ? 'outline' : 'default'}
//                     size="sm"
//                     onClick={() => onToggleStatus(job._id)}
//                     disabled={isOperationLoading || loading}
//                     className="flex items-center gap-2 min-w-[90px]"
//                   >
//                     {isOperationLoading ? (
//                       <>
//                         <Loader2 className="h-4 w-4 animate-spin" />
//                         <span className="text-xs">Processing...</span>
//                       </>
//                     ) : (
//                       <>
//                         {getStatusIcon()}
//                         <span className="text-xs font-medium">
//                           {job.status === 'Active' ? 'Deactivate' : 'Activate'}
//                         </span>
//                       </>
//                     )}
//                   </Button>
//                 </TooltipTrigger>
//                 <TooltipContent>
//                   {job.status === 'Active' 
//                     ? 'Click to deactivate this job posting' 
//                     : 'Click to activate this job posting'
//                   }
//                 </TooltipContent>
//               </Tooltip>
//             </TooltipProvider>

//             {/* Edit Button */}
//             <TooltipProvider>
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <Button
//                     variant="outline"
//                     size="sm"
//                     onClick={() => onEditJob(job)}
//                     disabled={loading}
//                     className="flex items-center gap-2"
//                   >
//                     <Edit className="h-4 w-4" />
//                     <span className="text-xs font-medium">Edit</span>
//                   </Button>
//                 </TooltipTrigger>
//                 <TooltipContent>
//                   Edit job details
//                 </TooltipContent>
//               </Tooltip>
//             </TooltipProvider>
//           </div>
          
//           <div className="flex gap-1">
//             <TooltipProvider>
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={handleCopyViewPageLink}
//                   >
//                     <Copy className="h-4 w-4" />
//                   </Button>
//                 </TooltipTrigger>
//                 <TooltipContent>Copy job link</TooltipContent>
//               </Tooltip>
//             </TooltipProvider>

//             <TooltipProvider>
//               <Tooltip>
//                 <TooltipTrigger asChild>
//                   <Button
//                     variant="ghost"
//                     size="sm"
//                     onClick={handleViewPage}
//                   >
//                     <ExternalLink className="h-4 w-4" />
//                   </Button>
//                 </TooltipTrigger>
//                 <TooltipContent>View public page</TooltipContent>
//               </Tooltip>
//             </TooltipProvider>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

// Admin Job Card Component
const AdminJobCard = ({ 
  job, 
  onToggleStatus, 
  onEditJob, 
  isOperationLoading, 
  loading 
}: any) => {
  const getStatusIcon = () => {
    return job.status === 'Active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />;
  };

  const getStatusVariant = () => {
    switch (job.status) {
      case 'Active': return 'default';
      case 'Closed': return 'destructive';
      case 'Draft': return 'secondary';
      default: return 'outline';
    }
  };

  const formatSalary = (salaryRange: any) => {
    if (!salaryRange?.min || !salaryRange?.max) return null;
    return `${salaryRange.currency} ${salaryRange.min.toLocaleString()} - ${salaryRange.max.toLocaleString()}`;
  };

  return (
    <Card className="h-full flex flex-col transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
      <CardContent className="flex-1 p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold flex-1 mr-2 line-clamp-2">
            {job.title}
          </h3>
          <Badge variant={getStatusVariant()}>
            {job.status}
          </Badge>
        </div>

        <p className="text-muted-foreground mb-4 line-clamp-3 text-sm leading-relaxed">
          {job.description.length > 120 ? `${job.description.substring(0, 120)}...` : job.description}
        </p>

        {/* Job Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{job.location}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{job.department}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {job.employmentType} • {job.experienceLevel}
            </span>
          </div>

          {job.salaryRange?.min && (
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground font-medium">
                {formatSalary(job.salaryRange)}
              </span>
            </div>
          )}

          {job.applicationDeadline && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Apply by: {new Date(job.applicationDeadline).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground mb-4">
          {job.views || 0} views • {job.numberOfOpenings} opening(s)
        </div>

        {/* Action Buttons - Only Toggle and Edit */}
        <div className="flex gap-2 pt-4 border-t">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={job.status === 'Active' ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => onToggleStatus(job._id)}
                  disabled={isOperationLoading || loading}
                  className="flex items-center gap-2 min-w-[90px]"
                >
                  {isOperationLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-xs">Processing...</span>
                    </>
                  ) : (
                    <>
                      {getStatusIcon()}
                      <span className="text-xs font-medium">
                        {job.status === 'Active' ? 'Deactivate' : 'Activate'}
                      </span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {job.status === 'Active' 
                  ? 'Click to deactivate this job posting' 
                  : 'Click to activate this job posting'
                }
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Edit Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditJob(job)}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  <span className="text-xs font-medium">Edit</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Edit job details
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
};


// Job Grid Component
// const JobGrid = ({ 
//   jobs, 
//   orgAlias, 
//   onToggleStatus, 
//   onCopyLink, 
//   onEditJob, 
//   operationLoading, 
//   loading 
// }: any) => (
//   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//     {jobs.map((job: any) => (
//       <AdminJobCard
//         key={job._id}
//         job={job}
//         orgAlias={orgAlias}
//         onToggleStatus={onToggleStatus}
//         onCopyLink={onCopyLink}
//         onEditJob={onEditJob}
//         isOperationLoading={operationLoading === job._id}
//         loading={loading}
//       />
//     ))}
//   </div>
// );
// Job Grid Component
const JobGrid = ({ 
  jobs, 
  onToggleStatus, 
  onEditJob, 
  operationLoading, 
  loading 
}: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {jobs.map((job: any) => (
      <AdminJobCard
        key={job._id}
        job={job}
        onToggleStatus={onToggleStatus}
        onEditJob={onEditJob}
        isOperationLoading={operationLoading === job._id}
        loading={loading}
      />
    ))}
  </div>
);


// Main AdminJobManagement Component
const AdminJobManagement = () => {
  const {
    jobs,
    organizationApplicationsCount,
    loading,
    createNewJob,
    toggleJobActiveStatus,
    fetchOrganizationAllJobs,
    updateExistingJob,
    fetchOrganizationApplications,
    currentOrganization
  } = useJobManagement();
  
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  // Handle edit job
  const handleEditJob = (job: any) => {
    setSelectedJob(job);
    setEditDialogOpen(true);
  };

  // Handle update job
  // const handleUpdateJob = async (jobId: string, jobData: UpdateJobRequest) => {
  //   try {
  //     await updateExistingJob({ jobId, data: jobData });
  //     setEditDialogOpen(false);
  //     setSelectedJob(null);
  //     await fetchOrganizationAllJobs();
  //     toast.success('Job updated successfully!');
  //   } catch (error: any) {
  //     toast.error(error.message || 'Failed to update job');
  //     throw error;
  //   }
  // };
  // Handle update job - FIXED
const handleUpdateJob = async (jobId: string, jobData: UpdateJobRequest) => {
  try {
    await updateExistingJob(jobId, jobData); 
    setEditDialogOpen(false);
    setSelectedJob(null);
    await fetchOrganizationAllJobs();
    toast.success('Job updated successfully!');
  } catch (error: any) {
    toast.error(error.message || 'Failed to update job');
    throw error;
  }
};


  useEffect(() => {
    fetchOrganizationAllJobs();
    fetchOrganizationApplications();
  }, [fetchOrganizationAllJobs, fetchOrganizationApplications]);

  const orgAlias = currentOrganization?.org_alias || '';

  const handleToggleStatus = async (jobId: string) => {
    if (!jobId) {
      toast.error('Invalid job ID');
      return;
    }

    setOperationLoading(jobId);
    
    try {
      
      
      const result = await toggleJobActiveStatus(jobId);
   
      // Refresh the jobs list after successful toggle
      await fetchOrganizationAllJobs();
      
      toast.success('Job status updated successfully!');
    } catch (error: any) {
      console.error('Toggle status error:', error);
      
      // More specific error handling
      const errorMessage = error?.message || 
                          error?.response?.data?.message || 
                          'Failed to update job status';
      
      toast.error(errorMessage);
    } finally {
      setOperationLoading(null);
    }
  };

  const handleCopyLink = (message: string) => {
    toast.success(message, { duration: 2000 });
  };

  const handleCreateJob = async (jobData: any) => {
    try {
      await createNewJob(jobData);
      setCreateDialogOpen(false);
      await fetchOrganizationAllJobs();
      toast.success('Job created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create job');
      throw error;
    }
  };

  const handleRefresh = async () => {
    try {
      await fetchOrganizationAllJobs();
      if (activeTab === 'all-applications') {
        await fetchOrganizationApplications();
      }
      toast.success('Data refreshed!');
    } catch (error: any) {
      toast.error('Failed to refresh data');
    }
  };

  const handleCopyCareerPageLink = () => {
    if (!orgAlias) {
      toast.error('Organization alias not available');
      return;
    }
    
    const careerLink = `${window.location.origin}/career/${orgAlias}`;
    navigator.clipboard.writeText(careerLink);
    toast.success('Career page link copied to clipboard!');
  };

  const handleViewCareerPage = () => {
    if (!orgAlias) return;
    
    const careerLink = `${window.location.origin}/career/${orgAlias}`;
    window.open(careerLink, '_blank', 'noopener,noreferrer');
  };

  const getFilteredJobs = () => {
    switch (activeTab) {
      case 'all': return jobs;
      case 'active': return jobs.filter(job => job.status === 'Active');
      case 'closed': return jobs.filter(job => job.status === 'Closed');
      case 'draft': return jobs.filter(job => job.status === 'Draft');
      default: return jobs;
    }
  };

  const filteredJobs = getFilteredJobs();

  if (loading && jobs.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Job Management</h1>
          
          {orgAlias && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <span className="text-lg font-semibold">{currentOrganization?.name}</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Public Career Page:</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyCareerPageLink}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleViewCareerPage}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Public Page
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Post New Job
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All Jobs ({jobs.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({jobs.filter(j => j.status === 'Active').length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({jobs.filter(j => j.status === 'Closed').length})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({jobs.filter(j => j.status === 'Draft').length})</TabsTrigger>
          <TabsTrigger value="all-applications" className="flex items-center gap-1">
            <UserCheck className="h-4 w-4" />
            All Applications ({organizationApplicationsCount})
          </TabsTrigger>
          <TabsTrigger value="job-applications" className="flex items-center gap-1">
            <ClipboardList className="h-4 w-4" />
            Job Applications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <JobGrid 
            jobs={filteredJobs}
            orgAlias={orgAlias}
            onToggleStatus={handleToggleStatus}
            onCopyLink={handleCopyLink}
            onEditJob={handleEditJob}
            operationLoading={operationLoading}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="active" className="mt-6">
          <JobGrid 
            jobs={filteredJobs}
            orgAlias={orgAlias}
            onToggleStatus={handleToggleStatus}
            onCopyLink={handleCopyLink}
            onEditJob={handleEditJob}
            operationLoading={operationLoading}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="closed" className="mt-6">
          <JobGrid 
            jobs={filteredJobs}
            orgAlias={orgAlias}
            onToggleStatus={handleToggleStatus}
            onCopyLink={handleCopyLink}
            onEditJob={handleEditJob}
            operationLoading={operationLoading}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="draft" className="mt-6">
          <JobGrid 
            jobs={filteredJobs}
            orgAlias={orgAlias}
            onToggleStatus={handleToggleStatus}
            onCopyLink={handleCopyLink}
            onEditJob={handleEditJob}
            operationLoading={operationLoading}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="all-applications" className="mt-6">
          <AllApplicationsManagement />
        </TabsContent>
      </Tabs>

      {/* Empty State for Jobs */}
      {(['all', 'active', 'closed', 'draft'].includes(activeTab)) && filteredJobs.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No jobs found
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {activeTab === 'all' 
                ? 'Create your first job posting to get started!' 
                : `No ${activeTab} jobs found`
              }
            </p>
            {activeTab === 'all' && (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Post New Job
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Job Dialog */}
      <CreateJobDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreateJob}
        loading={loading}
      />

      {/* Edit Job Dialog */}
      <EditJobDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setSelectedJob(null);
        }}
        onSubmit={handleUpdateJob}
        job={selectedJob}
        loading={loading}
      />
    </div>
  );
};

export default AdminJobManagement;
