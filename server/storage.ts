import { eq, lte, desc, and, sql, or, inArray, gte } from "drizzle-orm";
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
  lectureUploadsTable,
  dismissedLecturesTable,
  friendshipsTable,
  weeklyXpLogsTable,
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
  DismissedLecture,
  Friendship,
  DbUser,
  DbLecture,
  DbTopicReviewStats,
  DbCalendarSettings,
  DbCalendarEvent,
  DbDailyQuizPlan,
  DbCachedQuestion,
  DbLectureUpload,
  DbDismissedLecture,
  DbFriendship,
  DbWeeklyXpLog,
  User,
  UpsertUser,
} from "@shared/schema";

export interface LectureUpload {
  id: string;
  batchId: string;
  userId: string;
  filename: string | null;
  status: "pending" | "processing" | "completed" | "error";
  error: string | null;
  lectureId: string | null;
  createdAt: string;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  getUserProfile(userId: string): Promise<UserProfile>;
  updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile>;
  resetUserProfile(userId: string): Promise<UserProfile>;
  loadDemoData(userId: string): Promise<{ profile: UserProfile; lectures: Lecture[]; calendarSettings: CalendarSettings; calendarEvents: CalendarEvent[] }>;
  
  getLectures(userId: string): Promise<Lecture[]>;
  getLecture(userId: string, id: string): Promise<Lecture | undefined>;
  addLecture(userId: string, lecture: Omit<Lecture, "id">): Promise<Lecture>;
  updateLecture(userId: string, id: string, updates: Partial<Lecture>): Promise<Lecture | undefined>;
  deleteLecture(userId: string, id: string): Promise<boolean>;
  getLectureContent(userId: string, id: string): Promise<string | undefined>;
  
  getWeakTopics(userId: string): Promise<string[]>;
  
  getCalendarSettings(userId: string): Promise<CalendarSettings | null>;
  setCalendarSettings(userId: string, settings: CalendarSettings): Promise<CalendarSettings>;
  clearCalendarSettings(userId: string): Promise<void>;
  
  getCalendarEvents(userId: string): Promise<CalendarEvent[]>;
  setCalendarEvents(userId: string, events: CalendarEvent[]): Promise<CalendarEvent[]>;
  updateCalendarEventMatch(userId: string, eventId: string, lectureId: string | null): Promise<CalendarEvent | undefined>;
  
  getTopicReviewStats(userId: string): Promise<TopicReviewStats[]>;
  getTopicReviewStat(userId: string, topic: string): Promise<TopicReviewStats | undefined>;
  updateTopicReviewStats(userId: string, topic: string, lectureId: string, lectureTitle: string, score: number): Promise<TopicReviewStats>;
  initializeTopicsFromLecture(userId: string, lectureId: string, topics: string[]): Promise<void>;
  
  getDueTopics(userId: string, limit?: number): Promise<TopicReviewStats[]>;
  getCurrentDailyQuizPlan(userId: string): Promise<DailyQuizPlan | null>;
  setCurrentDailyQuizPlan(userId: string, plan: DailyQuizPlan): Promise<DailyQuizPlan>;
  completeDailyQuizPlan(userId: string, score: number): Promise<DailyQuizPlan | null>;
  
  addReviewEvent(userId: string, event: Omit<ReviewEvent, "id">): Promise<ReviewEvent>;
  getReviewHistory(userId: string, limit?: number): Promise<ReviewEvent[]>;
  
  getCachedQuestions(userId: string, topic: string, lectureId: string): Promise<Question[]>;
  cacheQuestions(userId: string, topic: string, lectureId: string, questions: Question[]): Promise<void>;
  
  createBatchUpload(userId: string, batchId: string, items: { filename: string | null }[]): Promise<LectureUpload[]>;
  updateBatchUploadStatus(userId: string, uploadId: string, status: "pending" | "processing" | "completed" | "error", lectureId?: string, error?: string): Promise<LectureUpload | undefined>;
  getBatchUploads(userId: string, batchId: string): Promise<LectureUpload[]>;
  
  getDismissedLectures(userId: string): Promise<DismissedLecture[]>;
  dismissLecture(userId: string, calendarEventId: string, reason?: string): Promise<void>;
  undismissLecture(userId: string, calendarEventId: string): Promise<void>;
  
