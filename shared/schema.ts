import { z } from "zod";
import { sql } from "drizzle-orm";
import { pgTable, text, integer, real, boolean, timestamp, jsonb, serial, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// ==================== DATABASE TABLES ====================

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User profile table with Replit Auth integration
export const usersTable = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  level: integer("level").notNull().default(1),
  totalXP: integer("total_xp").notNull().default(0),
  xpToNextLevel: integer("xp_to_next_level").notNull().default(400),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  totalLectures: integer("total_lectures").notNull().default(0),
  averageConfidence: real("average_confidence").notNull().default(0),
  achievements: jsonb("achievements").notNull().default([]),
  masteredTopics: jsonb("mastered_topics").notNull().default([]),
  needsPractice: jsonb("needs_practice").notNull().default([]),
  powerUps: jsonb("power_ups").notNull().default({}),
  lastActivityDate: text("last_activity_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Lectures table - stores uploaded lecture content
export const lecturesTable = pgTable("lectures", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  content: text("content").notNull(),
  reviewScore: integer("review_score").notNull().default(0),
  xpEarned: integer("xp_earned").notNull().default(0),
  incorrectTopics: jsonb("incorrect_topics").notNull().default([]),
  confidenceRating: integer("confidence_rating").notNull().default(0),
  dailyQuizzes: jsonb("daily_quizzes").notNull().default([]),
  needsReview: boolean("needs_review").notNull().default(true),
  lastReviewed: text("last_reviewed"),
  identifiedSkills: jsonb("identified_skills").notNull().default([]),
  questionsAnswered: integer("questions_answered").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Topic review stats for spaced repetition algorithm
export const topicReviewStatsTable = pgTable("topic_review_stats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  topic: text("topic").notNull(),
  lectureId: integer("lecture_id").notNull(),
  lectureTitle: text("lecture_title").notNull(),
  lastReviewed: text("last_reviewed").notNull(),
  lastScore: integer("last_score").notNull().default(0),
  reviewCount: integer("review_count").notNull().default(1),
  easeFactor: real("ease_factor").notNull().default(2.5),
  interval: integer("interval").notNull().default(1),
  nextDue: text("next_due").notNull(),
  streak: integer("streak").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Review events history
export const reviewEventsTable = pgTable("review_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  topicId: text("topic_id").notNull(),
  topic: text("topic").notNull(),
  lectureId: integer("lecture_id").notNull(),
  date: text("date").notNull(),
  score: integer("score").notNull(),
  responseTime: integer("response_time"),
  wasCorrect: boolean("was_correct").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Daily quiz plans
export const dailyQuizPlansTable = pgTable("daily_quiz_plans", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  generatedAt: text("generated_at").notNull(),
  topics: jsonb("topics").notNull().default([]),
  lectureExcerpts: jsonb("lecture_excerpts").notNull().default([]),
  completed: boolean("completed").notNull().default(false),
  completedAt: text("completed_at"),
  score: integer("score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Cached quiz questions for each topic (to avoid regenerating)
export const cachedQuestionsTable = pgTable("cached_questions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  topic: text("topic").notNull(),
  lectureId: integer("lecture_id").notNull(),
  question: text("question").notNull(),
  options: jsonb("options").notNull(),
  correct: integer("correct").notNull(),
  explanation: text("explanation").notNull(),
  timesUsed: integer("times_used").notNull().default(0),
  lastUsed: text("last_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Calendar settings
export const calendarSettingsTable = pgTable("calendar_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  url: text("url").notNull(),
  lastSync: text("last_sync"),
  lastSyncStatus: text("last_sync_status"),
  lastSyncError: text("last_sync_error"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Calendar events
export const calendarEventsTable = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  uid: text("uid").notNull(),
  title: text("title").notNull(),
  eventType: text("event_type").notNull(),
  startsAt: text("starts_at").notNull(),
  endsAt: text("ends_at").notNull(),
  location: text("location"),
  description: text("description"),
  matchedLectureId: integer("matched_lecture_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Lecture uploads for batch processing
export const lectureUploadsTable = pgTable("lecture_uploads", {
  id: serial("id").primaryKey(),
  batchId: varchar("batch_id").notNull(),
  userId: varchar("user_id").notNull(),
  filename: varchar("filename"),
  status: varchar("status", { enum: ["pending", "processing", "completed", "error"] }).default("pending"),
  error: text("error"),
  lectureId: integer("lecture_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Dismissed lectures table for "forget" feature
export const dismissedLecturesTable = pgTable("dismissed_lectures", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  calendarEventId: varchar("calendar_event_id").notNull(),
  dismissedAt: timestamp("dismissed_at").defaultNow(),
  reason: varchar("reason"),
});

// Friendships table for social features
export const friendshipsTable = pgTable("friendships", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  friendId: varchar("friend_id").notNull(),
  status: varchar("status", { enum: ["pending", "accepted", "declined"] }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
});

// Weekly XP logs for leaderboard tracking
export const weeklyXpLogsTable = pgTable("weekly_xp_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  weekStart: timestamp("week_start").notNull(),
  xpEarned: integer("xp_earned").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export const insertLectureSchema = createInsertSchema(lecturesTable).omit({ id: true, createdAt: true });
export const insertTopicReviewStatsSchema = createInsertSchema(topicReviewStatsTable).omit({ id: true, createdAt: true });
export const insertReviewEventSchema = createInsertSchema(reviewEventsTable).omit({ id: true, createdAt: true });
export const insertDailyQuizPlanSchema = createInsertSchema(dailyQuizPlansTable).omit({ id: true, createdAt: true });
export const insertCachedQuestionSchema = createInsertSchema(cachedQuestionsTable).omit({ id: true, createdAt: true });
export const insertCalendarSettingsSchema = createInsertSchema(calendarSettingsTable).omit({ id: true, createdAt: true });
export const insertCalendarEventSchema = createInsertSchema(calendarEventsTable).omit({ id: true, createdAt: true });
export const insertLectureUploadSchema = createInsertSchema(lectureUploadsTable).omit({ id: true, createdAt: true });
export const insertDismissedLectureSchema = createInsertSchema(dismissedLecturesTable).omit({ id: true, dismissedAt: true });
export const insertFriendshipSchema = createInsertSchema(friendshipsTable).omit({ id: true, createdAt: true });
export const insertWeeklyXpLogSchema = createInsertSchema(weeklyXpLogsTable).omit({ id: true, updatedAt: true });

// Select types
export type DbUser = typeof usersTable.$inferSelect;
export type User = typeof usersTable.$inferSelect;
export type UpsertUser = typeof usersTable.$inferInsert;
export type DbLecture = typeof lecturesTable.$inferSelect;
export type DbTopicReviewStats = typeof topicReviewStatsTable.$inferSelect;
export type DbReviewEvent = typeof reviewEventsTable.$inferSelect;
export type DbDailyQuizPlan = typeof dailyQuizPlansTable.$inferSelect;
export type DbCachedQuestion = typeof cachedQuestionsTable.$inferSelect;
export type DbCalendarSettings = typeof calendarSettingsTable.$inferSelect;
export type DbCalendarEvent = typeof calendarEventsTable.$inferSelect;
export type DbLectureUpload = typeof lectureUploadsTable.$inferSelect;
export type DbDismissedLecture = typeof dismissedLecturesTable.$inferSelect;
export type DbFriendship = typeof friendshipsTable.$inferSelect;
export type DbWeeklyXpLog = typeof weeklyXpLogsTable.$inferSelect;

// Insert types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertLecture = z.infer<typeof insertLectureSchema>;
export type InsertTopicReviewStats = z.infer<typeof insertTopicReviewStatsSchema>;
export type InsertReviewEvent = z.infer<typeof insertReviewEventSchema>;
export type InsertDailyQuizPlan = z.infer<typeof insertDailyQuizPlanSchema>;
export type InsertCachedQuestion = z.infer<typeof insertCachedQuestionSchema>;
export type InsertCalendarSettings = z.infer<typeof insertCalendarSettingsSchema>;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type InsertLectureUpload = z.infer<typeof insertLectureUploadSchema>;
export type InsertDismissedLecture = z.infer<typeof insertDismissedLectureSchema>;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type InsertWeeklyXpLog = z.infer<typeof insertWeeklyXpLogSchema>;

// Dismissed lecture interface
export interface DismissedLecture {
  id: string;
  userId: string;
  calendarEventId: string;
  dismissedAt: string;
  reason?: string;
}

// Friendship interface
export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
  acceptedAt?: string;
}

// Weekly XP log interface
export interface WeeklyXpLog {
  id: string;
  userId: string;
  weekStart: string;
  xpEarned: number;
  updatedAt: string;
}

// ==================== SHARED TYPES ====================

// Transferable skill identified from lecture content
export interface TransferableSkill {
  name: string; // e.g., "Analytical Thinking", "Problem Solving"
  description: string; // Brief explanation of the skill
  category: "cognitive" | "technical" | "communication" | "interpersonal" | "organizational";
  relevantCareers: string[]; // Career paths where this skill is valuable
  proficiencyLevel: "developing" | "intermediate" | "proficient"; // Based on quiz performance
}

// Question for quizzes
export interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  topic?: string; // Specific concept being tested (AI-generated)
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

// Topic-level spaced repetition stats (SM-2 inspired algorithm)
export interface TopicReviewStats {
  topic: string;
  lectureId: string;
  lectureTitle: string;
  lastReviewed: string;
  lastScore: number;
  reviewCount: number;
  easeFactor: number; // SM-2 ease factor (starts at 2.5)
  interval: number; // Days until next review
  nextDue: string; // ISO date when review is due
  streak: number; // Consecutive successful reviews (score >= 70%)
}

// Review event for history tracking
export interface ReviewEvent {
  id: string;
  topicId: string;
  topic: string;
  lectureId: string;
  date: string;
  score: number;
  responseTime?: number; // Seconds to answer
  wasCorrect: boolean;
}

// Daily quiz plan generated by the server
export interface DailyQuizPlan {
  id: string;
  generatedAt: string;
  topics: {
    topic: string;
    lectureId: string;
    lectureTitle: string;
    priority: number;
    reason: "due" | "weak" | "overdue" | "new";
    daysSinceReview: number;
  }[];
  lectureExcerpts: {
    lectureId: string;
    excerpt: string;
  }[];
  completed: boolean;
  completedAt?: string;
  score?: number;
}

// Spaced repetition intervals (in days) based on streak
export const SPACED_REPETITION_INTERVALS = [1, 3, 7, 14, 30, 60, 90];

// Calculate next review date using SM-2 algorithm
export function calculateNextReview(
  currentEaseFactor: number,
  currentInterval: number,
  score: number, // 0-100
  streak: number
): { easeFactor: number; interval: number; nextDue: string } {
  // Convert score to quality (0-5 scale for SM-2)
  const quality = Math.round((score / 100) * 5);
  
  // Update ease factor (minimum 1.3)
  let newEaseFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEaseFactor = Math.max(1.3, newEaseFactor);
  
  // Calculate new interval
  let newInterval: number;
  if (quality < 3) {
    // Failed - reset to beginning
    newInterval = 1;
  } else if (streak === 0) {
    newInterval = 1;
  } else if (streak === 1) {
    newInterval = 3;
  } else {
    // Use interval ladder with ease factor
    const baseInterval = SPACED_REPETITION_INTERVALS[Math.min(streak, SPACED_REPETITION_INTERVALS.length - 1)];
    newInterval = Math.round(baseInterval * newEaseFactor);
  }
  
  // Calculate next due date
  const nextDue = new Date();
  nextDue.setDate(nextDue.getDate() + newInterval);
  
  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    nextDue: nextDue.toISOString().split('T')[0],
  };
}

// Calculate topic priority for daily quiz selection
export function calculateTopicPriority(stats: TopicReviewStats): number {
  const today = new Date();
  const nextDue = new Date(stats.nextDue);
  const daysSinceDue = Math.floor((today.getTime() - nextDue.getTime()) / (1000 * 60 * 60 * 24));
  
  let priority = 0;
  
  // Overdue topics get highest priority (more overdue = higher priority)
  if (daysSinceDue > 0) {
    priority += 100 + (daysSinceDue * 10);
  }
  
  // Due today gets high priority
  if (daysSinceDue === 0) {
    priority += 80;
  }
  
  // Low scores increase priority (inverse relationship)
  priority += Math.max(0, 50 - (stats.lastScore / 2));
  
  // Lower ease factor increases priority (harder topics)
  priority += Math.max(0, (2.5 - stats.easeFactor) * 20);
  
  // Lower streak increases priority
  priority += Math.max(0, (5 - stats.streak) * 5);
  
  return priority;
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
  identifiedSkills?: TransferableSkill[]; // Skills identified from this lecture
  questionsAnswered?: number; // Number of questions answered in the last quiz
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

// Demo profile for testing - looks like an actively used account
export const DEMO_USER_PROFILE: UserProfile = {
  level: 5,
  totalXP: 2650,
  xpToNextLevel: 3600,
  currentStreak: 7,
  longestStreak: 12,
  totalLectures: 7,
  averageConfidence: 3.8,
  achievements: ALL_ACHIEVEMENTS.map((a) => {
    if (a.id === "first_steps") {
      return { ...a, unlocked: true, unlockedDate: "2025-11-10", progress: 1 };
    }
    if (a.id === "quick_learner") {
      return { ...a, unlocked: true, unlockedDate: "2025-11-12", progress: 1 };
    }
    if (a.id === "dedicated_student") {
      return { ...a, unlocked: true, unlockedDate: "2025-11-20", progress: 5 };
    }
    if (a.id === "week_warrior") {
      return { ...a, unlocked: true, unlockedDate: "2025-11-25", progress: 7 };
    }
    if (a.id === "early_bird") {
      return { ...a, unlocked: true, unlockedDate: "2025-11-15", progress: 1 };
    }
    if (a.id === "perfectionist") {
      return { ...a, progress: 3 };
    }
    if (a.id === "knowledge_seeker") {
      return { ...a, progress: 7 };
    }
    if (a.id === "topic_master") {
      return { ...a, progress: 2 };
    }
    return { ...a };
  }),
  masteredTopics: ["Variables", "Loops", "Functions", "Arrays"],
  needsPractice: ["Recursion", "Binary Trees"],
  powerUps: {
    secondChance: 3,
    hints: 2,
    doubleXP: true,
  },
  lastActivityDate: new Date().toISOString().split('T')[0],
};

// Demo lectures - variety of subjects and scores
export const DEMO_LECTURES: Lecture[] = [
  {
    id: "demo-1",
    title: "Introduction to Programming",
    date: "2025-11-10",
    content: "Variables, data types, operators, and basic input/output operations form the foundation of programming...",
    reviewScore: 92,
    xpEarned: 145,
    incorrectTopics: [],
    confidenceRating: 5,
    dailyQuizzes: [
      { date: "2025-11-11", score: 95, xpEarned: 52, improvement: 3 },
      { date: "2025-11-15", score: 100, xpEarned: 60, improvement: 5 },
    ],
    needsReview: false,
    lastReviewed: "2025-11-15",
    questionsAnswered: 10,
    identifiedSkills: [
      { name: "Logical Reasoning", description: "Ability to follow step-by-step logical processes and understand cause-effect relationships", category: "cognitive", relevantCareers: ["Software Engineer", "Data Analyst", "Systems Architect"], proficiencyLevel: "proficient" },
      { name: "Problem Decomposition", description: "Breaking complex problems into smaller, manageable components", category: "cognitive", relevantCareers: ["Software Developer", "Project Manager", "Consultant"], proficiencyLevel: "proficient" },
    ],
  },
  {
    id: "demo-2",
    title: "Control Flow & Loops",
    date: "2025-11-12",
    content: "If statements, switch cases, for loops, while loops, and nested control structures...",
    reviewScore: 88,
    xpEarned: 130,
    incorrectTopics: ["Nested Loops"],
    confidenceRating: 4,
    dailyQuizzes: [
      { date: "2025-11-13", score: 85, xpEarned: 48, improvement: -3 },
      { date: "2025-11-18", score: 90, xpEarned: 55, improvement: 5 },
    ],
    needsReview: false,
    lastReviewed: "2025-11-18",
    questionsAnswered: 10,
    identifiedSkills: [
      { name: "Algorithmic Thinking", description: "Designing systematic approaches to solve problems efficiently", category: "cognitive", relevantCareers: ["Software Engineer", "Machine Learning Engineer", "Quantitative Analyst"], proficiencyLevel: "proficient" },
      { name: "Pattern Recognition", description: "Identifying recurring structures and optimizing repetitive processes", category: "cognitive", relevantCareers: ["Data Scientist", "Business Analyst", "UX Researcher"], proficiencyLevel: "intermediate" },
    ],
  },
  {
    id: "demo-3",
    title: "Functions & Modular Design",
    date: "2025-11-15",
    content: "Function declarations, parameters, return values, scope, and modular programming principles...",
    reviewScore: 78,
    xpEarned: 110,
    incorrectTopics: ["Recursion", "Scope"],
    confidenceRating: 3,
    dailyQuizzes: [
      { date: "2025-11-16", score: 72, xpEarned: 42, improvement: -6 },
    ],
    needsReview: true,
    lastReviewed: "2025-11-16",
    questionsAnswered: 5,
    identifiedSkills: [
      { name: "Code Organization", description: "Structuring code for readability, maintainability, and reusability", category: "technical", relevantCareers: ["Software Engineer", "Tech Lead", "DevOps Engineer"], proficiencyLevel: "intermediate" },
      { name: "Abstraction", description: "Hiding complexity and exposing only essential interfaces", category: "cognitive", relevantCareers: ["Systems Architect", "API Developer", "Product Engineer"], proficiencyLevel: "developing" },
    ],
  },
  {
    id: "demo-4",
    title: "Arrays & Collections",
    date: "2025-11-18",
    content: "Array declaration, indexing, iteration, multi-dimensional arrays, and common array algorithms...",
    reviewScore: 85,
    xpEarned: 125,
    incorrectTopics: ["2D Arrays"],
    confidenceRating: 4,
    dailyQuizzes: [
      { date: "2025-11-20", score: 88, xpEarned: 50, improvement: 3 },
    ],
    needsReview: false,
    lastReviewed: "2025-11-20",
    questionsAnswered: 10,
    identifiedSkills: [
      { name: "Data Organization", description: "Efficiently structuring and accessing collections of information", category: "technical", relevantCareers: ["Database Administrator", "Backend Developer", "Data Engineer"], proficiencyLevel: "proficient" },
      { name: "Optimization", description: "Improving algorithm efficiency and reducing computational complexity", category: "technical", relevantCareers: ["Performance Engineer", "Machine Learning Engineer", "Game Developer"], proficiencyLevel: "intermediate" },
    ],
  },
  {
    id: "demo-5",
    title: "Object-Oriented Programming",
    date: "2025-11-20",
    content: "Classes, objects, inheritance, polymorphism, encapsulation, and abstraction principles...",
    reviewScore: 72,
    xpEarned: 100,
    incorrectTopics: ["Polymorphism", "Abstract Classes"],
    confidenceRating: 3,
    dailyQuizzes: [],
    needsReview: true,
    lastReviewed: "2025-11-20",
    questionsAnswered: 5,
    identifiedSkills: [
      { name: "Systems Design", description: "Creating modular, extensible architectures for complex applications", category: "technical", relevantCareers: ["Systems Architect", "Staff Engineer", "Technical Director"], proficiencyLevel: "developing" },
      { name: "Code Organization", description: "Designing components that can be repurposed across different contexts", category: "technical", relevantCareers: ["Platform Engineer", "Library Developer", "Framework Author"], proficiencyLevel: "developing" },
    ],
  },
  {
    id: "demo-6",
    title: "Data Structures Fundamentals",
    date: "2025-11-25",
    content: "Linked lists, stacks, queues, and their implementations using arrays and pointers...",
    reviewScore: 65,
    xpEarned: 90,
    incorrectTopics: ["Binary Trees", "Tree Traversal"],
    confidenceRating: 2,
    dailyQuizzes: [],
    needsReview: true,
    lastReviewed: "2025-11-25",
    questionsAnswered: 5,
    identifiedSkills: [
      { name: "Data Organization", description: "Understanding how data can be structured for efficient access", category: "technical", relevantCareers: ["Backend Developer", "Systems Engineer", "Database Developer"], proficiencyLevel: "developing" },
      { name: "Algorithmic Thinking", description: "Selecting appropriate data structures for different use cases", category: "cognitive", relevantCareers: ["Software Engineer", "Technical Interviewer", "CS Educator"], proficiencyLevel: "developing" },
    ],
  },
  {
    id: "demo-7",
    title: "Algorithm Analysis",
    date: "2025-11-28",
    content: "Big O notation, time complexity, space complexity, best/worst/average case analysis...",
    reviewScore: 80,
    xpEarned: 115,
    incorrectTopics: ["Amortized Analysis"],
    confidenceRating: 4,
    dailyQuizzes: [],
    needsReview: false,
    lastReviewed: "2025-11-28",
    questionsAnswered: 5,
    identifiedSkills: [
      { name: "Critical Analysis", description: "Evaluating trade-offs and making informed technical decisions", category: "cognitive", relevantCareers: ["Performance Engineer", "Tech Lead", "Senior Software Engineer"], proficiencyLevel: "intermediate" },
      { name: "Optimization", description: "Identifying bottlenecks and improving system performance", category: "technical", relevantCareers: ["Performance Engineer", "Backend Developer", "DevOps Engineer"], proficiencyLevel: "intermediate" },
    ],
  },
];

// Demo calendar settings
export const DEMO_CALENDAR_SETTINGS: CalendarSettings = {
  url: "https://demo.university.edu/calendar/demo.ics",
  lastSync: new Date().toISOString(),
  lastSyncStatus: "success",
};

// Helper to generate dates relative to today
function getDemoDate(daysFromNow: number, hour: number = 9, minute: number = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

// Demo calendar events - mix of lectures and exams
export const DEMO_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: "cal-demo-1",
    uid: "demo-lecture-1",
    title: "KF4005: Computer Networks - Lecture",
    eventType: "lecture",
    startsAt: getDemoDate(1, 9, 0),
    endsAt: getDemoDate(1, 11, 0),
    location: "Room 201, Computer Science Building",
    description: "Introduction to network protocols",
  },
  {
    id: "cal-demo-2",
    uid: "demo-lecture-2",
    title: "KF5008: Database Systems - Lecture",
    eventType: "lecture",
    startsAt: getDemoDate(2, 14, 0),
    endsAt: getDemoDate(2, 16, 0),
    location: "Room 105, Engineering Block",
    description: "SQL and relational databases",
  },
  {
    id: "cal-demo-3",
    uid: "demo-exam-1",
    title: "Quiz: Programming Fundamentals",
    eventType: "exam",
    startsAt: getDemoDate(3, 23, 59),
    endsAt: getDemoDate(3, 23, 59),
    description: "Online quiz due by midnight",
  },
  {
    id: "cal-demo-4",
    uid: "demo-tutorial-1",
    title: "KF4005: Networks Tutorial",
    eventType: "tutorial",
    startsAt: getDemoDate(3, 10, 0),
    endsAt: getDemoDate(3, 11, 0),
    location: "Lab 3, Computer Science Building",
  },
  {
    id: "cal-demo-5",
    uid: "demo-lecture-3",
    title: "KF5010: Software Engineering - Lecture",
    eventType: "lecture",
    startsAt: getDemoDate(4, 11, 0),
    endsAt: getDemoDate(4, 13, 0),
    location: "Room 302, Main Building",
    description: "Agile methodologies and project management",
  },
  {
    id: "cal-demo-6",
    uid: "demo-exam-2",
    title: "Test: Data Structures Midterm",
    eventType: "exam",
    startsAt: getDemoDate(5, 14, 0),
    endsAt: getDemoDate(5, 16, 0),
    location: "Examination Hall A",
    description: "Covers chapters 1-5",
  },
  {
    id: "cal-demo-7",
    uid: "demo-lecture-4",
    title: "KF4009: Operating Systems - Lecture",
    eventType: "lecture",
    startsAt: getDemoDate(6, 9, 0),
    endsAt: getDemoDate(6, 11, 0),
    location: "Room 201, Computer Science Building",
    description: "Process scheduling and memory management",
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
