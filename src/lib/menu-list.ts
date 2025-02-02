import {
  Tag,
  Users,
  Settings,
  Bookmark,
  SquarePen,
  LayoutGrid,
  LucideIcon,
  Book,
  FileText,
} from "lucide-react"; // Import the required icons

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
 *
 * @param pathname - The current pathname (can be used to mark routes as active).
 * @param userRole - The current user's role.
 */
export function getMenuList(pathname: string, userRole?: string): Group[] {
  // Base menu groups for all users
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
            {
              href: "/posts",
              label: "All Posts",
            },
            {
              href: "/posts/new",
              label: "New Post",
            },
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
          label: "My Stories", // New menu for My Stories
          icon: Book, // Using Book icon
        },
        {
          href: "/chapters",
          label: "My Chapters", // Adding My Chapters
          icon: FileText, // Using FileText icon
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

  // If the current user's role is "Super Admin", add extra admin-specific routes.
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
          label: "Manage Roles",
          icon: Users,
        },
        {
          href: "/modules",
          label: "Manage Modules",
          icon: Settings,
        },
      ],
    });
  }

  // (Optional) You can add logic here to mark menus/submenus as active based on pathname.

  return groups;
}
