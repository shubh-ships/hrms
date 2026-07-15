"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  CreditCard,
  Eye,
  Edit,
  Plus,
  X,
  Loader2,
  User,
  Building,
  Badge as BadgeIcon,
  FileText,
  DollarSign,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchEmployees,
  fetchEmployeeById,
  createEmployee,
  updateEmployee,
  selectEmployees,
  selectCurrentEmployee,
  selectEmployeeLoading,
  clearCurrentEmployee,
} from "@/features/employee/employeeSlice";
import { fetchDepartments } from "@/features/departments/departmentSlice";
import { getAllRoles, selectRoles } from "@/features/role/roleSlice";
import {
  fetchOfficeTiming,
  selectShifts,
  selectOrganizationTimingLoading,
  selectOrganizationTimingError,
} from "@/features/organizationTiming/organizationTimingSlice";
import {
  fetchLeavePolicies,
} from "@/features/leavePolicy/leavePolicySlice";

interface Address {
  line1: string;
  line2: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

interface Document {
  type: string;
  number: string;
  verified: boolean;
  _id?: string;
}

interface SalaryComponent {
  type: string;
  label: string;
  amount: number;
  _id?: string;
}

interface PersonalInfo {
  firstName: string;
  lastName: string;
  dob: string;
  gender: "male" | "female" | "other" | "";
  maritalStatus: "single" | "married" | "divorced" | "";
  phone: string;
  email: string;
  address: Address;
}

interface EmploymentInfo {
  employeeCode: string;
  departmentId: string;
  userRoleTableId: string;
  joinDate: string;
  exitDate: string;
  status: "active" | "inactive" | "terminated";
  workLocation: string;
  workType: "Full-Time" | "Intern" | "Probation" | "Notice";
  shiftId: string;
}

interface BankInfo {
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  branch: string;
}

interface EmployeeFormData {
  personal: PersonalInfo;
  employment: EmploymentInfo;
  bank: BankInfo;
  documents: Document[];
  salary: SalaryComponent[];
  leavePolicyId: string;
}

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'view' | 'edit';
  selectedUser: any | null;
  onSave?: () => void;
}

const safeString = (value: any, fallback = "Not specified"): string => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value.toString();
  return fallback;
};

const formatDateForInput = (dateString: string | Date | undefined) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    
    // Handle the special case where date might be invalid (like "0002-10-07T00:00:00.000Z")
    if (date.getFullYear() < 1000) {
      return ""; // Return empty for obviously invalid historical dates
    }
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
};

const formatDateForDisplay = (dateString: string | Date) => {
  if (!dateString) return "Not specified";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    
    // Handle invalid historical dates
    if (date.getFullYear() < 1000) {
      return "Not specified";
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return "Invalid date";
  }
};

const capitalizeFirst = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default';
    case 'inactive': return 'secondary';
    case 'terminated': return 'destructive';
    default: return 'outline';
  }
};

const getDocumentTypeLabel = (type: string) => {
  const labels: { [key: string]: string } = {
    'aadhaar': 'Aadhaar Card',
    'pan': 'PAN Card',
    'passport': 'Passport',
    'driving_license': 'Driving License',
    'voter_id': 'Voter ID',
    'other': 'Other Document'
  };
  return labels[type] || capitalizeFirst(type);
};

const getSalaryTypeLabel = (type: string) => {
  const labels: { [key: string]: string } = {
    'basic': 'Basic Salary',
    'hra': 'House Rent Allowance',
    'allowance': 'Allowance',
    'bonus': 'Bonus',
    'deduction': 'Deduction',
    'other': 'Other'
  };
  return labels[type] || capitalizeFirst(type);
};

const transformEmployeeData = (formData: EmployeeFormData, userId: string) => {
  return {
    userId,
    personal: {
      firstName: formData.personal.firstName,
      lastName: formData.personal.lastName || undefined,
      dob: formData.personal.dob || undefined,
      gender: formData.personal.gender || undefined,
      maritalStatus: formData.personal.maritalStatus || undefined,
      phone: formData.personal.phone,
      email: formData.personal.email || undefined,
      address: {
        line1: formData.personal.address.line1 || undefined,
        line2: formData.personal.address.line2 || undefined,
        city: formData.personal.address.city || undefined,
        state: formData.personal.address.state || undefined,
        country: formData.personal.address.country || undefined,
        pincode: formData.personal.address.pincode || undefined,
      }
    },
    employment: {
      employeeCode: formData.employment.employeeCode,
      departmentId: formData.employment.departmentId,
      userRoleTableId: formData.employment.userRoleTableId,
      joinDate: formData.employment.joinDate,
      exitDate: formData.employment.exitDate || undefined,
      status: formData.employment.status,
      workLocation: formData.employment.workLocation || undefined,
      workType: formData.employment.workType,
    },
    bank: Object.keys(formData.bank).some(key => formData.bank[key as keyof BankInfo]) ? {
      accountHolderName: formData.bank.accountHolderName || undefined,
      accountNumber: formData.bank.accountNumber || undefined,
      ifsc: formData.bank.ifsc || undefined,
      bankName: formData.bank.bankName || undefined,
      branch: formData.bank.branch || undefined,
    } : undefined,
    documents: formData.documents.length > 0 ? formData.documents.map(doc => ({
      type: doc.type as "aadhaar" | "pan" | "passport" | "others",
      number: doc.number || undefined,
      verified: doc.verified,
    })) : undefined,
    salary: formData.salary.length > 0 ? formData.salary.map(sal => ({
      type: sal.type as "basic" | "hra" | "allowance" | "deduction",
      label: sal.label,
      amount: sal.amount,
    })) : undefined,
    shiftId: (formData.employment.shiftId && formData.employment.shiftId !== "no-shift") ? formData.employment.shiftId : undefined,
    leavePolicyId: formData.leavePolicyId,
  };
};

export default function EmployeeModal({
  isOpen,
  onClose,
  mode,
  selectedUser,
  onSave
}: EmployeeModalProps) {
  const dispatch = useAppDispatch();
  const { departments } = useAppSelector((state) => state.departments);
  const roles = useAppSelector(selectRoles);
  const employees = useAppSelector(selectEmployees);
  const currentEmployee = useAppSelector(selectCurrentEmployee);
  const employeeLoading = useAppSelector(selectEmployeeLoading);

  const shifts = useAppSelector(selectShifts);
  const organizationTimingLoading = useAppSelector(selectOrganizationTimingLoading);
  const organizationTimingError = useAppSelector(selectOrganizationTimingError);

  const leavePolicies = useAppSelector((state) => state.leavePolicy.policies);
  const leavePolicyLoading = useAppSelector((state) => state.leavePolicy.loading);
  const leavePolicyError = useAppSelector((state) => state.leavePolicy.error);

  const isCreatingForExistingUser = mode === 'create' && selectedUser?.isExistingUser;

  const [employeeForm, setEmployeeForm] = useState<EmployeeFormData>({
    personal: {
      firstName: "",
      lastName: "",
      dob: "",
      gender: "",
      maritalStatus: "",
      phone: "",
      email: "",
      address: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        country: "",
        pincode: ""
      }
    },
    employment: {
      employeeCode: "",
      departmentId: "",
      userRoleTableId: "",
      joinDate: "",
      exitDate: "",
      status: "active",
      workLocation: "",
      workType: "Probation",
      shiftId: "no-shift"
    },
    bank: {
      accountHolderName: "",
      accountNumber: "",
      ifsc: "",
      bankName: "",
      branch: ""
    },
    documents: [],
    salary: [],
    leavePolicyId: ""
  });

  const [employeeDocuments, setEmployeeDocuments] = useState<File[]>([]);
  const [isSubmittingEmployee, setIsSubmittingEmployee] = useState(false);

  const getEmployeeProfile = (userId: string) => {
    return employees.find((employee: any) => 
      employee.userId === userId || employee.userId?._id === userId
    );
  };

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchDepartments({}));
      dispatch(getAllRoles());
      dispatch(fetchEmployees({}));
      dispatch(fetchOfficeTiming());
      dispatch(fetchLeavePolicies());
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (isOpen && selectedUser) {
      if (mode === 'create') {
        const userData = selectedUser.user_id || selectedUser;
        const userDepartments = selectedUser.departments || [];
        const userRole = selectedUser.roleDefinitionId || {};
        
        setEmployeeForm(prev => ({
          ...prev,
          personal: {
            ...prev.personal,
            firstName: safeString(userData?.name?.split(' ')[0], ""),
            lastName: safeString(userData?.name?.split(' ').slice(1).join(' '), ""),
            phone: safeString(userData?.phoneNumber, ""),
            email: safeString(userData?.email, "")
          },
          employment: {
            ...prev.employment,
            userRoleTableId: isCreatingForExistingUser 
              ? safeString(selectedUser._id, "")
              : "",
            departmentId: userDepartments.length > 0 ? safeString(userDepartments[0]._id, "") : "",
            workType: (safeString(userRole?.roleName) === "Intern" ? "Intern" : "Probation") as "Full-Time" | "Intern" | "Probation" | "Notice",
            status: (safeString(selectedUser.status, "active")) as "active" | "inactive" | "terminated"
          }
        }));
      } else if (mode === 'view' || mode === 'edit') {
        const employeeProfile = getEmployeeProfile(selectedUser.user_id._id);
        if (employeeProfile) {
          dispatch(fetchEmployeeById(employeeProfile._id));
        }
      }
    }
  }, [isOpen, selectedUser, mode, employees, dispatch, isCreatingForExistingUser]);
