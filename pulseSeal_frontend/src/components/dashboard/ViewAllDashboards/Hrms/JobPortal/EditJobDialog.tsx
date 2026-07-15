"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  X,
  Calendar,
  DollarSign,
  Users,
  MapPin,
  Building2,
  Loader2,
  Trash2,
  Save,
} from "lucide-react";
import {
  Job,
  UpdateJobRequest,
  EmploymentType,
  ExperienceLevel,
  JobStatus,
} from "@/lib/types/api/job";

interface EditJobDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (jobId: string, jobData: UpdateJobRequest) => Promise<void>;
  job: Job | null;
  loading?: boolean;
}

interface FormData {
  title: string;
  description: string;
  requirements: string[];
  location: string;
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };
  employmentType: EmploymentType;
  department: string;
  skillsRequired: string[];
  experienceLevel: ExperienceLevel;
  status: JobStatus;
  applicationDeadline: string;
  numberOfOpenings: number;
}

const EditJobDialog: React.FC<EditJobDialogProps> = ({
  open,
  onClose,
  onSubmit,
  job,
  loading = false,
}) => {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    requirements: [""],
    location: "",
    salaryRange: { min: 0, max: 0, currency: "INR" },
    employmentType: "Full-time",
    department: "",
    skillsRequired: [],
    experienceLevel: "Mid",
    status: "Active",
    applicationDeadline: "",
    numberOfOpenings: 1,
  });

  const [currentSkill, setCurrentSkill] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const employmentTypes: EmploymentType[] = [
    "Full-time",
    "Part-time",
    "Contract",
    "Internship",
  ];
  const experienceLevels: ExperienceLevel[] = [
    "Entry",
    "Mid",
    "Senior",
    "Executive",
  ];
  const jobStatuses: JobStatus[] = ["Active", "Draft", "Closed"];
  const currencies = ["INR", "USD", "EUR", "GBP"];

  // Populate form with job data when dialog opens
  useEffect(() => {
    if (job && open) {
      const applicationDeadlineFormatted = job.applicationDeadline
        ? new Date(job.applicationDeadline).toISOString().split("T")[0]
        : "";

      setFormData({
        title: job.title || "",
        description: job.description || "",
        requirements:
          job.requirements && job.requirements.length > 0
            ? job.requirements
            : [""],
        location: job.location || "",
        salaryRange: {
          min: job.salaryRange?.min || 0,
          max: job.salaryRange?.max || 0,
          currency: job.salaryRange?.currency || "INR",
        },
        employmentType: job.employmentType || "Full-time",
        department: job.department || "",
        skillsRequired: job.skillsRequired || [],
        experienceLevel: job.experienceLevel || "Mid",
        status: job.status || "Active",
        applicationDeadline: applicationDeadlineFormatted,
        numberOfOpenings: job.numberOfOpenings || 1,
      });
      setCurrentSkill("");
      setErrors({});
    }
  }, [job, open]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) newErrors.title = "Job title is required";
    if (!formData.description.trim())
      newErrors.description = "Job description is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (
      formData.requirements.length === 0 ||
      formData.requirements.some((req) => !req.trim())
    ) {
      newErrors.requirements = "At least one requirement is required";
    }
    if (formData.skillsRequired.length === 0)
      newErrors.skills = "Skills are required";
    if (
      formData.salaryRange.min > 0 &&
      formData.salaryRange.max > 0 &&
      formData.salaryRange.min > formData.salaryRange.max
    ) {
      newErrors.salaryRange =
        "Minimum salary cannot be greater than maximum salary";
    }
    if (
      formData.applicationDeadline &&
      new Date(formData.applicationDeadline) < new Date()
    ) {
      newErrors.applicationDeadline =
        "Application deadline must be in the future";
    }
    if (formData.numberOfOpenings < 1) {
      newErrors.numberOfOpenings = "Number of openings must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !job) return;

    try {
      // Filter out empty requirements
      const filteredRequirements = formData.requirements.filter(
        (req) => req.trim() !== ""
      );

      const jobData: UpdateJobRequest = {
        ...formData,
        requirements: filteredRequirements,
        salaryRange:
          formData.salaryRange.min > 0 || formData.salaryRange.max > 0
            ? formData.salaryRange
            : undefined,
        applicationDeadline: formData.applicationDeadline || undefined,
      };

      await onSubmit(job._id, jobData);
      handleClose();
    } catch (error) {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      requirements: [""],
      location: "",
      salaryRange: { min: 0, max: 0, currency: "INR" },
      employmentType: "Full-time",
      department: "",
      skillsRequired: [],
      experienceLevel: "Mid",
      status: "Active",
      applicationDeadline: "",
      numberOfOpenings: 1,
    });
    setCurrentSkill("");
    setErrors({});
    onClose();
  };

  const addRequirement = () => {
    setFormData((prev) => ({
      ...prev,
      requirements: [...prev.requirements, ""],
    }));
  };

  const removeRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.map((req, i) =>
        i === index ? value : req
      ),
    }));
  };

  const addSkill = () => {
    if (
      currentSkill.trim() &&
      !formData.skillsRequired.includes(currentSkill.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        skillsRequired: [...prev.skillsRequired, currentSkill.trim()],
      }));
      setCurrentSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skillsRequired: prev.skillsRequired.filter((s) => s !== skill),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };

  if (!job) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-2xl font-semibold">
              Edit Job
            </DialogTitle>
            <DialogDescription>
              Update the job posting details
            </DialogDescription>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-primary">
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="e.g. Senior Software Engineer"
                    disabled={loading}
                    className={errors.title ? "border-destructive" : ""}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Job Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe the role, responsibilities, and requirements..."
                    rows={4}
                    disabled={loading}
                    className={errors.description ? "border-destructive" : ""}
                  />
                  {errors.description && (
                    <p className="text-sm text-destructive">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                        placeholder="e.g. San Francisco, CA or Remote"
                        disabled={loading}
                        className={`pl-10 ${
                          errors.location ? "border-destructive" : ""
                        }`}
                      />
                    </div>
                    {errors.location && (
                      <p className="text-sm text-destructive">
                        {errors.location}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            department: e.target.value,
                          }))
                        }
                        placeholder="e.g. Engineering, Marketing"
                        disabled={loading}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-primary">
                  Job Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Employment Type</Label>
                    <Select
                      value={formData.employmentType}
                      onValueChange={(value: EmploymentType) =>
                        setFormData((prev) => ({
                          ...prev,
                          employmentType: value,
                        }))
                      }
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {employmentTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Experience Level</Label>
                    <Select
                      value={formData.experienceLevel}
                      onValueChange={(value: ExperienceLevel) =>
                        setFormData((prev) => ({
                          ...prev,
                          experienceLevel: value,
                        }))
                      }
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {experienceLevels.map((level) => (
                          <SelectItem key={level} value={level}>
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Job Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: JobStatus) =>
                        setFormData((prev) => ({ ...prev, status: value }))
                      }
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {jobStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Salary Range */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Salary Range</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minSalary">Minimum Salary</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="minSalary"
                        type="number"
                        value={formData.salaryRange.min}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            salaryRange: {
                              ...prev.salaryRange,
                              min: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                        disabled={loading}
                        className="pl-10"
                        placeholder="50000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxSalary">Maximum Salary</Label>
                    <Input
                      id="maxSalary"
                      type="number"
                      value={formData.salaryRange.max}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          salaryRange: {
                            ...prev.salaryRange,
                            max: parseInt(e.target.value) || 0,
                          },
                        }))
                      }
                      disabled={loading}
                      placeholder="80000"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select
                      value={formData.salaryRange.currency}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          salaryRange: { ...prev.salaryRange, currency: value },
                        }))
                      }
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {errors.salaryRange && (
                  <Alert>
                    <AlertDescription>{errors.salaryRange}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Requirements *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {formData.requirements.map((requirement, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={requirement}
                        onChange={(e) =>
                          updateRequirement(index, e.target.value)
                        }
                        placeholder={`Requirement ${index + 1}`}
                        className={
                          errors.requirements && !requirement.trim()
                            ? "border-destructive"
                            : ""
                        }
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeRequirement(index)}
                        disabled={formData.requirements.length <= 1 || loading}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={addRequirement}
                  disabled={loading}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Requirement
                </Button>

                {errors.requirements && (
                  <p className="text-sm text-destructive">
                    {errors.requirements}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skills Required *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={currentSkill}
                    onChange={(e) => setCurrentSkill(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a skill and press Enter"
                    disabled={loading}
                    className={errors.skills ? "border-destructive" : ""}
                  />
                  <Button type="button" onClick={addSkill} disabled={loading}>
                    Add
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {formData.skillsRequired.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="px-3 py-1"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="ml-2 hover:text-destructive"
                        disabled={loading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>

                {errors.skills && (
                  <p className="text-sm text-destructive">{errors.skills}</p>
                )}
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Application Deadline</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="deadline"
                        type="date"
                        value={formData.applicationDeadline}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            applicationDeadline: e.target.value,
                          }))
                        }
                        disabled={loading}
                        className={`pl-10 ${
                          errors.applicationDeadline ? "border-destructive" : ""
                        }`}
                      />
                    </div>
                    {errors.applicationDeadline && (
                      <p className="text-sm text-destructive">
                        {errors.applicationDeadline}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="openings">Number of Openings</Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="openings"
                        type="number"
                        value={formData.numberOfOpenings}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            numberOfOpenings: parseInt(e.target.value) || 1,
                          }))
                        }
                        disabled={loading}
                        min={1}
                        className={`pl-10 ${
                          errors.numberOfOpenings ? "border-destructive" : ""
                        }`}
                      />
                    </div>
                    {errors.numberOfOpenings && (
                      <p className="text-sm text-destructive">
                        {errors.numberOfOpenings}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Job
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditJobDialog;
