import { useState, useMemo } from "react";
import { 
  Zap, Flame, BookOpen, 
  Play, Upload, ChevronRight, Trash2,
  Target, Award, TrendingUp, Trophy,
  Sparkles, Users, Bell,
  Brain, Briefcase, GraduationCap, BarChart3, Lightbulb, ArrowUpRight, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserProfile, Lecture } from "@shared/schema";
import { xpForNextLevel, formatDate, getMotivationalQuote, getLevelTitle } from "@/lib/game-utils";
import { useToast } from "@/hooks/use-toast";

// Removed unused interfaces for calendar, friends, skills - these features require backend support

interface DashboardProps {
  userProfile: UserProfile;
  lectureHistory: Lecture[];
  onStartUpload: () => void;
  onStartReview: (lectureId: string) => void;
  onViewAchievements: () => void;
  onDeleteLecture?: (id: string) => void;
  onStartDailyQuiz?: () => void;
}

export function Dashboard({
  userProfile,
  lectureHistory,
  onStartUpload,
  onStartReview,
  onViewAchievements,
  onDeleteLecture,
  onStartDailyQuiz,
}: DashboardProps) {
  const { toast } = useToast();
  
  // State for dialogs (features disabled but UI elements remain in dead code)
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const [missedLecturesOpen, setMissedLecturesOpen] = useState(false);
  const [topicPreviewOpen, setTopicPreviewOpen] = useState(false);
  const [addFriendDialogOpen, setAddFriendDialogOpen] = useState(false);
  const [calendarUrl, setCalendarUrl] = useState("");
  const [friendUsername, setFriendUsername] = useState("");
  
  // Removed all API queries and mutations - calendar, friends, skills features require backend

  // Computed values
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
  const totalQuestionsAnswered = lectureHistory.reduce((sum, l) => sum + (l.questionsAnswered || 0), 0);
  const masteredTopicsCount = userProfile.masteredTopics?.length || 0;
  const hasPriorityAction = hasReviewsDue || (onStartDailyQuiz && lectureHistory.length > 0);
  const skillsCount = lectureHistory.reduce((sum, l) => sum + (l.identifiedSkills?.length || 0), 0);
  const pendingRequestsCount = 0; // Friends feature requires backend
  // Removed references to skillsData, calendarData, dailyQuizStatus, friendRequests, leaderboard - these require backend
  // Removed helper functions: getUserInitials, getDisplayName, currentUserRank, formatEventDate, exportSkills - require backend

  // AI Learning Coach - Simplified version without backend dependencies
  const aiInsights = useMemo(() => {
    if (lectureHistory.length === 0 && userProfile.totalXP === 0) {
      return [];
    }
    
    const insights: { icon: "lightbulb" | "trending" | "target" | "flame" | "brain"; text: string; action?: string }[] = [];
    
    // Streak-based insight
    if (userProfile.currentStreak >= 7) {
      insights.push({ icon: "flame", text: `Amazing ${userProfile.currentStreak}-day streak! You're building strong habits.` });
    } else if (userProfile.currentStreak >= 3) {
      insights.push({ icon: "flame", text: `${userProfile.currentStreak}-day streak going strong. Keep the momentum!` });
    } else if (userProfile.currentStreak === 0 && lectureHistory.length > 0 && onStartDailyQuiz) {
      insights.push({ icon: "target", text: "Start a new streak today! Consistency is key to retention.", action: "quiz" });
    }

    // Accuracy-based insight
    if (averageAccuracy >= 85) {
      insights.push({ icon: "brain", text: `${averageAccuracy}% average accuracy - you're mastering the material!` });
    } else if (averageAccuracy >= 60 && averageAccuracy < 85 && lectureHistory.length > 0) {
      insights.push({ icon: "lightbulb", text: "Keep practicing to boost your accuracy score!", action: "quiz" });
    }

    // Progress insight
    if (xpToNext <= 100 && onStartDailyQuiz) {
      insights.push({ icon: "target", text: `Only ${xpToNext} XP to Level ${userProfile.level + 1}! One quiz away.`, action: "quiz" });
    }

    // Learning velocity
    if (lectureHistory.length >= 3) {
      const recentLectures = lectureHistory.slice(0, 3);
      const avgRecentScore = Math.round(recentLectures.reduce((sum, l) => sum + l.reviewScore, 0) / recentLectures.length);
      if (avgRecentScore > averageAccuracy + 5) {
        insights.push({ icon: "trending", text: "Your recent scores are improving! Great progress." });
      }
    }

    return insights.slice(0, 2);
  }, [userProfile, lectureHistory, averageAccuracy, xpToNext, onStartDailyQuiz]);

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-10">
        
        {/* Compact Header */}
        <header className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="font-serif text-2xl tracking-tight">{getLevelTitle(userProfile.level)}</h1>
              <p className="text-sm text-muted-foreground">{getMotivationalQuote()}</p>
            </div>
            {/* Demo Mode and Calendar buttons removed - require backend */}
          </div>
          
          {/* Stats Bar */}
          <div className="flex items-center gap-4 p-3 rounded-lg bg-card border text-sm">
            <div className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-primary" />
              <span className="font-medium">Lvl {userProfile.level}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-gold" />
              <span className="font-medium tabular-nums text-gold">{userProfile.totalXP.toLocaleString()}</span>
            </div>
            {userProfile.currentStreak > 0 && (
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-gold" />
                <span className="font-medium tabular-nums">{userProfile.currentStreak}d</span>
              </div>
            )}
            <div className="flex-1 flex items-center gap-2 ml-2">
              <Progress value={progressPercent} className="h-1.5 flex-1" aria-label="Level progress" />
              <span className="text-xs text-muted-foreground">{xpToNext} XP to go</span>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-11">
            <TabsTrigger value="today" className="gap-2" data-testid="tab-today">
              <Target className="h-4 w-4" />
              Today
              {hasPriorityAction && <span className="h-2 w-2 rounded-full bg-primary" />}
            </TabsTrigger>
            <TabsTrigger value="skills" className="gap-2" data-testid="tab-skills">
              <Brain className="h-4 w-4" />
              Skills
              {skillsCount > 0 && <Badge variant="secondary" className="text-xs h-5">{skillsCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-2" data-testid="tab-progress">
              <BarChart3 className="h-4 w-4" />
              Progress
              {pendingRequestsCount > 0 && <Badge variant="secondary" className="text-xs h-5 bg-primary/20 text-primary">{pendingRequestsCount}</Badge>}
            </TabsTrigger>
          </TabsList>

          {/* TODAY TAB */}
          <TabsContent value="today" className="space-y-4" role="tabpanel" aria-label="Today's learning activities">
            {/* AI Learning Coach Insights */}
            {aiInsights.length > 0 && (
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 border border-primary/10" data-testid="ai-insights-panel">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">AI Learning Coach</span>
                </div>
                <div className="space-y-2">
                  {aiInsights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-3 group" data-testid={`insight-${i}`}>
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-card border flex-shrink-0 mt-0.5">
                        {insight.icon === "lightbulb" && <Lightbulb className="h-3.5 w-3.5 text-gold" />}
                        {insight.icon === "trending" && <TrendingUp className="h-3.5 w-3.5 text-success" />}
                        {insight.icon === "target" && <Target className="h-3.5 w-3.5 text-primary" />}
                        {insight.icon === "flame" && <Flame className="h-3.5 w-3.5 text-gold" />}
                        {insight.icon === "brain" && <Brain className="h-3.5 w-3.5 text-primary" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-relaxed">{insight.text}</p>
                      </div>
                      {insight.action === "quiz" && onStartDailyQuiz && (
                        <Button variant="ghost" size="sm" onClick={onStartDailyQuiz} className="gap-1 flex-shrink-0" aria-label="Start quiz now" data-testid={`button-insight-action-${i}`}>
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Daily Quiz section removed - requires backend dailyQuizStatus API */}

            {/* Reviews Due */}
            {hasReviewsDue && (
              <div className="p-5 rounded-xl bg-accent/20 border border-accent/30">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-accent/30">
                    <Bell className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-serif text-lg font-medium">{lecturesNeedingReview.length} lecture{lecturesNeedingReview.length !== 1 ? 's' : ''} ready</h2>
                    <p className="text-sm text-muted-foreground">Complete a review to earn XP</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-4 pl-[60px]">
                  {lecturesNeedingReview.slice(0, 3).map((lecture) => (
                    <Button key={lecture.id} onClick={() => onStartReview(lecture.id)} variant="outline" size="sm" className="gap-1.5" data-testid={`button-review-${lecture.id}`}>
                      <Play className="h-3.5 w-3.5" />{lecture.title}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Upload CTA when empty */}
            {!hasPriorityAction && lectureHistory.length === 0 && (
              <div className="p-8 rounded-xl border border-dashed text-center">
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h2 className="font-serif text-lg font-medium mb-2">Get Started</h2>
                <p className="text-muted-foreground mb-4">Upload your first lecture to begin learning</p>
                <Button onClick={onStartUpload} className="gap-2" data-testid="button-upload-first">
                  <Upload className="h-4 w-4" />Upload Lecture
                </Button>
              </div>
            )}

            {/* Upcoming Schedule - removed, requires backend calendar data */}
            {false && (upcomingLectures.length > 0 || upcomingExams.length > 0) && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg">Upcoming</h3>
                  {hasCalendar && (
                    <Button variant="ghost" size="sm" onClick={() => refreshCalendarMutation.mutate()} disabled={refreshCalendarMutation.isPending} className="gap-1.5 text-xs" data-testid="button-refresh-calendar">
                      <RefreshCw className={`h-3.5 w-3.5 ${refreshCalendarMutation.isPending ? 'animate-spin' : ''}`} />Sync
                    </Button>
                  )}
                </div>
                <div className="space-y-2">
                  {upcomingExams.slice(0, 2).map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-gold/5 border border-gold/20" data-testid={`exam-event-${event.id}`}>
                      <FileCheck className="h-4 w-4 text-gold" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{formatEventDate(event.startsAt)}</p>
                      </div>
                    </div>
                  ))}
                  {upcomingLectures.slice(0, 3).map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 rounded-lg bg-card border" data-testid={`calendar-event-${event.id}`}>
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{formatEventDate(event.startsAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missed Lectures Section - removed, requires backend calendar data */}
            {false && missingLectures.length > 0 && (
              <Collapsible open={missedLecturesOpen || missingLectures.length <= 3} onOpenChange={setMissedLecturesOpen}>
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 overflow-hidden">
                  <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover-elevate" data-testid="button-toggle-missed-lectures">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/10">
                        <Clock className="h-4 w-4 text-destructive" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">Missed Lectures</span>
                          <Badge variant="secondary" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                            {missingLectures.length}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">Past lectures without uploads</p>
                      </div>
                    </div>
                    {missingLectures.length > 3 && (
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${missedLecturesOpen ? 'rotate-180' : ''}`} />
                    )}
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 space-y-2">
                      {missingLectures.map((event) => (
                        <div key={event.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-background/50" data-testid={`missed-lecture-${event.id}`}>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{event.title}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{formatEventDate(event.startsAt)}</span>
                              {event.location && (
                                <>
                                  <span>·</span>
                                  <span className="flex items-center gap-1 truncate">
                                    <MapPin className="h-3 w-3" />
                                    {event.location}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => dismissLectureMutation.mutate(event.id)}
                                disabled={dismissLectureMutation.isPending}
                                className="gap-1.5 text-xs text-muted-foreground hover:text-foreground flex-shrink-0"
                                data-testid={`button-dismiss-${event.id}`}
                              >
                                <EyeOff className="h-3.5 w-3.5" />
                                Forget
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Dismiss this lecture from missed list</TooltipContent>
                          </Tooltip>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )}

            {/* Study Materials */}
            {lectureHistory.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg">Study Materials</h3>
                  <Button onClick={onStartUpload} variant="outline" size="sm" className="gap-1.5" data-testid="button-upload">
                    <Upload className="h-3.5 w-3.5" />Add
                  </Button>
                </div>
                <div className="divide-y divide-border rounded-lg border overflow-hidden">
                  {lectureHistory.slice(0, 5).map((lecture) => (
                    <div key={lecture.id} className="flex items-center justify-between p-3 bg-card group">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{lecture.title}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(lecture.date)} {lecture.reviewScore > 0 && `· ${lecture.reviewScore}%`}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {lecture.xpEarned > 0 && <Badge variant="secondary" className="text-xs bg-gold/10 text-gold border-gold/20">+{lecture.xpEarned}</Badge>}
                        {lecture.needsReview && (
                          <Button onClick={() => onStartReview(lecture.id)} size="sm" variant="ghost" className="gap-1 h-7" data-testid={`button-start-review-${lecture.id}`}>
                            <Play className="h-3 w-3" />Review
                          </Button>
                        )}
                        {onDeleteLecture && (
                          <Button variant="ghost" size="icon" onClick={() => onDeleteLecture(lecture.id)} className="h-7 w-7 opacity-0 group-hover:opacity-100" data-testid={`button-delete-lecture-${lecture.id}`} aria-label="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          {/* SKILLS TAB - Shows skills from lecture data */}
          <TabsContent value="skills" className="space-y-6" role="tabpanel" aria-label="Your transferable skills profile" data-testid="section-skills-profile">
            {(() => {
              // Gather all skills from lectures
              const allSkills = lectureHistory.flatMap(l => l.identifiedSkills || []);
              const uniqueSkills = Array.from(new Map(allSkills.map(s => [s.name, s])).values());
              const proficientCount = uniqueSkills.filter(s => s.proficiencyLevel === "proficient").length;
              const intermediateCount = uniqueSkills.filter(s => s.proficiencyLevel === "intermediate").length;
              const developingCount = uniqueSkills.filter(s => s.proficiencyLevel === "developing").length;
              
              return uniqueSkills.length > 0 ? (
              <>
                {/* Skills Summary */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-xl">Your Skills Profile</h2>
                    <p className="text-sm text-muted-foreground">{uniqueSkills.length} transferable skills from your learning</p>
                  </div>
                </div>

                {/* Proficiency Breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-lg bg-success/5 border border-success/20 text-center">
                    <GraduationCap className="h-5 w-5 text-success mx-auto mb-1" />
                    <p className="text-2xl font-semibold text-success" data-testid="text-proficient-count">{proficientCount}</p>
                    <p className="text-xs text-muted-foreground">Proficient</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gold/5 border border-gold/20 text-center">
                    <TrendingUp className="h-5 w-5 text-gold mx-auto mb-1" />
                    <p className="text-2xl font-semibold text-gold" data-testid="text-intermediate-count">{intermediateCount}</p>
                    <p className="text-xs text-muted-foreground">Intermediate</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                    <Brain className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-2xl font-semibold text-primary" data-testid="text-developing-count">{developingCount}</p>
                    <p className="text-xs text-muted-foreground">Developing</p>
                  </div>
                </div>

                {/* Skills List with Progress Visualization */}
                <div className="space-y-3">
                  {uniqueSkills.map((skill, index) => {
                    const proficiencyPercent = skill.proficiencyLevel === "proficient" ? 100 : skill.proficiencyLevel === "intermediate" ? 66 : 33;
                    const proficiencyColor = skill.proficiencyLevel === "proficient" ? "bg-success" : skill.proficiencyLevel === "intermediate" ? "bg-gold" : "bg-primary";
                    return (
                      <div key={skill.name} className="p-4 rounded-lg bg-card border group transition-all hover:border-primary/30" data-testid={`skill-item-${index}`}>
                        <div className="flex items-start gap-3">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-lg transition-transform group-hover:scale-105 ${
                            skill.proficiencyLevel === "proficient" ? "bg-success/10" :
                            skill.proficiencyLevel === "intermediate" ? "bg-gold/10" : "bg-primary/10"
                          }`}>
                            <Brain className={`h-4 w-4 ${
                              skill.proficiencyLevel === "proficient" ? "text-success" :
                              skill.proficiencyLevel === "intermediate" ? "text-gold" : "text-primary"
                            }`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h3 className="font-medium text-sm" data-testid={`text-skill-name-dashboard-${index}`}>{skill.name}</h3>
                              <span className={`text-xs font-medium capitalize ${
                                skill.proficiencyLevel === "proficient" ? "text-success" :
                                skill.proficiencyLevel === "intermediate" ? "text-gold" : "text-primary"
                              }`}>{skill.proficiencyLevel}</span>
                            </div>
                            {/* Skill Progress Bar */}
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                              <div className={`h-full ${proficiencyColor} rounded-full transition-all duration-500`} style={{ width: `${proficiencyPercent}%` }} />
                            </div>
                            <p className="text-xs text-muted-foreground">{skill.description}</p>
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              <Briefcase className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              {skill.relevantCareers.slice(0, 3).map((career, i) => (
                                <Badge key={career} variant="secondary" className="text-xs" data-testid={`badge-career-${index}-${i}`}>{career}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="p-8 rounded-xl border border-dashed text-center">
                <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h2 className="font-serif text-lg font-medium mb-2">No Skills Yet</h2>
                <p className="text-muted-foreground mb-4">Upload lectures with identified skills to see your profile</p>
                <Button onClick={onStartUpload} variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />Upload a Lecture
                </Button>
              </div>
            );
            })()}
          </TabsContent>

          {/* PROGRESS TAB */}
          <TabsContent value="progress" className="space-y-6" role="tabpanel" aria-label="Your learning progress">
            {/* Streak Visualization */}
            {userProfile.currentStreak > 0 && (
              <div className="p-5 rounded-xl bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 border border-gold/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-gold" />
                    <span className="font-serif text-lg font-medium">{userProfile.currentStreak}-Day Streak</span>
                  </div>
                  {userProfile.longestStreak > userProfile.currentStreak && (
                    <span className="text-xs text-muted-foreground">Best: {userProfile.longestStreak} days</span>
                  )}
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const isActive = i < Math.min(userProfile.currentStreak, 7);
                    const isMilestone = (i + 1) === 7;
                    return (
                      <div 
                        key={i} 
                        className={`flex-1 h-2 rounded-full transition-all ${
                          isActive ? (isMilestone ? "bg-gold" : "bg-gold/60") : "bg-muted"
                        }`}
                        aria-label={`Day ${i + 1}: ${isActive ? "completed" : "pending"}`}
                      />
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {userProfile.currentStreak >= 7 
                    ? "Week complete! Keep building your learning habit." 
                    : `${7 - userProfile.currentStreak} more day${7 - userProfile.currentStreak !== 1 ? 's' : ''} to complete the week`}
                </p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-card border text-center group hover:border-gold/30 transition-colors">
                <Zap className="h-5 w-5 text-gold mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <p className="text-2xl font-semibold text-gold tabular-nums">{userProfile.totalXP.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total XP</p>
              </div>
              <div className="p-4 rounded-lg bg-card border text-center group hover:border-primary/30 transition-colors">
                <BookOpen className="h-5 w-5 text-primary mx-auto mb-1 group-hover:scale-110 transition-transform" />
                <p className="text-2xl font-semibold tabular-nums">{lectureHistory.length}</p>
                <p className="text-xs text-muted-foreground">Lectures</p>
              </div>
              <div className="p-4 rounded-lg bg-card border text-center group hover:border-success/30 transition-colors">
                <Target className={`h-5 w-5 mx-auto mb-1 group-hover:scale-110 transition-transform ${averageAccuracy >= 80 ? "text-success" : averageAccuracy >= 60 ? "text-gold" : "text-muted-foreground"}`} />
                <p className={`text-2xl font-semibold tabular-nums ${averageAccuracy >= 80 ? "text-success" : averageAccuracy >= 60 ? "text-gold" : ""}`}>{averageAccuracy}%</p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
              <div className="p-4 rounded-lg bg-card border text-center group hover:border-gold/30 transition-colors">
                <Flame className={`h-5 w-5 mx-auto mb-1 group-hover:scale-110 transition-transform ${userProfile.currentStreak > 0 ? "text-gold" : "text-muted-foreground"}`} />
                <p className="text-2xl font-semibold tabular-nums">{userProfile.currentStreak}</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>

            {/* Impact Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-card border" data-testid="stat-questions-answered">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Questions</span>
                </div>
                <p className="text-xl font-semibold tabular-nums">{totalQuestionsAnswered}</p>
              </div>
              <div className="p-4 rounded-lg bg-card border" data-testid="stat-topics-mastered">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className={`h-4 w-4 ${masteredTopicsCount > 0 ? "text-gold" : "text-muted-foreground"}`} />
                  <span className="text-xs text-muted-foreground">Mastered</span>
                </div>
                <p className={`text-xl font-semibold tabular-nums ${masteredTopicsCount > 0 ? "text-gold" : ""}`}>{masteredTopicsCount}</p>
              </div>
              <div className="p-4 rounded-lg bg-card border" data-testid="stat-skills-developed">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className={`h-4 w-4 ${skillsCount > 0 ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-xs text-muted-foreground">Skills</span>
                </div>
                <p className={`text-xl font-semibold tabular-nums ${skillsCount > 0 ? "text-primary" : ""}`}>{skillsCount}</p>
              </div>
            </div>

            {/* Achievements */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-lg">Achievements</h3>
                <Button variant="ghost" size="sm" onClick={onViewAchievements} className="gap-1 text-xs" data-testid="button-view-achievements">
                  View All<ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {userProfile.achievements.slice(0, 6).map((achievement) => (
                  <Tooltip key={achievement.id}>
                    <TooltipTrigger asChild>
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${achievement.unlocked ? "bg-gold/5 border border-gold/20" : "opacity-40"}`}>
                        {getAchievementIcon(achievement.icon)}
                        <span className="text-xs font-medium">{achievement.name}</span>
                        {!achievement.unlocked && achievement.maxProgress && (
                          <span className="text-xs text-muted-foreground">{achievement.progress || 0}/{achievement.maxProgress}</span>
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
            </div>

            {/* Power-ups */}
            {(userProfile.powerUps.secondChance > 0 || userProfile.powerUps.hints > 0 || userProfile.powerUps.doubleXP) && (
              <div>
                <h3 className="font-serif text-lg mb-3">Power-Ups</h3>
                <div className="flex flex-wrap gap-2">
                  {userProfile.powerUps.secondChance > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                      <span className="text-sm">Second Chance</span>
                      <Badge variant="secondary" className="text-xs">{userProfile.powerUps.secondChance}</Badge>
                    </div>
                  )}
                  {userProfile.powerUps.hints > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gold/10 border border-gold/20">
                      <span className="text-sm">Hints</span>
                      <Badge variant="secondary" className="text-xs">{userProfile.powerUps.hints}</Badge>
                    </div>
                  )}
                  {userProfile.powerUps.doubleXP && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/10 border border-success/20">
                      <Zap className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium text-success">Double XP</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Friends & Leaderboard section removed - requires backend API */}
            <div className="p-6 rounded-lg border border-dashed text-center">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">Friends and leaderboard features require backend support</p>
              <p className="text-xs text-muted-foreground">These features are disabled in localStorage-only mode</p>
            </div>

            {/* All friends/leaderboard content removed - requires backend */}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Calendar Dialog removed - requires backend */}
      {false && <Dialog open={calendarDialogOpen} onOpenChange={setCalendarDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{hasCalendar ? "Calendar Settings" : "Connect Your Calendar"}</DialogTitle>
            <DialogDescription>{hasCalendar ? "Manage your lecture calendar" : "Add your calendar to track upcoming classes"}</DialogDescription>
          </DialogHeader>
          {hasCalendar ? (
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Calendar className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium text-sm">Connected</p>
                  <p className="text-xs text-muted-foreground">{calendarData?.lectureCount || 0} lectures found</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => refreshCalendarMutation.mutate()} disabled={refreshCalendarMutation.isPending} data-testid="button-dialog-refresh">
                  <RefreshCw className={`h-4 w-4 ${refreshCalendarMutation.isPending ? 'animate-spin' : ''}`} />Refresh
                </Button>
                <Button variant="destructive" className="flex-1 gap-2" onClick={() => removeCalendarMutation.mutate()} data-testid="button-remove-calendar">
                  <X className="h-4 w-4" />Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="calendar-url">Calendar Share Link</Label>
                <Input id="calendar-url" placeholder="https://...calendar.ics" value={calendarUrl} onChange={(e) => setCalendarUrl(e.target.value)} data-testid="input-calendar-url" />
                <p className="text-xs text-muted-foreground">Paste the ICS link from your university calendar</p>
              </div>
              <Button className="w-full gap-2" onClick={() => setCalendarMutation.mutate(calendarUrl)} disabled={!calendarUrl.trim() || setCalendarMutation.isPending} data-testid="button-connect-calendar">
                {setCalendarMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Connecting...</> : <><Calendar className="h-4 w-4" />Connect</>}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>}

      {/* Add Friend Dialog removed - requires backend */}
      {false && <Dialog open={addFriendDialogOpen} onOpenChange={setAddFriendDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Add Friend
            </DialogTitle>
            <DialogDescription>Enter their username or email to send a friend request</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="friend-username">Username or Email</Label>
              <Input 
                id="friend-username" 
                placeholder="Enter username or email" 
                value={friendUsername} 
                onChange={(e) => setFriendUsername(e.target.value)} 
                onKeyDown={(e) => {
                  if (e.key === "Enter" && friendUsername.trim()) {
                    sendFriendRequestMutation.mutate(friendUsername.trim());
                  }
                }}
                data-testid="input-friend-username" 
              />
            </div>
            <Button 
              className="w-full gap-2" 
              onClick={() => sendFriendRequestMutation.mutate(friendUsername.trim())} 
              disabled={!friendUsername.trim() || sendFriendRequestMutation.isPending}
              data-testid="button-send-friend-request"
            >
              {sendFriendRequestMutation.isPending ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Sending...</>
              ) : (
                <><UserPlus className="h-4 w-4" />Send Request</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>}

      {/* Demo Dialog removed - requires backend */}
      {false && <AlertDialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Enter Demo Mode?</AlertDialogTitle>
            <AlertDialogDescription>This will load sample data to demonstrate the app's features.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-demo-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => demoModeMutation.mutate()} disabled={demoModeMutation.isPending} className="gap-2" data-testid="button-demo-confirm">
              {demoModeMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Loading...</> : <><Sparkles className="h-4 w-4" />Enter Demo</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </div>
  );
}

function getAchievementIcon(iconName: string) {
  const icons: Record<string, JSX.Element> = {
    footprints: <TrendingUp className="h-4 w-4 text-gold" />,
    zap: <Zap className="h-4 w-4 text-gold" />,
    "book-open": <BookOpen className="h-4 w-4 text-gold" />,
    "trending-up": <TrendingUp className="h-4 w-4 text-gold" />,
    star: <Award className="h-4 w-4 text-gold" />,
    flame: <Flame className="h-4 w-4 text-gold" />,
    crown: <Trophy className="h-4 w-4 text-gold" />,
    moon: <Award className="h-4 w-4 text-gold" />,
    sunrise: <Award className="h-4 w-4 text-gold" />,
    target: <Target className="h-4 w-4 text-gold" />,
    search: <BookOpen className="h-4 w-4 text-gold" />,
  };
  return icons[iconName] || <Trophy className="h-4 w-4 text-gold" />;
}
