import { ChevronRight } from "lucide-react";
import { SettingItem as SettingItemType } from "./settingsData";
import Link from "next/link";

interface SettingsItemProps extends SettingItemType {
  onClick?: (id: string, title?: string) => void;
}

const SettingsItem = ({ id, title, description, onClick }: SettingsItemProps) => {
  const content = (
    <div
      className="flex items-center justify-between p-5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer group"
      {...(onClick ? { onClick: () => onClick(id, title) } : {})}
    >
      <div>
        <div className="text-[15px] font-medium text-slate-800">
          {title}
        </div>

        {description && (
          <div className="text-xs text-gray-500 mt-0.5">
            {description}
          </div>
        )}
      </div>

      <ChevronRight size={20} />
    </div>
  );

  if (onClick) {
    return content;
  }

// Items whose target page lives outside /others/:id
const ROUTE_OVERRIDES: Record<string, string> = {
  celebrations: "/dashboard/admin/hrms/celebrations",
};

  return (
    <Link href={ROUTE_OVERRIDES[id] ?? `/dashboard/admin/hrms/others/${id}`}>
      {content}
    </Link>
  );
};

export default SettingsItem;