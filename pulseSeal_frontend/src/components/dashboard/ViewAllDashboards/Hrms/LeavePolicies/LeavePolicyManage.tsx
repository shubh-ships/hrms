// "use client";
// import React, { useEffect, useState } from "react";
// import { useLeavePolicy } from "@/hooks/useLeavePolicy";
// import {
//   CreateLeavePolicyRequest,
//   LeaveRule,
//   WeekOff,
// } from "@/lib/types/api/leavePolicy";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Label } from "@/components/ui/label";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { Loader2, Plus, Trash2, Edit, Calendar, Clock, Users } from "lucide-react";
// import { toast } from "sonner";

// const EMPLOYEE_TYPES = ["Full-Time", "Intern", "Probation", "Notice"] as const;
// const OCCURRENCES = [1, 2, 3, 4, 5] as const;
// const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

// const LeavePolicyManage: React.FC = () => {
//   const {
//     policies,
//     currentPolicy,
//     loading,
//     error,
//     success,
//     createLeavePolicy,
//     fetchLeavePolicies,
//     fetchLeavePolicyById,
//     updateLeavePolicy,
//     deleteLeavePolicy,
//     clearLeavePolicyError,
//     clearSuccess,
//     clearCurrentPolicy,
//   } = useLeavePolicy();

//   const [isCreating, setIsCreating] = useState(false);
//   const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
//   const [optimisticPolicies, setOptimisticPolicies] = useState(policies);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const [formData, setFormData] = useState<CreateLeavePolicyRequest>({
//     name: "",
//     description: "",
//     rules: [],
//     weekOffs: [],
//   });

//   const [newRule, setNewRule] = useState<Partial<LeaveRule>>({
//     // ruleType: "leave",
//     type: "",
//     quota: 0,
//     carryForward: false,
//     encashable: false,
//     maxCarryForwardLimit: 0,
//     applicableTo: [],
//     frequency: "yearly",
//   });

//   const [newWeekOff, setNewWeekOff] = useState<WeekOff>({
//     day: "monday",
//     occurrence: [1, 2, 3, 4, 5],
//   });

//   const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

//   // Sync optimistic state with actual data
//   useEffect(() => {
//     setOptimisticPolicies(policies);
//   }, [policies]);

//   useEffect(() => {
//     fetchLeavePolicies();
//   }, [fetchLeavePolicies]);

//   useEffect(() => {
//     if (success) {
//       toast.success(`Policy ${editingPolicyId ? 'updated' : 'created'} successfully`);
//       setIsCreating(false);
//       setEditingPolicyId(null);
//       resetForm();
//       clearSuccess();
//       clearCurrentPolicy();
//       setIsSubmitting(false);
//     }
//   }, [success, clearSuccess, clearCurrentPolicy, editingPolicyId]);

//   useEffect(() => {
//     if (error) {
//       toast.error(error);
//       setIsSubmitting(false);
//       // Revert optimistic updates on error
//       setOptimisticPolicies(policies);
//     }
//   }, [error, policies]);

//   useEffect(() => {
//     if (editingPolicyId && currentPolicy?._id === editingPolicyId) {
//       setFormData({
//         name: currentPolicy.name,
//         description: currentPolicy.description || "",
//         rules: currentPolicy.rules,
//         weekOffs: currentPolicy.weekOffs,
//       });
//     }
//   }, [currentPolicy, editingPolicyId]);

//   const resetForm = () => {
//     setFormData({
//       name: "",
//       description: "",
//       rules: [],
//       weekOffs: [],
//     });
//     setNewRule({
//       ruleType: "leave",
//       type: "",
//       quota: 0,
//       carryForward: false,
//       encashable: false,
//       maxCarryForwardLimit: 0,
//       applicableTo: [],
//       frequency: "yearly",
//     });
//     setNewWeekOff({
//       day: "monday",
//       occurrence: [1, 2, 3, 4, 5],
//     });
//     setFormErrors({});
//   };

//   const validateForm = (): boolean => {
//     const errors: {[key: string]: string} = {};

//     if (!formData.name.trim()) {
//       errors.name = "Policy name is required";
//     }

//     if (formData.rules.length === 0) {
//       errors.rules = "At least one rule is required";
//     }

//     if (formData.weekOffs.length === 0) {
//       errors.weekOffs = "At least one week off is required";
//     }

//     setFormErrors(errors);
//     return Object.keys(errors).length === 0;
//   };

//   const validateRule = (rule: Partial<LeaveRule>): string[] => {
//     const errors: string[] = [];

//     if (!rule.type?.trim()) {
//       errors.push("Rule type is required");
//     }

//     if (!rule.applicableTo || rule.applicableTo.length === 0) {
//       errors.push("At least one employee type must be selected");
//     }

//     if (rule.ruleType === "leave") {
//       if (rule.quota === undefined || rule.quota < 0) {
//         errors.push("Quota must be a positive number");
//       }
//       if (rule.carryForward && (!rule.maxCarryForwardLimit || rule.maxCarryForwardLimit < 0)) {
//         errors.push("Max carry forward limit is required when carry forward is enabled");
//       }
//     }

//     return errors;
//   };

//   const handleEditPolicy = async (policyId: string) => {
//     setEditingPolicyId(policyId);
//     setIsCreating(true);
//     await fetchLeavePolicyById(policyId);
//   };

