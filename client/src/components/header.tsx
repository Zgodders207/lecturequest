import { Flame, Trophy, Moon, Sun, Zap, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/components/theme-provider";
import type { UserProfile } from "@shared/schema";
import { getLevelTitle, getStreakMultiplier, xpForNextLevel, xpProgressInLevel } from "@/lib/game-utils";

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
  const streakMultiplier = getStreakMultiplier(userProfile.currentStreak);

  return (
    <header 
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="banner"
    >
      <div className="container flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-primary rounded-md"
            data-testid="link-home"
            aria-label="Go to dashboard"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary">
              <BookOpen className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <span className="hidden font-bold text-lg gradient-text sm:inline-block">
              LectureQuest
            </span>
          </button>
        </div>

        <div className="flex flex-1 items-center justify-center gap-3 md:gap-6 max-w-xl">
          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="flex items-center gap-2 cursor-default"
                data-testid="display-level"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary text-white font-bold text-sm shadow-lg">
                  {userProfile.level}
                </div>
                <div className="hidden md:block">
                  <p className="text-xs text-muted-foreground">Level</p>
                  <p className="text-sm font-semibold leading-none">
                    {getLevelTitle(userProfile.level)}
                  </p>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Level {userProfile.level} - {getLevelTitle(userProfile.level)}</p>
            </TooltipContent>
          </Tooltip>

          <div className="flex-1 max-w-[200px] md:max-w-[280px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gold font-semibold flex items-center gap-1">
                <Zap className="h-3 w-3" aria-hidden="true" />
                {userProfile.totalXP.toLocaleString()} XP
              </span>
              <span className="text-muted-foreground">
                {(nextLevelXP - userProfile.totalXP).toLocaleString()} to Lvl {userProfile.level + 1}
              </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-muted">
              <div 
                className="h-full xp-gradient-animated rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`XP progress: ${Math.round(progressPercent)}%`}
              />
            </div>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <div 
                className="flex items-center gap-1.5 cursor-default"
                data-testid="display-streak"
              >
                <Flame 
                  className={`h-5 w-5 ${
                    userProfile.currentStreak > 0 
                      ? "text-gold animate-pulse" 
                      : "text-muted-foreground"
                  }`}
                  aria-hidden="true"
                />
                <div className="text-right">
                  <span className="font-bold text-sm">
                    {userProfile.currentStreak}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">
                    day{userProfile.currentStreak !== 1 ? "s" : ""}
                  </span>
                  {streakMultiplier && (
                    <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 py-0 bg-gold/20 text-gold border-gold/30">
                      {streakMultiplier}
                    </Badge>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {userProfile.currentStreak} day streak
                {streakMultiplier && ` (${streakMultiplier})`}
              </p>
              <p className="text-xs text-muted-foreground">
                Longest: {userProfile.longestStreak} days
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onNavigate("achievements")}
                className={currentView === "achievements" ? "bg-muted" : ""}
                data-testid="button-achievements"
                aria-label="View achievements"
              >
                <Trophy className="h-5 w-5 text-gold" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Achievements</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                data-testid="button-theme-toggle"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Moon className="h-5 w-5" aria-hidden="true" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{theme === "dark" ? "Light" : "Dark"} mode</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}
