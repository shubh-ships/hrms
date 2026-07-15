
// 'use client'
// import React, { useEffect, useState } from 'react';
// import { useLeavePolicy } from '@/hooks/useLeavePolicy';
// import { LeavePolicy as LeavePolicyType } from '@/lib/types/api/leavePolicy';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Badge } from '@/components/ui/badge';
// import { Label } from '@/components/ui/label';
// import { Skeleton } from '@/components/ui/skeleton';
// import { Button } from '@/components/ui/button';
// import { AlertCircle, Loader2, Calendar, Settings, Users, RefreshCw, X } from 'lucide-react';
// import { toast } from 'sonner';

// interface LeavePolicyViewProps {
//   policies?: LeavePolicyType[];
//   loading?: boolean;
//   error?: string | null;
// }

// const LeavePolicyView: React.FC<LeavePolicyViewProps> = ({
//   policies: externalPolicies,
//   loading: externalLoading,
//   error: externalError
// }) => {
//   const {
//     policies: reduxPolicies,
//     loading: reduxLoading,
//     error: reduxError,
//     success: reduxSuccess,
//     fetchLeavePolicies,
//     clearError,
//     clearSuccess
//   } = useLeavePolicy();

//   const [optimisticPolicies, setOptimisticPolicies] = useState<LeavePolicyType[]>([]);
//   const [activeTab, setActiveTab] = useState('overview');
//   const [isRefreshing, setIsRefreshing] = useState(false);

//   // Use external props if provided, otherwise use Redux data
//   const policies = externalPolicies || reduxPolicies || [];
//   const loading = externalLoading !== undefined ? externalLoading : reduxLoading;
//   const error = externalError !== undefined ? externalError : reduxError;

//   // Sync optimistic policies with Redux data
//   useEffect(() => {
//     if (policies.length > 0) {
//       setOptimisticPolicies(policies);
//     }
//   }, [policies]);

//   // Handle success states
//   useEffect(() => {
//     if (reduxSuccess) {
//       toast.success('Operation completed successfully');
//       clearSuccess();
//     }
//   }, [reduxSuccess, clearSuccess]);

//   // Handle error states with toast notifications
//   useEffect(() => {
//     if (error) {
//       toast.error('Failed to load leave policies', {
//         description: error,
//         action: {
//           label: 'Retry',
//           onClick: () => handleRefresh()
//         }
//       });
//     }
//   }, [error]);

//   const handleRefresh = async () => {
//     setIsRefreshing(true);
//     try {
//       await fetchLeavePolicies();
//       toast.success('Policies refreshed successfully');
//     } catch (err) {
//       toast.error('Failed to refresh policies');
//     } finally {
//       setIsRefreshing(false);
//     }
//   };

//   const handleErrorDismiss = () => {
//     clearError();
//     toast.success('Error dismissed');
//   };

//   // Optimistic update functions for Redux integration
//   const addOptimisticPolicy = (newPolicy: Omit<LeavePolicyType, '_id'>) => {
//     const tempId = `temp-${Date.now()}`;
//     const optimisticPolicy: LeavePolicyType = {
//       ...newPolicy,
//       _id: tempId,
//       createdAt: new Date().toISOString(),
//       rules: newPolicy.rules || [],
//       weekOffs: newPolicy.weekOffs || []
//     };

//     setOptimisticPolicies(prev => [optimisticPolicy, ...prev]);
//     return tempId;
//   };

//   const revertOptimisticPolicy = (tempId: string) => {
//     setOptimisticPolicies(prev => prev.filter(policy => policy._id !== tempId));
//     toast.error('Failed to create policy');
//   };

//   const confirmOptimisticPolicy = (tempId: string, actualPolicy: LeavePolicyType) => {
//     setOptimisticPolicies(prev => prev.map(policy => 
//       policy._id === tempId ? actualPolicy : policy
//     ));
//   };

//   // Loading skeleton
//   if (loading && !isRefreshing) {
//     return (
//       <div className="max-w-6xl mx-auto p-6 space-y-6">
//         <div className="flex justify-between items-center">
//           <Skeleton className="h-8 w-64" />
//           <Skeleton className="h-10 w-32" />
//         </div>
        
