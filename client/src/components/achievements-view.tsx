import { ArrowLeft, Lock, Check, Trophy, Zap, Flame, BookOpen, Target, TrendingUp, Award } from "lucide-react";
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
      <div className="max-w-2xl mx-auto px-6 py-16 animate-fade-in">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-10 -ml-2"
          data-testid="button-back"
          aria-label="Go back to dashboard"
        >
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          Back
        </Button>

        <div className="space-y-4 mb-12">
          <h1 className="font-serif text-display-sm tracking-tight">Achievements</h1>
          <p className="text-lg text-muted-foreground">
            {unlockedCount} of {totalCount} unlocked
          </p>
          <div className="max-w-sm pt-2">
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>

        {unlockedAchievements.length > 0 && (
          <section className="mb-12">
            <h2 className="text-sm font-medium text-muted-foreground mb-5 flex items-center gap-2 uppercase tracking-wide">
              <Check className="h-4 w-4" aria-hidden="true" />
              Unlocked
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {unlockedAchievements.map((achievement) => (
                <Card key={achievement.id} className="border-gold/30 bg-gold/5 card-hover">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gold/10 flex-shrink-0">
                        {getAchievementIcon(achievement.icon)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium">{achievement.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {achievement.description}
                        </p>
                        {achievement.unlockedDate && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Unlocked {formatDate(achievement.unlockedDate)}
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
            <h2 className="text-sm font-medium text-muted-foreground mb-5 flex items-center gap-2 uppercase tracking-wide">
              <Lock className="h-4 w-4" aria-hidden="true" />
              Locked
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {lockedAchievements.map((achievement) => (
                <Card key={achievement.id} className="opacity-60">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted flex-shrink-0 grayscale">
                        {getAchievementIcon(achievement.icon)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium">{achievement.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {achievement.description}
                        </p>
                        {achievement.maxProgress && (
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-muted-foreground tabular-nums">
                                {achievement.progress || 0}/{achievement.maxProgress}
                              </span>
                            </div>
                            <Progress 
                              value={((achievement.progress || 0) / achievement.maxProgress) * 100}
                              className="h-1.5"
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

function getAchievementIcon(iconName: string) {
  const iconClass = "h-6 w-6 text-gold";
  const iconComponents: Record<string, JSX.Element> = {
    footprints: <TrendingUp className={iconClass} />,
    zap: <Zap className={iconClass} />,
    "book-open": <BookOpen className={iconClass} />,
    "trending-up": <TrendingUp className={iconClass} />,
    star: <Award className={iconClass} />,
    flame: <Flame className={iconClass} />,
    crown: <Trophy className={iconClass} />,
    moon: <Award className={iconClass} />,
    sunrise: <Award className={iconClass} />,
    target: <Target className={iconClass} />,
    search: <BookOpen className={iconClass} />,
  };
  return iconComponents[iconName] || <Trophy className={iconClass} />;
}
