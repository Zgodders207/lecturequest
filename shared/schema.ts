import { z } from "zod";

// Question for quizzes
export interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

// Quiz result after completion
export interface QuizResult {
  score: number;
  total: number;
  xpEarned: number;
  accuracyPercent: number;
  incorrectTopics: string[];
}

// Achievement/badge
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
  progress?: number;
  maxProgress?: number;
}

// Daily quiz record
export interface DailyQuiz {
  date: string;
  score: number;
  xpEarned: number;
  improvement: number;
}

// Lecture with review data
export interface Lecture {
  id: string;
  title: string;
  date: string;
  content: string;
  reviewScore: number;
  xpEarned: number;
  incorrectTopics: string[];
  confidenceRating: number;
  dailyQuizzes: DailyQuiz[];
  needsReview: boolean;
  lastReviewed?: string;
}

// User profile with gamification data
export interface UserProfile {
  level: number;
  totalXP: number;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  totalLectures: number;
  averageConfidence: number;
  achievements: Achievement[];
  masteredTopics: string[];
  needsPractice: string[];
  powerUps: {
    secondChance: number;
    hints: number;
    doubleXP: boolean;
  };
  lastActivityDate?: string;
}

// Level titles based on level number
export const LEVEL_TITLES: Record<number, string> = {
  1: "Knowledge Novice",
  2: "Study Starter",
  3: "Learning Explorer",
  4: "Quiz Challenger",
  5: "Knowledge Apprentice",
  6: "Study Scholar",
  7: "Knowledge Warrior",
  8: "Learning Champion",
  9: "Quiz Master",
  10: "Knowledge Master",
  11: "Wisdom Seeker",
  12: "Grand Scholar",
  13: "Learning Legend",
  14: "Knowledge Sage",
  15: "Ultimate Master",
};

// All available achievements
export const ALL_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_steps",
    name: "First Steps",
    description: "Complete your first lecture review",
    icon: "footprints",
    unlocked: false,
    maxProgress: 1,
    progress: 0,
  },
  {
    id: "quick_learner",
    name: "Quick Learner",
    description: "Score 100% on any quiz",
    icon: "zap",
    unlocked: false,
    maxProgress: 1,
    progress: 0,
  },
  {
    id: "dedicated_student",
    name: "Dedicated Student",
    description: "Complete 5 lectures",
    icon: "book-open",
    unlocked: false,
    maxProgress: 5,
    progress: 0,
  },
  {
    id: "comeback_kid",
    name: "Comeback Kid",
    description: "Improve score by 30%+ on daily quiz",
    icon: "trending-up",
    unlocked: false,
    maxProgress: 1,
    progress: 0,
  },
  {
    id: "confident_scholar",
    name: "Confident Scholar",
    description: "Rate confidence 5/5",
    icon: "star",
    unlocked: false,
    maxProgress: 1,
    progress: 0,
  },
  {
    id: "week_warrior",
    name: "Week Warrior",
    description: "7-day streak",
    icon: "flame",
    unlocked: false,
    maxProgress: 7,
    progress: 0,
  },
  {
    id: "topic_master",
    name: "Topic Master",
    description: "Master 3 topics (score 80%+ twice)",
    icon: "crown",
    unlocked: false,
    maxProgress: 3,
    progress: 0,
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Complete daily quiz after 8pm",
    icon: "moon",
    unlocked: false,
    maxProgress: 1,
    progress: 0,
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Complete review before noon",
    icon: "sunrise",
    unlocked: false,
    maxProgress: 1,
    progress: 0,
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Get 10 perfect scores",
    icon: "target",
    unlocked: false,
    maxProgress: 10,
    progress: 0,
  },
  {
    id: "knowledge_seeker",
    name: "Knowledge Seeker",
    description: "Upload 10 lectures",
    icon: "search",
    unlocked: false,
    maxProgress: 10,
    progress: 0,
  },
];

// Initial user profile
export const INITIAL_USER_PROFILE: UserProfile = {
  level: 1,
  totalXP: 0,
  xpToNextLevel: 400,
  currentStreak: 0,
  longestStreak: 0,
  totalLectures: 0,
  averageConfidence: 0,
  achievements: ALL_ACHIEVEMENTS.map((a) => ({ ...a })),
  masteredTopics: [],
  needsPractice: [],
  powerUps: {
    secondChance: 0,
    hints: 0,
    doubleXP: false,
  },
};

