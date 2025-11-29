import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Dashboard } from "@/components/dashboard";
import { UploadView } from "@/components/upload-view";
import { QuizView } from "@/components/quiz-view";
import { QuizResults } from "@/components/quiz-results";
import { ConfidenceRating } from "@/components/confidence-rating";
import { AchievementsView } from "@/components/achievements-view";
import { LevelUpOverlay } from "@/components/level-up-overlay";
import { AchievementToastStack } from "@/components/achievement-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  calculateXP,
  calculateLevel,
  xpForNextLevel,
  checkAchievements,
  extractTopics,
  getLevelTitle,
} from "@/lib/game-utils";
import type { 
  UserProfile, 
  Lecture, 
  Question, 
  QuizResult, 
  Achievement 
} from "@shared/schema";
import { INITIAL_USER_PROFILE } from "@shared/schema";

type ViewType = "dashboard" | "upload" | "quiz" | "results" | "confidence" | "daily" | "achievements";

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>("dashboard");
  const [currentQuiz, setCurrentQuiz] = useState<Question[]>([]);
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
  const [isDaily, setIsDaily] = useState(false);
  const [previousDailyScore, setPreviousDailyScore] = useState<number | undefined>();

  const { data: userProfile = INITIAL_USER_PROFILE } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
  });

  const { data: lectureHistory = [] } = useQuery<Lecture[]>({
    queryKey: ["/api/lectures"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (profile: Partial<UserProfile>) => {
      const response = await apiRequest("PATCH", "/api/profile", profile);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });

  const addLectureMutation = useMutation({
    mutationFn: async (lecture: Omit<Lecture, "id">) => {
      const response = await apiRequest("POST", "/api/lectures", lecture);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lectures"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });

  const loadDemoMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/profile/demo", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/lectures"] });
      setPerfectScoresCount(1);
    },
  });

  const generateQuizMutation = useMutation({
    mutationFn: async ({ content, title }: { content: string; title: string }) => {
      const response = await apiRequest("POST", "/api/generate-quiz", { content, title });
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentQuiz(data.questions);
      setCurrentView("quiz");
    },
  });

  const generateDailyQuizMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/generate-daily-quiz", {
        weakTopics: userProfile.needsPractice,
        previousScore: lectureHistory.length > 0 
          ? Math.round(lectureHistory.reduce((sum, l) => sum + l.reviewScore, 0) / lectureHistory.length)
          : 50,
        confidenceLevel: userProfile.averageConfidence || 3,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentQuiz(data.questions);
      setIsDaily(true);
      setPreviousDailyScore(
        lectureHistory.length > 0
          ? Math.round(lectureHistory.reduce((sum, l) => sum + l.reviewScore, 0) / lectureHistory.length)
          : undefined
      );
      setCurrentView("quiz");
    },
  });

  const handleUpload = useCallback((content: string, title: string) => {
    setCurrentLectureTitle(title);
    setCurrentLectureContent(content);
    setIsDaily(false);
    generateQuizMutation.mutate({ content, title });
  }, [generateQuizMutation]);

  const handleQuizComplete = useCallback((answers: { questionIndex: number; selectedAnswer: number; isCorrect: boolean }[]) => {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const totalQuestions = currentQuiz.length;
    const isPerfect = correctCount === totalQuestions;
    const accuracyPercent = Math.round((correctCount / totalQuestions) * 100);

    const incorrectAnswers = answers.filter((a) => !a.isCorrect);
    const incorrectTopics: string[] = [];
    incorrectAnswers.forEach((answer) => {
      const question = currentQuiz[answer.questionIndex];
      const topics = extractTopics(question.question);
      incorrectTopics.push(...topics);
    });
    const uniqueIncorrectTopics = Array.from(new Set(incorrectTopics)).slice(0, 5);

    const isImprovement = isDaily && previousDailyScore !== undefined && accuracyPercent > previousDailyScore;
    
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

    const updatedProfile: Partial<UserProfile> = {
      totalXP: newTotalXP,
      level: calculatedNewLevel,
      xpToNextLevel: xpForNextLevel(calculatedNewLevel),
    };

    if (userProfile.powerUps.doubleXP) {
      updatedProfile.powerUps = { ...userProfile.powerUps, doubleXP: false };
    }

    if (isPerfect && userProfile.powerUps.secondChance < 10) {
      updatedProfile.powerUps = { 
        ...updatedProfile.powerUps || userProfile.powerUps, 
        secondChance: userProfile.powerUps.secondChance + 1 
      };
    }

    const newNeedsPractice = [...userProfile.needsPractice];
    uniqueIncorrectTopics.forEach((topic) => {
      if (!newNeedsPractice.includes(topic)) {
        newNeedsPractice.push(topic);
      }
    });
    updatedProfile.needsPractice = newNeedsPractice;

    const newMasteredTopics = [...userProfile.masteredTopics];
    if (accuracyPercent >= 80) {
      uniqueIncorrectTopics.forEach((topic) => {
        const topicScores = lectureHistory
          .filter((l) => l.content.toLowerCase().includes(topic.toLowerCase()))
          .map((l) => l.reviewScore);
        
        if (topicScores.filter((s) => s >= 80).length >= 2) {
          if (!newMasteredTopics.includes(topic)) {
            newMasteredTopics.push(topic);
          }
          const idx = newNeedsPractice.indexOf(topic);
          if (idx > -1) newNeedsPractice.splice(idx, 1);
        }
      });
    }
    updatedProfile.masteredTopics = newMasteredTopics;

    const tempProfile = { ...userProfile, ...updatedProfile };
    const unlockedAchievements = checkAchievements(
      tempProfile,
      lectureHistory,
      new Date().getHours(),
      perfectScoresCount + (isPerfect ? 1 : 0)
    );

    if (unlockedAchievements.length > 0) {
      updatedProfile.achievements = tempProfile.achievements;
    }

    setNewAchievements(unlockedAchievements);
    if (unlockedAchievements.length > 0) {
      setPendingAchievements((prev) => [...prev, ...unlockedAchievements]);
    }

    updateProfileMutation.mutate(updatedProfile);

    if (calculatedNewLevel > oldLevel) {
      setNewLevel(calculatedNewLevel);
      const rewards: string[] = [];
      if (calculatedNewLevel === 5) rewards.push("Streak Freeze Power-Up");
      if (calculatedNewLevel % 3 === 0) rewards.push("+1 Hint Power-Up");
      if (Math.random() < 0.2) rewards.push("Double XP (Next Quiz)");
      setLevelUpRewards(rewards);

      if (rewards.length > 0) {
        const powerUpUpdates: Partial<UserProfile> = {};
        if (rewards.includes("Double XP (Next Quiz)")) {
          powerUpUpdates.powerUps = { ...userProfile.powerUps, doubleXP: true };
        }
        if (rewards.includes("+1 Hint Power-Up")) {
          powerUpUpdates.powerUps = { 
            ...powerUpUpdates.powerUps || userProfile.powerUps, 
            hints: userProfile.powerUps.hints + 1 
          };
        }
        if (Object.keys(powerUpUpdates).length > 0) {
          updateProfileMutation.mutate(powerUpUpdates);
        }
      }
    }

    setCurrentView("results");

    if (calculatedNewLevel > oldLevel) {
      setTimeout(() => setShowLevelUp(true), 500);
    }
  }, [currentQuiz, userProfile, lectureHistory, perfectScoresCount, isDaily, previousDailyScore, updateProfileMutation]);

  const handleConfidenceSubmit = useCallback((rating: number) => {
    const confidenceXP = rating * 5;

    const lecture: Omit<Lecture, "id"> = {
      title: currentLectureTitle,
      date: new Date().toISOString().split("T")[0],
      content: currentLectureContent,
      reviewScore: quizResult?.accuracyPercent || 0,
      xpEarned: (quizResult?.xpEarned || 0) + confidenceXP,
      incorrectTopics: weakTopics,
      confidenceRating: rating,
      dailyQuizzes: [],
    };

    addLectureMutation.mutate(lecture);

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

    updateProfileMutation.mutate(profileUpdate);

    const tempProfile = { ...userProfile, ...profileUpdate };
    const unlockedAchievements = checkAchievements(
      tempProfile,
      [...lectureHistory, { ...lecture, id: "temp" }],
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
  }, [currentLectureTitle, currentLectureContent, quizResult, weakTopics, userProfile, lectureHistory, perfectScoresCount, addLectureMutation, updateProfileMutation]);

  const handleDailyQuizComplete = useCallback(() => {
    if (!quizResult) return;

    const improvement = previousDailyScore !== undefined 
      ? quizResult.accuracyPercent - previousDailyScore 
      : 0;

    setCurrentView("dashboard");
    setQuizResult(null);
    setCurrentQuiz([]);
    setIsDaily(false);
    setPreviousDailyScore(undefined);
  }, [quizResult, previousDailyScore]);

  const handleLoadDemo = useCallback(() => {
    loadDemoMutation.mutate();
  }, [loadDemoMutation]);

  const handleUseHint = useCallback(() => {
    updateProfileMutation.mutate({
      powerUps: {
        ...userProfile.powerUps,
        hints: Math.max(0, userProfile.powerUps.hints - 1),
      },
    });
  }, [userProfile.powerUps, updateProfileMutation]);

  const handleUseSecondChance = useCallback(() => {
    updateProfileMutation.mutate({
      powerUps: {
        ...userProfile.powerUps,
        secondChance: Math.max(0, userProfile.powerUps.secondChance - 1),
      },
    });
  }, [userProfile.powerUps, updateProfileMutation]);

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
            onUpload={handleUpload}
            onBack={() => setCurrentView("dashboard")}
            isLoading={generateQuizMutation.isPending}
            error={generateQuizMutation.error?.message || null}
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
            isDaily={isDaily}
          />
        );

      case "results":
        return quizResult ? (
          <QuizResults
            result={quizResult}
            newAchievements={newAchievements}
            onContinue={() => {
              if (isDaily) {
                handleDailyQuizComplete();
              } else {
                setCurrentView("confidence");
              }
            }}
            isDaily={isDaily}
            previousScore={previousDailyScore}
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

      case "daily":
      case "dashboard":
      default:
        return (
          <Dashboard
            userProfile={userProfile}
            lectureHistory={lectureHistory}
            onStartUpload={() => setCurrentView("upload")}
            onStartDailyQuiz={() => generateDailyQuizMutation.mutate()}
            onLoadDemo={handleLoadDemo}
            onViewAchievements={() => setCurrentView("achievements")}
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
