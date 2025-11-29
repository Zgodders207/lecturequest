import { 
  Zap, Flame, BookOpen, 
  Play, Upload, ChevronRight, Trash2, Bell,
  Target, Award, TrendingUp, Trophy, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserProfile, Lecture } from "@shared/schema";
import { xpForNextLevel, formatDate, getMotivationalQuote, getLevelTitle } from "@/lib/game-utils";

interface DashboardProps {
  userProfile: UserProfile;
  lectureHistory: Lecture[];
  onStartUpload: () => void;
  onStartReview: (lectureId: string) => void;
  onViewAchievements: () => void;
  onDeleteLecture?: (id: string) => void;
}

export function Dashboard({
  userProfile,
  lectureHistory,
  onStartUpload,
  onStartReview,
  onViewAchievements,
  onDeleteLecture,
}: DashboardProps) {
  const currentLevelXP = Math.pow(userProfile.level, 2) * 100;
  const nextLevelXP = xpForNextLevel(userProfile.level);
  const xpInLevel = userProfile.totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const progressPercent = Math.min(100, (xpInLevel / xpNeeded) * 100);
  const xpToNext = nextLevelXP - userProfile.totalXP;

  const unlockedAchievements = userProfile.achievements.filter((a) => a.unlocked);

  const averageAccuracy = lectureHistory.length > 0
    ? Math.round(lectureHistory.reduce((sum, l) => sum + l.reviewScore, 0) / lectureHistory.length)
    : 0;

  const lecturesNeedingReview = lectureHistory.filter((l) => l.needsReview);
  const hasReviewsDue = lecturesNeedingReview.length > 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-20">
        
        <section className="animate-fade-in" aria-label="Welcome">
          <div className="space-y-6">
            <div>
              <h1 className="font-serif text-display-sm tracking-tight">
                Welcome back
              </h1>
              <p className="text-lg text-muted-foreground mt-3 leading-relaxed max-w-xl">
                {getMotivationalQuote()}
              </p>
            </div>

            <div className="flex items-center gap-8 pt-2">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" aria-hidden="true" />
                <span className="font-serif text-lg">
                  Level {userProfile.level}
                </span>
                <span className="text-muted-foreground">
                  · {getLevelTitle(userProfile.level)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-gold" aria-hidden="true" />
                <span className="font-medium tabular-nums text-gold">
                  {userProfile.totalXP.toLocaleString()} XP
                </span>
              </div>

              {userProfile.currentStreak > 0 && (
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-gold" aria-hidden="true" />
                  <span className="font-medium tabular-nums">
                    {userProfile.currentStreak} day streak
                  </span>
                </div>
              )}
            </div>

            <div className="max-w-md">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>{xpToNext.toLocaleString()} XP to Level {userProfile.level + 1}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>
          </div>
        </section>

        {hasReviewsDue && (
          <section className="animate-fade-in" aria-label="Review Due">
            <div className="flex items-start gap-4 p-6 rounded-xl bg-accent/30 border border-accent/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent flex-shrink-0">
                <Bell className="h-5 w-5 text-accent-foreground" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-serif text-lg font-medium">
                  {lecturesNeedingReview.length} lecture{lecturesNeedingReview.length !== 1 ? 's' : ''} ready for review
                </h2>
                <p className="text-muted-foreground mt-1">
                  Complete a review quiz to reinforce your learning and earn XP.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {lecturesNeedingReview.slice(0, 3).map((lecture) => (
                    <Button
                      key={lecture.id}
                      onClick={() => onStartReview(lecture.id)}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      data-testid={`button-review-${lecture.id}`}
                    >
                      <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      {lecture.title}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <section aria-label="Statistics">
          <h2 className="font-serif text-2xl mb-8">Your Progress</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-gold" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">Total XP</span>
              </div>
              <p className="text-3xl font-semibold text-gold tabular-nums">
                {userProfile.totalXP.toLocaleString()}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">Lectures</span>
              </div>
              <p className="text-3xl font-semibold tabular-nums">
                {lectureHistory.length}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Target className={`h-4 w-4 ${
                  averageAccuracy >= 80 ? "text-success" : averageAccuracy >= 60 ? "text-gold" : "text-muted-foreground"
                }`} aria-hidden="true" />
                <span className="text-sm text-muted-foreground">Accuracy</span>
              </div>
              <p className={`text-3xl font-semibold tabular-nums ${
                averageAccuracy >= 80 ? "text-success" : averageAccuracy >= 60 ? "text-gold" : ""
              }`}>
                {averageAccuracy}%
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame className={`h-4 w-4 ${
                  userProfile.currentStreak > 0 ? "text-gold" : "text-muted-foreground"
                }`} aria-hidden="true" />
                <span className="text-sm text-muted-foreground">Day Streak</span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-semibold tabular-nums">
                  {userProfile.currentStreak}
                </p>
                {userProfile.longestStreak > 0 && userProfile.longestStreak > userProfile.currentStreak && (
                  <span className="text-sm text-muted-foreground">
                    / {userProfile.longestStreak} best
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Study Materials">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif text-2xl">Study Materials</h2>
              <p className="text-muted-foreground mt-1">
                {lectureHistory.length} lecture{lectureHistory.length !== 1 ? 's' : ''} uploaded
              </p>
            </div>
            <Button
              onClick={onStartUpload}
              variant="outline"
              className="gap-2"
              data-testid="button-upload"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload Lecture
            </Button>
          </div>

          {lectureHistory.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground mb-6">
                Upload your first lecture to get started with personalized quizzes.
              </p>
              <Button
                onClick={onStartUpload}
                className="gap-2"
                data-testid="button-upload-first"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Upload Lecture
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {lectureHistory.map((lecture) => (
                <div 
                  key={lecture.id}
                  className="flex items-center justify-between py-5 group"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{lecture.title}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                        <span>{formatDate(lecture.date)}</span>
                        {lecture.lastReviewed && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                              Last reviewed {formatDate(lecture.lastReviewed)}
                            </span>
                          </>
                        )}
                        {lecture.reviewScore > 0 && (
                          <>
                            <span>·</span>
                            <span className={lecture.reviewScore >= 80 ? "text-success" : ""}>
                              {lecture.reviewScore}% accuracy
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {lecture.xpEarned > 0 && (
                      <Badge variant="secondary" className="text-xs font-normal bg-gold/10 text-gold border-gold/20">
                        +{lecture.xpEarned} XP
                      </Badge>
                    )}
                    {lecture.needsReview && (
                      <Button
                        onClick={() => onStartReview(lecture.id)}
                        size="sm"
                        className="gap-1.5"
                        data-testid={`button-start-review-${lecture.id}`}
                      >
                        <Play className="h-3.5 w-3.5" aria-hidden="true" />
                        Review
                      </Button>
                    )}
                    {onDeleteLecture && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDeleteLecture(lecture.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-delete-lecture-${lecture.id}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-label="Achievements">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-serif text-2xl">Achievements</h2>
              <p className="text-muted-foreground mt-1">
                {unlockedAchievements.length} of {userProfile.achievements.length} unlocked
              </p>
            </div>
            <Button 
              variant="ghost" 
              onClick={onViewAchievements}
              className="gap-1"
              data-testid="button-view-achievements"
            >
              View All
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-4">
            {userProfile.achievements.slice(0, 8).map((achievement) => (
              <Tooltip key={achievement.id}>
                <TooltipTrigger asChild>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      achievement.unlocked
                        ? "bg-gold/5 border border-gold/20"
                        : "opacity-50"
                    }`}
                  >
                    <div className={!achievement.unlocked ? "grayscale" : ""}>
                      {getAchievementIcon(achievement.icon)}
                    </div>
                    <span className={`text-sm font-medium ${achievement.unlocked ? "" : "text-muted-foreground"}`}>
                      {achievement.name}
                    </span>
                    {!achievement.unlocked && achievement.maxProgress && (
                      <span className="text-xs text-muted-foreground">
                        {achievement.progress || 0}/{achievement.maxProgress}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </section>

        {(userProfile.powerUps.secondChance > 0 || userProfile.powerUps.hints > 0 || userProfile.powerUps.doubleXP) && (
          <section aria-label="Power-Ups">
            <h2 className="font-serif text-2xl mb-6">Power-Ups</h2>
            <div className="flex flex-wrap gap-3">
              {userProfile.powerUps.secondChance > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20">
                  <span className="text-sm font-medium">Second Chance</span>
                  <Badge variant="secondary" className="text-xs">{userProfile.powerUps.secondChance}</Badge>
                </div>
              )}
              {userProfile.powerUps.hints > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold/10 border border-gold/20">
                  <span className="text-sm font-medium">Hints</span>
                  <Badge variant="secondary" className="text-xs">{userProfile.powerUps.hints}</Badge>
                </div>
              )}
              {userProfile.powerUps.doubleXP && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success/10 border border-success/20">
                  <Zap className="h-4 w-4 text-success" aria-hidden="true" />
                  <span className="text-sm font-medium text-success">Double XP Active</span>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function getAchievementIcon(iconName: string) {
  const iconComponents: Record<string, JSX.Element> = {
    footprints: <TrendingUp className="h-5 w-5 text-gold" />,
    zap: <Zap className="h-5 w-5 text-gold" />,
    "book-open": <BookOpen className="h-5 w-5 text-gold" />,
    "trending-up": <TrendingUp className="h-5 w-5 text-gold" />,
    star: <Award className="h-5 w-5 text-gold" />,
    flame: <Flame className="h-5 w-5 text-gold" />,
    crown: <Trophy className="h-5 w-5 text-gold" />,
    moon: <Award className="h-5 w-5 text-gold" />,
    sunrise: <Award className="h-5 w-5 text-gold" />,
    target: <Target className="h-5 w-5 text-gold" />,
    search: <BookOpen className="h-5 w-5 text-gold" />,
  };
  return iconComponents[iconName] || <Trophy className="h-5 w-5 text-gold" />;
}
