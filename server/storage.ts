import { randomUUID } from "crypto";
import type { UserProfile, Lecture, Achievement, CalendarSettings, CalendarEvent } from "@shared/schema";
import { INITIAL_USER_PROFILE, ALL_ACHIEVEMENTS, DEMO_USER_PROFILE, DEMO_LECTURES, DEMO_CALENDAR_SETTINGS, DEMO_CALENDAR_EVENTS } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private userProfile: UserProfile;
  private lectures: Lecture[];
  private calendarSettings: CalendarSettings | null;
  private calendarEvents: CalendarEvent[];

  constructor() {
    this.userProfile = deepClone(INITIAL_USER_PROFILE);
    this.lectures = [];
    this.calendarSettings = null;
    this.calendarEvents = [];
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
}

export const storage = new MemStorage();
