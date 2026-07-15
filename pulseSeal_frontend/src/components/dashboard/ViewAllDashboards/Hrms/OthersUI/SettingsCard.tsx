import SettingsItem from "./SettingsItem";
import { settingsSections, SettingsSection } from "./settingsData";
import { useState, useEffect } from "react";
import axiosClient from "@/lib/api/client";

interface SettingsCardProps {
  searchQuery?: string;
  onSettingClick?: (id: string, title?: string) => void;
}

const SettingsCard = ({ searchQuery = "", onSettingClick }: SettingsCardProps) => {
  const [businessInfo, setBusinessInfo] = useState<any>(null);

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await axiosClient.get("/organizations/organization/hackingly");
        if (res.data?.success) {
          setBusinessInfo(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching org:", err);
      }
    };
    fetchOrg();
  }, []);

  const lowerQuery = searchQuery.toLowerCase();

  const filteredSections = settingsSections
    .map((section: SettingsSection) => ({
      ...section,
      settings: section.settings.filter((item) =>
        item.title.toLowerCase().includes(lowerQuery)
      ),
    }))
    .filter((section) => section.settings.length > 0);

  if (filteredSections.length === 0) {
    return <div className="text-center py-10 text-gray-500 mt-5">No settings found.</div>;
  }

  return (
    <>
      {filteredSections.map((section, index: number) => {
        const Icon = section.icon;

        return (
          <div
            key={index}
            className="mx-auto my-5 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs"
          >
            <div className="flex items-center gap-3 p-5 border-b border-gray-100">
              <div className="flex items-center justify-center w-8 h-8 rounded bg-slate-50 text-slate-600">
                <Icon size={24} />
              </div>

              <h2 className="text-[17px] font-semibold text-slate-800">
                {section.sectionTitle}
              </h2>
            </div>

            <div className="flex flex-col">
              {section.settings.map((item, i) => {
                const isPopup = [
                  "business-name",
                  "business-location",
                  "business-address",
                  "business-logo",
                ].includes(item.id);

                let displayDescription = item.description;
                if (isPopup) {
                  if (item.id === "business-name" && businessInfo?.name) {
                    displayDescription = businessInfo.name;
                  } else if (item.id === "business-location" && businessInfo?.city && businessInfo?.state) {
                    displayDescription = `${businessInfo.city} , ${businessInfo.state}`;
                  } else if (item.id === "business-address") {
                    displayDescription = "Address Added";
                  } else if (item.id === "business-logo" && businessInfo?.org_photo?.url) {
                    displayDescription = "Logo Added";
                  } else {
                    displayDescription = "Not Added";
                  }
                }

                return (
                  <SettingsItem
                    key={i}
                    id={item.id}
                    title={item.title}
                    description={displayDescription}
                    onClick={isPopup ? onSettingClick : undefined}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
};

export default SettingsCard;
