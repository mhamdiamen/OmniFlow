// src/lib/menu-list.ts
import {
  Tag,
  Users,
  Settings,
  Bookmark,
  SquarePen,
  LayoutGrid,
  Book,
  FileText,
  LucideIcon,
} from "lucide-react";

export type ModuleItem = {
  id: string;
  name: string;
  route: string;
  icon?: LucideIcon;
};

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

/**
 * Returns the list of menu groups.
 */
export function getMenuList(
  pathname: string,
  userRole?: string,
  modules?: ModuleItem[]
): Group[] {
  const groups: Group[] = [
    {
      groupLabel: "",
      menus: [
        {
          href: "/",
          label: "Home",
          icon: LayoutGrid,
          submenus: [],
        },
      ],
    },
    {
      groupLabel: "Contents",
      menus: [
        {
          href: "",
          label: "Posts",
          icon: SquarePen,
          submenus: [
            { href: "/posts", label: "All Posts" },
            { href: "/posts/new", label: "New Post" },
          ],
        },
        {
          href: "/categories",
          label: "Categories",
          icon: Bookmark,
        },
        {
          href: "/tags",
          label: "Tags",
          icon: Tag,
        },
        {
          href: "/stories",
          label: "My Stories",
          icon: Book,
        },
        {
          href: "/chapters",
          label: "My Chapters",
          icon: FileText,
        },
      ],
    },
    {
      groupLabel: "Settings",
      menus: [
        {
          href: "/users",
          label: "Users",
          icon: Users,
        },
        {
          href: "/account",
          label: "Account",
          icon: Settings,
        },
      ],
    },
  ];

  // Append module items with their dedicated routes.
  if (modules && modules.length > 0) {
    groups.push({
      groupLabel: "Modules",
      menus: modules.map((mod) => ({
        href: mod.route, // For example, "/crm" or "/project-management"
        label: mod.name,
        icon: mod.icon || Settings,
      })),
    });
  }

  if (userRole === "Super Admin") {
    groups.push({
      groupLabel: "Super Administration",
      menus: [
        {
          href: "/(superAdmin)/dashboard",
          label: "Admin Dashboard",
          icon: LayoutGrid,
        },
        {
          href: "/roles",
          label: "Roles & Permissions",
          icon: Users,
        },
        {
          href: "/modules",
          label: "Modules",
          icon: Settings,
        },
      ],
    });
  }

  return groups;
}
