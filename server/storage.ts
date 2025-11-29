import { randomUUID } from "crypto";
import type { UserProfile, Lecture, Achievement, CalendarSettings, CalendarEvent, TopicReviewStats, ReviewEvent, DailyQuizPlan } from "@shared/schema";
import { INITIAL_USER_PROFILE, ALL_ACHIEVEMENTS, DEMO_USER_PROFILE, DEMO_LECTURES, DEMO_CALENDAR_SETTINGS, DEMO_CALENDAR_EVENTS, calculateNextReview, calculateTopicPriority } from "@shared/schema";

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export interface IStorage {
  getUserProfile(): UserProfile;
  updateUserProfile(profile: Partial<UserProfile>): UserProfile;
  resetUserProfile(): UserProfile;
  loadDemoData(): { profile: UserProfile; lectures: Lecture[]; calendarSettings: CalendarSettings; calendarEvents: CalendarEvent[] };
  
  getLectures(): Lecture[];
  getLecture(id: string): Lecture | undefined;
  addLecture(lecture: Omit<Lecture, "id">): Lecture;
  updateLecture(id: string, updates: Partial<Lecture>): Lecture | undefined;
  deleteLecture(id: string): boolean;
  
  getWeakTopics(): string[];
  
  getCalendarSettings(): CalendarSettings | null;
  setCalendarSettings(settings: CalendarSettings): CalendarSettings;
  clearCalendarSettings(): void;
  
  getCalendarEvents(): CalendarEvent[];
  setCalendarEvents(events: CalendarEvent[]): CalendarEvent[];
  updateCalendarEventMatch(eventId: string, lectureId: string | null): CalendarEvent | undefined;
  
  // Topic review and spaced repetition
  getTopicReviewStats(): TopicReviewStats[];
  getTopicReviewStat(topic: string): TopicReviewStats | undefined;
  updateTopicReviewStats(topic: string, lectureId: string, lectureTitle: string, score: number): TopicReviewStats;
  initializeTopicsFromLecture(lectureId: string, topics: string[]): void;
  
  // Daily quiz planning
  getDueTopics(limit?: number): TopicReviewStats[];
  getCurrentDailyQuizPlan(): DailyQuizPlan | null;
  setCurrentDailyQuizPlan(plan: DailyQuizPlan): DailyQuizPlan;
  completeDailyQuizPlan(score: number): DailyQuizPlan | null;
  
  // Review history
  addReviewEvent(event: Omit<ReviewEvent, "id">): ReviewEvent;
  getReviewHistory(limit?: number): ReviewEvent[];
}

export class MemStorage implements IStorage {
  private userProfile: UserProfile;
  private lectures: Lecture[];
  private calendarSettings: CalendarSettings | null;
  private calendarEvents: CalendarEvent[];
  private topicReviewStats: Map<string, TopicReviewStats>;
  private reviewHistory: ReviewEvent[];
  private currentDailyQuizPlan: DailyQuizPlan | null;

  constructor() {
    this.userProfile = deepClone(INITIAL_USER_PROFILE);
    this.lectures = [];
    this.calendarSettings = null;
    this.calendarEvents = [];
    this.topicReviewStats = new Map();
    this.reviewHistory = [];
    this.currentDailyQuizPlan = null;
  }

  getUserProfile(): UserProfile {
    return deepClone(this.userProfile);
  }

