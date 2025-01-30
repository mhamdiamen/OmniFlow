import { Navbar } from "@/components/admin-panel/navbar";
import { Toaster } from "../ui/sonner";

interface ContentLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function ContentLayout({ title, children }: ContentLayoutProps) {
  return (
    <div>
      <Navbar title={title} />
      <div className=" pt-8 pb-8  sm:px-8">{children}</div>

    </div>
  );
}