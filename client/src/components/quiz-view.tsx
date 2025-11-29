import { useState, useEffect } from "react";
import { Check, X, Lightbulb, RotateCcw, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Question, UserProfile } from "@shared/schema";

interface QuizViewProps {
  questions: Question[];
  lectureTitle: string;
  userProfile: UserProfile;
  onComplete: (answers: { questionIndex: number; selectedAnswer: number; isCorrect: boolean }[]) => void;
  onUseHint: () => void;
  onUseSecondChance: () => void;
  isDaily?: boolean;
}

export function QuizView({
  questions,
  lectureTitle,
  userProfile,
  onComplete,
  onUseHint,
  onUseSecondChance,
  isDaily = false,
}: QuizViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ questionIndex: number; selectedAnswer: number; isCorrect: boolean }[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [floatingXP, setFloatingXP] = useState<{ id: number; amount: number } | null>(null);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [usedSecondChance, setUsedSecondChance] = useState(false);
  const [shakeWrong, setShakeWrong] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const canUseHint = userProfile.powerUps.hints > 0 && eliminatedOptions.length === 0;
  const canUseSecondChance = userProfile.powerUps.secondChance > 0 && !usedSecondChance && showFeedback && selectedAnswer !== currentQuestion.correct;

  const handleSelectAnswer = (index: number) => {
    if (showFeedback || eliminatedOptions.includes(index)) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === currentQuestion.correct;
    
    if (!isCorrect) {
      setShakeWrong(true);
      setTimeout(() => setShakeWrong(false), 500);
    } else {
      const earnedXP = 10;
      setXpEarned((prev) => prev + earnedXP);
      setFloatingXP({ id: Date.now(), amount: earnedXP });
      setTimeout(() => setFloatingXP(null), 1500);
    }

    setShowFeedback(true);
    setAnswers((prev) => [...prev, { questionIndex: currentIndex, selectedAnswer, isCorrect }]);
  };

  const handleNextQuestion = () => {
    if (isLastQuestion) {
      onComplete(answers);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setEliminatedOptions([]);
      setUsedSecondChance(false);
    }
  };

  const handleUseHint = () => {
    if (!canUseHint) return;
    
    const wrongOptions = currentQuestion.options
      .map((_, i) => i)
      .filter((i) => i !== currentQuestion.correct);
    
    const toEliminate = wrongOptions.slice(0, 2);
    setEliminatedOptions(toEliminate);
    onUseHint();
  };

  const handleUseSecondChance = () => {
    if (!canUseSecondChance) return;
    
    setShowFeedback(false);
    setSelectedAnswer(null);
    setUsedSecondChance(true);
    setEliminatedOptions([selectedAnswer!]);
    setAnswers((prev) => prev.slice(0, -1));
    onUseSecondChance();
  };

  useEffect(() => {
    if (showFeedback) {
      const timer = setTimeout(() => {
        if (isLastQuestion) {
          onComplete(answers);
        }
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showFeedback, answers, isLastQuestion, onComplete]);

  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-sm">
            {isDaily ? "Daily Quiz" : lectureTitle}
          </Badge>
          <div className="flex items-center gap-2 text-gold font-semibold">
            <Zap className="h-4 w-4" aria-hidden="true" />
            <span>{xpEarned} XP earned</span>
            {floatingXP && (
              <span
                key={floatingXP.id}
                className="absolute animate-float-up text-gold font-bold"
                aria-live="polite"
              >
                +{floatingXP.amount} XP
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <Progress 
            value={progressPercent} 
            className="flex-1 h-2"
            aria-label={`Progress: ${currentIndex + 1} of ${questions.length} questions`}
          />
        </div>
      </div>

      <Card className={`border-border/50 ${shakeWrong ? "animate-shake" : ""}`}>
        <CardHeader>
          <CardTitle className="text-xl leading-relaxed">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3" role="radiogroup" aria-label="Answer options">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === currentQuestion.correct;
              const isEliminated = eliminatedOptions.includes(index);
              const showCorrect = showFeedback && isCorrect;
              const showWrong = showFeedback && isSelected && !isCorrect;

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={showFeedback || isEliminated}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    isEliminated
                      ? "opacity-30 cursor-not-allowed border-border bg-muted line-through"
                      : showCorrect
                      ? "border-success bg-success/10"
                      : showWrong
                      ? "border-destructive bg-destructive/10"
                      : isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover-elevate"
                  }`}
                  role="radio"
                  aria-checked={isSelected}
                  aria-disabled={showFeedback || isEliminated}
                  data-testid={`option-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 font-semibold text-sm ${
                        showCorrect
                          ? "border-success bg-success text-white"
                          : showWrong
                          ? "border-destructive bg-destructive text-white"
                          : isSelected
                          ? "border-primary bg-primary text-white"
                          : "border-muted-foreground"
                      }`}
                    >
                      {showCorrect ? (
                        <Check className="h-5 w-5 check-bounce" aria-hidden="true" />
                      ) : showWrong ? (
                        <X className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        String.fromCharCode(65 + index)
                      )}
                    </div>
                    <span className={showWrong ? "text-muted-foreground" : ""}>
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {showFeedback && (
            <div
              className={`p-4 rounded-lg ${
                selectedAnswer === currentQuestion.correct
                  ? "bg-success/10 border border-success/30"
                  : "bg-muted border border-border"
              }`}
              role="alert"
            >
              <div className="flex items-start gap-2">
                <Lightbulb className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-medium mb-1">
                    {selectedAnswer === currentQuestion.correct
                      ? "Correct!"
                      : "Not quite right"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentQuestion.explanation}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            {!showFeedback && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUseHint}
                  disabled={!canUseHint}
                  className="gap-2"
                  data-testid="button-hint"
                >
                  <Lightbulb className="h-4 w-4" aria-hidden="true" />
                  Hint ({userProfile.powerUps.hints})
                </Button>
              </>
            )}

            {showFeedback && canUseSecondChance && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseSecondChance}
                className="gap-2"
                data-testid="button-second-chance"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Second Chance ({userProfile.powerUps.secondChance})
              </Button>
            )}

            <div className="flex-1" />

            {!showFeedback ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                className={selectedAnswer !== null ? "animate-pulse-glow" : ""}
                data-testid="button-submit-answer"
              >
                Submit Answer
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                className="gap-2"
                data-testid="button-next-question"
              >
                {isLastQuestion ? "View Results" : "Next Question"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
