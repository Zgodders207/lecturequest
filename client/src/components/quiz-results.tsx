import { Check, X, TrendingUp, Award, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const getPerformanceIcon = () => {
    switch (performanceInfo.type) {
      case "perfect":
        return <Sparkles className="h-12 w-12 text-gold" aria-hidden="true" />;
      case "improvement":
        return <TrendingUp className="h-12 w-12 text-success" aria-hidden="true" />;
      case "good":
        return <Check className="h-12 w-12 text-success" aria-hidden="true" />;
      default:
        return <Award className="h-12 w-12 text-primary" aria-hidden="true" />;
    }
  };

  return (
    <div className="container max-w-lg mx-auto px-4 py-8">
      <Card className="border-border/50 text-center overflow-hidden">
        <div className="h-2 xp-gradient-animated" />
        
        <CardHeader className="pb-4">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
            {getPerformanceIcon()}
          </div>
          
          <CardTitle className="text-3xl">
            {isDaily ? "Daily Quiz Complete!" : "Review Complete!"}
          </CardTitle>
          
          <p className="text-lg text-muted-foreground mt-2">
            {performanceInfo.message}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-4xl font-bold gradient-text">
                {result.score}/{result.total}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Questions Correct</p>
            </div>
            
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-4xl font-bold">
                <span className={
                  result.accuracyPercent >= 80 
                    ? "text-success" 
                    : result.accuracyPercent >= 60 
                    ? "text-gold" 
                    : "text-muted-foreground"
                }>
                  {result.accuracyPercent}%
                </span>
              </p>
              <p className="text-sm text-muted-foreground mt-1">Accuracy</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gold/10 border border-gold/30">
            <div className="flex items-center justify-center gap-2 text-gold">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
              <span className="text-2xl font-bold">+{result.xpEarned} XP</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">Experience earned</p>
          </div>

          {isImprovement && (
            <div className="p-4 rounded-lg bg-success/10 border border-success/30">
              <div className="flex items-center justify-center gap-2 text-success">
                <TrendingUp className="h-5 w-5" aria-hidden="true" />
                <span className="text-lg font-bold">
                  +{Math.round(improvementPercent)}% Improvement!
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                +20 XP Improvement Bonus
              </p>
            </div>
          )}

          {result.incorrectTopics.length > 0 && (
            <div className="text-left">
              <p className="text-sm font-medium mb-2">Areas to focus on:</p>
              <div className="flex flex-wrap gap-2">
                {result.incorrectTopics.map((topic, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary"
                    className="bg-destructive/10 text-destructive border-destructive/20"
                  >
                    {topic}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {newAchievements.length > 0 && (
            <div className="p-4 rounded-lg bg-gold/10 border border-gold/30 text-left">
              <p className="text-sm font-medium mb-2 flex items-center gap-2 text-gold">
                <Award className="h-4 w-4" aria-hidden="true" />
                Achievements Unlocked!
              </p>
              <div className="space-y-2">
                {newAchievements.map((achievement) => (
                  <div 
                    key={achievement.id}
                    className="flex items-center gap-2 p-2 rounded bg-gold/10"
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
            </div>
          )}

          <Button
            onClick={onContinue}
            className="w-full h-12 text-lg animate-pulse-glow gap-2"
            data-testid="button-continue"
          >
            {isDaily ? "View Dashboard" : "Rate Your Confidence"}
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
