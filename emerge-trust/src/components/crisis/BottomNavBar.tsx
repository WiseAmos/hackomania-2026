import { useNavigate, useLocation } from "react-router-dom";
import { Camera, ThumbsUp, Home, User } from "lucide-react";

const NAV_ITEMS = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/claim", icon: Camera, label: "Claim" },
  { path: "/vote", icon: ThumbsUp, label: "Vote" },
  { path: "/profile", icon: User, label: "Profile" },
];

function BottomNavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-cr-surface border-t border-cr-orange/40"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main navigation"
    >
      <div className="flex">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 min-h-[56px] transition-colors ${
                isActive
                  ? "text-cr-orange"
                  : "text-cr-muted hover:text-cr-text"
              }`}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNavBar;
