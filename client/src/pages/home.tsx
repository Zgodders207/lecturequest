import { useState, useCallback } from "react";
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
} from "@/lib/game-utils";
import type { 
  UserProfile, 
  Lecture, 
  Question, 
  QuizResult, 
  Achievement 
} from "@shared/schema";
import { INITIAL_USER_PROFILE } from "@shared/schema";

type ViewType = "dashboard" | "upload" | "quiz" | "results" | "confidence" | "achievements" | "loading";

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

  const updateLectureMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lecture> }) => {
      const response = await apiRequest("PATCH", `/api/lectures/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lectures"] });
    },
  });

  const deleteLectureMutation = useMutation({
    mutationFn: async (lectureId: string) => {
      const response = await apiRequest("DELETE", `/api/lectures/${lectureId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lectures"] });
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
    onError: () => {
      setCurrentView("dashboard");
    },
  });

  const generateDailyQuizMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/generate-daily-quiz", {});
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentQuiz(data.questions);
      setDailyQuizPlanId(data.planId);
      setDailyQuizTopics(data.focusTopics || []);
      setIsDailyQuiz(true);
      setCurrentLectureId(null);
      setCurrentLectureTitle("Daily Quiz");
      setCurrentView("quiz");
    },
    onError: () => {
      setCurrentView("dashboard");
      setIsDailyQuiz(false);
    },
  });

  const completeDailyQuizMutation = useMutation({
    mutationFn: async ({ planId, score, topicScores }: { planId: string; score: number; topicScores: { topic: string; correct: boolean }[] }) => {
      const response = await apiRequest("POST", "/api/daily-quiz/complete", { planId, score, topicScores });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-quiz/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
    },
  });

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
    };

    addLectureMutation.mutate(lecture, {
      onSuccess: () => {
        setCurrentView("dashboard");
      },
    });
  }, [addLectureMutation]);

  const handleStartReview = useCallback((lectureId: string) => {
    const lecture = lectureHistory.find((l) => l.id === lectureId);
    if (!lecture) return;

    setIsDailyQuiz(false);
    setDailyQuizPlanId(null);
    setCurrentLectureId(lectureId);
    setCurrentLectureTitle(lecture.title);
    setCurrentLectureContent(lecture.content);
    setCurrentView("loading");
    generateQuizMutation.mutate({ content: lecture.content, title: lecture.title });
  }, [lectureHistory, generateQuizMutation]);

  const handleStartDailyQuiz = useCallback(() => {
    setIsDailyQuiz(true);
    setCurrentLectureId(null);
    setCurrentLectureTitle("Daily Quiz");
    setCurrentView("loading");
    generateDailyQuizMutation.mutate();
  }, [generateDailyQuizMutation]);

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

    updateProfileMutation.mutate(profileUpdate);

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
        updateProfileMutation.mutate({ powerUps: rewardPowerUps });
      }
    }

    // Complete daily quiz if applicable
    if (isDailyQuiz && dailyQuizPlanId) {
      const topicScores = currentQuiz.map((q: any, idx: number) => {
        const answer = answers.find(a => a.questionIndex === idx);
        return {
          topic: q.topic || "General",
          correct: answer?.isCorrect || false,
        };
      });
      completeDailyQuizMutation.mutate({
        planId: dailyQuizPlanId,
        score: accuracyPercent,
        topicScores,
      });
    }

    setCurrentView("results");

    if (calculatedNewLevel > oldLevel) {
      setTimeout(() => setShowLevelUp(true), 500);
    }
  }, [currentQuiz, currentLectureId, userProfile, lectureHistory, perfectScoresCount, updateProfileMutation, isDailyQuiz, dailyQuizPlanId, completeDailyQuizMutation]);

  const handleConfidenceSubmit = useCallback((rating: number) => {
    const confidenceXP = rating * 5;

    if (currentLectureId) {
      updateLectureMutation.mutate({
        id: currentLectureId,
        data: {
          reviewScore: quizResult?.accuracyPercent || 0,
          xpEarned: (quizResult?.xpEarned || 0) + confidenceXP,
          incorrectTopics: weakTopics.slice(),
          confidenceRating: rating,
          needsReview: false,
          lastReviewed: new Date().toISOString(),
        },
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

    updateProfileMutation.mutate(profileUpdate);

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
    setIsDailyQuiz(false);
    setDailyQuizPlanId(null);
    setDailyQuizTopics([]);
  }, [currentLectureId, quizResult, weakTopics, userProfile, lectureHistory, perfectScoresCount, updateLectureMutation, updateProfileMutation]);

  const handleUseHint = useCallback(() => {
    const updatedPowerUps = {
      ...userProfile.powerUps,
      hints: Math.max(0, userProfile.powerUps.hints - 1),
    };
    updateProfileMutation.mutate({ powerUps: updatedPowerUps });
  }, [userProfile.powerUps, updateProfileMutation]);

  const handleUseSecondChance = useCallback(() => {
    const updatedPowerUps = {
      ...userProfile.powerUps,
      secondChance: Math.max(0, userProfile.powerUps.secondChance - 1),
    };
    updateProfileMutation.mutate({ powerUps: updatedPowerUps });
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
            onSave={handleSaveLecture}
            onBack={() => setCurrentView("dashboard")}
            isSaving={addLectureMutation.isPending}
            error={addLectureMutation.error?.message || null}
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
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6" data-testid="view-loading">
            <div className="relative">
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
            onDeleteLecture={(id) => deleteLectureMutation.mutate(id)}
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
