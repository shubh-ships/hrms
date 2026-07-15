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
import {
  Calendar,
  CalendarDays,
  Gift,
  Flag,
  Loader2,
  Clock,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  getHolidays,
  clearHolidayError,
} from "@/features/holiday/holidaySlice";

export default function HolidayViewOnly() {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");

  const { holidays, loading, error } = useAppSelector(
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

  // Get upcoming holidays
  const upcomingHolidays = useMemo(() => {
    const today = new Date();
    return holidays
      .filter(holiday => new Date(holiday.date) >= today)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  }, [holidays]);

  // Get current month holidays
  const currentMonthHolidays = useMemo(() => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    return holidays.filter(holiday => {
      const holidayDate = new Date(holiday.date);
      return holidayDate.getMonth() === currentMonth && 
             holidayDate.getFullYear() === currentYear;
    });
  }, [holidays]);

  // Filtering holidays
  const filteredHolidays = useMemo(() =>
    holidays.filter((holiday) =>
      holiday.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (holiday.description && holiday.description.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [holidays, searchTerm]
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntil = (dateString: string) => {
    const today = new Date();
    const holidayDate = new Date(dateString);
    const diffTime = holidayDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
        <div>
          <h1 className="text-xl font-semibold">Holiday Calendar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View all organization holidays and plan your schedule
          </p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          <Calendar className="h-4 w-4 mr-1" />
          View Only
        </Badge>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { 
            icon: CalendarDays, 
            title: metrics.total, 
            label: "Total Holidays",
            color: "text-blue-600"
          },
          { 
            icon: Flag, 
            title: metrics.national, 
            label: "National",
            color: "text-green-600"
          },
          { 
            icon: Gift, 
            title: metrics.festival, 
            label: "Festival",
            color: "text-purple-600"
          },
          { 
            icon: Calendar, 
            title: metrics.optional, 
            label: "Optional",
            color: "text-orange-600"
          },
        ].map(({ icon: Icon, title, label, color }, index) => (
          <Card key={index} className="bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{title}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming Holidays Section */}
      {upcomingHolidays.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Upcoming Holidays
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Next {upcomingHolidays.length} holidays coming up
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingHolidays.map((holiday) => {
                const daysUntil = getDaysUntil(holiday.date);
                return (
                  <div 
                    key={holiday._id} 
                    className="flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(holiday.type)}
                      <div>
                        <p className="font-medium text-foreground">{holiday.name}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(holiday.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {daysUntil === 0 ? (
                        <Badge className="bg-green-500 text-white">Today</Badge>
                      ) : daysUntil === 1 ? (
                        <Badge className="bg-orange-500 text-white">Tomorrow</Badge>
                      ) : daysUntil <= 7 ? (
                        <Badge className="bg-blue-500 text-white">{daysUntil} days</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">{formatDateShort(holiday.date)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Month Holidays */}
      {currentMonthHolidays.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              This Month's Holidays
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentMonthHolidays
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((holiday) => (
                  <div 
                    key={holiday._id}
                    className="flex items-center space-x-3 p-3 rounded-lg bg-muted"
                  >
                    {getTypeIcon(holiday.type)}
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{holiday.name}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(holiday.date)}</p>
                    </div>
                    <Badge className={`${getTypeColor(holiday.type)} text-xs`}>
                      {holiday.type}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <Input
          placeholder="Search holidays by name or description..."
          className="md:w-1/2 bg-input text-foreground border-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="text-sm text-muted-foreground flex items-center">
          {filteredHolidays.length} of {holidays.length} holidays
        </div>
      </div>

      {/* Holidays Table */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-foreground">
            All Holidays
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Complete list of organization holidays
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading holidays...</span>
            </div>
          ) : (
            <div className="w-full">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-muted/50">
                    <TableHead className="text-foreground w-[25%]">Holiday Name</TableHead>
                    <TableHead className="text-foreground w-[18%]">Date</TableHead>
                    <TableHead className="text-foreground w-[12%]">Type</TableHead>
                    <TableHead className="text-foreground w-[10%]">Recurring</TableHead>
                    <TableHead className="text-foreground w-[35%]">Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHolidays.length > 0 ? (
                    filteredHolidays
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((holiday) => {
                        const isUpcoming = new Date(holiday.date) >= new Date();
                        
                        return (
                          <TableRow
                            key={holiday._id}
                            className={`border-border hover:bg-muted/50 ${
                              isUpcoming ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                            }`}
                          >
                            <TableCell className="font-medium text-foreground w-[25%]">
                              <div className="flex items-center space-x-2">
                                {getTypeIcon(holiday.type)}
                                <div
                                  className="truncate"
                                  title={holiday.name}
                                >
                                  {holiday.name}
                                  {isUpcoming && (
                                    <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 border-blue-200">
                                      Upcoming
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-foreground w-[18%]">
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
                            <TableCell className="text-foreground w-[35%]">
                              <div
                                className="truncate"
                                title={holiday.description}
                              >
                                {holiday.description || '-'}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? "No holidays found matching your search" : "No holidays available"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