useEffect(() => {
  if (currentEmployee && (mode === 'view' || mode === 'edit')) {
    // console.log('Current Employee Data:', currentEmployee); 
    
    setEmployeeForm({
      personal: {
        firstName: currentEmployee.personal?.firstName ?? "",
        lastName: currentEmployee.personal?.lastName ?? "",
        dob: formatDateForInput(currentEmployee.personal?.dob) ?? "",
        gender: (currentEmployee.personal?.gender ?? "") as "male" | "female" | "other" | "",
        maritalStatus: (currentEmployee.personal?.maritalStatus ?? "") as "single" | "married" | "divorced" | "",
        phone: currentEmployee.personal?.phone ?? "",
        email: currentEmployee.personal?.email ?? "",
        address: {
          line1: currentEmployee.personal?.address?.line1 ?? "",
          line2: currentEmployee.personal?.address?.line2 ?? "",
          city: currentEmployee.personal?.address?.city ?? "",
          state: currentEmployee.personal?.address?.state ?? "",
          country: currentEmployee.personal?.address?.country ?? "",
          pincode: currentEmployee.personal?.address?.pincode ?? ""
        }
      },
      employment: {
        employeeCode: currentEmployee.employment?.employeeCode ?? "",
        departmentId: (() => {
          const dept = currentEmployee.employment?.departmentId;
          if (!dept) return "";
          if (typeof dept === 'string') return dept;
          return (dept as any)?._id ?? "";
        })(),
        userRoleTableId: (() => {
          const role = currentEmployee.employment?.userRoleTableId;
          if (!role) return "";
          if (typeof role === 'string') return role;
          return (role as any)?._id ?? "";
        })(),
        joinDate: formatDateForInput(currentEmployee.employment?.joinDate) ?? "",
        exitDate: formatDateForInput(currentEmployee.employment?.exitDate) ?? "",
        status: (currentEmployee.employment?.status ?? "active") as "active" | "inactive" | "terminated",
        workLocation: currentEmployee.employment?.workLocation ?? "",
        workType: (currentEmployee.employment?.workType ?? "Probation") as "Full-Time" | "Intern" | "Probation" | "Notice",
        shiftId: (() => {
          const shift = currentEmployee.shiftId;
          if (!shift) return "no-shift";
          if (typeof shift === 'string') return shift;
          return (shift as any)?._id ?? "no-shift";
        })()
      },
      bank: {
        accountHolderName: currentEmployee.bank?.accountHolderName ?? "",
        accountNumber: currentEmployee.bank?.accountNumber ?? "",
        ifsc: currentEmployee.bank?.ifsc ?? "",
        bankName: currentEmployee.bank?.bankName ?? "",
        branch: currentEmployee.bank?.branch ?? ""
      },
      documents: (currentEmployee.documents || []).map((doc: any) => ({
        ...doc,
        number: doc.number ?? "",
      })),
      salary: currentEmployee.salary || [],
      leavePolicyId: (() => {
        const policy = currentEmployee.leavePolicyId;
        if (!policy) return "";
        if (typeof policy === 'string') return policy;
        return (policy as any)?._id ?? "";
      })()
    });
  }
}, [currentEmployee, mode]);
  // useEffect(() => {
  //   if (currentEmployee && (mode === 'view' || mode === 'edit')) {
  //     // console.log('Current Employee Data:', currentEmployee); 
      
  //     setEmployeeForm({
  //       personal: {
  //         firstName: currentEmployee.personal?.firstName ?? "",
  //         lastName: currentEmployee.personal?.lastName ?? "",
  //         dob: formatDateForInput(currentEmployee.personal?.dob) ?? "",
  //         gender: (currentEmployee.personal?.gender ?? "") as "male" | "female" | "other" | "",
  //         maritalStatus: (currentEmployee.personal?.maritalStatus ?? "") as "single" | "married" | "divorced" | "",
  //         phone: currentEmployee.personal?.phone ?? "",
  //         email: currentEmployee.personal?.email ?? "",
  //         address: {
  //           line1: currentEmployee.personal?.address?.line1 ?? "",
  //           line2: currentEmployee.personal?.address?.line2 ?? "",
  //           city: currentEmployee.personal?.address?.city ?? "",
  //           state: currentEmployee.personal?.address?.state ?? "",
  //           country: currentEmployee.personal?.address?.country ?? "",
  //           pincode: currentEmployee.personal?.address?.pincode ?? ""
  //         }
  //       },
  //       employment: {
  //         employeeCode: currentEmployee.employment?.employeeCode ?? "",
  //         departmentId: typeof currentEmployee.employment?.departmentId === 'string' 
  //           ? currentEmployee.employment.departmentId 
  //           : currentEmployee.employment?.departmentId?._id ?? "",
  //         userRoleTableId: typeof currentEmployee.employment?.userRoleTableId === 'string'
  //           ? currentEmployee.employment.userRoleTableId
  //           : currentEmployee.employment?.userRoleTableId?._id ?? "",
  //         joinDate: formatDateForInput(currentEmployee.employment?.joinDate) ?? "",
  //         exitDate: formatDateForInput(currentEmployee.employment?.exitDate) ?? "",
  //         status: (currentEmployee.employment?.status ?? "active") as "active" | "inactive" | "terminated",
  //         workLocation: currentEmployee.employment?.workLocation ?? "",
  //         workType: (currentEmployee.employment?.workType ?? "Probation") as "Full-Time" | "Intern" | "Probation" | "Notice",
  //         shiftId: typeof currentEmployee.shiftId === 'string' 
  //           ? (currentEmployee.shiftId || "no-shift") 
  //           : (currentEmployee.shiftId?._id || "no-shift")
  //       },
  //       bank: {
  //         accountHolderName: currentEmployee.bank?.accountHolderName ?? "",
  //         accountNumber: currentEmployee.bank?.accountNumber ?? "",
  //         ifsc: currentEmployee.bank?.ifsc ?? "",
  //         bankName: currentEmployee.bank?.bankName ?? "",
  //         branch: currentEmployee.bank?.branch ?? ""
  //       },
  //       documents: (currentEmployee.documents || []).map((doc: any) => ({
  //         ...doc,
  //         number: doc.number ?? "",
  //       })),
  //       salary: currentEmployee.salary || [],
  //       leavePolicyId: typeof currentEmployee.leavePolicyId === 'string' 
  //         ? (currentEmployee.leavePolicyId || "") 
  //         : (currentEmployee.leavePolicyId?._id || "")
  //     });
  //   }
  // }, [currentEmployee, mode]);

  const handleEmployeeFormChange = (section: string, field: string, value: any) => {
    setEmployeeForm(prev => ({
      ...prev,
      [section]: {
        ...((prev[section as keyof EmployeeFormData] || {}) as object),
        [field]: value
      }
    }));
  };

  const handleNestedFormChange = (section: string, subsection: string, field: string, value: any) => {
    setEmployeeForm(prev => ({
      ...prev,
      [section]: {
         ...((prev[section as keyof EmployeeFormData] || {}) as object),
        [subsection]: {
          ...(prev[section as keyof EmployeeFormData] as any)[subsection],
          [field]: value
        }
      }
    }));
  };

  const handleDocumentChange = (index: number, field: string, value: any) => {
    setEmployeeForm(prev => ({
      ...prev,
      documents: prev.documents.map((doc, i) => 
        i === index ? { ...doc, [field]: value } : doc
      )
    }));
  };

  const handleDocumentFileChange = (index: number, file: File) => {
    setEmployeeDocuments(prev => {
      const newDocs = [...prev];
      newDocs[index] = file;
      return newDocs;
    });
  };

  const handleSalaryChange = (index: number, field: string, value: any) => {
    setEmployeeForm(prev => ({
      ...prev,
      salary: prev.salary.map((salary, i) => 
        i === index ? { ...salary, [field]: value } : salary
      )
    }));
  };

  const addDocument = () => {
    setEmployeeForm(prev => ({
      ...prev,
      documents: [...prev.documents, { type: "aadhaar", number: "", verified: false }]
    }));
  };

  const removeDocument = (index: number) => {
    setEmployeeForm(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const addSalaryComponent = () => {
    setEmployeeForm(prev => ({
      ...prev,
      salary: [...prev.salary, { type: "basic", label: "", amount: 0 }]
    }));
  };

  const removeSalaryComponent = (index: number) => {
    setEmployeeForm(prev => ({
      ...prev,
      salary: prev.salary.filter((_, i) => i !== index)
    }));
  };

  const handleSubmitEmployee = async () => {
    if (!selectedUser?.user_id?._id) return;

    if (!employeeForm.personal.firstName) {
      toast.error("First name is required");
      return;
    }
    if (!employeeForm.employment.employeeCode) {
      toast.error("Employee code is required");
      return;
    }
    if (!employeeForm.employment.departmentId) {
      toast.error("Department is required");
      return;
    }
    if (!employeeForm.employment.userRoleTableId && !isCreatingForExistingUser) {
      toast.error("Role is required");
      return;
    }
    if (!employeeForm.employment.joinDate) {
      toast.error("Join date is required");
      return;
    }
    if (!employeeForm.leavePolicyId) {
      toast.error("Leave policy is required");
      return;
    }

    setIsSubmittingEmployee(true);

    try {
      let transformedData = transformEmployeeData(employeeForm, selectedUser.user_id._id);
      
      if (isCreatingForExistingUser) {
        transformedData = {
          ...transformedData,
          employment: {
            ...transformedData.employment,
            userRoleTableId: safeString(selectedUser._id, ""),
          }
        };
      }

      const formData = new FormData();
      employeeDocuments.forEach((file, index) => {
        formData.append(`documents[${index}][proof]`, file);
      });

      if (mode === 'create') {
        await dispatch(createEmployee({ employeeData: transformedData, files: formData })).unwrap();
        toast.success("Employee profile created successfully!");
      } else if (mode === 'edit') {
        const employeeProfile = getEmployeeProfile(selectedUser.user_id._id);
        if (employeeProfile) {
          await dispatch(updateEmployee({ 
            employeeId: employeeProfile._id, 
            employeeData: transformedData, 
            files: formData 
          })).unwrap();
          toast.success("Employee profile updated successfully!");
        }
      }

      dispatch(fetchEmployees({}));
      onSave?.();
      handleClose();
    } catch (error: any) {
      toast.error(error || `Failed to ${mode} employee profile`);
    } finally {
      setIsSubmittingEmployee(false);
    }
  };

  const handleClose = () => {
    setEmployeeForm({
      personal: {
        firstName: "",
        lastName: "",
        dob: "",
        gender: "",
        maritalStatus: "",
        phone: "",
        email: "",
        address: {
          line1: "",
          line2: "",
          city: "",
          state: "",
          country: "",
          pincode: ""
        }
      },
      employment: {
        employeeCode: "",
        departmentId: "",
        userRoleTableId: "",
        joinDate: "",
        exitDate: "",
        status: "active",
        workLocation: "",
        workType: "Probation",
        shiftId: "no-shift"
      },
      bank: {
        accountHolderName: "",
        accountNumber: "",
        ifsc: "",
        bankName: "",
        branch: ""
      },
      documents: [],
      salary: [],
      leavePolicyId: ""
    });
    setEmployeeDocuments([]);
    dispatch(clearCurrentEmployee());
    onClose();
  };

  const getDepartmentName = (departmentId: string) => {
    const department = departments.find((dept: any) => dept._id === departmentId);
    return department ? `${safeString(department.name)} (${safeString(department.alias)})` : "Not specified";
  };

  const getRoleName = (roleId: string) => {
    const role = roles.find((r: any) => r._id === roleId);
    return role ? safeString(role.roleName) : "Not specified";
  };

  const getLeavePolicyName = (policyId: string) => {
    const policy = leavePolicies.find((p: any) => p._id === policyId);
    return policy ? safeString(policy.name) : "Not specified";
  };

  const getFullAddress = (address: Address) => {
    const parts = [
      address.line1,
      address.line2,
      address.city,
      address.state,
      address.country,
      address.pincode
    ].filter(part => part && part.trim() !== "");
    
    return parts.length > 0 ? parts.join(', ') : "Not specified";
  };

  const isViewMode = mode === 'view';
  
  const getUserName = () => {
    return safeString(selectedUser?.user_id?.name || selectedUser?.name, 'User');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {mode === 'create' && 'Create Employee Profile'}
            {mode === 'view' && 'Employee Details'}
            {mode === 'edit' && 'Edit Employee Profile'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' && `Create employee profile for ${getUserName()}`}
            {mode === 'view' && `Viewing employee details for ${getUserName()}`}
            {mode === 'edit' && `Edit employee profile for ${getUserName()}`}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Personal
              </TabsTrigger>
              <TabsTrigger value="employment" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Employment
              </TabsTrigger>
              <TabsTrigger value="bank" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Bank
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="salary" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Salary
              </TabsTrigger>
            </TabsList>

            {/* Personal Tab */}
            <TabsContent value="personal" className="space-y-6">
              {isViewMode ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                      <div className="p-3 bg-muted rounded-md">
                        {safeString(employeeForm.personal.firstName)} {safeString(employeeForm.personal.lastName)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Contact Info</Label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <Phone className="h-4 w-4" />
                          {safeString(employeeForm.personal.phone)}
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                          <Mail className="h-4 w-4" />
                          {safeString(employeeForm.personal.email)}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                        <Calendar className="h-4 w-4" />
                        {formatDateForDisplay(employeeForm.personal.dob)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Gender & Marital Status</Label>
                      <div className="space-y-2">
                        <div className="p-2 bg-muted rounded-md">
                          {capitalizeFirst(safeString(employeeForm.personal.gender))}
                        </div>
                        <div className="p-2 bg-muted rounded-md">
                          {capitalizeFirst(safeString(employeeForm.personal.maritalStatus))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </Label>
                    <div className="p-4 bg-muted rounded-md">
                      {getFullAddress(employeeForm.personal.address)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
                      <Input
                        id="firstName"
                        value={employeeForm.personal.firstName}
                        onChange={(e) => handleEmployeeFormChange("personal", "firstName", e.target.value)}
                        placeholder="Enter first name"
                        disabled={isViewMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={employeeForm.personal.lastName}
                        onChange={(e) => handleEmployeeFormChange("personal", "lastName", e.target.value)}
                        placeholder="Enter last name"
                        disabled={isViewMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
                      <Input
                        id="phone"
                        value={employeeForm.personal.phone}
                        onChange={(e) => handleEmployeeFormChange("personal", "phone", e.target.value)}
                        placeholder="Enter phone number"
                        disabled={true}
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={employeeForm.personal.email}
                        onChange={(e) => handleEmployeeFormChange("personal", "email", e.target.value)}
                        placeholder="Enter email address"
                        disabled={true}
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth</Label>
                      <Input
                        id="dob"
                        type="date"
                        value={employeeForm.personal.dob}
                        onChange={(e) => handleEmployeeFormChange("personal", "dob", e.target.value)}
                        disabled={isViewMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select
                        value={employeeForm.personal.gender}
                        onValueChange={(value) => handleEmployeeFormChange("personal", "gender", value)}
                        disabled={isViewMode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maritalStatus">Marital Status</Label>
                      <Select
                        value={employeeForm.personal.maritalStatus}
                        onValueChange={(value) => handleEmployeeFormChange("personal", "maritalStatus", value)}
                        disabled={isViewMode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select marital status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-medium">Address</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="line1">Address Line 1</Label>
                        <Input
                          id="line1"
                          value={employeeForm.personal.address.line1}
                          onChange={(e) => handleNestedFormChange("personal", "address", "line1", e.target.value)}
                          placeholder="Enter address line 1"
                          disabled={isViewMode}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="line2">Address Line 2</Label>
                        <Input
                          id="line2"
                          value={employeeForm.personal.address.line2}
                          onChange={(e) => handleNestedFormChange("personal", "address", "line2", e.target.value)}
                          placeholder="Enter address line 2"
                          disabled={isViewMode}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={employeeForm.personal.address.city}
                          onChange={(e) => handleNestedFormChange("personal", "address", "city", e.target.value)}
                          placeholder="Enter city"
                          disabled={isViewMode}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={employeeForm.personal.address.state}
                          onChange={(e) => handleNestedFormChange("personal", "address", "state", e.target.value)}
                          placeholder="Enter state"
                          disabled={isViewMode}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={employeeForm.personal.address.country}
                          onChange={(e) => handleNestedFormChange("personal", "address", "country", e.target.value)}
                          placeholder="Enter country"
                          disabled={isViewMode}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="pincode">Pincode</Label>
                        <Input
                          id="pincode"
                          value={employeeForm.personal.address.pincode}
                          onChange={(e) => handleNestedFormChange("personal", "address", "pincode", e.target.value)}
                          placeholder="Enter pincode"
                          disabled={isViewMode}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Employment Tab */}
            <TabsContent value="employment" className="space-y-6">
              {isViewMode ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Employee Code</Label>
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                        <BadgeIcon className="h-4 w-4" />
                        {safeString(employeeForm.employment.employeeCode, "Not assigned")}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <Badge variant={getStatusVariant(employeeForm.employment.status)}>
                        {capitalizeFirst(safeString(employeeForm.employment.status))}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                        <Building className="h-4 w-4" />
                        {getDepartmentName(employeeForm.employment.departmentId)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Role Name</Label>
                      <div className="p-3 bg-muted rounded-md">
                        {safeString(selectedUser?.roleDefinitionId?.roleName)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Join Date</Label>
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                        <Calendar className="h-4 w-4" />
                        {formatDateForDisplay(employeeForm.employment.joinDate)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Work Type</Label>
                      <div className="p-3 bg-muted rounded-md">
                        {safeString(employeeForm.employment.workType)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Leave Policy</Label>
                      <div className="p-3 bg-muted rounded-md">
                        {getLeavePolicyName(employeeForm.leavePolicyId)}
                      </div>
                    </div>
                    {employeeForm.employment.exitDate && (
                      <div className="space-y-2 col-span-2">
                        <Label className="text-sm font-medium text-muted-foreground">Exit Date</Label>
                        <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                          <Calendar className="h-4 w-4" />
                          {formatDateForDisplay(employeeForm.employment.exitDate)}
                        </div>
                      </div>
                    )}
                    <div className="space-y-2 col-span-2">
                      <Label className="text-sm font-medium text-muted-foreground">Work Location</Label>
                      <div className="p-3 bg-muted rounded-md">
                        {safeString(employeeForm.employment.workLocation)}
                      </div>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label className="text-sm font-medium text-muted-foreground">Work Shift</Label>
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                        <Clock className="h-4 w-4" />
                        {(() => {
                          if (!employeeForm.employment.shiftId || employeeForm.employment.shiftId === "no-shift") {
                            return "No shift assigned";
                          }
                          const shift = shifts.find(s => s._id === employeeForm.employment.shiftId);
                          return shift 
                            ? `${shift.name} (${shift.startTime} - ${shift.endTime})`
                            : "Shift not found";
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employeeCode">Employee Code <span className="text-destructive">*</span></Label>
                      <Input
                        id="employeeCode"
                        value={employeeForm.employment.employeeCode}
                        onChange={(e) => handleEmployeeFormChange("employment", "employeeCode", e.target.value)}
                        placeholder="Enter employee code"
                        disabled={isViewMode}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="departmentId">Department <span className="text-destructive">*</span></Label>
                      <Select
                        value={employeeForm.employment.departmentId}
                        onValueChange={(value) => handleEmployeeFormChange("employment", "departmentId", value)}
                        disabled={isViewMode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept: any) => (
                            <SelectItem key={dept._id} value={dept._id}>
                              {safeString(dept.name)} ({safeString(dept.alias)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {isCreatingForExistingUser ? (
                      <div className="space-y-2 col-span-2">
                        <Label>User Role Information</Label>
                        <div className="p-3 bg-muted rounded-md border space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-sm">
                              {safeString(selectedUser?.roleDefinitionId?.roleName, 'Unknown Role')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Hierarchy Level: {safeString(selectedUser?.roleDefinitionId?.hierarchyLevel, 'N/A')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            <strong>Department:</strong> {safeString(selectedUser?.departments?.[0]?.name, 'Not specified')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Role and permissions are inherited from the user's role assignment record.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="userRoleTableId">Role <span className="text-destructive">*</span></Label>
                        <Select
                          value={employeeForm.employment.userRoleTableId}
                          onValueChange={(value) => handleEmployeeFormChange("employment", "userRoleTableId", value)}
                          disabled={isViewMode}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role: any) => (
                              <SelectItem key={role._id} value={role._id}>
                                {safeString(role.roleName, 'Unknown Role')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="joinDate">Join Date <span className="text-destructive">*</span></Label>
                      <Input
                        id="joinDate"
                        type="date"
                        value={employeeForm.employment.joinDate}
                        onChange={(e) => handleEmployeeFormChange("employment", "joinDate", e.target.value)}
                        disabled={isViewMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={employeeForm.employment.status}
                        onValueChange={(value) => handleEmployeeFormChange("employment", "status", value)}
                        disabled={isViewMode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="terminated">Terminated</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workType">Work Type</Label>
                      <Select
                        value={employeeForm.employment.workType}
                        onValueChange={(value) => handleEmployeeFormChange("employment", "workType", value)}
                        disabled={isViewMode}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select work type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full-Time">Full-Time</SelectItem>
                          <SelectItem value="Intern">Intern</SelectItem>
                          <SelectItem value="Probation">Probation</SelectItem>
                          <SelectItem value="Notice">Notice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workLocation">Work Location</Label>
                      <Input
                        id="workLocation"
                        value={employeeForm.employment.workLocation}
                        onChange={(e) => handleEmployeeFormChange("employment", "workLocation", e.target.value)}
                        placeholder="Enter work location"
                        disabled={isViewMode}
                      />
                    </div>
                    
                    {/* Shift Selection Field */}
                    <div className="space-y-2">
                      <Label htmlFor="shiftId">Work Shift</Label>
                      <Select
                        value={employeeForm.employment.shiftId}
                        onValueChange={(value) => handleEmployeeFormChange("employment", "shiftId", value)}
                        disabled={isViewMode || organizationTimingLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={organizationTimingLoading ? "Loading shifts..." : "Select work shift"} />
                        </SelectTrigger>
                        <SelectContent>
                          {organizationTimingLoading ? (
                            <SelectItem value="loading" disabled>
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading shifts...
                              </div>
                            </SelectItem>
                          ) : shifts.length === 0 ? (
                            <SelectItem value="no-shifts" disabled>
                              No shifts configured
                            </SelectItem>
                          ) : (
                            <>
                              <SelectItem value="no-shift">No shift assigned</SelectItem>
                              {shifts.map((shift) => (
                                <SelectItem key={shift._id} value={shift._id || 'unknown-shift'}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{shift.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {shift.startTime} - {shift.endTime}
                                      {shift.breaks.length > 0 && ` • ${shift.breaks.length} break(s)`}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      
                      {employeeForm.employment.shiftId && employeeForm.employment.shiftId !== "no-shift" && (
                        <div className="text-xs text-muted-foreground bg-muted p-3 rounded border">
                          {(() => {
                            const selectedShift = shifts.find(s => s._id === employeeForm.employment.shiftId);
                            if (!selectedShift) return null;
                            
                            return (
                              <div className="space-y-1">
                                <div className="font-medium flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  {selectedShift.name}
                                </div>
                                <div>Working Hours: {selectedShift.startTime} - {selectedShift.endTime}</div>
                                {selectedShift.breaks.length > 0 && (
                                  <div>
                                    <div className="font-medium mt-2">Breaks:</div>
                                    {selectedShift.breaks.map((breakTime, idx) => (
                                      <div key={idx} className="ml-2">
                                        • {breakTime.name}: {breakTime.startTime} - {breakTime.endTime}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                      
                      {organizationTimingError && (
                        <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                          Error loading shifts: {organizationTimingError}
                        </div>
                      )}
                    </div>

                    {/* Leave Policy Selection Field */}
                    <div className="space-y-2">
                      <Label htmlFor="leavePolicyId">Leave Policy <span className="text-destructive">*</span></Label>
                      <Select 
                        value={employeeForm.leavePolicyId} 
                        onValueChange={(value) => setEmployeeForm(prev => ({...prev, leavePolicyId: value}))}
                        disabled={isViewMode || leavePolicyLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={leavePolicyLoading ? "Loading policies..." : "Select leave policy"} />
                        </SelectTrigger>
                        <SelectContent>
                          {leavePolicyLoading ? (
                            <SelectItem value="loading" disabled>
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading policies...
                              </div>
                            </SelectItem>
                          ) : leavePolicies.length === 0 ? (
                            <SelectItem value="no-policies" disabled>No leave policies configured</SelectItem>
                          ) : (
                            leavePolicies.map((policy: any) => (
                              <SelectItem key={policy._id} value={policy._id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{policy.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {policy.description || 'No description'}
                                  </span>
                                </div>
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {leavePolicyError && (
                        <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                          Error loading policies: {leavePolicyError}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="exitDate">Exit Date</Label>
                      <Input
                        id="exitDate"
                        type="date"
                        value={employeeForm.employment.exitDate}
                        onChange={(e) => handleEmployeeFormChange("employment", "exitDate", e.target.value)}
                        disabled={isViewMode}
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Bank Tab */}
            <TabsContent value="bank" className="space-y-6">
              {isViewMode ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Account Holder</Label>
                      <div className="p-3 bg-muted rounded-md">
                        {safeString(employeeForm.bank.accountHolderName)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Account Number</Label>
                      <div className="p-3 bg-muted rounded-md font-mono">
                        {employeeForm.bank.accountNumber ? 
                         `****${employeeForm.bank.accountNumber.slice(-4)}` : "Not specified"}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">IFSC Code</Label>
                      <div className="p-3 bg-muted rounded-md font-mono">
                        {safeString(employeeForm.bank.ifsc)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Bank Name</Label>
                      <div className="p-3 bg-muted rounded-md">
                        {safeString(employeeForm.bank.bankName)}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Branch</Label>
                      <div className="p-3 bg-muted rounded-md">
                        {safeString(employeeForm.bank.branch)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accountHolderName">Account Holder Name</Label>
                      <Input
                        id="accountHolderName"
                        value={employeeForm.bank.accountHolderName}
                        onChange={(e) => handleEmployeeFormChange("bank", "accountHolderName", e.target.value)}
                        placeholder="Enter account holder name"
                        disabled={isViewMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        value={employeeForm.bank.accountNumber}
                        onChange={(e) => handleEmployeeFormChange("bank", "accountNumber", e.target.value)}
                        placeholder="Enter account number"
                        disabled={isViewMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ifsc">IFSC Code</Label>
                      <Input
                        id="ifsc"
                        value={employeeForm.bank.ifsc}
                        onChange={(e) => handleEmployeeFormChange("bank", "ifsc", e.target.value)}
                        placeholder="Enter IFSC code"
                        disabled={isViewMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        value={employeeForm.bank.bankName}
                        onChange={(e) => handleEmployeeFormChange("bank", "bankName", e.target.value)}
                        placeholder="Enter bank name"
                        disabled={isViewMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch</Label>
                      <Input
                        id="branch"
                        value={employeeForm.bank.branch}
                        onChange={(e) => handleEmployeeFormChange("bank", "branch", e.target.value)}
                        placeholder="Enter branch name"
                        disabled={isViewMode}
                      />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              {isViewMode ? (
                <div className="space-y-6">
                  {employeeForm.documents.length > 0 ? (
                    <div className="grid gap-4">
                      {employeeForm.documents.map((doc, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              {getDocumentTypeLabel(doc.type)}
                            </h4>
                            <Badge variant={doc.verified ? "default" : "secondary"}>
                              {doc.verified ? "Verified" : "Not Verified"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm text-muted-foreground">Document Number</Label>
                              <div className="p-2 bg-muted rounded-md font-mono">
                                {safeString(doc.number)}
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Status</Label>
                              <div className="p-2 bg-muted rounded-md">
                                {doc.verified ? "Verified" : "Pending Verification"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No documents added yet.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium">Documents</Label>
                    {!isViewMode && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addDocument}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Document
                      </Button>
                    )}
                  </div>

                  {employeeForm.documents.map((doc, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium">Document {index + 1}</h4>
                        {!isViewMode && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeDocument(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`docType-${index}`}>Document Type</Label>
                          <Select
                            value={doc.type}
                            onValueChange={(value) => handleDocumentChange(index, "type", value)}
                            disabled={isViewMode}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
                              <SelectItem value="pan">PAN Card</SelectItem>
                              <SelectItem value="passport">Passport</SelectItem>
                              <SelectItem value="others">Others</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`docNumber-${index}`}>Document Number</Label>
                          <Input
                            id={`docNumber-${index}`}
                            value={doc.number}
                            onChange={(e) => handleDocumentChange(index, "number", e.target.value)}
                            placeholder="Enter document number"
                            disabled={isViewMode}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Verified</Label>
                          <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                              id={`verified-${index}`}
                              checked={doc.verified}
                              onCheckedChange={(checked) => handleDocumentChange(index, "verified", checked)}
                              disabled={isViewMode}
                            />
                            <label htmlFor={`verified-${index}`} className="text-sm">
                              Document verified
                            </label>
                          </div>
                        </div>
                      </div>
                      
                      {!isViewMode && (
                        <div className="space-y-2">
                          <Label htmlFor={`docFile-${index}`}>Document File</Label>
                          <Input
                            id={`docFile-${index}`}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleDocumentFileChange(index, file);
                              }
                            }}
                            disabled={isViewMode}
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {employeeForm.documents.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      No documents added yet.
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Salary Tab */}
            <TabsContent value="salary" className="space-y-6">
              {isViewMode ? (
                <div className="space-y-6">
                  {employeeForm.salary.length > 0 ? (
                    <div className="grid gap-4">
                      {employeeForm.salary.map((salary, index) => (
                        <div key={index} className="border rounded-lg p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <DollarSign className="h-4 w-4" />
                              {safeString(salary.label) || getSalaryTypeLabel(salary.type)}
                            </h4>
                            <Badge variant="outline">
                              {getSalaryTypeLabel(salary.type)}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm text-muted-foreground">Amount</Label>
                              <div className="p-2 bg-muted rounded-md font-mono">
                                ₹{(salary.amount || 0).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <Label className="text-sm text-muted-foreground">Type</Label>
                              <div className="p-2 bg-muted rounded-md">
                                {getSalaryTypeLabel(salary.type)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-4 mt-4">
                        <div className="flex justify-between items-center font-medium">
                          <span>Total Monthly Salary:</span>
                          <span className="text-lg">
                            ₹{employeeForm.salary.reduce((sum, comp) => sum + (comp.amount || 0), 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No salary components added yet.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-sm font-medium">Salary Components</Label>
                    {!isViewMode && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSalaryComponent}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Salary Component
                      </Button>
                    )}
                  </div>

                  {employeeForm.salary.map((salary, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-sm font-medium">Salary Component {index + 1}</h4>
                        {!isViewMode && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => removeSalaryComponent(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`salaryType-${index}`}>Component Type</Label>
                          <Select
                            value={salary.type}
                            onValueChange={(value) => handleSalaryChange(index, "type", value)}
                            disabled={isViewMode}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="basic">Basic Salary</SelectItem>
                              <SelectItem value="hra">HRA</SelectItem>
                              <SelectItem value="allowance">Allowance</SelectItem>
                              <SelectItem value="deduction">Deduction</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`salaryLabel-${index}`}>Component Label</Label>
                          <Input
                            id={`salaryLabel-${index}`}
                            value={salary.label}
                            onChange={(e) => handleSalaryChange(index, "label", e.target.value)}
                            placeholder="Enter component label"
                            disabled={isViewMode}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`salaryAmount-${index}`}>Amount</Label>
                          <Input
                            id={`salaryAmount-${index}`}
                            type="number"
                            value={salary.amount}
                            onChange={(e) => handleSalaryChange(index, "amount", parseFloat(e.target.value) || 0)}
                            placeholder="Enter amount"
                            disabled={isViewMode}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {employeeForm.salary.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      No salary components added yet.
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleClose}>
            {isViewMode ? 'Close' : 'Cancel'}
          </Button>
          {!isViewMode && (
            <Button 
              onClick={handleSubmitEmployee} 
              disabled={isSubmittingEmployee || employeeLoading}
            >
              {isSubmittingEmployee && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'Create Employee' : 'Update Employee'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
// "use client";

// import { useState, useEffect } from "react";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   Calendar,
//   Phone,
//   Mail,
//   MapPin,
//   Briefcase,
//   CreditCard,
//   Eye,
//   Edit,
//   Plus,
//   X,
//   Loader2,
//   User,
//   Building,
//   Badge as BadgeIcon,
//   FileText,
//   DollarSign,
//   Clock,
// } from "lucide-react";
// import { Badge } from "@/components/ui/badge";
// import { toast } from "sonner";
// import { useAppDispatch, useAppSelector } from "@/store/hooks";
// import {
//   fetchEmployees,
//   fetchEmployeeById,
//   createEmployee,
//   updateEmployee,
//   selectEmployees,
//   selectCurrentEmployee,
//   selectEmployeeLoading,
//   clearCurrentEmployee,
// } from "@/features/employee/employeeSlice";
// import { fetchDepartments } from "@/features/departments/departmentSlice";
// import { getAllRoles, selectRoles } from "@/features/role/roleSlice";
// import {
//   fetchOfficeTiming,
//   selectShifts,
//   selectOrganizationTimingLoading,
//   selectOrganizationTimingError,
// } from "@/features/organizationTiming/organizationTimingSlice";
// import {
//   fetchLeavePolicies,
// } from "@/features/leavePolicy/leavePolicySlice";

// interface Address {
//   line1: string;
//   line2: string;
//   city: string;
//   state: string;
//   country: string;
//   pincode: string;
// }

// interface Document {
//   type: string;
//   number: string;
//   verified: boolean;
//   _id?: string;
// }

// interface SalaryComponent {
//   type: string;
//   label: string;
//   amount: number;
//   _id?: string;
// }

// interface PersonalInfo {
//   firstName: string;
//   lastName: string;
//   dob: string;
//   gender: "male" | "female" | "other" | "";
//   maritalStatus: "single" | "married" | "divorced" | "";
//   phone: string;
//   email: string;
//   address: Address;
// }

// interface EmploymentInfo {
//   employeeCode: string;
//   departmentId: string;
//   userRoleTableId: string;
//   joinDate: string;
//   exitDate: string;
//   status: "active" | "inactive" | "terminated";
//   workLocation: string;
//   workType: "Full-Time" | "Intern" | "Probation" | "Notice";
//   shiftId: string;
// }

// interface BankInfo {
//   accountHolderName: string;
//   accountNumber: string;
//   ifsc: string;
//   bankName: string;
//   branch: string;
// }

// interface EmployeeFormData {
//   personal: PersonalInfo;
//   employment: EmploymentInfo;
//   bank: BankInfo;
//   documents: Document[];
//   salary: SalaryComponent[];
//   leavePolicyId: string;
// }

// interface EmployeeModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   mode: 'create' | 'view' | 'edit';
//   selectedUser: any | null;
//   onSave?: () => void;
// }

// const safeString = (value: any, fallback = "Not specified"): string => {
//   if (value === null || value === undefined) return fallback;
//   if (typeof value === 'string') return value;
//   if (typeof value === 'number') return value.toString();
//   if (typeof value === 'boolean') return value.toString();
//   return fallback;
// };

// const formatDate = (dateString: string | Date) => {
//   if (!dateString) return "Not specified";
//   try {
//     return new Date(dateString).toLocaleDateString('en-US', {
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric'
//     });
//   } catch {
//     return "Invalid date";
//   }
// };

// const capitalizeFirst = (str: string) => {
//   if (!str) return "";
//   return str.charAt(0).toUpperCase() + str.slice(1);
// };

// const getStatusVariant = (status: string) => {
//   switch (status) {
//     case 'active': return 'default';
//     case 'inactive': return 'secondary';
//     case 'terminated': return 'destructive';
//     default: return 'outline';
//   }
// };

// const getDocumentTypeLabel = (type: string) => {
//   const labels: { [key: string]: string } = {
//     'aadhaar': 'Aadhaar Card',
//     'pan': 'PAN Card',
//     'passport': 'Passport',
//     'driving_license': 'Driving License',
//     'voter_id': 'Voter ID',
//     'other': 'Other Document'
//   };
//   return labels[type] || capitalizeFirst(type);
// };

// const getSalaryTypeLabel = (type: string) => {
//   const labels: { [key: string]: string } = {
//     'basic': 'Basic Salary',
//     'hra': 'House Rent Allowance',
//     'allowance': 'Allowance',
//     'bonus': 'Bonus',
//     'deduction': 'Deduction',
//     'other': 'Other'
//   };
//   return labels[type] || capitalizeFirst(type);
// };

// const transformEmployeeData = (formData: EmployeeFormData, userId: string) => {
//   return {
//     userId,
//     personal: {
//       firstName: formData.personal.firstName,
//       lastName: formData.personal.lastName || undefined,
//       dob: formData.personal.dob || undefined,
//       gender: formData.personal.gender || undefined,
//       maritalStatus: formData.personal.maritalStatus || undefined,
//       phone: formData.personal.phone,
//       email: formData.personal.email || undefined,
//       address: {
//         line1: formData.personal.address.line1 || undefined,
//         line2: formData.personal.address.line2 || undefined,
//         city: formData.personal.address.city || undefined,
//         state: formData.personal.address.state || undefined,
//         country: formData.personal.address.country || undefined,
//         pincode: formData.personal.address.pincode || undefined,
//       }
//     },
//     employment: {
//       employeeCode: formData.employment.employeeCode,
//       departmentId: formData.employment.departmentId,
//       userRoleTableId: formData.employment.userRoleTableId,
//       joinDate: formData.employment.joinDate,
//       exitDate: formData.employment.exitDate || undefined,
//       status: formData.employment.status,
//       workLocation: formData.employment.workLocation || undefined,
//       workType: formData.employment.workType,
//     },
//     bank: Object.keys(formData.bank).some(key => formData.bank[key as keyof BankInfo]) ? {
//       accountHolderName: formData.bank.accountHolderName || undefined,
//       accountNumber: formData.bank.accountNumber || undefined,
//       ifsc: formData.bank.ifsc || undefined,
//       bankName: formData.bank.bankName || undefined,
//       branch: formData.bank.branch || undefined,
//     } : undefined,
//     documents: formData.documents.length > 0 ? formData.documents.map(doc => ({
//       type: doc.type as "aadhaar" | "pan" | "passport" | "others",
//       number: doc.number || undefined,
//       verified: doc.verified,
//     })) : undefined,
//     salary: formData.salary.length > 0 ? formData.salary.map(sal => ({
//       type: sal.type as "basic" | "hra" | "allowance" | "deduction",
//       label: sal.label,
//       amount: sal.amount,
//     })) : undefined,
//     shiftId: (formData.employment.shiftId && formData.employment.shiftId !== "no-shift") ? formData.employment.shiftId : undefined,
//     leavePolicyId: formData.leavePolicyId,
//   };
// };

// export default function EmployeeModal({
//   isOpen,
//   onClose,
//   mode,
//   selectedUser,
//   onSave
// }: EmployeeModalProps) {
//   const dispatch = useAppDispatch();
//   const { departments } = useAppSelector((state) => state.departments);
//   const roles = useAppSelector(selectRoles);
//   const employees = useAppSelector(selectEmployees);
//   const currentEmployee = useAppSelector(selectCurrentEmployee);
//   const employeeLoading = useAppSelector(selectEmployeeLoading);

//   const shifts = useAppSelector(selectShifts);
//   const organizationTimingLoading = useAppSelector(selectOrganizationTimingLoading);
//   const organizationTimingError = useAppSelector(selectOrganizationTimingError);

//   const leavePolicies = useAppSelector((state) => state.leavePolicy.policies);
//   const leavePolicyLoading = useAppSelector((state) => state.leavePolicy.loading);
//   const leavePolicyError = useAppSelector((state) => state.leavePolicy.error);

//   const isCreatingForExistingUser = mode === 'create' && selectedUser?.isExistingUser;

//   const [employeeForm, setEmployeeForm] = useState<EmployeeFormData>({
//     personal: {
//       firstName: "",
//       lastName: "",
//       dob: "",
//       gender: "",
//       maritalStatus: "",
//       phone: "",
//       email: "",
//       address: {
//         line1: "",
//         line2: "",
//         city: "",
//         state: "",
//         country: "",
//         pincode: ""
//       }
//     },
//     employment: {
//       employeeCode: "",
//       departmentId: "",
//       userRoleTableId: "",
//       joinDate: "",
//       exitDate: "",
//       status: "active",
//       workLocation: "",
//       workType: "Probation",
//       shiftId: "no-shift"
//     },
//     bank: {
//       accountHolderName: "",
//       accountNumber: "",
//       ifsc: "",
//       bankName: "",
//       branch: ""
//     },
//     documents: [],
//     salary: [],
//     leavePolicyId: ""
//   });

//   const [employeeDocuments, setEmployeeDocuments] = useState<File[]>([]);
//   const [isSubmittingEmployee, setIsSubmittingEmployee] = useState(false);

//   const getEmployeeProfile = (userId: string) => {
//     return employees.find((employee: any) => 
//       employee.userId === userId || employee.userId?._id === userId
//     );
//   };

//   useEffect(() => {
//     if (isOpen) {
//       dispatch(fetchDepartments({}));
//       dispatch(getAllRoles());
//       dispatch(fetchEmployees({}));
//       dispatch(fetchOfficeTiming());
//       dispatch(fetchLeavePolicies());
//     }
//   }, [isOpen, dispatch]);

//   useEffect(() => {
//     if (isOpen && selectedUser) {
//       if (mode === 'create') {
//         const userData = selectedUser.user_id || selectedUser;
//         const userDepartments = selectedUser.departments || [];
//         const userRole = selectedUser.roleDefinitionId || {};
        
//         setEmployeeForm(prev => ({
//           ...prev,
//           personal: {
//             ...prev.personal,
//             firstName: safeString(userData?.name?.split(' ')[0], ""),
//             lastName: safeString(userData?.name?.split(' ').slice(1).join(' '), ""),
//             phone: safeString(userData?.phoneNumber, ""),
//             email: safeString(userData?.email, "")
//           },
//           employment: {
//             ...prev.employment,
//             userRoleTableId: isCreatingForExistingUser 
//               ? safeString(selectedUser._id, "")
//               : "",
//             departmentId: userDepartments.length > 0 ? safeString(userDepartments[0]._id, "") : "",
//             workType: (safeString(userRole?.roleName) === "Intern" ? "Intern" : "Probation") as "Full-Time" | "Intern" | "Probation" | "Notice",
//             status: (safeString(selectedUser.status, "active")) as "active" | "inactive" | "terminated"
//           }
//         }));
//       } else if (mode === 'view' || mode === 'edit') {
//         const employeeProfile = getEmployeeProfile(selectedUser.user_id._id);
//         if (employeeProfile) {
//           dispatch(fetchEmployeeById(employeeProfile._id));
//         }
//       }
//     }
//   }, [isOpen, selectedUser, mode, employees, dispatch, isCreatingForExistingUser]);

//   useEffect(() => {
//     if (currentEmployee && (mode === 'view' || mode === 'edit')) {
//       setEmployeeForm({
//         personal: {
//           firstName: currentEmployee.personal?.firstName ?? "",
//           lastName: currentEmployee.personal?.lastName ?? "",
//           dob: currentEmployee.personal?.dob ?? "",
//           gender: (currentEmployee.personal?.gender ?? "") as "male" | "female" | "other" | "",
//           maritalStatus: (currentEmployee.personal?.maritalStatus ?? "") as "single" | "married" | "divorced" | "",
//           phone: currentEmployee.personal?.phone ?? "",
//           email: currentEmployee.personal?.email ?? "",
//           address: {
//             line1: currentEmployee.personal?.address?.line1 ?? "",
//             line2: currentEmployee.personal?.address?.line2 ?? "",
//             city: currentEmployee.personal?.address?.city ?? "",
//             state: currentEmployee.personal?.address?.state ?? "",
//             country: currentEmployee.personal?.address?.country ?? "",
//             pincode: currentEmployee.personal?.address?.pincode ?? ""
//           }
//         },
//         employment: {
//           employeeCode: currentEmployee.employment?.employeeCode ?? "",
//           departmentId: currentEmployee.employment?.departmentId ?? "",
//           userRoleTableId: currentEmployee.employment?.userRoleTableId ?? "",
//           joinDate: currentEmployee.employment?.joinDate ?? "",
//           exitDate: currentEmployee.employment?.exitDate ?? "",
//           status: (currentEmployee.employment?.status ?? "active") as "active" | "inactive" | "terminated",
//           workLocation: currentEmployee.employment?.workLocation ?? "",
//           workType: (currentEmployee.employment?.workType ?? "Probation") as "Full-Time" | "Intern" | "Probation" | "Notice",
//           shiftId: typeof currentEmployee.shiftId === 'string' 
//             ? (currentEmployee.shiftId || "no-shift") 
//             : (currentEmployee.shiftId?._id || "no-shift")
//         },
//         bank: {
//           accountHolderName: currentEmployee.bank?.accountHolderName ?? "",
//           accountNumber: currentEmployee.bank?.accountNumber ?? "",
//           ifsc: currentEmployee.bank?.ifsc ?? "",
//           bankName: currentEmployee.bank?.bankName ?? "",
//           branch: currentEmployee.bank?.branch ?? ""
//         },
//         documents: (currentEmployee.documents || []).map((doc: any) => ({
//           ...doc,
//           number: doc.number ?? "",
//         })),
//         salary: currentEmployee.salary || [],
//         leavePolicyId: typeof currentEmployee.leavePolicyId === 'string' 
//           ? (currentEmployee.leavePolicyId || "") 
//           : (currentEmployee.leavePolicyId?._id || "")
//       });
//     }
//   }, [currentEmployee, mode]);

//   const handleEmployeeFormChange = (section: string, field: string, value: any) => {
//     setEmployeeForm(prev => ({
//       ...prev,
//       [section]: {
//         ...((prev[section as keyof EmployeeFormData] || {}) as object),
//         [field]: value
//       }
//     }));
//   };

//   const handleNestedFormChange = (section: string, subsection: string, field: string, value: any) => {
//     setEmployeeForm(prev => ({
//       ...prev,
//       [section]: {
//          ...((prev[section as keyof EmployeeFormData] || {}) as object),
//         [subsection]: {
//           ...(prev[section as keyof EmployeeFormData] as any)[subsection],
//           [field]: value
//         }
//       }
//     }));
//   };

//   const handleDocumentChange = (index: number, field: string, value: any) => {
//     setEmployeeForm(prev => ({
//       ...prev,
//       documents: prev.documents.map((doc, i) => 
//         i === index ? { ...doc, [field]: value } : doc
//       )
//     }));
//   };

//   const handleDocumentFileChange = (index: number, file: File) => {
//     setEmployeeDocuments(prev => {
//       const newDocs = [...prev];
//       newDocs[index] = file;
//       return newDocs;
//     });
//   };

//   const handleSalaryChange = (index: number, field: string, value: any) => {
//     setEmployeeForm(prev => ({
//       ...prev,
//       salary: prev.salary.map((salary, i) => 
//         i === index ? { ...salary, [field]: value } : salary
//       )
//     }));
//   };

//   const addDocument = () => {
//     setEmployeeForm(prev => ({
//       ...prev,
//       documents: [...prev.documents, { type: "aadhaar", number: "", verified: false }]
//     }));
//   };

//   const removeDocument = (index: number) => {
//     setEmployeeForm(prev => ({
//       ...prev,
//       documents: prev.documents.filter((_, i) => i !== index)
//     }));
//   };

//   const addSalaryComponent = () => {
//     setEmployeeForm(prev => ({
//       ...prev,
//       salary: [...prev.salary, { type: "basic", label: "", amount: 0 }]
//     }));
//   };

//   const removeSalaryComponent = (index: number) => {
//     setEmployeeForm(prev => ({
//       ...prev,
//       salary: prev.salary.filter((_, i) => i !== index)
//     }));
//   };

//   const handleSubmitEmployee = async () => {
//     if (!selectedUser?.user_id?._id) return;

//     if (!employeeForm.personal.firstName) {
//       toast.error("First name is required");
//       return;
//     }
//     if (!employeeForm.employment.employeeCode) {
//       toast.error("Employee code is required");
//       return;
//     }
//     if (!employeeForm.employment.departmentId) {
//       toast.error("Department is required");
//       return;
//     }
//     if (!employeeForm.employment.userRoleTableId && !isCreatingForExistingUser) {
//       toast.error("Role is required");
//       return;
//     }
//     if (!employeeForm.employment.joinDate) {
//       toast.error("Join date is required");
//       return;
//     }
//     if (!employeeForm.leavePolicyId) {
//       toast.error("Leave policy is required");
//       return;
//     }

//     setIsSubmittingEmployee(true);

//     try {
//       let transformedData = transformEmployeeData(employeeForm, selectedUser.user_id._id);
      
//       if (isCreatingForExistingUser) {
//         transformedData = {
//           ...transformedData,
//           employment: {
//             ...transformedData.employment,
//             userRoleTableId: safeString(selectedUser._id, ""),
//           }
//         };
//       }

//       const formData = new FormData();
//       employeeDocuments.forEach((file, index) => {
//         formData.append(`documents[${index}][proof]`, file);
//       });

//       if (mode === 'create') {
//         await dispatch(createEmployee({ employeeData: transformedData, files: formData })).unwrap();
//         toast.success("Employee profile created successfully!");
//       } else if (mode === 'edit') {
//         const employeeProfile = getEmployeeProfile(selectedUser.user_id._id);
//         if (employeeProfile) {
//           await dispatch(updateEmployee({ 
//             employeeId: employeeProfile._id, 
//             employeeData: transformedData, 
//             files: formData 
//           })).unwrap();
//           toast.success("Employee profile updated successfully!");
//         }
//       }

//       dispatch(fetchEmployees({}));
//       onSave?.();
//       handleClose();
//     } catch (error: any) {
//       toast.error(error || `Failed to ${mode} employee profile`);
//     } finally {
//       setIsSubmittingEmployee(false);
//     }
//   };

//   const handleClose = () => {
//     setEmployeeForm({
//       personal: {
//         firstName: "",
//         lastName: "",
//         dob: "",
//         gender: "",
//         maritalStatus: "",
//         phone: "",
//         email: "",
//         address: {
//           line1: "",
//           line2: "",
//           city: "",
//           state: "",
//           country: "",
//           pincode: ""
//         }
//       },
//       employment: {
//         employeeCode: "",
//         departmentId: "",
//         userRoleTableId: "",
//         joinDate: "",
//         exitDate: "",
//         status: "active",
//         workLocation: "",
//         workType: "Probation",
//         shiftId: "no-shift"
//       },
//       bank: {
//         accountHolderName: "",
//         accountNumber: "",
//         ifsc: "",
//         bankName: "",
//         branch: ""
//       },
//       documents: [],
//       salary: [],
//       leavePolicyId: ""
//     });
//     setEmployeeDocuments([]);
//     dispatch(clearCurrentEmployee());
//     onClose();
//   };

//   const getDepartmentName = (departmentId: string) => {
//     const department = departments.find((dept: any) => dept._id === departmentId);
//     return department ? `${safeString(department.name)} (${safeString(department.alias)})` : "Not specified";
//   };

//   const getRoleName = (roleId: string) => {
//     const role = roles.find((r: any) => r._id === roleId);
//     return role ? safeString(role.roleName) : "Not specified";
//   };

//   const getLeavePolicyName = (policyId: string) => {
//     const policy = leavePolicies.find((p: any) => p._id === policyId);
//     return policy ? safeString(policy.name) : "Not specified";
//   };

//   const getFullAddress = (address: Address) => {
//     const parts = [
//       address.line1,
//       address.line2,
//       address.city,
//       address.state,
//       address.country,
//       address.pincode
//     ].filter(part => part && part.trim() !== "");
    
//     return parts.length > 0 ? parts.join(', ') : "Not specified";
//   };

//   const isViewMode = mode === 'view';
  
//   const getUserName = () => {
//     return safeString(selectedUser?.user_id?.name || selectedUser?.name, 'User');
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={handleClose}>
//       <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden">
//         <DialogHeader>
//           <DialogTitle className="flex items-center gap-2">
//             <User className="h-5 w-5" />
//             {mode === 'create' && 'Create Employee Profile'}
//             {mode === 'view' && 'Employee Details'}
//             {mode === 'edit' && 'Edit Employee Profile'}
//           </DialogTitle>
//           <DialogDescription>
//             {mode === 'create' && `Create employee profile for ${getUserName()}`}
//             {mode === 'view' && `Viewing employee details for ${getUserName()}`}
//             {mode === 'edit' && `Edit employee profile for ${getUserName()}`}
//           </DialogDescription>
//         </DialogHeader>

//         <div className="overflow-y-auto max-h-[calc(90vh-180px)]">
//           <Tabs defaultValue="personal" className="w-full">
//             <TabsList className="grid w-full grid-cols-5">
//               <TabsTrigger value="personal" className="flex items-center gap-2">
//                 <User className="h-4 w-4" />
//                 Personal
//               </TabsTrigger>
//               <TabsTrigger value="employment" className="flex items-center gap-2">
//                 <Briefcase className="h-4 w-4" />
//                 Employment
//               </TabsTrigger>
//               <TabsTrigger value="bank" className="flex items-center gap-2">
//                 <CreditCard className="h-4 w-4" />
//                 Bank
//               </TabsTrigger>
//               <TabsTrigger value="documents" className="flex items-center gap-2">
//                 <FileText className="h-4 w-4" />
//                 Documents
//               </TabsTrigger>
//               <TabsTrigger value="salary" className="flex items-center gap-2">
//                 <DollarSign className="h-4 w-4" />
//                 Salary
//               </TabsTrigger>
//             </TabsList>

//             {/* Personal Tab */}
//             <TabsContent value="personal" className="space-y-6">
//               {isViewMode ? (
//                 <div className="space-y-6">
//                   <div className="grid grid-cols-2 gap-6">
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
//                       <div className="p-3 bg-muted rounded-md">
//                         {safeString(employeeForm.personal.firstName)} {safeString(employeeForm.personal.lastName)}
//                       </div>
//                     </div>
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium text-muted-foreground">Contact Info</Label>
//                       <div className="space-y-2">
//                         <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
//                           <Phone className="h-4 w-4" />
//                           {safeString(employeeForm.personal.phone)}
//                         </div>
//                         <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
//                           <Mail className="h-4 w-4" />
//                           {safeString(employeeForm.personal.email)}
//                         </div>
//                       </div>
//                     </div>
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
//                       <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
//                         <Calendar className="h-4 w-4" />
//                         {formatDate(employeeForm.personal.dob)}
//                       </div>
//                     </div>
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium text-muted-foreground">Gender & Marital Status</Label>
//                       <div className="space-y-2">
//                         <div className="p-2 bg-muted rounded-md">
//                           {capitalizeFirst(safeString(employeeForm.personal.gender))}
//                         </div>
//                         <div className="p-2 bg-muted rounded-md">
//                           {capitalizeFirst(safeString(employeeForm.personal.maritalStatus))}
//                         </div>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="space-y-4">
//                     <Label className="text-sm font-medium flex items-center gap-2">
//                       <MapPin className="h-4 w-4" />
//                       Address
//                     </Label>
//                     <div className="p-4 bg-muted rounded-md">
//                       {getFullAddress(employeeForm.personal.address)}
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="space-y-2">
//                       <Label htmlFor="firstName">First Name <span className="text-destructive">*</span></Label>
//                       <Input
//                         id="firstName"
//                         value={employeeForm.personal.firstName}
//                         onChange={(e) => handleEmployeeFormChange("personal", "firstName", e.target.value)}
//                         placeholder="Enter first name"
//                         disabled={isViewMode}
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="lastName">Last Name</Label>
//                       <Input
//                         id="lastName"
//                         value={employeeForm.personal.lastName}
//                         onChange={(e) => handleEmployeeFormChange("personal", "lastName", e.target.value)}
//                         placeholder="Enter last name"
//                         disabled={isViewMode}
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
//                       <Input
//                         id="phone"
//                         value={employeeForm.personal.phone}
//                         onChange={(e) => handleEmployeeFormChange("personal", "phone", e.target.value)}
//                         placeholder="Enter phone number"
//                         disabled={true}
//                         className="bg-muted"
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="email">Email</Label>
//                       <Input
//                         id="email"
//                         type="email"
//                         value={employeeForm.personal.email}
//                         onChange={(e) => handleEmployeeFormChange("personal", "email", e.target.value)}
//                         placeholder="Enter email address"
//                         disabled={true}
//                         className="bg-muted"
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="dob">Date of Birth</Label>
//                       <Input
//                         id="dob"
//                         type="date"
//                         value={employeeForm.personal.dob}
//                         onChange={(e) => handleEmployeeFormChange("personal", "dob", e.target.value)}
//                         disabled={isViewMode}
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="gender">Gender</Label>
//                       <Select
//                         value={employeeForm.personal.gender}
//                         onValueChange={(value) => handleEmployeeFormChange("personal", "gender", value)}
//                         disabled={isViewMode}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select gender" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="male">Male</SelectItem>
//                           <SelectItem value="female">Female</SelectItem>
//                           <SelectItem value="other">Other</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="maritalStatus">Marital Status</Label>
//                       <Select
//                         value={employeeForm.personal.maritalStatus}
//                         onValueChange={(value) => handleEmployeeFormChange("personal", "maritalStatus", value)}
//                         disabled={isViewMode}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select marital status" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="single">Single</SelectItem>
//                           <SelectItem value="married">Married</SelectItem>
//                           <SelectItem value="divorced">Divorced</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>
//                   </div>

//                   <div className="space-y-4">
//                     <Label className="text-sm font-medium">Address</Label>
//                     <div className="grid grid-cols-2 gap-4">
//                       <div className="space-y-2">
//                         <Label htmlFor="line1">Address Line 1</Label>
//                         <Input
//                           id="line1"
//                           value={employeeForm.personal.address.line1}
//                           onChange={(e) => handleNestedFormChange("personal", "address", "line1", e.target.value)}
//                           placeholder="Enter address line 1"
//                           disabled={isViewMode}
//                         />
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="line2">Address Line 2</Label>
//                         <Input
//                           id="line2"
//                           value={employeeForm.personal.address.line2}
//                           onChange={(e) => handleNestedFormChange("personal", "address", "line2", e.target.value)}
//                           placeholder="Enter address line 2"
//                           disabled={isViewMode}
//                         />
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="city">City</Label>
//                         <Input
//                           id="city"
//                           value={employeeForm.personal.address.city}
//                           onChange={(e) => handleNestedFormChange("personal", "address", "city", e.target.value)}
//                           placeholder="Enter city"
//                           disabled={isViewMode}
//                         />
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="state">State</Label>
//                         <Input
//                           id="state"
//                           value={employeeForm.personal.address.state}
//                           onChange={(e) => handleNestedFormChange("personal", "address", "state", e.target.value)}
//                           placeholder="Enter state"
//                           disabled={isViewMode}
//                         />
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="country">Country</Label>
//                         <Input
//                           id="country"
//                           value={employeeForm.personal.address.country}
//                           onChange={(e) => handleNestedFormChange("personal", "address", "country", e.target.value)}
//                           placeholder="Enter country"
//                           disabled={isViewMode}
//                         />
//                       </div>
//                       <div className="space-y-2">
//                         <Label htmlFor="pincode">Pincode</Label>
//                         <Input
//                           id="pincode"
//                           value={employeeForm.personal.address.pincode}
//                           onChange={(e) => handleNestedFormChange("personal", "address", "pincode", e.target.value)}
//                           placeholder="Enter pincode"
//                           disabled={isViewMode}
//                         />
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </TabsContent>

//             {/* Employment Tab */}
//             <TabsContent value="employment" className="space-y-6">
//               {isViewMode ? (
//                 <div className="space-y-6">
//                   <div className="grid grid-cols-2 gap-6">
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium text-muted-foreground">Employee Code</Label>
//                       <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
//                         <BadgeIcon className="h-4 w-4" />
//                         {safeString(employeeForm.employment.employeeCode, "Not assigned")}
//                       </div>
//                     </div>
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium text-muted-foreground">Status</Label>
//                       <Badge variant={getStatusVariant(employeeForm.employment.status)}>
//                         {capitalizeFirst(safeString(employeeForm.employment.status))}
//                       </Badge>
//                     </div>
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium text-muted-foreground">Department</Label>
//                       <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
//                         <Building className="h-4 w-4" />
//                         {getDepartmentName(employeeForm.employment.departmentId)}
//                       </div>
//                     </div>
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium text-muted-foreground">Role Name</Label>
//                       <div className="p-3 bg-muted rounded-md">
//                         {safeString(selectedUser?.roleDefinitionId?.roleName)}
//                       </div>
//                     </div>
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium text-muted-foreground">Join Date</Label>
//                       <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
//                         <Calendar className="h-4 w-4" />
//                         {formatDate(employeeForm.employment.joinDate)}
//                       </div>
//                     </div>
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium text-muted-foreground">Work Type</Label>
//                       <div className="p-3 bg-muted rounded-md">
//                         {safeString(employeeForm.employment.workType)}
//                       </div>
//                     </div>
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium text-muted-foreground">Leave Policy</Label>
//                       <div className="p-3 bg-muted rounded-md">
//                         {getLeavePolicyName(employeeForm.leavePolicyId)}
//                       </div>
//                     </div>
//                     {employeeForm.employment.exitDate && (
//                       <div className="space-y-2 col-span-2">
//                         <Label className="text-sm font-medium text-muted-foreground">Exit Date</Label>
//                         <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
//                           <Calendar className="h-4 w-4" />
//                           {formatDate(employeeForm.employment.exitDate)}
//                         </div>
//                       </div>
//                     )}
//                     <div className="space-y-2 col-span-2">
//                       <Label className="text-sm font-medium text-muted-foreground">Work Location</Label>
//                       <div className="p-3 bg-muted rounded-md">
//                         {safeString(employeeForm.employment.workLocation)}
//                       </div>
//                     </div>
//                     <div className="space-y-2 col-span-2">
//                       <Label className="text-sm font-medium text-muted-foreground">Work Shift</Label>
//                       <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
//                         <Clock className="h-4 w-4" />
//                         {(() => {
//                           if (!employeeForm.employment.shiftId || employeeForm.employment.shiftId === "no-shift") {
//                             return "No shift assigned";
//                           }
//                           const shift = shifts.find(s => s._id === employeeForm.employment.shiftId);
//                           return shift 
//                             ? `${shift.name} (${shift.startTime} - ${shift.endTime})`
//                             : "Shift not found";
//                         })()}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="space-y-2">
//                       <Label htmlFor="employeeCode">Employee Code <span className="text-destructive">*</span></Label>
//                       <Input
//                         id="employeeCode"
//                         value={employeeForm.employment.employeeCode}
//                         onChange={(e) => handleEmployeeFormChange("employment", "employeeCode", e.target.value)}
//                         placeholder="Enter employee code"
//                         disabled={isViewMode}
//                       />
//                     </div>
                    
//                     <div className="space-y-2">
//                       <Label htmlFor="departmentId">Department <span className="text-destructive">*</span></Label>
//                       <Select
//                         value={employeeForm.employment.departmentId}
//                         onValueChange={(value) => handleEmployeeFormChange("employment", "departmentId", value)}
//                         disabled={isViewMode}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select department" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           {departments.map((dept: any) => (
//                             <SelectItem key={dept._id} value={dept._id}>
//                               {safeString(dept.name)} ({safeString(dept.alias)})
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     {isCreatingForExistingUser ? (
//                       <div className="space-y-2 col-span-2">
//                         <Label>User Role Information</Label>
//                         <div className="p-3 bg-muted rounded-md border space-y-2">
//                           <div className="flex items-center justify-between">
//                             <Badge variant="outline" className="text-sm">
//                               {safeString(selectedUser?.roleDefinitionId?.roleName, 'Unknown Role')}
//                             </Badge>
//                             <span className="text-xs text-muted-foreground">
//                               Hierarchy Level: {safeString(selectedUser?.roleDefinitionId?.hierarchyLevel, 'N/A')}
//                             </span>
//                           </div>
//                           <p className="text-xs text-muted-foreground">
//                             <strong>Department:</strong> {safeString(selectedUser?.departments?.[0]?.name, 'Not specified')}
//                           </p>
//                           <p className="text-xs text-muted-foreground">
//                             Role and permissions are inherited from the user's role assignment record.
//                           </p>
//                         </div>
//                       </div>
//                     ) : (
//                       <div className="space-y-2">
//                         <Label htmlFor="userRoleTableId">Role <span className="text-destructive">*</span></Label>
//                         <Select
//                           value={employeeForm.employment.userRoleTableId}
//                           onValueChange={(value) => handleEmployeeFormChange("employment", "userRoleTableId", value)}
//                           disabled={isViewMode}
//                         >
//                           <SelectTrigger>
//                             <SelectValue placeholder="Select role" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {roles.map((role: any) => (
//                               <SelectItem key={role._id} value={role._id}>
//                                 {safeString(role.roleName, 'Unknown Role')}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                       </div>
//                     )}

//                     <div className="space-y-2">
//                       <Label htmlFor="joinDate">Join Date <span className="text-destructive">*</span></Label>
//                       <Input
//                         id="joinDate"
//                         type="date"
//                         value={employeeForm.employment.joinDate}
//                         onChange={(e) => handleEmployeeFormChange("employment", "joinDate", e.target.value)}
//                         disabled={isViewMode}
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="status">Status</Label>
//                       <Select
//                         value={employeeForm.employment.status}
//                         onValueChange={(value) => handleEmployeeFormChange("employment", "status", value)}
//                         disabled={isViewMode}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select status" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="active">Active</SelectItem>
//                           <SelectItem value="inactive">Inactive</SelectItem>
//                           <SelectItem value="terminated">Terminated</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="workType">Work Type</Label>
//                       <Select
//                         value={employeeForm.employment.workType}
//                         onValueChange={(value) => handleEmployeeFormChange("employment", "workType", value)}
//                         disabled={isViewMode}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder="Select work type" />
//                         </SelectTrigger>
//                         <SelectContent>
//                           <SelectItem value="Full-Time">Full-Time</SelectItem>
//                           <SelectItem value="Intern">Intern</SelectItem>
//                           <SelectItem value="Probation">Probation</SelectItem>
//                           <SelectItem value="Notice">Notice</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="workLocation">Work Location</Label>
//                       <Input
//                         id="workLocation"
//                         value={employeeForm.employment.workLocation}
//                         onChange={(e) => handleEmployeeFormChange("employment", "workLocation", e.target.value)}
//                         placeholder="Enter work location"
//                         disabled={isViewMode}
//                       />
//                     </div>
                    
//                     {/* Shift Selection Field */}
//                     <div className="space-y-2">
//                       <Label htmlFor="shiftId">Work Shift</Label>
//                       <Select
//                         value={employeeForm.employment.shiftId}
//                         onValueChange={(value) => handleEmployeeFormChange("employment", "shiftId", value)}
//                         disabled={isViewMode || organizationTimingLoading}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder={organizationTimingLoading ? "Loading shifts..." : "Select work shift"} />
//                         </SelectTrigger>
//                         <SelectContent>
//                           {organizationTimingLoading ? (
//                             <SelectItem value="loading" disabled>
//                               <div className="flex items-center gap-2">
//                                 <Loader2 className="h-4 w-4 animate-spin" />
//                                 Loading shifts...
//                               </div>
//                             </SelectItem>
//                           ) : shifts.length === 0 ? (
//                             <SelectItem value="no-shifts" disabled>
//                               No shifts configured
//                             </SelectItem>
//                           ) : (
//                             <>
//                               <SelectItem value="no-shift">No shift assigned</SelectItem>
//                               {shifts.map((shift) => (
//                                 <SelectItem key={shift._id} value={shift._id || 'unknown-shift'}>
//                                   <div className="flex flex-col">
//                                     <span className="font-medium">{shift.name}</span>
//                                     <span className="text-xs text-muted-foreground">
//                                       {shift.startTime} - {shift.endTime}
//                                       {shift.breaks.length > 0 && ` • ${shift.breaks.length} break(s)`}
//                                     </span>
//                                   </div>
//                                 </SelectItem>
//                               ))}
//                             </>
//                           )}
//                         </SelectContent>
//                       </Select>
                      
//                       {employeeForm.employment.shiftId && employeeForm.employment.shiftId !== "no-shift" && (
//                         <div className="text-xs text-muted-foreground bg-muted p-3 rounded border">
//                           {(() => {
//                             const selectedShift = shifts.find(s => s._id === employeeForm.employment.shiftId);
//                             if (!selectedShift) return null;
                            
//                             return (
//                               <div className="space-y-1">
//                                 <div className="font-medium flex items-center gap-2">
//                                   <Clock className="h-3 w-3" />
//                                   {selectedShift.name}
//                                 </div>
//                                 <div>Working Hours: {selectedShift.startTime} - {selectedShift.endTime}</div>
//                                 {selectedShift.breaks.length > 0 && (
//                                   <div>
//                                     <div className="font-medium mt-2">Breaks:</div>
//                                     {selectedShift.breaks.map((breakTime, idx) => (
//                                       <div key={idx} className="ml-2">
//                                         • {breakTime.name}: {breakTime.startTime} - {breakTime.endTime}
//                                       </div>
//                                     ))}
//                                   </div>
//                                 )}
//                               </div>
//                             );
//                           })()}
//                         </div>
//                       )}
                      
//                       {organizationTimingError && (
//                         <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
//                           Error loading shifts: {organizationTimingError}
//                         </div>
//                       )}
//                     </div>

//                     {/* Leave Policy Selection Field */}
//                     <div className="space-y-2">
//                       <Label htmlFor="leavePolicyId">Leave Policy <span className="text-destructive">*</span></Label>
//                       <Select 
//                         value={employeeForm.leavePolicyId} 
//                         onValueChange={(value) => setEmployeeForm(prev => ({...prev, leavePolicyId: value}))}
//                         disabled={isViewMode || leavePolicyLoading}
//                       >
//                         <SelectTrigger>
//                           <SelectValue placeholder={leavePolicyLoading ? "Loading policies..." : "Select leave policy"} />
//                         </SelectTrigger>
//                         <SelectContent>
//                           {leavePolicyLoading ? (
//                             <SelectItem value="loading" disabled>
//                               <div className="flex items-center gap-2">
//                                 <Loader2 className="h-4 w-4 animate-spin" />
//                                 Loading policies...
//                               </div>
//                             </SelectItem>
//                           ) : leavePolicies.length === 0 ? (
//                             <SelectItem value="no-policies" disabled>No leave policies configured</SelectItem>
//                           ) : (
//                             leavePolicies.map((policy: any) => (
//                               <SelectItem key={policy._id} value={policy._id}>
//                                 <div className="flex flex-col">
//                                   <span className="font-medium">{policy.name}</span>
//                                   <span className="text-xs text-muted-foreground">
//                                     {policy.description || 'No description'}
//                                   </span>
//                                 </div>
//                               </SelectItem>
//                             ))
//                           )}
//                         </SelectContent>
//                       </Select>
//                       {leavePolicyError && (
//                         <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
//                           Error loading policies: {leavePolicyError}
//                         </div>
//                       )}
//                     </div>

//                     <div className="space-y-2">
//                       <Label htmlFor="exitDate">Exit Date</Label>
//                       <Input
//                         id="exitDate"
//                         type="date"
//                         value={employeeForm.employment.exitDate}
//                         onChange={(e) => handleEmployeeFormChange("employment", "exitDate", e.target.value)}
//                         disabled={isViewMode}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </TabsContent>

//             {/* Bank Tab */}
//             <TabsContent value="bank" className="space-y-6">
//               {isViewMode ? (
//                 <div className="space-y-6">
//                   <div className="grid grid-cols-2 gap-6">
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium text-muted-foreground">Account Holder</Label>
//                       <div className="p-3 bg-muted rounded-md">
//                         {safeString(employeeForm.bank.accountHolderName)}
//                       </div>
//                     </div>
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium text-muted-foreground">Account Number</Label>
//                       <div className="p-3 bg-muted rounded-md font-mono">
//                         {employeeForm.bank.accountNumber ? 
//                          `****${employeeForm.bank.accountNumber.slice(-4)}` : "Not specified"}
//                       </div>
//                     </div>
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium text-muted-foreground">IFSC Code</Label>
//                       <div className="p-3 bg-muted rounded-md font-mono">
//                         {safeString(employeeForm.bank.ifsc)}
//                       </div>
//                     </div>
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium text-muted-foreground">Bank Name</Label>
//                       <div className="p-3 bg-muted rounded-md">
//                         {safeString(employeeForm.bank.bankName)}
//                       </div>
//                     </div>
//                     <div className="space-y-2">
//                       <Label className="text-sm font-medium text-muted-foreground">Branch</Label>
//                       <div className="p-3 bg-muted rounded-md">
//                         {safeString(employeeForm.bank.branch)}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   <div className="grid grid-cols-2 gap-4">
//                     <div className="space-y-2">
//                       <Label htmlFor="accountHolderName">Account Holder Name</Label>
//                       <Input
//                         id="accountHolderName"
//                         value={employeeForm.bank.accountHolderName}
//                         onChange={(e) => handleEmployeeFormChange("bank", "accountHolderName", e.target.value)}
//                         placeholder="Enter account holder name"
//                         disabled={isViewMode}
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="accountNumber">Account Number</Label>
//                       <Input
//                         id="accountNumber"
//                         value={employeeForm.bank.accountNumber}
//                         onChange={(e) => handleEmployeeFormChange("bank", "accountNumber", e.target.value)}
//                         placeholder="Enter account number"
//                         disabled={isViewMode}
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="ifsc">IFSC Code</Label>
//                       <Input
//                         id="ifsc"
//                         value={employeeForm.bank.ifsc}
//                         onChange={(e) => handleEmployeeFormChange("bank", "ifsc", e.target.value)}
//                         placeholder="Enter IFSC code"
//                         disabled={isViewMode}
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="bankName">Bank Name</Label>
//                       <Input
//                         id="bankName"
//                         value={employeeForm.bank.bankName}
//                         onChange={(e) => handleEmployeeFormChange("bank", "bankName", e.target.value)}
//                         placeholder="Enter bank name"
//                         disabled={isViewMode}
//                       />
//                     </div>
//                     <div className="space-y-2">
//                       <Label htmlFor="branch">Branch</Label>
//                       <Input
//                         id="branch"
//                         value={employeeForm.bank.branch}
//                         onChange={(e) => handleEmployeeFormChange("bank", "branch", e.target.value)}
//                         placeholder="Enter branch name"
//                         disabled={isViewMode}
//                       />
//                     </div>
//                   </div>
//                 </div>
//               )}
//             </TabsContent>

//             {/* Documents Tab */}
//             <TabsContent value="documents" className="space-y-6">
//               {isViewMode ? (
//                 <div className="space-y-6">
//                   {employeeForm.documents.length > 0 ? (
//                     <div className="grid gap-4">
//                       {employeeForm.documents.map((doc, index) => (
//                         <div key={index} className="border rounded-lg p-4 space-y-3">
//                           <div className="flex justify-between items-center">
//                             <h4 className="text-sm font-medium flex items-center gap-2">
//                               <FileText className="h-4 w-4" />
//                               {getDocumentTypeLabel(doc.type)}
//                             </h4>
//                             <Badge variant={doc.verified ? "default" : "secondary"}>
//                               {doc.verified ? "Verified" : "Not Verified"}
//                             </Badge>
//                           </div>
//                           <div className="grid grid-cols-2 gap-4">
//                             <div>
//                               <Label className="text-sm text-muted-foreground">Document Number</Label>
//                               <div className="p-2 bg-muted rounded-md font-mono">
//                                 {safeString(doc.number)}
//                               </div>
//                             </div>
//                             <div>
//                               <Label className="text-sm text-muted-foreground">Status</Label>
//                               <div className="p-2 bg-muted rounded-md">
//                                 {doc.verified ? "Verified" : "Pending Verification"}
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                     </div>
//                   ) : (
//                     <div className="text-center text-muted-foreground py-8">
//                       <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
//                       <p>No documents added yet.</p>
//                     </div>
//                   )}
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   <div className="flex justify-between items-center">
//                     <Label className="text-sm font-medium">Documents</Label>
//                     {!isViewMode && (
//                       <Button
//                         type="button"
//                         variant="outline"
//                         size="sm"
//                         onClick={addDocument}
//                       >
//                         <Plus className="h-4 w-4 mr-2" />
//                         Add Document
//                       </Button>
//                     )}
//                   </div>

//                   {employeeForm.documents.map((doc, index) => (
//                     <div key={index} className="border rounded-lg p-4 space-y-4">
//                       <div className="flex justify-between items-center">
//                         <h4 className="text-sm font-medium">Document {index + 1}</h4>
//                         {!isViewMode && (
//                           <Button
//                             type="button"
//                             variant="destructive"
//                             size="sm"
//                             onClick={() => removeDocument(index)}
//                           >
//                             <X className="h-4 w-4" />
//                           </Button>
//                         )}
//                       </div>
//                       <div className="grid grid-cols-3 gap-4">
//                         <div className="space-y-2">
//                           <Label htmlFor={`docType-${index}`}>Document Type</Label>
//                           <Select
//                             value={doc.type}
//                             onValueChange={(value) => handleDocumentChange(index, "type", value)}
//                             disabled={isViewMode}
//                           >
//                             <SelectTrigger>
//                               <SelectValue placeholder="Select type" />
//                             </SelectTrigger>
//                             <SelectContent>
//                               <SelectItem value="aadhaar">Aadhaar Card</SelectItem>
//                               <SelectItem value="pan">PAN Card</SelectItem>
//                               <SelectItem value="passport">Passport</SelectItem>
//                               <SelectItem value="others">Others</SelectItem>
//                             </SelectContent>
//                           </Select>
//                         </div>
//                         <div className="space-y-2">
//                           <Label htmlFor={`docNumber-${index}`}>Document Number</Label>
//                           <Input
//                             id={`docNumber-${index}`}
//                             value={doc.number}
//                             onChange={(e) => handleDocumentChange(index, "number", e.target.value)}
//                             placeholder="Enter document number"
//                             disabled={isViewMode}
//                           />
//                         </div>
//                         <div className="space-y-2">
//                           <Label>Verified</Label>
//                           <div className="flex items-center space-x-2 pt-2">
//                             <Checkbox
//                               id={`verified-${index}`}
//                               checked={doc.verified}
//                               onCheckedChange={(checked) => handleDocumentChange(index, "verified", checked)}
//                               disabled={isViewMode}
//                             />
//                             <label htmlFor={`verified-${index}`} className="text-sm">
//                               Document verified
//                             </label>
//                           </div>
//                         </div>
//                       </div>
                      
//                       {!isViewMode && (
//                         <div className="space-y-2">
//                           <Label htmlFor={`docFile-${index}`}>Document File</Label>
//                           <Input
//                             id={`docFile-${index}`}
//                             type="file"
//                             accept=".pdf,.jpg,.jpeg,.png"
//                             onChange={(e) => {
//                               const file = e.target.files?.[0];
//                               if (file) {
//                                 handleDocumentFileChange(index, file);
//                               }
//                             }}
//                             disabled={isViewMode}
//                           />
//                         </div>
//                       )}
//                     </div>
//                   ))}

//                   {employeeForm.documents.length === 0 && (
//                     <div className="text-center text-muted-foreground py-4">
//                       No documents added yet.
//                     </div>
//                   )}
//                 </div>
//               )}
//             </TabsContent>

//             {/* Salary Tab */}
//             <TabsContent value="salary" className="space-y-6">
//               {isViewMode ? (
//                 <div className="space-y-6">
//                   {employeeForm.salary.length > 0 ? (
//                     <div className="grid gap-4">
//                       {employeeForm.salary.map((salary, index) => (
//                         <div key={index} className="border rounded-lg p-4 space-y-3">
//                           <div className="flex justify-between items-center">
//                             <h4 className="text-sm font-medium flex items-center gap-2">
//                               <DollarSign className="h-4 w-4" />
//                               {safeString(salary.label) || getSalaryTypeLabel(salary.type)}
//                             </h4>
//                             <Badge variant="outline">
//                               {getSalaryTypeLabel(salary.type)}
//                             </Badge>
//                           </div>
//                           <div className="grid grid-cols-2 gap-4">
//                             <div>
//                               <Label className="text-sm text-muted-foreground">Amount</Label>
//                               <div className="p-2 bg-muted rounded-md font-mono">
//                                 ₹{(salary.amount || 0).toLocaleString()}
//                               </div>
//                             </div>
//                             <div>
//                               <Label className="text-sm text-muted-foreground">Type</Label>
//                               <div className="p-2 bg-muted rounded-md">
//                                 {getSalaryTypeLabel(salary.type)}
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       ))}
//                       <div className="border-t pt-4 mt-4">
//                         <div className="flex justify-between items-center font-medium">
//                           <span>Total Monthly Salary:</span>
//                           <span className="text-lg">
//                             ₹{employeeForm.salary.reduce((sum, comp) => sum + (comp.amount || 0), 0).toLocaleString()}
//                           </span>
//                         </div>
//                       </div>
//                     </div>
//                   ) : (
//                     <div className="text-center text-muted-foreground py-8">
//                       <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
//                       <p>No salary components added yet.</p>
//                     </div>
//                   )}
//                 </div>
//               ) : (
//                 <div className="space-y-4">
//                   <div className="flex justify-between items-center">
//                     <Label className="text-sm font-medium">Salary Components</Label>
//                     {!isViewMode && (
//                       <Button
//                         type="button"
//                         variant="outline"
//                         size="sm"
//                         onClick={addSalaryComponent}
//                       >
//                         <Plus className="h-4 w-4 mr-2" />
//                         Add Salary Component
//                       </Button>
//                     )}
//                   </div>

//                   {employeeForm.salary.map((salary, index) => (
//                     <div key={index} className="border rounded-lg p-4 space-y-4">
//                       <div className="flex justify-between items-center">
//                         <h4 className="text-sm font-medium">Salary Component {index + 1}</h4>
//                         {!isViewMode && (
//                           <Button
//                             type="button"
//                             variant="destructive"
//                             size="sm"
//                             onClick={() => removeSalaryComponent(index)}
//                           >
//                             <X className="h-4 w-4" />
//                           </Button>
//                         )}
//                       </div>
//                       <div className="grid grid-cols-3 gap-4">
//                         <div className="space-y-2">
//                           <Label htmlFor={`salaryType-${index}`}>Component Type</Label>
//                           <Select
//                             value={salary.type}
//                             onValueChange={(value) => handleSalaryChange(index, "type", value)}
//                             disabled={isViewMode}
//                           >
//                             <SelectTrigger>
//                               <SelectValue placeholder="Select type" />
//                             </SelectTrigger>
//                             <SelectContent>
//                               <SelectItem value="basic">Basic Salary</SelectItem>
//                               <SelectItem value="hra">HRA</SelectItem>
//                               <SelectItem value="allowance">Allowance</SelectItem>
//                               <SelectItem value="deduction">Deduction</SelectItem>
//                             </SelectContent>
//                           </Select>
//                         </div>
//                         <div className="space-y-2">
//                           <Label htmlFor={`salaryLabel-${index}`}>Component Label</Label>
//                           <Input
//                             id={`salaryLabel-${index}`}
//                             value={salary.label}
//                             onChange={(e) => handleSalaryChange(index, "label", e.target.value)}
//                             placeholder="Enter component label"
//                             disabled={isViewMode}
//                           />
//                         </div>
//                         <div className="space-y-2">
//                           <Label htmlFor={`salaryAmount-${index}`}>Amount</Label>
//                           <Input
//                             id={`salaryAmount-${index}`}
//                             type="number"
//                             value={salary.amount}
//                             onChange={(e) => handleSalaryChange(index, "amount", parseFloat(e.target.value) || 0)}
//                             placeholder="Enter amount"
//                             disabled={isViewMode}
//                           />
//                         </div>
//                       </div>
//                     </div>
//                   ))}

//                   {employeeForm.salary.length === 0 && (
//                     <div className="text-center text-muted-foreground py-4">
//                       No salary components added yet.
//                     </div>
//                   )}
//                 </div>
//               )}
//             </TabsContent>
//           </Tabs>
//         </div>

//         <div className="flex justify-end gap-2 pt-4 border-t">
//           <Button type="button" variant="outline" onClick={handleClose}>
//             {isViewMode ? 'Close' : 'Cancel'}
//           </Button>
//           {!isViewMode && (
//             <Button 
//               onClick={handleSubmitEmployee} 
//               disabled={isSubmittingEmployee || employeeLoading}
//             >
//               {isSubmittingEmployee && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
//               {mode === 'create' ? 'Create Employee' : 'Update Employee'}
//             </Button>
//           )}
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// }


