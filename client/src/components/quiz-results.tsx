import { TrendingUp, Award, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPerformanceMessage } from "@/lib/game-utils";
import type { QuizResult, Achievement } from "@shared/schema";

interface QuizResultsProps {
  result: QuizResult;
  newAchievements: Achievement[];
  onContinue: () => void;
  isDaily?: boolean;
  previousScore?: number;
}

export function QuizResults({
  result,
  newAchievements,
  onContinue,
  isDaily = false,
  previousScore,
}: QuizResultsProps) {
  const isImprovement = isDaily && previousScore !== undefined && result.accuracyPercent > previousScore;
  const improvementPercent = isImprovement ? result.accuracyPercent - previousScore : 0;
  
  const performanceInfo = getPerformanceMessage(
    result.score,
    result.total,
    isImprovement,
    improvementPercent
  );

  return (
    <div className="min-h-screen">
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            {isDaily ? "Daily Quiz Complete" : "Quiz Complete"}
          </h1>
          <p className="text-muted-foreground">
            {performanceInfo.message}
          </p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <p className="text-3xl font-bold tabular-nums">
                  {result.score}/{result.total}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Correct</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <p className={`text-3xl font-bold tabular-nums ${
                  result.accuracyPercent >= 80 
                    ? "text-success" 
                    : result.accuracyPercent >= 60 
                    ? "text-gold" 
                    : ""
                }`}>
                  {result.accuracyPercent}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">Accuracy</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-gold/20 bg-gold/5">
            <CardContent className="pt-6 pb-6 text-center">
              <div className="flex items-center justify-center gap-2 text-gold">
                <Zap className="h-5 w-5" aria-hidden="true" />
                <span className="text-2xl font-bold">+{result.xpEarned} XP</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Earned</p>
            </CardContent>
          </Card>

          {isImprovement && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <TrendingUp className="h-5 w-5" aria-hidden="true" />
                  <span className="font-medium">
                    +{Math.round(improvementPercent)}% improvement
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {result.incorrectTopics.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Review these topics:</p>
              <div className="flex flex-wrap gap-2">
                {result.incorrectTopics.map((topic, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary"
                    className="font-normal"
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {newAchievements.length > 0 && (
            <Card className="border-gold/20 bg-gold/5">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4 text-gold" aria-hidden="true" />
                  New Achievements
                </p>
                <div className="space-y-2">
                  {newAchievements.map((achievement) => (
                    <div 
                      key={achievement.id}
                      className="flex items-center gap-3 p-2 rounded-md bg-background/50"
                    >
                      <span className="text-lg">{achievement.icon}</span>
                      <div>
                        <p className="font-medium text-sm">{achievement.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {achievement.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={onContinue}
            className="w-full gap-2"
            size="lg"
            data-testid="button-continue"
          >
            {isDaily ? "Back to Dashboard" : "Rate Confidence"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
