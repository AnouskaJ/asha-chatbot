import { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Settings, 
  Database, 
  MessageSquare, 
  Home, 
  Users 
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col bg-secondary/10">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <nav className="mt-8 flex-1 px-2 space-y-2">
            <Link href="/admin-dashboard" className="block">
              <Button variant="ghost" className="w-full justify-start">
                <Home className="h-5 w-5 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link href="/admin-analytics" className="block">
              <Button variant="ghost" className="w-full justify-start">
                <BarChart3 className="h-5 w-5 mr-2" />
                Analytics
              </Button>
            </Link>
            <Link href="/admin-sessions" className="block">
              <Button variant="ghost" className="w-full justify-start">
                <Database className="h-5 w-5 mr-2" />
                Sessions
              </Button>
            </Link>
            <Link href="/admin-feedback" className="block">
              <Button variant="ghost" className="w-full justify-start">
                <MessageSquare className="h-5 w-5 mr-2" />
                Feedback
              </Button>
            </Link>
            <Link href="/admin-users" className="block">
              <Button variant="ghost" className="w-full justify-start">
                <Users className="h-5 w-5 mr-2" />
                Users
              </Button>
            </Link>
            <Link href="/admin-settings" className="block">
              <Button variant="ghost" className="w-full justify-start">
                <Settings className="h-5 w-5 mr-2" />
                Settings
              </Button>
            </Link>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
} 