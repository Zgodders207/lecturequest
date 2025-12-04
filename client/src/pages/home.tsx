import { useState, useCallback, useEffect } from "react";
import { Header } from "@/components/header";
import { Dashboard } from "@/components/dashboard";
import { UploadView } from "@/components/upload-view";
import { QuizView } from "@/components/quiz-view";
import { QuizResults } from "@/components/quiz-results";
import { ConfidenceRating } from "@/components/confidence-rating";
import { AchievementsView } from "@/components/achievements-view";
import { LevelUpOverlay } from "@/components/level-up-overlay";
import { AchievementToastStack } from "@/components/achievement-toast";
import { localStorage2 } from "@/lib/localStorage";
import {
  calculateXP,
  calculateLevel,
  xpForNextLevel,
  checkAchievements,
  extractTopics,
} from "@/lib/game-utils";
import type { 
  UserProfile, 
  Lecture, 
  Question, 
  QuizResult, 
  Achievement,
  TransferableSkill 
} from "@shared/schema";
import { INITIAL_USER_PROFILE, DEMO_USER_PROFILE, DEMO_LECTURES } from "@shared/schema";

type ViewType = "dashboard" | "upload" | "quiz" | "results" | "confidence" | "achievements" | "loading";

// Mock quiz generation (simplified - in a real app you'd call an AI API)
function generateMockQuiz(content: string, title: string): Question[] {
  const topics = extractTopics(content);
  return Array.from({ length: 10 }, (_, i) => ({
    question: `Question ${i + 1} about ${title}: What is the main concept discussed?`,
    options: ["Concept A", "Concept B", "Concept C", "Concept D"],
    correct: Math.floor(Math.random() * 4),
    explanation: "This tests your understanding of the key concepts.",
    topic: topics[i % topics.length] || "General",
  }));
}

