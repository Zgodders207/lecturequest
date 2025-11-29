import { useState } from "react";
import { Star, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    <div className="container max-w-lg mx-auto px-4 py-8">
      <Card className="border-border/50 text-center overflow-hidden">
        <div className="h-2 xp-gradient-animated" />
        
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gold/20 to-gold/10">
            <Star className="h-8 w-8 text-gold" aria-hidden="true" />
          </div>
          
          <CardTitle className="text-2xl">Rate Your Confidence</CardTitle>
          <CardDescription className="text-base">
            How confident do you feel about this material?
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
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
                className="p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-transform hover:scale-110"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} star${value > 1 ? "s" : ""}`}
                data-testid={`star-${value}`}
              >
                <Star
                  className={`h-10 w-10 transition-colors ${
                    value <= displayRating
                      ? "fill-gold text-gold"
                      : "text-muted-foreground"
                  }`}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>

          <div className="min-h-[80px]">
            {displayRating > 0 && (
              <div className="p-4 rounded-lg bg-gold/10 border border-gold/30">
                <p className="text-lg font-medium">{confidenceInfo.message}</p>
                <p className="text-gold font-semibold mt-1 flex items-center justify-center gap-1">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  +{confidenceInfo.xp} XP Bonus
                </p>
              </div>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            Each star = +5 XP bonus
          </p>

          {weakTopics.length > 0 && (
            <div className="p-4 rounded-lg bg-muted/50 text-left">
              <p className="text-sm font-medium mb-2">
                We've identified areas to focus on:
              </p>
              <ul className="space-y-1">
                {weakTopics.map((topic, i) => (
                  <li 
                    key={i}
                    className="text-sm text-muted-foreground flex items-center gap-2"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {topic}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-3">
                Master these for big XP gains!
              </p>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={rating === 0}
            className={`w-full h-12 text-lg gap-2 ${
              rating > 0 ? "animate-pulse-glow" : ""
            }`}
            data-testid="button-submit-rating"
          >
            Continue to Dashboard
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
