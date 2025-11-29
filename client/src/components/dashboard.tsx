import { 
  Zap, Flame, BookOpen, 
  Play, Upload, Sparkles, ChevronRight, FileText, Trash2,
  Target, Award, TrendingUp, Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserProfile, Lecture } from "@shared/schema";
import { xpForNextLevel, formatDate, getMotivationalQuote, getLevelTitle } from "@/lib/game-utils";

interface DashboardProps {
  userProfile: UserProfile;
  lectureHistory: Lecture[];
  onStartUpload: () => void;
  onStartDailyQuiz: () => void;
  onLoadDemo: () => void;
  onViewAchievements: () => void;
  onDeleteLecture?: (id: string) => void;
  onViewLecture?: (id: string) => void;
}

export function Dashboard({
  userProfile,
  lectureHistory,
  onStartUpload,
  onStartDailyQuiz,
  onLoadDemo,
  onViewAchievements,
  onDeleteLecture,
}: DashboardProps) {
  const currentLevelXP = Math.pow(userProfile.level, 2) * 100;
  const nextLevelXP = xpForNextLevel(userProfile.level);
  const xpInLevel = userProfile.totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const progressPercent = Math.min(100, (xpInLevel / xpNeeded) * 100);
  const xpToNext = nextLevelXP - userProfile.totalXP;

  const hasDailyQuizAvailable = lectureHistory.length > 0;
  const unlockedAchievements = userProfile.achievements.filter((a) => a.unlocked);

  const averageAccuracy = lectureHistory.length > 0
    ? Math.round(lectureHistory.reduce((sum, l) => sum + l.reviewScore, 0) / lectureHistory.length)
    : 0;

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-16 space-y-16">
        
        <section className="space-y-8 animate-fade-in" aria-label="Welcome">
          <div className="max-w-2xl">
            <h1 className="font-serif text-display-sm tracking-tight">
              Welcome back
            </h1>
            <p className="text-lg text-muted-foreground mt-3 leading-relaxed">
              {getMotivationalQuote()}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {hasDailyQuizAvailable && (
              <Button
                onClick={onStartDailyQuiz}
                size="lg"
                className="gap-2 rounded-xl px-6"
                data-testid="button-daily-quiz"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                Start Daily Quiz
              </Button>
            )}

            <Button
              onClick={onStartUpload}
              size="lg"
              variant={hasDailyQuizAvailable ? "outline" : "default"}
              className="gap-2 rounded-xl px-6"
              data-testid="button-upload"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Upload Lecture
            </Button>

            {lectureHistory.length === 0 && (
              <Button
                onClick={onLoadDemo}
                size="lg"
                className="gap-2 rounded-xl px-6 bg-accent text-accent-foreground border border-foreground/10 hover:bg-accent/80"
                data-testid="button-demo"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Try Demo
              </Button>
            )}
          </div>
        </section>

        <section aria-label="Progress Overview">
          <Card className="overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-primary" aria-hidden="true" />
                    <span className="font-serif text-2xl">
                      Level {userProfile.level}
                    </span>
                  </div>
                  <p className="text-muted-foreground pl-8">
                    {getLevelTitle(userProfile.level)}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Zap className="h-4 w-4 text-gold" aria-hidden="true" />
                      <span className="text-2xl font-semibold tabular-nums text-gold">
                        {userProfile.totalXP.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {xpToNext.toLocaleString()} XP to next level
                    </p>
                  </div>

                  {userProfile.currentStreak > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20">
                      <Flame className="h-5 w-5 text-gold" aria-hidden="true" />
                      <span className="font-medium text-gold tabular-nums">
                        {userProfile.currentStreak}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6">
                <Progress value={progressPercent} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </section>

        <section aria-label="Statistics">
          <h2 className="font-serif text-2xl mb-6">Your Progress</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                    <Zap className="h-5 w-5 text-gold" aria-hidden="true" />
                  </div>
                </div>
                <p className="text-3xl font-semibold text-gold tabular-nums">
                  {userProfile.totalXP.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Total XP</p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
                  </div>
                </div>
                <p className="text-3xl font-semibold tabular-nums">
                  {lectureHistory.length}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Lectures</p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    averageAccuracy >= 80 ? "bg-success/10" : averageAccuracy >= 60 ? "bg-gold/10" : "bg-muted"
                  }`}>
                    <Target className={`h-5 w-5 ${
                      averageAccuracy >= 80 ? "text-success" : averageAccuracy >= 60 ? "text-gold" : "text-muted-foreground"
                    }`} aria-hidden="true" />
                  </div>
                </div>
                <p className={`text-3xl font-semibold tabular-nums ${
                  averageAccuracy >= 80 ? "text-success" : averageAccuracy >= 60 ? "text-gold" : ""
                }`}>
                  {averageAccuracy}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">Accuracy</p>
              </CardContent>
            </Card>

            <Card className="card-hover">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    userProfile.currentStreak > 0 ? "bg-gold/10" : "bg-muted"
                  }`}>
                    <Flame className={`h-5 w-5 ${
                      userProfile.currentStreak > 0 ? "text-gold" : "text-muted-foreground"
                    }`} aria-hidden="true" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-semibold tabular-nums">
                    {userProfile.currentStreak}
                  </p>
                  {userProfile.longestStreak > 0 && userProfile.longestStreak > userProfile.currentStreak && (
                    <span className="text-sm text-muted-foreground">
                      / {userProfile.longestStreak}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">Day Streak</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <section aria-label="Study Materials">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                <div>
                  <CardTitle className="font-serif text-xl">Study Materials</CardTitle>
                  <CardDescription className="mt-1">
                    {lectureHistory.length} lecture{lectureHistory.length !== 1 ? 's' : ''} uploaded
                  </CardDescription>
                </div>
                <Button
                  onClick={onStartUpload}
                  size="sm"
                  variant="ghost"
                  className="gap-1.5"
                  data-testid="button-upload-materials"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Add
                </Button>
              </CardHeader>
              <CardContent>
                {lectureHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                      <FileText className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <p className="text-muted-foreground mb-5">
                      No lectures yet. Upload your first one to get started.
                    </p>
                    <Button
                      onClick={onStartUpload}
                      variant="outline"
                      className="gap-2 rounded-xl"
                      data-testid="button-upload-first"
                    >
                      <Upload className="h-4 w-4" aria-hidden="true" />
                      Upload Lecture
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {lectureHistory.slice(0, 5).map((lecture) => (
                      <div 
                        key={lecture.id}
                        className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                            <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{lecture.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(lecture.date)} · {lecture.reviewScore}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="secondary" className="text-xs font-normal bg-gold/10 text-gold border-gold/20">
                            +{lecture.xpEarned}
                          </Badge>
                          {onDeleteLecture && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDeleteLecture(lecture.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
              </CardContent>
            </Card>
          </section>

          <section aria-label="Achievements">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
                <div>
                  <CardTitle className="font-serif text-xl">Achievements</CardTitle>
                  <CardDescription className="mt-1">
                    {unlockedAchievements.length} of {userProfile.achievements.length} unlocked
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onViewAchievements}
                  className="gap-1"
                  data-testid="button-view-achievements"
                >
                  View All
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {userProfile.achievements.slice(0, 6).map((achievement) => (
                    <Tooltip key={achievement.id}>
                      <TooltipTrigger asChild>
                        <div
                          className={`flex flex-col items-center p-4 rounded-xl border transition-all duration-200 ${
                            achievement.unlocked
                              ? "bg-gold/5 border-gold/20 gold-glow"
                              : "bg-muted/30 border-transparent opacity-60"
                          }`}
                        >
                          <div className={`mb-2 ${!achievement.unlocked ? "grayscale" : ""}`}>
                            {getAchievementIcon(achievement.icon)}
                          </div>
                          <p className="text-xs text-center font-medium truncate w-full">
                            {achievement.name}
                          </p>
                          {!achievement.unlocked && achievement.maxProgress && (
                            <Progress 
                              value={(achievement.progress || 0) / achievement.maxProgress * 100}
                              className="h-1 mt-2 w-full"
                            />
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{achievement.name}</p>
                        <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        {!achievement.unlocked && achievement.maxProgress && (
                          <p className="text-xs mt-1">
                            Progress: {achievement.progress || 0}/{achievement.maxProgress}
                          </p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        {(userProfile.powerUps.secondChance > 0 || userProfile.powerUps.hints > 0 || userProfile.powerUps.doubleXP) && (
          <section aria-label="Power-Ups">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="font-serif text-xl flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-gold" aria-hidden="true" />
                  Power-Ups
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
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
