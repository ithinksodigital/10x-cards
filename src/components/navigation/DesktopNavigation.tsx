import React from "react";
import { Button } from "../ui/button";
import { 
  HomeIcon, 
  SparklesIcon, 
  BookOpenIcon, 
  BrainIcon
} from "lucide-react";

interface DesktopNavigationProps {
  isAuthenticated?: boolean;
  currentPath?: string;
}

export const DesktopNavigation: React.FC<DesktopNavigationProps> = ({
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
      label: "Generuj fiszki",
      icon: SparklesIcon,
      show: true
    },
    {
      href: "/sets",
      label: "Moje zestawy",
      icon: BookOpenIcon,
      show: isAuthenticated
    },
    {
      href: "/study",
      label: "Sesje powtórkowe",
      icon: BrainIcon,
      show: isAuthenticated
    }
  ];

  const isActive = (href: string) => {
    if (href === "/" && currentPath === "/") return true;
    if (href !== "/" && currentPath.startsWith(href)) return true;
    return false;
  };

  return (
    <nav className="hidden md:flex items-center gap-1">
      {navigationItems.map((item) => {
        if (!item.show) return null;
        
        const Icon = item.icon;
        const active = isActive(item.href);
        
        return (
          <Button
            key={item.href}
            variant={active ? "secondary" : "ghost"}
            size="sm"
            className="gap-2"
            onClick={() => {
              window.location.href = item.href;
            }}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm">{item.label}</span>
          </Button>
        );
      })}
    </nav>
  );
};
