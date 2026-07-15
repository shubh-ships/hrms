'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Loader2, Users, Plus, UserPlus, Crown } from "lucide-react";
import { toast } from "sonner";
import { useForm, ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createAdmin, getAdminUsers, selectAdmins, selectAdminLoading, selectCreateAdminLoading, selectAdminError } from "@/features/newUser/newUserSlice";

// Form validation schema
const adminFormSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email." }),
    phoneNumber: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }).optional(),
});

type AdminFormValues = z.infer<typeof adminFormSchema>;

export default function CreateAdmin() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const admins = useAppSelector(selectAdmins);
    const getAdminLoading = useAppSelector(selectAdminLoading);
    const createAdminLoading = useAppSelector(selectCreateAdminLoading);
    const error = useAppSelector(selectAdminError);

    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const form = useForm<AdminFormValues>({
        resolver: zodResolver(adminFormSchema),
        defaultValues: {
            name: "",
            email: "",
            phoneNumber: "",
            password: "12345678", // Default password like the user form
        },
    });

    // Fetch admins on component mount
    useEffect(() => {
        dispatch(getAdminUsers());
    }, [dispatch]);

    const handleResetForm = () => {
        form.reset({
            name: "",
            email: "",
            phoneNumber: "",
            password: "12345678",
        });
    };

    const onSubmit = async (values: AdminFormValues) => {
        try {
            const adminData = {
                name: values.name,
                email: values.email,
                phoneNumber: values.phoneNumber,
                ...(values.password && { password: values.password }),
            };

            await dispatch(createAdmin(adminData)).unwrap();

            toast.success("Admin created successfully");

            handleResetForm();
            setIsDialogOpen(false);

            // Refresh the admin list
            dispatch(getAdminUsers());
        } catch (error: any) {
            toast.error(error || "Failed to create admin");
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-[40px] text-foreground">
            <div>
                {/* Page Header */}
                <div className="flex justify-between items-center">
                    <div className="mb-[24px]">
                        <h1 className="text-[20px] font-semibold tracking-tight text-foreground">
                            Admin Management
                        </h1>
                        <p className="text-[12px] text-[#9CA3AF]">
                            Create and manage admin users for your organization
                        </p>
                    </div>

                    {/* Create Admin Dialog */}
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-[30px] w-[120px] bg-[#3F5A54] text-white text-[14px] font-medium gap-1">
                                <Plus className="w-[12px] h-[12px]" />
                                Create Admin
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[480px] p-0 border-none overflow-hidden rounded-[16px] shadow-xl bg-white">
                            <div className="p-8">
                                <DialogHeader className="mb-[24px]">
                                    <DialogTitle className="text-[18px] font-semibold text-[#1F2937] leading-none">
                                        Create New Admin
                                    </DialogTitle>
                                    <DialogDescription className="text-[12px] w-[337px] text-[#9CA3AF] leading-relaxed">
                                        Add a new admin user to your organization. They will receive admin privileges.
                                    </DialogDescription>
                                </DialogHeader>

                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                        {/* Basic Information Section */}
                                        <div className="mb-[16px]">
                                            <h3 className="text-[14px] h-[21px] w-[125px] font-medium mb-2 text-[#1F2937]">
                                                Basic Information
                                            </h3>
                                            <div className="space-y-4">
                                                <FormField
                                                    control={form.control}
                                                    name="name"
                                                    render={({ field }: { field: ControllerRenderProps<AdminFormValues, "name"> }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[#4B5563] text-[10px]">
                                                                Full Name <span className="text-destructive">*</span>
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="Enter full name"
                                                                    {...field}
                                                                    className="border border-[#E5E7EB] text-foreground ring-0 focus-visible:ring-0"
                                                                    disabled={createAdminLoading}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="email"
                                                    render={({ field }: { field: ControllerRenderProps<AdminFormValues, "email"> }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[#4B5563] text-[10px]">
                                                                Email Address <span className="text-destructive">*</span>
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="example@company.com"
                                                                    type="email"
                                                                    {...field}
                                                                    className="border border-[#E5E7EB] text-foreground ring-0 focus-visible:ring-0"
                                                                    disabled={createAdminLoading}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="phoneNumber"
                                                    render={({ field }: { field: ControllerRenderProps<AdminFormValues, "phoneNumber"> }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-[#4B5563] text-[10px]">
                                                                Phone Number <span className="text-destructive">*</span>
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    placeholder="+1 (555) 123-4567"
                                                                    type="tel"
                                                                    {...field}
                                                                    className="border border-[#E5E7EB] text-foreground ring-0 focus-visible:ring-0"
                                                                    disabled={createAdminLoading}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>

                                        {/* Account Security Section */}
                                        <div>
                                            <h3 className="text-[14px] font-medium mb-2 text-[#1F2937]">
                                                Account Security
                                            </h3>
                                            <FormField
                                                control={form.control}
                                                name="password"
                                                render={({ field }: { field: ControllerRenderProps<AdminFormValues, "password"> }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-[#4B5563] text-[10px]">
                                                            Password <span className="text-destructive">*</span>
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Password"
                                                                type="password"
                                                                {...field}
                                                                className="border border-[#E5E7EB] text-foreground ring-0 focus-visible:ring-0"
                                                                disabled={createAdminLoading}
                                                            />
                                                        </FormControl>
                                                        <p className="text-[#4B5563] text-[10px]">
                                                            Default password: "12345678"
                                                        </p>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                    </form>
                                </Form>
                            </div>

                            <DialogFooter className="px-8 py-4 bg-white border-t border-[#E5E7EB] flex flex-row items-center justify-end gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                    disabled={createAdminLoading}
                                    className="border border-[#3F5A54] text-[#3F5A54] w-[140px] h-[40px] text-[14px] font-medium hover:bg-zinc-50 rounded-[8px]"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={form.handleSubmit(onSubmit)}
                                    disabled={createAdminLoading}
                                    className="bg-[#3F5A54] hover:bg-[#344b46] text-white w-[140px] h-[40px] text-[14px] font-medium rounded-[8px]"
                                >
                                    {createAdminLoading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Admin"
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Admin List Card */}
                <Card className="bg-white border-[1.5px] border-[#E5E7EB] rounded-[16px] shadow-sm flex flex-col p-0 gap-0">
                    <div className="px-[24px] py-[18px] border-b border-[#E5E7EB]">
                        <h3 className="text-[16px] font-medium flex items-center text-[#1F2937]">
                            Admin Users ({admins.length})
                        </h3>
                    </div>
                    <div className="p-0 m-0">
                        {getAdminLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                Loading admins...
                            </div>
                        ) : admins.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium mb-2 text-foreground">No Admins Found</h3>
                                <p className="text-muted-foreground mb-6">
                                    No admin users have been created yet. Create your first admin to get started.
                                </p>
                                <Button
                                    onClick={() => setIsDialogOpen(true)}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create First Admin
                                </Button>
                            </div>
                        ) : (
                            <div className="w-full p-0 m-0">
                                <Table className="w-full border-collapse border-spacing-0 m-0 p-0 table-fixed">
                                    <TableHeader>
                                        <TableRow className="bg-[#F0F0F0]/60 border-b border-[#E5E7EB] hover:bg-[#F9FAFB]">
                                            <TableHead className="w-[20%] py-[12px] h-auto pl-[24px] pr-4 text-[12px] font-medium text-[#4B5563] tracking-wider">Name</TableHead>
                                            <TableHead className="w-[20%] py-[12px] h-auto px-4 text-[12px] font-medium text-[#4B5563] tracking-wider">Email</TableHead>
                                            <TableHead className="w-[20%] py-[12px] h-auto px-4 text-[12px] font-medium text-[#4B5563] tracking-wider">Phone</TableHead>
                                            <TableHead className="w-[20%] py-[12px] h-auto px-4 text-[12px] font-medium text-[#4B5563] tracking-wider">Organization ID</TableHead>
                                            <TableHead className="w-[20%] py-[12px] h-auto pl-4 pr-[34px] text-[12px] font-medium text-[#4B5563] tracking-wider text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {admins.map((admin, index) => (
                                            <TableRow
                                                key={admin._id}
                                                className={cn(
                                                    "border-b border-[#E5E7EB] hover:bg-[#F9FAFB] transition-colors",
                                                    index === admins.length - 1 && "border-b-0"
                                                )}
                                            >
                                                <TableCell className="py-[12px] pl-[24px] pr-4 text-[12px] font-regular text-[#1F2937]">
                                                    <div className="flex items-center gap-2">
                                                        <Crown className="w-[12px] h-[12px] text-[#F59E0B]" />
                                                        {admin.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-[12px] px-4 text-[12px] text-[#1F2937] truncate">
                                                    {admin.email}
                                                </TableCell>
                                                <TableCell className="py-[12px] px-4 text-[12px] text-[#1F2937]">
                                                    {admin.phoneNumber || 'N/A'}
                                                </TableCell>
                                                <TableCell className="py-[12px] px-4 text-[12px] text-[#4B5563] truncate">
                                                    {admin.organizationId || 'N/A'}
                                                </TableCell>
                                                <TableCell className="py-[12px] pl-4 pr-[24px]">
                                                    <div className="flex justify-end">
                                                        <span className="flex justify-center items-center h-[18px] w-[52px] rounded-full text-[10px] font-medium bg-[#DCFCE7] text-[#22C55E]">
                                                            {admin._id ? 'Active' : 'Pending'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Error Display */}
                {error && (
                    <Card className="border-destructive bg-destructive/10">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-2 text-destructive">
                                <span className="text-sm font-medium">Error: {error}</span>
                            </div>
                        </CardContent>
                    </Card>
                )}

            </div>
        </div>
    );
}
