import { useEffect, useState } from "react";
import { Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Achievement } from "@shared/schema";

interface AchievementToastProps {
  achievement: Achievement;
  onDismiss: () => void;
}

export function AchievementToast({ achievement, onDismiss }: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      }`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-4 p-4 rounded-lg bg-card border border-gold/30 shadow-xl achievement-glow">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/20 text-2xl flex-shrink-0">
          {getAchievementIcon(achievement.icon)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="h-4 w-4 text-gold" aria-hidden="true" />
            <span className="text-xs font-medium text-gold uppercase tracking-wide">
              Achievement Unlocked!
            </span>
          </div>
          <p className="font-semibold">{achievement.name}</p>
          <p className="text-sm text-muted-foreground">
            {achievement.description}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="flex-shrink-0 h-8 w-8"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

interface AchievementToastStackProps {
  achievements: Achievement[];
  onDismiss: (id: string) => void;
}

export function AchievementToastStack({ achievements, onDismiss }: AchievementToastStackProps) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {achievements.map((achievement, index) => (
        <div
          key={achievement.id}
          style={{ transform: `translateY(${index * 8}px)` }}
        >
          <AchievementToast
            achievement={achievement}
            onDismiss={() => onDismiss(achievement.id)}
          />
        </div>
      ))}
    </div>
  );
}

function getAchievementIcon(iconName: string): string {
  const icons: Record<string, string> = {
    footprints: "👣",
    zap: "⚡",
    "book-open": "📖",
    "trending-up": "📈",
    star: "⭐",
    flame: "🔥",
    crown: "👑",
    moon: "🌙",
    sunrise: "🌅",
    target: "🎯",
    search: "🔍",
  };
  return icons[iconName] || "🏆";
}
