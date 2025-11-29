import type { Express } from "express";
import { createServer, type Server } from "http";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { storage } from "./storage";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

const generateQuizRequestSchema = z.object({
  content: z.string().min(50, "Lecture content must be at least 50 characters"),
  title: z.string().optional(),
});

const generateDailyQuizRequestSchema = z.object({
  weakTopics: z.array(z.string()),
  previousScore: z.number(),
  confidenceLevel: z.number().min(1).max(5),
});

const updateProfileSchema = z.object({
  level: z.number().optional(),
  totalXP: z.number().optional(),
  xpToNextLevel: z.number().optional(),
  currentStreak: z.number().optional(),
  longestStreak: z.number().optional(),
  totalLectures: z.number().optional(),
  averageConfidence: z.number().optional(),
  achievements: z.array(z.any()).optional(),
  masteredTopics: z.array(z.string()).optional(),
  needsPractice: z.array(z.string()).optional(),
  powerUps: z.object({
    secondChance: z.number(),
    hints: z.number(),
    doubleXP: z.boolean(),
  }).optional(),
  lastActivityDate: z.string().optional(),
});

const addLectureSchema = z.object({
  title: z.string(),
  date: z.string(),
  content: z.string(),
  reviewScore: z.number(),
  xpEarned: z.number(),
  incorrectTopics: z.array(z.string()),
  confidenceRating: z.number(),
  dailyQuizzes: z.array(z.object({
    date: z.string(),
    score: z.number(),
    xpEarned: z.number(),
    improvement: z.number(),
  })),
});