//         <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//           {[...Array(3)].map((_, i) => (
//             <Card key={i} className="animate-pulse">
//               <CardHeader>
//                 <Skeleton className="h-6 w-3/4" />
//                 <Skeleton className="h-4 w-full" />
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <Skeleton className="h-4 w-full" />
//                 <Skeleton className="h-4 w-2/3" />
//                 <Skeleton className="h-4 w-1/2" />
//               </CardContent>
//             </Card>
//           ))}
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-6xl mx-auto p-6 space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Leave Policies</h1>
//           <p className="text-gray-600 mt-1">Manage and view your organization's leave policies</p>
//         </div>
        
//         <Button 
//           onClick={handleRefresh}
//           disabled={isRefreshing}
//           variant="outline"
//           className="flex items-center gap-2"
//         >
//           {isRefreshing ? (
//             <Loader2 className="h-4 w-4 animate-spin" />
//           ) : (
//             <RefreshCw className="h-4 w-4" />
//           )}
//           {isRefreshing ? 'Refreshing...' : 'Refresh'}
//         </Button>
//       </div>

//       {/* Error Alert */}
//       {error && (
//         <Alert variant="destructive" className="animate-in fade-in-0">
//           <AlertCircle className="h-4 w-4" />
//           <AlertDescription className="flex justify-between items-center">
//             <span>{error}</span>
//             <button 
//               onClick={handleErrorDismiss}
//               className="ml-4 px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
//               aria-label="Dismiss error"
//             >
//               <X className="h-3 w-3" />
//             </button>
//           </AlertDescription>
//         </Alert>
//       )}

//       {/* Main Content */}
//       <Card>
//         <CardHeader>
//           <CardTitle className="flex items-center gap-2">
//             <Calendar className="h-5 w-5" />
//             Available Leave Policies
//           </CardTitle>
//           <CardDescription>
//             {optimisticPolicies.length} policy{optimisticPolicies.length !== 1 ? 'ies' : ''} configured
//             {isRefreshing && (
//               <span className="flex items-center gap-1 text-blue-600 ml-2">
//                 <Loader2 className="h-3 w-3 animate-spin" />
//                 Updating...
//               </span>
//             )}
//           </CardDescription>
//         </CardHeader>
        
//         <CardContent>
//           {optimisticPolicies.length === 0 ? (
//             <div className="text-center py-12">
//               <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
//               <h3 className="text-lg font-medium text-gray-900 mb-2">No leave policies found</h3>
//               <p className="text-gray-500 mb-4">Get started by creating your first leave policy.</p>
//               <Button onClick={handleRefresh} variant="outline">
//                 Refresh Policies
//               </Button>
//             </div>
//           ) : (
//             <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
//               <TabsList className="grid w-full grid-cols-3">
//                 <TabsTrigger value="overview" className="flex items-center gap-2">
//                   <Calendar className="h-4 w-4" />
//                   Overview
//                 </TabsTrigger>
//                 <TabsTrigger value="rules" className="flex items-center gap-2">
//                   <Settings className="h-4 w-4" />
//                   Rules & Settings
//                 </TabsTrigger>
//                 <TabsTrigger value="coverage" className="flex items-center gap-2">
//                   <Users className="h-4 w-4" />
//                   Coverage
//                 </TabsTrigger>
//               </TabsList>

//               {/* Overview Tab */}
//               <TabsContent value="overview" className="space-y-4 animate-in fade-in-0">
//                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
//                   {optimisticPolicies.map((policy) => (
//                     <Card key={policy._id} className="hover:shadow-lg transition-shadow duration-200">
//                       <CardHeader>
//                         <div className="flex justify-between items-start">
//                           <CardTitle className="text-lg">{policy.name}</CardTitle>
//                           <Badge variant="secondary">
//                             {policy.rules?.length || 0} rule{(policy.rules?.length || 0) !== 1 ? 's' : ''}
//                           </Badge>
//                         </div>
//                         <CardDescription className="line-clamp-2">{policy.description}</CardDescription>
//                       </CardHeader>
                      
//                       <CardContent className="space-y-3">
//                         <div className="text-sm text-gray-600">
//                           Created: {new Date(policy.createdAt).toLocaleDateString()}
//                         </div>
                        
