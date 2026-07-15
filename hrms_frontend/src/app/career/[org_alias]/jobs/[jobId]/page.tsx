"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  X,
  MapPin,
  Building2,
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AppDispatch, RootState } from "@/store";
import {
  getJobDetailsBySlug,
  applyForJob,
  clearError,
  clearSuccess,
} from "@/features/job/jobPortalSlice";

interface ApplicationFormData {
  name: string;
  email: string;
  phone: string;
  location: string;
  coverLetter: string;
  portfolio: string;
  linkedin: string;
  github: string;
  resume: File | null;
}

interface ExtendedJob {
  _id: string;
  title: string;
  description: string;
  location: string;
  department: string;
  employmentType: string;
  experienceLevel: string;
  status: string;
  applicationDeadline?: string;
  createdAt: string;
  skillsRequired?: string[];
  organizationId: {
    _id: string;
    name: string;
    description: string;
    org_alias?: string;
  };
  salary?: string;
  responsibilities?: string[];
  qualifications?: string;
}

const JobDetails = () => {
  const params = useParams();
  const org_alias = params.org_alias as string;
  const jobId = params.jobId as string;

  const dispatch = useDispatch<AppDispatch>();
  const { currentJob, loading, error, success } = useSelector(
    (state: RootState) => state.jobPortal
  );

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicationData, setApplicationData] = useState<ApplicationFormData>({
    name: "",
    email: "",
    phone: "",
    location: "",
    coverLetter: "",
    portfolio: "",
    linkedin: "",
    github: "",
    resume: null,
  });
  const [submitting, setSubmitting] = useState(false);


  const isDeadlinePassed = (deadline?: string): boolean => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    
    deadlineDate.setHours(23, 59, 59, 999);
    return now > deadlineDate;
  };

  const isDeadlineNear = (deadline?: string): boolean => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const getDeadlineStatus = (deadline?: string) => {
    if (!deadline) return { status: "no-deadline", message: "" };

    if (isDeadlinePassed(deadline)) {
      return {
        status: "passed",
        message: "Application deadline has passed",
        color: "text-red-600",
      };
    }

    if (isDeadlineNear(deadline)) {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const diffTime = deadlineDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        status: "near",
        message: `Application closes in ${diffDays} day${
          diffDays > 1 ? "s" : ""
        }`,
        color: "text-orange-600",
      };
    }

    return {
      status: "open",
      message: "Applications are open",
      color: "text-green-600",
    };
  };

  
  const canApply = (job: ExtendedJob): boolean => {
    if (job.status !== "Active") return false;
    if (isDeadlinePassed(job.applicationDeadline)) return false;
    return true;
  };

  useEffect(() => {
    if (jobId && org_alias) {
      dispatch(getJobDetailsBySlug({ orgAlias: org_alias, jobId }));
    }
  }, [jobId, org_alias, dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(`${error} - Failed to submit application`);
      dispatch(clearError());
    }

    if (success) {
      toast.success("Application submitted successfully!");
      dispatch(clearSuccess());
      setShowApplyModal(false);
      setApplicationData({
        name: "",
        email: "",
        phone: "",
        location: "",
        coverLetter: "",
        portfolio: "",
        linkedin: "",
        github: "",
        resume: null,
      });
    }
  }, [error, success, dispatch]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setApplicationData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setApplicationData((prev) => ({
      ...prev,
      resume: file || null,
    }));
  };

  const handleSubmitApplication = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setSubmitting(true);

    try {
     
      if (!applicationData.resume) {
        toast.error("Please upload your resume");
        setSubmitting(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(applicationData.email)) {
        toast.error("Please enter a valid email address");
        setSubmitting(false);
        return;
      }

      if (!currentJob) {
        toast.error("Cannot submit application - job not found");
        setSubmitting(false);
        return;
      }

      
      if (isDeadlinePassed(currentJob.applicationDeadline)) {
        toast.error("Application deadline has passed");
        setSubmitting(false);
        return;
      }

      
      const applicationPayload = {
        jobId: currentJob._id,
        candidate: {
          name: applicationData.name,
          email: applicationData.email,
          phone: applicationData.phone,
          location: applicationData.location,
          portfolio: applicationData.portfolio,
          linkedin: applicationData.linkedin,
          github: applicationData.github,
        },
        coverLetter: applicationData.coverLetter,
        resume: applicationData.resume,
      };

     
      await dispatch(applyForJob(applicationPayload)).unwrap();
    } catch (error: any) {
      toast.error(
        error.message ||
          "An error occurred while submitting your application. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-xl">{error}</div>
      </div>
    );
  }

  if (!currentJob) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 text-xl">Job not found</div>
      </div>
    );
  }

  const job = currentJob as ExtendedJob;
  const deadlineStatus = getDeadlineStatus(job.applicationDeadline);
  const applicationEnabled = canApply(job);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
   
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {job.title}
                  </h2>
                  <div className="flex flex-wrap gap-4 text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin size={16} />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 size={16} />
                      {job.department}
                    </div>
                    <div className="flex items-center gap-1">
                      <Briefcase size={16} />
                      {job.employmentType}
                    </div>
                    {job.salary && (
                      <div className="flex items-center gap-1">
                        <DollarSign size={16} />
                        {job.salary}
                      </div>
                    )}
                  </div>
                </div>

                
                {job.applicationDeadline && (
                  <div
                    className={`mb-6 p-3 rounded-lg border ${
                      deadlineStatus.status === "passed"
                        ? "bg-red-50 border-red-200"
                        : deadlineStatus.status === "near"
                        ? "bg-orange-50 border-orange-200"
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={16} className={deadlineStatus.color} />
                      <span
                        className={`text-sm font-medium ${deadlineStatus.color}`}
                      >
                        {deadlineStatus.message}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Job Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {job.description}
                    </p>
                  </div>

                  {job.responsibilities && job.responsibilities.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Key Responsibilities
                      </h3>
                      <ul className="space-y-2">
                        {job.responsibilities.map((resp, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-2 text-gray-700"
                          >
                            <span className="text-blue-600 mt-1">•</span>
                            {resp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {job.skillsRequired && job.skillsRequired.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Required Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {job.skillsRequired.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {job.qualifications && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Qualifications
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {job.qualifications}
                      </p>
                    </div>
                  )}

                  <div className="pt-6">
                    {applicationEnabled ? (
                      <Dialog
                        open={showApplyModal}
                        onOpenChange={setShowApplyModal}
                      >
                        <DialogTrigger asChild>
                          <Button className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 rounded-lg font-semibold text-lg">
                            Apply Now
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-gray-900">
                              Apply for {job.title}
                            </DialogTitle>
                          </DialogHeader>

                          <form
                            onSubmit={handleSubmitApplication}
                            className="space-y-6"
                          >
                            {/* Form fields remain the same */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <Label htmlFor="name">Full Name *</Label>
                                <Input
                                  id="name"
                                  name="name"
                                  type="text"
                                  value={applicationData.name}
                                  onChange={handleInputChange}
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                  id="email"
                                  name="email"
                                  type="email"
                                  value={applicationData.email}
                                  onChange={handleInputChange}
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="phone">Phone *</Label>
                                <Input
                                  id="phone"
                                  name="phone"
                                  type="tel"
                                  value={applicationData.phone}
                                  onChange={handleInputChange}
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="location">Location *</Label>
                                <Input
                                  id="location"
                                  name="location"
                                  type="text"
                                  value={applicationData.location}
                                  onChange={handleInputChange}
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="space-y-2">
                                <Label htmlFor="portfolio">Portfolio URL</Label>
                                <Input
                                  id="portfolio"
                                  name="portfolio"
                                  type="url"
                                  value={applicationData.portfolio}
                                  onChange={handleInputChange}
                                  placeholder="https://"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="linkedin">LinkedIn</Label>
                                <Input
                                  id="linkedin"
                                  name="linkedin"
                                  type="url"
                                  value={applicationData.linkedin}
                                  onChange={handleInputChange}
                                  placeholder="https://linkedin.com/in/yourprofile"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="github">GitHub</Label>
                                <Input
                                  id="github"
                                  name="github"
                                  type="url"
                                  value={applicationData.github}
                                  onChange={handleInputChange}
                                  placeholder="https://github.com/yourprofile"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="coverLetter">Cover Letter</Label>
                              <Textarea
                                id="coverLetter"
                                name="coverLetter"
                                value={applicationData.coverLetter}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="Tell us why you're interested in this position..."
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="resume">Resume *</Label>
                              <Input
                                id="resume"
                                name="resume"
                                type="file"
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx"
                                required
                              />
                              <p className="text-sm text-gray-500">
                                Accepted formats: PDF, DOC, DOCX (Max: 5MB)
                              </p>
                            </div>

                            <div className="flex gap-3 justify-end pt-6">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowApplyModal(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                disabled={submitting}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                {submitting
                                  ? "Submitting..."
                                  : "Submit Application"}
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <Button
                        variant="destructive"
                        disabled
                        className="px-8 py-6 rounded-lg font-semibold text-lg cursor-not-allowed bg-red-100 text-red-600 hover:bg-red-100"
                      >
                        <Clock className="mr-2 h-5 w-5" />
                        {isDeadlinePassed(job.applicationDeadline)
                          ? "Application Closed"
                          : job.status !== "Active"
                          ? "Position Closed"
                          : "Applications Closed"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Job Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Building2 size={16} />
                    <span>
                      <strong>Department:</strong> {job.department}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Briefcase size={16} />
                    <span>
                      <strong>Type:</strong> {job.employmentType}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <FileText size={16} />
                    <span>
                      <strong>Experience:</strong> {job.experienceLevel}
                    </span>
                  </div>
                  {job.applicationDeadline && (
                    <div className="flex items-center gap-3">
                      <Clock
                        size={16}
                        className={
                          isDeadlinePassed(job.applicationDeadline)
                            ? "text-red-600"
                            : "text-gray-600"
                        }
                      />
                      <span
                        className={
                          isDeadlinePassed(job.applicationDeadline)
                            ? "text-red-600"
                            : "text-gray-600"
                        }
                      >
                        <strong>Deadline:</strong>{" "}
                        {new Date(job.applicationDeadline).toLocaleDateString()}
                        {isDeadlinePassed(job.applicationDeadline) && (
                          <span className="ml-1 text-red-600 font-semibold">
                            (Expired)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 text-gray-600">
                    <Calendar size={16} />
                    <span>
                      <strong>Posted:</strong>{" "}
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

         
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