//   const handleCancelEdit = () => {
//     setEditingPolicyId(null);
//     setIsCreating(false);
//     resetForm();
//     clearCurrentPolicy();
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!validateForm()) {
//       return;
//     }

//     setIsSubmitting(true);

//     // Optimistic update
//     if (editingPolicyId) {
//       setOptimisticPolicies(prev => 
//         prev.map(policy => 
//           policy._id === editingPolicyId 
//             ? { ...policy, ...formData, updatedAt: new Date().toISOString() }
//             : policy
//         )
//       );
//     } else {
//       const tempId = `temp-${Date.now()}`;
//       const newPolicy = {
//         _id: tempId,
//         ...formData,
//         createdAt: new Date().toISOString(),
//         updatedAt: new Date().toISOString(),
//       };
//       setOptimisticPolicies(prev => [...prev, newPolicy as any]);
//     }

//     try {
//       if (editingPolicyId) {
//         await updateLeavePolicy(editingPolicyId, formData);
//       } else {
//         await createLeavePolicy(formData);
//       }
//     } catch (err) {
//       console.error("Error submitting policy:", err);
//     }
//   };

//   const handleEmployeeTypeSelect = (type: string) => {
//     const newApplicableTo = newRule.applicableTo?.includes(type)
//       ? newRule.applicableTo.filter(t => t !== type)
//       : [...(newRule.applicableTo || []), type];

//     setNewRule(prev => ({
//       ...prev,
//       applicableTo: newApplicableTo,
//     }));
//   };

//   const handleOccurrenceSelect = (occurrence: number) => {
//     const newOccurrence = newWeekOff.occurrence.includes(occurrence)
//       ? newWeekOff.occurrence.filter(o => o !== occurrence)
//       : [...newWeekOff.occurrence, occurrence];

//     setNewWeekOff(prev => ({
//       ...prev,
//       occurrence: newOccurrence.sort(),
//     }));
//   };

//   const handleAddRule = () => {
//     const ruleErrors = validateRule(newRule);
    
//     if (ruleErrors.length > 0) {
//       toast.error(ruleErrors[0]);
//       return;
//     }

//     const ruleToAdd: LeaveRule = {
//       ruleType: newRule.ruleType!,
//       type: newRule.type!,
//       applicableTo: newRule.applicableTo!,
//       ...(newRule.ruleType === "leave" && {
//         quota: newRule.quota || 0,
//         carryForward: newRule.carryForward || false,
//         encashable: newRule.encashable || false,
//         maxCarryForwardLimit: newRule.carryForward ? (newRule.maxCarryForwardLimit || 0) : 0,
//         frequency: newRule.frequency || "yearly",
//       }),
//       // ...(newRule.ruleType === "latePenalty" && {
//       //   gracePeriodMinutes: newRule.gracePeriodMinutes || 0,
//       //   lateThreshold: newRule.lateThreshold || 0,
//       //   penaltyValue: newRule.penaltyValue || 0,
//       //   resetFrequency: newRule.resetFrequency || "monthly",
//       // }),
//     };

//     setFormData(prev => ({
//       ...prev,
//       rules: [...prev.rules, ruleToAdd],
//     }));

//     setNewRule({
//       ruleType: "leave",
//       type: "",
//       quota: 0,
//       carryForward: false,
//       encashable: false,
//       maxCarryForwardLimit: 0,
//       applicableTo: [],
//       frequency: "yearly",
//     });
//   };

//   const handleRemoveRule = (index: number) => {
//     setFormData(prev => ({
//       ...prev,
//       rules: prev.rules.filter((_, i) => i !== index),
//     }));
//   };

//   const handleAddWeekOff = () => {
//     if (newWeekOff.occurrence.length === 0) {
//       toast.error("At least one occurrence must be selected");
//       return;
//     }

//     setFormData(prev => ({
//       ...prev,
//       weekOffs: [...prev.weekOffs, newWeekOff],
//     }));
    
//     setNewWeekOff({
//       day: "monday",
//       occurrence: [1, 2, 3, 4, 5],
//     });
//   };

//   const handleRemoveWeekOff = (index: number) => {
//     setFormData(prev => ({
//       ...prev,
//       weekOffs: prev.weekOffs.filter((_, i) => i !== index),
//     }));
//   };

//   const handleDeletePolicy = async (policyId: string) => {
//     const policyToDelete = policies.find(p => p._id === policyId);
    
//     // Optimistic update
//     setOptimisticPolicies(prev => prev.filter(policy => policy._id !== policyId));

//     try {
//       await deleteLeavePolicy(policyId);
//       toast.success(`Policy "${policyToDelete?.name}" deleted successfully`);
//     } catch (err) {
//       toast.error("Failed to delete policy");
//       // Revert optimistic update on error
//       setOptimisticPolicies(policies);
//     }
//   };

//   if (loading && policies.length === 0) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-7xl mx-auto p-6 space-y-6">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Leave Policy Management</h1>
//           <p className="text-gray-600 mt-1">Create and manage leave policies for your organization</p>
//         </div>
//         <Button
//           onClick={() => {
//             if (isCreating) {
//               handleCancelEdit();
//             } else {
//               setIsCreating(true);
//               setEditingPolicyId(null);
//               resetForm();
//             }
//           }}
//           variant={isCreating ? "outline" : "default"}
//         >
//           {isCreating ? (
//             <>
//               <Trash2 className="w-4 h-4 mr-2" />
//               Cancel
//             </>
//           ) : (
//             <>
//               <Plus className="w-4 h-4 mr-2" />
//               Create New Policy
//             </>
//           )}
//         </Button>
//       </div>

//       {/* Create/Edit Form */}
//       {isCreating && (
//         <Card>
//           <CardHeader>
//             <CardTitle>
//               {editingPolicyId ? "Edit Leave Policy" : "Create New Leave Policy"}
//             </CardTitle>
//             <CardDescription>
//               Configure rules and week offs for your leave policy
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <form onSubmit={handleSubmit} className="space-y-8">
//               {/* Policy Information */}
//               <div className="space-y-4">
//                 <h3 className="text-lg font-medium">Policy Information</h3>
                
//                 <div className="grid md:grid-cols-2 gap-6">
//                   <div className="space-y-2">
//                     <Label htmlFor="policy-name">Policy Name *</Label>
//                     <Input
//                       id="policy-name"
//                       value={formData.name}
//                       onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
//                       placeholder="Enter policy name"
//                       className={formErrors.name ? 'border-red-500' : ''}
//                     />
//                     {formErrors.name && (
//                       <p className="text-red-500 text-sm">{formErrors.name}</p>
//                     )}
//                   </div>

//                   <div className="space-y-2">
//                     <Label htmlFor="policy-description">Description</Label>
//                     <Textarea
//                       id="policy-description"
//                       value={formData.description}
//                       onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
//                       placeholder="Enter policy description"
//                       rows={3}
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Rules Section */}
//               <div className="space-y-4">
//                 <div className="flex justify-between items-center">
//                   <h3 className="text-lg font-medium">Leave Rules *</h3>
//                   {formErrors.rules && (
//                     <p className="text-red-500 text-sm">{formErrors.rules}</p>
//                   )}
//                 </div>