function cleanJsonResponse(text: string): string {
  return text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/generate-quiz", async (req, res) => {
    try {
      const parsed = generateQuizRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: parsed.error.issues 
        });
      }

      const { content, title } = parsed.data;

      const prompt = `Generate exactly 5 multiple-choice questions based on this lecture content: 

${content}

Return ONLY valid JSON in this exact format:
[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correct": number (0-3),
    "explanation": "string"
  }
]

Important:
- Generate exactly 5 questions
- Each question must have exactly 4 options
- "correct" must be an index from 0 to 3
- Questions should test understanding, not just memorization
- Explanations should be helpful and supportive
- DO NOT include any text outside the JSON array`;

      const message = await anthropic.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });

      const responseText = message.content[0].type === "text" 
        ? message.content[0].text 
        : "";
      
      const cleanedResponse = cleanJsonResponse(responseText);
      
      let questions;
      try {
        questions = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("Failed to parse quiz response:", cleanedResponse);
        return res.status(500).json({ 
          error: "Failed to generate quiz. Please try again.",
          details: "Invalid JSON response from AI"
        });
      }

      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(500).json({ 
          error: "Failed to generate quiz questions. Please try again." 
        });
      }

      const validatedQuestions = questions.map((q: any, index: number) => ({
        question: String(q.question || `Question ${index + 1}`),
        options: Array.isArray(q.options) && q.options.length === 4 
          ? q.options.map(String) 
          : ["Option A", "Option B", "Option C", "Option D"],
        correct: typeof q.correct === "number" && q.correct >= 0 && q.correct <= 3 
          ? q.correct 
          : 0,
        explanation: String(q.explanation || "Great attempt! Keep learning."),
      }));

      res.json({ 
        questions: validatedQuestions,
        title: title || "Lecture Review"
      });

    } catch (error: any) {
      console.error("Quiz generation error:", error);
      
      if (error.status === 401) {
        return res.status(500).json({ 
          error: "API configuration error. Please check your settings." 
        });
      }
      
      if (error.status === 429) {
        return res.status(429).json({ 
          error: "Too many requests. Please wait a moment and try again." 
        });
      }

      res.status(500).json({ 
        error: "Failed to generate quiz. Please try again.",
        details: error.message 
      });
    }
  });

  app.post("/api/generate-daily-quiz", async (req, res) => {
    try {
      const parsed = generateDailyQuizRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: parsed.error.issues 
        });
      }

      const { weakTopics, previousScore, confidenceLevel } = parsed.data;

      const topicsString = weakTopics.length > 0 
        ? weakTopics.join(", ") 
        : "general knowledge concepts";

      const prompt = `Generate 3-5 targeted multiple-choice questions focusing on these weak areas: ${topicsString}

Student context:
- Previous quiz score: ${previousScore}%
- Confidence level: ${confidenceLevel}/5

Return ONLY valid JSON in this exact format:
[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correct": number (0-3),
    "explanation": "string"
  }
]

Important:
- Generate 3-5 questions (4 is ideal)
- Focus specifically on the weak topics mentioned
- Each question must have exactly 4 options
- "correct" must be an index from 0 to 3
- Make questions progressively challenging
- Use different question styles (application, analysis, synthesis)
- Explanations should be encouraging and educational
- DO NOT include any text outside the JSON array`;

      const message = await anthropic.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });

      const responseText = message.content[0].type === "text" 
        ? message.content[0].text 
        : "";
      
      const cleanedResponse = cleanJsonResponse(responseText);
      
      let questions;
      try {
        questions = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("Failed to parse daily quiz response:", cleanedResponse);
        return res.status(500).json({ 
          error: "Failed to generate daily quiz. Please try again.",
          details: "Invalid JSON response from AI"
        });
      }

      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(500).json({ 
          error: "Failed to generate quiz questions. Please try again." 
        });
      }

      const validatedQuestions = questions.map((q: any, index: number) => ({
        question: String(q.question || `Question ${index + 1}`),
        options: Array.isArray(q.options) && q.options.length === 4 
          ? q.options.map(String) 
          : ["Option A", "Option B", "Option C", "Option D"],
        correct: typeof q.correct === "number" && q.correct >= 0 && q.correct <= 3 
          ? q.correct 
          : 0,
        explanation: String(q.explanation || "Keep practicing! You're making progress."),
      }));

      res.json({ 
        questions: validatedQuestions,
        focusTopics: weakTopics
      });

    } catch (error: any) {
      console.error("Daily quiz generation error:", error);
      
      if (error.status === 401) {
        return res.status(500).json({ 
          error: "API configuration error. Please check your settings." 
        });
      }
      
      if (error.status === 429) {
        return res.status(429).json({ 
          error: "Too many requests. Please wait a moment and try again." 
        });
      }

      res.status(500).json({ 
        error: "Failed to generate daily quiz. Please try again.",
        details: error.message 
      });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/profile", (req, res) => {
    try {
      const profile = storage.getUserProfile();
      res.json(profile);
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.patch("/api/profile", (req, res) => {
    try {
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: parsed.error.issues 
        });
      }
      const updatedProfile = storage.updateUserProfile(parsed.data);
      res.json(updatedProfile);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.post("/api/profile/reset", (req, res) => {
    try {
      const profile = storage.resetUserProfile();
      res.json(profile);
    } catch (error: any) {
      console.error("Error resetting profile:", error);
      res.status(500).json({ error: "Failed to reset profile" });
    }
  });

  app.post("/api/profile/demo", (req, res) => {
    try {
      const data = storage.loadDemoData();
      res.json(data);
    } catch (error: any) {
      console.error("Error loading demo data:", error);
      res.status(500).json({ error: "Failed to load demo data" });
    }
  });

  app.get("/api/lectures", (req, res) => {
    try {
      const lectures = storage.getLectures();
      res.json(lectures);
    } catch (error: any) {
      console.error("Error fetching lectures:", error);
      res.status(500).json({ error: "Failed to fetch lectures" });
    }
  });

  app.get("/api/lectures/:id", (req, res) => {
    try {
      const lecture = storage.getLecture(req.params.id);
      if (!lecture) {
        return res.status(404).json({ error: "Lecture not found" });
      }
      res.json(lecture);
    } catch (error: any) {
      console.error("Error fetching lecture:", error);
      res.status(500).json({ error: "Failed to fetch lecture" });
    }
  });

  app.post("/api/lectures", (req, res) => {
    try {
      const parsed = addLectureSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: parsed.error.issues 
        });
      }
      const lecture = storage.addLecture(parsed.data);
      res.json(lecture);
    } catch (error: any) {
      console.error("Error adding lecture:", error);
      res.status(500).json({ error: "Failed to add lecture" });
    }
  });

  app.get("/api/weak-topics", (req, res) => {
    try {
      const topics = storage.getWeakTopics();
      res.json(topics);
    } catch (error: any) {
      console.error("Error fetching weak topics:", error);
      res.status(500).json({ error: "Failed to fetch weak topics" });
    }
  });

  return httpServer;
}
