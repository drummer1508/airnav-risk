import {
  LayoutDashboard,
  AlertTriangle,
  Shield,
  FolderTree,
  Settings,
  Building2,
  Users,
  LogOut,
} from "lucide-react";
import logoImg from "@assets/logo-rnavrisk_1773195318168.png";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Risk Register", url: "/risks", icon: AlertTriangle },
  { title: "Mitigasi", url: "/mitigations", icon: Shield },
];

const adminNav = [
  { title: "Organisasi", url: "/org-units", icon: Building2 },
  { title: "Taxonomy", url: "/taxonomy", icon: FolderTree },
  { title: "Users", url: "/users", icon: Users },
];

const ROLE_LABELS: Record<string, string> = {
  sysadmin: "Sysadmin",
  inputer: "Inputer",
  reviewer: "Reviewer",
  approval: "Approval",
};

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout, isSysadmin } = useAuth();

  const isActive = (url: string) =>
    url === "/" ? location === "/" : location.startsWith(url);

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="AirNav ERM" className="h-10 w-auto" data-testid="img-sidebar-logo" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight" data-testid="text-app-name">
              AirNav ERM
            </span>
            <span className="text-xs text-muted-foreground">
              Enterprise Risk Management
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Utama</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={isActive(item.url)}
                    className="data-[active=true]:bg-sidebar-accent"
                  >
                    <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isSysadmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminNav.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive(item.url)}
                      className="data-[active=true]:bg-sidebar-accent"
                    >
                      <Link href={item.url} data-testid={`nav-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-3">
        {user && (
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate" data-testid="text-user-name">{user.fullName}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className="text-[10px]" data-testid="text-user-role">{ROLE_LABELS[user.role] || user.role}</Badge>
              </div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => logout()} data-testid="button-logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Settings className="h-3 w-3" />
          <span>AirNav Indonesia - ERM v2.0</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