//                         {policy.weekOffs && policy.weekOffs.length > 0 && (
//                           <div className="flex flex-wrap gap-1">
//                             {policy.weekOffs.slice(0, 3).map((weekOff, index) => (
//                               <Badge key={index} variant="outline" className="text-xs">
//                                 {weekOff.day}
//                               </Badge>
//                             ))}
//                             {policy.weekOffs.length > 3 && (
//                               <Badge variant="outline" className="text-xs">
//                                 +{policy.weekOffs.length - 3} more
//                               </Badge>
//                             )}
//                           </div>
//                         )}
//                       </CardContent>
//                     </Card>
//                   ))}
//                 </div>
//               </TabsContent>

//               {/* Rules & Settings Tab */}
//               <TabsContent value="rules" className="space-y-6 animate-in fade-in-0">
//                 {optimisticPolicies.map((policy) => (
//                   <Card key={policy._id}>
//                     <CardHeader>
//                       <CardTitle>{policy.name}</CardTitle>
//                       <CardDescription>{policy.description}</CardDescription>
//                     </CardHeader>
                    
//                     <CardContent className="space-y-6">
//                       <div>
//                         <Label className="text-base font-medium mb-3 block">Leave Rules</Label>
//                         {policy.rules && policy.rules.length > 0 ? (
//                           <div className="grid gap-3 md:grid-cols-2">
//                             {policy.rules.map((rule, index) => (
//                               <Card key={index} className="bg-gray-50">
//                                 <CardContent className="p-4">
//                                   <div className="flex justify-between items-start mb-2">
//                                     <span className="font-medium capitalize">{rule.ruleType}</span>
//                                     <Badge variant="secondary">{rule.type}</Badge>
//                                   </div>
                                  
//                                   <div className="space-y-1 text-sm">
//                                     {rule.quota && (
//                                       <div className="flex justify-between">
//                                         <span>Quota:</span>
//                                         <span className="font-medium">{rule.quota} days</span>
//                                       </div>
//                                     )}
                                    
//                                     {rule.carryForward && (
//                                       <div className="flex justify-between">
//                                         <span>Carry Forward:</span>
//                                         <span className="font-medium">{rule.maxCarryForwardLimit} days</span>
//                                       </div>
//                                     )}
                                    
//                                     {rule.encashable && (
//                                       <div className="flex justify-between">
//                                         <span>Encashable:</span>
//                                         <Badge variant="outline" className="text-green-600">Yes</Badge>
//                                       </div>
//                                     )}
//                                   </div>
//                                 </CardContent>
//                               </Card>
//                             ))}
//                           </div>
//                         ) : (
//                           <p className="text-gray-500 text-sm">No rules configured for this policy.</p>
//                         )}
//                       </div>

//                       <div>
//                         <Label className="text-base font-medium mb-3 block">Week Offs</Label>
//                         {policy.weekOffs && policy.weekOffs.length > 0 ? (
//                           <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
//                             {policy.weekOffs.map((weekOff, index) => (
//                               <Card key={index} className="bg-blue-50">
//                                 <CardContent className="p-4">
//                                   <div className="flex justify-between items-center mb-2">
//                                     <span className="font-medium capitalize">{weekOff.day}</span>
//                                     <Badge variant="outline">Week Off</Badge>
//                                   </div>
//                                   <div className="text-sm">
//                                     <span className="text-gray-600">Occurrence: </span>
//                                     {weekOff.occurrence?.join(', ') || 'Not specified'}
//                                   </div>
//                                 </CardContent>
//                               </Card>
//                             ))}
//                           </div>
//                         ) : (
//                           <p className="text-gray-500 text-sm">No week offs configured for this policy.</p>
//                         )}
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </TabsContent>

//               {/* Coverage Tab */}
//               <TabsContent value="coverage" className="space-y-6 animate-in fade-in-0">
//                 {optimisticPolicies.map((policy) => (
//                   <Card key={policy._id}>
//                     <CardHeader>
//                       <CardTitle>{policy.name} - Coverage</CardTitle>
//                       <CardDescription>Employee groups and applicability</CardDescription>
//                     </CardHeader>
                    
