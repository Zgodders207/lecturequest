import type { Express } from "express";
import { createServer, type Server } from "http";
import { createRequire } from "module";
import { promises as dns } from "dns";
import https from "https";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import type { CalendarEvent, CalendarSettings } from "@shared/schema";
import { calendarSettingsSchema } from "@shared/schema";
import type { VEvent } from "node-ical";

const require = createRequire(import.meta.url);
const nodeIcalModule = require("node-ical");

async function parsePdf(buffer: Buffer): Promise<{ text: string }> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  
  const data = new Uint8Array(buffer);
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  
  let fullText = "";
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    let lastY: number | null = null;
    const lines: string[] = [];
    let currentLine = "";
    
    for (const item of textContent.items) {
      if (!('str' in item) || !item.str) continue;
      
      const itemAny = item as any;
      const y = itemAny.transform ? itemAny.transform[5] : null;
      
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 5) {
        if (currentLine.trim()) {
          lines.push(currentLine.trim());
        }
        currentLine = item.str;
      } else {
        currentLine += (currentLine ? " " : "") + item.str;
      }
      
      lastY = y;
    }
    
    if (currentLine.trim()) {
      lines.push(currentLine.trim());
    }
    
    fullText += lines.join("\n") + "\n";
  }
  
  return { text: fullText };
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

const generateQuizRequestSchema = z.object({
  content: z.string().min(50, "Lecture content must be at least 50 characters").optional(),
  lectureId: z.string().optional(),
  title: z.string().optional(),
}).refine(
  (data) => data.content || data.lectureId,
  { message: "Either content or lectureId must be provided" }
);

const generateDailyQuizRequestSchema = z.object({
  weakTopics: z.array(z.string()),
  previousScore: z.number(),
  confidenceLevel: z.number().min(1).max(5),
});

const achievementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(),
  unlocked: z.boolean(),
  unlockedDate: z.string().optional(),
  progress: z.number().optional(),
  maxProgress: z.number().optional(),
});

const powerUpsSchema = z.object({
  secondChance: z.number().min(0),
  hints: z.number().min(0),
  doubleXP: z.boolean(),
});

const updateProfileSchema = z.object({
  level: z.number().min(1).optional(),
  totalXP: z.number().min(0).optional(),
  xpToNextLevel: z.number().min(0).optional(),
  currentStreak: z.number().min(0).optional(),
  longestStreak: z.number().min(0).optional(),
  totalLectures: z.number().min(0).optional(),
  averageConfidence: z.number().min(0).max(5).optional(),
  achievements: z.array(achievementSchema).optional(),
  masteredTopics: z.array(z.string()).optional(),
  needsPractice: z.array(z.string()).optional(),
  powerUps: powerUpsSchema.optional(),
  lastActivityDate: z.string().optional(),
}).strict();

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
  needsReview: z.boolean(),
  lastReviewed: z.string().optional(),
});

const transferableSkillSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.enum(["cognitive", "technical", "communication", "interpersonal", "organizational"]),
  relevantCareers: z.array(z.string()),
  proficiencyLevel: z.enum(["developing", "intermediate", "proficient"]),
});

const updateLectureSchema = z.object({
  title: z.string().optional(),
  reviewScore: z.number().optional(),
  xpEarned: z.number().optional(),
  incorrectTopics: z.array(z.string()).optional(),
  confidenceRating: z.number().optional(),
  needsReview: z.boolean().optional(),
  lastReviewed: z.string().optional(),
  identifiedSkills: z.array(transferableSkillSchema).optional(),
  questionsAnswered: z.number().optional(),
});

function cleanJsonResponse(text: string): string {
  return text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
}

function classifyEventType(summary: string, description?: string): "lecture" | "workshop" | "tutorial" | "exam" | "other" {
  const text = `${summary} ${description || ""}`.toLowerCase();
  
  if (text.includes("quiz") || text.includes("exam") || text.includes("test") || text.includes("assessment")) return "exam";
  if (text.includes("workshop")) return "workshop";
  if (text.includes("tutorial") || text.includes("seminar")) return "tutorial";
  if (text.includes("lab") || text.includes("practical")) return "other";
  if (text.includes("lecture") || text.includes("lec")) return "lecture";
  
  const examPatterns = /\b(quiz|exam|test|midterm|final|assessment)\b/i;
  const workshopPatterns = /\b(wkshp|works?hop)\b/i;
  const tutorialPatterns = /\b(tut|tutorial|sem|seminar)\b/i;
  
  if (examPatterns.test(text)) return "exam";
  if (workshopPatterns.test(text)) return "workshop";
  if (tutorialPatterns.test(text)) return "tutorial";
  
  return "lecture";
}

