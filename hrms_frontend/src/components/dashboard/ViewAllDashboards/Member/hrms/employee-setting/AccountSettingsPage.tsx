"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import MoveBackIcon from "@/assets/Dashicons/move-back-icon.png";
import { ChevronRight, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppSelector } from "@/store/hooks";

// ---------- MOCK DATA ---------- //
const availableLanguages = [
  "हिंदी",
  "English",
  "ગુજરાતી",
  "Hinglish",
  "मराठी",
  "ਪੰਜਾਬੀ",
  "বাংলা",
  "తెలుగు",
  "தமிழ்",
  "ಕನ್ನಡ",
  "ଓଡ଼ିଆ",
  "മലയാളം",
];

export default function AccountSettingsPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);

  // State Management
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [tempLanguage, setTempLanguage] = useState("English"); // For modal state before save
  
  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);

  // OTP State
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(26);

  // Timer Effect for OTP Resend
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOtpModalOpen && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, isOtpModalOpen]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(value.length - 1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const isOtpComplete = otp.every((digit) => digit.length === 1);

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] p-4 flex justify-center">
      <div className="w-full">
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="hover:opacity-80 transition-opacity mb-6 block"
        >
          <Image 
            src={MoveBackIcon} 
            alt="Back" 
            className="w-[80px] h-auto object-contain" 
          />
        </button>

        <h1 className="text-[22px] font-extrabold text-gray-900 tracking-tight mb-6">Account Settings</h1>

        {/* Settings List Container */}
        <div className="w-full bg-white rounded-xl border border-gray-200 flex flex-col">
          
          {/* Language Row */}
          <button 
            onClick={() => {
              setTempLanguage(selectedLanguage);
              setIsLangModalOpen(true);
            }}
            className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group text-left border-b border-gray-200"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[15px] font-bold text-gray-800">Language</span>
              <span className="text-[12px] text-gray-500 font-medium">{selectedLanguage}</span>
            </div>
            <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
              <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </button>

          {/* Security Password Row */}
          <button 
            onClick={() => setIsOtpModalOpen(true)}
            className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-colors group text-left"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[15px] font-bold text-gray-800">Security Password</span>
              <span className="text-[12px] text-gray-500 font-medium">Password not activated</span>
            </div>
            <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
              <ChevronRight className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </button>

        </div>
      </div>

      {/* ----------------- Language Modal ----------------- */}
      <Dialog open={isLangModalOpen} onOpenChange={setIsLangModalOpen}>
        <DialogContent className="max-w-[460px] p-0 bg-white overflow-hidden rounded-[20px] border-none shadow-[0_10px_40px_rgb(0,0,0,0.12)]">
          <div className="flex flex-col h-full max-h-[80vh]">
            
            <DialogHeader className="p-6 pb-2 shrink-0">
              <DialogTitle className="text-[20px] font-bold text-gray-900 tracking-tight text-left">
                Select Language
              </DialogTitle>
              <p className="text-[14px] text-gray-500 mt-2 font-medium leading-relaxed">
                Please select a language that you can read and understand comfortably
              </p>
            </DialogHeader>

            <div className="p-6 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
              {availableLanguages.map((lang) => {
                const isActive = tempLanguage === lang;
                return (
                  <button
                    key={lang}
                    onClick={() => setTempLanguage(lang)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200
                      ${isActive 
                        ? 'border-[#3f5a54] bg-[#3f5a54]/[0.04] shadow-sm' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className={`text-[15px] font-semibold ${isActive ? 'text-[#3f5a54]' : 'text-gray-700'}`}>
                      {lang}
                    </span>
                    {isActive && (
                      <CheckCircle className="w-5 h-5 text-[#3f5a54] fill-[#3f5a54]/10" strokeWidth={2.5} />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="p-6 shrink-0 border-t border-gray-100 bg-white">
              <button
                onClick={() => {
                  setSelectedLanguage(tempLanguage);
                  setIsLangModalOpen(false);
                }}
                className="w-full bg-[#3f5a54] text-white rounded-xl py-3.5 text-[16px] font-bold tracking-wide hover:bg-[#3f5a54]/90 shadow-md hover:shadow-lg transition-all"
              >
                Save
              </button>
            </div>

          </div>
        </DialogContent>
      </Dialog>

      {/* ----------------- OTP Modal ----------------- */}
      <Dialog open={isOtpModalOpen} onOpenChange={(open) => {
        setIsOtpModalOpen(open);
        if (open) setTimer(26); // Reset timer casually on open
      }}>
        <DialogContent className="max-w-[420px] p-8 pt-10 bg-white overflow-hidden rounded-[24px] border-none shadow-[0_10px_40px_rgb(0,0,0,0.15)] [&>button]:right-5 [&>button]:top-5 [&>button]:bg-gray-100 [&>button]:rounded-md [&>button]:w-8 [&>button]:h-8 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:opacity-100 hover:[&>button]:bg-gray-200">
          <div className="flex flex-col">
            
            <DialogHeader className="mb-6 space-y-3">
              <DialogTitle className="text-[24px] font-extrabold text-gray-900 tracking-tight text-left">
                Enter verification code
              </DialogTitle>
              <div className="text-[14px] text-gray-500 leading-relaxed font-medium">
                A 4-digit OTP verification code has been sent on your phone number. Enter to verify your details.
              </div>
              <div className="text-[18px] font-bold text-gray-900 pt-2 tracking-wide">
                +91 {(user as any)?.phoneNumber || (user as any)?.userId?.phoneNumber || (user as any)?.user_id?.phoneNumber || "XX XXXXXXXX"}
              </div>
            </DialogHeader>

            <div className="mt-4">
              <span className="text-[13px] font-bold text-gray-600 mb-4 block uppercase tracking-wider">
                4-Digit Verification Code
              </span>

              <div className="flex items-center gap-4 mb-4">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-14 border-b-2 border-gray-300 bg-transparent text-center text-2xl font-bold text-gray-900 focus:outline-none focus:border-[#3f5a54] transition-colors"
                  />
                ))}
              </div>

              <div className="text-[13px] font-semibold text-gray-400">
                {timer > 0 ? (
                  <span>Resend OTP in <span className="text-gray-500">{timer} seconds</span></span>
                ) : (
                  <button className="text-[#3f5a54] hover:underline" onClick={() => setTimer(26)}>
                    Resend OTP now
                  </button>
                )}
              </div>
            </div>

            <button
              disabled={!isOtpComplete}
              onClick={() => {
                // Here is where submission would technically happen
                setIsOtpModalOpen(false);
                setOtp(["", "", "", ""]);
              }}
              className={`w-full mt-10 rounded-xl py-4 text-[16px] font-bold tracking-wide transition-all duration-300
                ${isOtpComplete 
                  ? 'bg-[#3f5a54] text-white shadow-md hover:bg-[#3f5a54]/90 hover:shadow-lg' 
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              Verify Number
            </button>

          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
