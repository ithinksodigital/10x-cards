import React from "react";
import { 
  HomeIcon, 
  SparklesIcon, 
  BookOpenIcon, 
  BrainIcon,
  UserIcon
} from "lucide-react";

interface BottomNavigationProps {
  isAuthenticated?: boolean;
  currentPath?: string;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  isAuthenticated,
  currentPath = "/"
}) => {
  const navigationItems = [
    {
      href: "/",
      label: "Strona główna",
      icon: HomeIcon,
      show: true
    },
    {
      href: "/generate",
      label: "Generuj",
      icon: SparklesIcon,
      show: true
    },
    {
      href: "/sets",
      label: "Zestawy",
      icon: BookOpenIcon,
      show: isAuthenticated
    },
    {
      href: "/study",
      label: "Nauka",
      icon: BrainIcon,
      show: isAuthenticated
    },
    {
      href: "/auth/login",
      label: "Profil",
      icon: UserIcon,
      show: !isAuthenticated
    }
  ];

  const isActive = (href: string) => {
    if (href === "/" && currentPath === "/") return true;
    if (href !== "/" && currentPath.startsWith(href)) return true;
    return false;
  };

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border md:hidden">
      <div className="flex items-center justify-around px-2 py-1">
        {navigationItems.map((item) => {
          if (!item.show) return null;
          
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <button
              key={item.href}
              onClick={() => {
                window.location.href = item.href;
              }}
              className={`flex flex-col items-center justify-center py-2 px-3 min-w-0 flex-1 transition-colors ${
                active 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={item.label}
            >
              <Icon className={`h-5 w-5 mb-1 ${active ? "scale-110" : ""} transition-transform`} />
              <span className="text-xs font-medium truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