function isPrivateIP(ip: string): boolean {
  const ipv4Private = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\./,
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
    /^192\.0\.0\./,
    /^192\.0\.2\./,
    /^198\.18\./,
    /^198\.19\./,
    /^198\.51\.100\./,
    /^203\.0\.113\./,
    /^22[4-9]\./,
    /^23\d\./,
    /^24\d\./,
    /^25[0-5]\./,
  ];
  
  const ipv6Private = [
    /^::1$/i,
    /^::$/,
    /^fc00:/i,
    /^fd00:/i,
    /^fe80:/i,
    /^ff/i,
    /^::ffff:127\./i,
    /^::ffff:10\./i,
    /^::ffff:172\.(1[6-9]|2\d|3[01])\./i,
    /^::ffff:192\.168\./i,
    /^::ffff:169\.254\./i,
    /^::ffff:0\./i,
    /^::ffff:100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./i,
    /^::ffff:192\.0\.0\./i,
    /^::ffff:192\.0\.2\./i,
    /^::ffff:198\.18\./i,
    /^::ffff:198\.19\./i,
    /^::ffff:198\.51\.100\./i,
    /^::ffff:203\.0\.113\./i,
    /^::ffff:22[4-9]\./i,
    /^::ffff:23\d\./i,
    /^::ffff:24\d\./i,
    /^::ffff:25[0-5]\./i,
  ];
  
  return ipv4Private.some(p => p.test(ip)) || ipv6Private.some(p => p.test(ip));
}

function validateCalendarUrlBasic(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString);
    
    if (url.protocol !== "https:") {
      return { valid: false, error: "Only HTTPS URLs are allowed for security" };
    }
    
    if (url.username || url.password) {
      return { valid: false, error: "URLs with credentials are not allowed" };
    }
    
    const pathname = url.pathname.toLowerCase();
    const fullUrl = urlString.toLowerCase();
    const isIcsFile = pathname.includes(".ics") || fullUrl.includes(".ics");
    const isIcalEndpoint = pathname.includes("/ical") || pathname.includes("/calendar");
    if (!isIcsFile && !isIcalEndpoint) {
      return { valid: false, error: "URL must be an ICS calendar feed" };
    }
    
    const hostname = url.hostname.toLowerCase();
    
    const blockedHosts = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]", "internal", "intranet", "local"];
    if (blockedHosts.some(h => hostname === h || hostname.endsWith("." + h))) {
      return { valid: false, error: "Internal addresses are not allowed" };
    }
    
    if (hostname.endsWith(".local") || hostname.endsWith(".internal") || hostname.endsWith(".localhost")) {
      return { valid: false, error: "Local domain suffixes are not allowed" };
    }
    
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return { valid: false, error: "Direct IP addresses are not allowed. Please use a domain name." };
    }
    
    if (/^\[.*\]$/.test(hostname)) {
      return { valid: false, error: "IPv6 addresses are not allowed. Please use a domain name." };
    }
    
    const suspiciousDomains = [".nip.io", ".sslip.io", ".xip.io", ".localtest.me"];
    if (suspiciousDomains.some(d => hostname.endsWith(d))) {
      return { valid: false, error: "This domain type is not allowed" };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }
}

async function validateCalendarUrlWithDns(urlString: string): Promise<{ valid: boolean; error?: string }> {
  const basicValidation = validateCalendarUrlBasic(urlString);
  if (!basicValidation.valid) {
    return basicValidation;
  }
  
  try {
    const url = new URL(urlString);
    const hostname = url.hostname;
    
    const addresses = await dns.lookup(hostname, { all: true });
    
    for (const addr of addresses) {
      if (isPrivateIP(addr.address)) {
        return { valid: false, error: "Calendar URL resolves to a private network address" };
      }
    }
    
    return { valid: true };
  } catch (error: any) {
    if (error.code === "ENOTFOUND" || error.code === "ENODATA") {
      return { valid: false, error: "Could not resolve calendar domain name" };
    }
    return { valid: false, error: "Failed to validate calendar URL" };
  }
}

async function validateAndResolveUrl(urlString: string): Promise<{ valid: boolean; error?: string; address?: string; family?: number }> {
  const basicValidation = validateCalendarUrlBasic(urlString);
  if (!basicValidation.valid) {
    return basicValidation;
  }
  
  try {
    const url = new URL(urlString);
    const hostname = url.hostname;
    
    const addresses = await dns.lookup(hostname, { all: true });
    
    for (const addr of addresses) {
      if (!isPrivateIP(addr.address)) {
        return { valid: true, address: addr.address, family: addr.family };
      }
    }
    
    return { valid: false, error: "All resolved IPs are private/reserved" };
  } catch (error: any) {
    if (error.code === "ENOTFOUND" || error.code === "ENODATA") {
      return { valid: false, error: "Could not resolve calendar domain name" };
    }
    return { valid: false, error: "Failed to validate calendar URL" };
  }
}

