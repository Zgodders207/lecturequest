import { useState } from "react";
import { Star, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getConfidenceMessage } from "@/lib/game-utils";

interface ConfidenceRatingProps {
  weakTopics: string[];
  onSubmit: (rating: number) => void;
}

export function ConfidenceRating({ weakTopics, onSubmit }: ConfidenceRatingProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);

  const displayRating = hoveredRating || rating;
  const confidenceInfo = getConfidenceMessage(displayRating || 3);

  const handleSubmit = () => {
    if (rating > 0) {
      onSubmit(rating);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-md mx-auto px-6 py-16 animate-fade-in">
        <div className="text-center mb-12">
          <h1 className="font-serif text-display-sm tracking-tight mb-3">
            Rate Your Confidence
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            How well do you understand this material?
          </p>
        </div>

        <div className="space-y-8">
          <div 
            className="flex justify-center gap-2"
            role="radiogroup"
            aria-label="Confidence rating from 1 to 5 stars"
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoveredRating(value)}
                onMouseLeave={() => setHoveredRating(0)}
                onFocus={() => setHoveredRating(value)}
                onBlur={() => setHoveredRating(0)}
                className="p-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors duration-200"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                data-testid={`star-${value}`}
              >
                <Star
                  className={`h-10 w-10 transition-all duration-200 ${
                    value <= displayRating
                      ? "fill-gold text-gold"
                      : "text-muted-foreground/30"
                  }`}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>

          <div className="min-h-[80px] text-center">
            {displayRating > 0 && (
              <div className="space-y-2 animate-fade-in">
                <p className="font-serif text-xl">{confidenceInfo.message}</p>
                <p className="text-gold flex items-center justify-center gap-1.5 font-medium">
                  <Zap className="h-4 w-4" aria-hidden="true" />
                  +{confidenceInfo.xp} XP bonus
                </p>
              </div>
            )}
          </div>

          {weakTopics.length > 0 && (
            <Card>
              <CardContent className="p-5">
                <p className="font-medium mb-3">Topics to review:</p>
                <ul className="space-y-2">
                  {weakTopics.map((topic, i) => (
                    <li 
                      key={i}
                      className="text-muted-foreground flex items-center gap-3"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                      {topic}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="w-full gap-2 rounded-xl"
            size="lg"
            data-testid="button-submit-rating"
          >
            Continue to Dashboard
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>

          <p className="text-center text-muted-foreground">
            Higher confidence ratings earn bonus XP
          </p>
        </div>
      </div>
    </div>
  );
}
