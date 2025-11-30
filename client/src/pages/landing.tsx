import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, BookOpen, Target, Calendar, Award, TrendingUp } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-4 md:px-12">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-serif text-xl font-medium">LectureQuest</span>
        </div>
        <a href="/api/login" data-testid="link-login-header">
          <Button variant="outline" size="sm" data-testid="button-login-header">
            Log In
          </Button>
        </a>
      </header>

      <main className="px-6 md:px-12">
        <section className="mx-auto max-w-4xl py-16 md:py-24 text-center">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight text-foreground mb-6">
            Master Your Lectures,<br />
            <span className="text-primary">One Quiz at a Time</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Transform your study routine with AI-powered quizzes, spaced repetition, and gamified learning. 
            Upload your lecture materials and let LectureQuest guide you to academic excellence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/api/login" data-testid="link-get-started">
              <Button size="lg" className="text-base px-8" data-testid="button-get-started">
                Get Started
              </Button>
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-5xl pb-24">
          <h2 className="font-serif text-2xl md:text-3xl text-center mb-12 text-foreground">
            Everything you need to excel
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover-elevate transition-transform duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-lg">AI-Generated Quizzes</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Upload any lecture PDF or text and our AI instantly creates comprehensive quizzes to test your understanding.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-transform duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-lg">Spaced Repetition</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Our algorithm tracks your progress and schedules reviews at optimal intervals for long-term retention.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-transform duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Award className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-lg">Gamified Learning</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Earn XP, level up, and unlock achievements as you study. Stay motivated with streaks and progress tracking.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-transform duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-lg">Calendar Integration</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Connect your university timetable to automatically track lectures and never miss important material.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-transform duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-lg">Skill Tracking</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Identify transferable skills from your studies and see how your academic work connects to career paths.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate transition-transform duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-medium text-lg">Daily Reviews</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Personalized daily quizzes focus on your weak areas, ensuring efficient and effective study sessions.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mx-auto max-w-3xl pb-24 text-center">
          <div className="bg-card border border-border rounded-xl p-8 md:p-12">
            <h2 className="font-serif text-2xl md:text-3xl mb-4 text-foreground">
              Ready to transform your learning?
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Join LectureQuest and start mastering your course material with the power of AI and proven learning science.
            </p>
            <a href="/api/login" data-testid="link-cta-bottom">
              <Button size="lg" className="text-base px-8" data-testid="button-cta-bottom">
                Start Learning Today
              </Button>
            </a>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8 px-6 md:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>LectureQuest</span>
          </div>
          <p>Transform your study routine with AI-powered learning</p>
        </div>
      </footer>
    </div>
  );
}
