import { randomUUID } from "crypto";
import type { UserProfile, Lecture, Achievement } from "@shared/schema";
import { INITIAL_USER_PROFILE, ALL_ACHIEVEMENTS, DEMO_USER_PROFILE, DEMO_LECTURES } from "@shared/schema";

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export interface IStorage {
  getUserProfile(): UserProfile;
  updateUserProfile(profile: Partial<UserProfile>): UserProfile;
  resetUserProfile(): UserProfile;
  loadDemoData(): { profile: UserProfile; lectures: Lecture[] };
  
  getLectures(): Lecture[];
  getLecture(id: string): Lecture | undefined;
  addLecture(lecture: Omit<Lecture, "id">): Lecture;
  updateLecture(id: string, updates: Partial<Lecture>): Lecture | undefined;
  deleteLecture(id: string): boolean;
  
  getWeakTopics(): string[];
}

export class MemStorage implements IStorage {
  private userProfile: UserProfile;
  private lectures: Lecture[];

  constructor() {
    this.userProfile = deepClone(INITIAL_USER_PROFILE);
    this.lectures = [];
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

  loadDemoData(): { profile: UserProfile; lectures: Lecture[] } {
    this.userProfile = deepClone(DEMO_USER_PROFILE);
    this.lectures = deepClone(DEMO_LECTURES);
    return {
      profile: this.getUserProfile(),
      lectures: this.getLectures(),
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
}

export const storage = new MemStorage();
