"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, ChevronDown } from "lucide-react";
import Link from "next/link";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { State, City } from "country-state-city";
import axiosClient from "@/lib/api/client";

interface PopupsProps {
  activePopup: string | null;
  onClose: () => void;
}

export default function BusinessInfoPopups({ activePopup, onClose }: PopupsProps) {
  const [orgData, setOrgData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activePopup) return;
    const fetchOrg = async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get("/organizations/organization/hackingly");
        if (res.data?.success) {
          setOrgData(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching org:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrg();
  }, [activePopup]);

  if (!activePopup) return null;

  return (
    <Dialog open={!!activePopup} onOpenChange={(open) => !open && onClose()}>
      {loading ? (
        <DialogContent className="sm:max-w-[450px] py-16 flex justify-center border-0 shadow-none bg-transparent">
          <DialogTitle className="sr-only">Loading Business Information</DialogTitle>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" />
        </DialogContent>
      ) : (
        <>
          {activePopup === "business-name" && <BusinessNameContent onClose={onClose} defaultOrg={orgData} />}
          {activePopup === "business-location" && <BusinessLocationContent onClose={onClose} defaultOrg={orgData} />}
          {activePopup === "business-address" && <BusinessAddressContent onClose={onClose} defaultOrg={orgData} />}
          {activePopup === "business-logo" && <BusinessLogoContent onClose={onClose} defaultOrg={orgData} />}
        </>
      )}
    </Dialog>
  );
}

const CustomCloseButton = ({ onClose }: { onClose: () => void }) => (
  <button
    onClick={onClose}
    className="absolute right-4 top-4 rounded-md bg-slate-100 p-1.5 opacity-70 transition-opacity hover:opacity-100 hover:bg-slate-200"
  >
    <X className="h-4 w-4 text-slate-700" />
    <span className="sr-only">Close</span>
  </button>
);

const CustomDropdown = ({ value, placeholder, options, onChange, disabled }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      setIsOpen(false);
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref]);

  const selectedOption = options.find((opt: any) => opt.value === value);

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between bg-white border border-gray-200 rounded-lg h-11 px-3 focus:outline-none focus:border-[#3f5a54] ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className={`text-[15px] truncate pr-2 ${selectedOption ? "text-slate-800" : "text-gray-400"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-100 rounded-lg shadow-xl overflow-y-auto py-1 max-h-[250px]">
          {options.length > 0 ? options.map((opt: any) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              className="w-full flex items-center justify-start py-2 px-3 hover:bg-gray-50 text-left relative"
            >
              <div className="flex items-center gap-2 w-full">
                {value === opt.value ? (
                  <div className="w-1.5 h-1.5 bg-[#3f5a54] rounded-full shrink-0" />
                ) : (
                  <div className="w-1.5 h-1.5 shrink-0" />
                )}
                <span className={`text-[14px] truncate ${value === opt.value ? 'text-slate-800 font-medium' : 'text-slate-600'}`}>
                  {opt.label}
                </span>
              </div>
            </button>
          )) : (
            <div className="text-[14px] text-gray-500 px-3 py-2">No options available</div>
          )}
        </div>
      )}
    </div>
  );
};