//                 <Tabs defaultValue="existing" className="space-y-4">
//                   <TabsList>
//                     <TabsTrigger value="existing">
//                       Existing Rules ({formData.rules.length})
//                     </TabsTrigger>
//                     <TabsTrigger value="add">
//                       Add New Rule
//                     </TabsTrigger>
//                   </TabsList>

//                   <TabsContent value="existing" className="space-y-3">
//                     {formData.rules.length === 0 ? (
//                       <Alert>
//                         <Clock className="h-4 w-4" />
//                         <AlertTitle>No rules added</AlertTitle>
//                         <AlertDescription>
//                           Add your first rule to get started
//                         </AlertDescription>
//                       </Alert>
//                     ) : (
//                       formData.rules.map((rule, index) => (
//                         <Card key={index}>
//                           <CardContent className="p-4 flex justify-between items-center">
//                             <div className="space-y-2">
//                               <div className="flex items-center space-x-3">
//                                 <Badge variant={rule.ruleType === "leave" ? "default" : "secondary"}>
//                                   {rule.ruleType}
//                                 </Badge>
//                                 <span className="font-medium">{rule.type}</span>
//                               </div>
//                               <div className="text-sm text-gray-600 space-y-1">
//                                 <div className="flex items-center space-x-2">
//                                   <Users className="h-3 w-3" />
//                                   <span>Applicable to: {rule.applicableTo.join(", ")}</span>
//                                 </div>
//                                 {rule.ruleType === "leave" && (
//                                   <>
//                                     <div>Quota: {rule.quota} days • Frequency: {rule.frequency}</div>
//                                     {rule.carryForward && (
//                                       <div>Carry Forward: {rule.maxCarryForwardLimit} days</div>
//                                     )}
//                                     {rule.encashable && <div>Encashable: Yes</div>}
//                                   </>
//                                 )}
//                               </div>
//                             </div>
//                             <Button
//                               type="button"
//                               variant="ghost"
//                               size="sm"
//                               onClick={() => handleRemoveRule(index)}
//                             >
//                               <Trash2 className="h-4 w-4" />
//                             </Button>
//                           </CardContent>
//                         </Card>
//                       ))
//                     )}
//                   </TabsContent>

//                   <TabsContent value="add" className="space-y-4">
//                     <Card>
//                       <CardContent className="p-6 space-y-4">
//                         <div className="grid md:grid-cols-2 gap-4">
//                           <div className="space-y-2">
//                             <Label htmlFor="rule-type">Rule Type</Label>
//                             <Select
//                               value={newRule.ruleType}
//                               onValueChange={(value: "leave" ) => 
//                                 setNewRule(prev => ({ ...prev, ruleType: value }))
//                               }
//                             >
//                               <SelectTrigger>
//                                 <SelectValue />
//                               </SelectTrigger>
//                               <SelectContent>
//                                 <SelectItem value="leave">Leave Rule</SelectItem> 
//                                 {/* <SelectItem value="latePenalty">Late Penalty Rule</SelectItem> */}
//                               </SelectContent>
//                             </Select>
//                           </div>

//                           <div className="space-y-2">
//                             <Label htmlFor="rule-name">Type *</Label>
//                             <Input
//                               id="rule-name"
//                               value={newRule.type || ""}
//                               onChange={(e) => setNewRule(prev => ({ ...prev, type: e.target.value }))}
//                               placeholder="e.g., casual, sick, lateMark"
//                             />
//                           </div>
//                         </div>

