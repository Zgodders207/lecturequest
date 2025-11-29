import { ArrowLeft, Lock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Achievement } from "@shared/schema";
import { formatDate } from "@/lib/game-utils";

interface AchievementsViewProps {
  achievements: Achievement[];
  onBack: () => void;
}

export function AchievementsView({ achievements, onBack }: AchievementsViewProps) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercent = (unlockedCount / totalCount) * 100;

  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-8"
          data-testid="button-back"
          aria-label="Go back to dashboard"
        >
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          Back to Dashboard
        </Button>

        <div className="space-y-2 mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Achievements</h1>
          <p className="text-muted-foreground">
            {unlockedCount} of {totalCount} unlocked
          </p>
          <div className="max-w-xs pt-2">
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        </div>

        {unlockedAchievements.length > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
              <Check className="h-4 w-4" aria-hidden="true" />
              Unlocked
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {unlockedAchievements.map((achievement) => (
                <Card key={achievement.id} className="border-gold/20 bg-gold/5">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10 text-xl flex-shrink-0">
                        {getAchievementIcon(achievement.icon)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm">{achievement.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {achievement.description}
                        </p>
                        {achievement.unlockedDate && (
                          <p className="text-xs text-muted-foreground mt-1.5">
                            {formatDate(achievement.unlockedDate)}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {lockedAchievements.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
              <Lock className="h-4 w-4" aria-hidden="true" />
              Locked
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {lockedAchievements.map((achievement) => (
                <Card key={achievement.id} className="opacity-60">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-xl flex-shrink-0 grayscale">
                        {getAchievementIcon(achievement.icon)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-sm">{achievement.name}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {achievement.description}
                        </p>
                        {achievement.maxProgress && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-muted-foreground">
                                {achievement.progress || 0}/{achievement.maxProgress}
                              </span>
                            </div>
                            <Progress 
                              value={((achievement.progress || 0) / achievement.maxProgress) * 100}
                              className="h-1"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
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
