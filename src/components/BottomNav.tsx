import { motion } from "framer-motion";
import { Moon, BarChart3, Music, Bell, BookOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useMissedAlarms } from "@/hooks/useMissedAlarms";

const navItems = [
  { icon: Moon, label: "Sleep", path: "/" },
  { icon: BarChart3, label: "Stats", path: "/stats" },
  { icon: BookOpen, label: "Dreams", path: "/dreams" },
  { icon: Music, label: "Sounds", path: "/sounds" },
  { icon: Bell, label: "Alarm", path: "/alarm" },
];

export const BottomNav = () => {
  const location = useLocation();
  const { missedCount } = useMissedAlarms();

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 glass-nav safe-area-bottom z-50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-md mx-auto flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const showBadge = item.path === "/alarm" && missedCount > 0;
          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-0.5 py-1 min-w-[56px] relative"
            >
              <motion.div
                className={`p-1.5 transition-colors duration-200 relative ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
                whileTap={{ scale: 0.9 }}
              >
                <item.icon size={24} strokeWidth={isActive ? 2 : 1.5} />
                {showBadge && (
                  <span className="absolute -top-0.5 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1 shadow-lg animate-pulse">
                    {missedCount > 9 ? "9+" : missedCount}
                  </span>
                )}
              </motion.div>
              <span
                className={`text-[10px] transition-colors duration-200 ${
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
};
