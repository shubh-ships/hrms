"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus, Trash2, Clock, Edit, Save, X, Sun, Moon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  fetchOfficeTiming,
  createOfficeTiming,
  updateOfficeTiming,
  selectOfficeTiming,
  selectShifts,
  selectOrganizationTimingLoading,
  selectOrganizationTimingError,
  type Shift,
  type BreakTime
} from "@/features/organizationTiming/organizationTimingSlice";
import { AppDispatch, RootState } from "@/store";

// Time utilities with UTC to IST conversion for GET responses only
const timeUtils = {
  // Convert UTC time to IST for display ONLY (GET response)
  utcToIst: (utcTime: string): string => {
    if (!utcTime) return '00:00';
    
    try {
      // If it's already in HH:MM format, convert from UTC to IST
      if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(utcTime)) {
        const [hours, minutes] = utcTime.split(':').map(Number);
        
        // Add 5 hours 30 minutes for IST conversion
        let istHours = hours + 5;
        let istMinutes = minutes + 30;
        
        // Handle minute overflow
        if (istMinutes >= 60) {
          istHours += 1;
          istMinutes -= 60;
        }
        
        // Handle hour overflow (next day)
        if (istHours >= 24) {
          istHours -= 24;
        }
        
        return `${istHours.toString().padStart(2, '0')}:${istMinutes.toString().padStart(2, '0')}`;
      }
      
      // If it's ISO string format
      if (utcTime.includes('T') || utcTime.includes('Z')) {
        const date = new Date(utcTime);
        if (isNaN(date.getTime())) return '00:00';
        
        // Convert to IST using toLocaleString
        const istTime = date.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit'
        });
        
        return istTime;
      }
      
      return utcTime;
    } catch (error) {
      console.error('Error converting UTC to IST:', error);
      return '00:00';
    }
  },

  // Format time for display - convert UTC response to IST for display
  formatForDisplay: (time: string): string => {
    if (!time) return '00:00';
    
    // Convert UTC time from GET response to IST for display
    return timeUtils.utcToIst(time);
  },

  // Format for 12-hour display
  formatTo12Hour: (time: string): string => {
    if (!time || !timeUtils.isValidTimeFormat(time)) return time;
    
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      
      return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    } catch {
      return time;
    }
  },

  // Validate time format
  isValidTimeFormat: (time: string): boolean => {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  }
};



// Validation schemas
const breakTimeSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, "Break name is required"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
});

const shiftSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, "Shift name is required"),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  breaks: z.array(breakTimeSchema),
});

const officeTimingSchema = z.object({
  shifts: z.array(shiftSchema).min(1, "At least one shift is required"),
});

type OfficeTimingFormData = z.infer<typeof officeTimingSchema>;

const OfficeTimingManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const officeTiming = useSelector(selectOfficeTiming);
  const shifts = useSelector(selectShifts);
  const loading = useSelector(selectOrganizationTimingLoading);
  const error = useSelector(selectOrganizationTimingError);
 

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<OfficeTimingFormData>({
    resolver: zodResolver(officeTimingSchema),
    defaultValues: {
      shifts: [
        {
          name: "",
          startTime: "09:00",
          endTime: "18:00",
          breaks: [],
        },
      ],
    },
  });

  const { fields: shiftFields, append: appendShift, remove: removeShift, replace } = useFieldArray({
    control: form.control,
    name: "shifts",
  });

  // Load office timing on component mount
  useEffect(() => {
    dispatch(fetchOfficeTiming());
  }, [dispatch]);

  // Update form when office timing data is loaded - Convert UTC to IST for form display
  useEffect(() => {
    if (officeTiming?.shifts && officeTiming.shifts.length > 0) {
   
      
      const formattedShifts = officeTiming.shifts.map(shift => {
        const istStartTime = timeUtils.formatForDisplay(shift.startTime);
        const istEndTime = timeUtils.formatForDisplay(shift.endTime);
        
     
        
        return {
          _id: shift._id,
          name: shift.name,
          startTime: istStartTime, // UTC to IST conversion for form
          endTime: istEndTime, // UTC to IST conversion for form
          breaks: shift.breaks.map(breakTime => {
            const istBreakStart = timeUtils.formatForDisplay(breakTime.startTime);
            const istBreakEnd = timeUtils.formatForDisplay(breakTime.endTime);
            
            return {
              _id: breakTime._id,
              name: breakTime.name,
              startTime: istBreakStart, // UTC to IST conversion
              endTime: istBreakEnd, // UTC to IST conversion
            };
          }),
        };
      });
      
      replace(formattedShifts);
    }
  }, [officeTiming, replace]);

  const onSubmit = async (data: OfficeTimingFormData) => {
    try {
      // Send data as is (IST format) - NO conversion needed for CREATE/UPDATE
      const formattedData = {
        shifts: data.shifts.map(shift => ({
          _id: shift._id,
          name: shift.name,
          startTime: shift.startTime, // Send IST time directly
          endTime: shift.endTime, // Send IST time directly
          breaks: shift.breaks.map(breakTime => ({
            _id: breakTime._id,
            name: breakTime.name,
            startTime: breakTime.startTime, // Send IST time directly
            endTime: breakTime.endTime, // Send IST time directly
          })),
        })),
      };

    

      if (officeTiming) {
        await dispatch(updateOfficeTiming(formattedData)).unwrap();
      } else {
        await dispatch(createOfficeTiming(formattedData)).unwrap();
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to save office timing:", error);
    }
  };

  const formatDuration = (startTime: string, endTime: string): string => {
    try {
      const start = new Date(`1970-01-01T${startTime}:00`);
      let end = new Date(`1970-01-01T${endTime}:00`);
      
      if (end <= start) {
        end = new Date(`1970-01-02T${endTime}:00`);
      }
      
      const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      const hours = Math.floor(diff);
      const minutes = Math.round((diff - hours) * 60);
      
      if (minutes > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${hours}h`;
    } catch {
      return "0h";
    }
  };

  const getTotalBreakTime = (breaks: BreakTime[]): number => {
    return breaks.reduce((total, breakTime) => {
      try {
        // Convert UTC break times to IST for calculation
        const istStartTime = timeUtils.formatForDisplay(breakTime.startTime);
        const istEndTime = timeUtils.formatForDisplay(breakTime.endTime);
        
        const start = new Date(`1970-01-01T${istStartTime}:00`);
        const end = new Date(`1970-01-01T${istEndTime}:00`);
        return total + (end.getTime() - start.getTime()) / (1000 * 60);
      } catch {
        return total;
      }
    }, 0);
  };

  const ShiftFormFields: React.FC<{ shiftIndex: number }> = ({ shiftIndex }) => {
    const { fields: breakFields, append: appendBreak, remove: removeBreak } = useFieldArray({
      control: form.control,
      name: `shifts.${shiftIndex}.breaks`,
    });

    return (
      <Card className="p-4 border-border bg-card">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name={`shifts.${shiftIndex}.name`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Shift Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Morning Shift" 
                      className="bg-background border-border text-foreground"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`shifts.${shiftIndex}.startTime`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Start Time (IST)</FormLabel>
                  <FormControl>
                    <Input 
                      type="time" 
                      className="bg-background border-border text-foreground"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`shifts.${shiftIndex}.endTime`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">End Time (IST)</FormLabel>
                  <FormControl>
                    <Input 
                      type="time" 
                      className="bg-background border-border text-foreground"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-foreground">Break Times</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-border text-foreground hover:bg-accent"
                onClick={() => appendBreak({ name: "", startTime: "12:00", endTime: "13:00" })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Break
              </Button>
            </div>

            {breakFields.map((breakField, breakIndex) => (
              <div key={breakField.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 border border-border rounded-md bg-muted/30">
                <FormField
                  control={form.control}
                  name={`shifts.${shiftIndex}.breaks.${breakIndex}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-foreground">Break Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Lunch" 
                          className="bg-background border-border text-foreground"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`shifts.${shiftIndex}.breaks.${breakIndex}.startTime`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-foreground">Start Time (IST)</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          className="bg-background border-border text-foreground"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`shifts.${shiftIndex}.breaks.${breakIndex}.endTime`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-foreground">End Time (IST)</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          className="bg-background border-border text-foreground"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeBreak(breakIndex)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {shiftFields.length > 1 && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => removeShift(shiftIndex)}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove Shift
            </Button>
          )}
        </div>
      </Card>
    );
  };

  const resetForm = () => {
    if (officeTiming?.shifts) {
      const formattedShifts = officeTiming.shifts.map(shift => ({
        _id: shift._id,
        name: shift.name,
        startTime: timeUtils.formatForDisplay(shift.startTime), // UTC to IST for form
        endTime: timeUtils.formatForDisplay(shift.endTime), // UTC to IST for form
        breaks: shift.breaks.map(breakTime => ({
          _id: breakTime._id,
          name: breakTime.name,
          startTime: timeUtils.formatForDisplay(breakTime.startTime), // UTC to IST
          endTime: timeUtils.formatForDisplay(breakTime.endTime), // UTC to IST
        })),
      }));
      replace(formattedShifts);
    } else {
      form.reset({
        shifts: [
          {
            name: "",
            startTime: "09:00",
            endTime: "18:00",
            breaks: [],
          },
        ],
      });
    }
  };

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Office Timing Management</h1>
            <p className="text-muted-foreground">
              Manage shifts and break times for your organization (All times displayed in IST)
            </p>
          </div>
          
          <div className="flex items-center gap-4">
         
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  {officeTiming ? <Edit className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  {officeTiming ? "Edit Timing" : "Create Timing"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] bg-background border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">
                    {officeTiming ? "Edit Office Timing" : "Create Office Timing"}
                  </DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh]">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
                      <div className="space-y-4">
                        {shiftFields.map((field, index) => (
                          <ShiftFormFields key={field.id} shiftIndex={index} />
                        ))}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => appendShift({
                          name: "",
                          startTime: "09:00",
                          endTime: "18:00",
                          breaks: [],
                        })}
                        className="w-full border-border text-foreground hover:bg-accent"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Another Shift
                      </Button>

                      <Separator className="bg-border" />

                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="border-border text-foreground hover:bg-accent"
                          onClick={() => {
                            setIsDialogOpen(false);
                            resetForm();
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={loading}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {loading ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="border-destructive bg-destructive/10">
            <AlertDescription className="text-destructive-foreground">{error}</AlertDescription>
          </Alert>
        )}

        {loading && !isDialogOpen && (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {!loading && shifts.length === 0 && !error && (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center h-48 space-y-4">
              <Clock className="w-12 h-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-lg font-medium text-foreground">No Office Timing Configured</p>
                <p className="text-muted-foreground">Create shifts and break times for your organization</p>
              </div>
            </CardContent>
          </Card>
        )}

        {!loading && shifts.length > 0 && (
          <div className="grid gap-6">
            {shifts.map((shift, index) => {
              // Convert UTC times from GET response to IST for display
              const displayStartTime = timeUtils.formatForDisplay(shift.startTime);
              const displayEndTime = timeUtils.formatForDisplay(shift.endTime);
              const startTime12h = timeUtils.formatTo12Hour(displayStartTime);
              const endTime12h = timeUtils.formatTo12Hour(displayEndTime);
              
              
              return (
                <Card key={shift._id || index} className="hover:shadow-md transition-shadow bg-card border-border">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-foreground">{shift.name}</span>
                        <Badge variant="secondary" className="font-mono bg-secondary text-secondary-foreground">
                          {formatDuration(displayStartTime, displayEndTime)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {startTime12h} - {endTime12h} IST
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {shift.breaks.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm flex items-center text-foreground">
                          <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                          Break Times ({shift.breaks.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {shift.breaks.map((breakTime, breakIndex) => {
                            // Convert UTC break times to IST for display
                            const displayBreakStart = timeUtils.formatForDisplay(breakTime.startTime);
                            const displayBreakEnd = timeUtils.formatForDisplay(breakTime.endTime);
                            const breakStart12h = timeUtils.formatTo12Hour(displayBreakStart);
                            const breakEnd12h = timeUtils.formatTo12Hour(displayBreakEnd);
                            
                            return (
                              <div 
                                key={`${breakTime._id || breakIndex}`} 
                                className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
                              >
                                <div>
                                  <p className="font-medium text-sm text-orange-900 dark:text-orange-100">{breakTime.name}</p>
                                  <p className="text-xs text-orange-700 dark:text-orange-300 font-mono">
                                    {breakStart12h} - {breakEnd12h} IST
                                  </p>
                                </div>
                                <Badge variant="outline" className="text-xs border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200">
                                  {formatDuration(displayBreakStart, displayBreakEnd)}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 p-2 bg-muted/50 rounded text-sm text-muted-foreground border-l-4 border-blue-500">
                          <strong>Total break time:</strong> {Math.round(getTotalBreakTime(shift.breaks))} minutes
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center p-6 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                        <p className="text-muted-foreground text-sm">No break times configured for this shift</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficeTimingManagement;