  updateUserProfile(updates: Partial<UserProfile>): UserProfile {
    const clonedUpdates = deepClone(updates);
    const currentProfile = deepClone(this.userProfile);
    
    const newProfile: UserProfile = {
      ...currentProfile,
      achievements: clonedUpdates.achievements !== undefined 
        ? clonedUpdates.achievements 
        : currentProfile.achievements,
      masteredTopics: clonedUpdates.masteredTopics !== undefined 
        ? clonedUpdates.masteredTopics 
        : currentProfile.masteredTopics,
      needsPractice: clonedUpdates.needsPractice !== undefined 
        ? clonedUpdates.needsPractice 
        : currentProfile.needsPractice,
      powerUps: clonedUpdates.powerUps !== undefined 
        ? clonedUpdates.powerUps 
        : currentProfile.powerUps,
      level: clonedUpdates.level !== undefined 
        ? clonedUpdates.level 
        : currentProfile.level,
      totalXP: clonedUpdates.totalXP !== undefined 
        ? clonedUpdates.totalXP 
        : currentProfile.totalXP,
      xpToNextLevel: clonedUpdates.xpToNextLevel !== undefined 
        ? clonedUpdates.xpToNextLevel 
        : currentProfile.xpToNextLevel,
      currentStreak: clonedUpdates.currentStreak !== undefined 
        ? clonedUpdates.currentStreak 
        : currentProfile.currentStreak,
      longestStreak: clonedUpdates.longestStreak !== undefined 
        ? clonedUpdates.longestStreak 
        : currentProfile.longestStreak,
      totalLectures: clonedUpdates.totalLectures !== undefined 
        ? clonedUpdates.totalLectures 
        : currentProfile.totalLectures,
      averageConfidence: clonedUpdates.averageConfidence !== undefined 
        ? clonedUpdates.averageConfidence 
        : currentProfile.averageConfidence,
      lastActivityDate: clonedUpdates.lastActivityDate !== undefined 
        ? clonedUpdates.lastActivityDate 
        : currentProfile.lastActivityDate,
    };
    
    this.userProfile = newProfile;
    return this.getUserProfile();
  }

  resetUserProfile(): UserProfile {
    this.userProfile = deepClone(INITIAL_USER_PROFILE);
    this.lectures = [];
    return this.getUserProfile();
  }

  loadDemoData(): { profile: UserProfile; lectures: Lecture[]; calendarSettings: CalendarSettings; calendarEvents: CalendarEvent[] } {
    this.userProfile = deepClone(DEMO_USER_PROFILE);
    this.lectures = deepClone(DEMO_LECTURES);
    this.calendarSettings = deepClone(DEMO_CALENDAR_SETTINGS);
    this.calendarEvents = deepClone(DEMO_CALENDAR_EVENTS);
    
    // Load demo topic review stats for daily quiz feature
    this.topicReviewStats.clear();
    const today = new Date();
    const demoTopics: TopicReviewStats[] = [
      {
        topic: "Recursive Function Call Stack",
        lectureId: "demo-3",
        lectureTitle: "Functions & Modular Design",
        lastReviewed: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lastScore: 65,
        reviewCount: 2,
        easeFactor: 2.1,
        interval: 3,
        nextDue: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Overdue
        streak: 0,
      },
      {
        topic: "Binary Tree Traversal Algorithms",
        lectureId: "demo-6",
        lectureTitle: "Data Structures Fundamentals",
        lastReviewed: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lastScore: 58,
        reviewCount: 1,
        easeFactor: 2.0,
        interval: 1,
        nextDue: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Overdue
        streak: 0,
      },
      {
        topic: "Method Overriding & Dynamic Dispatch",
        lectureId: "demo-5",
        lectureTitle: "Object-Oriented Programming",
        lastReviewed: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lastScore: 72,
        reviewCount: 2,
        easeFactor: 2.3,
        interval: 3,
        nextDue: today.toISOString().split('T')[0], // Due today
        streak: 1,
      },
      {
        topic: "Loop Complexity & Big-O Analysis",
        lectureId: "demo-2",
        lectureTitle: "Control Flow & Loops",
        lastReviewed: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lastScore: 85,
        reviewCount: 3,
        easeFactor: 2.5,
        interval: 7,
        nextDue: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Overdue
        streak: 2,
      },
      {
        topic: "Abstract Classes vs Interfaces",
        lectureId: "demo-5",
        lectureTitle: "Object-Oriented Programming",
        lastReviewed: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lastScore: 60,
        reviewCount: 1,
        easeFactor: 2.0,
        interval: 1,
        nextDue: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Overdue
        streak: 0,
      },
    ];
    
    demoTopics.forEach(topic => {
      this.topicReviewStats.set(topic.topic, topic);
    });
    
    return {
      profile: this.getUserProfile(),
      lectures: this.getLectures(),
      calendarSettings: this.getCalendarSettings()!,
      calendarEvents: this.getCalendarEvents(),
    };
  }