//                     <CardContent>
//                       <div className="space-y-4">
//                         {policy.rules && policy.rules.length > 0 ? (
//                           policy.rules.map((rule, index) => (
//                             <div key={index} className="border rounded-lg p-4">
//                               <Label className="font-medium mb-3 block capitalize">
//                                 {rule.ruleType} Rule Coverage
//                               </Label>
//                               {rule.applicableTo && rule.applicableTo.length > 0 ? (
//                                 <>
//                                   <div className="flex flex-wrap gap-2">
//                                     {rule.applicableTo.map((group, groupIndex) => (
//                                       <Badge key={groupIndex} variant="secondary" className="px-3 py-1">
//                                         {group}
//                                       </Badge>
//                                     ))}
//                                   </div>
//                                   <p className="text-sm text-gray-600 mt-2">
//                                     Applies to {rule.applicableTo.length} employee group{rule.applicableTo.length !== 1 ? 's' : ''}
//                                   </p>
//                                 </>
//                               ) : (
//                                 <p className="text-gray-500 text-sm">No employee groups specified for this rule.</p>
//                               )}
//                             </div>
//                           ))
//                         ) : (
//                           <p className="text-gray-500 text-sm">No rules configured for this policy.</p>
//                         )}
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </TabsContent>
//             </Tabs>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default LeavePolicyView;








'use client'
import React, { useEffect, useState } from 'react';
import { useLeavePolicy } from '@/hooks/useLeavePolicy';
import { LeavePolicy as LeavePolicyType } from '@/lib/types/api/leavePolicy';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2, Calendar, Settings, Users, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';

interface LeavePolicyViewProps {
  policies?: LeavePolicyType[];
  loading?: boolean;
  error?: string | null;
}

