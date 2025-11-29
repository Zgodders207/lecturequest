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
      <div className="max-w-md mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight mb-2">
            Rate Your Confidence
          </h1>
          <p className="text-muted-foreground">
            How well do you understand this material?
          </p>
        </div>

        <div className="space-y-6">
          <div 
            className="flex justify-center gap-1"
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
                className="p-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-transform hover:scale-110"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                data-testid={`star-${value}`}
              >
                <Star
                  className={`h-9 w-9 transition-colors ${
                    value <= displayRating
                      ? "fill-gold text-gold"
                      : "text-muted-foreground/30"
                  }`}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>

          <div className="min-h-[60px] text-center">
            {displayRating > 0 && (
              <div className="space-y-1">
                <p className="font-medium">{confidenceInfo.message}</p>
                <p className="text-sm text-gold flex items-center justify-center gap-1">
                  <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                  +{confidenceInfo.xp} XP
                </p>
              </div>
            )}
          </div>

          {weakTopics.length > 0 && (
            <Card>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm font-medium mb-2">Topics to review:</p>
                <ul className="space-y-1.5">
                  {weakTopics.map((topic, i) => (
                    <li 
                      key={i}
                      className="text-sm text-muted-foreground flex items-center gap-2"
                    >
                      <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
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
            className="w-full gap-2"
            size="lg"
            data-testid="button-submit-rating"
          >
            Continue
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Higher ratings = more XP bonus
          </p>
        </div>
      </div>
    </div>
  );
}
