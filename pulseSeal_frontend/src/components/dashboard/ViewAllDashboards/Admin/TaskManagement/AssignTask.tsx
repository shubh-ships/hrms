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
    fetchUsers,
    selectUsers,
    selectUsersLoading,
    selectUsersError
} from '@/features/user/userSlice';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
    Download,
    UploadCloud,
    Plus,
    Trash2,
    X,
    Calendar,
    Clock,
    Briefcase,
    AlertCircle,
    Info
} from 'lucide-react';

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

const AdminTaskAssignment = () => {
    const dispatch = useAppDispatch();

    // Use all users from fetchUsers API
    const allUsers = useAppSelector(selectUsers);
    const usersLoading = useAppSelector(selectUsersLoading);
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
    const [bulkPriority, setBulkPriority] = useState<"Low" | "Medium" | "High" | "">("");

    // Fetch all users on component mount
    useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    // Handle errors
    useEffect(() => {
        if (usersError) {
            toast.error('Failed to load assignees', {
                description: usersError
            });
        }
    }, [usersError]);

    // Sort users by role and name for better display
    const sortedUsers = useMemo(() => {
        if (!allUsers || allUsers.length === 0) return [];

        // Deduplicate users by user_id._id and filter out invalid ones
        const userMap = new Map();
        allUsers.forEach(u => {
            const uid = u?.user_id?._id;
            if (uid && !userMap.has(uid)) {
                userMap.set(uid, u);
            }
        });

        const validUsers = Array.from(userMap.values());

        return [...validUsers].sort((a, b) => {
            const roleOrder: Record<string, number> = { ADMIN: 1, MANAGER: 2, MEMBER: 3 };
            const aRole = a.roleDefinitionId?.roleName || 'MEMBER';
            const bRole = b.roleDefinitionId?.roleName || 'MEMBER';

            if (roleOrder[aRole] !== roleOrder[bRole]) {
                return (roleOrder[aRole] || 4) - (roleOrder[bRole] || 4);
            }

            const aName = a.user_id?.name || '';
            const bName = b.user_id?.name || '';
            return aName.localeCompare(bName);
        });
    }, [allUsers]);

    const [formData, setFormData] = useState<CreateTaskFormData>({
        title: '',
        description: '',
        assigned_to_employee_id: '',
        proof: [{ fieldName: '', type: 'url' }],
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

    // Get departments for selected user
    const getSelectedUserDepartments = () => {
        if (!formData.assigned_to_employee_id) return [];
        const selectedUser = allUsers.find(user => user.user_id?._id === formData.assigned_to_employee_id);
        return selectedUser?.departments || [];
    };

    // Get departments for bulk upload selected user
    const getBulkUserDepartments = () => {
        if (!selectedBulkAssignee) return [];
        const selectedUser = allUsers.find(user => user.user_id?._id === selectedBulkAssignee);
        return selectedUser?.departments || [];
    };

    // Clear bulk upload form
    const clearBulkUploadForm = () => {
        setSelectedBulkAssignee('');
        setSelectedBulkDepartment('');
        setBulkUploadFile(null);
        setBulkPriority('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        toast.success('Bulk upload form cleared');
    };

    // Clear single task form
    const clearSingleTaskForm = (showToast = true) => {
        setFormData({
            title: '',
            description: '',
            assigned_to_employee_id: '',
            proof: [{ fieldName: '', type: 'url' }], // Initialize with one empty field
            TAT: 0,
            deadline: '',
            priority: 'Low',
            department_id: '',
        });
        setNewProofField({
            fieldName: '',
            type: 'url'
        });
        setIsPreviousTaskSelected(false);
        setShowSearchResults(false);
        if (showToast) toast.success('Task form cleared');
    };

    const handleTitleChange = async (value: string) => {
        setFormData(prev => ({
            ...prev,
            title: value
        }));

        // If a previous task was selected and user starts typing again, clear the form
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
                department_id: '',
            });
        }

        // Search for previous tasks when user types more than 2 characters
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
            // Clear department when user changes
            setFormData(prev => ({
                ...prev,
                [field]: value as string,
                department_id: '' // Clear department when user changes
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleProofFieldUpdate = (index: number, field: keyof ProofField, value: string) => {
        setFormData(prev => {
            const newProof = [...prev.proof];
            newProof[index] = { ...newProof[index], [field]: value };
            return { ...prev, proof: newProof };
        });
    };

    const addProofField = () => {
        setFormData(prev => ({
            ...prev,
            proof: [...prev.proof, { fieldName: '', type: 'url' }]
        }));
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
            if (!formData.title.trim()) {
                throw new Error('Please enter a task title');
            }
            if (!formData.assigned_to_employee_id) {
                throw new Error('Please select an assignee');
            }
            if (!formData.department_id) {
                throw new Error('Please select a department');
            }
            if (!formData.description.trim()) {
                throw new Error('Please enter a task description');
            }
            if (!formData.TAT) {
                throw new Error('Please select time to approval');
            }
            if (!formData.deadline) {
                throw new Error('Please set a deadline');
            }
            if (formData.proof.length === 0 || !formData.proof[0].fieldName.trim()) {
                throw new Error('Please add at least one valid proof requirement');
            }

            // Format deadline to ISO format: YYYY-MM-DDTHH:mm:ss+05:30
            const formatDeadline = (deadline: string): string => {
                if (!deadline) return '';
                // Add seconds (:00) and timezone (+05:30)
                return `${deadline}:00+05:30`;
            };

            const payload = {
                ...formData,
                TAT: Number(formData.TAT),
                proof: formData.proof,
                department_id: formData.department_id,
                deadline: formatDeadline(formData.deadline),
            };

            await dispatch(createTaskAssignment(payload)).unwrap();

            toast.success('Task assigned successfully!', {
                description: `"${formData.title}" has been assigned successfully.`
            });

            clearSingleTaskForm(false);

        } catch (error: any) {
            toast.error('Failed to assign task', {
                description: error.message || 'Please try again.'
            });
        }
    };

    const downloadTemplate = () => {
        // Create template data matching the Excel format
        const templateData = [
            {
                title: 'Prepare Sales Report',
                description: 'Compile the monthly sales report with charts',
                proof: JSON.stringify([{ fieldName: 'Github', type: 'url' }]),
                TAT: 60,
                deadline: '2026-01-03T18:30:00+05:30',
                priority: 'Medium',
                createdAt: '2026-01-03T18:30:00+05:30',
                updatedAt: '2026-01-03T18:30:00+05:30'
            },
            {
                title: 'Client Presentation',
                description: 'Prepare slides for upcoming client meeting',
                proof: JSON.stringify([{ fieldName: 'Drive', type: 'url' }]),
                TAT: 120,
                deadline: '2026-01-03T18:30:00+05:30',
                priority: 'High',
                createdAt: '2026-01-03T18:30:00+05:30',
                updatedAt: '2026-01-03T18:30:00+05:30'
            },
            {
                title: 'Website Bug Fix',
                description: 'Resolve UI issues on homepage banner',
                proof: JSON.stringify([{ fieldName: 'Image', type: 'file' }]),
                TAT: 180,
                deadline: '2026-01-03T18:30:00+05:30',
                priority: 'Low'
            }
        ];

        // Convert to CSV with proper headers
        const headers = ['title', 'description', 'proof', 'TAT', 'deadline', 'priority'];
        const csvContent = [
            headers.join(','),
            ...templateData.map(row =>
                headers.map(header => {
                    const value = row[header as keyof typeof row];
                    // Escape quotes and wrap in quotes if contains commas
                    const escapedValue = String(value).replace(/"/g, '""');
                    return String(value).includes(',') || String(value).includes('"') ? `"${escapedValue}"` : escapedValue;
                }).join(',')
            )
        ].join('\n');

        // Create download link
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

        // Validate file type
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

        // Validate file size (max 10MB)
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

        // Show loading toast
        const loadingToast = toast.loading('Uploading bulk tasks...');

        try {
            const bulkData: BulkUploadData = {
                assigned_to_employee_id: selectedBulkAssignee,
                department_id: selectedBulkDepartment,
                taskFile: bulkUploadFile,
                priority: bulkPriority || 'Low',
            };

            const result = await dispatch(bulkTaskAssignments(bulkData)).unwrap();

            // Dismiss loading toast and show success
            toast.dismiss(loadingToast);
            toast.success('Bulk tasks uploaded successfully!', {
                description: `${result.length || 'Multiple'} tasks have been assigned successfully.`
            });

            clearBulkUploadForm();

        } catch (error: any) {
            // Dismiss loading toast and show error
            toast.dismiss(loadingToast);
            toast.error('Failed to upload bulk tasks', {
                description: error.message || 'Please check your file format and try again.'
            });
        } finally {
            setBulkUploadLoading(false);
        }
    };

    const isFormValid = formData.title.trim() &&
        formData.assigned_to_employee_id &&
        formData.department_id &&
        formData.TAT &&
        formData.deadline &&
        formData.proof.length > 0;

    const isBulkFormValid = selectedBulkAssignee && selectedBulkDepartment && bulkUploadFile;

    const getSelectedUserInfo = () => {
        if (!formData.assigned_to_employee_id) return { department: '', role: '' };
        const selectedUser = allUsers.find(user => user.user_id?._id === formData.assigned_to_employee_id);
        const selectedDepartment = selectedUser?.departments.find(dept => dept._id === formData.department_id);
        return {
            department: selectedDepartment?.name || 'No department selected',
            role: selectedUser?.roleDefinitionId?.roleName || ''
        };
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] flex flex-col -m-4 w-[calc(100%+32px)]">
            <div className="flex-1 p-[40px]">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Page Header */}
                    <div className="flex flex-col">
                        <h1 className="text-[20px] font-semibold h-[30px] w-[264px] text-[#1e293b] dark:text-white">Admin Task Management</h1>
                        <p className="text-[#9CA3AF] text-[12px] dark:text-gray-400">Assign tasks to all users in the organization</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Left Column: Single Task Assignment */}
                        <div className="lg:col-span-2">
                            <Card className="border-[#E5E7EB] shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden gap-0 p-0">
                                <div className="h-[60px] border-b border-[#E5E7EB] dark:border-slate-800 flex justify-between items-center">
                                    <h3 className="text-[16px] font-medium text-[#1F2937] ml-[20px] dark:text-white">Single Task Assignment</h3>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={clearSingleTaskForm}
                                        className="text-[#3F5A54] text-[14px] font-medium mr-[20px] hover:text-slate-600 transition-colors"
                                    >
                                        Clear
                                    </Button>
                                </div>

                                <CardContent className="p-[20px] space-y-6">
                                    {/* Task Title */}
                                    <div className="space-y-2">
                                        <Label htmlFor="title" className="text-[10px] font-medium tracking-wider text-[#4B5563]">
                                            Task Title <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative group">
                                            <Input
                                                id="title"
                                                value={formData.title}
                                                onChange={(e) => handleTitleChange(e.target.value)}
                                                placeholder="e.g. Conduct quality audit for Project Phoenix"
                                                className="h-[36px] text-[10px] text-[#1F2937] font-normal border-[#E5E7EB] bg-white dark:bg-slate-800 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#9CA3AF]"
                                                ref={titleInputRef}
                                            />
                                            {isSearching && (
                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                                                </div>
                                            )}

                                            {showSearchResults && previousTasks.length > 0 && (
                                                <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-auto animate-in fade-in slide-in-from-top-1">
                                                    {previousTasks.map((task) => (
                                                        <div
                                                            key={task._id}
                                                            className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-b-0 transition-colors"
                                                            onClick={() => handleTaskSelect(task)}
                                                        >
                                                            <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">{task.title}</div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <div className="text-xs text-slate-500">
                                                                    {task.assigned_to_employee_id?.name || 'Unknown'}
                                                                </div>
                                                                <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                                                                <div className="text-xs text-slate-400">
                                                                    {new Date(task.createdAt).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        {isPreviousTaskSelected && (
                                            <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/10 rounded-lg text-primary text-xs">
                                                <div className="flex items-center gap-2">
                                                    <Info className="h-4 w-4" />
                                                    <span>Loaded from history. You can still modify the details.</span>
                                                </div>
                                                <button onClick={() => setIsPreviousTaskSelected(false)} className="hover:text-primary/70">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Priority & Assignee Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-medium tracking-wider text-[#4B5563]">Priority</Label>
                                            <Select
                                                value={formData.priority}
                                                onValueChange={(value: "Low" | "Medium" | "High") =>
                                                    setFormData(prev => ({ ...prev, priority: value }))
                                                }
                                            >
                                                <SelectTrigger className="h-[36px] w-full text-[10px] text-[#1F2937] font-normal border-[#E5E7EB] bg-white dark:bg-slate-800 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0">
                                                    <SelectValue placeholder="Medium" />
                                                </SelectTrigger>
                                                <SelectContent position="popper" side="bottom" sideOffset={4} avoidCollisions={false} className="border-[#E5E7EB] dark:border-slate-800 min-w-[100px] p-1 [&>button]:hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
                                                    <SelectItem value="Low" className="text-[10px] py-1">Low</SelectItem>
                                                    <SelectItem value="Medium" className="text-[10px] py-1">Medium</SelectItem>
                                                    <SelectItem value="High" className="text-[10px] py-1">High</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                         <div className="space-y-2">
                                            <Label className="text-[10px] font-medium tracking-wider text-[#4B5563]">Assignee <span className="text-red-500">*</span></Label>
                                            <Select
                                                value={formData.assigned_to_employee_id}
                                                onValueChange={(value) => {
                                                    handleInputChange('assigned_to_employee_id', value);
                                                    // Auto-select department if user only has one
                                                    const userDepartments = allUsers.find(u => u.user_id?._id === value)?.departments || [];
                                                    if (userDepartments.length === 1) {
                                                        handleInputChange('department_id', userDepartments[0]._id);
                                                    }
                                                }}
                                                disabled={usersLoading || sortedUsers.length === 0}
                                            >
                                                <SelectTrigger className="h-[36px] w-full text-[10px] text-[#1F2937] font-normal border-[#E5E7EB] bg-white dark:bg-slate-800 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0">
                                                    <SelectValue placeholder={usersLoading ? "Loading..." : "Select assignee"} />
                                                </SelectTrigger>
                                                <SelectContent position="popper" side="bottom" sideOffset={4} avoidCollisions={false} className="border-[#E5E7EB] dark:border-slate-800 min-w-[200px] p-1 max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 [&>button]:hidden">
                                                    {sortedUsers.map((user) => (
                                                        <SelectItem key={user.user_id?._id || Math.random()} value={user.user_id?._id || ''} className="text-[10px] py-1">
                                                            {user.user_id?.name || 'Unknown'}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-medium tracking-wider text-[#4B5563]">Department <span className="text-red-500">*</span></Label>
                                            <Select
                                                value={formData.department_id}
                                                onValueChange={(value) => handleInputChange('department_id', value)}
                                                disabled={!formData.assigned_to_employee_id}
                                            >
                                                <SelectTrigger className="h-[36px] w-full text-[10px] text-[#1F2937] font-normal border-[#E5E7EB] bg-white dark:bg-slate-800 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0">
                                                    <SelectValue placeholder={!formData.assigned_to_employee_id ? "Select assignee first" : "Select department"} />
                                                </SelectTrigger>
                                                <SelectContent position="popper" side="bottom" sideOffset={4} avoidCollisions={false} className="border-[#E5E7EB] dark:border-slate-800 min-w-[200px] p-1 [&>button]:hidden">
                                                    {getSelectedUserDepartments().map((dept) => (
                                                        <SelectItem key={dept._id} value={dept._id} className="text-[10px] py-1">
                                                            {dept.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="space-y-2">
                                        <Label htmlFor="description" className="text-[10px] font-medium tracking-wider text-[#4B5563]">Description <span className="text-red-500">*</span></Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={(e) => handleInputChange('description', e.target.value)}
                                            placeholder="Provide detailed instructions for the task..."
                                            rows={4}
                                            className="h-[81px] text-[10px] text-[#1F2937] font-normal border-[#E5E7EB] bg-white dark:bg-slate-800 resize-none rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#9CA3AF]"
                                        />
                                    </div>

                                    {/* Deadline & TAT Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="deadline" className="text-[10px] font-medium tracking-wider text-[#4B5563]">Deadline <span className="text-red-500">*</span></Label>
                                            <div className="relative">
                                                <Calendar
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 cursor-pointer z-10"
                                                    onClick={() => {
                                                        const input = document.getElementById('deadline') as HTMLInputElement;
                                                        if (input && input.showPicker) {
                                                            input.showPicker();
                                                        } else if (input) {
                                                            input.focus();
                                                        }
                                                    }}
                                                />
                                                <Input
                                                    id="deadline"
                                                    type="datetime-local"
                                                    value={formData.deadline}
                                                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                                                    className="pl-10 h-[36px] text-[10px] text-[#1F2937] font-normal border-[#E5E7EB] bg-white dark:bg-slate-800 focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none placeholder:text-[#9CA3AF]"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-medium tracking-wider text-[#4B5563]">Time to Approval (TAT) in minutes <span className="text-red-500">*</span></Label>
                                            <div className="flex items-center gap-[15px]">
                                                <div className="flex-1">
                                                    <Select
                                                        value={formData.TAT.toString()}
                                                        onValueChange={(value) => handleInputChange('TAT', value)}
                                                    >
                                                        <SelectTrigger className="h-[36px] w-full text-[10px] text-[#1F2937] font-normal border-[#E5E7EB] bg-white dark:bg-slate-800 rounded-[10px] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0">
                                                            <SelectValue placeholder="Select the time" />
                                                        </SelectTrigger>
                                                        <SelectContent position="popper" side="bottom" sideOffset={4} avoidCollisions={false} className="border-[#E5E7EB] dark:border-slate-800 min-w-[120px] p-1 [&>button]:hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
                                                            {timeOptions.map((option) => (
                                                                <SelectItem key={option.value} value={option.value} className="text-[10px] py-1">
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <span className="text-[12px] font-medium text-[#000000CC] whitespace-nowrap">OR</span>
                                                <div className="w-[172px]">
                                                    <Input
                                                        type="number"
                                                        placeholder="Type"
                                                        value={formData.TAT || ''}
                                                        onChange={(e) => handleInputChange('TAT', e.target.value)}
                                                        className="h-[36px] text-[10px] text-[#1F2937] font-normal border-[#E5E7EB] bg-white dark:bg-slate-800 rounded-[10px] focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#9CA3AF]"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-b border-[#E5E7EB]"></div>

                                    {/* Proof Fields */}
                                    <div className="space-y-4">
                                        <Label className="text-[14px] font-medium text-[#0F172A] flex items-center gap-2">
                                            Required Proof Fields <span className="text-red-500">*</span>
                                        </Label>

                                        <div className="space-y-[20px]">
                                            <div className="space-y-[10px]">
                                                {formData.proof.map((proof, index) => (
                                                    <div key={index} className="flex items-end gap-4 p-[15px] bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg animate-in slide-in-from-left-2 duration-300">
                                                        <div className="flex-1 space-y-1">
                                                            <Label className="text-[10px] font-medium text-[#4B5563]">Field Name</Label>
                                                            <Input
                                                                value={proof.fieldName}
                                                                onChange={(e) => handleProofFieldUpdate(index, 'fieldName', e.target.value)}
                                                                placeholder="e.g. Screenshot, Report"
                                                                className="h-[36px] text-[10px] text-[#1F2937] font-normal border-[#E5E7EB] bg-white focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-[#9CA3AF]"
                                                            />
                                                        </div>
                                                        <div className="w-[172px] space-y-1">
                                                            <Label className="text-[10px] font-medium text-[#4B5563]">Field Type</Label>
                                                            <Select
                                                                value={proof.type}
                                                                onValueChange={(value: 'url' | 'file') => handleProofFieldUpdate(index, 'type', value)}
                                                            >
                                                                <SelectTrigger className="h-[36px] w-full text-[10px] text-[#1F2937] font-normal border-[#E5E7EB] bg-white focus:ring-0 focus-visible:ring-0">
                                                                    <SelectValue placeholder="Select type" />
                                                                </SelectTrigger>
                                                                <SelectContent position="popper" side="bottom" sideOffset={4} avoidCollisions={false} className="border-[#E5E7EB] dark:border-slate-800 min-w-[120px] p-1 [&>button]:hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
                                                                    {proofTypes.map((type) => (
                                                                        <SelectItem key={type.value} value={type.value} className="text-[10px] py-1">
                                                                            {type.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        {formData.proof.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeProofField(index)}
                                                                className="h-[36px] w-[36px] text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="relative border-2 border-dotted border-[#E2E8F0] rounded-lg h-[40px] flex items-center justify-center">
                                                <Button
                                                    type="button"
                                                    onClick={addProofField}
                                                    variant="ghost"
                                                    className="bg-white px-4 py-1 text-[14px] font-medium text-[#3F5A54] flex items-center gap-2 hover:bg-transparent transition-colors"
                                                >
                                                    <Plus className="h-[15px] w-[15px] rounded-full border border-[#4B5563] p-0.5" strokeWidth={3} />
                                                    Add more Proof Field
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Bulk Upload */}
                        <div className="space-y-8">
                            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden p-0 gap-0">
                                <div className="h-[60px] px-[20px] border-b border-[#E5E7EB] dark:border-slate-800 flex justify-between items-center">
                                    <h3 className="text-[16px] font-medium text-[#1F2937] dark:text-white">Bulk Task Upload</h3>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={clearBulkUploadForm}
                                        className="text-[#3F5A54] text-[14px] font-medium hover:text-slate-600 transition-colors"
                                    >
                                        Clear
                                    </Button>
                                </div>

                                <CardContent>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={downloadTemplate}
                                        className="w-full h-[41px] my-[12px] bg-[#DFE8E5] border-[#E5E7EB] dark:border-slate-700 hover:bg-slate-100 flex items-center justify-center gap-2 rounded-[8px] text-slate-700"
                                    >
                                        <Download className="h-4 w-4" />
                                        Download Template
                                    </Button>

                                    <div
                                        className={`relative border-2 border-dashed rounded-2xl h-[200px] mb-[20px] transition-all duration-300 flex flex-col items-center justify-center gap-4 ${bulkUploadFile
                                            ? 'border-emerald-200 bg-emerald-50'
                                            : 'border-slate-200 hover:border-primary/40 bg-white'
                                            }`}
                                    >
                                        <div className="h-[24px] w-[33px] flex items-center justify-center text-[#94A3B8]">
                                            <UploadCloud className="h-[24px] w-[33px]" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-semibold text-slate-700">Drop CSV here or</p>
                                            <label className="cursor-pointer">
                                                <span className="text-sm font-semibold text-white px-4 py-1.5 bg-[#4B5563] rounded-md hover:bg-slate-600 transition-colors mt-2 inline-block">
                                                    Choose File
                                                </span>
                                                <input
                                                    type="file"
                                                    accept=".xlsx,.csv,.xls"
                                                    onChange={handleBulkFileSelect}
                                                    className="hidden"
                                                    disabled={bulkUploadLoading}
                                                />
                                            </label>
                                            <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-tight">Max file size: 10MB</p>
                                        </div>

                                        {bulkUploadFile && (
                                            <div className="absolute inset-0 bg-white/90 rounded-2xl flex flex-col items-center justify-center p-4 text-center animate-in zoom-in-95">
                                                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
                                                    <UploadCloud className="h-5 w-5" />
                                                </div>
                                                <p className="text-xs font-bold text-slate-800 line-clamp-1 truncate w-40">{bulkUploadFile.name}</p>
                                                <p className="text-[10px] text-slate-400 mb-3">{(bulkUploadFile.size / 1024).toFixed(1)} KB</p>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setBulkUploadFile(null);
                                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                                    }}
                                                    className="text-red-500 hover:bg-red-50 h-7 text-[10px] uppercase font-bold"
                                                >
                                                    Remove File
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        onClick={handleBulkUpload}
                                        disabled={!isBulkFormValid || bulkUploadLoading}
                                        className="w-full h-[45px] rounded-[8px] bg-[#4B5563] hover:bg-[#374151] text-white shadow-lg transition-all disabled:opacity-100"
                                    >
                                        {bulkUploadLoading ? 'Uploading...' : 'Upload File'}
                                    </Button>

                                    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-medium text-[#4B5563]">Select bulk assignee</Label>
                                            <Select
                                                value={selectedBulkAssignee}
                                                onValueChange={(value) => {
                                                    setSelectedBulkAssignee(value);
                                                    setSelectedBulkDepartment('');
                                                }}
                                                disabled={usersLoading || sortedUsers.length === 0}
                                            >
                                                 <SelectTrigger className="h-[36px] w-full text-[10px] text-[#1F2937] font-normal rounded-[8px] bg-white border-[#E5E7EB] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0">
                                                    <SelectValue placeholder="Select bulk assignee" />
                                                </SelectTrigger>
                                                <SelectContent position="popper" side="bottom" sideOffset={4} avoidCollisions={false} className="border-[#E5E7EB] dark:border-slate-800 min-w-[200px] p-1 max-h-[200px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 [&>button]:hidden">
                                                    {sortedUsers.map((user) => (
                                                        <SelectItem key={user.user_id?._id || Math.random()} value={user.user_id?._id || ''} className="text-[10px] py-1">
                                                            {user.user_id?.name || 'Unknown'}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-medium text-[#4B5563]">Select bulk department</Label>
                                            <Select
                                                value={selectedBulkDepartment}
                                                onValueChange={(value) => setSelectedBulkDepartment(value)}
                                                disabled={!selectedBulkAssignee}
                                            >
                                                <SelectTrigger className="h-[36px] w-full text-[10px] text-[#1F2937] font-normal rounded-[8px] bg-white border-[#E5E7EB] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0">
                                                    <SelectValue placeholder={!selectedBulkAssignee ? "Select assignee first" : "Select department"} />
                                                </SelectTrigger>
                                                <SelectContent position="popper" side="bottom" sideOffset={4} avoidCollisions={false} className="border-[#E5E7EB] dark:border-slate-800 min-w-[200px] p-1 [&>button]:hidden">
                                                    {getBulkUserDepartments().map((dept) => (
                                                        <SelectItem key={dept._id} value={dept._id} className="text-[10px] py-1">
                                                            {dept.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2 mb-[20px]">
                                            <Label className="text-[10px] font-medium text-[#4B5563]">Select Priority</Label>
                                            <Select
                                                value={bulkPriority}
                                                onValueChange={(value: "Low" | "Medium" | "High" | "") => setBulkPriority(value)}
                                            >
                                                <SelectTrigger className="h-[36px] w-full text-[10px] text-[#1F2937] font-normal rounded-[8px] bg-white border-[#E5E7EB] focus:ring-0 focus:ring-offset-0 focus-visible:ring-0">
                                                    <SelectValue placeholder="Select priority" />
                                                </SelectTrigger>
                                                <SelectContent position="popper" side="bottom" sideOffset={4} avoidCollisions={false} className="border-[#E5E7EB] dark:border-slate-800 min-w-[100px] p-1 [&>button]:hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
                                                    <SelectItem value="Low" className="text-[10px] py-1">Low</SelectItem>
                                                    <SelectItem value="Medium" className="text-[10px] py-1">Medium</SelectItem>
                                                    <SelectItem value="High" className="text-[10px] py-1">High</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="sticky -bottom-4 z-100 h-[80px] bg-white border-t-2 border-[#B1B1B14D] flex items-center justify-end px-[40px] w-full">
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-[143px] h-[36px] bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#94A3B8] font-medium text-[14px] rounded-[6px] border border-[#E2E8F0] shadow-sm transition-colors"
                >
                    {loading ? 'Processing...' : 'Assign Task'}
                </Button>
            </div>
        </div>
    );
};

export default AdminTaskAssignment;