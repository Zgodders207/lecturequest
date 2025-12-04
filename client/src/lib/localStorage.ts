import type {
  UserProfile,
  Lecture,
  CalendarSettings,
  CalendarEvent,
  DailyQuizPlan,
  Question,
} from "@shared/schema";
import { INITIAL_USER_PROFILE } from "@shared/schema";

const STORAGE_KEYS = {
  USER_PROFILE: "lecturequest_profile",
  LECTURES: "lecturequest_lectures",
  CALENDAR_SETTINGS: "lecturequest_calendar_settings",
  CALENDAR_EVENTS: "lecturequest_calendar_events",
  DAILY_QUIZ_PLAN: "lecturequest_daily_quiz_plan",
  CACHED_QUESTIONS: "lecturequest_cached_questions",
};

export class LocalStorage {
  // User Profile
  getUserProfile(): UserProfile {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!stored) {
      const profile = { ...INITIAL_USER_PROFILE };
      this.setUserProfile(profile);
      return profile;
    }
    return JSON.parse(stored);
  }

  setUserProfile(profile: UserProfile): void {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  }

  updateUserProfile(updates: Partial<UserProfile>): UserProfile {
    const current = this.getUserProfile();
    const updated = { ...current, ...updates };
    this.setUserProfile(updated);
    return updated;
  }

  resetUserProfile(): UserProfile {
    const fresh = { ...INITIAL_USER_PROFILE };
    this.setUserProfile(fresh);
    localStorage.removeItem(STORAGE_KEYS.LECTURES);
    localStorage.removeItem(STORAGE_KEYS.CALENDAR_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.CALENDAR_EVENTS);
    localStorage.removeItem(STORAGE_KEYS.DAILY_QUIZ_PLAN);
    localStorage.removeItem(STORAGE_KEYS.CACHED_QUESTIONS);
    return fresh;
  }

  // Lectures
  getLectures(): Lecture[] {
    const stored = localStorage.getItem(STORAGE_KEYS.LECTURES);
    return stored ? JSON.parse(stored) : [];
  }

  getLecture(id: string): Lecture | undefined {
    const lectures = this.getLectures();
    return lectures.find((l) => l.id === id);
  }

  addLecture(lecture: Omit<Lecture, "id">): Lecture {
    const lectures = this.getLectures();
    const id = String(Date.now());
    const newLecture = { ...lecture, id };
    lectures.push(newLecture);
    localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(lectures));
    return newLecture;
  }

  updateLecture(id: string, updates: Partial<Lecture>): Lecture | undefined {
    const lectures = this.getLectures();
    const index = lectures.findIndex((l) => l.id === id);
    if (index === -1) return undefined;
    lectures[index] = { ...lectures[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(lectures));
    return lectures[index];
  }

  deleteLecture(id: string): boolean {
    const lectures = this.getLectures();
    const filtered = lectures.filter((l) => l.id !== id);
    if (filtered.length === lectures.length) return false;
    localStorage.setItem(STORAGE_KEYS.LECTURES, JSON.stringify(filtered));
    return true;
  }

  // Calendar
  getCalendarSettings(): CalendarSettings | null {
    const stored = localStorage.getItem(STORAGE_KEYS.CALENDAR_SETTINGS);
    return stored ? JSON.parse(stored) : null;
  }

  setCalendarSettings(settings: CalendarSettings): void {
    localStorage.setItem(STORAGE_KEYS.CALENDAR_SETTINGS, JSON.stringify(settings));
  }

  clearCalendarSettings(): void {
    localStorage.removeItem(STORAGE_KEYS.CALENDAR_SETTINGS);
  }

  getCalendarEvents(): CalendarEvent[] {
    const stored = localStorage.getItem(STORAGE_KEYS.CALENDAR_EVENTS);
    return stored ? JSON.parse(stored) : [];
  }

  setCalendarEvents(events: CalendarEvent[]): void {
    localStorage.setItem(STORAGE_KEYS.CALENDAR_EVENTS, JSON.stringify(events));
  }

  // Daily Quiz
  getDailyQuizPlan(): DailyQuizPlan | null {
    const stored = localStorage.getItem(STORAGE_KEYS.DAILY_QUIZ_PLAN);
    return stored ? JSON.parse(stored) : null;
  }

  setDailyQuizPlan(plan: DailyQuizPlan): void {
    localStorage.setItem(STORAGE_KEYS.DAILY_QUIZ_PLAN, JSON.stringify(plan));
  }

  completeDailyQuizPlan(score: number): DailyQuizPlan | null {
    const plan = this.getDailyQuizPlan();
    if (!plan) return null;
    plan.completed = true;
    plan.score = score;
    plan.completedAt = new Date().toISOString();
    this.setDailyQuizPlan(plan);
    return plan;
  }

  // Cached Questions
  getCachedQuestions(topic: string, lectureId: string): Question[] {
    const key = `${STORAGE_KEYS.CACHED_QUESTIONS}_${lectureId}_${topic}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }

  cacheQuestions(topic: string, lectureId: string, questions: Question[]): void {
    const key = `${STORAGE_KEYS.CACHED_QUESTIONS}_${lectureId}_${topic}`;
    localStorage.setItem(key, JSON.stringify(questions));
  }

  // Weak topics helper
  getWeakTopics(): string[] {
    const lectures = this.getLectures();
    const topics = new Set<string>();
    lectures.forEach((lecture) => {
      lecture.incorrectTopics.forEach((topic) => topics.add(topic));
    });
    return Array.from(topics);
  }
}

export const localStorage2 = new LocalStorage();
