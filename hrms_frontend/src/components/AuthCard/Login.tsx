"use client"
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import GoogleLogo from "@/assets/AuthIcons/google.png"
import Image from 'next/image'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loginUser, forgotPassword, resetPassword } from '@/features/auth/authSlice'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

const Login: React.FC = () => {
  const router = useRouter()
  const dispatch = useAppDispatch();
  const { 
    loading, 
    error, 
    user, 
    role, 
    isOrganizer, 
    isSuperUser, 
    orgPermissions,
    permissions,
    hrmsPermissions
  } = useAppSelector((state) => state.auth);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [forgotEmail, setForgotEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user && role) {
      const { isHRMS_enabled, isTaskManagement_enabled } = orgPermissions;
      
      let path: string;

      if (isSuperUser || role === 'SUPER_ADMIN') {
       
        path = '/dashboard/super_admin';
      } else if (isOrganizer || role === 'ADMIN') {
        
        path = '/dashboard/admin';
      } else {
        
        path = '/dashboard/dynamic';
      }

      router.push(path);

    }
  }, [user, role, isOrganizer, isSuperUser, orgPermissions, permissions, hrmsPermissions, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail && loginPassword) {
      dispatch(loginUser({ email: loginEmail, password: loginPassword }));
    }
  }

  const handleForgotPasswordClick = () => {
    setIsModalOpen(true)
    setCurrentStep(1)
    setForgotEmail('')
    setOtp('')
    setNewPassword('')
    setConfirmPassword('')
  }
  
  const handleSendOTP = async () => {
    if (!forgotEmail) {
      toast.error('Please enter your email address');
      return;
    }
    
    try {
      await dispatch(forgotPassword({ email: forgotEmail })).unwrap();
      toast.success('OTP sent to your email');
      setCurrentStep(2);
    } catch (error) {
      toast.error('Failed to send OTP');
    }
  }
  
  const handleResetPassword = async () => {
    if (!otp || !newPassword || !confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    try {
      await dispatch(resetPassword({ 
        email: forgotEmail,
        otp,
        newPassword 
      })).unwrap();
      
      toast.success('Password reset successfully');
      setIsModalOpen(false);
      setCurrentStep(1);
    } catch (error) {
      toast.error('Failed to reset password');
    }
  }

  const renderModalContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email Address</Label>
              <Input
                type="email"
                id="forgot-email"
                placeholder="Enter your email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSendOTP}
              className="w-full bg-gradient-to-r from-green-400 to-yellow-500 hover:from-green-500 hover:to-yellow-600"
            >
              Send OTP
            </Button>
          </div>
        )
     
      case 2:
        return (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              We've sent an OTP to: <span className="font-semibold">{forgotEmail}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                type="text"
                id="otp"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                type="password"
                id="new-password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                type="password"
                id="confirm-password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleResetPassword}
              className="w-full bg-gradient-to-r from-green-400 to-yellow-500 hover:from-green-500 hover:to-yellow-600"
            >
              Reset Password
            </Button>
          </div>
        )
        
      default:
        return null
    }
  }
       
  const getModalTitle = () => {
    switch (currentStep) {
      case 1: return "Forgot Password"
      case 2: return "Reset Password"
      default: return "Forgot Password"
    }
  }
               
  const getModalDescription = () => {
    switch (currentStep) {
      case 1: return "Enter your email address to receive an OTP"
      case 2: return "Enter the OTP and set a new password"
      default: return "Enter your email address to receive an OTP"
    }
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <div className="relative hidden w-1/2 flex-col items-center justify-center md:flex">
        <Link href="/">
          <div
            className="absolute h-[50px] w-[50px] top-8 left-8 bg-contain bg-center bg-no-repeat"
            style={{ backgroundImage: `url(/favicon_io/apple-touch-icon.png)` }}
          >
          </div>
        </Link>
        <div className="w-full max-w-lg p-4">
          <Image
            src="/minthr.webp"
            alt="MintHR Dashboard Preview"
            width={600}
            height={400}
            className="w-full h-auto rounded-2xl shadow-xl"
          />
        </div>
      </div>
      
      <div className="flex w-full items-center justify-center p-8 md:w-1/2 bg-white">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-gray-800">
              Welcome Back!
            </CardTitle>
            <CardDescription className="text-gray-500">
              Enter your credentials to access your account.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  type="email"
                  id="email"
                  placeholder="you@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-2.5 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} className='cursor-pointer' /> : <Eye size={18} className='cursor-pointer' />}
                  </button>
                </div>
              </div>
              
              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}

              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                    onClick={handleForgotPasswordClick}
                  >
                    Forgot password?
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{getModalTitle()}</DialogTitle>
                    <DialogDescription>
                      {getModalDescription()}
                    </DialogDescription>
                  </DialogHeader>
                  {renderModalContent()}
                </DialogContent>
              </Dialog>

              <Button
                type="button"
                variant="outline"
                className="w-full cursor-pointer"
                disabled
              >
                <Image
                  src={GoogleLogo}
                  alt="Google"
                  className="w-5 h-5 mr-2"
                />
                Continue with Google
              </Button>
              
              <Button
                type="submit" 
                className="w-full bg-gradient-to-r from-green-400 to-yellow-500 hover:from-green-500 hover:to-yellow-600 cursor-pointer"
                disabled={loading} 
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Login

