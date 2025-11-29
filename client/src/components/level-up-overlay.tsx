import { useEffect, useState } from "react";
import { Sparkles, Star, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLevelTitle } from "@/lib/game-utils";

interface LevelUpOverlayProps {
  newLevel: number;
  rewards?: string[];
  onContinue: () => void;
}

interface ConfettiPiece {
  id: number;
  left: number;
  color: string;
  delay: number;
  size: number;
}

export function LevelUpOverlay({ newLevel, rewards = [], onContinue }: LevelUpOverlayProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const pieces: ConfettiPiece[] = [];
    const colors = [
      "bg-gold",
      "bg-primary",
      "bg-secondary",
      "bg-success",
      "bg-pink-500",
      "bg-cyan-500",
    ];

    for (let i = 0; i < 50; i++) {
      pieces.push({
        id: i,
        left: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 2,
        size: Math.random() * 8 + 4,
      });
    }
    setConfetti(pieces);

    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const levelTitle = getLevelTitle(newLevel);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="level-up-title"
    >
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className={`confetti ${piece.color} rounded-sm`}
          style={{
            left: `${piece.left}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            animationDelay: `${piece.delay}s`,
          }}
          aria-hidden="true"
        />
      ))}

      <div
        className={`relative z-10 text-center max-w-md mx-4 transition-all duration-500 ${
          showContent ? "opacity-100 scale-100" : "opacity-0 scale-90"
        }`}
      >
        <div className="mb-6">
          <div className="relative inline-block">
            <div className="absolute inset-0 blur-2xl bg-gold/50 rounded-full animate-pulse" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-gold to-yellow-300 text-4xl font-bold text-black shadow-2xl mx-auto">
              {newLevel}
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-8">
          <p className="text-gold text-sm font-medium uppercase tracking-widest flex items-center justify-center gap-2">
            <Star className="h-4 w-4 animate-sparkle" aria-hidden="true" />
            FANFARE
            <Star className="h-4 w-4 animate-sparkle" aria-hidden="true" />
          </p>
          <h2 
            id="level-up-title"
            className="text-5xl font-bold level-up-text"
          >
            LEVEL UP!
          </h2>
          <p className="text-2xl font-semibold text-white mt-4">
            Level {newLevel}
          </p>
          <p className="text-lg text-gold">
            {levelTitle}
          </p>
        </div>

        {rewards.length > 0 && (
          <div className="mb-8 p-4 rounded-lg bg-white/10 border border-gold/30">
            <p className="text-sm font-medium text-gold flex items-center justify-center gap-2 mb-3">
              <Gift className="h-4 w-4" aria-hidden="true" />
              Rewards Unlocked
            </p>
            <div className="space-y-2">
              {rewards.map((reward, i) => (
                <div 
                  key={i}
                  className="flex items-center justify-center gap-2 text-white"
                >
                  <Sparkles className="h-4 w-4 text-gold" aria-hidden="true" />
                  <span>{reward}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={onContinue}
          size="lg"
          className="h-12 px-8 text-lg bg-gold hover:bg-gold/90 text-black font-semibold"
          data-testid="button-continue-level-up"
        >
          <Sparkles className="mr-2 h-5 w-5" aria-hidden="true" />
          Continue
        </Button>
      </div>
    </div>
  );
}
