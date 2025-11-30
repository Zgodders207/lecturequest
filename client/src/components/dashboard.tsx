import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Zap, Flame, BookOpen, 
  Play, Upload, ChevronRight, Trash2, Bell,
  Target, Award, TrendingUp, Trophy, Clock,
  Calendar, CalendarDays, AlertTriangle, RefreshCw, X, Loader2, MapPin, FileCheck, Sparkles,
  Brain, Briefcase, Download, GraduationCap, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserProfile, Lecture, CalendarSettings, CalendarEvent } from "@shared/schema";
import { xpForNextLevel, formatDate, getMotivationalQuote, getLevelTitle } from "@/lib/game-utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CalendarData {
  settings: CalendarSettings | null;
  events: CalendarEvent[];
  upcomingLectures: CalendarEvent[];
  upcomingExams: CalendarEvent[];
  missingLectures: CalendarEvent[];
  totalEvents: number;
  lectureCount: number;
  examCount: number;
}

interface DailyQuizStatus {
  hasDueTopics: boolean;
  dueTopicsCount: number;
  totalTopicsTracked: number;
  dueTopics: {
    topic: string;
    lectureTitle: string;
    lastScore: number;
    daysSinceReview: number;
    streak: number;
    isOverdue: boolean;
  }[];
  currentPlan: {
    id: string;
    topicsCount: number;
    generatedAt: string;
    completed: boolean;
  } | null;
  weeklyStreak: number;
}