const BusinessNameContent = ({ onClose, defaultOrg }: { onClose: () => void, defaultOrg: any }) => {
  const [name, setName] = useState(defaultOrg?.name || "");

  const handleSave = () => {
    // Only super admin can edit
    onClose();
  };

  return (
    <DialogContent className="sm:max-w-[450px] p-0 gap-0 overflow-hidden" showCloseButton={false}>
      <CustomCloseButton onClose={onClose} />
      <DialogHeader className="px-6 py-5 border-b-0">
        <DialogTitle className="text-xl font-semibold text-slate-800">
          Business Name
        </DialogTitle>
      </DialogHeader>

      <div className="px-6 pb-6">
        <div className="space-y-2 mb-6">
          <Label className="text-sm text-slate-600 font-normal">
            Business Name <span className="text-red-500">*</span>
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={true}
            placeholder="Enter Business Name"
            className="h-11 rounded-lg border-gray-200 text-[15px]"
          />
        </div>

        <p className="text-[14px] text-slate-600 mb-6">
          By continuing you agree to{" "}
          <Link href="#" className="text-[#3f5a54] hover:underline">
            Terms & Conditions
          </Link>
        </p>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11 rounded-lg border-[#3f5a54] text-[#3f5a54] hover:bg-[#3f5a54]/5 hover:text-[#3f5a54] font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={true}
            className="flex-1 h-11 rounded-lg bg-slate-200 text-slate-700 hover:bg-[#3f5a54] hover:text-white font-medium disabled:opacity-50 transition-colors"
          >
            Save
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};

const BusinessLocationContent = ({ onClose, defaultOrg }: { onClose: () => void, defaultOrg: any }) => {
  const statesList = useMemo(() => State.getStatesOfCountry("IN").map(s => ({ label: s.name, value: s.isoCode })), []);
  
  const [selectedStateCode, setSelectedStateCode] = useState<string>(() => {
    if (defaultOrg?.state) {
      const s = statesList.find(st => st.label.toLowerCase() === defaultOrg.state.toLowerCase());
      return s ? s.value : "";
    }
    return "";
  });
  const [selectedCity, setSelectedCity] = useState<string>(defaultOrg?.city || "");

  const states = statesList;
  const cities = useMemo(() => {
    if (!selectedStateCode) return [];
    return City.getCitiesOfState("IN", selectedStateCode).map(c => ({ label: c.name, value: c.name }));
  }, [selectedStateCode]);

  const handleSave = () => {
    // Only super admin can edit
    onClose();
  };

  return (
    <DialogContent className="sm:max-w-[450px] p-0 gap-0" showCloseButton={false}>
      <CustomCloseButton onClose={onClose} />
      <DialogHeader className="px-6 py-5 border-b-0">
        <DialogTitle className="text-xl font-semibold text-slate-800">
          Business State & City
        </DialogTitle>
      </DialogHeader>

      <div className="px-6 pb-6">
        <div className="space-y-4 mb-8">
          <div className="space-y-2">
            <Label className="text-sm text-slate-600 font-normal">State</Label>
            <CustomDropdown
              value={selectedStateCode}
              placeholder="Select State"
              options={states}
              disabled={true}
              onChange={(val: string) => {
                setSelectedStateCode(val);
                setSelectedCity("");
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-slate-600 font-normal">City</Label>
            <CustomDropdown
              value={selectedCity}
              placeholder="Select City"
              options={cities}
              disabled={true}
              onChange={setSelectedCity}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11 rounded-lg border-[#3f5a54] text-[#3f5a54] hover:bg-[#3f5a54]/5 font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={true}
            className="flex-1 h-11 rounded-lg bg-slate-200 text-slate-700 hover:bg-[#3f5a54] hover:text-white font-medium disabled:opacity-50 transition-colors"
          >
            Save
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};

const BusinessAddressContent = ({ onClose, defaultOrg }: { onClose: () => void, defaultOrg: any }) => {
  const statesList = useMemo(() => State.getStatesOfCountry("IN").map(s => ({ label: s.name, value: s.isoCode })), []);
  
  const [selectedStateCode, setSelectedStateCode] = useState<string>(() => {
    if (defaultOrg?.state) {
      const s = statesList.find(st => st.label.toLowerCase() === defaultOrg.state.toLowerCase());
      return s ? s.value : "";
    }
    return "";
  });
  const [selectedCity, setSelectedCity] = useState<string>(defaultOrg?.city || "");

  // Leave these empty as requested
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [pincode, setPincode] = useState("");

  const states = statesList;
  const cities = useMemo(() => {
    if (!selectedStateCode) return [];
    return City.getCitiesOfState("IN", selectedStateCode).map(c => ({ label: c.name, value: c.name }));
  }, [selectedStateCode]);

  const handleSave = () => {
    // Only super admin can edit
    onClose();
  };

  return (
    <DialogContent className="sm:max-w-[450px] p-0 gap-0" showCloseButton={false}>
      <CustomCloseButton onClose={onClose} />
      <DialogHeader className="px-6 py-5 border-b-0">
        <DialogTitle className="text-xl font-semibold text-slate-800">
          Business Address
        </DialogTitle>
      </DialogHeader>

      <div className="px-6 pb-6">
        <div className="space-y-4 mb-8">
          <div className="space-y-2">
            <Label className="text-sm text-slate-600 font-normal">
              Address Line 1 <span className="text-red-500">*</span>
            </Label>
            <Input
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              disabled={true}
              placeholder="Enter Address Line 1"
              className="h-11 rounded-lg border-gray-200 text-[15px] w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-slate-600 font-normal">
              Address Line 2
            </Label>
            <Input
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              disabled={true}
              placeholder="Enter Address Line 2"
              className="h-11 rounded-lg border-gray-200 text-[15px] w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-slate-600 font-normal">
              State <span className="text-red-500">*</span>
            </Label>
            <CustomDropdown
              value={selectedStateCode}
              placeholder="Select State"
              options={states}
              disabled={true}
              onChange={(val: string) => {
                setSelectedStateCode(val);
                setSelectedCity("");
              }}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-slate-600 font-normal">
              City <span className="text-red-500">*</span>
            </Label>
            <CustomDropdown
              value={selectedCity}
              placeholder="Select City"
              options={cities}
              disabled={true}
              onChange={setSelectedCity}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-slate-600 font-normal">
              Pincode <span className="text-red-500">*</span>
            </Label>
            <Input
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              disabled={true}
              placeholder="Enter Pincode"
              className="h-11 rounded-lg border-gray-200 text-[15px] w-full"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11 rounded-lg border-[#3f5a54] text-[#3f5a54] hover:bg-[#3f5a54]/5 font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={true}
            className="flex-1 h-11 rounded-lg bg-slate-200 text-slate-700 hover:bg-[#3f5a54] hover:text-white font-medium disabled:opacity-50 transition-colors"
          >
            Save
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};

const BusinessLogoContent = ({ onClose, defaultOrg }: { onClose: () => void, defaultOrg: any }) => {
  const [previewUrl, setPreviewUrl] = useState<string>(defaultOrg?.org_photo?.url || "");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    // Only super admin can edit
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // disabled
  };

  return (
    <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden" showCloseButton={false}>
      <CustomCloseButton onClose={onClose} />
      <DialogHeader className="px-6 py-5 border-b-0">
        <DialogTitle className="text-xl font-semibold text-slate-800">
          Business Logo
        </DialogTitle>
      </DialogHeader>

      <div className="px-6 pb-6">
        {/* Hidden real file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/x-photoshop,.psd"
          className="hidden"
          disabled={true}
          onChange={handleFileChange}
        />

        <div className="flex gap-6 mb-8">
          <div
            className="w-48 h-48 rounded-lg border-2 border-dashed border-slate-400 bg-slate-50 flex items-center justify-center relative overflow-hidden transition-colors"
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Logo preview" className="absolute inset-0 w-full h-full object-contain p-2" />
            ) : (
              <div className="text-gray-400 text-sm text-center px-4">
                Click to upload<br />your logo
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center flex-1">
            <Button
              variant="outline"
              disabled={true}
              className="w-[140px] h-10 border-slate-400 text-slate-700 font-medium rounded-lg mb-4 hover:bg-slate-50 opacity-50 cursor-not-allowed"
            >
              Upload Logo
            </Button>
            <div className="text-[14px] text-slate-700 font-medium mb-1">
              Max size: 10 MB
            </div>
            <div className="text-[12px] text-slate-400">
              Supported formats: JPEG, PNG, PSD
            </div>
            {previewUrl && (
              <button
                type="button"
                disabled={true}
                className="mt-3 text-[12px] text-red-400 opacity-50 cursor-not-allowed text-left w-fit"
              >
                Remove image
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11 rounded-lg border-[#3f5a54] text-[#3f5a54] hover:bg-[#3f5a54]/5 font-medium"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={true}
            className="flex-1 h-11 rounded-lg bg-slate-200 text-slate-700 hover:bg-[#3f5a54] hover:text-white font-medium disabled:opacity-50 transition-colors"
          >
            Save
          </Button>
        </div>
      </div>
    </DialogContent>
  );
};