async function safeFetchIcsContent(urlString: string, maxRedirects = 5): Promise<{ content: string; error?: string }> {
  let currentUrl = urlString;
  let redirectCount = 0;
  
  while (redirectCount < maxRedirects) {
    const validation = await validateAndResolveUrl(currentUrl);
    if (!validation.valid) {
      return { content: "", error: validation.error };
    }
    
    const validatedAddress = validation.address!;
    const validatedFamily = validation.family!;
    
    const result = await new Promise<{ content: string; redirect?: string; error?: string }>((resolve) => {
      const url = new URL(currentUrl);
      
      const customLookup: typeof dns.lookup = (
        _hostname: string,
        options: any,
        callback: (err: NodeJS.ErrnoException | null, address: string | dns.LookupAddress[], family?: number) => void
      ) => {
        if (typeof options === "function") {
          callback = options;
          options = {};
        }
        if (options && options.all) {
          callback(null, [{ address: validatedAddress, family: validatedFamily }]);
        } else {
          callback(null, validatedAddress, validatedFamily);
        }
      };
      
      const options: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: "GET",
        headers: {
          "User-Agent": "LectureQuest/1.0",
          "Accept": "text/calendar, */*",
        },
        timeout: 30000,
        lookup: customLookup as any,
      };
      
      const req = https.request(options, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve({ content: "", redirect: res.headers.location });
          return;
        }
        
        if (res.statusCode && res.statusCode >= 400) {
          resolve({ content: "", error: `HTTP error: ${res.statusCode}` });
          return;
        }
        
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const content = Buffer.concat(chunks).toString("utf-8");
          resolve({ content });
        });
        res.on("error", (err) => resolve({ content: "", error: err.message }));
      });
      
      req.on("error", (err) => resolve({ content: "", error: err.message }));
      req.on("timeout", () => {
        req.destroy();
        resolve({ content: "", error: "Request timeout" });
      });
      
      req.end();
    });
    
    if (result.error) {
      return { content: "", error: result.error };
    }
    
    if (result.redirect) {
      const absoluteUrl = new URL(result.redirect, currentUrl).toString();
      currentUrl = absoluteUrl;
      redirectCount++;
      continue;
    }
    
    return { content: result.content };
  }
  
  return { content: "", error: "Too many redirects" };
}

async function fetchAndParseCalendar(url: string): Promise<{ events: CalendarEvent[]; error?: string }> {
  try {
    const { content, error: fetchError } = await safeFetchIcsContent(url);
    if (fetchError) {
      return { events: [], error: fetchError };
    }
    
    const events = nodeIcalModule.parseICS(content);
    const calendarEvents: CalendarEvent[] = [];
    
    for (const [key, event] of Object.entries(events)) {
      const eventAny = event as any;
      if (eventAny.type !== "VEVENT") continue;
      
      const vevent = event as VEvent;
      const summary = vevent.summary || "Untitled Event";
      const description = vevent.description || "";
      
      const eventType = classifyEventType(summary, description);
      
      const startDate = vevent.start;
      const endDate = vevent.end;
      
      if (!startDate) continue;
      
      const calEvent: CalendarEvent = {
        id: randomUUID(),
        uid: vevent.uid || key,
        title: summary,
        eventType,
        startsAt: startDate instanceof Date ? startDate.toISOString() : String(startDate),
        endsAt: endDate instanceof Date ? endDate.toISOString() : (startDate instanceof Date ? startDate.toISOString() : String(startDate)),
        location: vevent.location,
        description: description.substring(0, 500),
      };
      
      calendarEvents.push(calEvent);
    }
    
    calendarEvents.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
    
    return { events: calendarEvents };
  } catch (error: any) {
    console.error("Calendar fetch error:", error);
    return { events: [], error: error.message || "Failed to fetch calendar" };
  }
}

