import { Flame, Moon, Sun, Zap, BookOpen } from "lucide-react";
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
      className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="banner"
    >
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between gap-4 px-6">
        <button
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          data-testid="link-home"
          aria-label="Go to dashboard"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <BookOpen className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
          </div>
          <span className="font-semibold hidden sm:inline-block">
            LectureQuest
          </span>
        </button>

        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-3 cursor-default">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium tabular-nums">Lvl {userProfile.level}</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                  <span className="text-sm tabular-nums">{userProfile.totalXP.toLocaleString()}</span>
                </div>
                {userProfile.currentStreak > 0 && (
                  <div className="flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                    <span className="text-sm tabular-nums">{userProfile.currentStreak}</span>
                  </div>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <div className="space-y-1">
                <p className="font-medium">Level {userProfile.level} - {getLevelTitle(userProfile.level)}</p>
                <p className="text-xs text-muted-foreground">
                  {userProfile.totalXP.toLocaleString()} XP total
                </p>
                <p className="text-xs text-muted-foreground">
                  {(nextLevelXP - userProfile.totalXP).toLocaleString()} XP to next level
                </p>
                {userProfile.currentStreak > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {userProfile.currentStreak} day streak (best: {userProfile.longestStreak})
                  </p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>

          <div className="w-24 hidden md:block">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-500"
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
            className="h-8 w-8"
            data-testid="button-theme-toggle"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>
    </header>
  );
}