function generateDailyMockQuiz(weakTopics: string[], lectures: Lecture[]): Question[] {
  return Array.from({ length: 10 }, (_, i) => ({
    question: `Review question ${i + 1}: ${weakTopics[i % weakTopics.length] || "General concept"}`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    correct: Math.floor(Math.random() * 4),
    explanation: "Review this topic to improve your understanding.",
    topic: weakTopics[i % weakTopics.length] || "General",
  }));
}

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [currentQuiz, setCurrentQuiz] = useState<Question[]>([]);
  const [currentLectureId, setCurrentLectureId] = useState<string | null>(null);
  const [currentLectureTitle, setCurrentLectureTitle] = useState("");
  const [currentLectureContent, setCurrentLectureContent] = useState("");
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(1);
  const [levelUpRewards, setLevelUpRewards] = useState<string[]>([]);
  const [pendingAchievements, setPendingAchievements] = useState<Achievement[]>([]);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [perfectScoresCount, setPerfectScoresCount] = useState(0);
  const [isDailyQuiz, setIsDailyQuiz] = useState(false);
  const [dailyQuizPlanId, setDailyQuizPlanId] = useState<string | null>(null);
  const [dailyQuizTopics, setDailyQuizTopics] = useState<{ topic: string; lectureTitle: string; reason: string }[]>([]);
  const [currentSkills, setCurrentSkills] = useState<TransferableSkill[]>([]);
  
  // Use localStorage instead of API
  const [userProfile, setUserProfile] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [lectureHistory, setLectureHistory] = useState<Lecture[]>([]);

  // Load data from localStorage on mount
  useEffect(() => {
    setUserProfile(localStorage2.getUserProfile());
    setLectureHistory(localStorage2.getLectures());
  }, []);

  // Helper to refresh data from localStorage
  const refreshData = () => {
    setUserProfile(localStorage2.getUserProfile());
    setLectureHistory(localStorage2.getLectures());
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    const updated = localStorage2.updateUserProfile(updates);
    setUserProfile(updated);
  };

  const addLecture = (lecture: Omit<Lecture, "id">) => {
    localStorage2.addLecture(lecture);
    refreshData();
  };

  const updateLecture = (id: string, data: Partial<Lecture>) => {
    localStorage2.updateLecture(id, data);
    refreshData();
  };

  const deleteLecture = (lectureId: string) => {
    localStorage2.deleteLecture(lectureId);
    refreshData();
  };

  const loadDemoData = () => {
    // Load demo profile
    localStorage2.updateUserProfile(DEMO_USER_PROFILE);
    
    // Clear existing lectures and load demo lectures
    const existingLectures = localStorage2.getLectures();
    existingLectures.forEach(l => localStorage2.deleteLecture(l.id));
    
    DEMO_LECTURES.forEach(lecture => {
      localStorage2.addLecture(lecture);
    });
    
    // Refresh data
    refreshData();
  };

  const handleSaveLecture = useCallback((content: string, title: string) => {
    const lecture: Omit<Lecture, "id"> = {
      title,
      date: new Date().toISOString().split("T")[0],
      content,
      reviewScore: 0,
      xpEarned: 0,
      incorrectTopics: [],
      confidenceRating: 0,
      dailyQuizzes: [],
      needsReview: true,
      lastReviewed: undefined,
      identifiedSkills: [],
      questionsAnswered: 0,
    };

    addLecture(lecture);
    setCurrentView("dashboard");
  }, []);

  const handleStartReview = useCallback((lectureId: string) => {
    const lecture = lectureHistory.find((l) => l.id === lectureId);
    if (!lecture) return;

    setIsDailyQuiz(false);
    setDailyQuizPlanId(null);
    setCurrentLectureId(lectureId);
    setCurrentLectureTitle(lecture.title);
    setCurrentLectureContent(lecture.content);
    
    // Generate mock quiz questions from lecture content
    const mockQuestions: Question[] = generateMockQuiz(lecture.content, lecture.title);
    setCurrentQuiz(mockQuestions);
    setCurrentSkills([]);
    setCurrentView("quiz");
  }, [lectureHistory]);

  const handleStartDailyQuiz = useCallback(() => {
    setIsDailyQuiz(true);
    setCurrentLectureId(null);
    setCurrentLectureTitle("Daily Quiz");
    
    // Generate a daily quiz from weak topics
    const weakTopics = localStorage2.getWeakTopics();
    const mockQuestions: Question[] = generateDailyMockQuiz(weakTopics, lectureHistory);
    setCurrentQuiz(mockQuestions);
    setDailyQuizTopics(weakTopics.slice(0, 5).map(t => ({ topic: t, lectureTitle: "", reason: "review" })));
    setCurrentView("quiz");
  }, [lectureHistory]);

  const handleQuizComplete = useCallback((answers: { questionIndex: number; selectedAnswer: number; isCorrect: boolean }[]) => {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const totalQuestions = currentQuiz.length;
    const isPerfect = correctCount === totalQuestions;
    const accuracyPercent = Math.round((correctCount / totalQuestions) * 100);

    const incorrectAnswers = answers.filter((a) => !a.isCorrect);
    const incorrectTopics: string[] = [];
    incorrectAnswers.forEach((answer) => {
      const question = currentQuiz[answer.questionIndex];
      // Use AI-generated topic if available, otherwise fall back to extraction
      if (question.topic) {
        incorrectTopics.push(question.topic);
      } else {
        const topics = extractTopics(question.question);
        incorrectTopics.push(...topics);
      }
    });
    const uniqueIncorrectTopics = Array.from(new Set(incorrectTopics)).slice(0, 5);

    const existingLecture = currentLectureId ? lectureHistory.find((l) => l.id === currentLectureId) : null;
    const previousScore = existingLecture?.reviewScore || 0;
    const isImprovement = previousScore > 0 && accuracyPercent > previousScore;
    
    const xpEarned = calculateXP(
      correctCount,
      totalQuestions,
      isPerfect,
      0,
      isImprovement,
      userProfile.currentStreak,
      userProfile.powerUps.doubleXP
    );

    const result: QuizResult = {
      score: correctCount,
      total: totalQuestions,
      xpEarned,
      accuracyPercent,
      incorrectTopics: uniqueIncorrectTopics,
    };

    setQuizResult(result);
    setWeakTopics(uniqueIncorrectTopics);

    if (isPerfect) {
      setPerfectScoresCount((prev) => prev + 1);
    }

    const oldLevel = userProfile.level;
    const newTotalXP = userProfile.totalXP + xpEarned;
    const calculatedNewLevel = calculateLevel(newTotalXP);

    const newNeedsPractice = userProfile.needsPractice.slice();
    uniqueIncorrectTopics.forEach((topic) => {
      if (!newNeedsPractice.includes(topic)) {
        newNeedsPractice.push(topic);
      }
    });

    const newMasteredTopics = userProfile.masteredTopics.slice();
    const filteredNeedsPractice = newNeedsPractice.slice();
    if (accuracyPercent >= 80) {
      uniqueIncorrectTopics.forEach((topic) => {
        const topicScores = lectureHistory
          .filter((l) => l.content.toLowerCase().includes(topic.toLowerCase()))
          .map((l) => l.reviewScore);
        
        if (topicScores.filter((s) => s >= 80).length >= 2) {
          if (!newMasteredTopics.includes(topic)) {
            newMasteredTopics.push(topic);
          }
          const idx = filteredNeedsPractice.indexOf(topic);
          if (idx > -1) {
            filteredNeedsPractice.splice(idx, 1);
          }
        }
      });
    }

    let newPowerUps = { ...userProfile.powerUps };
    if (userProfile.powerUps.doubleXP) {
      newPowerUps = { ...newPowerUps, doubleXP: false };
    }
    if (isPerfect && userProfile.powerUps.secondChance < 10) {
      newPowerUps = { ...newPowerUps, secondChance: userProfile.powerUps.secondChance + 1 };
    }

    const tempProfile: UserProfile = {
      ...userProfile,
      totalXP: newTotalXP,
      level: calculatedNewLevel,
      xpToNextLevel: xpForNextLevel(calculatedNewLevel),
      needsPractice: filteredNeedsPractice,
      masteredTopics: newMasteredTopics,
      powerUps: newPowerUps,
    };

    const unlockedAchievements = checkAchievements(
      tempProfile,
      lectureHistory,
      new Date().getHours(),
      perfectScoresCount + (isPerfect ? 1 : 0)
    );

    setNewAchievements(unlockedAchievements);
    if (unlockedAchievements.length > 0) {
      setPendingAchievements((prev) => [...prev, ...unlockedAchievements]);
    }

    const profileUpdate: Partial<UserProfile> = {
      totalXP: newTotalXP,
      level: calculatedNewLevel,
      xpToNextLevel: xpForNextLevel(calculatedNewLevel),
      needsPractice: filteredNeedsPractice,
      masteredTopics: newMasteredTopics,
      powerUps: newPowerUps,
    };

    if (unlockedAchievements.length > 0) {
      profileUpdate.achievements = tempProfile.achievements;
    }

    updateProfile(profileUpdate);

    if (calculatedNewLevel > oldLevel) {
      setNewLevel(calculatedNewLevel);
      const rewards: string[] = [];
      if (calculatedNewLevel === 5) rewards.push("Streak Freeze Power-Up");
      if (calculatedNewLevel % 3 === 0) rewards.push("+1 Hint Power-Up");
      if (Math.random() < 0.2) rewards.push("Double XP (Next Quiz)");
      setLevelUpRewards(rewards);

      if (rewards.length > 0) {
        const rewardPowerUps = { ...newPowerUps };
        if (rewards.includes("Double XP (Next Quiz)")) {
          rewardPowerUps.doubleXP = true;
        }
        if (rewards.includes("+1 Hint Power-Up")) {
          rewardPowerUps.hints = rewardPowerUps.hints + 1;
        }
        updateProfile({ powerUps: rewardPowerUps });
      }
    }

    // Complete daily quiz if applicable (store in localStorage)
    if (isDailyQuiz && dailyQuizPlanId) {
      localStorage2.completeDailyQuizPlan(accuracyPercent);
    }

    setCurrentView("results");

    if (calculatedNewLevel > oldLevel) {
      setTimeout(() => setShowLevelUp(true), 500);
    }
  }, [currentQuiz, currentLectureId, userProfile, lectureHistory, perfectScoresCount, isDailyQuiz, dailyQuizPlanId]);

  const handleConfidenceSubmit = useCallback((rating: number) => {
    const confidenceXP = rating * 5;

    if (currentLectureId) {
      const accuracy = quizResult?.accuracyPercent || 0;
      let calculatedProficiency: "developing" | "intermediate" | "proficient" = "developing";
      if (accuracy >= 85) {
        calculatedProficiency = "proficient";
      } else if (accuracy >= 60) {
        calculatedProficiency = "intermediate";
      }

      const skillsWithProficiency = currentSkills.map(skill => ({
        ...skill,
        proficiencyLevel: calculatedProficiency,
      }));

      updateLecture(currentLectureId, {
        reviewScore: accuracy,
        xpEarned: (quizResult?.xpEarned || 0) + confidenceXP,
        incorrectTopics: weakTopics.slice(),
        confidenceRating: rating,
        needsReview: false,
        lastReviewed: new Date().toISOString(),
        identifiedSkills: skillsWithProficiency,
        questionsAnswered: currentQuiz.length,
      });
    }

    const newTotalXP = userProfile.totalXP + confidenceXP;
    const newLevelCalc = calculateLevel(newTotalXP);
    
    const totalConfidence = userProfile.averageConfidence * userProfile.totalLectures + rating;
    const newTotalLectures = userProfile.totalLectures + 1;

    const profileUpdate: Partial<UserProfile> = {
      totalXP: newTotalXP,
      level: newLevelCalc,
      xpToNextLevel: xpForNextLevel(newLevelCalc),
      totalLectures: newTotalLectures,
      averageConfidence: totalConfidence / newTotalLectures,
      currentStreak: userProfile.currentStreak + 1,
      longestStreak: Math.max(userProfile.longestStreak, userProfile.currentStreak + 1),
      lastActivityDate: new Date().toISOString(),
    };

    updateProfile(profileUpdate);

    const tempProfile: UserProfile = { ...userProfile, ...profileUpdate };
    const unlockedAchievements = checkAchievements(
      tempProfile,
      lectureHistory,
      new Date().getHours(),
      perfectScoresCount
    );

    if (unlockedAchievements.length > 0) {
      setPendingAchievements((prev) => [...prev, ...unlockedAchievements]);
    }

    setCurrentView("dashboard");
    setQuizResult(null);
    setCurrentQuiz([]);
    setWeakTopics([]);
    setCurrentLectureId(null);
    setCurrentLectureTitle("");
    setCurrentLectureContent("");
    setIsDailyQuiz(false);
    setDailyQuizPlanId(null);
    setDailyQuizTopics([]);
    setCurrentSkills([]);
  }, [currentLectureId, quizResult, weakTopics, userProfile, lectureHistory, perfectScoresCount, currentSkills, currentQuiz]);

  const handleUseHint = useCallback(() => {
    const updatedPowerUps = {
      ...userProfile.powerUps,
      hints: Math.max(0, userProfile.powerUps.hints - 1),
    };
    updateProfile({ powerUps: updatedPowerUps });
  }, [userProfile.powerUps]);

  const handleUseSecondChance = useCallback(() => {
    const updatedPowerUps = {
      ...userProfile.powerUps,
      secondChance: Math.max(0, userProfile.powerUps.secondChance - 1),
    };
    updateProfile({ powerUps: updatedPowerUps });
  }, [userProfile.powerUps]);

  const handleDismissAchievement = useCallback((id: string) => {
    setPendingAchievements((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleNavigate = useCallback((view: "dashboard" | "upload" | "achievements") => {
    setCurrentView(view);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case "upload":
        return (
          <UploadView
            onSave={handleSaveLecture}
            onBack={() => setCurrentView("dashboard")}
            isSaving={false}
            error={null}
          />
        );

      case "quiz":
        return (
          <QuizView
            questions={currentQuiz}
            lectureTitle={currentLectureTitle}
            userProfile={userProfile}
            onComplete={handleQuizComplete}
            onUseHint={handleUseHint}
            onUseSecondChance={handleUseSecondChance}
            isDaily={false}
          />
        );

      case "results":
        return quizResult ? (
          <QuizResults
            result={quizResult}
            newAchievements={newAchievements}
            skills={currentSkills}
            onContinue={() => setCurrentView("confidence")}
            isDaily={false}
          />
        ) : null;

      case "confidence":
        return (
          <ConfidenceRating
            weakTopics={weakTopics}
            onSubmit={handleConfidenceSubmit}
          />
        );

      case "achievements":
        return (
          <AchievementsView
            achievements={userProfile.achievements}
            onBack={() => setCurrentView("dashboard")}
          />
        );

      case "loading":
        return (
          <div 
            className="flex flex-col items-center justify-center min-h-[60vh] gap-6" 
            data-testid="view-loading"
            role="status"
            aria-live="polite"
            aria-label="Generating quiz"
          >
            <div className="relative" aria-hidden="true">
              <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
              <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-serif text-foreground">Generating Your Quiz</h2>
              <p className="text-muted-foreground">Our AI is crafting personalized questions from your lecture...</p>
            </div>
          </div>
        );

      case "dashboard":
      default:
        return (
          <Dashboard
            userProfile={userProfile}
            lectureHistory={lectureHistory}
            onStartUpload={() => setCurrentView("upload")}
            onStartReview={handleStartReview}
            onViewAchievements={() => setCurrentView("achievements")}
            onDeleteLecture={(id) => deleteLecture(id)}
            onStartDailyQuiz={handleStartDailyQuiz}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        userProfile={userProfile} 
        onNavigate={handleNavigate}
        currentView={currentView}
        onLoadDemoData={loadDemoData}
      />
      
      <main>
        {renderView()}
      </main>

      {showLevelUp && (
        <LevelUpOverlay
          newLevel={newLevel}
          rewards={levelUpRewards}
          onContinue={() => setShowLevelUp(false)}
        />
      )}

      {pendingAchievements.length > 0 && (
        <AchievementToastStack
          achievements={pendingAchievements}
          onDismiss={handleDismissAchievement}
        />
      )}
    </div>
  );
}
