import {
  Tag,
  Users,
  Settings,
  Bookmark,
  SquarePen,
  LayoutGrid,
  LucideIcon,
  Book,
  FileText
} from "lucide-react"; // Import the Book icon for "My Chapters"

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

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
        {
          href: "/",
          label: "Home",
          icon: LayoutGrid,
          submenus: []
        }
      ]
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
              label: "All Posts"
            },
            {
              href: "/posts/new",
              label: "New Post"
            }
          ]
        },
        {
          href: "/categories",
          label: "Categories",
          icon: Bookmark
        },
        {
          href: "/tags",
          label: "Tags",
          icon: Tag
        },
        {
          href: "/stories",
          label: "My Stories", // New menu for My Stories
          icon:Book  // Use FileText icon for representation
        },
        {
          href: "/chapters",
          label: "My Chapters", // Adding My Chapters
          icon: FileText // Use the Book icon for representation
        }
      ]
    },
    {
      groupLabel: "Settings",
      menus: [
        {
          href: "/users",
          label: "Users",
          icon: Users
        },
        {
          href: "/account",
          label: "Account",
          icon: Settings
        }
      ]
    }
  ];
}
