import { eq, lte, desc, and, sql } from "drizzle-orm";
import { db } from "./db";
import {
  usersTable,
  lecturesTable,
  topicReviewStatsTable,
  reviewEventsTable,
  dailyQuizPlansTable,
  cachedQuestionsTable,
  calendarSettingsTable,
  calendarEventsTable,
  calculateNextReview,
  calculateTopicPriority,
  ALL_ACHIEVEMENTS,
  INITIAL_USER_PROFILE,
  DEMO_USER_PROFILE,
  DEMO_LECTURES,
  DEMO_CALENDAR_SETTINGS,
  DEMO_CALENDAR_EVENTS,
} from "@shared/schema";
import type {
  UserProfile,
  Lecture,
  Achievement,
  CalendarSettings,
  CalendarEvent,
  TopicReviewStats,
  ReviewEvent,
  DailyQuizPlan,
  Question,
  DbUser,
  DbLecture,
  DbTopicReviewStats,
  DbCalendarSettings,
  DbCalendarEvent,
  DbDailyQuizPlan,
  DbCachedQuestion,
  User,
  UpsertUser,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getUserProfile(): Promise<UserProfile>;
  updateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile>;
  resetUserProfile(): Promise<UserProfile>;
  loadDemoData(): Promise<{ profile: UserProfile; lectures: Lecture[]; calendarSettings: CalendarSettings; calendarEvents: CalendarEvent[] }>;
  
  getLectures(): Promise<Lecture[]>;
  getLecture(id: string): Promise<Lecture | undefined>;
  addLecture(lecture: Omit<Lecture, "id">): Promise<Lecture>;
  updateLecture(id: string, updates: Partial<Lecture>): Promise<Lecture | undefined>;
  deleteLecture(id: string): Promise<boolean>;
  getLectureContent(id: string): Promise<string | undefined>;
  
  getWeakTopics(): Promise<string[]>;
  
  getCalendarSettings(): Promise<CalendarSettings | null>;
  setCalendarSettings(settings: CalendarSettings): Promise<CalendarSettings>;
  clearCalendarSettings(): Promise<void>;
  
  getCalendarEvents(): Promise<CalendarEvent[]>;
  setCalendarEvents(events: CalendarEvent[]): Promise<CalendarEvent[]>;
  updateCalendarEventMatch(eventId: string, lectureId: string | null): Promise<CalendarEvent | undefined>;
  
  getTopicReviewStats(): Promise<TopicReviewStats[]>;
  getTopicReviewStat(topic: string): Promise<TopicReviewStats | undefined>;
  updateTopicReviewStats(topic: string, lectureId: string, lectureTitle: string, score: number): Promise<TopicReviewStats>;
  initializeTopicsFromLecture(lectureId: string, topics: string[]): Promise<void>;
  
  getDueTopics(limit?: number): Promise<TopicReviewStats[]>;
  getCurrentDailyQuizPlan(): Promise<DailyQuizPlan | null>;
  setCurrentDailyQuizPlan(plan: DailyQuizPlan): Promise<DailyQuizPlan>;
  completeDailyQuizPlan(score: number): Promise<DailyQuizPlan | null>;
  
  addReviewEvent(event: Omit<ReviewEvent, "id">): Promise<ReviewEvent>;
  getReviewHistory(limit?: number): Promise<ReviewEvent[]>;
  
  getCachedQuestions(topic: string, lectureId: string): Promise<Question[]>;
  cacheQuestions(topic: string, lectureId: string, questions: Question[]): Promise<void>;
}

function dbUserToProfile(user: DbUser): UserProfile {
  return {
    level: user.level,
    totalXP: user.totalXP,
    xpToNextLevel: user.xpToNextLevel,
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    totalLectures: user.totalLectures,
    averageConfidence: user.averageConfidence,
    achievements: (user.achievements as Achievement[]) || ALL_ACHIEVEMENTS.map(a => ({ ...a })),
    masteredTopics: (user.masteredTopics as string[]) || [],
    needsPractice: (user.needsPractice as string[]) || [],
    powerUps: (user.powerUps as UserProfile["powerUps"]) || { secondChance: 0, hints: 0, doubleXP: false },
    lastActivityDate: user.lastActivityDate || undefined,
  };
}

