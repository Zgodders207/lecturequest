import type { UserProfile, Achievement, Lecture } from "@shared/schema";
import { LEVEL_TITLES } from "@shared/schema";

// Calculate level from total XP
// Formula: Level = floor(sqrt(totalXP / 100))
export function calculateLevel(totalXP: number): number {
  return Math.max(1, Math.floor(Math.sqrt(totalXP / 100)));
}

// Calculate XP needed for next level
// Formula: ((level + 1)^2) * 100
export function xpForNextLevel(level: number): number {
  return Math.pow(level + 1, 2) * 100;
}

// Calculate XP progress within current level
export function xpProgressInLevel(totalXP: number, level: number): number {
  const currentLevelXP = Math.pow(level, 2) * 100;
  const nextLevelXP = xpForNextLevel(level);
  return totalXP - currentLevelXP;
}

// Calculate XP needed to reach next level from current position
export function xpToNextLevel(totalXP: number, level: number): number {
  const nextLevelXP = xpForNextLevel(level);
  return nextLevelXP - totalXP;
}

// Get level title
export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level, 15)] || LEVEL_TITLES[15];
}

// Calculate XP for quiz completion
export function calculateXP(
  correctAnswers: number,
  totalQuestions: number,
  isPerfect: boolean,
  confidenceRating: number,
  isImprovement: boolean,
  currentStreak: number,
  isDoubleXP: boolean = false
): number {
  let xp = 50; // base XP
  xp += correctAnswers * 10; // per correct answer
  if (isPerfect) xp += 50; // perfect score bonus
  xp += confidenceRating * 5; // confidence bonus
  if (isImprovement) xp += 20; // improvement bonus
  xp += currentStreak * 5; // streak bonus

  // Apply streak multiplier
  if (currentStreak >= 30) xp *= 2;
  else if (currentStreak >= 7) xp *= 1.5;

  // Apply double XP power-up
  if (isDoubleXP) xp *= 2;

  return Math.floor(xp);
}

// Get streak multiplier text
export function getStreakMultiplier(streak: number): string {
  if (streak >= 30) return "2x XP";
  if (streak >= 7) return "1.5x XP";
  return "";
}

// Get performance message based on score
export function getPerformanceMessage(
  score: number,
  total: number,
  isImprovement: boolean = false,
  improvementPercent: number = 0
): { message: string; type: "perfect" | "good" | "struggling" | "improvement" } {
  const percent = (score / total) * 100;

  if (isImprovement && improvementPercent >= 15) {
    return {
      message: `+${Math.round(improvementPercent)}% improvement! You're leveling up!`,
      type: "improvement",
    };
  }

  if (percent === 100) {
    return { message: "FLAWLESS! You're unstoppable!", type: "perfect" };
  }

  if (percent >= 70) {
    return { message: "Solid work! Keep pushing!", type: "good" };
  }

  return {
    message: "Growth happens outside comfort zones!",
    type: "struggling",
  };
}

// Get confidence message
export function getConfidenceMessage(rating: number): { message: string; xp: number } {
  if (rating <= 2) {
    return { message: "Honesty is the first step to mastery!", xp: 10 };
  }
  if (rating === 3) {
    return { message: "You're on your way!", xp: 15 };
  }
  return { message: "Confidence is key!", xp: 25 };
}