  getLectures(): Lecture[] {
    return deepClone(this.lectures);
  }

  getLecture(id: string): Lecture | undefined {
    const lecture = this.lectures.find(l => l.id === id);
    return lecture ? deepClone(lecture) : undefined;
  }

  addLecture(lectureData: Omit<Lecture, "id">): Lecture {
    const clonedData = deepClone(lectureData);
    const lecture: Lecture = {
      ...clonedData,
      id: randomUUID(),
    };
    this.lectures.push(lecture);
    this.userProfile.totalLectures = this.lectures.length;
    return deepClone(lecture);
  }

  updateLecture(id: string, updates: Partial<Lecture>): Lecture | undefined {
    const index = this.lectures.findIndex(l => l.id === id);
    if (index === -1) return undefined;
    
    const clonedUpdates = deepClone(updates);
    this.lectures[index] = { ...this.lectures[index], ...clonedUpdates };
    return deepClone(this.lectures[index]);
  }

  deleteLecture(id: string): boolean {
    const index = this.lectures.findIndex(l => l.id === id);
    if (index === -1) return false;
    
    this.lectures.splice(index, 1);
    this.userProfile.totalLectures = this.lectures.length;
    return true;
  }

  getWeakTopics(): string[] {
    const topicScores: Record<string, { total: number; count: number }> = {};
    
    this.lectures.forEach(lecture => {
      lecture.incorrectTopics.forEach(topic => {
        if (!topicScores[topic]) {
          topicScores[topic] = { total: 0, count: 0 };
        }
        topicScores[topic].total += 100 - lecture.reviewScore;
        topicScores[topic].count += 1;
      });
    });

    return Object.entries(topicScores)
      .filter(([_, data]) => data.total / data.count > 30)
      .map(([topic]) => topic)
      .slice(0, 5);
  }

  getCalendarSettings(): CalendarSettings | null {
    return this.calendarSettings ? deepClone(this.calendarSettings) : null;
  }

  setCalendarSettings(settings: CalendarSettings): CalendarSettings {
    this.calendarSettings = deepClone(settings);
    return this.getCalendarSettings()!;
  }

  clearCalendarSettings(): void {
    this.calendarSettings = null;
    this.calendarEvents = [];
  }

  getCalendarEvents(): CalendarEvent[] {
    return deepClone(this.calendarEvents);
  }

  setCalendarEvents(events: CalendarEvent[]): CalendarEvent[] {
    this.calendarEvents = deepClone(events);
    return this.getCalendarEvents();
  }

  updateCalendarEventMatch(eventId: string, lectureId: string | null): CalendarEvent | undefined {
    const index = this.calendarEvents.findIndex(e => e.id === eventId);
    if (index === -1) return undefined;
    
    this.calendarEvents[index].matchedLectureId = lectureId ?? undefined;
    return deepClone(this.calendarEvents[index]);
  }

  // Topic review stats methods
  getTopicReviewStats(): TopicReviewStats[] {
    return Array.from(this.topicReviewStats.values()).map(s => deepClone(s));
  }

  getTopicReviewStat(topic: string): TopicReviewStats | undefined {
    const stat = this.topicReviewStats.get(topic);
    return stat ? deepClone(stat) : undefined;
  }