function dbLectureToLecture(dbLecture: DbLecture): Lecture {
  return {
    id: String(dbLecture.id),
    title: dbLecture.title,
    date: dbLecture.date,
    content: dbLecture.content,
    reviewScore: dbLecture.reviewScore,
    xpEarned: dbLecture.xpEarned,
    incorrectTopics: (dbLecture.incorrectTopics as string[]) || [],
    confidenceRating: dbLecture.confidenceRating,
    dailyQuizzes: (dbLecture.dailyQuizzes as Lecture["dailyQuizzes"]) || [],
    needsReview: dbLecture.needsReview,
    lastReviewed: dbLecture.lastReviewed || undefined,
    identifiedSkills: (dbLecture.identifiedSkills as Lecture["identifiedSkills"]) || [],
    questionsAnswered: dbLecture.questionsAnswered,
  };
}

function dbTopicStatsToTopicStats(dbStats: DbTopicReviewStats): TopicReviewStats {
  return {
    topic: dbStats.topic,
    lectureId: String(dbStats.lectureId),
    lectureTitle: dbStats.lectureTitle,
    lastReviewed: dbStats.lastReviewed,
    lastScore: dbStats.lastScore,
    reviewCount: dbStats.reviewCount,
    easeFactor: dbStats.easeFactor,
    interval: dbStats.interval,
    nextDue: dbStats.nextDue,
    streak: dbStats.streak,
  };
}

function dbCalendarSettingsToSettings(dbSettings: DbCalendarSettings): CalendarSettings {
  return {
    url: dbSettings.url,
    lastSync: dbSettings.lastSync || undefined,
    lastSyncStatus: (dbSettings.lastSyncStatus as "success" | "error") || undefined,
    lastSyncError: dbSettings.lastSyncError || undefined,
  };
}

function dbCalendarEventToEvent(dbEvent: DbCalendarEvent): CalendarEvent {
  return {
    id: String(dbEvent.id),
    uid: dbEvent.uid,
    title: dbEvent.title,
    eventType: dbEvent.eventType as CalendarEvent["eventType"],
    startsAt: dbEvent.startsAt,
    endsAt: dbEvent.endsAt,
    location: dbEvent.location || undefined,
    description: dbEvent.description || undefined,
    matchedLectureId: dbEvent.matchedLectureId ? String(dbEvent.matchedLectureId) : undefined,
  };
}

function dbDailyQuizPlanToPlan(dbPlan: DbDailyQuizPlan): DailyQuizPlan {
  return {
    id: String(dbPlan.id),
    generatedAt: dbPlan.generatedAt,
    topics: (dbPlan.topics as DailyQuizPlan["topics"]) || [],
    lectureExcerpts: (dbPlan.lectureExcerpts as DailyQuizPlan["lectureExcerpts"]) || [],
    completed: dbPlan.completed,
    completedAt: dbPlan.completedAt || undefined,
    score: dbPlan.score || undefined,
  };
}

export class DatabaseStorage implements IStorage {
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(usersTable)
      .values(userData)
      .onConflictDoUpdate({
        target: usersTable.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserProfile(): Promise<UserProfile> {
    const users = await db.select().from(usersTable).limit(1);
    if (users.length === 0) {
      const [newUser] = await db.insert(usersTable).values({
        achievements: ALL_ACHIEVEMENTS.map(a => ({ ...a })),
        powerUps: { secondChance: 0, hints: 0, doubleXP: false },
        masteredTopics: [],
        needsPractice: [],
      }).returning();
      return dbUserToProfile(newUser);
    }
    return dbUserToProfile(users[0]);
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    const users = await db.select().from(usersTable).limit(1);
    if (users.length === 0) {
      await this.getUserProfile();
    }
    
    const dbUpdates: Partial<DbUser> = {};
    if (updates.level !== undefined) dbUpdates.level = updates.level;
    if (updates.totalXP !== undefined) dbUpdates.totalXP = updates.totalXP;
    if (updates.xpToNextLevel !== undefined) dbUpdates.xpToNextLevel = updates.xpToNextLevel;
    if (updates.currentStreak !== undefined) dbUpdates.currentStreak = updates.currentStreak;
    if (updates.longestStreak !== undefined) dbUpdates.longestStreak = updates.longestStreak;
    if (updates.totalLectures !== undefined) dbUpdates.totalLectures = updates.totalLectures;
    if (updates.averageConfidence !== undefined) dbUpdates.averageConfidence = updates.averageConfidence;
    if (updates.achievements !== undefined) dbUpdates.achievements = updates.achievements;
    if (updates.masteredTopics !== undefined) dbUpdates.masteredTopics = updates.masteredTopics;
    if (updates.needsPractice !== undefined) dbUpdates.needsPractice = updates.needsPractice;
    if (updates.powerUps !== undefined) dbUpdates.powerUps = updates.powerUps;
    if (updates.lastActivityDate !== undefined) dbUpdates.lastActivityDate = updates.lastActivityDate;
    
    const [updated] = await db.update(usersTable)
      .set(dbUpdates)
      .returning();
    
    return dbUserToProfile(updated);
  }

  async resetUserProfile(): Promise<UserProfile> {
    await db.delete(usersTable);
    await db.delete(lecturesTable);
    await db.delete(topicReviewStatsTable);
    await db.delete(reviewEventsTable);
    await db.delete(dailyQuizPlansTable);
    await db.delete(cachedQuestionsTable);
    return this.getUserProfile();
  }

  async loadDemoData(): Promise<{ profile: UserProfile; lectures: Lecture[]; calendarSettings: CalendarSettings; calendarEvents: CalendarEvent[] }> {
    await this.resetUserProfile();
    
    const [user] = await db.update(usersTable).set({
      level: DEMO_USER_PROFILE.level,
      totalXP: DEMO_USER_PROFILE.totalXP,
      xpToNextLevel: DEMO_USER_PROFILE.xpToNextLevel,
      currentStreak: DEMO_USER_PROFILE.currentStreak,
      longestStreak: DEMO_USER_PROFILE.longestStreak,
      totalLectures: DEMO_USER_PROFILE.totalLectures,
      averageConfidence: DEMO_USER_PROFILE.averageConfidence,
      achievements: DEMO_USER_PROFILE.achievements,
      masteredTopics: DEMO_USER_PROFILE.masteredTopics,
      needsPractice: DEMO_USER_PROFILE.needsPractice,
      powerUps: DEMO_USER_PROFILE.powerUps,
      lastActivityDate: DEMO_USER_PROFILE.lastActivityDate,
    }).returning();
    
    const insertedLectures: Lecture[] = [];
    for (const lecture of DEMO_LECTURES) {
      const [dbLecture] = await db.insert(lecturesTable).values({
        title: lecture.title,
        date: lecture.date,
        content: lecture.content,
        reviewScore: lecture.reviewScore,
        xpEarned: lecture.xpEarned,
        incorrectTopics: lecture.incorrectTopics,
        confidenceRating: lecture.confidenceRating,
        dailyQuizzes: lecture.dailyQuizzes,
        needsReview: lecture.needsReview,
        lastReviewed: lecture.lastReviewed,
        identifiedSkills: lecture.identifiedSkills,
        questionsAnswered: lecture.questionsAnswered,
      }).returning();
      insertedLectures.push(dbLectureToLecture(dbLecture));
    }
    
    await db.delete(calendarSettingsTable);
    const [calSettings] = await db.insert(calendarSettingsTable).values({
      url: DEMO_CALENDAR_SETTINGS.url,
      lastSync: DEMO_CALENDAR_SETTINGS.lastSync,
      lastSyncStatus: DEMO_CALENDAR_SETTINGS.lastSyncStatus,
    }).returning();
    
    await db.delete(calendarEventsTable);
    const insertedEvents: CalendarEvent[] = [];
    for (const event of DEMO_CALENDAR_EVENTS) {
      const [dbEvent] = await db.insert(calendarEventsTable).values({
        uid: event.uid,
        title: event.title,
        eventType: event.eventType,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        location: event.location,
        description: event.description,
      }).returning();
      insertedEvents.push(dbCalendarEventToEvent(dbEvent));
    }
    
    const today = new Date();
    const demoTopics = [
      { topic: "Recursive Function Call Stack", lectureId: 3, lectureTitle: "Functions & Modular Design", lastScore: 65, daysAgo: 5, dueDaysAgo: 2 },
      { topic: "Binary Tree Traversal Algorithms", lectureId: 6, lectureTitle: "Data Structures Fundamentals", lastScore: 58, daysAgo: 4, dueDaysAgo: 3 },
      { topic: "Method Overriding & Dynamic Dispatch", lectureId: 5, lectureTitle: "Object-Oriented Programming", lastScore: 72, daysAgo: 7, dueDaysAgo: 0 },
      { topic: "Loop Complexity & Big-O Analysis", lectureId: 2, lectureTitle: "Control Flow & Loops", lastScore: 85, daysAgo: 10, dueDaysAgo: 3 },
      { topic: "Abstract Classes vs Interfaces", lectureId: 5, lectureTitle: "Object-Oriented Programming", lastScore: 60, daysAgo: 6, dueDaysAgo: 5 },
    ];
    
    for (const t of demoTopics) {
      await db.insert(topicReviewStatsTable).values({
        topic: t.topic,
        lectureId: t.lectureId,
        lectureTitle: t.lectureTitle,
        lastReviewed: new Date(today.getTime() - t.daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lastScore: t.lastScore,
        reviewCount: 2,
        easeFactor: 2.3,
        interval: 3,
        nextDue: new Date(today.getTime() - t.dueDaysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        streak: t.lastScore >= 70 ? 1 : 0,
      });
    }
    
    return {
      profile: dbUserToProfile(user),
      lectures: insertedLectures,
      calendarSettings: dbCalendarSettingsToSettings(calSettings),
      calendarEvents: insertedEvents,
    };
  }

  async getLectures(): Promise<Lecture[]> {
    const dbLectures = await db.select().from(lecturesTable).orderBy(desc(lecturesTable.createdAt));
    return dbLectures.map(dbLectureToLecture);
  }

  async getLecture(id: string): Promise<Lecture | undefined> {
    const [dbLecture] = await db.select().from(lecturesTable).where(eq(lecturesTable.id, parseInt(id)));
    return dbLecture ? dbLectureToLecture(dbLecture) : undefined;
  }

  async addLecture(lectureData: Omit<Lecture, "id">): Promise<Lecture> {
    const [dbLecture] = await db.insert(lecturesTable).values({
      title: lectureData.title,
      date: lectureData.date,
      content: lectureData.content,
      reviewScore: lectureData.reviewScore,
      xpEarned: lectureData.xpEarned,
      incorrectTopics: lectureData.incorrectTopics,
      confidenceRating: lectureData.confidenceRating,
      dailyQuizzes: lectureData.dailyQuizzes,
      needsReview: lectureData.needsReview,
      lastReviewed: lectureData.lastReviewed,
      identifiedSkills: lectureData.identifiedSkills,
      questionsAnswered: lectureData.questionsAnswered,
    }).returning();
    
    const lectures = await db.select().from(lecturesTable);
    await this.updateUserProfile({ totalLectures: lectures.length });
    
    return dbLectureToLecture(dbLecture);
  }

  async updateLecture(id: string, updates: Partial<Lecture>): Promise<Lecture | undefined> {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.date !== undefined) dbUpdates.date = updates.date;
    if (updates.content !== undefined) dbUpdates.content = updates.content;
    if (updates.reviewScore !== undefined) dbUpdates.reviewScore = updates.reviewScore;
    if (updates.xpEarned !== undefined) dbUpdates.xpEarned = updates.xpEarned;
    if (updates.incorrectTopics !== undefined) dbUpdates.incorrectTopics = updates.incorrectTopics;
    if (updates.confidenceRating !== undefined) dbUpdates.confidenceRating = updates.confidenceRating;
    if (updates.dailyQuizzes !== undefined) dbUpdates.dailyQuizzes = updates.dailyQuizzes;
    if (updates.needsReview !== undefined) dbUpdates.needsReview = updates.needsReview;
    if (updates.lastReviewed !== undefined) dbUpdates.lastReviewed = updates.lastReviewed;
    if (updates.identifiedSkills !== undefined) dbUpdates.identifiedSkills = updates.identifiedSkills;
    if (updates.questionsAnswered !== undefined) dbUpdates.questionsAnswered = updates.questionsAnswered;
    
    const [updated] = await db.update(lecturesTable)
      .set(dbUpdates)
      .where(eq(lecturesTable.id, parseInt(id)))
      .returning();
    
    return updated ? dbLectureToLecture(updated) : undefined;
  }

  async deleteLecture(id: string): Promise<boolean> {
    const result = await db.delete(lecturesTable).where(eq(lecturesTable.id, parseInt(id)));
    const lectures = await db.select().from(lecturesTable);
    await this.updateUserProfile({ totalLectures: lectures.length });
    return true;
  }

  async getLectureContent(id: string): Promise<string | undefined> {
    const [lecture] = await db.select({ content: lecturesTable.content })
      .from(lecturesTable)
      .where(eq(lecturesTable.id, parseInt(id)));
    return lecture?.content;
  }

  async getWeakTopics(): Promise<string[]> {
    const stats = await db.select().from(topicReviewStatsTable)
      .where(lte(topicReviewStatsTable.lastScore, 70))
      .orderBy(topicReviewStatsTable.lastScore)
      .limit(10);
    return stats.map(s => s.topic);
  }

  async getCalendarSettings(): Promise<CalendarSettings | null> {
    const [settings] = await db.select().from(calendarSettingsTable).limit(1);
    return settings ? dbCalendarSettingsToSettings(settings) : null;
  }

  async setCalendarSettings(settings: CalendarSettings): Promise<CalendarSettings> {
    await db.delete(calendarSettingsTable);
    const [inserted] = await db.insert(calendarSettingsTable).values({
      url: settings.url,
      lastSync: settings.lastSync,
      lastSyncStatus: settings.lastSyncStatus,
      lastSyncError: settings.lastSyncError,
    }).returning();
    return dbCalendarSettingsToSettings(inserted);
  }

  async clearCalendarSettings(): Promise<void> {
    await db.delete(calendarSettingsTable);
    await db.delete(calendarEventsTable);
  }

  async getCalendarEvents(): Promise<CalendarEvent[]> {
    const events = await db.select().from(calendarEventsTable);
    return events.map(dbCalendarEventToEvent);
  }

  async setCalendarEvents(events: CalendarEvent[]): Promise<CalendarEvent[]> {
    await db.delete(calendarEventsTable);
    const insertedEvents: CalendarEvent[] = [];
    for (const event of events) {
      const [inserted] = await db.insert(calendarEventsTable).values({
        uid: event.uid,
        title: event.title,
        eventType: event.eventType,
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        location: event.location,
        description: event.description,
        matchedLectureId: event.matchedLectureId ? parseInt(event.matchedLectureId) : null,
      }).returning();
      insertedEvents.push(dbCalendarEventToEvent(inserted));
    }
    return insertedEvents;
  }

  async updateCalendarEventMatch(eventId: string, lectureId: string | null): Promise<CalendarEvent | undefined> {
    const [updated] = await db.update(calendarEventsTable)
      .set({ matchedLectureId: lectureId ? parseInt(lectureId) : null })
      .where(eq(calendarEventsTable.id, parseInt(eventId)))
      .returning();
    return updated ? dbCalendarEventToEvent(updated) : undefined;
  }

  async getTopicReviewStats(): Promise<TopicReviewStats[]> {
    const stats = await db.select().from(topicReviewStatsTable);
    return stats.map(dbTopicStatsToTopicStats);
  }

  async getTopicReviewStat(topic: string): Promise<TopicReviewStats | undefined> {
    const [stat] = await db.select().from(topicReviewStatsTable)
      .where(eq(topicReviewStatsTable.topic, topic));
    return stat ? dbTopicStatsToTopicStats(stat) : undefined;
  }

  async updateTopicReviewStats(topic: string, lectureId: string, lectureTitle: string, score: number): Promise<TopicReviewStats> {
    const existing = await this.getTopicReviewStat(topic);
    const today = new Date().toISOString().split('T')[0];
    
    if (existing) {
      const wasSuccessful = score >= 70;
      const newStreak = wasSuccessful ? existing.streak + 1 : 0;
      
      const { easeFactor, interval, nextDue } = calculateNextReview(
        existing.easeFactor,
        existing.interval,
        score,
        newStreak
      );
      
      const [updated] = await db.update(topicReviewStatsTable)
        .set({
          lastReviewed: today,
          lastScore: score,
          reviewCount: existing.reviewCount + 1,
          easeFactor,
          interval,
          nextDue,
          streak: newStreak,
        })
        .where(eq(topicReviewStatsTable.topic, topic))
        .returning();
      
      return dbTopicStatsToTopicStats(updated);
    } else {
      const { easeFactor, interval, nextDue } = calculateNextReview(2.5, 1, score, 0);
      
      const [inserted] = await db.insert(topicReviewStatsTable).values({
        topic,
        lectureId: parseInt(lectureId),
        lectureTitle,
        lastReviewed: today,
        lastScore: score,
        reviewCount: 1,
        easeFactor,
        interval,
        nextDue,
        streak: score >= 70 ? 1 : 0,
      }).returning();
      
      return dbTopicStatsToTopicStats(inserted);
    }
  }

  async initializeTopicsFromLecture(lectureId: string, topics: string[]): Promise<void> {
    const lecture = await this.getLecture(lectureId);
    if (!lecture) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    for (const topic of topics) {
      const existing = await this.getTopicReviewStat(topic);
      if (!existing) {
        await db.insert(topicReviewStatsTable).values({
          topic,
          lectureId: parseInt(lectureId),
          lectureTitle: lecture.title,
          lastReviewed: today,
          lastScore: lecture.reviewScore,
          reviewCount: 1,
          easeFactor: 2.5,
          interval: 1,
          nextDue: today,
          streak: lecture.reviewScore >= 70 ? 1 : 0,
        });
      }
    }
  }

  async getDueTopics(limit: number = 10): Promise<TopicReviewStats[]> {
    const allStats = await this.getTopicReviewStats();
    const today = new Date();
    
    const scoredTopics = allStats
      .map(stats => ({
        stats,
        priority: calculateTopicPriority(stats),
        isDue: new Date(stats.nextDue) <= today,
      }))
      .filter(t => t.isDue || t.priority > 50)
      .sort((a, b) => b.priority - a.priority);
    
    return scoredTopics.slice(0, limit).map(t => t.stats);
  }

  async getCurrentDailyQuizPlan(): Promise<DailyQuizPlan | null> {
    const [plan] = await db.select().from(dailyQuizPlansTable)
      .where(eq(dailyQuizPlansTable.completed, false))
      .orderBy(desc(dailyQuizPlansTable.createdAt))
      .limit(1);
    return plan ? dbDailyQuizPlanToPlan(plan) : null;
  }

  async setCurrentDailyQuizPlan(plan: DailyQuizPlan): Promise<DailyQuizPlan> {
    await db.delete(dailyQuizPlansTable).where(eq(dailyQuizPlansTable.completed, false));
    
    const [inserted] = await db.insert(dailyQuizPlansTable).values({
      generatedAt: plan.generatedAt,
      topics: plan.topics,
      lectureExcerpts: plan.lectureExcerpts,
      completed: false,
    }).returning();
    
    return dbDailyQuizPlanToPlan(inserted);
  }

  async completeDailyQuizPlan(score: number): Promise<DailyQuizPlan | null> {
    const currentPlan = await this.getCurrentDailyQuizPlan();
    if (!currentPlan) return null;
    
    const [updated] = await db.update(dailyQuizPlansTable)
      .set({
        completed: true,
        completedAt: new Date().toISOString(),
        score,
      })
      .where(eq(dailyQuizPlansTable.id, parseInt(currentPlan.id)))
      .returning();
    
    return updated ? dbDailyQuizPlanToPlan(updated) : null;
  }

  async addReviewEvent(eventData: Omit<ReviewEvent, "id">): Promise<ReviewEvent> {
    const [inserted] = await db.insert(reviewEventsTable).values({
      topicId: eventData.topicId,
      topic: eventData.topic,
      lectureId: parseInt(eventData.lectureId),
      date: eventData.date,
      score: eventData.score,
      responseTime: eventData.responseTime,
      wasCorrect: eventData.wasCorrect,
    }).returning();
    
    return {
      id: String(inserted.id),
      topicId: inserted.topicId,
      topic: inserted.topic,
      lectureId: String(inserted.lectureId),
      date: inserted.date,
      score: inserted.score,
      responseTime: inserted.responseTime || undefined,
      wasCorrect: inserted.wasCorrect,
    };
  }

  async getReviewHistory(limit: number = 50): Promise<ReviewEvent[]> {
    const events = await db.select().from(reviewEventsTable)
      .orderBy(desc(reviewEventsTable.createdAt))
      .limit(limit);
    
    return events.map(e => ({
      id: String(e.id),
      topicId: e.topicId,
      topic: e.topic,
      lectureId: String(e.lectureId),
      date: e.date,
      score: e.score,
      responseTime: e.responseTime || undefined,
      wasCorrect: e.wasCorrect,
    }));
  }

  async getCachedQuestions(topic: string, lectureId: string): Promise<Question[]> {
    const questions = await db.select().from(cachedQuestionsTable)
      .where(and(
        eq(cachedQuestionsTable.topic, topic),
        eq(cachedQuestionsTable.lectureId, parseInt(lectureId))
      ))
      .orderBy(cachedQuestionsTable.timesUsed)
      .limit(5);
    
    return questions.map(q => ({
      question: q.question,
      options: q.options as string[],
      correct: q.correct,
      explanation: q.explanation,
      topic: q.topic,
    }));
  }

  async cacheQuestions(topic: string, lectureId: string, questions: Question[]): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    for (const q of questions) {
      await db.insert(cachedQuestionsTable).values({
        topic,
        lectureId: parseInt(lectureId),
        question: q.question,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
        lastUsed: today,
      });
    }
  }
}

export const storage = new DatabaseStorage();