function extractTitleFromText(text: string): string | null {
  const lines = text.split(/[\n\r]+/).map(line => line.trim()).filter(line => line.length > 0);
  
  let subjectTitle: string | null = null;
  const fallbackCandidates: string[] = [];
  
  for (let i = 0; i < Math.min(30, lines.length); i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    if (line.startsWith("#")) {
      const title = line.replace(/^#+\s*/, "").trim();
      if (title.length >= 5 && title.length <= 80) {
        return title;
      }
    }
    
    if (
      lowerLine.includes("©") ||
      lowerLine.includes("copyright") ||
      lowerLine.includes("all rights reserved") ||
      lowerLine.includes("confidential") ||
      lowerLine.includes("cisco") ||
      /^\d+$/.test(lowerLine) ||
      /^page\s+\d+/.test(lowerLine) ||
      line.length < 5 ||
      line.length > 80
    ) {
      continue;
    }
    
    if (
      lowerLine.includes("objective") ||
      lowerLine.includes("description") ||
      lowerLine.includes("topic title") ||
      lowerLine.includes("topic objective") ||
      lowerLine.startsWith("module title:") ||
      lowerLine.startsWith("chapter title:") ||
      lowerLine.startsWith("lecture title:")
    ) {
      continue;
    }
    
    const moduleMatch = line.match(/^(?:Module|Chapter|Unit|Lecture)\s+\d+\s*[:\-–]\s*(.+)/i);
    if (moduleMatch && moduleMatch[1]) {
      const extracted = moduleMatch[1].trim();
      if (extracted.length >= 5 && extracted.length <= 80) {
        subjectTitle = extracted;
        continue;
      }
    }
    
    if (!subjectTitle && line.length >= 8 && line.length <= 60) {
      if (!lowerLine.includes(":") && !lowerLine.match(/^[\d.]+\s/)) {
        fallbackCandidates.push(line);
      }
    }
  }
  
  if (subjectTitle) {
    return subjectTitle;
  }
  
  if (fallbackCandidates.length > 0) {
    return fallbackCandidates[0];
  }
  
  return null;
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

      const { content: providedContent, lectureId, title } = parsed.data;

      let content = providedContent;
      
      if (lectureId && !content) {
        const lectureContent = await storage.getLectureContent(lectureId);
        if (!lectureContent) {
          return res.status(404).json({
            error: "Lecture not found",
            message: `No lecture content found for lectureId: ${lectureId}`
          });
        }
        content = lectureContent;
      }

      if (!content) {
        return res.status(400).json({
          error: "No content available",
          message: "Either provide content directly or a valid lectureId"
        });
      }

      const prompt = `Analyze this lecture content and generate a quiz with transferable skills identification.

LECTURE CONTENT:
${content}

Return ONLY valid JSON in this exact format:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correct": number (0-3),
      "explanation": "string",
      "topic": "string (specific concept being tested)"
    }
  ],
  "skills": [
    {
      "name": "string (e.g. 'Analytical Thinking', 'Problem Solving', 'Systems Design')",
      "description": "string (1 sentence explaining how this lecture develops this skill)",
      "category": "cognitive|technical|communication|interpersonal|organizational",
      "relevantCareers": ["string", "string", "string"]
    }
  ]
}

Requirements:
- Generate exactly 10 questions
- Each question must have exactly 4 options
- "correct" must be an index from 0 to 3
- Questions should test understanding, not just memorization
- The "topic" field must be a specific, descriptive concept name (not generic words)
- Identify 3-5 transferable skills that students develop by mastering this content
- Skills should be career-relevant (e.g., "Critical Analysis", "Data Interpretation", "Logical Reasoning", "Technical Communication")
- Map each skill to 2-3 relevant career paths
- DO NOT include any text outside the JSON object`;

      const message = await anthropic.messages.create({
        model: DEFAULT_MODEL,
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });

      const responseText = message.content[0].type === "text" 
        ? message.content[0].text 
        : "";
      
      const cleanedResponse = cleanJsonResponse(responseText);
      
      let quizResponse;
      try {
        quizResponse = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("Failed to parse quiz response:", cleanedResponse);
        return res.status(500).json({ 
          error: "Failed to generate quiz. Please try again.",
          details: "Invalid JSON response from AI"
        });
      }

      // Handle both old array format and new object format
      const questions = Array.isArray(quizResponse) ? quizResponse : quizResponse.questions;
      const skills = Array.isArray(quizResponse) ? [] : (quizResponse.skills || []);

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
        topic: String(q.topic || "General Concept"),
      }));

      const validatedSkills = skills.map((s: any) => ({
        name: String(s.name || "General Skill"),
        description: String(s.description || "Developed through this lecture"),
        category: ["cognitive", "technical", "communication", "interpersonal", "organizational"].includes(s.category) 
          ? s.category 
          : "cognitive",
        relevantCareers: Array.isArray(s.relevantCareers) 
          ? s.relevantCareers.map(String).slice(0, 5)
          : ["Various Industries"],
        proficiencyLevel: "developing" as const,
      }));

      res.json({ 
        questions: validatedQuestions,
        skills: validatedSkills,
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

  // Get daily quiz status - shows due topics using active recall algorithm
  app.get("/api/daily-quiz/status", async (req, res) => {
    try {
      const dueTopics = await storage.getDueTopics(10);
      const currentPlan = await storage.getCurrentDailyQuizPlan();
      const lectures = await storage.getLectures();
      const profile = await storage.getUserProfile();
      
      // Get topic count from all lectures
      const allTopics = new Set<string>();
      lectures.forEach(lecture => {
        lecture.incorrectTopics.forEach(topic => allTopics.add(topic));
      });
      
      res.json({
        hasDueTopics: dueTopics.length > 0,
        dueTopicsCount: dueTopics.length,
        totalTopicsTracked: allTopics.size,
        dueTopics: dueTopics.map(t => ({
          topic: t.topic,
          lectureTitle: t.lectureTitle,
          lastScore: t.lastScore,
          daysSinceReview: Math.floor((new Date().getTime() - new Date(t.lastReviewed).getTime()) / (1000 * 60 * 60 * 24)),
          streak: t.streak,
          isOverdue: new Date(t.nextDue) < new Date(),
        })),
        currentPlan: currentPlan ? {
          id: currentPlan.id,
          topicsCount: currentPlan.topics.length,
          generatedAt: currentPlan.generatedAt,
          completed: currentPlan.completed,
        } : null,
        weeklyStreak: profile.currentStreak,
      });
    } catch (error: any) {
      console.error("Daily quiz status error:", error);
      res.status(500).json({ error: "Failed to get daily quiz status" });
    }
  });

  // Generate daily quiz using server-side active recall topic selection
  app.post("/api/generate-daily-quiz", async (req, res) => {
    try {
      // Get due topics from spaced repetition algorithm
      const dueTopics = await storage.getDueTopics(10);
      const lectures = await storage.getLectures();
      const profile = await storage.getUserProfile();
      
      // If no tracked topics yet, use weak topics from lectures
      let topicsToReview: { topic: string; lectureId: string; lectureTitle: string; priority: number; reason: "due" | "weak" | "overdue" | "new"; daysSinceReview: number }[] = [];
      
      if (dueTopics.length > 0) {
        // Use spaced repetition algorithm results
        const today = new Date();
        topicsToReview = dueTopics.map(t => {
          const nextDue = new Date(t.nextDue);
          const daysSinceDue = Math.floor((today.getTime() - nextDue.getTime()) / (1000 * 60 * 60 * 24));
          const daysSinceReview = Math.floor((today.getTime() - new Date(t.lastReviewed).getTime()) / (1000 * 60 * 60 * 24));
          
          let reason: "due" | "weak" | "overdue" | "new" = "due";
          if (daysSinceDue > 3) reason = "overdue";
          else if (t.lastScore < 70) reason = "weak";
          else if (t.reviewCount <= 1) reason = "new";
          
          return {
            topic: t.topic,
            lectureId: t.lectureId,
            lectureTitle: t.lectureTitle,
            priority: t.lastScore < 70 ? 100 - t.lastScore : 50 + daysSinceDue * 5,
            reason,
            daysSinceReview,
          };
        });
      } else {
        // Fallback: Use incorrect topics from lectures for first-time users
        const weakTopicsSet = new Map<string, { lectureId: string; lectureTitle: string; score: number }>();
        
        lectures.forEach(lecture => {
          lecture.incorrectTopics.forEach(topic => {
            if (!weakTopicsSet.has(topic) || weakTopicsSet.get(topic)!.score > lecture.reviewScore) {
              weakTopicsSet.set(topic, {
                lectureId: lecture.id,
                lectureTitle: lecture.title,
                score: lecture.reviewScore,
              });
            }
          });
        });
        
        topicsToReview = Array.from(weakTopicsSet.entries()).map(([topic, data]) => ({
          topic,
          lectureId: data.lectureId,
          lectureTitle: data.lectureTitle,
          priority: 100 - data.score,
          reason: "weak" as const,
          daysSinceReview: 0,
        }));
      }
      
      if (topicsToReview.length === 0) {
        return res.status(400).json({
          error: "No topics to review",
          message: "Complete some lecture quizzes first to build your review schedule."
        });
      }
      
      // Sort by priority and take top topics
      topicsToReview.sort((a, b) => b.priority - a.priority);
      const selectedTopics = topicsToReview.slice(0, 10);
      
      // Get full lecture content for context (use actual content from database)
      const lectureExcerpts: { lectureId: string; excerpt: string }[] = [];
      const seenLectures = new Set<string>();
      for (const t of selectedTopics) {
        if (!seenLectures.has(t.lectureId)) {
          const lectureContent = await storage.getLectureContent(t.lectureId);
          const lecture = lectures.find(l => l.id === t.lectureId);
          if (lecture && lectureContent) {
            lectureExcerpts.push({
              lectureId: t.lectureId,
              excerpt: lectureContent.substring(0, 2000) + (lectureContent.length > 2000 ? "..." : ""),
            });
            seenLectures.add(t.lectureId);
          }
        }
      }
      
      // Build prompt with active recall focus
      const topicsList = selectedTopics.map(t => {
        const reasonText = t.reason === "overdue" ? "(overdue)" :
                          t.reason === "weak" ? "(needs practice)" :
                          t.reason === "new" ? "(recently learned)" : "";
        return `- ${t.topic} from "${t.lectureTitle}" ${reasonText}`;
      }).join("\n");
      
      const excerptContext = lectureExcerpts.map(e => {
        const lecture = lectures.find(l => l.id === e.lectureId);
        return `Lecture: ${lecture?.title || "Unknown"}\nContent: ${e.excerpt}`;
      }).join("\n\n");

      const prompt = `Generate exactly 10 targeted multiple-choice questions using active recall principles for these topics that need review:

${topicsList}

Context from the student's lectures:
${excerptContext}

Student Progress:
- Current streak: ${profile.currentStreak} days
- Average confidence: ${profile.averageConfidence.toFixed(1)}/5

Active Recall Instructions:
1. Questions should test RETRIEVAL of knowledge, not recognition
2. Include questions that require connecting concepts across topics
3. Use varied question formats (application, analysis, comparison)
4. Focus on the "why" and "how" not just the "what"
5. Include some questions that require recalling specific details
6. Base questions on the actual lecture content provided above

Return ONLY valid JSON in this exact format:
[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correct": number (0-3),
    "explanation": "string",
    "topic": "string (which topic this tests)"
  }
]

Important:
- Generate exactly 10 questions
- Each question must have exactly 4 options
- "correct" must be an index from 0 to 3
- Explanations should reinforce learning and encourage spaced repetition
- Include the topic field to track which topic each question tests
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
        topic: String(q.topic || selectedTopics[index % selectedTopics.length]?.topic || "General"),
      }));

      // Create and store the daily quiz plan
      const planId = `plan-${Date.now()}`;
      const plan = await storage.setCurrentDailyQuizPlan({
        id: planId,
        generatedAt: new Date().toISOString(),
        topics: selectedTopics,
        lectureExcerpts,
        completed: false,
      });

      res.json({ 
        questions: validatedQuestions,
        planId: plan.id,
        focusTopics: selectedTopics.map(t => ({
          topic: t.topic,
          lectureTitle: t.lectureTitle,
          reason: t.reason,
          daysSinceReview: t.daysSinceReview,
        })),
        spacedRepetitionInfo: {
          totalDueTopics: dueTopics.length,
          selectedCount: selectedTopics.length,
          overdueCount: selectedTopics.filter(t => t.reason === "overdue").length,
          weakCount: selectedTopics.filter(t => t.reason === "weak").length,
        }
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

  // Complete daily quiz and update spaced repetition stats
  app.post("/api/daily-quiz/complete", async (req, res) => {
    try {
      const { planId, score, topicScores } = req.body;
      
      if (typeof score !== "number" || score < 0 || score > 100) {
        return res.status(400).json({ error: "Invalid score" });
      }
      
      const currentPlan = await storage.getCurrentDailyQuizPlan();
      if (!currentPlan || currentPlan.id !== planId) {
        return res.status(400).json({ error: "Invalid or expired quiz plan" });
      }
      
      // Update spaced repetition stats for each topic
      if (Array.isArray(topicScores)) {
        for (const ts of topicScores as { topic: string; correct: boolean; lectureId?: string }[]) {
          const topicScore = ts.correct ? 100 : 0;
          const topicData = currentPlan.topics.find(t => t.topic === ts.topic);
          if (topicData) {
            await storage.updateTopicReviewStats(
              ts.topic,
              topicData.lectureId,
              topicData.lectureTitle,
              topicScore
            );
            
            // Add review event
            await storage.addReviewEvent({
              topicId: ts.topic,
              topic: ts.topic,
              lectureId: topicData.lectureId,
              date: new Date().toISOString(),
              score: topicScore,
              wasCorrect: ts.correct,
            });
          }
        }
      }
      
      // Complete the plan
      const completedPlan = await storage.completeDailyQuizPlan(score);
      
      // Update user profile with activity
      const profile = await storage.getUserProfile();
      const today = new Date().toISOString().split('T')[0];
      const lastActivity = profile.lastActivityDate;
      
      let newStreak = profile.currentStreak;
      if (lastActivity) {
        const lastDate = new Date(lastActivity);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          newStreak = profile.currentStreak + 1;
        } else if (daysDiff > 1) {
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
      
      await storage.updateUserProfile({
        lastActivityDate: today,
        currentStreak: newStreak,
        longestStreak: Math.max(profile.longestStreak, newStreak),
      });
      
      const nextDueTopics = await storage.getDueTopics(5);
      res.json({
        success: true,
        completedPlan,
        newStreak,
        nextReviewSummary: nextDueTopics.map(t => ({
          topic: t.topic,
          nextDue: t.nextDue,
          interval: t.interval,
        })),
      });
    } catch (error: any) {
      console.error("Complete daily quiz error:", error);
      res.status(500).json({ error: "Failed to complete daily quiz" });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/parse-file", async (req, res) => {
    try {
      const { fileData, fileType, fileName } = req.body;
      
      if (!fileData || !fileType) {
        return res.status(400).json({ error: "Missing file data or type" });
      }

      let extractedText = "";
      let title = fileName?.replace(/\.[^/.]+$/, "") || "Untitled";

      if (fileType === "application/pdf" || fileName?.endsWith(".pdf")) {
        try {
          const buffer = Buffer.from(fileData, "base64");
          const pdfData = await parsePdf(buffer);
          const rawText = pdfData.text || "";
          
          const extractedTitle = extractTitleFromText(rawText);
          if (extractedTitle) {
            title = extractedTitle;
          }
          
          extractedText = rawText
            .replace(/\x00/g, "")
            .replace(/[^\x20-\x7E\n\r\t]/g, " ")
            .replace(/\s+/g, " ")
            .trim();
          
          if (!extractedText || extractedText.length < 50) {
            return res.status(400).json({ 
              error: "Could not extract enough text from PDF. The PDF might be image-based or encrypted. Please try copying the text manually." 
            });
          }
        } catch (pdfError: any) {
          console.error("PDF parsing error:", pdfError);
          return res.status(400).json({ 
            error: "Failed to parse PDF file. Please ensure it's a valid text-based PDF or try copying the content manually." 
          });
        }
      } else if (fileType === "text/html" || fileName?.endsWith(".html") || fileName?.endsWith(".htm")) {
        try {
          const htmlContent = Buffer.from(fileData, "base64").toString("utf-8");
          extractedText = htmlContent
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/&nbsp;/g, " ")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/\s+/g, " ")
            .trim();
          
          const titleMatch = htmlContent.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            title = titleMatch[1].trim();
          }
        } catch (htmlError: any) {
          console.error("HTML parsing error:", htmlError);
          return res.status(400).json({ error: "Failed to parse HTML file" });
        }
      } else if (fileType === "text/plain" || fileName?.endsWith(".txt")) {
        extractedText = Buffer.from(fileData, "base64").toString("utf-8");
      } else {
        return res.status(400).json({ 
          error: "Unsupported file type. Please upload PDF, HTML, or TXT files." 
        });
      }

      if (!extractedText || extractedText.trim().length < 50) {
        return res.status(400).json({ 
          error: "Extracted text is too short (minimum 50 characters required)" 
        });
      }

      res.json({ 
        text: extractedText.trim(),
        title,
        characterCount: extractedText.length
      });

    } catch (error: any) {
      console.error("File parsing error:", error);
      res.status(500).json({ error: "Failed to parse file" });
    }
  });

  app.get("/api/profile", async (req, res) => {
    try {
      const profile = await storage.getUserProfile();
      res.json(profile);
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.patch("/api/profile", async (req, res) => {
    try {
      const parsed = updateProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: parsed.error.issues 
        });
      }
      const updatedProfile = await storage.updateUserProfile(parsed.data);
      res.json(updatedProfile);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.post("/api/profile/reset", async (req, res) => {
    try {
      const profile = await storage.resetUserProfile();
      res.json(profile);
    } catch (error: any) {
      console.error("Error resetting profile:", error);
      res.status(500).json({ error: "Failed to reset profile" });
    }
  });

  app.post("/api/profile/demo", async (req, res) => {
    try {
      const data = await storage.loadDemoData();
      res.json(data);
    } catch (error: any) {
      console.error("Error loading demo data:", error);
      res.status(500).json({ error: "Failed to load demo data" });
    }
  });

  app.get("/api/lectures", async (req, res) => {
    try {
      const lectures = await storage.getLectures();
      res.json(lectures);
    } catch (error: any) {
      console.error("Error fetching lectures:", error);
      res.status(500).json({ error: "Failed to fetch lectures" });
    }
  });

  app.get("/api/lectures/:id", async (req, res) => {
    try {
      const lecture = await storage.getLecture(req.params.id);
      if (!lecture) {
        return res.status(404).json({ error: "Lecture not found" });
      }
      res.json(lecture);
    } catch (error: any) {
      console.error("Error fetching lecture:", error);
      res.status(500).json({ error: "Failed to fetch lecture" });
    }
  });

  app.post("/api/lectures", async (req, res) => {
    try {
      const parsed = addLectureSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: parsed.error.issues 
        });
      }
      const lecture = await storage.addLecture(parsed.data);
      res.json(lecture);
    } catch (error: any) {
      console.error("Error adding lecture:", error);
      res.status(500).json({ error: "Failed to add lecture" });
    }
  });

  app.patch("/api/lectures/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const parsed = updateLectureSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid request", 
          details: parsed.error.issues 
        });
      }
      const updatedLecture = await storage.updateLecture(id, parsed.data);
      if (!updatedLecture) {
        return res.status(404).json({ error: "Lecture not found" });
      }
      res.json(updatedLecture);
    } catch (error: any) {
      console.error("Error updating lecture:", error);
      res.status(500).json({ error: "Failed to update lecture" });
    }
  });

  app.delete("/api/lectures/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteLecture(id);
      if (!deleted) {
        return res.status(404).json({ error: "Lecture not found" });
      }
      res.json({ success: true, message: "Lecture deleted" });
    } catch (error: any) {
      console.error("Error deleting lecture:", error);
      res.status(500).json({ error: "Failed to delete lecture" });
    }
  });

  app.get("/api/weak-topics", async (req, res) => {
    try {
      const topics = await storage.getWeakTopics();
      res.json(topics);
    } catch (error: any) {
      console.error("Error fetching weak topics:", error);
      res.status(500).json({ error: "Failed to fetch weak topics" });
    }
  });

  app.get("/api/skills", async (req, res) => {
    try {
      const lectures = await storage.getLectures();
      
      const skillsMap = new Map<string, {
        name: string;
        description: string;
        category: "cognitive" | "technical" | "communication" | "interpersonal" | "organizational";
        relevantCareers: string[];
        highestProficiency: "developing" | "intermediate" | "proficient";
        occurrenceCount: number;
      }>();
      
      const proficiencyOrder = { developing: 0, intermediate: 1, proficient: 2 };
      
      lectures.forEach(lecture => {
        if (lecture.identifiedSkills && Array.isArray(lecture.identifiedSkills)) {
          lecture.identifiedSkills.forEach(skill => {
            const existing = skillsMap.get(skill.name);
            
            if (existing) {
              existing.occurrenceCount += 1;
              if (proficiencyOrder[skill.proficiencyLevel] > proficiencyOrder[existing.highestProficiency]) {
                existing.highestProficiency = skill.proficiencyLevel;
              }
              skill.relevantCareers.forEach(career => {
                if (!existing.relevantCareers.includes(career)) {
                  existing.relevantCareers.push(career);
                }
              });
            } else {
              skillsMap.set(skill.name, {
                name: skill.name,
                description: skill.description,
                category: skill.category,
                relevantCareers: [...skill.relevantCareers],
                highestProficiency: skill.proficiencyLevel,
                occurrenceCount: 1,
              });
            }
          });
        }
      });
      
      const aggregatedSkills = Array.from(skillsMap.values())
        .sort((a, b) => {
          const profDiff = proficiencyOrder[b.highestProficiency] - proficiencyOrder[a.highestProficiency];
          if (profDiff !== 0) return profDiff;
          return b.occurrenceCount - a.occurrenceCount;
        });
      
      res.json({
        skills: aggregatedSkills,
        totalSkills: aggregatedSkills.length,
        proficientCount: aggregatedSkills.filter(s => s.highestProficiency === "proficient").length,
        intermediateCount: aggregatedSkills.filter(s => s.highestProficiency === "intermediate").length,
        developingCount: aggregatedSkills.filter(s => s.highestProficiency === "developing").length,
      });
    } catch (error: any) {
      console.error("Error fetching skills:", error);
      res.status(500).json({ error: "Failed to fetch skills" });
    }
  });

  app.get("/api/calendar", async (req, res) => {
    try {
      const settings = await storage.getCalendarSettings();
      const events = await storage.getCalendarEvents();
      const lectures = await storage.getLectures();
      
      const lecturesOnly = events.filter(e => e.eventType === "lecture");
      const examsOnly = events.filter(e => e.eventType === "exam");
      
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      const upcomingLectures = lecturesOnly.filter(e => {
        const eventDate = new Date(e.startsAt);
        return eventDate >= now && eventDate <= sevenDaysFromNow;
      });
      
      const upcomingExams = examsOnly.filter(e => {
        const eventDate = new Date(e.startsAt);
        return eventDate >= now && eventDate <= sevenDaysFromNow;
      });
      
      const missingLectures = lecturesOnly.filter(e => {
        const eventDate = new Date(e.startsAt);
        if (eventDate >= now || eventDate < fourteenDaysAgo) return false;
        
        const eventDateStr = eventDate.toISOString().split("T")[0];
        const matchingLecture = lectures.find(l => {
          const lectureDate = l.date;
          const titleWords = e.title.toLowerCase().split(/\s+/);
          const lectureWords = l.title.toLowerCase().split(/\s+/);
          const hasMatchingWords = titleWords.some(tw => 
            lectureWords.some(lw => lw.includes(tw) || tw.includes(lw))
          );
          return lectureDate === eventDateStr || hasMatchingWords;
        });
        
        return !matchingLecture && !e.matchedLectureId;
      });
      
      res.json({
        settings,
        events: lecturesOnly,
        upcomingLectures,
        upcomingExams,
        missingLectures,
        totalEvents: events.length,
        lectureCount: lecturesOnly.length,
        examCount: examsOnly.length,
      });
    } catch (error: any) {
      console.error("Error fetching calendar:", error);
      res.status(500).json({ error: "Failed to fetch calendar" });
    }
  });

  app.post("/api/calendar", async (req, res) => {
    try {
      const parsed = calendarSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          error: "Invalid calendar URL", 
          details: parsed.error.issues 
        });
      }
      
      const { url } = parsed.data;
      
      const urlValidation = await validateCalendarUrlWithDns(url);
      if (!urlValidation.valid) {
        return res.status(400).json({ 
          error: urlValidation.error || "Invalid calendar URL"
        });
      }
      
      const { events, error } = await fetchAndParseCalendar(url);
      
      if (error) {
        return res.status(400).json({ 
          error: "Failed to fetch calendar",
          details: error
        });
      }
      
      const settings: CalendarSettings = {
        url,
        lastSync: new Date().toISOString(),
        lastSyncStatus: "success",
      };
      
      await storage.setCalendarSettings(settings);
      await storage.setCalendarEvents(events);
      
      const lecturesOnly = events.filter(e => e.eventType === "lecture");
      
      res.json({
        success: true,
        settings,
        totalEvents: events.length,
        lectureCount: lecturesOnly.length,
        message: `Found ${lecturesOnly.length} lectures out of ${events.length} total events`,
      });
    } catch (error: any) {
      console.error("Error setting calendar:", error);
      res.status(500).json({ error: "Failed to set calendar" });
    }
  });

  app.post("/api/calendar/refresh", async (req, res) => {
    try {
      const settings = await storage.getCalendarSettings();
      if (!settings) {
        return res.status(400).json({ error: "No calendar configured" });
      }
      
      const urlValidation = await validateCalendarUrlWithDns(settings.url);
      if (!urlValidation.valid) {
        await storage.clearCalendarSettings();
        return res.status(400).json({ 
          error: "Stored calendar URL is invalid. Please reconnect your calendar."
        });
      }
      
      const { events, error } = await fetchAndParseCalendar(settings.url);
      
      if (error) {
        const updatedSettings: CalendarSettings = {
          ...settings,
          lastSync: new Date().toISOString(),
          lastSyncStatus: "error",
          lastSyncError: error,
        };
        await storage.setCalendarSettings(updatedSettings);
        
        return res.status(400).json({ 
          error: "Failed to refresh calendar",
          details: error
        });
      }
      
      const updatedSettings: CalendarSettings = {
        ...settings,
        lastSync: new Date().toISOString(),
        lastSyncStatus: "success",
        lastSyncError: undefined,
      };
      
      await storage.setCalendarSettings(updatedSettings);
      await storage.setCalendarEvents(events);
      
      const lecturesOnly = events.filter(e => e.eventType === "lecture");
      
      res.json({
        success: true,
        settings: updatedSettings,
        totalEvents: events.length,
        lectureCount: lecturesOnly.length,
      });
    } catch (error: any) {
      console.error("Error refreshing calendar:", error);
      res.status(500).json({ error: "Failed to refresh calendar" });
    }
  });

  app.delete("/api/calendar", async (req, res) => {
    try {
      await storage.clearCalendarSettings();
      res.json({ success: true, message: "Calendar removed" });
    } catch (error: any) {
      console.error("Error removing calendar:", error);
      res.status(500).json({ error: "Failed to remove calendar" });
    }
  });

  return httpServer;
}