//                         <div className="space-y-2">
//                           <Label>Applicable To *</Label>
//                           <div className="flex flex-wrap gap-3">
//                             {EMPLOYEE_TYPES.map((type) => (
//                               <div key={type} className="flex items-center space-x-2">
//                                 <Checkbox
//                                   id={`employee-type-${type}`}
//                                   checked={newRule.applicableTo?.includes(type) || false}
//                                   onCheckedChange={() => handleEmployeeTypeSelect(type)}
//                                 />
//                                 <Label htmlFor={`employee-type-${type}`} className="text-sm">
//                                   {type}
//                                 </Label>
//                               </div>
//                             ))}
//                           </div>
//                         </div>

//                         {newRule.ruleType === "leave" ? (
//                           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
//                             <div className="space-y-2">
//                               <Label htmlFor="quota">Quota (days)</Label>
//                               <Input
//                                 id="quota"
//                                 type="number"
//                                 min="0"
//                                 value={newRule.quota || 0}
//                                 onChange={(e) => setNewRule(prev => ({ ...prev, quota: parseInt(e.target.value) || 0 }))}
//                               />
//                             </div>

//                             <div className="space-y-2">
//                               <Label htmlFor="frequency">Frequency</Label>
//                               <Select
//                                 value={newRule.frequency}
//                                 onValueChange={(value: any) => setNewRule(prev => ({ ...prev, frequency: value }))}
//                               >
//                                 <SelectTrigger>
//                                   <SelectValue />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                   <SelectItem value="monthly">Monthly</SelectItem>
//                                   <SelectItem value="quarterly">Quarterly</SelectItem>
//                                   <SelectItem value="yearly">Yearly</SelectItem>
//                                 </SelectContent>
//                               </Select>
//                             </div>

//                             <div className="space-y-2">
//                               <Label htmlFor="carry-forward">Max Carry Forward</Label>
//                               <Input
//                                 id="carry-forward"
//                                 type="number"
//                                 min="0"
//                                 value={newRule.maxCarryForwardLimit || 0}
//                                 onChange={(e) => setNewRule(prev => ({ ...prev, maxCarryForwardLimit: parseInt(e.target.value) || 0 }))}
//                                 disabled={!newRule.carryForward}
//                               />
//                             </div>

//                             <div className="space-y-3 pt-2">
//                               <div className="flex items-center space-x-2">
//                                 <Checkbox
//                                   id="carry-forward-checkbox"
//                                   checked={newRule.carryForward || false}
//                                   onCheckedChange={(checked) => 
//                                     setNewRule(prev => ({ 
//                                       ...prev, 
//                                       carryForward: checked as boolean,
//                                       maxCarryForwardLimit: checked ? (prev.maxCarryForwardLimit || 0) : 0
//                                     }))
//                                   }
//                                 />
//                                 <Label htmlFor="carry-forward-checkbox">Carry Forward</Label>
//                               </div>
//                               <div className="flex items-center space-x-2">
//                                 <Checkbox
//                                   id="encashable"
//                                   checked={newRule.encashable || false}
//                                   onCheckedChange={(checked) => 
//                                     setNewRule(prev => ({ ...prev, encashable: checked as boolean }))
//                                   }
//                                 />
//                                 <Label htmlFor="encashable">Encashable</Label>
//                               </div>
//                             </div>
//                           </div>
//                         ) : (
//                           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
//                             {/* Late penalty fields */}
//                           </div>
//                         )}

//                         <Button
//                           type="button"
//                           onClick={handleAddRule}
//                           className="w-full"
//                         >
//                           <Plus className="h-4 w-4 mr-2" />
//                           Add Rule
//                         </Button>
//                       </CardContent>
//                     </Card>
//                   </TabsContent>
//                 </Tabs>
//               </div>

//               {/* Week Offs Section */}
//               <div className="space-y-4">
//                 <div className="flex justify-between items-center">
//                   <h3 className="text-lg font-medium">Week Offs *</h3>
//                   {formErrors.weekOffs && (
//                     <p className="text-red-500 text-sm">{formErrors.weekOffs}</p>
//                   )}
//                 </div>

//                 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
//                   {formData.weekOffs.map((weekOff, index) => (
//                     <Badge key={index} variant="secondary" className="p-3 justify-between">
//                       <div>
//                         <span className="capitalize">{weekOff.day}</span>
//                         <span className="text-xs ml-2">Weeks: {weekOff.occurrence.join(", ")}</span>
//                       </div>
//                       <Button
//                         type="button"
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => handleRemoveWeekOff(index)}
//                       >
//                         <Trash2 className="h-3 w-3" />
//                       </Button>
//                     </Badge>
//                   ))}
//                 </div>

//                 <Card>
//                   <CardHeader>
//                     <CardTitle className="text-lg">Add Week Off</CardTitle>
//                   </CardHeader>
//                   <CardContent className="space-y-4">
//                     <div className="grid md:grid-cols-2 gap-6">
//                       <div className="space-y-2">
//                         <Label htmlFor="weekoff-day">Day</Label>
//                         <Select
//                           value={newWeekOff.day}
//                           onValueChange={(value: any) => setNewWeekOff(prev => ({ ...prev, day: value }))}
//                         >
//                           <SelectTrigger>
//                             <SelectValue />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {DAYS.map(day => (
//                               <SelectItem key={day} value={day}>
//                                 {day.charAt(0).toUpperCase() + day.slice(1)}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                       </div>