  sendFriendRequest(userId: string, friendUsername: string): Promise<Friendship>;
  acceptFriendRequest(userId: string, requestId: string): Promise<void>;
  declineFriendRequest(userId: string, requestId: string): Promise<void>;
  removeFriend(userId: string, friendId: string): Promise<void>;
  getFriends(userId: string): Promise<{friend: User, status: string}[]>;
  getPendingRequests(userId: string): Promise<{from: User, request: Friendship}[]>;
  getLeaderboard(userId: string): Promise<{user: User, weeklyXp: number, rank: number}[]>;
  logXpEarned(userId: string, amount: number): Promise<void>;
  getUserByUsername(username: string): Promise<User | undefined>;
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

function dbLectureUploadToUpload(dbUpload: DbLectureUpload): LectureUpload {
  return {
    id: String(dbUpload.id),
    batchId: dbUpload.batchId,
    userId: dbUpload.userId,
    filename: dbUpload.filename,
    status: (dbUpload.status as LectureUpload["status"]) || "pending",
    error: dbUpload.error,
    lectureId: dbUpload.lectureId ? String(dbUpload.lectureId) : null,
    createdAt: dbUpload.createdAt?.toISOString() || new Date().toISOString(),
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

  async getUserProfile(userId: string): Promise<UserProfile> {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      const [newUser] = await db.insert(usersTable).values({
        id: userId,
        achievements: ALL_ACHIEVEMENTS.map(a => ({ ...a })),
        powerUps: { secondChance: 0, hints: 0, doubleXP: false },
        masteredTopics: [],
        needsPractice: [],
      }).returning();
      return dbUserToProfile(newUser);
    }
    return dbUserToProfile(user);
  }

  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      await this.getUserProfile(userId);
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
      .where(eq(usersTable.id, userId))
      .returning();
    
    return dbUserToProfile(updated);
  }

  async resetUserProfile(userId: string): Promise<UserProfile> {
    await db.delete(lecturesTable).where(eq(lecturesTable.userId, userId));
    await db.delete(topicReviewStatsTable).where(eq(topicReviewStatsTable.userId, userId));
    await db.delete(reviewEventsTable).where(eq(reviewEventsTable.userId, userId));
    await db.delete(dailyQuizPlansTable).where(eq(dailyQuizPlansTable.userId, userId));
    await db.delete(cachedQuestionsTable).where(eq(cachedQuestionsTable.userId, userId));
    await db.delete(calendarSettingsTable).where(eq(calendarSettingsTable.userId, userId));
    await db.delete(calendarEventsTable).where(eq(calendarEventsTable.userId, userId));
    
    await db.update(usersTable).set({
      level: 1,
      totalXP: 0,
      xpToNextLevel: 400,
      currentStreak: 0,
      longestStreak: 0,
      totalLectures: 0,
      averageConfidence: 0,
      achievements: ALL_ACHIEVEMENTS.map(a => ({ ...a })),
      masteredTopics: [],
      needsPractice: [],
      powerUps: { secondChance: 0, hints: 0, doubleXP: false },
      lastActivityDate: null,
    }).where(eq(usersTable.id, userId));
    
    return this.getUserProfile(userId);
  }

