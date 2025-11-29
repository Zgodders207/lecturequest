import { randomUUID } from "crypto";
import type { UserProfile, Lecture, Achievement } from "@shared/schema";
import { INITIAL_USER_PROFILE, ALL_ACHIEVEMENTS, DEMO_USER_PROFILE, DEMO_LECTURES } from "@shared/schema";

export interface IStorage {
  getUserProfile(): UserProfile;
  updateUserProfile(profile: Partial<UserProfile>): UserProfile;
  resetUserProfile(): UserProfile;
  loadDemoData(): { profile: UserProfile; lectures: Lecture[] };
  
  getLectures(): Lecture[];
  getLecture(id: string): Lecture | undefined;
  addLecture(lecture: Omit<Lecture, "id">): Lecture;
  updateLecture(id: string, updates: Partial<Lecture>): Lecture | undefined;
  
  getWeakTopics(): string[];
}

export class MemStorage implements IStorage {
  private userProfile: UserProfile;
  private lectures: Lecture[];

  constructor() {
    this.userProfile = JSON.parse(JSON.stringify(INITIAL_USER_PROFILE));
    this.lectures = [];
  }

  getUserProfile(): UserProfile {
    return JSON.parse(JSON.stringify(this.userProfile));
  }

  updateUserProfile(updates: Partial<UserProfile>): UserProfile {
    this.userProfile = { ...this.userProfile, ...updates };
    if (updates.achievements) {
      this.userProfile.achievements = updates.achievements.map(a => ({ ...a }));
    }
    return this.getUserProfile();
  }

  resetUserProfile(): UserProfile {
    this.userProfile = JSON.parse(JSON.stringify(INITIAL_USER_PROFILE));
    this.lectures = [];
    return this.getUserProfile();
  }

  loadDemoData(): { profile: UserProfile; lectures: Lecture[] } {
    this.userProfile = JSON.parse(JSON.stringify(DEMO_USER_PROFILE));
    this.lectures = JSON.parse(JSON.stringify(DEMO_LECTURES));
    return {
      profile: this.getUserProfile(),
      lectures: this.getLectures(),
    };
  }

  getLectures(): Lecture[] {
    return JSON.parse(JSON.stringify(this.lectures));
  }

  getLecture(id: string): Lecture | undefined {
    const lecture = this.lectures.find(l => l.id === id);
    return lecture ? JSON.parse(JSON.stringify(lecture)) : undefined;
  }

  addLecture(lectureData: Omit<Lecture, "id">): Lecture {
    const lecture: Lecture = {
      ...lectureData,
      id: randomUUID(),
    };
    this.lectures.push(lecture);
    this.userProfile.totalLectures = this.lectures.length;
    return JSON.parse(JSON.stringify(lecture));
  }

  updateLecture(id: string, updates: Partial<Lecture>): Lecture | undefined {
    const index = this.lectures.findIndex(l => l.id === id);
    if (index === -1) return undefined;
    
    this.lectures[index] = { ...this.lectures[index], ...updates };
    return JSON.parse(JSON.stringify(this.lectures[index]));
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
}

export const storage = new MemStorage();