//                       <div className="space-y-2">
//                         <Label>Occurrence (Weeks)</Label>
//                         <div className="flex flex-wrap gap-2">
//                           {OCCURRENCES.map(occurrence => (
//                             <div key={occurrence} className="flex items-center space-x-1">
//                               <Checkbox
//                                 id={`occurrence-${occurrence}`}
//                                 checked={newWeekOff.occurrence.includes(occurrence)}
//                                 onCheckedChange={() => handleOccurrenceSelect(occurrence)}
//                               />
//                               <Label htmlFor={`occurrence-${occurrence}`} className="text-sm">
//                                 {occurrence}
//                               </Label>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     </div>

//                     <Button
//                       type="button"
//                       onClick={handleAddWeekOff}
//                       variant="outline"
//                       className="w-full"
//                     >
//                       <Calendar className="h-4 w-4 mr-2" />
//                       Add Week Off
//                     </Button>
//                   </CardContent>
//                 </Card>
//               </div>

//               {/* Form Actions */}
//               <div className="flex justify-end space-x-4 pt-6 border-t">
//                 <Button
//                   type="button"
//                   variant="outline"
//                   onClick={handleCancelEdit}
//                   disabled={isSubmitting}
//                 >
//                   Cancel
//                 </Button>
//                 <Button
//                   type="submit"
//                   disabled={isSubmitting}
//                 >
//                   {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
//                   {editingPolicyId ? 'Update Policy' : 'Create Policy'}
//                 </Button>
//               </div>
//             </form>
//           </CardContent>
//         </Card>
//       )}

