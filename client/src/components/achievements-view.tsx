import { ArrowLeft, Lock, Check, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <div className="container max-w-3xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-6"
        data-testid="button-back"
        aria-label="Go back to dashboard"
      >
        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
        Back to Dashboard
      </Button>

      <Card className="mb-8 border-border/50 overflow-hidden">
        <div className="h-2 xp-gradient-animated" />
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold/20 to-gold/10">
            <Trophy className="h-8 w-8 text-gold" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl">Achievements</CardTitle>
          <CardDescription className="text-base">
            {unlockedCount} of {totalCount} achievements unlocked
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm mx-auto">
            <Progress value={progressPercent} className="h-3" />
            <p className="text-center text-sm text-muted-foreground mt-2">
              {Math.round(progressPercent)}% complete
            </p>
          </div>
        </CardContent>
      </Card>

      {unlockedAchievements.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Check className="h-5 w-5 text-success" aria-hidden="true" />
            Unlocked ({unlockedAchievements.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {unlockedAchievements.map((achievement) => (
              <Card
                key={achievement.id}
                className="border-gold/30 bg-gold/5 achievement-glow"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gold/20 text-3xl">
                      {getAchievementIcon(achievement.icon)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{achievement.name}</h3>
                        <Badge variant="secondary" className="bg-gold/20 text-gold">
                          Unlocked
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {achievement.description}
                      </p>
                      {achievement.unlockedDate && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Earned {formatDate(achievement.unlockedDate)}
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
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            Locked ({lockedAchievements.length})
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {lockedAchievements.map((achievement) => (
              <Card
                key={achievement.id}
                className="opacity-70"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-3xl grayscale">
                      {getAchievementIcon(achievement.icon)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{achievement.name}</h3>
                        <Lock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {achievement.description}
                      </p>
                      {achievement.maxProgress && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">
                              {achievement.progress || 0}/{achievement.maxProgress}
                            </span>
                          </div>
                          <Progress 
                            value={((achievement.progress || 0) / achievement.maxProgress) * 100}
                            className="h-2"
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