  async loadDemoData(userId: string): Promise<{ profile: UserProfile; lectures: Lecture[]; calendarSettings: CalendarSettings; calendarEvents: CalendarEvent[] }> {
    await this.resetUserProfile(userId);
    
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
    }).where(eq(usersTable.id, userId)).returning();
    
    const insertedLectures: Lecture[] = [];
    for (const lecture of DEMO_LECTURES) {
      const [dbLecture] = await db.insert(lecturesTable).values({
        userId,
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
    
    const [calSettings] = await db.insert(calendarSettingsTable).values({
      userId,
      url: DEMO_CALENDAR_SETTINGS.url,
      lastSync: DEMO_CALENDAR_SETTINGS.lastSync,
      lastSyncStatus: DEMO_CALENDAR_SETTINGS.lastSyncStatus,
    }).returning();
    
    const insertedEvents: CalendarEvent[] = [];
    for (const event of DEMO_CALENDAR_EVENTS) {
      const [dbEvent] = await db.insert(calendarEventsTable).values({
        userId,
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
        userId,
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

  async getLectures(userId: string): Promise<Lecture[]> {
    const dbLectures = await db.select().from(lecturesTable)
      .where(eq(lecturesTable.userId, userId))
      .orderBy(desc(lecturesTable.createdAt));
    return dbLectures.map(dbLectureToLecture);
  }

  async getLecture(userId: string, id: string): Promise<Lecture | undefined> {
    const [dbLecture] = await db.select().from(lecturesTable)
      .where(and(eq(lecturesTable.id, parseInt(id)), eq(lecturesTable.userId, userId)));
    return dbLecture ? dbLectureToLecture(dbLecture) : undefined;
  }

  async addLecture(userId: string, lectureData: Omit<Lecture, "id">): Promise<Lecture> {
    const [dbLecture] = await db.insert(lecturesTable).values({
      userId,
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
    
    const lectures = await db.select().from(lecturesTable).where(eq(lecturesTable.userId, userId));
    await this.updateUserProfile(userId, { totalLectures: lectures.length });
    
    return dbLectureToLecture(dbLecture);
  }

  async updateLecture(userId: string, id: string, updates: Partial<Lecture>): Promise<Lecture | undefined> {
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
      .where(and(eq(lecturesTable.id, parseInt(id)), eq(lecturesTable.userId, userId)))
      .returning();
    
    return updated ? dbLectureToLecture(updated) : undefined;
  }

  async deleteLecture(userId: string, id: string): Promise<boolean> {
    await db.delete(lecturesTable).where(and(eq(lecturesTable.id, parseInt(id)), eq(lecturesTable.userId, userId)));
    const lectures = await db.select().from(lecturesTable).where(eq(lecturesTable.userId, userId));
    await this.updateUserProfile(userId, { totalLectures: lectures.length });
    return true;
  }

  async getLectureContent(userId: string, id: string): Promise<string | undefined> {
    const [lecture] = await db.select({ content: lecturesTable.content })
      .from(lecturesTable)
      .where(and(eq(lecturesTable.id, parseInt(id)), eq(lecturesTable.userId, userId)));
    return lecture?.content;
  }

  async getWeakTopics(userId: string): Promise<string[]> {
    const stats = await db.select().from(topicReviewStatsTable)
      .where(and(eq(topicReviewStatsTable.userId, userId), lte(topicReviewStatsTable.lastScore, 70)))
      .orderBy(topicReviewStatsTable.lastScore)
      .limit(10);
    return stats.map(s => s.topic);
  }

  async getCalendarSettings(userId: string): Promise<CalendarSettings | null> {
    const [settings] = await db.select().from(calendarSettingsTable)
      .where(eq(calendarSettingsTable.userId, userId))
      .limit(1);
    return settings ? dbCalendarSettingsToSettings(settings) : null;
  }

  async setCalendarSettings(userId: string, settings: CalendarSettings): Promise<CalendarSettings> {
    await db.delete(calendarSettingsTable).where(eq(calendarSettingsTable.userId, userId));
    const [inserted] = await db.insert(calendarSettingsTable).values({
      userId,
      url: settings.url,
      lastSync: settings.lastSync,
      lastSyncStatus: settings.lastSyncStatus,
      lastSyncError: settings.lastSyncError,
    }).returning();
    return dbCalendarSettingsToSettings(inserted);
  }

  async clearCalendarSettings(userId: string): Promise<void> {
    await db.delete(calendarSettingsTable).where(eq(calendarSettingsTable.userId, userId));
    await db.delete(calendarEventsTable).where(eq(calendarEventsTable.userId, userId));
  }

  async getCalendarEvents(userId: string): Promise<CalendarEvent[]> {
    const events = await db.select().from(calendarEventsTable)
      .where(eq(calendarEventsTable.userId, userId));
    return events.map(dbCalendarEventToEvent);
  }

  async setCalendarEvents(userId: string, events: CalendarEvent[]): Promise<CalendarEvent[]> {
    await db.delete(calendarEventsTable).where(eq(calendarEventsTable.userId, userId));
    const insertedEvents: CalendarEvent[] = [];
    for (const event of events) {
      const [inserted] = await db.insert(calendarEventsTable).values({
        userId,
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

  async updateCalendarEventMatch(userId: string, eventId: string, lectureId: string | null): Promise<CalendarEvent | undefined> {
    const [updated] = await db.update(calendarEventsTable)
      .set({ matchedLectureId: lectureId ? parseInt(lectureId) : null })
      .where(and(eq(calendarEventsTable.id, parseInt(eventId)), eq(calendarEventsTable.userId, userId)))
      .returning();
    return updated ? dbCalendarEventToEvent(updated) : undefined;
  }

  async getTopicReviewStats(userId: string): Promise<TopicReviewStats[]> {
    const stats = await db.select().from(topicReviewStatsTable)
      .where(eq(topicReviewStatsTable.userId, userId));
    return stats.map(dbTopicStatsToTopicStats);
  }

  async getTopicReviewStat(userId: string, topic: string): Promise<TopicReviewStats | undefined> {
    const [stat] = await db.select().from(topicReviewStatsTable)
      .where(and(eq(topicReviewStatsTable.topic, topic), eq(topicReviewStatsTable.userId, userId)));
    return stat ? dbTopicStatsToTopicStats(stat) : undefined;
  }

  async updateTopicReviewStats(userId: string, topic: string, lectureId: string, lectureTitle: string, score: number): Promise<TopicReviewStats> {
    const existing = await this.getTopicReviewStat(userId, topic);
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
        .where(and(eq(topicReviewStatsTable.topic, topic), eq(topicReviewStatsTable.userId, userId)))
        .returning();
      
      return dbTopicStatsToTopicStats(updated);
    } else {
      const { easeFactor, interval, nextDue } = calculateNextReview(2.5, 1, score, 0);
      
      const [inserted] = await db.insert(topicReviewStatsTable).values({
        userId,
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

  async initializeTopicsFromLecture(userId: string, lectureId: string, topics: string[]): Promise<void> {
    const lecture = await this.getLecture(userId, lectureId);
    if (!lecture) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    for (const topic of topics) {
      const existing = await this.getTopicReviewStat(userId, topic);
      if (!existing) {
        await db.insert(topicReviewStatsTable).values({
          userId,
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

  async getDueTopics(userId: string, limit: number = 10): Promise<TopicReviewStats[]> {
    const allStats = await this.getTopicReviewStats(userId);
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

  async getCurrentDailyQuizPlan(userId: string): Promise<DailyQuizPlan | null> {
    const [plan] = await db.select().from(dailyQuizPlansTable)
      .where(and(eq(dailyQuizPlansTable.completed, false), eq(dailyQuizPlansTable.userId, userId)))
      .orderBy(desc(dailyQuizPlansTable.createdAt))
      .limit(1);
    return plan ? dbDailyQuizPlanToPlan(plan) : null;
  }

  async setCurrentDailyQuizPlan(userId: string, plan: DailyQuizPlan): Promise<DailyQuizPlan> {
    await db.delete(dailyQuizPlansTable).where(and(eq(dailyQuizPlansTable.completed, false), eq(dailyQuizPlansTable.userId, userId)));
    
    const [inserted] = await db.insert(dailyQuizPlansTable).values({
      userId,
      generatedAt: plan.generatedAt,
      topics: plan.topics,
      lectureExcerpts: plan.lectureExcerpts,
      completed: false,
    }).returning();
    
    return dbDailyQuizPlanToPlan(inserted);
  }

  async completeDailyQuizPlan(userId: string, score: number): Promise<DailyQuizPlan | null> {
    const currentPlan = await this.getCurrentDailyQuizPlan(userId);
    if (!currentPlan) return null;
    
    const [updated] = await db.update(dailyQuizPlansTable)
      .set({
        completed: true,
        completedAt: new Date().toISOString(),
        score,
      })
      .where(and(eq(dailyQuizPlansTable.id, parseInt(currentPlan.id)), eq(dailyQuizPlansTable.userId, userId)))
      .returning();
    
    return updated ? dbDailyQuizPlanToPlan(updated) : null;
  }

  async addReviewEvent(userId: string, eventData: Omit<ReviewEvent, "id">): Promise<ReviewEvent> {
    const [inserted] = await db.insert(reviewEventsTable).values({
      userId,
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

  async getReviewHistory(userId: string, limit: number = 50): Promise<ReviewEvent[]> {
    const events = await db.select().from(reviewEventsTable)
      .where(eq(reviewEventsTable.userId, userId))
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

  async getCachedQuestions(userId: string, topic: string, lectureId: string): Promise<Question[]> {
    const questions = await db.select().from(cachedQuestionsTable)
      .where(and(
        eq(cachedQuestionsTable.topic, topic),
        eq(cachedQuestionsTable.lectureId, parseInt(lectureId)),
        eq(cachedQuestionsTable.userId, userId)
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

  async cacheQuestions(userId: string, topic: string, lectureId: string, questions: Question[]): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    
    for (const q of questions) {
      await db.insert(cachedQuestionsTable).values({
        userId,
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

  async createBatchUpload(userId: string, batchId: string, items: { filename: string | null }[]): Promise<LectureUpload[]> {
    const uploads: LectureUpload[] = [];
    for (const item of items) {
      const [inserted] = await db.insert(lectureUploadsTable).values({
        userId,
        batchId,
        filename: item.filename,
        status: "pending",
      }).returning();
      uploads.push(dbLectureUploadToUpload(inserted));
    }
    return uploads;
  }

  async updateBatchUploadStatus(userId: string, uploadId: string, status: "pending" | "processing" | "completed" | "error", lectureId?: string, error?: string): Promise<LectureUpload | undefined> {
    const [updated] = await db.update(lectureUploadsTable)
      .set({
        status,
        lectureId: lectureId ? parseInt(lectureId) : null,
        error: error || null,
      })
      .where(and(eq(lectureUploadsTable.id, parseInt(uploadId)), eq(lectureUploadsTable.userId, userId)))
      .returning();
    return updated ? dbLectureUploadToUpload(updated) : undefined;
  }

  async getBatchUploads(userId: string, batchId: string): Promise<LectureUpload[]> {
    const uploads = await db.select().from(lectureUploadsTable)
      .where(and(eq(lectureUploadsTable.batchId, batchId), eq(lectureUploadsTable.userId, userId)));
    return uploads.map(dbLectureUploadToUpload);
  }

  async getDismissedLectures(userId: string): Promise<DismissedLecture[]> {
    const dismissed = await db.select().from(dismissedLecturesTable)
      .where(eq(dismissedLecturesTable.userId, userId));
    return dismissed.map(d => ({
      id: String(d.id),
      userId: d.userId,
      calendarEventId: d.calendarEventId,
      dismissedAt: d.dismissedAt?.toISOString() || new Date().toISOString(),
      reason: d.reason || undefined,
    }));
  }

  async dismissLecture(userId: string, calendarEventId: string, reason?: string): Promise<void> {
    await db.insert(dismissedLecturesTable).values({
      userId,
      calendarEventId,
      reason: reason || null,
    });
  }

  async undismissLecture(userId: string, calendarEventId: string): Promise<void> {
    await db.delete(dismissedLecturesTable)
      .where(and(
        eq(dismissedLecturesTable.userId, userId),
        eq(dismissedLecturesTable.calendarEventId, calendarEventId)
      ));
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const normalizedUsername = username.toLowerCase().trim();
    const users = await db.select().from(usersTable);
    const user = users.find(u => 
      (u.username && u.username.toLowerCase() === normalizedUsername) ||
      (u.email && u.email.toLowerCase() === normalizedUsername)
    );
    return user;
  }

  async sendFriendRequest(userId: string, friendUsername: string): Promise<Friendship> {
    const friendUser = await this.getUserByUsername(friendUsername);
    if (!friendUser) {
      throw new Error("User not found");
    }
    
    if (friendUser.id === userId) {
      throw new Error("Cannot send friend request to yourself");
    }
    
    const existingFriendship = await db.select().from(friendshipsTable)
      .where(or(
        and(
          eq(friendshipsTable.userId, userId),
          eq(friendshipsTable.friendId, friendUser.id)
        ),
        and(
          eq(friendshipsTable.userId, friendUser.id),
          eq(friendshipsTable.friendId, userId)
        )
      ));
    
    if (existingFriendship.length > 0) {
      const existing = existingFriendship[0];
      if (existing.status === "accepted") {
        throw new Error("Already friends with this user");
      }
      if (existing.status === "pending") {
        throw new Error("Friend request already pending");
      }
    }
    
    const [inserted] = await db.insert(friendshipsTable).values({
      userId,
      friendId: friendUser.id,
      status: "pending",
    }).returning();
    
    return {
      id: String(inserted.id),
      userId: inserted.userId,
      friendId: inserted.friendId,
      status: inserted.status as "pending" | "accepted" | "declined",
      createdAt: inserted.createdAt?.toISOString() || new Date().toISOString(),
      acceptedAt: inserted.acceptedAt?.toISOString(),
    };
  }

  async acceptFriendRequest(userId: string, requestId: string): Promise<void> {
    const [request] = await db.select().from(friendshipsTable)
      .where(and(
        eq(friendshipsTable.id, parseInt(requestId)),
        eq(friendshipsTable.friendId, userId),
        eq(friendshipsTable.status, "pending")
      ));
    
    if (!request) {
      throw new Error("Friend request not found");
    }
    
    await db.update(friendshipsTable)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
      })
      .where(eq(friendshipsTable.id, parseInt(requestId)));
  }

  async declineFriendRequest(userId: string, requestId: string): Promise<void> {
    const [request] = await db.select().from(friendshipsTable)
      .where(and(
        eq(friendshipsTable.id, parseInt(requestId)),
        eq(friendshipsTable.friendId, userId),
        eq(friendshipsTable.status, "pending")
      ));
    
    if (!request) {
      throw new Error("Friend request not found");
    }
    
    await db.update(friendshipsTable)
      .set({
        status: "declined",
      })
      .where(eq(friendshipsTable.id, parseInt(requestId)));
  }

  async removeFriend(userId: string, friendId: string): Promise<void> {
    await db.delete(friendshipsTable)
      .where(or(
        and(
          eq(friendshipsTable.userId, userId),
          eq(friendshipsTable.friendId, friendId),
          eq(friendshipsTable.status, "accepted")
        ),
        and(
          eq(friendshipsTable.userId, friendId),
          eq(friendshipsTable.friendId, userId),
          eq(friendshipsTable.status, "accepted")
        )
      ));
  }

  async getFriends(userId: string): Promise<{friend: User, status: string}[]> {
    const friendships = await db.select().from(friendshipsTable)
      .where(or(
        and(eq(friendshipsTable.userId, userId), eq(friendshipsTable.status, "accepted")),
        and(eq(friendshipsTable.friendId, userId), eq(friendshipsTable.status, "accepted"))
      ));
    
    const friends: {friend: User, status: string}[] = [];
    
    for (const f of friendships) {
      const friendUserId = f.userId === userId ? f.friendId : f.userId;
      const [friendUser] = await db.select().from(usersTable)
        .where(eq(usersTable.id, friendUserId));
      
      if (friendUser) {
        friends.push({
          friend: friendUser,
          status: f.status || "accepted",
        });
      }
    }
    
    return friends;
  }

  async getPendingRequests(userId: string): Promise<{from: User, request: Friendship}[]> {
    const requests = await db.select().from(friendshipsTable)
      .where(and(
        eq(friendshipsTable.friendId, userId),
        eq(friendshipsTable.status, "pending")
      ));
    
    const pendingRequests: {from: User, request: Friendship}[] = [];
    
    for (const r of requests) {
      const [fromUser] = await db.select().from(usersTable)
        .where(eq(usersTable.id, r.userId));
      
      if (fromUser) {
        pendingRequests.push({
          from: fromUser,
          request: {
            id: String(r.id),
            userId: r.userId,
            friendId: r.friendId,
            status: r.status as "pending" | "accepted" | "declined",
            createdAt: r.createdAt?.toISOString() || new Date().toISOString(),
            acceptedAt: r.acceptedAt?.toISOString(),
          },
        });
      }
    }
    
    return pendingRequests;
  }

  private getWeekStart(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  async getLeaderboard(userId: string): Promise<{user: User, weeklyXp: number, rank: number}[]> {
    const weekStart = this.getWeekStart();
    
    const friends = await this.getFriends(userId);
    const friendIds = friends.map(f => f.friend.id);
    
    const allUserIds = [userId, ...friendIds];
    
    const weeklyXpData = await db.select().from(weeklyXpLogsTable)
      .where(and(
        inArray(weeklyXpLogsTable.userId, allUserIds),
        gte(weeklyXpLogsTable.weekStart, weekStart)
      ));
    
    const xpMap = new Map<string, number>();
    for (const log of weeklyXpData) {
      xpMap.set(log.userId, (xpMap.get(log.userId) || 0) + (log.xpEarned || 0));
    }
    
    const allUsers = await db.select().from(usersTable)
      .where(inArray(usersTable.id, allUserIds));
    
    const leaderboard = allUsers.map(user => ({
      user,
      weeklyXp: xpMap.get(user.id) || 0,
      rank: 0,
    }));
    
    leaderboard.sort((a, b) => b.weeklyXp - a.weeklyXp);
    
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    return leaderboard;
  }

  async logXpEarned(userId: string, amount: number): Promise<void> {
    if (amount <= 0) return;
    
    const weekStart = this.getWeekStart();
    
    const [existing] = await db.select().from(weeklyXpLogsTable)
      .where(and(
        eq(weeklyXpLogsTable.userId, userId),
        eq(weeklyXpLogsTable.weekStart, weekStart)
      ));
    
    if (existing) {
      await db.update(weeklyXpLogsTable)
        .set({
          xpEarned: (existing.xpEarned || 0) + amount,
          updatedAt: new Date(),
        })
        .where(eq(weeklyXpLogsTable.id, existing.id));
    } else {
      await db.insert(weeklyXpLogsTable).values({
        userId,
        weekStart,
        xpEarned: amount,
      });
    }
  }
}

export const storage = new DatabaseStorage();