//       {/* Policies List */}
//       {!isCreating && (
//         <Card>
//           <CardHeader>
//             <CardTitle>Existing Policies</CardTitle>
//             <CardDescription>
//               Manage your organization's leave policies
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             {optimisticPolicies.length === 0 ? (
//               <div className="text-center py-12 space-y-4">
//                 <Calendar className="mx-auto h-12 w-12 text-gray-400" />
//                 <h3 className="text-lg font-medium">No policies found</h3>
//                 <p className="text-gray-500">Get started by creating your first leave policy.</p>
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 {optimisticPolicies.map((policy) => (
//                   <Card key={policy._id} className="hover:shadow-md transition-shadow">
//                     <CardContent className="p-6">
//                       <div className="flex justify-between items-start">
//                         <div className="space-y-3 flex-1">
//                           <div className="flex items-center space-x-3">
//                             <h3 className="text-lg font-semibold">{policy.name}</h3>
//                             <Badge variant="default">Active</Badge>
//                           </div>
                          
//                           {policy.description && (
//                             <p className="text-gray-600">{policy.description}</p>
//                           )}
                          
//                           <div className="grid md:grid-cols-2 gap-4 text-sm">
//                             <div className="space-y-2">
//                               <div className="flex items-center space-x-2">
//                                 <Clock className="h-4 w-4 text-blue-500" />
//                                 <span className="font-medium">Rules: {policy.rules.length} configured</span>
//                               </div>
//                               <div className="space-y-1">
//                                 {policy.rules.slice(0, 3).map((rule, index) => (
//                                   <div key={index} className="flex items-center space-x-2 text-gray-600">
//                                     <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
//                                     <span className="capitalize">
//                                       {rule.type} ({rule.applicableTo.length} types)
//                                     </span>
//                                   </div>
//                                 ))}
//                               </div>
//                             </div>
                            
//                             <div className="space-y-2">
//                               <div className="flex items-center space-x-2">
//                                 <Calendar className="h-4 w-4 text-green-500" />
//                                 <span className="font-medium">Week Offs: {policy.weekOffs.length} days</span>
//                               </div>
//                               <div className="space-y-1">
//                                 {policy.weekOffs.slice(0, 3).map((weekOff, index) => (
//                                   <div key={index} className="flex items-center space-x-2 text-gray-600">
//                                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
//                                     <span className="capitalize">
//                                       {weekOff.day} (weeks {weekOff.occurrence.join(', ')})
//                                     </span>
//                                   </div>
//                                 ))}
//                               </div>
//                             </div>
//                           </div>
                          
//                           <div className="flex justify-between items-center text-xs text-gray-500 pt-2">
//                             <span>Created: {new Date(policy.createdAt).toLocaleDateString()}</span>
//                             <span>Updated: {new Date(policy.updatedAt).toLocaleDateString()}</span>
//                           </div>
//                         </div>
                        
//                         <div className="flex space-x-2 ml-4">
//                           <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={() => handleEditPolicy(policy._id)}
//                           >
//                             <Edit className="h-4 w-4 mr-1" />
//                             Edit
//                           </Button>
//                           <Button
//                             variant="destructive"
//                             size="sm"
//                             onClick={() => handleDeletePolicy(policy._id)}
//                           >
//                             <Trash2 className="h-4 w-4 mr-1" />
//                             Delete
//                           </Button>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 ))}
//               </div>
//             )}
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// };

// export default LeavePolicyManage;




"use client";
import React, { useEffect, useState } from "react";
import { useLeavePolicy } from "@/hooks/useLeavePolicy";
import {
  CreateLeavePolicyRequest,
  LeaveRule,
  WeekOff,
} from "@/lib/types/api/leavePolicy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Plus, Trash2, Edit, Calendar, Clock, Users } from "lucide-react";
import { toast } from "sonner";

// Define constants
const EMPLOYEE_TYPES = ["Full-Time", "Intern", "Probation", "Notice"] as const;
const OCCURRENCES = [1, 2, 3, 4, 5] as const;
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const LEAVE_TYPES = ["Casual Leave", "Sick Leave", "Privilege Leave", "Maternity Leave", "Paternity Leave", "Marriage Leave", "Compensatory Off", "Bereavement Leave"] as const;

const LeavePolicyManage: React.FC = () => {
  const {
    policies,
    currentPolicy,
    loading,
    error,
    success,
    createLeavePolicy,
    fetchLeavePolicies,
    fetchLeavePolicyById,
    updateLeavePolicy,
    deleteLeavePolicy,
    clearLeavePolicyError,
    clearSuccess,
    clearCurrentPolicy,
  } = useLeavePolicy();

  const [isCreating, setIsCreating] = useState(false);
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [optimisticPolicies, setOptimisticPolicies] = useState(policies);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateLeavePolicyRequest>({
    name: "",
    description: "",
    rules: [],
    weekOffs: [],
  });

  const [newRule, setNewRule] = useState<Partial<LeaveRule>>({
    leaveType: "",
    quota: 0,
    carryForward: false,
    encashable: false,
    maxCarryForwardLimit: 0,
    applicableTo: [],
    frequency: "yearly",
  });

  const [newWeekOff, setNewWeekOff] = useState<WeekOff>({
    day: "monday",
    occurrence: [1, 2, 3, 4, 5],
  });

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Sync optimistic state with actual data
  useEffect(() => {
    setOptimisticPolicies(policies);
  }, [policies]);

  useEffect(() => {
    fetchLeavePolicies();
  }, [fetchLeavePolicies]);

  useEffect(() => {
    if (success) {
      toast.success(`Policy ${editingPolicyId ? 'updated' : 'created'} successfully`);
      setIsCreating(false);
      setEditingPolicyId(null);
      resetForm();
      clearSuccess();
      clearCurrentPolicy();
      setIsSubmitting(false);
    }
  }, [success, clearSuccess, clearCurrentPolicy, editingPolicyId]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      setIsSubmitting(false);
      // Revert optimistic updates on error
      setOptimisticPolicies(policies);
    }
  }, [error, policies]);

  useEffect(() => {
    if (editingPolicyId && currentPolicy?._id === editingPolicyId) {
      setFormData({
        name: currentPolicy.name,
        description: currentPolicy.description || "",
        rules: currentPolicy.rules,
        weekOffs: currentPolicy.weekOffs,
      });
    }
  }, [currentPolicy, editingPolicyId]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      rules: [],
      weekOffs: [],
    });
    setNewRule({
      leaveType: "",
      quota: 0,
      carryForward: false,
      encashable: false,
      maxCarryForwardLimit: 0,
      applicableTo: [],
      frequency: "yearly",
    });
    setNewWeekOff({
      day: "monday",
      occurrence: [1, 2, 3, 4, 5],
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      errors.name = "Policy name is required";
    }

    if (formData.rules.length === 0) {
      errors.rules = "At least one rule is required";
    }

    if (formData.weekOffs.length === 0) {
      errors.weekOffs = "At least one week off is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRule = (rule: Partial<LeaveRule>): string[] => {
    const errors: string[] = [];

    if (!rule.leaveType?.trim()) {
      errors.push("Leave type is required");
    }

    if (!rule.applicableTo || rule.applicableTo.length === 0) {
      errors.push("At least one employee type must be selected");
    }

    if (rule.quota === undefined || rule.quota < 0) {
      errors.push("Quota must be a positive number");
    }
    
    if (rule.carryForward && (!rule.maxCarryForwardLimit || rule.maxCarryForwardLimit < 0)) {
      errors.push("Max carry forward limit is required when carry forward is enabled");
    }

    return errors;
  };

  const handleEditPolicy = async (policyId: string) => {
    setEditingPolicyId(policyId);
    setIsCreating(true);
    await fetchLeavePolicyById(policyId);
  };

  const handleCancelEdit = () => {
    setEditingPolicyId(null);
    setIsCreating(false);
    resetForm();
    clearCurrentPolicy();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Optimistic update
    if (editingPolicyId) {
      setOptimisticPolicies(prev => 
        prev.map(policy => 
          policy._id === editingPolicyId 
            ? { ...policy, ...formData, updatedAt: new Date().toISOString() }
            : policy
        )
      );
    } else {
      const tempId = `temp-${Date.now()}`;
      const newPolicy = {
        _id: tempId,
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setOptimisticPolicies(prev => [...prev, newPolicy as any]);
    }

    try {
      if (editingPolicyId) {
        await updateLeavePolicy(editingPolicyId, formData);
      } else {
        await createLeavePolicy(formData);
      }
    } catch (err) {
      console.error("Error submitting policy:", err);
    }
  };

  const handleEmployeeTypeSelect = (type: string) => {
    const newApplicableTo = newRule.applicableTo?.includes(type)
      ? newRule.applicableTo.filter(t => t !== type)
      : [...(newRule.applicableTo || []), type];

    setNewRule(prev => ({
      ...prev,
      applicableTo: newApplicableTo,
    }));
  };

  const handleOccurrenceSelect = (occurrence: number) => {
    const newOccurrence = newWeekOff.occurrence.includes(occurrence)
      ? newWeekOff.occurrence.filter(o => o !== occurrence)
      : [...newWeekOff.occurrence, occurrence];

    setNewWeekOff(prev => ({
      ...prev,
      occurrence: newOccurrence.sort(),
    }));
  };

  const handleAddRule = () => {
    const ruleErrors = validateRule(newRule);
    
    if (ruleErrors.length > 0) {
      toast.error(ruleErrors[0]);
      return;
    }

    const ruleToAdd: LeaveRule = {
      leaveType: newRule.leaveType!,
      applicableTo: newRule.applicableTo!,
      quota: newRule.quota || 0,
      carryForward: newRule.carryForward || false,
      encashable: newRule.encashable || false,
      maxCarryForwardLimit: newRule.carryForward ? (newRule.maxCarryForwardLimit || 0) : 0,
      frequency: newRule.frequency || "yearly",
    };

    setFormData(prev => ({
      ...prev,
      rules: [...prev.rules, ruleToAdd],
    }));

    setNewRule({
      leaveType: "",
      quota: 0,
      carryForward: false,
      encashable: false,
      maxCarryForwardLimit: 0,
      applicableTo: [],
      frequency: "yearly",
    });
  };

  const handleRemoveRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const handleAddWeekOff = () => {
    if (newWeekOff.occurrence.length === 0) {
      toast.error("At least one occurrence must be selected");
      return;
    }

    setFormData(prev => ({
      ...prev,
      weekOffs: [...prev.weekOffs, newWeekOff],
    }));
    
    setNewWeekOff({
      day: "monday",
      occurrence: [1, 2, 3, 4, 5],
    });
  };

  const handleRemoveWeekOff = (index: number) => {
    setFormData(prev => ({
      ...prev,
      weekOffs: prev.weekOffs.filter((_, i) => i !== index),
    }));
  };

  const handleDeletePolicy = async (policyId: string) => {
    const policyToDelete = policies.find(p => p._id === policyId);
    
    // Optimistic update
    setOptimisticPolicies(prev => prev.filter(policy => policy._id !== policyId));

    try {
      await deleteLeavePolicy(policyId);
      toast.success(`Policy "${policyToDelete?.name}" deleted successfully`);
    } catch (err) {
      toast.error("Failed to delete policy");
      // Revert optimistic update on error
      setOptimisticPolicies(policies);
    }
  };

  if (loading && policies.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Policy Management</h1>
          <p className="text-gray-600 mt-1">Create and manage leave policies for your organization</p>
        </div>
        <Button
          onClick={() => {
            if (isCreating) {
              handleCancelEdit();
            } else {
              setIsCreating(true);
              setEditingPolicyId(null);
              resetForm();
            }
          }}
          variant={isCreating ? "outline" : "default"}
        >
          {isCreating ? (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Create New Policy
            </>
          )}
        </Button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingPolicyId ? "Edit Leave Policy" : "Create New Leave Policy"}
            </CardTitle>
            <CardDescription>
              Configure rules and week offs for your leave policy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Policy Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Policy Information</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="policy-name">Policy Name *</Label>
                    <Input
                      id="policy-name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter policy name"
                      className={formErrors.name ? 'border-red-500' : ''}
                    />
                    {formErrors.name && (
                      <p className="text-red-500 text-sm">{formErrors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="policy-description">Description</Label>
                    <Textarea
                      id="policy-description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter policy description"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Rules Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Leave Rules *</h3>
                  {formErrors.rules && (
                    <p className="text-red-500 text-sm">{formErrors.rules}</p>
                  )}
                </div>

                <Tabs defaultValue="existing" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="existing">
                      Existing Rules ({formData.rules.length})
                    </TabsTrigger>
                    <TabsTrigger value="add">
                      Add New Rule
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="existing" className="space-y-3">
                    {formData.rules.length === 0 ? (
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertTitle>No rules added</AlertTitle>
                        <AlertDescription>
                          Add your first rule to get started
                        </AlertDescription>
                      </Alert>
                    ) : (
                      formData.rules.map((rule, index) => (
                        <Card key={index}>
                          <CardContent className="p-4 flex justify-between items-center">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-3">
                                <Badge variant="default">
                                  Leave Rule
                                </Badge>
                                <span className="font-medium">{rule.leaveType}</span>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <div className="flex items-center space-x-2">
                                  <Users className="h-3 w-3" />
                                  <span>Applicable to: {rule.applicableTo.join(", ")}</span>
                                </div>
                                <div>Quota: {rule.quota} days • Frequency: {rule.frequency}</div>
                                {rule.carryForward && (
                                  <div>Carry Forward: {rule.maxCarryForwardLimit} days</div>
                                )}
                                {rule.encashable && <div>Encashable: Yes</div>}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveRule(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="add" className="space-y-4">
                    <Card>
                      <CardContent className="p-6 space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="leave-type">Leave Type *</Label>
                            <Select
                              value={newRule.leaveType}
                              onValueChange={(value: string) => 
                                setNewRule(prev => ({ ...prev, leaveType: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select leave type" />
                              </SelectTrigger>
                              <SelectContent>
                                {LEAVE_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="quota">Quota (days) *</Label>
                            <Input
                              id="quota"
                              type="number"
                              min="0"
                              value={newRule.quota || 0}
                              onChange={(e) => setNewRule(prev => ({ ...prev, quota: parseInt(e.target.value) || 0 }))}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Applicable To *</Label>
                          <div className="flex flex-wrap gap-3">
                            {EMPLOYEE_TYPES.map((type) => (
                              <div key={type} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`employee-type-${type}`}
                                  checked={newRule.applicableTo?.includes(type) || false}
                                  onCheckedChange={() => handleEmployeeTypeSelect(type)}
                                />
                                <Label htmlFor={`employee-type-${type}`} className="text-sm">
                                  {type}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="frequency">Frequency</Label>
                            <Select
                              value={newRule.frequency}
                              onValueChange={(value: "monthly" | "quarterly" | "yearly") => 
                                setNewRule(prev => ({ ...prev, frequency: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="monthly">Monthly</SelectItem>
                                <SelectItem value="quarterly">Quarterly</SelectItem>
                                <SelectItem value="yearly">Yearly</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="carry-forward">Max Carry Forward</Label>
                            <Input
                              id="carry-forward"
                              type="number"
                              min="0"
                              value={newRule.maxCarryForwardLimit || 0}
                              onChange={(e) => setNewRule(prev => ({ ...prev, maxCarryForwardLimit: parseInt(e.target.value) || 0 }))}
                              disabled={!newRule.carryForward}
                            />
                          </div>

                          <div className="space-y-3 pt-2">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="carry-forward-checkbox"
                                checked={newRule.carryForward || false}
                                onCheckedChange={(checked) => 
                                  setNewRule(prev => ({ 
                                    ...prev, 
                                    carryForward: checked as boolean,
                                    maxCarryForwardLimit: checked ? (prev.maxCarryForwardLimit || 0) : 0
                                  }))
                                }
                              />
                              <Label htmlFor="carry-forward-checkbox">Carry Forward</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="encashable"
                                checked={newRule.encashable || false}
                                onCheckedChange={(checked) => 
                                  setNewRule(prev => ({ ...prev, encashable: checked as boolean }))
                                }
                              />
                              <Label htmlFor="encashable">Encashable</Label>
                            </div>
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={handleAddRule}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Rule
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Week Offs Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Week Offs *</h3>
                  {formErrors.weekOffs && (
                    <p className="text-red-500 text-sm">{formErrors.weekOffs}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {formData.weekOffs.map((weekOff, index) => (
                    <Badge key={index} variant="secondary" className="p-3 justify-between">
                      <div>
                        <span className="capitalize">{weekOff.day}</span>
                        <span className="text-xs ml-2">Weeks: {weekOff.occurrence.join(", ")}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveWeekOff(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add Week Off</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="weekoff-day">Day</Label>
                        <Select
                          value={newWeekOff.day}
                          onValueChange={(value: any) => setNewWeekOff(prev => ({ ...prev, day: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DAYS.map(day => (
                              <SelectItem key={day} value={day}>
                                {day.charAt(0).toUpperCase() + day.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Occurrence (Weeks)</Label>
                        <div className="flex flex-wrap gap-2">
                          {OCCURRENCES.map(occurrence => (
                            <div key={occurrence} className="flex items-center space-x-1">
                              <Checkbox
                                id={`occurrence-${occurrence}`}
                                checked={newWeekOff.occurrence.includes(occurrence)}
                                onCheckedChange={() => handleOccurrenceSelect(occurrence)}
                              />
                              <Label htmlFor={`occurrence-${occurrence}`} className="text-sm">
                                {occurrence}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handleAddWeekOff}
                      variant="outline"
                      className="w-full"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Add Week Off
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingPolicyId ? 'Update Policy' : 'Create Policy'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Policies List */}
      {!isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Existing Policies</CardTitle>
            <CardDescription>
              Manage your organization's leave policies
            </CardDescription>
          </CardHeader>
          <CardContent>
            {optimisticPolicies.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="text-lg font-medium">No policies found</h3>
                <p className="text-gray-500">Get started by creating your first leave policy.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {optimisticPolicies.map((policy) => (
                  <Card key={policy._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-3 flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold">{policy.name}</h3>
                            <Badge variant="default">Active</Badge>
                          </div>
                          
                          {policy.description && (
                            <p className="text-gray-600">{policy.description}</p>
                          )}
                          
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">Rules: {policy.rules.length} configured</span>
                              </div>
                              <div className="space-y-1">
                                {policy.rules.slice(0, 3).map((rule, index) => (
                                  <div key={index} className="flex items-center space-x-2 text-gray-600">
                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                                    <span>
                                      {rule.leaveType} ({rule.applicableTo.length} types)
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-green-500" />
                                <span className="font-medium">Week Offs: {policy.weekOffs.length} days</span>
                              </div>
                              <div className="space-y-1">
                                {policy.weekOffs.slice(0, 3).map((weekOff, index) => (
                                  <div key={index} className="flex items-center space-x-2 text-gray-600">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                    <span className="capitalize">
                                      {weekOff.day} (weeks {weekOff.occurrence.join(', ')})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center text-xs text-gray-500 pt-2">
                            <span>Created: {new Date(policy.createdAt).toLocaleDateString()}</span>
                            <span>Updated: {new Date(policy.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPolicy(policy._id)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeletePolicy(policy._id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeavePolicyManage;