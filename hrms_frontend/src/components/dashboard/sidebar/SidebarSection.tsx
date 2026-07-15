
"use client";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SidebarSectionProps {
  title: string;
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
    isDropdown?: boolean;
    dropdownItems?: { title: string; url: string; icon: LucideIcon }[];
  }[];
  basePath: string;
  direction?: "row" | "col";
}

export default function SidebarSection({
  title,
  items,
  basePath,
  direction = "col",
}: SidebarSectionProps) {
  const pathname = usePathname();
  const isRow = direction === "row";
  const [openDropdowns, setOpenDropdowns] = useState<Set<string>>(new Set());

  const isActive = (itemUrl: string) => {
    if (itemUrl === "#") return false;
    const fullPath = `/${basePath}/${itemUrl}`;
    if (pathname === fullPath) return true;
    if (pathname?.startsWith(fullPath + '/')) return true;
    return false;
  };

  const isDropdownActive = (dropdownItems: { title: string; url: string; icon: LucideIcon }[] = []) => {
    return dropdownItems.some(item => isActive(item.url));
  };

  const toggleDropdown = (title: string) => {
    const newOpenDropdowns = new Set(openDropdowns);
    if (newOpenDropdowns.has(title)) {
      newOpenDropdowns.delete(title);
    } else {
      newOpenDropdowns.add(title);
    }
    setOpenDropdowns(newOpenDropdowns);
  };

  const isDropdownOpen = (title: string) => openDropdowns.has(title);

  return (
    <div className={isRow ? "flex items-center gap-4" : "flex flex-col gap-1"}>
      {!isRow && title && (
        <SidebarHeader className="px-3 py-2 text-xs font-semibold text-muted-foreground">
          {title}
        </SidebarHeader>
      )}

      <SidebarMenu className={`flex ${isRow ? "flex-row gap-2" : "flex-col gap-3"}`}>
        {items.map((item) => {
          const isDropdown = item.isDropdown;
          const isOpen = isDropdownOpen(item.title);
          const hasActiveChild = isDropdown ? isDropdownActive(item.dropdownItems) : false;
          const active = !isDropdown && isActive(item.url);

          return (
            <div key={`${item.title}-${item.url}`} className="flex flex-col">
              <SidebarMenuItem>
                {isDropdown ? (
                  <div
                    className="group/menu-item relative flex w-full items-center"
                    data-sidebar="menu-item"
                  >
                    <button
                      onClick={() => toggleDropdown(item.title)}
                      className={cn(
                        "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md text-sm outline-none ring-sidebar-ring transition-all duration-200 focus-visible:ring-2",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        (isOpen || hasActiveChild)
                          ? "bg-primary/10 text-primary hover:bg-primary/15"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3 w-full px-3 py-2.5">
                        {hasActiveChild && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                        )}
                        <item.icon
                          className={cn(
                            "h-5 w-5 flex-shrink-0 transition-all duration-200",
                            (isOpen || hasActiveChild) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        <span className={cn(
                          "flex-1 transition-all duration-200 text-left font-medium",
                          (isOpen || hasActiveChild) && "font-semibold"
                        )}>
                          {item.title}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-200 flex-shrink-0",
                            isOpen && "transform rotate-180"
                          )}
                        />
                      </div>
                    </button>
                  </div>
                ) : (

                  <Link
                    href={`/${basePath}/${item.url}`}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                      "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-12 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:px-0",
                      active
                        ? "bg-primary/10 text-primary [&:active]:bg-primary/10 [&:active]:text-primary"
                        : "text-gray-400 hover:bg-slate-100 [&:active]:bg-transparent [&:active]:text-gray-400"
                    )}
                  >

                    {direction === "col" && (
                      <item.icon
                        className={cn(
                          "h-5 w-5 flex shrink-0 transition-transform duration-200 pointer-events-none",
                          active ? "!text-primary scale-100" : "!text-gray-400"
                        )}
                      />
                    )}

                    <span className={cn(
                      "flex-1 transition-all duration-200 truncate group-data-[collapsible=icon]:hidden",
                      active && "font-semibold"
                    )}>
                      {item.title}
                    </span>
                  </Link>

                )}
              </SidebarMenuItem>

              {isDropdown && isOpen && item.dropdownItems && (
                <div className="ml-4 mt-1 space-y-0.5 border-l border-muted-foreground/20 pl-3">
                  {item.dropdownItems.map((dropdownItem) => {
                    const dropdownActive = isActive(dropdownItem.url);

                    return (
                      <SidebarMenuItem key={`${dropdownItem.title}-${dropdownItem.url}`}>
                        <SidebarMenuButton asChild isActive={dropdownActive}>
                          <Link
                            href={`/${basePath}/${dropdownItem.url}`}
                            className={cn(
                              "group relative flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                              "hover:bg-muted/60",
                              dropdownActive
                                ? "bg-primary/5 text-primary"
                                : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {dropdownActive && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                            )}
                            <dropdownItem.icon
                              className={cn(
                                "h-4 w-4 flex-shrink-0 ml-1",
                                dropdownActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                              )}
                            />
                            <span className={cn(
                              "flex-1 text-sm",
                              dropdownActive && "font-medium"
                            )}>
                              {dropdownItem.title}
                            </span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </SidebarMenu>
    </div>
  );
}