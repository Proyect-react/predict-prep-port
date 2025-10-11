import { Link, useLocation } from "react-router-dom";
import { Database, Upload, Sparkles, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", icon: BarChart3, label: "Dashboard" },
  { path: "/upload", icon: Upload, label: "Cargar Datos" },
  { path: "/clean", icon: Database, label: "Limpiar Datos" },
  { path: "/train", icon: Sparkles, label: "Entrenar Modelo" },
  { path: "/settings", icon: Settings, label: "Configuración" },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
            <Database className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">ML Pipeline</h1>
            <p className="text-xs text-sidebar-foreground/60">Data Science Studio</p>
          </div>
        </div>

        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="pl-64">
        <div className="min-h-screen p-8">{children}</div>
      </main>
    </div>
  );
};
