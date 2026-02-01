import { motion } from "framer-motion";
import { Moon, BarChart3, Music, Bell, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { icon: Moon, label: "Sleep", path: "/" },
  { icon: BarChart3, label: "Stats", path: "/stats" },
  { icon: Music, label: "Sounds", path: "/sounds" },
  { icon: Bell, label: "Alarm", path: "/alarm" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 glass-card border-t border-border/50 px-4 py-2 z-50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-1 py-2 px-3 relative"
            >
              <motion.div
                className={`p-2 rounded-full transition-colors ${
                  isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <item.icon size={20} />
              </motion.div>
              <span
                className={`text-xs ${
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  className="absolute -top-1 left-1/2 w-1 h-1 rounded-full bg-primary"
                  layoutId="navIndicator"
                />
              )}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};
