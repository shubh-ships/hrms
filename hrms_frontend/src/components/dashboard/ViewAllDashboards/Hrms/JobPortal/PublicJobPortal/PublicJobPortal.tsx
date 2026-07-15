"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Clock,
  Building2,
  Users,
  ArrowRight,
  Loader2,
  Sparkles,
  Target,
  Globe,
  Star,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { useJobManagement } from "@/hooks/useJobs";

interface PublicJobPortalProps {
  orgAlias: string;
  organization: any;
}

const PublicJobPortal: React.FC<PublicJobPortalProps> = ({
  orgAlias,
  organization,
}) => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { fetchOrganizationJobs, loading: jobsLoading } = useJobManagement();

  useEffect(() => {
    fetchPublicJobs();
  }, [orgAlias]);

  const fetchPublicJobs = async () => {
    try {
      setLoading(true);
      const result = await fetchOrganizationJobs(orgAlias);
      const payload = (result as { payload?: { jobs?: any[] } }).payload;

      if (payload && payload.jobs) {
        const activeJobs = payload.jobs.filter(
          (job: any) => job.status === "Active"
        );
        setJobs(activeJobs);
      } else {
        setError("Failed to load jobs");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  if (loading || jobsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-blue-100/20 animate-pulse"></div>
          </div>
          <p className="text-slate-600 font-medium">
            Loading career opportunities...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-4">
        <div className="container mx-auto max-w-2xl pt-20">
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Hero Section - Compact and Modern */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 "></div>
        <div className="container mx-auto px-4 py-16 sm:py-10 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-md font-medium mb-6">
              <Building2 className="h-5 w-5" />
              <span>{organization?.name}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                We're Hiring
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-8">
              {organization?.description ||
                "Join our team and build something amazing together"}
            </p>
          </div>
        </div>
      </div>

      {/* Jobs Section */}
      <div className="container mx-auto px-4 pb-20">
        {jobs.length > 0 ? (
          <>
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
                Open Positions
              </h2>
              <p className="text-slate-600">
                Find your perfect role and apply today
              </p>
            </div>

            {/* Updated Grid Layout - 3 columns on desktop, 2 on tablet, 1 on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {jobs.map((job, index) => (
                <CompactJobCard
                  key={job._id}
                  job={job}
                  orgAlias={orgAlias}
                  index={index}
                  onApply={() => {
                    window.open(
                      `/career/${orgAlias}/jobs/${job._id}`,
                      "_blank"
                    );
                  }}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-6">
              <Sparkles className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No Open Positions
            </h3>
            <p className="text-slate-600 max-w-sm mx-auto">
              We're not actively hiring right now, but check back soon for new
              opportunities!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Compact Job Card Component for 3-column layout
interface CompactJobCardProps {
  job: any;
  orgAlias: string;
  index: number;
  onApply: () => void;
}

const CompactJobCard: React.FC<CompactJobCardProps> = ({
  job,
  orgAlias,
  index,
  onApply,
}) => {
  const formatSalary = (salaryRange: any) => {
    if (!salaryRange?.min || !salaryRange?.max) return null;
    return `${
      salaryRange.currency
    } ${salaryRange.min.toLocaleString()} - ${salaryRange.max.toLocaleString()}`;
  };

  const isDeadlineNear = (deadline: string) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isDeadlinePassed = (deadline: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  const isNew = () => {
    const createdDate = new Date(job.createdAt);
    const now = new Date();
    const diffTime = now.getTime() - createdDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  return (
    <Card
      className="group hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm hover:bg-white hover:-translate-y-1 cursor-pointer overflow-hidden h-full flex flex-col"
      style={{ animationDelay: `${index * 100}ms` }}
      onClick={() =>
        window.open(`/career/${orgAlias}/jobs/${job._id}`, "_blank")
      }
    >
      <CardContent className="p-6 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                <span
                  className="block overflow-hidden"
                  style={{
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                    lineHeight: "1.4em",
                    maxHeight: "2.8em",
                    visibility: "visible",
                  }}
                >
                  {job.title}
                </span>
              </h3>
              {isNew() && (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs px-2 py-1 flex-shrink-0">
                  <Zap className="h-3 w-3 mr-1" />
                  New
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Location and Department */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 mb-4">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Briefcase className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{job.department || "Various"}</span>
          </div>
        </div>

        {/* Salary */}
        {job.salaryRange?.min && (
          <div className="flex items-center gap-1 text-sm text-slate-700 font-medium mb-4">
            <DollarSign className="h-4 w-4 flex-shrink-0" />
            <span>{formatSalary(job.salaryRange)}</span>
          </div>
        )}

        {/* Description - Fixed line-clamp issue */}
        <div className="flex-1 mb-4">
          <p
            className="text-slate-600 text-sm leading-relaxed overflow-hidden"
            style={{
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
              lineHeight: "1.5em",
              maxHeight: "4.5em",
              visibility: "visible",
              wordBreak: "break-word",
            }}
          >
            {job.description}
          </p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary" className="text-xs font-medium">
            {job.employmentType}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {job.experienceLevel}
          </Badge>
          {isDeadlineNear(job.applicationDeadline) && (
            <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 text-xs">
              <Clock className="h-3 w-3 mr-1" />
              Urgent
            </Badge>
          )}
        </div>

        {/* Skills */}
        {job.skillsRequired && job.skillsRequired.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {job.skillsRequired
                .slice(0, 3)
                .map((skill: string, idx: number) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="text-xs px-2 py-1 h-6"
                  >
                    {skill}
                  </Badge>
                ))}
              {job.skillsRequired.length > 3 && (
                <Badge variant="outline" className="text-xs px-2 py-1 h-6">
                  +{job.skillsRequired.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Bottom Section */}
        <div className="mt-auto space-y-4">
          {/* Meta Info */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{job.numberOfOpenings} opening(s)</span>
            </div>

            {job.applicationDeadline && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span
                  className={
                    isDeadlinePassed(job.applicationDeadline)
                      ? "text-red-600 font-medium"
                      : isDeadlineNear(job.applicationDeadline)
                      ? "text-orange-600 font-medium"
                      : "text-slate-500"
                  }
                >
                  {new Date(job.applicationDeadline).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white group/btn"
            disabled={isDeadlinePassed(job.applicationDeadline)}
            onClick={(e) => {
              e.stopPropagation();
              onApply();
            }}
          >
            {isDeadlinePassed(job.applicationDeadline) ? (
              <>
                <Clock className="h-4 w-4 mr-2" />
                Closed
              </>
            ) : (
              <>
                Apply Now
                <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-0.5 transition-transform" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PublicJobPortal;