const LeavePolicyView: React.FC<LeavePolicyViewProps> = ({
  policies: externalPolicies,
  loading: externalLoading,
  error: externalError
}) => {
  const {
    policies: reduxPolicies,
    loading: reduxLoading,
    error: reduxError,
    success: reduxSuccess,
    fetchLeavePolicies,
    clearError,
    clearSuccess
  } = useLeavePolicy();

  const [optimisticPolicies, setOptimisticPolicies] = useState<LeavePolicyType[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use external props if provided, otherwise use Redux data
  const policies = externalPolicies || reduxPolicies || [];
  const loading = externalLoading !== undefined ? externalLoading : reduxLoading;
  const error = externalError !== undefined ? externalError : reduxError;

  // Sync optimistic policies with Redux data
  useEffect(() => {
    if (policies.length > 0) {
      setOptimisticPolicies(policies);
    }
  }, [policies]);

  // Handle success states
  useEffect(() => {
    if (reduxSuccess) {
      toast.success('Operation completed successfully');
      clearSuccess();
    }
  }, [reduxSuccess, clearSuccess]);

  // Handle error states with toast notifications
  useEffect(() => {
    if (error) {
      toast.error('Failed to load leave policies', {
        description: error,
        action: {
          label: 'Retry',
          onClick: () => handleRefresh()
        }
      });
    }
  }, [error]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchLeavePolicies();
      toast.success('Policies refreshed successfully');
    } catch (err) {
      toast.error('Failed to refresh policies');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleErrorDismiss = () => {
    clearError();
    toast.success('Error dismissed');
  };

  // Loading skeleton
  if (loading && !isRefreshing) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Leave Policies</h1>
          <p className="text-gray-600 mt-1">Manage and view your organization's leave policies</p>
        </div>
        
        <Button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="animate-in fade-in-0">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={handleErrorDismiss}
              className="ml-4 px-2 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              aria-label="Dismiss error"
            >
              <X className="h-3 w-3" />
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Available Leave Policies
          </CardTitle>
          <CardDescription>
            {optimisticPolicies.length} policy{optimisticPolicies.length !== 1 ? 'ies' : ''} configured
            {isRefreshing && (
              <span className="flex items-center gap-1 text-blue-600 ml-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Updating...
              </span>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {optimisticPolicies.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No leave policies found</h3>
              <p className="text-gray-500 mb-4">Get started by creating your first leave policy.</p>
              <Button onClick={handleRefresh} variant="outline">
                Refresh Policies
              </Button>
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="rules" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Rules & Settings
                </TabsTrigger>
                <TabsTrigger value="coverage" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Coverage
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4 animate-in fade-in-0">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {optimisticPolicies.map((policy) => (
                    <Card key={policy._id} className="hover:shadow-lg transition-shadow duration-200">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{policy.name}</CardTitle>
                          <Badge variant="secondary">
                            {policy.rules?.length || 0} rule{(policy.rules?.length || 0) !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">{policy.description}</CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <div className="text-sm text-gray-600">
                          Created: {new Date(policy.createdAt).toLocaleDateString()}
                        </div>
                        
                        {policy.weekOffs && policy.weekOffs.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {policy.weekOffs.slice(0, 3).map((weekOff, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {weekOff.day}
                              </Badge>
                            ))}
                            {policy.weekOffs.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{policy.weekOffs.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Rules & Settings Tab */}
              <TabsContent value="rules" className="space-y-6 animate-in fade-in-0">
                {optimisticPolicies.map((policy) => (
                  <Card key={policy._id}>
                    <CardHeader>
                      <CardTitle>{policy.name}</CardTitle>
                      <CardDescription>{policy.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <div>
                        <Label className="text-base font-medium mb-3 block">Leave Rules</Label>
                        {policy.rules && policy.rules.length > 0 ? (
                          <div className="grid gap-3 md:grid-cols-2">
                            {policy.rules.map((rule, index) => (
                              <Card key={index} className="bg-gray-50">
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-start mb-2">
                                    <span className="font-medium">Leave Rule</span>
                                    <Badge variant="secondary">{rule.leaveType}</Badge>
                                  </div>
                                  
                                  <div className="space-y-1 text-sm">
                                    <div className="flex justify-between">
                                      <span>Quota:</span>
                                      <span className="font-medium">{rule.quota} days</span>
                                    </div>
                                    
                                    <div className="flex justify-between">
                                      <span>Frequency:</span>
                                      <span className="font-medium capitalize">{rule.frequency}</span>
                                    </div>
                                    
                                    {rule.carryForward && (
                                      <div className="flex justify-between">
                                        <span>Carry Forward:</span>
                                        <span className="font-medium">{rule.maxCarryForwardLimit} days</span>
                                      </div>
                                    )}
                                    
                                    {rule.encashable && (
                                      <div className="flex justify-between">
                                        <span>Encashable:</span>
                                        <Badge variant="outline" className="text-green-600">Yes</Badge>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No rules configured for this policy.</p>
                        )}
                      </div>

                      <div>
                        <Label className="text-base font-medium mb-3 block">Week Offs</Label>
                        {policy.weekOffs && policy.weekOffs.length > 0 ? (
                          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {policy.weekOffs.map((weekOff, index) => (
                              <Card key={index} className="bg-blue-50">
                                <CardContent className="p-4">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-medium capitalize">{weekOff.day}</span>
                                    <Badge variant="outline">Week Off</Badge>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-gray-600">Occurrence: </span>
                                    {weekOff.occurrence?.join(', ') || 'Not specified'}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">No week offs configured for this policy.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Coverage Tab */}
              <TabsContent value="coverage" className="space-y-6 animate-in fade-in-0">
                {optimisticPolicies.map((policy) => (
                  <Card key={policy._id}>
                    <CardHeader>
                      <CardTitle>{policy.name} - Coverage</CardTitle>
                      <CardDescription>Employee groups and applicability</CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        {policy.rules && policy.rules.length > 0 ? (
                          policy.rules.map((rule, index) => (
                            <div key={index} className="border rounded-lg p-4">
                              <Label className="font-medium mb-3 block">
                                {rule.leaveType} - Coverage
                              </Label>
                              {rule.applicableTo && rule.applicableTo.length > 0 ? (
                                <>
                                  <div className="flex flex-wrap gap-2">
                                    {rule.applicableTo.map((group, groupIndex) => (
                                      <Badge key={groupIndex} variant="secondary" className="px-3 py-1">
                                        {group}
                                      </Badge>
                                    ))}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-2">
                                    Applies to {rule.applicableTo.length} employee group{rule.applicableTo.length !== 1 ? 's' : ''}
                                  </p>
                                </>
                              ) : (
                                <p className="text-gray-500 text-sm">No employee groups specified for this rule.</p>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">No rules configured for this policy.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LeavePolicyView;