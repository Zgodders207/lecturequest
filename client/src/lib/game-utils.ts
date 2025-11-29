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

// Check all achievements
export function checkAchievements(
  userProfile: UserProfile,
  lectureHistory: Lecture[],
  currentHour: number = new Date().getHours(),
  perfectScores: number = 0
): Achievement[] {
  const newlyUnlocked: Achievement[] = [];
  const now = new Date().toISOString().split("T")[0];

  userProfile.achievements.forEach((achievement) => {
    if (achievement.unlocked) return;

    let shouldUnlock = false;
    let newProgress = achievement.progress || 0;

    switch (achievement.id) {
      case "first_steps":
        shouldUnlock = lectureHistory.length >= 1;
        newProgress = Math.min(1, lectureHistory.length);
        break;

      case "quick_learner":
        shouldUnlock = lectureHistory.some((l) => l.reviewScore === 100);
        newProgress = lectureHistory.some((l) => l.reviewScore === 100) ? 1 : 0;
        break;

      case "dedicated_student":
        shouldUnlock = lectureHistory.length >= 5;
        newProgress = Math.min(5, lectureHistory.length);
        break;

      case "comeback_kid":
        const hasImprovement = lectureHistory.some((lecture) =>
          lecture.dailyQuizzes.some((dq) => dq.improvement >= 30)
        );
        shouldUnlock = hasImprovement;
        newProgress = hasImprovement ? 1 : 0;
        break;

      case "confident_scholar":
        shouldUnlock = lectureHistory.some((l) => l.confidenceRating === 5);
        newProgress = lectureHistory.some((l) => l.confidenceRating === 5) ? 1 : 0;
        break;

      case "week_warrior":
        shouldUnlock = userProfile.currentStreak >= 7;
        newProgress = Math.min(7, userProfile.currentStreak);
        break;

      case "topic_master":
        const masteredCount = userProfile.masteredTopics.length;
        shouldUnlock = masteredCount >= 3;
        newProgress = Math.min(3, masteredCount);
        break;

      case "night_owl":
        shouldUnlock = currentHour >= 20;
        newProgress = currentHour >= 20 ? 1 : 0;
        break;

      case "early_bird":
        shouldUnlock = currentHour < 12;
        newProgress = currentHour < 12 ? 1 : 0;
        break;

      case "perfectionist":
        shouldUnlock = perfectScores >= 10;
        newProgress = Math.min(10, perfectScores);
        break;

      case "knowledge_seeker":
        shouldUnlock = lectureHistory.length >= 10;
        newProgress = Math.min(10, lectureHistory.length);
        break;
    }

    achievement.progress = newProgress;

    if (shouldUnlock && !achievement.unlocked) {
      achievement.unlocked = true;
      achievement.unlockedDate = now;
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