// Demo profile for testing
export const DEMO_USER_PROFILE: UserProfile = {
  level: 4,
  totalXP: 850,
  xpToNextLevel: 2500,
  currentStreak: 3,
  longestStreak: 7,
  totalLectures: 2,
  averageConfidence: 3.5,
  achievements: ALL_ACHIEVEMENTS.map((a) => {
    if (a.id === "first_steps") {
      return { ...a, unlocked: true, unlockedDate: "2025-01-15", progress: 1 };
    }
    if (a.id === "quick_learner") {
      return { ...a, unlocked: true, unlockedDate: "2025-01-16", progress: 1 };
    }
    if (a.id === "dedicated_student") {
      return { ...a, progress: 2 };
    }
    if (a.id === "week_warrior") {
      return { ...a, progress: 3 };
    }
    return { ...a };
  }),
  masteredTopics: ["Arrays", "Basic Loops"],
  needsPractice: ["Linked Lists", "Queue Operations"],
  powerUps: {
    secondChance: 2,
    hints: 1,
    doubleXP: false,
  },
};

// Demo lectures
export const DEMO_LECTURES: Lecture[] = [
  {
    id: "demo-1",
    title: "Introduction to Data Structures",
    date: "2025-01-15",
    content: "Arrays, Linked Lists, Stacks, and Queues are fundamental data structures...",
    reviewScore: 85,
    xpEarned: 120,
    incorrectTopics: ["Linked Lists"],
    confidenceRating: 4,
    dailyQuizzes: [
      {
        date: "2025-01-16",
        score: 80,
        xpEarned: 45,
        improvement: -5,
      },
    ],
    needsReview: true,
    lastReviewed: "2025-01-15",
  },
  {
    id: "demo-2",
    title: "Algorithm Complexity",
    date: "2025-01-18",
    content: "Big O notation, time complexity, space complexity...",
    reviewScore: 70,
    xpEarned: 95,
    incorrectTopics: ["Queue Operations", "Space Complexity"],
    confidenceRating: 3,
    dailyQuizzes: [],
    needsReview: true,
    lastReviewed: "2025-01-18",
  },
];

// Zod schemas for API validation
export const questionSchema = z.object({
  question: z.string(),
  options: z.array(z.string()).length(4),
  correct: z.number().min(0).max(3),
  explanation: z.string(),
});

export const generateQuizRequestSchema = z.object({
  content: z.string().min(50, "Lecture content must be at least 50 characters"),
  title: z.string().optional(),
});

export const generateDailyQuizRequestSchema = z.object({
  weakTopics: z.array(z.string()),
  previousScore: z.number(),
  confidenceLevel: z.number().min(1).max(5),
});

export type GenerateQuizRequest = z.infer<typeof generateQuizRequestSchema>;
export type GenerateDailyQuizRequest = z.infer<typeof generateDailyQuizRequestSchema>;

// Calendar integration types
export interface CalendarSettings {
  url: string;
  lastSync?: string;
  lastSyncStatus?: "success" | "error";
  lastSyncError?: string;
}

export interface CalendarEvent {
  id: string;
  uid: string;
  title: string;
  eventType: "lecture" | "workshop" | "tutorial" | "exam" | "other";
  startsAt: string;
  endsAt: string;
  location?: string;
  description?: string;
  matchedLectureId?: string;
}

export const calendarSettingsSchema = z.object({
  url: z.string().url().refine(
    (url) => {
      if (!url.startsWith("https://")) return false;
      const lowerUrl = url.toLowerCase();
      const pathname = new URL(url).pathname.toLowerCase();
      return lowerUrl.includes(".ics") || pathname.includes("/ical") || pathname.includes("/calendar");
    },
    "Calendar URL must be a secure HTTPS link to a calendar feed"
  ),
});

export type CalendarSettingsInput = z.infer<typeof calendarSettingsSchema>;

// Initial calendar settings
export const INITIAL_CALENDAR_SETTINGS: CalendarSettings | null = null;
