import { useState, useEffect } from "react";
import { Check, X, Lightbulb, RotateCcw, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {isDaily ? "Daily Quiz" : lectureTitle}
            </span>
            <div className="flex items-center gap-1.5 text-gold text-sm font-medium relative">
              <Zap className="h-4 w-4" aria-hidden="true" />
              <span>{xpEarned} XP</span>
              {floatingXP && (
                <span
                  key={floatingXP.id}
                  className="absolute -top-6 right-0 animate-float-up text-gold font-bold text-sm"
                  aria-live="polite"
                >
                  +{floatingXP.amount}
                </span>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Question {currentIndex + 1} of {questions.length}</span>
              <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
            </div>
            <Progress 
              value={progressPercent} 
              className="h-1.5"
              aria-label={`Progress: ${currentIndex + 1} of ${questions.length} questions`}
            />
          </div>
        </div>

        <div className={`space-y-6 ${shakeWrong ? "animate-shake" : ""}`}>
          <h2 className="text-xl font-medium leading-relaxed">
            {currentQuestion.question}
          </h2>

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
                  className={`w-full p-4 rounded-lg border text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isEliminated
                      ? "opacity-30 cursor-not-allowed border-border bg-muted line-through"
                      : showCorrect
                      ? "border-primary bg-primary/5"
                      : showWrong
                      ? "border-destructive bg-destructive/5"
                      : isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  role="radio"
                  aria-checked={isSelected}
                  aria-disabled={showFeedback || isEliminated}
                  data-testid={`option-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full border text-sm font-medium ${
                        showCorrect
                          ? "border-primary bg-primary text-primary-foreground"
                          : showWrong
                          ? "border-destructive bg-destructive text-destructive-foreground"
                          : isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/50"
                      }`}
                    >
                      {showCorrect ? (
                        <Check className="h-4 w-4" aria-hidden="true" />
                      ) : showWrong ? (
                        <X className="h-4 w-4" aria-hidden="true" />
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
            <Card className={selectedAnswer === currentQuestion.correct ? "border-primary/30" : ""}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-sm mb-1">
                      {selectedAnswer === currentQuestion.correct ? "Correct!" : "Not quite"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-3 pt-2">
            {!showFeedback && canUseHint && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUseHint}
                className="gap-2"
                data-testid="button-hint"
              >
                <Lightbulb className="h-4 w-4" aria-hidden="true" />
                Hint ({userProfile.powerUps.hints})
              </Button>
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
                Retry ({userProfile.powerUps.secondChance})
              </Button>
            )}

            <div className="flex-1" />

            {!showFeedback ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                data-testid="button-submit-answer"
              >
                Submit
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                className="gap-2"
                data-testid="button-next-question"
              >
                {isLastQuestion ? "View Results" : "Next"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
