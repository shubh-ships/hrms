'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  FileText,
  Mail,
  Phone,
  Globe,
  Github,
  Linkedin,
  Calendar,
  Star,
  Edit,
  Eye,
  User,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  UserCheck,
  UserX,
  CalendarCheck,
  Download,
  Loader2,
  Settings,
  Zap
} from 'lucide-react';
import { useJobManagement } from '@/hooks/useJobs';

interface ApplicationStatusUpdateData {
  status: 'Applied' | 'Shortlisted' | 'Rejected' | 'Interview' | 'Hired';
  interviewDate?: string;
  interviewNotes?: string;
  rating?: number;
  notes?: string;
}

// FIXED Quick Status Change Menu Component
const QuickStatusMenu = ({ 
  application, 
  onStatusSelect,
  loading 
}: {
  application: any;
  onStatusSelect: (status: string) => void;
  loading: boolean;
}) => {
  const statusOptions = [
    { 
      value: 'Applied', 
      label: 'Applied', 
      icon: <User className="h-4 w-4" />,
      color: 'text-blue-600',
      description: 'Mark as received'
    },
    { 
      value: 'Shortlisted', 
      label: 'Shortlisted', 
      icon: <Star className="h-4 w-4" />,
      color: 'text-yellow-600',
      description: 'Move to next round'
    },
    { 
      value: 'Interview', 
      label: 'Interview', 
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-purple-600',
      description: 'Schedule interview'
    },
    { 
      value: 'Hired', 
      label: 'Hired', 
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-green-600',
      description: 'Offer accepted'
    },
    { 
      value: 'Rejected', 
      label: 'Rejected', 
      icon: <XCircle className="h-4 w-4" />,
      color: 'text-red-600',
      description: 'Application declined'
    }
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 p-0">
          <Zap className="h-4 w-4" />
          <span className="sr-only">Quick actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64"
        sideOffset={5}
      >
        <DropdownMenuLabel className="flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Quick Status Change
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="p-1">
          <div className="text-xs text-muted-foreground px-2 py-1 mb-1">
            Current: <span className="font-medium">{application?.status}</span>
          </div>
          
          {statusOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onStatusSelect(option.value)}
              disabled={loading || application?.status === option.value}
              className={`cursor-pointer transition-colors ${
                application?.status === option.value 
                  ? 'opacity-50 bg-muted/50' 
                  : 'hover:bg-muted'
              }`}
            >
              <div className="flex items-center gap-3 w-full">
                <div className={`${option.color} flex-shrink-0`}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {option.description}
                  </div>
                </div>
                {application?.status === option.value && (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Enhanced Application Status Update Dialog Component
export const ApplicationStatusUpdateDialog = ({ 
  open, 
  onClose, 
  application, 
  onUpdate, 
  loading 
}: {
  open: boolean;
  onClose: () => void;
  application: any;
  onUpdate: (id: string, data: ApplicationStatusUpdateData) => void;
  loading: boolean;
}) => {
  const [formData, setFormData] = useState<ApplicationStatusUpdateData>({
    status: 'Applied',
    interviewDate: '',
    interviewNotes: '',
    rating: undefined,
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (application) {
      setFormData({
        status: application.status || 'Applied',
        interviewDate: application.interviewDate 
          ? new Date(application.interviewDate).toISOString().slice(0, 16) 
          : '',
        interviewNotes: application.interviewNotes || '',
        rating: application.rating || undefined,
        notes: application.notes || ''
      });
    }
  }, [application]);

  const statusOptions = [
    { value: 'Applied', label: 'Applied', icon: <User className="h-4 w-4" />, description: 'Application received and under review' },
    { value: 'Shortlisted', label: 'Shortlisted', icon: <Star className="h-4 w-4" />, description: 'Candidate meets initial requirements' },
    { value: 'Interview', label: 'Interview', icon: <Calendar className="h-4 w-4" />, description: 'Schedule or conduct interview' },
    { value: 'Hired', label: 'Hired', icon: <CheckCircle className="h-4 w-4" />, description: 'Candidate selected for the position' },
    { value: 'Rejected', label: 'Rejected', icon: <XCircle className="h-4 w-4" />, description: 'Application unsuccessful' }
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (formData.status === 'Interview' && !formData.interviewDate) {
      newErrors.interviewDate = 'Interview date is required when status is Interview';
    }
    
    if (formData.interviewDate && new Date(formData.interviewDate) < new Date()) {
      newErrors.interviewDate = 'Interview date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm() || !application) return;
    
    onUpdate(application._id, formData);
  };

  const handleStatusChange = (newStatus: string) => {
    setFormData(prev => ({
      ...prev,
      status: newStatus as any,
      // Clear interview data if status is not Interview
      ...(newStatus !== 'Interview' && {
        interviewDate: '',
        interviewNotes: ''
      })
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {application?.candidate.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-xl">{application?.candidate.name}</DialogTitle>
              <DialogDescription>{application?.candidate.email}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Application Info */}
          <Card>
            <CardContent className="pt-4">
              <h3 className="font-medium mb-2">Applied Position</h3>
              <p className="text-sm mb-3">
                {typeof application?.job === 'object' ? application.job.title : 'Job Position'}
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">
                  <Calendar className="h-3 w-3 mr-1" />
                  Applied: {application ? new Date(application.applicationDate).toLocaleDateString() : ''}
                </Badge>
                {application?.candidate.location && (
                  <Badge variant="outline">
                    <MapPin className="h-3 w-3 mr-1" />
                    {application.candidate.location}
                  </Badge>
                )}
                <Badge variant="outline">
                  Current: {application?.status}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Status Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              <h3 className="text-lg font-semibold">Update Application Status</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {statusOptions.map((option) => (
                <Card 
                  key={option.value}
                  className={`cursor-pointer border-2 transition-colors ${
                    formData.status === option.value 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleStatusChange(option.value)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {option.icon}
                      <span className="font-medium">{option.label}</span>
                      {formData.status === option.value && (
                        <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Candidate Rating (Optional)
            </Label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-6 w-6 cursor-pointer ${
                    star <= (formData.rating || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, rating: star }))}
                />
              ))}
              {formData.rating && (
                <span className="text-sm text-muted-foreground ml-2">
                  {formData.rating}/5 stars
                </span>
              )}
            </div>
          </div>

          {/* Interview Scheduling */}
          {formData.status === 'Interview' && (
            <div className="space-y-4">
              <Separator />
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-5 w-5" />
                <h4 className="font-medium">Interview Scheduling</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interviewDate">Interview Date & Time *</Label>
                  <Input
                    id="interviewDate"
                    type="datetime-local"
                    value={formData.interviewDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, interviewDate: e.target.value }))}
                    className={errors.interviewDate ? 'border-destructive' : ''}
                  />
                  {errors.interviewDate && (
                    <p className="text-sm text-destructive">{errors.interviewDate}</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interviewNotes">Interview Notes</Label>
                <Textarea
                  id="interviewNotes"
                  value={formData.interviewNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, interviewNotes: e.target.value }))}
                  placeholder="Meeting details, interview format, special instructions, etc..."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Add specific instructions, meeting links, or preparation notes
                </p>
              </div>
            </div>
          )}

          {/* General Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes & Feedback</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Internal notes, feedback, next steps, concerns, etc..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              These notes are for internal use and help track the application progress
            </p>
          </div>

          {/* Previous Interview Info */}
          {formData.status !== 'Interview' && application?.interviewDate && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Previously Scheduled Interview</p>
                  <p>{new Date(application.interviewDate).toLocaleString()}</p>
                  {application.interviewNotes && (
                    <p className="text-sm text-muted-foreground">
                      Notes: {application.interviewNotes}
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
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
                <CheckCircle className="mr-2 h-4 w-4" />
                Update Status
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Application Details Dialog
export const ApplicationDetailsDialog = ({ open, onClose, application }: {
  open: boolean;
  onClose: () => void;
  application: any;
}) => {
  const handleDownloadResume = (url: string, fileName?: string) => {
    if (!url) return;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'resume.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                {application?.candidate.name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <DialogTitle className="text-2xl">{application?.candidate.name}</DialogTitle>
              <DialogDescription className="text-lg">{application?.candidate.email}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Job Information */}
            <Card>
              <CardHeader>
                <CardTitle>Applied Position</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium mb-3">
                  {typeof application?.job === 'object' ? application.job?.title : 'Job Position'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    Applied: {application ? new Date(application.applicationDate).toLocaleDateString() : ''}
                  </Badge>
                  <Badge
                    variant={
                      application?.status === 'Applied' ? 'secondary' :
                      application?.status === 'Shortlisted' ? 'default' :
                      application?.status === 'Interview' ? 'outline' :
                      application?.status === 'Hired' ? 'default' : 'destructive'
                    }
                  >
                    {application?.status === 'Applied' ? <User className="h-3 w-3 mr-1" /> :
                     application?.status === 'Shortlisted' ? <Star className="h-3 w-3 mr-1" /> :
                     application?.status === 'Interview' ? <Calendar className="h-3 w-3 mr-1" /> :
                     application?.status === 'Hired' ? <CheckCircle className="h-3 w-3 mr-1" /> :
                     <XCircle className="h-3 w-3 mr-1" />}
                    {application?.status}
                  </Badge>
                  {application?.rating && (
                    <Badge variant="outline">
                      <Star className="h-3 w-3 mr-1" />
                      Rating: {application.rating}/5
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{application?.candidate.email}</span>
                  </div>
                  {application?.candidate.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{application.candidate.phone}</span>
                    </div>
                  )}
                  {application?.candidate.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{application.candidate.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Portfolio & Social Links */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Links & Portfolio</h3>
                <div className="space-y-2">
                  {application?.candidate.portfolio && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full justify-start"
                    >
                      <a href={application.candidate.portfolio} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4 mr-2" />
                        Portfolio Website
                      </a>
                    </Button>
                  )}
                  {application?.candidate.linkedin && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full justify-start"
                    >
                      <a href={application.candidate.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-4 w-4 mr-2" />
                        LinkedIn Profile
                      </a>
                    </Button>
                  )}
                  {application?.candidate.github && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="w-full justify-start"
                    >
                      <a href={application.candidate.github} target="_blank" rel="noopener noreferrer">
                        <Github className="h-4 w-4 mr-2" />
                        GitHub Profile
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Resume Section */}
            {application?.resume?.url && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Resume
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleDownloadResume(
                        application.resume.url, 
                        `${application.candidate.name.replace(/\s+/g, '_')}_Resume.pdf`
                      )}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Resume
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(application.resume.url, '_blank')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Online
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cover Letter */}
            {application?.coverLetter && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Cover Letter</h3>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded max-h-48 overflow-auto">
                      {application.coverLetter}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Interview Information */}
            {application?.interviewDate && (
              <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <Calendar className="h-5 w-5" />
                    Interview Scheduled
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Date & Time:</strong> {new Date(application.interviewDate).toLocaleString()}</p>
                    {application.interviewNotes && (
                      <div>
                        <p className="font-medium mb-1">Interview Notes:</p>
                        <p className="text-sm pl-3 border-l-2 border-blue-300">
                          {application.interviewNotes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes Section */}
            {application?.notes && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Internal Notes</h3>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded">
                      {application.notes}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Application Timeline */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Application Timeline</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">Applied</Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(application?.applicationDate || '').toLocaleString()}
                  </span>
                </div>
                {application?.interviewDate && (
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">Interview Scheduled</Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(application.interviewDate).toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      application?.status === 'Applied' ? 'secondary' :
                      application?.status === 'Shortlisted' ? 'default' :
                      application?.status === 'Interview' ? 'outline' :
                      application?.status === 'Hired' ? 'default' : 'destructive'
                    }
                  >
                    Current: {application?.status}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Last updated: {new Date(application?.updatedAt || application?.createdAt || '').toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Main All Applications Management Component
const AllApplicationsManagement = () => {
  const {
    organizationApplications,
    organizationApplicationsCount,
    fetchOrganizationApplications,
    updateAppStatus,
    loading,
    error,
    success,
    clearErrors,
    clearSuccessState
  } = useJobManagement();

  const [statusDialog, setStatusDialog] = useState<{ open: boolean; application: any }>({
    open: false,
    application: null
  });

  const [detailsDialog, setDetailsDialog] = useState<{ open: boolean; application: any }>({
    open: false,
    application: null
  });

  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchOrganizationApplications();
  }, [fetchOrganizationApplications]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearErrors();
    }
    
    if (success) {
      toast.success('Application status updated successfully');
      clearSuccessState();
      setStatusDialog({ open: false, application: null });
    }
  }, [error, success, clearErrors, clearSuccessState]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Applied': return 'secondary';
      case 'Shortlisted': return 'default';
      case 'Interview': return 'outline';
      case 'Hired': return 'default';
      case 'Rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: React.ReactNode } = {
      Applied: <User className="h-3 w-3" />,
      Shortlisted: <Star className="h-3 w-3" />,
      Interview: <Calendar className="h-3 w-3" />,
      Hired: <CheckCircle className="h-3 w-3" />,
      Rejected: <XCircle className="h-3 w-3" />
    };
    return icons[status] || <AlertCircle className="h-3 w-3" />;
  };

  const handleStatusUpdate = async (applicationId: string, updateData: ApplicationStatusUpdateData) => {
    try {
      await updateAppStatus(applicationId, updateData);
      await fetchOrganizationApplications();
    } catch (error) {
      // Error handled by useEffect
    }
  };

  // FIXED: Simplified quick status change handler
  const handleQuickStatusChange = async (application: any, status: string) => {
    const updateData: ApplicationStatusUpdateData = {
      status: status as any,
      notes: application.notes,
      rating: application.rating
    };
    
    await handleStatusUpdate(application._id, updateData);
  };

  const handleDownloadResume = (url: string, candidateName: string) => {
    if (!url) return;
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${candidateName.replace(/\s+/g, '_')}_Resume.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter applications by status for tabs
  const getFilteredApplications = () => {
    switch (activeTab) {
      case 'all': return organizationApplications;
      case 'applied': return organizationApplications.filter(app => app.status === 'Applied');
      case 'shortlisted': return organizationApplications.filter(app => app.status === 'Shortlisted');
      case 'interview': return organizationApplications.filter(app => app.status === 'Interview');
      case 'hired': return organizationApplications.filter(app => app.status === 'Hired');
      case 'rejected': return organizationApplications.filter(app => app.status === 'Rejected');
      default: return organizationApplications;
    }
  };

  const filteredApplications = getFilteredApplications();

  const getTabCounts = () => {
    return {
      total: organizationApplications.length,
      applied: organizationApplications.filter(app => app.status === 'Applied').length,
      shortlisted: organizationApplications.filter(app => app.status === 'Shortlisted').length,
      interview: organizationApplications.filter(app => app.status === 'Interview').length,
      hired: organizationApplications.filter(app => app.status === 'Hired').length,
      rejected: organizationApplications.filter(app => app.status === 'Rejected').length,
    };
  };

  const counts = getTabCounts();

  if (loading && organizationApplications.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2">
          All Applications ({organizationApplicationsCount})
        </h1>
        <p className="text-muted-foreground mb-4">
          Manage all job applications across your organization
        </p>
        
        {/* Instructions Card */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <h3 className="font-medium text-blue-800 dark:text-blue-200">
                How to Update Application Status
              </h3>
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p>• Click the <strong>Eye icon</strong> to view full application details</p>
              <p>• Click the <strong>status badge</strong> for detailed status update with interview scheduling</p>
              <p>• Click the <strong>⚡ Quick Action button</strong> for fast status changes</p>
              <p>• Click the <strong>File icon</strong> to download the candidate's resume</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="all">All ({counts.total})</TabsTrigger>
          <TabsTrigger value="applied">Applied ({counts.applied})</TabsTrigger>
          <TabsTrigger value="shortlisted">Shortlisted ({counts.shortlisted})</TabsTrigger>
          <TabsTrigger value="interview">Interview ({counts.interview})</TabsTrigger>
          <TabsTrigger value="hired">Hired ({counts.hired})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({counts.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  No applications found
                </h3>
                <p className="text-sm text-muted-foreground">
                  {activeTab === 'all' 
                    ? 'Applications will appear here once candidates start applying'
                    : `No applications with ${activeTab} status`
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Applications ({filteredApplications.length})</CardTitle>
                <CardDescription>
                  Manage and review applications for all job positions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidate</TableHead>
                        <TableHead>Job Position</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applied Date</TableHead>
                        <TableHead>Interview Date</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead className="w-56">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredApplications.map((application) => (
                        <TableRow key={application._id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {application.candidate.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{application.candidate.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {application.candidate.email}
                                </p>
                                {application.candidate.location && (
                                  <p className="text-xs text-muted-foreground">
                                    {application.candidate.location}
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          
                          <TableCell>
                            <p className="text-sm">
                              {typeof application.job === 'object' ? application.job?.title : 'Job Position'}
                            </p>
                          </TableCell>
                          
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant={getStatusVariant(application.status)}
                                    className="cursor-pointer flex items-center gap-1 w-fit"
                                    onClick={() => setStatusDialog({ open: true, application })}
                                  >
                                    {getStatusIcon(application.status)}
                                    {application.status}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>Click for detailed status update</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          
                          <TableCell>
                            <p className="text-sm">
                              {new Date(application.applicationDate).toLocaleDateString()}
                            </p>
                          </TableCell>
                          
                          <TableCell>
                            {application.interviewDate ? (
                              <div className="space-y-1">
                                <p className="text-sm">
                                  {new Date(application.interviewDate).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(application.interviewDate).toLocaleTimeString()}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Not scheduled</p>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {application.rating ? (
                              <div className="flex items-center gap-1">
                                <div className="flex">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                      key={star}
                                      className={`h-3 w-3 ${
                                        star <= (application.rating ?? 0)
                                          ? 'fill-yellow-400 text-yellow-400'
                                          : 'text-muted-foreground'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  ({application.rating})
                                </span>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Not rated</p>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {/* FIXED Quick Action - Now working properly */}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div>
                                      <QuickStatusMenu
                                        application={application}
                                        onStatusSelect={(status) => handleQuickStatusChange(application, status)}
                                        loading={loading}
                                      />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>Quick status change</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setDetailsDialog({ open: true, application })}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View full details</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setStatusDialog({ open: true, application })}
                                    >
                                      <Settings className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Detailed status update</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              
                              {application.resume?.url && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDownloadResume(application.resume.url, application.candidate.name)}
                                      >
                                        <FileText className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Download Resume</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Status Update Dialog */}
      <ApplicationStatusUpdateDialog
        open={statusDialog.open}
        onClose={() => setStatusDialog({ open: false, application: null })}
        application={statusDialog.application}
        onUpdate={handleStatusUpdate}
        loading={loading}
      />

      {/* Application Details Dialog */}
      <ApplicationDetailsDialog
        open={detailsDialog.open}
        onClose={() => setDetailsDialog({ open: false, application: null })}
        application={detailsDialog.application}
      />
    </div>
  );
};

export default AllApplicationsManagement;
