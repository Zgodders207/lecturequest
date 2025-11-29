import { Flame, Moon, Sun, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/components/theme-provider";
import type { UserProfile } from "@shared/schema";
import { getLevelTitle, xpForNextLevel } from "@/lib/game-utils";

interface HeaderProps {
  userProfile: UserProfile;
  onNavigate: (view: "dashboard" | "upload" | "achievements") => void;
  currentView: string;
}

export function Header({ userProfile, onNavigate, currentView }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  const currentLevelXP = Math.pow(userProfile.level, 2) * 100;
  const nextLevelXP = xpForNextLevel(userProfile.level);
  const xpInLevel = userProfile.totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const progressPercent = Math.min(100, (xpInLevel / xpNeeded) * 100);

  return (
    <header 
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
      role="banner"
    >
      <div className="max-w-5xl mx-auto flex h-16 items-center justify-between gap-6 px-6">
        <button
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md group"
          data-testid="link-home"
          aria-label="Go to dashboard"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary transition-transform group-hover:scale-105">
            <span className="text-primary-foreground font-serif font-semibold text-lg">L</span>
          </div>
          <span className="font-serif text-xl tracking-tight hidden sm:inline-block">
            LectureQuest
          </span>
        </button>

        <div className="flex items-center gap-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-4 cursor-default">
                <div className="flex items-center gap-1.5 text-sm">
                  <span className="font-medium">Level {userProfile.level}</span>
                </div>
                
                <div className="hidden sm:flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-gold" aria-hidden="true" />
                    <span className="text-sm font-medium tabular-nums text-gold">
                      {userProfile.totalXP.toLocaleString()}
                    </span>
                  </div>
                  
                  {userProfile.currentStreak > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-gold" aria-hidden="true" />
                      <span className="text-sm font-medium tabular-nums">{userProfile.currentStreak}</span>
                    </div>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="space-y-2 py-1">
                <p className="font-serif font-medium text-base">
                  {getLevelTitle(userProfile.level)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {userProfile.totalXP.toLocaleString()} XP total
                </p>
                <p className="text-sm text-muted-foreground">
                  {(nextLevelXP - userProfile.totalXP).toLocaleString()} XP to next level
                </p>
                {userProfile.currentStreak > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {userProfile.currentStreak} day streak (best: {userProfile.longestStreak})
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>

          <div className="w-28 hidden md:block">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full progress-smooth"
                style={{ width: `${progressPercent}%` }}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`XP progress: ${Math.round(progressPercent)}%`}
              />
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
            data-testid="button-theme-toggle"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
            ) : (
              <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
