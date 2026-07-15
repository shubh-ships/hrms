"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  CalendarDays,
  Gift,
  Flag,
  Edit,
  Trash2,
  Plus,
  Loader2,
  X,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getHolidays,
  createHoliday,
  updateHoliday,
  clearHolidayError,
} from "@/features/holiday/holidaySlice";

interface HolidayFormData {
  name: string;
  description: string;
  date: string;
  isRecurring: boolean;
  type: 'national' | 'festival' | 'optional';
}

const initialHolidayData: HolidayFormData = {
  name: '',
  description: '',
  date: '',
  isRecurring: false,
  type: 'national',
};

export default function HolidayManagement() {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<any>(null);
  const [updatingHolidayId, setUpdatingHolidayId] = useState<string | null>(null);

  // Multiple holidays state for bulk creation
  const [holidayForms, setHolidayForms] = useState<HolidayFormData[]>([initialHolidayData]);

  const { holidays, loading, createLoading, updateLoading, error } = useAppSelector(
    (state) => state.holiday
  );

  useEffect(() => {
    dispatch(getHolidays());
  }, [dispatch]);

  useEffect(() => {
    return () => {
      dispatch(clearHolidayError());
    };
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearHolidayError());
    }
  }, [error, dispatch]);

  // Metrics calculation
  const metrics = useMemo(() => ({
    total: holidays.length,
    national: holidays.filter(h => h.type === 'national').length,
    festival: holidays.filter(h => h.type === 'festival').length,
    optional: holidays.filter(h => h.type === 'optional').length,
  }), [holidays]);

  // Filtering holidays
  const filteredHolidays = useMemo(() =>
    holidays.filter((holiday) =>
      holiday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (holiday.description && holiday.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [holidays, searchTerm]
  );

  // Handle form field changes for multiple holidays
  const handleInputChange = (index: number, field: string, value: string | boolean) => {
    const updatedForms = holidayForms.map((form, i) => 
      i === index ? { ...form, [field]: value } : form
    );
    setHolidayForms(updatedForms);
  };

  // Add new holiday form
  const addHolidayForm = () => {
    setHolidayForms([...holidayForms, { ...initialHolidayData }]);
  };

  // Remove holiday form
  const removeHolidayForm = (index: number) => {
    if (holidayForms.length > 1) {
      const updatedForms = holidayForms.filter((_, i) => i !== index);
      setHolidayForms(updatedForms);
    }
  };

  // Duplicate holiday form
  const duplicateHolidayForm = (index: number) => {
    const formToDuplicate = { ...holidayForms[index] };
    const updatedForms = [
      ...holidayForms.slice(0, index + 1),
      formToDuplicate,
      ...holidayForms.slice(index + 1)
    ];
    setHolidayForms(updatedForms);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation for all forms
    for (let i = 0; i < holidayForms.length; i++) {
      const form = holidayForms[i];
      if (!form.name.trim()) {
        toast.error(`Holiday name is required for item ${i + 1}`);
        return;
      }
      if (!form.date) {
        toast.error(`Date is required for item ${i + 1}`);
        return;
      }
    }

    setUpdatingHolidayId(editingHoliday?._id || 'new');

    try {
      if (editingHoliday) {
        // Single holiday update
        const singleForm = holidayForms[0];
        await dispatch(updateHoliday({
           id: editingHoliday._id,
  _id: editingHoliday._id, 
          ...singleForm
        })).unwrap();
        toast.success("Holiday updated successfully");
      } else {
        // Bulk holiday creation
        const holidaysToCreate = holidayForms.filter(form => 
          form.name.trim() && form.date
        );

        if (holidaysToCreate.length === 0) {
          toast.error("At least one valid holiday is required");
          return;
        }

        if (holidaysToCreate.length === 1) {
          await dispatch(createHoliday(holidaysToCreate[0])).unwrap();
          toast.success("Holiday created successfully");
        } else {
          await dispatch(createHoliday(holidaysToCreate)).unwrap();
          toast.success(`${holidaysToCreate.length} holidays created successfully`);
        }
      }

      handleCloseForm();
      dispatch(getHolidays());
    } catch (error: any) {
      toast.error(error || "Operation failed");
    } finally {
      setUpdatingHolidayId(null);
    }
  };

  const handleEdit = (holiday: any) => {
    setEditingHoliday(holiday);
    setHolidayForms([{
      name: holiday.name,
      description: holiday.description || '',
      date: holiday.date.split('T')[0],
      isRecurring: holiday.isRecurring,
      type: holiday.type,
    }]);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setHolidayForms([initialHolidayData]);
    setEditingHoliday(null);
    setShowForm(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'national':
        return <Flag className="h-4 w-4" />;
      case 'festival':
        return <Gift className="h-4 w-4" />;
      case 'optional':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'national':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200';
      case 'festival':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200';
      case 'optional':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-background text-foreground">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Holiday Management</h1>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Holiday
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { 
            icon: CalendarDays, 
            title: metrics.total, 
            label: "Total Holidays"
          },
          { 
            icon: Flag, 
            title: metrics.national, 
            label: "National"
          },
          { 
            icon: Gift, 
            title: metrics.festival, 
            label: "Festival"
          },
          { 
            icon: Calendar, 
            title: metrics.optional, 
            label: "Optional"
          },
        ].map(({ icon: Icon, title, label }, index) => (
          <Card key={index} className="bg-card border-border">
            <CardHeader className="items-center flex justify-center flex-col">
              <Icon className="text-muted-foreground" />
              <CardTitle className="text-foreground">{title}</CardTitle>
              <p className="text-sm text-muted-foreground">{label}</p>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <Input
          placeholder="Search holidays by name or description..."
          className="md:w-1/3 bg-input text-foreground border-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Holidays Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl font-semibold text-foreground">
                All Holidays
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Overview of all holidays in the organization
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-muted/50">
                  <TableHead className="text-foreground w-[20%]">Holiday Name</TableHead>
                  <TableHead className="text-foreground w-[15%]">Date</TableHead>
                  <TableHead className="text-foreground w-[12%]">Type</TableHead>
                  <TableHead className="text-foreground w-[10%]">Recurring</TableHead>
                  <TableHead className="text-foreground w-[33%]">Description</TableHead>
                  <TableHead className="text-foreground w-[10%]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHolidays.length > 0 ? (
                  filteredHolidays
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((holiday) => {
                      const isUpdating = updatingHolidayId === holiday._id;

                      return (
                        <TableRow
                          key={holiday._id}
                          className="border-border hover:bg-muted/50"
                        >
                          <TableCell className="font-medium text-foreground w-[20%]">
                            <div className="flex items-center space-x-2">
                              {getTypeIcon(holiday.type)}
                              <div
                                className="truncate"
                                title={holiday.name}
                              >
                                {holiday.name}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-foreground w-[15%]">
                            {formatDate(holiday.date)}
                          </TableCell>
                          <TableCell className="w-[12%]">
                            <Badge
                              variant="outline"
                              className={`${getTypeColor(holiday.type)} capitalize text-xs`}
                            >
                              {holiday.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="w-[10%]">
                            {holiday.isRecurring ? (
                              <Badge variant="outline" className="text-purple-600 border-purple-200 text-xs">
                                Yes
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-600 text-xs">
                                No
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-foreground w-[33%]">
                            <div
                              className="truncate"
                              title={holiday.description}
                            >
                              {holiday.description || '-'}
                            </div>
                          </TableCell>
                          <TableCell className="w-[10%]">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(holiday)}
                                disabled={loading || isUpdating}
                                className="text-foreground hover:bg-muted p-1 h-8 w-8"
                                title="Edit Holiday"
                              >
                                {isUpdating ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Edit className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      {loading ? "Loading holidays..." : "No holidays found"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Holiday Form Modal - Now supports multiple holidays */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingHoliday ? 'Edit Holiday' : 'Add New Holidays'}
            </DialogTitle>
            <DialogDescription>
              {editingHoliday 
                ? 'Update the holiday information below.'
                : 'Fill in the details to create holidays. You can add multiple holidays at once.'
              }
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              {holidayForms.map((formData, index) => (
                <Card key={index} className="relative p-4 border border-border">
                  {/* Holiday Header */}
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-foreground">
                      Holiday {index + 1}
                    </h3>
                    <div className="flex gap-2">
                      {!editingHoliday && (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => duplicateHolidayForm(index)}
                            className="h-8 w-8 p-0"
                            title="Duplicate Holiday"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {holidayForms.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeHolidayForm(index)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              title="Remove Holiday"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Holiday Form Fields */}
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`name-${index}`}>
                        Holiday Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`name-${index}`}
                        placeholder="Enter holiday name"
                        value={formData.name}
                        onChange={(e) => handleInputChange(index, 'name', e.target.value)}
                        disabled={createLoading || updateLoading}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`date-${index}`}>
                          Date <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`date-${index}`}
                          type="date"
                          value={formData.date}
                          onChange={(e) => handleInputChange(index, 'date', e.target.value)}
                          disabled={createLoading || updateLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`type-${index}`}>Type</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value) => handleInputChange(index, 'type', value)}
                          disabled={createLoading || updateLoading}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="national">National</SelectItem>
                            <SelectItem value="festival">Festival</SelectItem>
                            <SelectItem value="optional">Optional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`description-${index}`}>Description</Label>
                      <Textarea
                        id={`description-${index}`}
                        placeholder="Enter holiday description (optional)"
                        value={formData.description}
                        onChange={(e) => handleInputChange(index, 'description', e.target.value)}
                        disabled={createLoading || updateLoading}
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`isRecurring-${index}`}
                        checked={formData.isRecurring}
                        onCheckedChange={(checked) => handleInputChange(index, 'isRecurring', checked as boolean)}
                        disabled={createLoading || updateLoading}
                      />
                      <Label htmlFor={`isRecurring-${index}`} className="text-sm font-normal">
                        This is a recurring holiday (appears every year)
                      </Label>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Add More Button */}
            {!editingHoliday && (
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addHolidayForm}
                  disabled={createLoading || updateLoading}
                  className="w-full max-w-md"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Holiday
                </Button>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                {!editingHoliday && `${holidayForms.length} holiday${holidayForms.length > 1 ? 's' : ''} to create`}
              </div>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseForm}
                  disabled={createLoading || updateLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createLoading || updateLoading}
                >
                  {createLoading || updateLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  {editingHoliday 
                    ? 'Update Holiday' 
                    : `Create ${holidayForms.length > 1 ? `${holidayForms.length} Holidays` : 'Holiday'}`
                  }
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
