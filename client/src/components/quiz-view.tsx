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
      <div className="max-w-2xl mx-auto px-6 py-16 animate-fade-in">
        <div className="mb-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {isDaily ? "Daily Quiz" : lectureTitle}
            </span>
            <div 
              className="flex items-center gap-2 text-gold font-medium relative"
              role="status"
              aria-label={`${xpEarned} XP earned`}
            >
              <Zap className="h-4 w-4" aria-hidden="true" />
              <span className="tabular-nums" aria-hidden="true">{xpEarned} XP</span>
              {floatingXP && (
                <span
                  key={floatingXP.id}
                  className="absolute -top-6 right-0 animate-float-up text-gold font-bold"
                  aria-live="polite"
                >
                  +{floatingXP.amount}
                </span>
              )}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">Question {currentIndex + 1} of {questions.length}</span>
              <span className="text-muted-foreground tabular-nums">{Math.round(progressPercent)}%</span>
            </div>
            <Progress 
              value={progressPercent} 
              className="h-2"
              aria-label={`Progress: ${currentIndex + 1} of ${questions.length} questions`}
            />
          </div>
        </div>

        <div className={`space-y-8 ${shakeWrong ? "animate-shake" : ""}`}>
          <h2 className="font-serif text-2xl leading-relaxed">
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
                  className={`w-full p-5 rounded-xl border text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isEliminated
                      ? "opacity-30 cursor-not-allowed border-border bg-muted line-through"
                      : showCorrect
                      ? "border-primary bg-primary/5"
                      : showWrong
                      ? "border-destructive bg-destructive/5"
                      : isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30"
                  }`}
                  role="radio"
                  aria-checked={isSelected}
                  aria-disabled={showFeedback || isEliminated}
                  data-testid={`option-${index}`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors ${
                        showCorrect
                          ? "border-primary bg-primary text-primary-foreground"
                          : showWrong
                          ? "border-destructive bg-destructive text-destructive-foreground"
                          : isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
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
                    <span className={`flex-1 ${showWrong ? "text-muted-foreground" : ""}`}>
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {showFeedback && (
            <Card 
              className={`rounded-xl ${selectedAnswer === currentQuestion.correct ? "border-primary/30 bg-primary/5" : ""}`}
              role="status"
              aria-live="polite"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${
                    selectedAnswer === currentQuestion.correct ? "bg-primary/10" : "bg-gold/10"
                  }`}>
                    <Lightbulb className={`h-5 w-5 ${
                      selectedAnswer === currentQuestion.correct ? "text-primary" : "text-gold"
                    }`} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">
                      {selectedAnswer === currentQuestion.correct ? "Correct!" : "Not quite right"}
                    </p>
                    <p className="text-muted-foreground leading-relaxed">
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
                onClick={handleUseHint}
                className="gap-2 rounded-xl"
                data-testid="button-hint"
              >
                <Lightbulb className="h-4 w-4" aria-hidden="true" />
                Use Hint ({userProfile.powerUps.hints})
              </Button>
            )}

            {showFeedback && canUseSecondChance && (
              <Button
                variant="outline"
                onClick={handleUseSecondChance}
                className="gap-2 rounded-xl"
                data-testid="button-second-chance"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Try Again ({userProfile.powerUps.secondChance})
              </Button>
            )}

            <div className="flex-1" />

            {!showFeedback ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                className="rounded-xl px-6"
                data-testid="button-submit-answer"
              >
                Submit Answer
              </Button>
            ) : (
              <Button
                onClick={handleNextQuestion}
                className="gap-2 rounded-xl px-6"
                data-testid="button-next-question"
              >
                {isLastQuestion ? "View Results" : "Next Question"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
