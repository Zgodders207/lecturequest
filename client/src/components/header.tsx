import { Flame, Moon, Sun, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/components/theme-provider";
import type { UserProfile } from "@shared/schema";
import { getLevelTitle, xpForNextLevel } from "@/lib/game-utils";

interface HeaderProps {
  userProfile: UserProfile;
  onNavigate: (view: "dashboard" | "upload" | "achievements") => void;
  currentView: string;
  onLoadDemoData?: () => void;
}

export function Header({ userProfile, onNavigate, currentView, onLoadDemoData }: HeaderProps) {
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
          className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
          data-testid="link-home"
          aria-label="Go to dashboard"
        >
          <span className="font-serif text-xl tracking-tight">
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

          {onLoadDemoData && userProfile.totalLectures === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadDemoData}
              className="gap-2"
              data-testid="button-load-demo"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Load Sample Data</span>
              <span className="sm:hidden">Demo</span>
            </Button>
          )}

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
