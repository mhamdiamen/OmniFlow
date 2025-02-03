"use client";

import Link from "next/link";
import { Ellipsis, Loader2, LogOut } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getMenuList } from "@/lib/menu-list";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CollapseMenuButton } from "@/components/admin-panel/collapse-menu-button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from "@/components/ui/tooltip";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
// Import the hook that fetches the current user.
import { useCurrentUser } from "@/app/api/use-current-user";
// Import your modules query (adjust the import to your project structure)
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface MenuProps {
  isOpen: boolean | undefined;
}

export function Menu({ isOpen }: MenuProps) {
  const { signOut } = useAuthActions();
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();

  // Retrieve the current user (including role)
  const { data: currentUser, isLoading } = useCurrentUser();
  const userRole = currentUser?.role || "Guest";

  // Fetch activated modules (if any) using the current user's companyId.
  const activatedModules = useQuery(
    api.queries.modules.getActivatedModules,
    currentUser?.companyId ? { companyId: currentUser.companyId } : "skip"
  );

  // Get the menu list with the current user's role and activated modules.
  const menuList = getMenuList(pathname, userRole, activatedModules);

  // Optionally, show a loader while waiting for user data.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <ScrollArea className="[&>div>div[style]]:!block">
      <nav className="mt-8 h-full w-full">
        <ul className="flex flex-col min-h-[calc(100vh-48px-36px-16px-32px)] lg:min-h-[calc(100vh-32px-40px-32px)] items-start space-y-1 px-2">
          {menuList.map(({ groupLabel, menus }, groupIndex) => (
            <li className={cn("w-full", groupLabel ? "pt-5" : "")} key={groupIndex}>
              {((isOpen && groupLabel) || isOpen === undefined) ? (
                <p className="text-sm font-medium text-muted-foreground px-4 pb-2 max-w-[248px] truncate">
                  {groupLabel}
                </p>
              ) : (
                groupLabel && (
                  <TooltipProvider>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger className="w-full">
                        <div className="w-full flex justify-center items-center">
                          <Ellipsis className="h-5 w-5" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{groupLabel}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )
              )}
              {menus.map(({ href, label, icon: Icon, active, submenus }, menuIndex) =>
                !submenus || submenus.length === 0 ? (
                  <div className="w-full" key={menuIndex}>
                    <TooltipProvider disableHoverableContent>
                      <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                          <Button
                            variant={
                              (active === undefined && pathname.startsWith(href)) || active
                                ? "secondary"
                                : "ghost"
                            }
                            className="w-full justify-start h-10 mb-1"
                            asChild
                          >
                            <Link href={href}>
                              <span className={cn(isOpen === false ? "" : "mr-4")}>
                                <Icon size={18} />
                              </span>
                              <p
                                className={cn(
                                  "max-w-[200px] truncate",
                                  isOpen === false
                                    ? "-translate-x-96 opacity-0"
                                    : "translate-x-0 opacity-100"
                                )}
                              >
                                {label}
                              </p>
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        {isOpen === false && (
                          <TooltipContent side="right">
                            {label}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                ) : (
                  <div className="w-full" key={menuIndex}>
                    <CollapseMenuButton
                      icon={Icon}
                      label={label}
                      active={active === undefined ? pathname.startsWith(href) : active}
                      submenus={submenus}
                      isOpen={isOpen}
                    />
                  </div>
                )
              )}
            </li>
          ))}
          <li className="w-full grow flex items-end">
            <TooltipProvider disableHoverableContent>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => {
                      setSigningOut(true);
                      signOut().finally(() => {
                        setSigningOut(false);
                      });
                    }}
                    variant="outline"
                    className="w-full justify-center h-10 mt-5"
                    disabled={signingOut}
                  >
                    <span className={cn(isOpen === false ? "" : "mr-4")}>
                      {signingOut ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut size={18} />
                      )}
                    </span>
                    <p
                      className={cn(
                        "whitespace-nowrap",
                        isOpen === false ? "opacity-0 hidden" : "opacity-100"
                      )}
                    >
                      Sign out
                    </p>
                  </Button>
                </TooltipTrigger>
                {isOpen === false && (
                  <TooltipContent side="right">Sign out</TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </li>
        </ul>
      </nav>
    </ScrollArea>
  );
}
