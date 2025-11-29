import { 
  Zap, Trophy, Target, Flame, BookOpen, TrendingUp, 
  Clock, Award, Crown, Play, Upload, Sparkles, ChevronRight, FileText, Trash2, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { UserProfile, Lecture, Achievement } from "@shared/schema";
import { getLevelTitle, xpForNextLevel, formatDate, getTopicMasteryColor, getMotivationalQuote } from "@/lib/game-utils";

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
  onViewLecture,
}: DashboardProps) {
  const currentLevelXP = Math.pow(userProfile.level, 2) * 100;
  const nextLevelXP = xpForNextLevel(userProfile.level);
  const xpInLevel = userProfile.totalXP - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  const progressPercent = Math.min(100, (xpInLevel / xpNeeded) * 100);

  const hasDailyQuizAvailable = lectureHistory.length > 0 && userProfile.needsPractice.length > 0;
  const unlockedAchievements = userProfile.achievements.filter((a) => a.unlocked);
  const recentAchievements = unlockedAchievements.slice(-3);

  const averageAccuracy = lectureHistory.length > 0
    ? Math.round(lectureHistory.reduce((sum, l) => sum + l.reviewScore, 0) / lectureHistory.length)
    : 0;

  const xpToNext = nextLevelXP - userProfile.totalXP;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <section className="text-center space-y-4" aria-label="Welcome">
        {userProfile.currentStreak > 0 && (
          <div className="flex items-center justify-center gap-2 text-lg">
            <Flame className="h-6 w-6 text-gold animate-pulse" aria-hidden="true" />
            <span className="font-semibold">
              {userProfile.currentStreak} day streak!
            </span>
            <span className="text-muted-foreground text-sm">Keep it alive!</span>
          </div>
        )}

        <p className="text-muted-foreground italic">
          {getMotivationalQuote()}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-label="Statistics">
        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/20">
                <Zap className="h-6 w-6 text-gold" aria-hidden="true" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gold">
                  {userProfile.totalXP.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total XP</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                <BookOpen className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-3xl font-bold">{lectureHistory.length}</p>
                <p className="text-sm text-muted-foreground">Lectures Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                averageAccuracy >= 80 ? "bg-success/20" : averageAccuracy >= 60 ? "bg-gold/20" : "bg-muted"
              }`}>
                <Target className={`h-6 w-6 ${
                  averageAccuracy >= 80 ? "text-success" : averageAccuracy >= 60 ? "text-gold" : "text-muted-foreground"
                }`} aria-hidden="true" />
              </div>
              <div>
                <p className={`text-3xl font-bold ${
                  averageAccuracy >= 80 ? "text-success" : averageAccuracy >= 60 ? "text-gold" : ""
                }`}>
                  {averageAccuracy}%
                </p>
                <p className="text-sm text-muted-foreground">Average Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/20">
                <Crown className="h-6 w-6 text-success" aria-hidden="true" />
              </div>
              <div>
                <p className="text-3xl font-bold text-success">
                  {userProfile.masteredTopics.length}
                </p>
                <p className="text-sm text-muted-foreground">Topics Mastered</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/20">
                <Flame className="h-6 w-6 text-gold" aria-hidden="true" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gold">
                  {userProfile.currentStreak}
                </p>
                <p className="text-sm text-muted-foreground">Current Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover-elevate">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/20">
                <Trophy className="h-6 w-6 text-secondary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-3xl font-bold text-secondary">
                  {userProfile.longestStreak}
                </p>
                <p className="text-sm text-muted-foreground">Longest Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-gold" aria-hidden="true" />
                Achievements
              </CardTitle>
              <CardDescription>
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
                      className={`flex flex-col items-center p-3 rounded-lg border transition-all ${
                        achievement.unlocked
                          ? "bg-gold/10 border-gold/30 achievement-glow"
                          : "bg-muted/50 border-border opacity-50"
                      }`}
                    >
                      <div className={`text-2xl mb-1 ${!achievement.unlocked ? "grayscale" : ""}`}>
                        {getAchievementIcon(achievement.icon)}
                      </div>
                      <p className="text-xs text-center font-medium truncate w-full">
                        {achievement.name}
                      </p>
                      {!achievement.unlocked && achievement.maxProgress && (
                        <Progress 
                          value={(achievement.progress || 0) / achievement.maxProgress * 100}
                          className="h-1 mt-1"
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
              Topic Mastery
            </CardTitle>
            <CardDescription>
              Your progress across different topics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userProfile.masteredTopics.length === 0 && userProfile.needsPractice.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">
                Complete quizzes to track your topic mastery
              </p>
            ) : (
              <div className="space-y-3">
                {userProfile.masteredTopics.map((topic) => (
                  <div key={topic} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{topic}</span>
                        <Badge variant="secondary" className="bg-success/20 text-success">
                          Mastered
                        </Badge>
                      </div>
                      <Progress value={100} className="h-2 [&>div]:bg-success" />
                    </div>
                  </div>
                ))}
                {userProfile.needsPractice.map((topic) => (
                  <div key={topic} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{topic}</span>
                        <Badge variant="secondary" className="bg-destructive/20 text-destructive">
                          Needs Practice
                        </Badge>
                      </div>
                      <Progress value={35} className="h-2 [&>div]:bg-destructive" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                Study Materials
              </CardTitle>
              <CardDescription>
                {lectureHistory.length} uploaded lecture{lectureHistory.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button
              onClick={onStartUpload}
              size="sm"
              className="gap-1"
              data-testid="button-upload-materials"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              Add New
            </Button>
          </CardHeader>
          <CardContent>
            {lectureHistory.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <FileText className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                </div>
                <p className="text-muted-foreground mb-4">
                  No study materials yet. Upload your first lecture!
                </p>
                <Button
                  onClick={onStartUpload}
                  variant="outline"
                  className="gap-2"
                  data-testid="button-upload-first"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  Upload Lecture
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {lectureHistory.map((lecture) => (
                  <div 
                    key={lecture.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover-elevate"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20 flex-shrink-0">
                        <BookOpen className="h-5 w-5 text-primary" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{lecture.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(lecture.date)} · Score: {lecture.reviewScore}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="font-semibold text-gold flex items-center gap-1 text-sm">
                        <Zap className="h-3 w-3" aria-hidden="true" />
                        +{lecture.xpEarned}
                      </p>
                      {onViewLecture && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onViewLecture(lecture.id)}
                              data-testid={`button-view-lecture-${lecture.id}`}
                            >
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View lecture</TooltipContent>
                        </Tooltip>
                      )}
                      {onDeleteLecture && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDeleteLecture(lecture.id)}
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-delete-lecture-${lecture.id}`}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Delete lecture</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col sm:flex-row gap-4 justify-center">
        {hasDailyQuizAvailable && (
          <Button
            onClick={onStartDailyQuiz}
            size="lg"
            className="h-14 px-8 text-lg gap-2 animate-pulse-glow"
            data-testid="button-daily-quiz"
          >
            <Play className="h-5 w-5" aria-hidden="true" />
            Start Daily Quiz (+30 XP)
          </Button>
        )}

        <Button
          onClick={onStartUpload}
          size="lg"
          variant={hasDailyQuizAvailable ? "outline" : "default"}
          className={`h-14 px-8 text-lg gap-2 ${!hasDailyQuizAvailable ? "animate-pulse-glow" : ""}`}
          data-testid="button-upload"
        >
          <Upload className="h-5 w-5" aria-hidden="true" />
          Upload New Lecture
        </Button>

        {lectureHistory.length === 0 && (
          <Button
            onClick={onLoadDemo}
            size="lg"
            variant="secondary"
            className="h-14 px-8 text-lg gap-2"
            data-testid="button-demo"
          >
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            Try Demo
          </Button>
        )}
      </section>

      {userProfile.powerUps.secondChance > 0 || userProfile.powerUps.hints > 0 || userProfile.powerUps.doubleXP ? (
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-gold" aria-hidden="true" />
                Power-Ups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {userProfile.powerUps.secondChance > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/20 border border-primary/30">
                        <span className="text-lg">🔄</span>
                        <span className="font-medium">Second Chance</span>
                        <Badge variant="secondary">{userProfile.powerUps.secondChance}</Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Retry one wrong answer</TooltipContent>
                  </Tooltip>
                )}
                {userProfile.powerUps.hints > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gold/20 border border-gold/30">
                        <span className="text-lg">💡</span>
                        <span className="font-medium">Hints</span>
                        <Badge variant="secondary">{userProfile.powerUps.hints}</Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Eliminate 2 wrong options</TooltipContent>
                  </Tooltip>
                )}
                {userProfile.powerUps.doubleXP && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/20 border border-success/30 gold-shimmer">
                        <span className="text-lg">⚡</span>
                        <span className="font-medium">Double XP Active!</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Next quiz worth 2x XP</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}

function getAchievementIcon(iconName: string): string {
  const icons: Record<string, string> = {
    footprints: "👣",
    zap: "⚡",
    "book-open": "📖",
    "trending-up": "📈",
    star: "⭐",
    flame: "🔥",
    crown: "👑",
    moon: "🌙",
    sunrise: "🌅",
    target: "🎯",
    search: "🔍",
  };
  return icons[iconName] || "🏆";
}
