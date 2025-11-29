import { TrendingUp, Award, ArrowRight, Zap, Target, Trophy } from "lucide-react";
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
      <div className="max-w-md mx-auto px-6 py-16 animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="font-serif text-display-sm tracking-tight mb-3">
            {isDaily ? "Daily Quiz Complete" : "Quiz Complete"}
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {performanceInfo.message}
          </p>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Card className="card-hover">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
                <p className="text-3xl font-semibold tabular-nums">
                  {result.score}/{result.total}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Correct Answers</p>
              </CardContent>
            </Card>
            
            <Card className="card-hover">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Award className={`h-5 w-5 ${
                    result.accuracyPercent >= 80 
                      ? "text-success" 
                      : result.accuracyPercent >= 60 
                      ? "text-gold" 
                      : "text-muted-foreground"
                  }`} aria-hidden="true" />
                </div>
                <p className={`text-3xl font-semibold tabular-nums ${
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

          <Card className="border-gold/30 bg-gold/5 gold-glow">
            <CardContent className="p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-gold">
                <Zap className="h-6 w-6" aria-hidden="true" />
                <span className="text-3xl font-bold tabular-nums">+{result.xpEarned} XP</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Experience Earned</p>
            </CardContent>
          </Card>

          {isImprovement && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-center justify-center gap-3 text-primary">
                  <TrendingUp className="h-5 w-5" aria-hidden="true" />
                  <span className="font-medium text-lg">
                    +{Math.round(improvementPercent)}% improvement!
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {result.incorrectTopics.length > 0 && (
            <div className="space-y-3">
              <p className="font-medium">Topics to review:</p>
              <div className="flex flex-wrap gap-2">
                {result.incorrectTopics.map((topic, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary"
                    className="font-normal px-3 py-1"
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {newAchievements.length > 0 && (
            <Card className="border-gold/30 bg-gold/5">
              <CardContent className="p-5">
                <p className="font-medium mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-gold" aria-hidden="true" />
                  New Achievements Unlocked
                </p>
                <div className="space-y-3">
                  {newAchievements.map((achievement) => (
                    <div 
                      key={achievement.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-background/50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                        <Trophy className="h-5 w-5 text-gold" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="font-medium">{achievement.name}</p>
                        <p className="text-sm text-muted-foreground">
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
            className="w-full gap-2 rounded-xl"
            size="lg"
            data-testid="button-continue"
          >
            {isDaily ? "Back to Dashboard" : "Rate Your Confidence"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