// Get motivational quote
export function getMotivationalQuote(): string {
  const quotes = [
    "You're crushing it!",
    "Consistency is your superpower!",
    "Every question makes you stronger!",
    "Building your knowledge empire!",
    "Leveling up your brain!",
    "Knowledge is power!",
    "One step closer to mastery!",
    "Your dedication is showing!",
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

// Extended achievement check context for all 100 achievements
export interface AchievementContext {
  currentHour: number;
  currentDay: number; // 0 = Sunday, 1 = Monday, etc.
  currentDate: number; // Day of month
  perfectScores: number;
  perfectStreak: number; // Consecutive perfect scores
  dailyQuizzesCompleted: number;
  dailyQuizStreak: number;
  dailyPerfectStreak: number;
  totalQuizzesCompleted: number;
  friendsCount: number;
  leaderboardRank?: number;
  calendarConnected: boolean;
  batchUploadCount: number;
  powerUpsUsed: { secondChance: boolean; hints: boolean; doubleXP: boolean };
  morningStreak: number;
  consecutiveImprovements: number;
}

// Check all 100 achievements
export function checkAchievements(
  userProfile: UserProfile,
  lectureHistory: Lecture[],
  currentHour: number = new Date().getHours(),
  perfectScores: number = 0,
  context?: Partial<AchievementContext>
): Achievement[] {
  const newlyUnlocked: Achievement[] = [];
  const now = new Date();
  const nowStr = now.toISOString().split("T")[0];
  
  const ctx: AchievementContext = {
    currentHour,
    currentDay: now.getDay(),
    currentDate: now.getDate(),
    perfectScores,
    perfectStreak: context?.perfectStreak ?? 0,
    dailyQuizzesCompleted: context?.dailyQuizzesCompleted ?? 0,
    dailyQuizStreak: context?.dailyQuizStreak ?? 0,
    dailyPerfectStreak: context?.dailyPerfectStreak ?? 0,
    totalQuizzesCompleted: context?.totalQuizzesCompleted ?? lectureHistory.reduce((sum, l) => sum + (l.questionsAnswered || 0) / 5, 0),
    friendsCount: context?.friendsCount ?? 0,
    leaderboardRank: context?.leaderboardRank,
    calendarConnected: context?.calendarConnected ?? false,
    batchUploadCount: context?.batchUploadCount ?? 0,
    powerUpsUsed: context?.powerUpsUsed ?? { secondChance: false, hints: false, doubleXP: false },
    morningStreak: context?.morningStreak ?? 0,
    consecutiveImprovements: context?.consecutiveImprovements ?? 0,
  };

  const lectureCount = lectureHistory.length;
  const masteredCount = userProfile.masteredTopics.length;
  const confidenceRatings = lectureHistory.filter(l => l.confidenceRating === 5).length;

  const hasImprovement = (percent: number) => lectureHistory.some(
    (lecture) => lecture.dailyQuizzes.some((dq) => dq.improvement >= percent)
  );
  
  const hasBounceBack = lectureHistory.some(
    (l) => l.dailyQuizzes.some((dq, i, arr) => 
      i > 0 && arr[i - 1].score < 50 && dq.score >= 80
    )
  );

  const hasPerfectTurnaround = lectureHistory.some(
    (l) => l.dailyQuizzes.some((dq, i, arr) => 
      i > 0 && arr[i - 1].score < 50 && dq.score === 100
    )
  );

  const hasPerfectOnFirst = lectureHistory.some(
    (l) => l.reviewScore === 100 && l.dailyQuizzes.length === 0
  );

  userProfile.achievements.forEach((achievement) => {
    if (achievement.unlocked) return;

    let shouldUnlock = false;
    let newProgress = achievement.progress || 0;
    const maxProgress = achievement.maxProgress || 1;

    switch (achievement.id) {
      // ==================== STUDY MILESTONES ====================
      case "first_lecture":
        shouldUnlock = lectureCount >= 1;
        newProgress = Math.min(maxProgress, lectureCount);
        break;
      case "five_lectures":
        shouldUnlock = lectureCount >= 5;
        newProgress = Math.min(maxProgress, lectureCount);
        break;
      case "ten_lectures":
        shouldUnlock = lectureCount >= 10;
        newProgress = Math.min(maxProgress, lectureCount);
        break;
      case "twenty_five_lectures":
        shouldUnlock = lectureCount >= 25;
        newProgress = Math.min(maxProgress, lectureCount);
        break;
      case "fifty_lectures":
        shouldUnlock = lectureCount >= 50;
        newProgress = Math.min(maxProgress, lectureCount);
        break;
      case "hundred_lectures":
        shouldUnlock = lectureCount >= 100;
        newProgress = Math.min(maxProgress, lectureCount);
        break;
      case "first_quiz":
        shouldUnlock = ctx.totalQuizzesCompleted >= 1;
        newProgress = Math.min(maxProgress, ctx.totalQuizzesCompleted);
        break;
      case "ten_quizzes":
        shouldUnlock = ctx.totalQuizzesCompleted >= 10;
        newProgress = Math.min(maxProgress, ctx.totalQuizzesCompleted);
        break;
      case "fifty_quizzes":
        shouldUnlock = ctx.totalQuizzesCompleted >= 50;
        newProgress = Math.min(maxProgress, ctx.totalQuizzesCompleted);
        break;
      case "hundred_quizzes":
        shouldUnlock = ctx.totalQuizzesCompleted >= 100;
        newProgress = Math.min(maxProgress, ctx.totalQuizzesCompleted);
        break;
      case "xp_1000":
        shouldUnlock = userProfile.totalXP >= 1000;
        newProgress = Math.min(maxProgress, userProfile.totalXP);
        break;
      case "xp_5000":
        shouldUnlock = userProfile.totalXP >= 5000;
        newProgress = Math.min(maxProgress, userProfile.totalXP);
        break;
      case "xp_10000":
        shouldUnlock = userProfile.totalXP >= 10000;
        newProgress = Math.min(maxProgress, userProfile.totalXP);
        break;
      case "xp_25000":
        shouldUnlock = userProfile.totalXP >= 25000;
        newProgress = Math.min(maxProgress, userProfile.totalXP);
        break;
      case "xp_50000":
        shouldUnlock = userProfile.totalXP >= 50000;
        newProgress = Math.min(maxProgress, userProfile.totalXP);
        break;

      // ==================== PERFECT SCORES ====================
      case "first_perfect":
        shouldUnlock = perfectScores >= 1;
        newProgress = Math.min(maxProgress, perfectScores);
        break;
      case "five_perfects":
        shouldUnlock = perfectScores >= 5;
        newProgress = Math.min(maxProgress, perfectScores);
        break;
      case "ten_perfects":
        shouldUnlock = perfectScores >= 10;
        newProgress = Math.min(maxProgress, perfectScores);
        break;
      case "twenty_perfects":
        shouldUnlock = perfectScores >= 20;
        newProgress = Math.min(maxProgress, perfectScores);
        break;
      case "thirty_perfects":
        shouldUnlock = perfectScores >= 30;
        newProgress = Math.min(maxProgress, perfectScores);
        break;
      case "fifty_perfects":
        shouldUnlock = perfectScores >= 50;
        newProgress = Math.min(maxProgress, perfectScores);
        break;
      case "seventy_five_perfects":
        shouldUnlock = perfectScores >= 75;
        newProgress = Math.min(maxProgress, perfectScores);
        break;
      case "hundred_perfects":
        shouldUnlock = perfectScores >= 100;
        newProgress = Math.min(maxProgress, perfectScores);
        break;
      case "perfect_streak_3":
        shouldUnlock = ctx.perfectStreak >= 3;
        newProgress = Math.min(maxProgress, ctx.perfectStreak);
        break;
      case "perfect_streak_5":
        shouldUnlock = ctx.perfectStreak >= 5;
        newProgress = Math.min(maxProgress, ctx.perfectStreak);
        break;
      case "perfect_streak_10":
        shouldUnlock = ctx.perfectStreak >= 10;
        newProgress = Math.min(maxProgress, ctx.perfectStreak);
        break;
      case "perfect_on_first":
        shouldUnlock = hasPerfectOnFirst;
        newProgress = hasPerfectOnFirst ? 1 : 0;
        break;

      // ==================== STREAK MASTERS ====================
      case "streak_3":
        shouldUnlock = userProfile.currentStreak >= 3;
        newProgress = Math.min(maxProgress, userProfile.currentStreak);
        break;
      case "streak_7":
        shouldUnlock = userProfile.currentStreak >= 7;
        newProgress = Math.min(maxProgress, userProfile.currentStreak);
        break;
      case "streak_14":
        shouldUnlock = userProfile.currentStreak >= 14;
        newProgress = Math.min(maxProgress, userProfile.currentStreak);
        break;
      case "streak_21":
        shouldUnlock = userProfile.currentStreak >= 21;
        newProgress = Math.min(maxProgress, userProfile.currentStreak);
        break;
      case "streak_30":
        shouldUnlock = userProfile.currentStreak >= 30;
        newProgress = Math.min(maxProgress, userProfile.currentStreak);
        break;
      case "streak_45":
        shouldUnlock = userProfile.currentStreak >= 45;
        newProgress = Math.min(maxProgress, userProfile.currentStreak);
        break;
      case "streak_60":
        shouldUnlock = userProfile.currentStreak >= 60;
        newProgress = Math.min(maxProgress, userProfile.currentStreak);
        break;
      case "streak_90":
        shouldUnlock = userProfile.currentStreak >= 90;
        newProgress = Math.min(maxProgress, userProfile.currentStreak);
        break;
      case "streak_100":
        shouldUnlock = userProfile.currentStreak >= 100;
        newProgress = Math.min(maxProgress, userProfile.currentStreak);
        break;
      case "streak_150":
        shouldUnlock = userProfile.currentStreak >= 150;
        newProgress = Math.min(maxProgress, userProfile.currentStreak);
        break;
      case "streak_180":
        shouldUnlock = userProfile.currentStreak >= 180;
        newProgress = Math.min(maxProgress, userProfile.currentStreak);
        break;
      case "streak_270":
        shouldUnlock = userProfile.currentStreak >= 270;
        newProgress = Math.min(maxProgress, userProfile.currentStreak);
        break;
      case "streak_365":
        shouldUnlock = userProfile.currentStreak >= 365;
        newProgress = Math.min(maxProgress, userProfile.currentStreak);
        break;
      case "streak_comeback":
        shouldUnlock = userProfile.longestStreak >= 7 && userProfile.currentStreak >= 1 && userProfile.currentStreak < userProfile.longestStreak;
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "longest_streak_30":
        shouldUnlock = userProfile.longestStreak >= 30;
        newProgress = Math.min(maxProgress, userProfile.longestStreak);
        break;

      // ==================== TIME-BASED ====================
      case "early_bird":
        shouldUnlock = ctx.currentHour < 8;
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "night_owl":
        shouldUnlock = ctx.currentHour >= 22;
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "lunch_learner":
        shouldUnlock = ctx.currentHour >= 12 && ctx.currentHour < 13;
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "weekend_warrior":
        shouldUnlock = ctx.currentDay === 0 || ctx.currentDay === 6;
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "monday_motivation":
        shouldUnlock = ctx.currentDay === 1;
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "friday_focus":
        shouldUnlock = ctx.currentDay === 5;
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "first_of_month":
        shouldUnlock = ctx.currentDate === 1;
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "late_night":
        shouldUnlock = ctx.currentHour >= 0 && ctx.currentHour < 3;
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "afternoon_ace":
        shouldUnlock = ctx.currentHour >= 14 && ctx.currentHour < 17;
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "morning_routine":
        shouldUnlock = ctx.morningStreak >= 5;
        newProgress = Math.min(maxProgress, ctx.morningStreak);
        break;

      // ==================== IMPROVEMENT ====================
      case "comeback_kid":
        shouldUnlock = hasImprovement(20);
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "improvement_15":
        shouldUnlock = hasImprovement(15);
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "improvement_30":
        shouldUnlock = hasImprovement(30);
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "improvement_50":
        shouldUnlock = hasImprovement(50);
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "improvement_75":
        shouldUnlock = hasImprovement(75);
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "perfect_turnaround":
        shouldUnlock = hasPerfectTurnaround;
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "consistent_improver":
        shouldUnlock = ctx.consecutiveImprovements >= 5;
        newProgress = Math.min(maxProgress, ctx.consecutiveImprovements);
        break;
      case "bouncing_back":
        shouldUnlock = hasBounceBack;
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "growth_mindset":
        const reviewCount = lectureHistory.reduce((sum, l) => sum + l.dailyQuizzes.length, 0);
        shouldUnlock = reviewCount >= 10;
        newProgress = Math.min(maxProgress, reviewCount);
        break;
      case "mastery_journey":
        const maxAttempts = Math.max(...lectureHistory.map(l => l.dailyQuizzes.length), 0);
        shouldUnlock = maxAttempts >= 5;
        newProgress = Math.min(maxProgress, maxAttempts);
        break;

      // ==================== TOPIC MASTERY ====================
      case "first_mastery":
        shouldUnlock = masteredCount >= 1;
        newProgress = Math.min(maxProgress, masteredCount);
        break;
      case "three_topics":
        shouldUnlock = masteredCount >= 3;
        newProgress = Math.min(maxProgress, masteredCount);
        break;
      case "five_topics":
        shouldUnlock = masteredCount >= 5;
        newProgress = Math.min(maxProgress, masteredCount);
        break;
      case "ten_topics":
        shouldUnlock = masteredCount >= 10;
        newProgress = Math.min(maxProgress, masteredCount);
        break;
      case "fifteen_topics":
        shouldUnlock = masteredCount >= 15;
        newProgress = Math.min(maxProgress, masteredCount);
        break;
      case "twenty_topics":
        shouldUnlock = masteredCount >= 20;
        newProgress = Math.min(maxProgress, masteredCount);
        break;
      case "twenty_five_topics":
        shouldUnlock = masteredCount >= 25;
        newProgress = Math.min(maxProgress, masteredCount);
        break;
      case "thirty_topics":
        shouldUnlock = masteredCount >= 30;
        newProgress = Math.min(maxProgress, masteredCount);
        break;
      case "fifty_topics":
        shouldUnlock = masteredCount >= 50;
        newProgress = Math.min(maxProgress, masteredCount);
        break;
      case "jack_of_trades":
        const lecturesWithMasteredTopics = new Set(
          lectureHistory.filter(l => l.reviewScore >= 80).map(l => l.id)
        ).size;
        shouldUnlock = lecturesWithMasteredTopics >= 5;
        newProgress = Math.min(maxProgress, lecturesWithMasteredTopics);
        break;
      case "specialist":
        shouldUnlock = lectureHistory.some(l => l.reviewScore >= 80 && l.dailyQuizzes.length >= 2);
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "renaissance_learner":
        shouldUnlock = lectureHistory.filter(l => l.reviewScore >= 80).length >= 3;
        newProgress = Math.min(maxProgress, lectureHistory.filter(l => l.reviewScore >= 80).length);
        break;

      // ==================== SOCIAL/COMPETITION ====================
      case "first_friend":
        shouldUnlock = ctx.friendsCount >= 1;
        newProgress = Math.min(maxProgress, ctx.friendsCount);
        break;
      case "five_friends":
        shouldUnlock = ctx.friendsCount >= 5;
        newProgress = Math.min(maxProgress, ctx.friendsCount);
        break;
      case "ten_friends":
        shouldUnlock = ctx.friendsCount >= 10;
        newProgress = Math.min(maxProgress, ctx.friendsCount);
        break;
      case "twenty_five_friends":
        shouldUnlock = ctx.friendsCount >= 25;
        newProgress = Math.min(maxProgress, ctx.friendsCount);
        break;
      case "leaderboard_top10":
        shouldUnlock = ctx.leaderboardRank !== undefined && ctx.leaderboardRank <= 10;
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "leaderboard_top3":
        shouldUnlock = ctx.leaderboardRank !== undefined && ctx.leaderboardRank <= 3;
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "leaderboard_champion":
        shouldUnlock = ctx.leaderboardRank === 1;
        newProgress = shouldUnlock ? 1 : 0;
        break;
      case "friendly_competition":
        newProgress = achievement.progress || 0;
        break;
      case "study_buddy":
        newProgress = achievement.progress || 0;
        break;
      case "invite_accepted":
        newProgress = achievement.progress || 0;
        break;

      // ==================== DAILY QUIZ ====================
      case "daily_first":
        shouldUnlock = ctx.dailyQuizzesCompleted >= 1;
        newProgress = Math.min(maxProgress, ctx.dailyQuizzesCompleted);
        break;
      case "daily_10":
        shouldUnlock = ctx.dailyQuizzesCompleted >= 10;
        newProgress = Math.min(maxProgress, ctx.dailyQuizzesCompleted);
        break;
      case "daily_25":
        shouldUnlock = ctx.dailyQuizzesCompleted >= 25;
        newProgress = Math.min(maxProgress, ctx.dailyQuizzesCompleted);
        break;
      case "daily_50":
        shouldUnlock = ctx.dailyQuizzesCompleted >= 50;
        newProgress = Math.min(maxProgress, ctx.dailyQuizzesCompleted);
        break;
      case "daily_100":
        shouldUnlock = ctx.dailyQuizzesCompleted >= 100;
        newProgress = Math.min(maxProgress, ctx.dailyQuizzesCompleted);
        break;
      case "daily_200":
        shouldUnlock = ctx.dailyQuizzesCompleted >= 200;
        newProgress = Math.min(maxProgress, ctx.dailyQuizzesCompleted);
        break;
      case "week_of_dailies":
        shouldUnlock = ctx.dailyQuizStreak >= 7;
        newProgress = Math.min(maxProgress, ctx.dailyQuizStreak);
        break;
      case "month_of_dailies":
        shouldUnlock = ctx.dailyQuizStreak >= 30;
        newProgress = Math.min(maxProgress, ctx.dailyQuizStreak);
        break;
      case "daily_perfect":
        const hasDailyPerfect = lectureHistory.some(l => 
          l.dailyQuizzes.some(dq => dq.score === 100)
        );
        shouldUnlock = hasDailyPerfect;
        newProgress = hasDailyPerfect ? 1 : 0;
        break;
      case "daily_streak_perfect":
        shouldUnlock = ctx.dailyPerfectStreak >= 7;
        newProgress = Math.min(maxProgress, ctx.dailyPerfectStreak);
        break;

      // ==================== SPECIAL ====================
      case "confidence_master":
        shouldUnlock = confidenceRatings >= 10;
        newProgress = Math.min(maxProgress, confidenceRatings);
        break;
      case "power_up_pro":
        const powerUpsUsedCount = [
          ctx.powerUpsUsed.secondChance,
          ctx.powerUpsUsed.hints,
          ctx.powerUpsUsed.doubleXP
        ].filter(Boolean).length;
        shouldUnlock = powerUpsUsedCount >= 3;
        newProgress = Math.min(maxProgress, powerUpsUsedCount);
        break;
      case "calendar_connected":
        shouldUnlock = ctx.calendarConnected;
        newProgress = ctx.calendarConnected ? 1 : 0;
        break;
      case "batch_upload":
        shouldUnlock = ctx.batchUploadCount >= 5;
        newProgress = ctx.batchUploadCount >= 5 ? 1 : 0;
        break;
      case "level_10":
        shouldUnlock = userProfile.level >= 10;
        newProgress = Math.min(maxProgress, userProfile.level);
        break;
      case "level_15":
        shouldUnlock = userProfile.level >= 15;
        newProgress = Math.min(maxProgress, userProfile.level);
        break;

      default:
        break;
    }

    achievement.progress = newProgress;

    if (shouldUnlock && !achievement.unlocked) {
      achievement.unlocked = true;
      achievement.unlockedDate = nowStr;
      newlyUnlocked.push(achievement);
    }
  });

  return newlyUnlocked;
}

// Extract topics from question text for weakness identification
export function extractTopics(questionText: string): string[] {
  const topics: string[] = [];
  
  // Look for capitalized terms (potential technical terms)
  const capitalizedWords = questionText.match(/\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*/g);
  if (capitalizedWords) {
    topics.push(...capitalizedWords.filter(w => w.length > 3));
  }

  // Look for quoted terms
  const quotedTerms = questionText.match(/"([^"]+)"/g) || questionText.match(/'([^']+)'/g);
  if (quotedTerms) {
    topics.push(...quotedTerms.map(t => t.replace(/['"]/g, '')));
  }

  // Common CS/academic keywords
  const keywords = [
    "array", "linked list", "stack", "queue", "tree", "graph", "hash",
    "sort", "search", "recursion", "iteration", "loop", "function",
    "variable", "pointer", "memory", "algorithm", "complexity",
    "data structure", "object", "class", "inheritance", "polymorphism"
  ];
  
  const lowerText = questionText.toLowerCase();
  keywords.forEach(keyword => {
    if (lowerText.includes(keyword)) {
      topics.push(keyword.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    }
  });

  // Deduplicate and limit
  return Array.from(new Set(topics)).slice(0, 5);
}

// Get topic mastery color based on progress percentage
export function getTopicMasteryColor(progress: number): {
  bg: string;
  text: string;
  label: string;
} {
  if (progress >= 71) {
    return { bg: "bg-success", text: "text-success", label: "Mastered" };
  }
  if (progress >= 41) {
    return { bg: "bg-gold", text: "text-gold", label: "Developing" };
  }
  return { bg: "bg-destructive", text: "text-destructive", label: "Learning" };
}

// Calculate topic mastery percentage
export function calculateTopicMastery(
  topic: string,
  lectureHistory: Lecture[]
): number {
  const relatedLectures = lectureHistory.filter(
    (l) =>
      l.incorrectTopics.includes(topic) ||
      l.content.toLowerCase().includes(topic.toLowerCase())
  );

  if (relatedLectures.length === 0) return 0;

  const avgScore =
    relatedLectures.reduce((sum, l) => sum + l.reviewScore, 0) /
    relatedLectures.length;

  return Math.round(avgScore);
}

// Check if streak should be broken (more than 24 hours since last activity)
export function shouldBreakStreak(lastActivityDate?: string): boolean {
  if (!lastActivityDate) return false;
  
  const last = new Date(lastActivityDate);
  const now = new Date();
  const hoursDiff = (now.getTime() - last.getTime()) / (1000 * 60 * 60);
  
  return hoursDiff > 48; // Break streak if more than 48 hours
}

// Format date for display
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Generate unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
