import { 
  ArrowLeft, Lock, Check, Trophy, Zap, Flame, BookOpen, Target, TrendingUp, Award,
  Star, Medal, Crown, Sparkles, Brain, Clock, Calendar, Users, CheckCircle2, Heart,
  Lightbulb, GraduationCap, Moon, Sun, Sunrise, UserPlus, BarChart3, Swords, Handshake,
  Mail, CalendarCheck, CalendarDays, CalendarRange, Repeat, Wand2, Upload, Shield,
  Rocket, ArrowUp, RefreshCw, LineChart, Layers, Focus, Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Achievement, AchievementWithCategory, AchievementCategory } from "@shared/schema";
import { ACHIEVEMENT_CATEGORIES } from "@shared/schema";
import { formatDate } from "@/lib/game-utils";

interface AchievementsViewProps {
  achievements: Achievement[];
  onBack: () => void;
}

export function AchievementsView({ achievements, onBack }: AchievementsViewProps) {
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercent = (unlockedCount / totalCount) * 100;

  const achievementsByCategory = Object.entries(ACHIEVEMENT_CATEGORIES).map(([key, categoryInfo]) => {
    const categoryAchievements = achievements.filter((a) => {
      const withCategory = a as AchievementWithCategory;
      return withCategory.category === key;
    });
    const unlockedInCategory = categoryAchievements.filter((a) => a.unlocked).length;
    return {
      key: key as AchievementCategory,
      ...categoryInfo,
      achievements: categoryAchievements,
      unlocked: unlockedInCategory,
      total: categoryAchievements.length,
    };
  }).sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16 animate-fade-in">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-10 -ml-2"
          data-testid="button-back"
          aria-label="Go back to dashboard"
        >
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          Back
        </Button>

        <div className="space-y-4 mb-12">
          <h1 className="font-serif text-display-sm tracking-tight">Achievements</h1>
          <p className="text-lg text-muted-foreground">
            {unlockedCount} of {totalCount} unlocked
          </p>
          <div className="max-w-sm pt-2">
            <Progress value={progressPercent} className="h-2" />
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="flex-wrap h-auto gap-1 mb-8 bg-transparent p-0">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              data-testid="tab-all"
            >
              All ({unlockedCount}/{totalCount})
            </TabsTrigger>
            {achievementsByCategory.map((category) => (
              <TabsTrigger 
                key={category.key} 
                value={category.key}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                data-testid={`tab-${category.key}`}
              >
                {getCategoryIcon(category.icon)}
                <span className="ml-1.5">{category.name}</span>
                <Badge variant="secondary" className="ml-1.5 text-xs">
                  {category.unlocked}/{category.total}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <AllAchievementsView achievementsByCategory={achievementsByCategory} />
          </TabsContent>

          {achievementsByCategory.map((category) => (
            <TabsContent key={category.key} value={category.key} className="mt-0">
              <CategoryAchievements 
                achievements={category.achievements} 
                categoryName={category.name}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

interface CategoryData {
  key: AchievementCategory;
  name: string;
  icon: string;
  order: number;
  achievements: Achievement[];
  unlocked: number;
  total: number;
}

function AllAchievementsView({ achievementsByCategory }: { achievementsByCategory: CategoryData[] }) {
  return (
    <div className="space-y-10">
      {achievementsByCategory.map((category) => (
        <section key={category.key} className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              {getCategoryIcon(category.icon, "h-5 w-5 text-primary")}
            </div>
            <div>
              <h2 className="font-medium">{category.name}</h2>
              <p className="text-sm text-muted-foreground">
                {category.unlocked} of {category.total} unlocked
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {category.achievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function CategoryAchievements({ achievements, categoryName }: { achievements: Achievement[], categoryName: string }) {
  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const lockedAchievements = achievements.filter((a) => !a.unlocked);

  return (
    <div className="space-y-8">
      {unlockedAchievements.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-wide">
            <Check className="h-4 w-4" aria-hidden="true" />
            Unlocked ({unlockedAchievements.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unlockedAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </section>
      )}

      {lockedAchievements.length > 0 && (
        <section>
          <h3 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-wide">
            <Lock className="h-4 w-4" aria-hidden="true" />
            Locked ({lockedAchievements.length})
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lockedAchievements.map((achievement) => (
              <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  const isUnlocked = achievement.unlocked;
  const withCategory = achievement as AchievementWithCategory;
  
  return (
    <Card 
      className={`transition-all ${isUnlocked ? 'border-gold/30 bg-gold/5' : 'opacity-60'}`}
      data-testid={`achievement-card-${achievement.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0 ${isUnlocked ? 'bg-gold/10' : 'bg-muted grayscale'}`}>
            {getAchievementIcon(achievement.icon)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-sm leading-tight">{achievement.name}</h4>
              {withCategory.xpReward && (
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  +{withCategory.xpReward} XP
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {achievement.description}
            </p>
            
            {isUnlocked ? (
              achievement.unlockedDate && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-500" />
                  {formatDate(achievement.unlockedDate)}
                </p>
              )
            ) : (
              achievement.maxProgress && achievement.maxProgress > 1 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground tabular-nums">
                      {achievement.progress || 0}/{achievement.maxProgress}
                    </span>
                    <span className="text-muted-foreground">
                      {Math.round(((achievement.progress || 0) / achievement.maxProgress) * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={((achievement.progress || 0) / achievement.maxProgress) * 100}
                    className="h-1"
                  />
                </div>
              )
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getCategoryIcon(iconName: string, className: string = "h-4 w-4") {
  const iconComponents: Record<string, JSX.Element> = {
    BookOpen: <BookOpen className={className} />,
    Target: <Target className={className} />,
    Flame: <Flame className={className} />,
    Clock: <Clock className={className} />,
    TrendingUp: <TrendingUp className={className} />,
    Brain: <Brain className={className} />,
    Users: <Users className={className} />,
    Calendar: <Calendar className={className} />,
    Sparkles: <Sparkles className={className} />,
  };
  return iconComponents[iconName] || <Trophy className={className} />;
}

function getAchievementIcon(iconName: string) {
  const iconClass = "h-5 w-5 text-gold";
  const iconComponents: Record<string, JSX.Element> = {
    Trophy: <Trophy className={iconClass} />,
    Star: <Star className={iconClass} />,
    Medal: <Medal className={iconClass} />,
    Crown: <Crown className={iconClass} />,
    Award: <Award className={iconClass} />,
    Target: <Target className={iconClass} />,
    Flame: <Flame className={iconClass} />,
    Zap: <Zap className={iconClass} />,
    Sparkles: <Sparkles className={iconClass} />,
    Brain: <Brain className={iconClass} />,
    BookOpen: <BookOpen className={iconClass} />,
    Clock: <Clock className={iconClass} />,
    Calendar: <Calendar className={iconClass} />,
    CalendarCheck: <CalendarCheck className={iconClass} />,
    CalendarDays: <CalendarDays className={iconClass} />,
    CalendarRange: <CalendarRange className={iconClass} />,
    Users: <Users className={iconClass} />,
    UserPlus: <UserPlus className={iconClass} />,
    TrendingUp: <TrendingUp className={iconClass} />,
    CheckCircle2: <CheckCircle2 className={iconClass} />,
    Heart: <Heart className={iconClass} />,
    Lightbulb: <Lightbulb className={iconClass} />,
    GraduationCap: <GraduationCap className={iconClass} />,
    Moon: <Moon className={iconClass} />,
    Sun: <Sun className={iconClass} />,
    Sunrise: <Sunrise className={iconClass} />,
    BarChart3: <BarChart3 className={iconClass} />,
    Swords: <Swords className={iconClass} />,
    Handshake: <Handshake className={iconClass} />,
    Mail: <Mail className={iconClass} />,
    Repeat: <Repeat className={iconClass} />,
    Wand2: <Wand2 className={iconClass} />,
    Upload: <Upload className={iconClass} />,
    Shield: <Shield className={iconClass} />,
    Rocket: <Rocket className={iconClass} />,
    ArrowUp: <ArrowUp className={iconClass} />,
    RefreshCw: <RefreshCw className={iconClass} />,
    LineChart: <LineChart className={iconClass} />,
    Layers: <Layers className={iconClass} />,
    Focus: <Focus className={iconClass} />,
    Palette: <Palette className={iconClass} />,
  };
  return iconComponents[iconName] || <Trophy className={iconClass} />;
}
