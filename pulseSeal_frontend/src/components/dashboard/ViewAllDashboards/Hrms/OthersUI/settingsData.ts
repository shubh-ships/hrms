import {
  UserCog,
  BriefcaseBusiness,
  WalletCards,
  HandCoins,
  Handshake,
  ScanLine,
} from "lucide-react";

import { LucideIcon } from "lucide-react";

export interface SettingItem {
  id: string;
  title: string;
  description?: string;
}

export interface SettingsSection {
  sectionTitle: string;
  icon: LucideIcon;
  settings: SettingItem[];
}

export const settingsSections: SettingsSection[] = [
  {
    sectionTitle: "Attendance Settings",
    icon: UserCog,
    settings: [
      {
        id: "attendance-templates",
        title: "Attendance Templates",
        description:
          "Configure attendance modes, attendance on holidays, and more",
      },
      {
        id: "attendance-geofence",
        title: "Attendance Geofence Settings",
        description: "",
      },
      {
        id: "shift",
        title: "Shift Settings",
        description: "2 shift(s) added",
      },
      {
        id: "automation-rules",
        title: "Automation Rules",
        description: "Track late entry",
      },
      {
        id: "device-management",
        title: "Device Management",
        description: "",
      },
    ],
  },
  {
    sectionTitle: "Business Settings",
    icon: BriefcaseBusiness,
    settings: [
      {
        id: "holiday-policy",
        title: "Holiday Policy",
        description: "Not Added",
      },
      {
        id: "leave-policy",
        title: "Leave Policy",
        description: "1 Template",
      },
      {
        id: "manage-business-functions",
        title: "Manage Business Functions",
        description: "",
      },
      {
        id: "manage-staff-data",
        title: "Manage Staff Data",
        description: "No Fields Added",
      },
      {
        id: "manage-documents",
        title: "Manage Documents",
        description: "Publish organisation specific documents to your staff",
      },
      {
        id: "weekly-holidays",
        title: "Weekly Holidays",
        description: "Configure & manage weekly off templates",
      },
      {
        id: "broadcast-messages",
        title: "Broadcast Messages",
        description:
          "Compose or schedule broadcast messages for your employees",
      },
      {
        id: "manage-users",
        title: "Manage Users",
        description: "Configure user types across your organisation.",
      },
      {
        id: "celebrations",
        title: "Celebrations",
        description: "Configure Birthdays and Work Anniversaries settings",
      },
      {
        id: "daily-work-entry",
        title: "Daily Work Entry",
        description: "Assign to Staff",
      },
      {
        id: "roles-permissions",
        title: "Roles & Permissions",
        description: "Configure privileges and assign roles to your staff",
      },
      {
        id: "invite-staff",
        title: "Invite Staff",
        description: "",
      },
    ],
  },
  {
    sectionTitle: "Salary Settings",
    icon: WalletCards,
    settings: [
      {
        id: "salary-calculation-logic",
        title: "Salary Calculation Logic",
        description: "Calendar Month",
      },
      {
        id: "salary-components",
        title: "Salary Components",
        description:
          "Configure & manage Earnings, Deductions and Statutory Components",
      },
      {
        id: "flexi-benefit-plan",
        title: "Flexi-Benefit Plan Template",
        description: "Enable TDS to access FBP template",
      },
      {
        id: "salary-template-builder",
        title: "Salary Template Builder",
        description: "Configure & manage multiple salary templates",
      },
      {
        id: "work-rate-card",
        title: "Work Rate Card",
        description: "Not Added",
      },
      {
        id: "salary-details-access",
        title: "Salary Details Access to Staff",
        description: "No access",
      },
      {
        id: "payslip-customization",
        title: "Payslip Customization",
        description:
          "Customise items you would like to see on your employee payslips.",
      },
    ],
  },
  {
    sectionTitle: "Payment Settings",
    icon: HandCoins,
    settings: [
      {
        id: "business-bank-name",
        title: "Business Name in Bank Statement",
        description: "Not Added",
      },
      {
        id: "business-bank-account",
        title: "Business Bank Account",
        description: "Add Account details to get Instant Refunds",
      },
      {
        id: "kyb",
        title: "KYB",
        description: "Complete KYB to avail online payment services",
      },
    ],
  },
  {
    sectionTitle: "Business Info",
    icon: Handshake,
    settings: [
      {
        id: "business-name",
        title: "Business Name",
        description: "Not Added",
      },
      {
        id: "business-location",
        title: "Business State & City",
        description: "Rajasthan, Jaipur",
      },
      {
        id: "business-address",
        title: "Business Address",
        description: "Not Added",
      },
      {
        id: "business-logo",
        title: "Business Logo",
        description: "Not Added",
      },
    ],
  },
  {
    sectionTitle: "Others",
    icon: ScanLine,
    settings: [
      {
        id: "channel-partner",
        title: "Channel Partner ID (optional)",
        description: "Not Added",
      },
      {
        id: "alerts-notifications",
        title: "Alerts and Notifications",
        description: "",
      },
    ],
  },
];