  updateTopicReviewStats(topic: string, lectureId: string, lectureTitle: string, score: number): TopicReviewStats {
    const existing = this.topicReviewStats.get(topic);
    const today = new Date().toISOString().split('T')[0];
    
    if (existing) {
      // Update existing stats using SM-2 algorithm
      const wasSuccessful = score >= 70;
      const newStreak = wasSuccessful ? existing.streak + 1 : 0;
      
      const { easeFactor, interval, nextDue } = calculateNextReview(
        existing.easeFactor,
        existing.interval,
        score,
        newStreak
      );
      
      const updated: TopicReviewStats = {
        ...existing,
        lastReviewed: today,
        lastScore: score,
        reviewCount: existing.reviewCount + 1,
        easeFactor,
        interval,
        nextDue,
        streak: newStreak,
      };
      
      this.topicReviewStats.set(topic, updated);
      return deepClone(updated);
    } else {
      // Create new stats
      const { easeFactor, interval, nextDue } = calculateNextReview(2.5, 0, score, 0);
      
      const newStats: TopicReviewStats = {
        topic,
        lectureId,
        lectureTitle,
        lastReviewed: today,
        lastScore: score,
        reviewCount: 1,
        easeFactor,
        interval,
        nextDue,
        streak: score >= 70 ? 1 : 0,
      };
      
      this.topicReviewStats.set(topic, newStats);
      return deepClone(newStats);
    }
  }

  initializeTopicsFromLecture(lectureId: string, topics: string[]): void {
    const lecture = this.lectures.find(l => l.id === lectureId);
    if (!lecture) return;
    
    const today = new Date().toISOString().split('T')[0];
    
    topics.forEach(topic => {
      if (!this.topicReviewStats.has(topic)) {
        // Initialize with default spaced repetition values
        const newStats: TopicReviewStats = {
          topic,
          lectureId,
          lectureTitle: lecture.title,
          lastReviewed: today,
          lastScore: lecture.reviewScore,
          reviewCount: 1,
          easeFactor: 2.5,
          interval: 1,
          nextDue: today, // Due immediately for first review
          streak: lecture.reviewScore >= 70 ? 1 : 0,
        };
        this.topicReviewStats.set(topic, newStats);
      }
    });
  }

  // Daily quiz planning methods
  getDueTopics(limit: number = 10): TopicReviewStats[] {
    const allStats = this.getTopicReviewStats();
    const today = new Date();
    
    // Calculate priority for each topic and filter due/overdue ones
    const scoredTopics = allStats
      .map(stats => ({
        stats,
        priority: calculateTopicPriority(stats),
        isDue: new Date(stats.nextDue) <= today,
      }))
      .filter(t => t.isDue || t.priority > 50) // Include due topics or high-priority ones
      .sort((a, b) => b.priority - a.priority);
    
    return scoredTopics.slice(0, limit).map(t => t.stats);
  }

  getCurrentDailyQuizPlan(): DailyQuizPlan | null {
    return this.currentDailyQuizPlan ? deepClone(this.currentDailyQuizPlan) : null;
  }

  setCurrentDailyQuizPlan(plan: DailyQuizPlan): DailyQuizPlan {
    this.currentDailyQuizPlan = deepClone(plan);
    return this.getCurrentDailyQuizPlan()!;
  }

  completeDailyQuizPlan(score: number): DailyQuizPlan | null {
    if (!this.currentDailyQuizPlan) return null;
    
    this.currentDailyQuizPlan.completed = true;
    this.currentDailyQuizPlan.completedAt = new Date().toISOString();
    this.currentDailyQuizPlan.score = score;
    
    const completedPlan = deepClone(this.currentDailyQuizPlan);
    this.currentDailyQuizPlan = null;
    
    return completedPlan;
  }

  // Review history methods
  addReviewEvent(eventData: Omit<ReviewEvent, "id">): ReviewEvent {
    const event: ReviewEvent = {
      ...deepClone(eventData),
      id: randomUUID(),
    };
    this.reviewHistory.unshift(event); // Add to beginning for chronological order
    
    // Keep only last 1000 events
    if (this.reviewHistory.length > 1000) {
      this.reviewHistory = this.reviewHistory.slice(0, 1000);
    }
    
    return deepClone(event);
  }

  getReviewHistory(limit: number = 50): ReviewEvent[] {
    return this.reviewHistory.slice(0, limit).map(e => deepClone(e));
  }
}

export const storage = new MemStorage();
