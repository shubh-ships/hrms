"use client"
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  createTaskAssignment,
  ProofRequirement,
  bulkTaskAssignments,
  fetchPreviousTasks,
  selectPreviousTasks
} from '@/features/taskAssignments/taskAssignmentSlice';

import {
  fetchUserHierarchy,
  selectHierarchyUsers,
  selectHierarchyLoading,
  selectUsersError
} from '@/features/user/userSlice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface ProofField {
  fieldName: string;
  type: 'url' | 'file';
  url?: string;
}

interface CreateTaskFormData {
  title: string;
  description: string;
  assigned_to_employee_id: string;
  proof: ProofRequirement[];
  TAT: number;
  deadline: string;
  department_id?: string;
  priority: "Low" | "Medium" | "High";
}

interface BulkUploadData {
  assigned_to_employee_id: string;
  department_id?: string;
  taskFile: File;
  priority?: "Low" | "Medium" | "High";
}


const  TaskAssignmentForm = () => {
  const dispatch = useAppDispatch();

  const hierarchyUsers = useAppSelector(selectHierarchyUsers);
  const hierarchyLoading = useAppSelector(selectHierarchyLoading);
  const usersError = useAppSelector(selectUsersError);
  const { loading, error: taskError } = useAppSelector((state) => state.taskAssignments);
  const { user } = useAppSelector((state) => state.auth);
  const previousTasks = useAppSelector(selectPreviousTasks);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
  const [selectedBulkAssignee, setSelectedBulkAssignee] = useState('');
  const [selectedBulkDepartment, setSelectedBulkDepartment] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isPreviousTaskSelected, setIsPreviousTaskSelected] = useState(false);
  const [bulkPriority, setBulkPriority] =
  useState<"Low" | "Medium" | "High" | "">("");


  useEffect(() => {
    dispatch(fetchUserHierarchy());
  }, [dispatch]);

  useEffect(() => {
    if (usersError) {
      toast.error('Failed to load assignees', {
        description: usersError
      });
    }
  }, [usersError]);

  const sortedHierarchyUsers = useMemo(() => {
    if (!hierarchyUsers || hierarchyUsers.length === 0) return [];

    return [...hierarchyUsers].sort((a, b) => a.hierarchyLevel - b.hierarchyLevel);
  }, [hierarchyUsers]);

  const [formData, setFormData] = useState<CreateTaskFormData>({
    title: '',
    description: '',
    assigned_to_employee_id: '',
    proof: [],
    TAT: 0,
    deadline: '',
    priority: 'Low',
  });

  const [newProofField, setNewProofField] = useState<ProofField>({
    fieldName: '',
    type: 'url'
  });

  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);

  const timeOptions = [
    { value: '15', label: '15 minutes' },
    { value: '30', label: '30 minutes' },
    { value: '60', label: '60 minutes' },
    { value: '120', label: '120 minutes' },
    { value: '240', label: '240 minutes' },
    { value: '480', label: '480 minutes' },
    { value: '1440', label: '1440 minutes' }
  ];

  const proofTypes = [
    { value: 'url', label: 'URL' },
    { value: 'file', label: 'File' }
  ];

  // FIXED: Improved department extraction logic
  const getSelectedUserDepartments = () => {
    if (!formData.assigned_to_employee_id) return [];


    const selectedUser = hierarchyUsers.find(user => user.userId === formData.assigned_to_employee_id);
    if (!selectedUser || !selectedUser.departments) return [];

    console.log('Selected User Departments:', selectedUser.departments);

    try {
      let departmentsArray = selectedUser.departments;

      // If departments is a string, parse it
      if (typeof selectedUser.departments === 'string') {
        departmentsArray = JSON.parse(selectedUser.departments);
      }

      // Ensure we have an array
      if (!Array.isArray(departmentsArray)) {
        console.error('Departments is not an array:', departmentsArray);
        return [];
      }

      // Map departments with proper ID extraction
      return departmentsArray.map((dept: any) => {
        // Try multiple possible ID fields
        const departmentId = dept._id || dept.id || dept.departmentId || '';
        const departmentName = dept.name || dept.departmentName || 'Unknown Department';

        return {
          id: departmentId,
          name: departmentName
        };
      }).filter(dept => dept.id && dept.name); // Filter out invalid departments

    } catch (error) {
      console.error('Error parsing departments:', error);
      return [];
    }
  };

  const getBulkUserDepartments = () => {
    if (!selectedBulkAssignee) return [];
    const selectedUser = hierarchyUsers.find(user => user.userId === selectedBulkAssignee);
    if (!selectedUser || !selectedUser.departments) return [];

    console.log('Bulk Selected User Departments:', selectedUser.departments);

    try {
      let departmentsArray = selectedUser.departments;

      if (typeof selectedUser.departments === 'string') {
        departmentsArray = JSON.parse(selectedUser.departments);
      }

      if (!Array.isArray(departmentsArray)) {
        console.error('Bulk Departments is not an array:', departmentsArray);
        return [];
      }

      return departmentsArray.map((dept: any) => {
        const departmentId = dept._id || dept.id || dept.departmentId || '';
        const departmentName = dept.name || dept.departmentName || 'Unknown Department';

        return {
          id: departmentId,
          name: departmentName
        };
      }).filter(dept => dept.id && dept.name);

    } catch (error) {
      console.error('Error parsing bulk departments:', error);
      return [];
    }
  };

  const clearBulkUploadForm = () => {
    setSelectedBulkAssignee('');
    setSelectedBulkDepartment('');
    setBulkUploadFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Bulk upload form cleared');
  };

  const clearSingleTaskForm = () => {
    setFormData({
      title: '',
      description: '',
      assigned_to_employee_id: '',
      proof: [],
      TAT: 0,
      deadline: '',
      priority: 'Low',
    });
    setNewProofField({
      fieldName: '',
      type: 'url'
    });
    setIsPreviousTaskSelected(false);
    setShowSearchResults(false);
    toast.success('Task form cleared');
  };

  const handleTitleChange = async (value: string) => {
    setFormData(prev => ({
      ...prev,
      title: value
    }));

    if (isPreviousTaskSelected && value !== formData.title) {
      setIsPreviousTaskSelected(false);
      setFormData({
        title: value,
        description: '',
        assigned_to_employee_id: '',
        proof: [],
        TAT: 0,
        deadline: '',
        priority: 'Low',
      });
    }

    if (value.trim().length > 2) {
      setIsSearching(true);
      try {
        await dispatch(fetchPreviousTasks(value)).unwrap();
        setShowSearchResults(true);
      } catch (error) {
        console.error('Failed to search previous tasks');
      } finally {
        setIsSearching(false);
      }
    } else {
      setShowSearchResults(false);
    }
  };

  const handleTaskSelect = (task: any) => {
    setFormData({
      title: task.title,
      description: task.description || '',
      assigned_to_employee_id: task.assigned_to_employee_id?._id || '',
      proof: task.proof || [],
      TAT: task.TAT || 0,
      deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
      department_id: task.department_id || '',
      priority: task.priority || 'Low',
    });

    setShowSearchResults(false);
    setIsPreviousTaskSelected(true);
    toast.success('Previous task loaded! You can edit details before submitting.');
  };

  const handleInputChange = (field: keyof CreateTaskFormData, value: string | number | ProofRequirement[]) => {
    if (field === 'assigned_to_employee_id') {
      setFormData(prev => ({
        ...prev,
        [field]: value as string,
        department_id: '' // Reset department when user changes
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleProofFieldChange = (field: keyof ProofField, value: string) => {
    setNewProofField(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addProofField = () => {
    if (!newProofField.fieldName.trim()) {
      toast.error('Please enter a field name for the proof');
      return;
    }

    setFormData(prev => ({
      ...prev,
      proof: [...prev.proof, newProofField]
    }));

    setNewProofField({
      fieldName: '',
      type: 'url'
    });
  };

  const removeProofField = (index: number) => {
    setFormData(prev => {
      const newProof = [...prev.proof];
      newProof.splice(index, 1);
      return {
        ...prev,
        proof: newProof
      };
    });
  };

    const handleSubmit = async () => {
        try {
            // Validation
            if (!formData.title.trim()) {
                throw new Error('Please enter a task title');
            }
            if (!formData.assigned_to_employee_id) {
                throw new Error('Please select an assignee');
            }
            if (!formData.department_id) {
                throw new Error('Please select a department');
            }
            if (!formData.TAT) {
                throw new Error('Please select time to approval');
            }
            if (!formData.deadline) {
                throw new Error('Please set a deadline');
            }
            if (formData.proof.length === 0) {
                throw new Error('Please add at least one proof requirement');
            }

            // Format deadline to ISO format: YYYY-MM-DDTHH:mm:ss+05:30
            const formatDeadline = (deadline: string): string => {
                if (!deadline) return '';

                // Add seconds (:00) and timezone (+05:30)
                return `${deadline}:00+05:30`;
            };

            // Create task data with formatted deadline
            const taskData = {
                title: formData.title,
                description: formData.description,
                assigned_to_employee_id: formData.assigned_to_employee_id,
                TAT: Number(formData.TAT),
                deadline: formatDeadline(formData.deadline), // This will be: 2026-01-03T18:30:00+05:30
                department_id: formData.department_id,
                priority: formData.priority,
                proof: formData.proof,
            };

            console.log('Submitting task with deadline:', taskData.deadline);
            console.log('Full task data:', JSON.stringify(taskData, null, 2));

            // Dispatch to Redux
            await dispatch(createTaskAssignment(taskData)).unwrap();

            // Success notification
            toast.success('Task assigned successfully!', {
                description: `"${formData.title}" has been assigned successfully.`
            });

            // Clear form
            clearSingleTaskForm();

        } catch (error: any) {
            console.error('Error in handleSubmit:', error);
            toast.error('Failed to assign task', {
                description: error.message || 'Please try again.'
            });
        }
    };
  const downloadTemplate = () => {
    const templateData = [
      {
        title: 'Prepare Sales Report',
        description: 'Compile the monthly sales report with charts',
        proof: JSON.stringify([{ fieldName: 'Github', type: 'url' }]),
        TAT: 60,
        deadline: '2026-01-03T18:30:00+05:30',
        createdAt: '2026-01-03T18:30:00+05:30',
        updatedAt: '2026-01-03T18:30:00+05:30'
      },
      {
        title: 'Client Presentation',
        description: 'Prepare slides for upcoming client meeting',
        proof: JSON.stringify([{ fieldName: 'Drive', type: 'url' }]),
        TAT: 120,
          deadline: '2026-01-03T18:30:00+05:30',
          createdAt: '2026-01-03T18:30:00+05:30',
          updatedAt: '2026-01-03T18:30:00+05:30'
      },
      {
        title: 'Website Bug Fix',
        description: 'Resolve UI issues on homepage banner',
        proof: JSON.stringify([{ fieldName: 'Image', type: 'file' }]),
        TAT: 180,
          deadline: '2026-01-03T18:30:00+05:30'
      }
    ];



      const headers = ['title', 'description', 'proof', 'TAT', 'deadline', 'priority'];

    const csvContent = [
      headers.join(','),
      ...templateData.map(row =>
        headers.map(header => {
          const value = row[header as keyof typeof row];
          const escapedValue = String(value).replace(/"/g, '""');
          return String(value).includes(',') || String(value).includes('"') ? `"${escapedValue}"` : escapedValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'bulk_task_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Template downloaded successfully!', {
      description: 'You can now fill in your task details and upload the file.'
    });
  };

  const handleBulkFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    const validExtensions = ['.xlsx', '.csv', '.xls'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      toast.error('Invalid file type', {
        description: 'Please select an Excel (.xlsx, .xls) or CSV file.'
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Please select a file smaller than 10MB.'
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (!selectedBulkAssignee) {
      toast.error('Assignee required', {
        description: 'Please select an assignee for bulk upload first.'
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    if (!selectedBulkDepartment) {
      toast.error('Department required', {
        description: 'Please select a department for bulk upload first.'
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setBulkUploadFile(file);
    toast.success('File selected', {
      description: `${file.name} is ready for upload.`
    });
  };

  const handleBulkUpload = async () => {
    if (!bulkUploadFile) {
      toast.error('No file selected', {
        description: 'Please select a file first.'
      });
      return;
    }

    if (!selectedBulkAssignee) {
      toast.error('No assignee selected', {
        description: 'Please select an assignee for bulk upload.'
      });
      return;
    }

    if (!selectedBulkDepartment) {
      toast.error('No department selected', {
        description: 'Please select a department for bulk upload.'
      });
      return;
    }

    setBulkUploadLoading(true);

    const loadingToast = toast.loading('Uploading bulk tasks...');

    try {
      const bulkData: BulkUploadData = {
        assigned_to_employee_id: selectedBulkAssignee,
        department_id: selectedBulkDepartment,
        taskFile: bulkUploadFile,
        // priority: bulkPriority || undefined,
        priority: bulkPriority || 'Low',
      };
      // dispatch(bulkTaskAssignments(bulkData));

      const result = await dispatch(bulkTaskAssignments(bulkData)).unwrap();

      toast.dismiss(loadingToast);
      toast.success('Bulk tasks uploaded successfully!', {
        description: `${result.length || 'Multiple'} tasks have been assigned successfully.`
      });

      clearBulkUploadForm();

    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error('Failed to upload bulk tasks', {
        description: error.message || 'Please check your file format and try again.'
      });
    } finally {
      setBulkUploadLoading(false);
    }
  };

  const isFormValid = !!(formData.title.trim() &&
                   formData.assigned_to_employee_id &&
                   formData.department_id &&
                   formData.TAT &&
                   formData.deadline &&
                   formData.proof.length > 0);

  const isBulkFormValid = !!(selectedBulkAssignee && selectedBulkDepartment && bulkUploadFile);

  const getSelectedUserInfo = () => {
    if (!formData.assigned_to_employee_id) return { department: '', role: '' };
    const selectedUser = hierarchyUsers.find(
      user => user.userId === formData.assigned_to_employee_id
    );
    if (!selectedUser) return { department: '', role: '' };

    // Get the selected department name
    const userDepartments = getSelectedUserDepartments();
    const selectedDepartment = userDepartments.find(
      dept => dept.id === formData.department_id
    );

    return {
      department: selectedDepartment ? selectedDepartment.name : 'No department selected',
      role: selectedUser.role || ''
    };
  };

  // Debug: Log department data
  useEffect(() => {
    if (formData.assigned_to_employee_id) {
      console.log('User Departments:', getSelectedUserDepartments());
      console.log('Form Department ID:', formData.department_id);
    }
  }, [formData.assigned_to_employee_id, formData.department_id]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#1e2939] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl">Task Assignment</CardTitle>
            <CardDescription>
              Assign tasks to your team members efficiently
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Bulk Task Upload</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearBulkUploadForm}
                    disabled={!selectedBulkAssignee && !selectedBulkDepartment && !bulkUploadFile}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload multiple tasks at once using an Excel template
                </p>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={downloadTemplate}
                    className="flex-1"
                  >
                    Download Template
                  </Button>

                  <div className="flex-1 flex flex-col gap-2">
                    <Select
                      value={selectedBulkAssignee}
                      onValueChange={(value) => {
                        setSelectedBulkAssignee(value);
                        setSelectedBulkDepartment('');
                      }}
                      disabled={hierarchyLoading || sortedHierarchyUsers.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bulk assignee" />
                      </SelectTrigger>
                      {sortedHierarchyUsers.length > 0 && (
                        <SelectContent>
                          {sortedHierarchyUsers.map((user) => (
                            <SelectItem key={user.userId} value={user.userId}>
                              {user.name} ({user.email}) - {user.role} - Level {user.hierarchyLevel}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      )}
                    </Select>

                    {selectedBulkAssignee && getBulkUserDepartments().length > 0 && (
                      <Select
                        value={selectedBulkDepartment}
                        onValueChange={setSelectedBulkDepartment}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {getBulkUserDepartments().map((department) => (
                            <SelectItem key={department.id} value={department.id}>
                              {department.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Debug info for bulk departments */}
                    {selectedBulkAssignee && getBulkUserDepartments().length === 0 && (
                      <p className="text-xs text-yellow-600">
                        No departments found for this user or department data format issue.
                      </p>
                    )}

                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.csv,.xls"
                          onChange={handleBulkFileSelect}
                          className="flex-1"
                          disabled={!selectedBulkAssignee || !selectedBulkDepartment || bulkUploadLoading}
                        />
                        <Button
                          onClick={handleBulkUpload}
                          disabled={!isBulkFormValid || bulkUploadLoading}
                          className="whitespace-nowrap"
                        >
                          {bulkUploadLoading ? 'Uploading...' : 'Upload File'}
                        </Button>
                      </div>
                      {bulkUploadFile && (
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Selected: {bulkUploadFile.name}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setBulkUploadFile(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                              }
                              toast.info('File removed');
                            }}
                            className="text-red-500 hover:text-red-600 text-xs h-6"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or create single task
                  </span>
                </div>
              </div>

              <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Single Task Assignment</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearSingleTaskForm}
                    disabled={!formData.title && !formData.assigned_to_employee_id}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </Button>
                </div>




                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Task Title <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Start typing to search previous tasks or enter a new title"
                      className="transition-all duration-200 pr-10"
                      required
                      ref={titleInputRef}
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      </div>
                    )}

                    {showSearchResults && previousTasks.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                        {previousTasks.map((task) => (
                          <div
                            key={task._id}
                            className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                            onClick={() => handleTaskSelect(task)}
                          >
                            <div className="font-medium">{task.title}</div>
                            <div className="text-sm text-muted-foreground">
                              Assigned to: {task.assigned_to_employee_id?.name || 'Unknown'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(task.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
<div className="space-y-2">
  <Label className="text-sm font-medium">
    Priority
  </Label>

  <Select
    value={formData.priority}
    onValueChange={(value: "Low" | "Medium" | "High") =>
      setFormData((prev) => ({
        ...prev,
        priority: value,
      }))
    }
  >
    <SelectTrigger>
      <SelectValue placeholder="Select priority" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="Low">Low</SelectItem>
      <SelectItem value="Medium">Medium</SelectItem>
      <SelectItem value="High">High</SelectItem>
    </SelectContent>
  </Select>
</div>


                  {isPreviousTaskSelected && (
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md mt-2">
                      <span className="text-xs text-blue-600">
                        Loaded from previous task
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            description: '',
                            assigned_to_employee_id: '',
                            proof: [],
                            TAT: 0,
                            deadline: '',
                            department_id: '',
                          }));
                          setIsPreviousTaskSelected(false);
                          toast.info('Form partially cleared - title kept');
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        Clear Details
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Provide detailed instructions for this task"
                    rows={4}
                    className="transition-all duration-200 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Assignee <span className="text-red-500">*</span>
                  </Label>

                  <Select
                    value={formData.assigned_to_employee_id}
                    onValueChange={(value) => handleInputChange('assigned_to_employee_id', value)}
                    required
                    disabled={hierarchyLoading || sortedHierarchyUsers.length === 0}
                  >
                    <SelectTrigger className="transition-all duration-200">
                      <SelectValue placeholder={
                        hierarchyLoading
                          ? "Loading assignees..."
                          : sortedHierarchyUsers.length === 0
                            ? "No assignees available"
                            : "Select a user"
                      } />
                    </SelectTrigger>
                    {sortedHierarchyUsers.length > 0 && (
                      <SelectContent>
                        {sortedHierarchyUsers.map((user) => (
                          <SelectItem
                            key={user.userId}
                            value={user.userId}
                          >
                            {user.name} ({user.email}) - {user.role} - Level {user.hierarchyLevel}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    )}
                  </Select>
                </div>

                {formData.assigned_to_employee_id && getSelectedUserDepartments().length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Department <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.department_id || ''}
                      onValueChange={(value) => handleInputChange('department_id', value)}
                      required
                    >
                      <SelectTrigger className="transition-all duration-200">
                        <SelectValue placeholder="Select a department" />
                      </SelectTrigger>
                      <SelectContent>
                        {getSelectedUserDepartments().map((department) => (
                          <SelectItem
                            key={department.id}
                            value={department.id}
                          >
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Debug info for single task departments */}
                {formData.assigned_to_employee_id && getSelectedUserDepartments().length === 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-700">
                      No departments found for this user. This may be due to:
                    </p>
                    <ul className="text-xs text-yellow-600 mt-1 list-disc list-inside">
                      <li>User has no assigned departments</li>
                      <li>Department data format issue</li>
                      <li>Please check console for detailed error information</li>
                    </ul>
                  </div>
                )}

                {formData.assigned_to_employee_id && formData.department_id && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Selected Department
                      </Label>
                      <Input
                        value={getSelectedUserInfo().department}
                        readOnly
                        className="transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        User Role
                      </Label>
                      <Input
                        value={getSelectedUserInfo().role}
                        readOnly
                        className="transition-all duration-200"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="deadline" className="text-sm font-medium">
                    Deadline <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className="transition-all duration-200"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="TAT" className="text-sm font-medium">
                    Time to Approval (TAT) in minutes <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.TAT.toString()}
                      onValueChange={(value) => handleInputChange('TAT', value)}
                    >
                      <SelectTrigger className="flex-1 transition-all duration-200">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground self-center">or</span>
                    <Input
                      type="number"
                      placeholder="Custom"
                      value={formData.TAT}
                      onChange={(e) => handleInputChange('TAT', e.target.value)}
                      className="w-24 transition-all duration-200"
                      min="1"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-medium">
                    Required Proof Fields <span className="text-red-500">*</span>
                  </Label>

                  {formData.proof.length > 0 ? (
                    <div className="space-y-2">
                      {formData.proof.map((proof, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="flex-1 grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Field Name</Label>
                              <Input
                                value={proof.fieldName}
                                readOnly
                                className="text-sm"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Type</Label>
                              <Input
                                value={proof.type}
                                readOnly
                                className="text-sm"
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProofField(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No proof fields added yet
                    </p>
                  )}

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">Field Name</Label>
                        <Input
                          value={newProofField.fieldName}
                          onChange={(e) => handleProofFieldChange('fieldName', e.target.value)}
                          placeholder="e.g. Screenshot, Report"
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Type</Label>
                        <Select
                          value={newProofField.type}
                          onValueChange={(value: 'url' | 'file') => handleProofFieldChange('type', value)}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {proofTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addProofField}
                      className="mt-2"
                    >
                      Add Proof Field
                    </Button>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full"
                    disabled={!isFormValid || loading}
                  >
                    {loading ? 'Processing...' : 'Assign Task'}
                  </Button>
                </div>

                {!isFormValid && (
                  <p className="text-xs text-muted-foreground text-center">
                    Please fill in all required fields to assign the task
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskAssignmentForm;



// "use client"
// import React, { useState, useEffect, useMemo, useRef } from 'react';
// import { useAppDispatch, useAppSelector } from '@/store/hooks';
// import { 
//   createTaskAssignment, 
//   ProofRequirement, 
//   bulkTaskAssignments,
//   fetchPreviousTasks,
//   selectPreviousTasks
// } from '@/features/taskAssignments/taskAssignmentSlice';

// import {
//   fetchUserHierarchy,
//   selectHierarchyUsers,
//   selectHierarchyLoading,
//   selectUsersError
// } from '@/features/user/userSlice';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Label } from '@/components/ui/label';
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { toast } from 'sonner';

// interface ProofField {
//   fieldName: string;
//   type: 'url' | 'file';
//   url?: string; 
// }

// interface CreateTaskFormData {
//   title: string;
//   description: string;
//   assigned_to_employee_id: string;
//   proof: ProofRequirement[];
//   TAT: number;
//   deadline: string;
//   department_id?: string;
// }

// interface BulkUploadData {
//   assigned_to_employee_id: string;
//   department_id?: string;
//   taskFile: File;
// }

// const TaskAssignmentForm = () => {
//   const dispatch = useAppDispatch();
  
//   const hierarchyUsers = useAppSelector(selectHierarchyUsers);
//   const hierarchyLoading = useAppSelector(selectHierarchyLoading);
//   const usersError = useAppSelector(selectUsersError);
//   const { loading, error: taskError } = useAppSelector((state) => state.taskAssignments);
//   const { user } = useAppSelector((state) => state.auth);
//   const previousTasks = useAppSelector(selectPreviousTasks);

//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const titleInputRef = useRef<HTMLInputElement>(null);
//   const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
//   const [selectedBulkAssignee, setSelectedBulkAssignee] = useState('');
//   const [selectedBulkDepartment, setSelectedBulkDepartment] = useState('');
//   const [isSearching, setIsSearching] = useState(false);
//   const [showSearchResults, setShowSearchResults] = useState(false);
//   const [isPreviousTaskSelected, setIsPreviousTaskSelected] = useState(false);

//   useEffect(() => {
//     dispatch(fetchUserHierarchy());
//   }, [dispatch]);

//   useEffect(() => {
//     if (usersError) {
//       toast.error('Failed to load assignees', {
//         description: usersError
//       });
//     }
//   }, [usersError]);

//   const sortedHierarchyUsers = useMemo(() => {
//     if (!hierarchyUsers || hierarchyUsers.length === 0) return [];
    
//     return [...hierarchyUsers].sort((a, b) => a.hierarchyLevel - b.hierarchyLevel);
//   }, [hierarchyUsers]);

//   const [formData, setFormData] = useState<CreateTaskFormData>({
//     title: '',
//     description: '',
//     assigned_to_employee_id: '',
//     proof: [],
//     TAT: 0,
//     deadline: '',
//   });

//   const [newProofField, setNewProofField] = useState<ProofField>({
//     fieldName: '',
//     type: 'url'
//   });

//   const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);

//   const timeOptions = [
//     { value: '15', label: '15 minutes' },
//     { value: '30', label: '30 minutes' },
//     { value: '60', label: '60 minutes' },
//     { value: '120', label: '120 minutes' },
//     { value: '240', label: '240 minutes' },
//     { value: '480', label: '480 minutes' },
//     { value: '1440', label: '1440 minutes' }
//   ];

//   const proofTypes = [
//     { value: 'url', label: 'URL' },
//     { value: 'file', label: 'File' }
//   ];

// const getSelectedUserDepartments = () => {
//   if (!formData.assigned_to_employee_id) return [];

//   const selectedUser = hierarchyUsers.find(user => user.userId === formData.assigned_to_employee_id);
//   if (!selectedUser || !selectedUser.departments) return [];

//   // Handle both string and array cases
//   if (typeof selectedUser.departments === 'string') {
//     try {
//       const parsedDepartments = JSON.parse(selectedUser.departments);
//       return Array.isArray(parsedDepartments) 
//         ? parsedDepartments.map((dept: any) => ({
//             id: dept.id || dept._id || '',
//             name: dept.name || ''
//           }))
//         : [];
//     } catch {
//       return [];
//     }
//   }

//   // If it's already an array
//   return (selectedUser.departments as any[]).map((dept: any) => ({
//     id: dept.id || dept._id || '',
//     name: dept.name || ''
//   }));
// };

// const getBulkUserDepartments = () => {
//   if (!selectedBulkAssignee) return [];
//   const selectedUser = hierarchyUsers.find(user => user.userId === selectedBulkAssignee);
//   if (!selectedUser || !selectedUser.departments) return [];

//   // Handle both string and array cases
//   if (typeof selectedUser.departments === 'string') {
//     // If departments is a string, try to parse it or return empty array
//     try {
//       const parsedDepartments = JSON.parse(selectedUser.departments);
//       return Array.isArray(parsedDepartments) 
//         ? parsedDepartments.map((dept: any) => ({
//             id: dept.id || dept._id || '',
//             name: dept.name || ''
//           }))
//         : [];
//     } catch {
//       return [];
//     }
//   }

//   // If it's already an array
//   return (selectedUser.departments as any[]).map((dept: any) => ({
//     id: dept.id || dept._id || '',
//     name: dept.name || ''
//   }));
// };

//   const clearBulkUploadForm = () => {
//     setSelectedBulkAssignee('');
//     setSelectedBulkDepartment('');
//     setBulkUploadFile(null);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//     toast.success('Bulk upload form cleared');
//   };

//   const clearSingleTaskForm = () => {
//     setFormData({
//       title: '',
//       description: '',
//       assigned_to_employee_id: '',
//       proof: [],
//       TAT: 0,
//       deadline: '',
//     });
//     setNewProofField({
//       fieldName: '',
//       type: 'url'
//     });
//     setIsPreviousTaskSelected(false);
//     setShowSearchResults(false);
//     toast.success('Task form cleared');
//   };

//   const handleTitleChange = async (value: string) => {
//     setFormData(prev => ({
//       ...prev,
//       title: value
//     }));

//     if (isPreviousTaskSelected && value !== formData.title) {
//       setIsPreviousTaskSelected(false);
//       setFormData({
//         title: value,
//         description: '',
//         assigned_to_employee_id: '',
//         proof: [],
//         TAT: 0,
//         deadline: '',
//       });
//     }

//     if (value.trim().length > 2) {
//       setIsSearching(true);
//       try {
//         await dispatch(fetchPreviousTasks(value)).unwrap();
//         setShowSearchResults(true);
//       } catch (error) {
//         console.error('Failed to search previous tasks');
//       } finally {
//         setIsSearching(false);
//       }
//     } else {
//       setShowSearchResults(false);
//     }
//   };

//   const handleTaskSelect = (task: any) => {
//     setFormData({
//       title: task.title,
//       description: task.description || '',
//       assigned_to_employee_id: task.assigned_to_employee_id?._id || '',
//       proof: task.proof || [],
//       TAT: task.TAT || 0,
//       deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : '',
//       department_id: task.department_id || '', 
//     });
    
//     setShowSearchResults(false);
//     setIsPreviousTaskSelected(true);
//     toast.success('Previous task loaded! You can edit details before submitting.');
//   };

//   const handleInputChange = (field: keyof CreateTaskFormData, value: string | number | ProofRequirement[]) => {
//     if (field === 'assigned_to_employee_id') {
//       setFormData(prev => ({
//         ...prev,
//         [field]: value as string, 
//         department_id: ''
//       }));
//     } else {
//       setFormData(prev => ({
//         ...prev,
//         [field]: value
//       }));
//     }
//   };

//   const handleProofFieldChange = (field: keyof ProofField, value: string) => {
//     setNewProofField(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   };

//   const addProofField = () => {
//     if (!newProofField.fieldName.trim()) {
//       toast.error('Please enter a field name for the proof');
//       return;
//     }

//     setFormData(prev => ({
//       ...prev,
//       proof: [...prev.proof, newProofField]
//     }));

//     setNewProofField({
//       fieldName: '',
//       type: 'url'
//     });
//   };

//   const removeProofField = (index: number) => {
//     setFormData(prev => {
//       const newProof = [...prev.proof];
//       newProof.splice(index, 1);
//       return {
//         ...prev,
//         proof: newProof
//       };
//     });
//   };

//   const handleSubmit = async () => {
//     try {
//       if (!formData.title.trim()) {
//         throw new Error('Please enter a task title');
//       }
//       if (!formData.assigned_to_employee_id) {
//         throw new Error('Please select an assignee');
//       }
//       if (!formData.department_id) {
//         throw new Error('Please select a department');
//       }
//       if (!formData.TAT) {
//         throw new Error('Please select time to approval');
//       }
//       if (!formData.deadline) {
//         throw new Error('Please set a deadline');
//       }
//       if (formData.proof.length === 0) {
//         throw new Error('Please add at least one proof requirement');
//       }

//       const payload = {
//         ...formData,
//         TAT: Number(formData.TAT),
//         proof: formData.proof,
//         department_id: formData.department_id,
//       };

//       await dispatch(createTaskAssignment(payload)).unwrap();

//       toast.success('Task assigned successfully!', {
//         description: `"${formData.title}" has been assigned successfully.`
//       });

//       clearSingleTaskForm();

//     } catch (error: any) {
//       toast.error('Failed to assign task', {
//         description: error.message || 'Please try again.'
//       });
//     }
//   };

//   const downloadTemplate = () => {
//     const templateData = [
//       {
//         title: 'Prepare Sales Report',
//         description: 'Compile the monthly sales report with charts',
//         proof: JSON.stringify([{ fieldName: 'Github', type: 'url' }]),
//         TAT: 60,
//         deadline: '2025-08-22T18:30',
//         createdAt: '2025-08-22T18:30',
//         updatedAt: '2025-08-22T18:30'
//       },
//       {
//         title: 'Client Presentation',
//         description: 'Prepare slides for upcoming client meeting',
//         proof: JSON.stringify([{ fieldName: 'Drive', type: 'url' }]),
//         TAT: 120,
//         deadline: '2025-08-22T18:30',
//         createdAt: '2025-08-22T18:30',
//         updatedAt: '2025-08-22T18:30'
//       },
//       {
//         title: 'Website Bug Fix',
//         description: 'Resolve UI issues on homepage banner',
//         proof: JSON.stringify([{ fieldName: 'Image', type: 'file' }]),
//         TAT: 180,
//         deadline: '2025-08-22T18:30',

//       }
//     ];

//     const headers = ['title', 'description', 'proof', 'TAT', 'deadline'];
//     const csvContent = [
//       headers.join(','),
//       ...templateData.map(row => 
//         headers.map(header => {
//           const value = row[header as keyof typeof row];
//           const escapedValue = String(value).replace(/"/g, '""');
//           return String(value).includes(',') || String(value).includes('"') ? `"${escapedValue}"` : escapedValue;
//         }).join(',')
//       )
//     ].join('\n');

//     const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.setAttribute('href', url);
//     link.setAttribute('download', 'bulk_task_template.csv');
//     link.style.visibility = 'hidden';
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
    
//     toast.success('Template downloaded successfully!', {
//       description: 'You can now fill in your task details and upload the file.'
//     });
//   };

//   const handleBulkFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const files = event.target.files;
//     if (!files || files.length === 0) return;

//     const file = files[0];
    
//     const validExtensions = ['.xlsx', '.csv', '.xls'];
//     const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
//     if (!validExtensions.includes(fileExtension)) {
//       toast.error('Invalid file type', {
//         description: 'Please select an Excel (.xlsx, .xls) or CSV file.'
//       });
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       return;
//     }

//     if (file.size > 10 * 1024 * 1024) {
//       toast.error('File too large', {
//         description: 'Please select a file smaller than 10MB.'
//       });
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       return;
//     }

//     if (!selectedBulkAssignee) {
//       toast.error('Assignee required', {
//         description: 'Please select an assignee for bulk upload first.'
//       });
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       return;
//     }

//     if (!selectedBulkDepartment) {
//       toast.error('Department required', {
//         description: 'Please select a department for bulk upload first.'
//       });
//       if (fileInputRef.current) {
//         fileInputRef.current.value = '';
//       }
//       return;
//     }

//     setBulkUploadFile(file);
//     toast.success('File selected', {
//       description: `${file.name} is ready for upload.`
//     });
//   };

//   const handleBulkUpload = async () => {
//     if (!bulkUploadFile) {
//       toast.error('No file selected', {
//         description: 'Please select a file first.'
//       });
//       return;
//     }

//     if (!selectedBulkAssignee) {
//       toast.error('No assignee selected', {
//         description: 'Please select an assignee for bulk upload.'
//       });
//       return;
//     }

//     if (!selectedBulkDepartment) {
//       toast.error('No department selected', {
//         description: 'Please select a department for bulk upload.'
//       });
//       return;
//     }

//     setBulkUploadLoading(true);
    
//     const loadingToast = toast.loading('Uploading bulk tasks...');
    
//     try {
//       const bulkData: BulkUploadData = {
//         assigned_to_employee_id: selectedBulkAssignee,
//         department_id: selectedBulkDepartment,
//         taskFile: bulkUploadFile
//       };

//       const result = await dispatch(bulkTaskAssignments(bulkData)).unwrap();
      
//       toast.dismiss(loadingToast);
//       toast.success('Bulk tasks uploaded successfully!', {
//         description: `${result.length || 'Multiple'} tasks have been assigned successfully.`
//       });

//       clearBulkUploadForm();
      
//     } catch (error: any) {
//       toast.dismiss(loadingToast);
//       toast.error('Failed to upload bulk tasks', {
//         description: error.message || 'Please check your file format and try again.'
//       });
//     } finally {
//       setBulkUploadLoading(false);
//     }
//   };

//   const isFormValid = !!(formData.title.trim() && 
//                      formData.assigned_to_employee_id && 
//                      formData.department_id &&
//                      formData.TAT && 
//                      formData.deadline &&
//                      formData.proof.length > 0);

//   const isBulkFormValid = !!(selectedBulkAssignee && selectedBulkDepartment && bulkUploadFile);

//   // const getSelectedUserInfo = () => {
//   //   if (!formData.assigned_to_employee_id) return { department: '', role: '' };
//   //   const selectedUser = hierarchyUsers.find(user => user.userId === formData.assigned_to_employee_id);
//   //   const selectedDepartmentName =
//   //     selectedUser?.departmentId && selectedUser.departmentId === formData.department_id
//   //       ? selectedUser.departmentId
//   //       : undefined;
//   //   return {
//   //     department: selectedDepartmentName || 'No department selected',
//   //     role: selectedUser?.role || ''
//   //   };
//   // };

// const getSelectedUserInfo = () => {
//   if (!formData.assigned_to_employee_id) return { department: '', role: '' };
//   const selectedUser = hierarchyUsers.find(
//     user => user.userId === formData.assigned_to_employee_id
//   );
//   if (!selectedUser) return { department: '', role: '' };
//   // IMPORTANT: Use _id for matching as it's the actual id in the department object
//   const selectedDepartment = selectedUser.departments?.find(
//     dep => dep._id === formData.department_id
//   );
//   return {
//     department: selectedDepartment ? selectedDepartment.name : 'No department selected',
//     role: selectedUser.role || ''
//   };
// };


//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-[#1e2939] py-8 px-4">
//       <div className="max-w-2xl mx-auto">
//         <Card className="shadow-sm">
//           <CardHeader className="pb-6">
//             <CardTitle className="text-2xl">Task Assignment</CardTitle>
//             <CardDescription>
//               Assign tasks to your team members efficiently
//             </CardDescription>
//           </CardHeader>
          
//           <CardContent>
//             <div className="space-y-6">
//               <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
//                 <div className="flex items-center justify-between">
//                   <h3 className="text-lg font-medium">Bulk Task Upload</h3>
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     onClick={clearBulkUploadForm}
//                     disabled={!selectedBulkAssignee && !selectedBulkDepartment && !bulkUploadFile}
//                     className="text-muted-foreground hover:text-foreground"
//                   >
//                     Clear
//                   </Button>
//                 </div>
//                 <p className="text-sm text-muted-foreground">
//                   Upload multiple tasks at once using an Excel template
//                 </p>
                
//                 <div className="flex flex-col gap-4 sm:flex-row">
//                   <Button 
//                     type="button" 
//                     variant="outline" 
//                     onClick={downloadTemplate}
//                     className="flex-1"
//                   >
//                     Download Template
//                   </Button>
                  
//                   <div className="flex-1 flex flex-col gap-2">
//                     <Select 
//                       value={selectedBulkAssignee} 
//                       onValueChange={(value) => {
//                         setSelectedBulkAssignee(value);
//                         setSelectedBulkDepartment(''); 
//                       }}
//                       disabled={hierarchyLoading || sortedHierarchyUsers.length === 0}
//                     >
//                       <SelectTrigger>
//                         <SelectValue placeholder="Select bulk assignee" />
//                       </SelectTrigger>
//                       {sortedHierarchyUsers.length > 0 && (
//                         <SelectContent>
//                           {sortedHierarchyUsers.map((user) => (
//                             <SelectItem key={user.userId} value={user.userId}>
//                               {user.name} ({user.email}) - {user.role} - Level {user.hierarchyLevel}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       )}
//                     </Select>

//                     {selectedBulkAssignee && getBulkUserDepartments().length > 0 && (
//                       <Select 
//                         value={selectedBulkDepartment} 
//                         onValueChange={setSelectedBulkDepartment}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select department" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           {getBulkUserDepartments().map((department) => (
//                             <SelectItem key={department.id} value={department.id}>
//                               {department.name}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     )}
                    
//                     <div className="flex flex-col gap-2">
//                       <div className="flex gap-2">
//                         <Input
//                           ref={fileInputRef}
//                           type="file"
//                           accept=".xlsx,.csv,.xls"
//                           onChange={handleBulkFileSelect}
//                           className="flex-1"
//                           disabled={!selectedBulkAssignee || !selectedBulkDepartment || bulkUploadLoading}
//                         />
//                         <Button 
//                           onClick={handleBulkUpload}
//                           disabled={!isBulkFormValid || bulkUploadLoading}
//                           className="whitespace-nowrap"
//                         >
//                           {bulkUploadLoading ? 'Uploading...' : 'Upload File'}
//                         </Button>
//                       </div>
//                       {bulkUploadFile && (
//                         <div className="flex items-center justify-between">
//                           <p className="text-xs text-muted-foreground">
//                             Selected: {bulkUploadFile.name}
//                           </p>
//                           <Button
//                             type="button"
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => {
//                               setBulkUploadFile(null);
//                               if (fileInputRef.current) {
//                                 fileInputRef.current.value = '';
//                               }
//                               toast.info('File removed');
//                             }}
//                             className="text-red-500 hover:text-red-600 text-xs h-6"
//                           >
//                             Remove
//                           </Button>
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="relative">
//                 <div className="absolute inset-0 flex items-center">
//                   <span className="w-full border-t" />
//                 </div>
//                 <div className="relative flex justify-center text-xs uppercase">
//                   <span className="bg-background px-2 text-muted-foreground">
//                     Or create single task
//                   </span>
//                 </div>
//               </div>
             
//               <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
//                 <div className="flex items-center justify-between">
//                   <h3 className="text-lg font-medium">Single Task Assignment</h3>
//                   <Button
//                     type="button"
//                     variant="ghost"
//                     size="sm"
//                     onClick={clearSingleTaskForm}
//                     disabled={!formData.title && !formData.assigned_to_employee_id}
//                     className="text-muted-foreground hover:text-foreground"
//                   >
//                     Clear
//                   </Button>
//                 </div>
                
//                 <div className="space-y-2">
//                   <Label htmlFor="title" className="text-sm font-medium">
//                     Task Title <span className="text-red-500">*</span>
//                   </Label>
//                   <div className="relative">
//                     <Input 
//                       id="title" 
//                       type="text" 
//                       value={formData.title} 
//                       onChange={(e) => handleTitleChange(e.target.value)}
//                       placeholder="Start typing to search previous tasks or enter a new title"
//                       className="transition-all duration-200 pr-10" 
//                       required 
//                       ref={titleInputRef}
//                     />
//                     {isSearching && (
//                       <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
//                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
//                       </div>
//                     )}
                    
//                     {showSearchResults && previousTasks.length > 0 && (
//                       <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
//                         {previousTasks.map((task) => (
//                           <div
//                             key={task._id}
//                             className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
//                             onClick={() => handleTaskSelect(task)}
//                           >
//                             <div className="font-medium">{task.title}</div>
//                             <div className="text-sm text-muted-foreground">
//                               Assigned to: {task.assigned_to_employee_id?.name || 'Unknown'}
//                             </div>
//                             <div className="text-xs text-muted-foreground">
//                               {new Date(task.createdAt).toLocaleDateString()}
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
                  
//                   {isPreviousTaskSelected && (
//                     <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md mt-2">
//                       <span className="text-xs text-blue-600">
//                         Loaded from previous task
//                       </span>
//                       <Button
//                         type="button"
//                         variant="ghost"
//                         size="sm"
//                         onClick={() => {
//                           setFormData(prev => ({
//                             ...prev,
//                             description: '',
//                             assigned_to_employee_id: '',
//                             proof: [],
//                             TAT: 0,
//                             deadline: '',
//                             department_id: '',
//                           }));
//                           setIsPreviousTaskSelected(false);
//                           toast.info('Form partially cleared - title kept');
//                         }}
//                         className="text-blue-600 hover:text-blue-800 text-xs"
//                       >
//                         Clear Details
//                       </Button>
//                     </div>
//                   )}
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="description" className="text-sm font-medium">
//                     Description
//                   </Label>
//                   <Textarea 
//                     id="description" 
//                     value={formData.description} 
//                     onChange={(e) => handleInputChange('description', e.target.value)} 
//                     placeholder="Provide detailed instructions for this task" 
//                     rows={4} 
//                     className="transition-all duration-200 resize-none" 
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label className="text-sm font-medium">
//                     Assignee <span className="text-red-500">*</span>
//                   </Label>
                
//                   <Select 
//                     value={formData.assigned_to_employee_id} 
//                     onValueChange={(value) => handleInputChange('assigned_to_employee_id', value)}
//                     required
//                     disabled={hierarchyLoading || sortedHierarchyUsers.length === 0}
//                   >
//                     <SelectTrigger className="transition-all duration-200">
//                       <SelectValue placeholder={
//                         hierarchyLoading
//                           ? "Loading assignees..." 
//                           : sortedHierarchyUsers.length === 0
//                             ? "No assignees available"
//                             : "Select a user"
//                       } />
//                     </SelectTrigger>
//                     {sortedHierarchyUsers.length > 0 && (
//                       <SelectContent>
//                         {sortedHierarchyUsers.map((user) => (
//                           <SelectItem 
//                             key={user.userId} 
//                             value={user.userId}
//                           >
//                             {user.name} ({user.email}) - {user.role} - Level {user.hierarchyLevel}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     )}
//                   </Select>
//                 </div>

//                 {formData.assigned_to_employee_id && getSelectedUserDepartments().length > 0 && (
//                   <div className="space-y-2">
//                     <Label className="text-sm font-medium">
//                       Department <span className="text-red-500">*</span>
//                     </Label>
//                     <Select 
//                       value={formData.department_id || ''} 
//                       onValueChange={(value) => handleInputChange('department_id', value)}
//                       required
//                     >
//                       <SelectTrigger className="transition-all duration-200">
//                         <SelectValue placeholder="Select a department" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {getSelectedUserDepartments().map((department) => (
//                           <SelectItem 
//                             key={department.id} 
//                             value={department.id}
//                           >
//                             {department.name}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </div>
//                 )}

//                 {formData.assigned_to_employee_id && formData.department_id && (
//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium">
//                         Selected Department
//                       </Label>
//                       <Input
//                         value={getSelectedUserInfo().department}
//                         readOnly
//                         className="transition-all duration-200"
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium">
//                         User Role
//                       </Label>
//                       <Input
//                         value={getSelectedUserInfo().role}
//                         readOnly
//                         className="transition-all duration-200"
//                       />
//                     </div>
//                   </div>
//                 )}

//                 <div className="space-y-2">
//                   <Label htmlFor="deadline" className="text-sm font-medium">
//                     Deadline <span className="text-red-500">*</span>
//                   </Label>
//                   <Input
//                     id="deadline"
//                     type="datetime-local"
//                     value={formData.deadline}
//                     onChange={(e) => handleInputChange('deadline', e.target.value)}
//                     className="transition-all duration-200"
//                     required
//                   />
//                 </div>

//                 <div className="space-y-2">
//                   <Label htmlFor="TAT" className="text-sm font-medium">
//                     Time to Approval (TAT) in minutes <span className="text-red-500">*</span>
//                   </Label>
//                   <div className="flex gap-2">
//                     <Select 
//                       value={formData.TAT.toString()}
//                       onValueChange={(value) => handleInputChange('TAT', value)}
//                     >
//                       <SelectTrigger className="flex-1 transition-all duration-200">
//                         <SelectValue placeholder="Select time" />
//                       </SelectTrigger>
//                       <SelectContent>
//                         {timeOptions.map((option) => (
//                           <SelectItem key={option.value} value={option.value}>
//                             {option.label}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                     <span className="text-sm text-muted-foreground self-center">or</span>
//                     <Input
//                       type="number"
//                       placeholder="Custom"
//                       value={formData.TAT}
//                       onChange={(e) => handleInputChange('TAT', e.target.value)}
//                       className="w-24 transition-all duration-200"
//                       min="1"
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-4">
//                   <Label className="text-sm font-medium">
//                     Required Proof Fields <span className="text-red-500">*</span>
//                   </Label>
                  
//                   {formData.proof.length > 0 ? (
//                     <div className="space-y-2">
//                       {formData.proof.map((proof, index) => (
//                         <div key={index} className="flex items-center gap-2">
//                           <div className="flex-1 grid grid-cols-2 gap-2">
//                             <div>
//                               <Label className="text-xs">Field Name</Label>
//                               <Input
//                                 value={proof.fieldName}
//                                 readOnly
//                                 className="text-sm"
//                               />
//                             </div>
//                             <div>
//                               <Label className="text-xs">Type</Label>
//                               <Input
//                                 value={proof.type}
//                                 readOnly
//                                 className="text-sm"
//                               />
//                             </div>
//                           </div>
//                           <Button
//                             type="button"
//                             variant="ghost"
//                             size="sm"
//                             onClick={() => removeProofField(index)}
//                             className="text-red-500 hover:text-red-600"
//                           >
//                             Remove
//                           </Button>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <p className="text-xs text-muted-foreground">
//                       No proof fields added yet
//                     </p>
//                   )}

//                   <div className="border-t pt-4">
//                     <div className="grid grid-cols-2 gap-2">
//                       <div>
//                         <Label className="text-xs">Field Name</Label>
//                         <Input
//                           value={newProofField.fieldName}
//                           onChange={(e) => handleProofFieldChange('fieldName', e.target.value)}
//                           placeholder="e.g. Screenshot, Report"
//                           className="text-sm"
//                         />
//                       </div>
//                       <div>
//                         <Label className="text-xs">Type</Label>
//                         <Select
//                           value={newProofField.type}
//                           onValueChange={(value: 'url' | 'file') => handleProofFieldChange('type', value)}
//                         >
//                           <SelectTrigger className="text-sm">
//                             <SelectValue placeholder="Select type" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {proofTypes.map((type) => (
//                               <SelectItem key={type.value} value={type.value}>
//                                 {type.label}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                       </div>
//                     </div>
//                     <Button
//                       type="button"
//                       variant="outline"
//                       size="sm"
//                       onClick={addProofField}
//                       className="mt-2"
//                     >
//                       Add Proof Field
//                     </Button>
//                   </div>
//                 </div>

//                 <div className="pt-4">
//                   <Button 
//                     type="button"
//                     onClick={handleSubmit}
//                     className="w-full"
//                     disabled={!isFormValid || loading}
//                   >
//                     {loading ? 'Processing...' : 'Assign Task'}
//                   </Button>
//                 </div>
                
//                 {!isFormValid && (
//                   <p className="text-xs text-muted-foreground text-center">
//                     Please fill in all required fields to assign the task
//                   </p>
//                 )}
//               </div>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default TaskAssignmentForm;