interface SkillsData {
  skills: {
    name: string;
    description: string;
    category: string;
    relevantCareers: string[];
    proficiencyLevel: "developing" | "intermediate" | "proficient";
    occurrenceCount: number;
  }[];
  totalSkills: number;
  proficientCount: number;
  intermediateCount: number;
  developingCount: number;
}

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
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [calendarUrl, setCalendarUrl] = useState("");
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  
  const { data: calendarData } = useQuery<CalendarData>({
    queryKey: ["/api/calendar"],
  });
  
  const { data: dailyQuizStatus } = useQuery<DailyQuizStatus>({
    queryKey: ["/api/daily-quiz/status"],
  });
  
  const { data: skillsData } = useQuery<SkillsData>({
    queryKey: ["/api/skills"],
  });
  
  const setCalendarMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/calendar", { url });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
      toast({ title: "Calendar connected", description: data.message });
      setCalendarDialogOpen(false);
      setCalendarUrl("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to connect calendar", description: error.message, variant: "destructive" });
    },
  });
  
  const refreshCalendarMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/calendar/refresh", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
      toast({ title: "Calendar refreshed" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to refresh calendar", description: error.message, variant: "destructive" });
    },
  });
  
  const removeCalendarMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/calendar");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
      toast({ title: "Calendar removed" });
      setCalendarDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to remove calendar", description: error.message, variant: "destructive" });
    },
  });

  const demoModeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/profile/demo", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lectures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar"] });
      queryClient.invalidateQueries({ queryKey: ["/api/daily-quiz/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/skills"] });
      toast({ title: "Demo mode activated", description: "Sample data loaded" });
      setDemoDialogOpen(false);
    },
  });

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
  const skillsCount = skillsData?.totalSkills || 0;
  const hasCalendar = calendarData?.settings !== null;
  const upcomingLectures = calendarData?.upcomingLectures || [];
  const upcomingExams = calendarData?.upcomingExams || [];
  const missingLectures = calendarData?.missingLectures || [];
  const hasPriorityAction = dailyQuizStatus?.hasDueTopics || hasReviewsDue;
  
  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + 
      ` at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const exportSkills = () => {
    if (!skillsData) return;
    const csvContent = [
      ["Skill", "Category", "Proficiency", "Relevant Careers", "Times Practiced"].join(","),
      ...skillsData.skills.map(skill => [
        `"${skill.name}"`,
        `"${skill.category}"`,
        skill.proficiencyLevel,
        `"${skill.relevantCareers.join("; ")}"`,
        skill.occurrenceCount
      ].join(","))
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "skills-profile.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Skills exported", description: "Your skills profile has been downloaded." });
  };

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
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => setDemoDialogOpen(true)} variant="ghost" size="icon" data-testid="button-demo-mode" aria-label="Demo mode">
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Demo Mode</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button onClick={() => setCalendarDialogOpen(true)} variant="ghost" size="icon" className={hasCalendar ? "text-primary" : ""} data-testid="button-calendar-settings" aria-label="Calendar">
                    <Calendar className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{hasCalendar ? "Calendar Settings" : "Connect Calendar"}</TooltipContent>
              </Tooltip>
            </div>
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
            </TabsTrigger>
          </TabsList>

          {/* TODAY TAB */}
          <TabsContent value="today" className="space-y-4">
            {/* Daily Quiz */}
            {dailyQuizStatus?.hasDueTopics && onStartDailyQuiz && (
              <div className="p-5 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-serif text-lg font-medium">Daily Quiz</h2>
                      <Badge className="bg-primary/20 text-primary border-0 text-xs">{dailyQuizStatus.dueTopicsCount} topics</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Practice to strengthen memory</p>
                  </div>
                  <Button onClick={onStartDailyQuiz} className="gap-2" data-testid="button-start-daily-quiz">
                    <Zap className="h-4 w-4" />Start
                  </Button>
                </div>
              </div>
            )}

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

            {/* Upcoming Schedule */}
            {(upcomingLectures.length > 0 || upcomingExams.length > 0) && (
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

          {/* SKILLS TAB */}
          <TabsContent value="skills" className="space-y-6" data-testid="section-skills-profile">
            {skillsData && skillsData.skills.length > 0 ? (
              <>
                {/* Skills Summary */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-serif text-xl">Your Skills Profile</h2>
                    <p className="text-sm text-muted-foreground">{skillsData.totalSkills} transferable skills from your learning</p>
                  </div>
                  <Button onClick={exportSkills} variant="outline" size="sm" className="gap-1.5" data-testid="button-export-skills">
                    <Download className="h-3.5 w-3.5" />Export
                  </Button>
                </div>

                {/* Proficiency Breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-lg bg-success/5 border border-success/20 text-center">
                    <GraduationCap className="h-5 w-5 text-success mx-auto mb-1" />
                    <p className="text-2xl font-semibold text-success" data-testid="text-proficient-count">{skillsData.proficientCount}</p>
                    <p className="text-xs text-muted-foreground">Proficient</p>
                  </div>
                  <div className="p-4 rounded-lg bg-gold/5 border border-gold/20 text-center">
                    <TrendingUp className="h-5 w-5 text-gold mx-auto mb-1" />
                    <p className="text-2xl font-semibold text-gold" data-testid="text-intermediate-count">{skillsData.intermediateCount}</p>
                    <p className="text-xs text-muted-foreground">Intermediate</p>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                    <Brain className="h-5 w-5 text-primary mx-auto mb-1" />
                    <p className="text-2xl font-semibold text-primary" data-testid="text-developing-count">{skillsData.developingCount}</p>
                    <p className="text-xs text-muted-foreground">Developing</p>
                  </div>
                </div>

                {/* Skills List */}
                <div className="space-y-3">
                  {skillsData.skills.map((skill, index) => (
                    <div key={skill.name} className="p-4 rounded-lg bg-card border" data-testid={`skill-item-${index}`}>
                      <div className="flex items-start gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          skill.proficiencyLevel === "proficient" ? "bg-success/10" :
                          skill.proficiencyLevel === "intermediate" ? "bg-gold/10" : "bg-primary/10"
                        }`}>
                          <Brain className={`h-4 w-4 ${
                            skill.proficiencyLevel === "proficient" ? "text-success" :
                            skill.proficiencyLevel === "intermediate" ? "text-gold" : "text-primary"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-medium text-sm" data-testid={`text-skill-name-dashboard-${index}`}>{skill.name}</h3>
                            <Badge variant="outline" className={`text-xs capitalize ${
                              skill.proficiencyLevel === "proficient" ? "border-success/30 text-success" :
                              skill.proficiencyLevel === "intermediate" ? "border-gold/30 text-gold" : "border-primary/30 text-primary"
                            }`}>{skill.proficiencyLevel}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{skill.description}</p>
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            <Briefcase className="h-3 w-3 text-muted-foreground" />
                            {skill.relevantCareers.slice(0, 3).map((career, i) => (
                              <Badge key={career} variant="secondary" className="text-xs" data-testid={`badge-career-${index}-${i}`}>{career}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-8 rounded-xl border border-dashed text-center">
                <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                <h2 className="font-serif text-lg font-medium mb-2">No Skills Yet</h2>
                <p className="text-muted-foreground mb-4">Complete quizzes to identify your transferable skills</p>
                <Button onClick={onStartUpload} variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />Upload a Lecture
                </Button>
              </div>
            )}
          </TabsContent>

          {/* PROGRESS TAB */}
          <TabsContent value="progress" className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-card border text-center">
                <Zap className="h-5 w-5 text-gold mx-auto mb-1" />
                <p className="text-2xl font-semibold text-gold tabular-nums">{userProfile.totalXP.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total XP</p>
              </div>
              <div className="p-4 rounded-lg bg-card border text-center">
                <BookOpen className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-semibold tabular-nums">{lectureHistory.length}</p>
                <p className="text-xs text-muted-foreground">Lectures</p>
              </div>
              <div className="p-4 rounded-lg bg-card border text-center">
                <Target className={`h-5 w-5 mx-auto mb-1 ${averageAccuracy >= 80 ? "text-success" : averageAccuracy >= 60 ? "text-gold" : "text-muted-foreground"}`} />
                <p className={`text-2xl font-semibold tabular-nums ${averageAccuracy >= 80 ? "text-success" : averageAccuracy >= 60 ? "text-gold" : ""}`}>{averageAccuracy}%</p>
                <p className="text-xs text-muted-foreground">Accuracy</p>
              </div>
              <div className="p-4 rounded-lg bg-card border text-center">
                <Flame className={`h-5 w-5 mx-auto mb-1 ${userProfile.currentStreak > 0 ? "text-gold" : "text-muted-foreground"}`} />
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
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Calendar Dialog */}
      <Dialog open={calendarDialogOpen} onOpenChange={setCalendarDialogOpen}>
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
      </Dialog>

      {/* Demo Dialog */}
      <AlertDialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen}>
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
      </AlertDialog>
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
