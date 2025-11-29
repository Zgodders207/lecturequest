import { useState, useRef, useCallback } from "react";
import { Upload, FileText, AlertCircle, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface UploadViewProps {
  onUpload: (content: string, title: string) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

export function UploadView({ onUpload, onBack, isLoading, error }: UploadViewProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [showPasteArea, setShowPasteArea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFile = useCallback((file: File) => {
    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setContent(text);
        setFileName(file.name);
        const extractedTitle = text.split("\n")[0]?.slice(0, 100) || file.name.replace(".txt", "");
        setTitle(extractedTitle);
      };
      reader.readAsText(file);
    } else if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      setShowPasteArea(true);
      setFileName(file.name);
      setTitle(file.name.replace(".pdf", ""));
    } else {
      setShowPasteArea(true);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  }, [processFile]);

  const handleSubmit = () => {
    if (content.trim().length >= 50 && title.trim()) {
      onUpload(content.trim(), title.trim());
    }
  };

  const canSubmit = content.trim().length >= 50 && title.trim().length > 0;

  return (
    <div className="container max-w-2xl mx-auto px-4 py-8">
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-6"
        data-testid="button-back"
        aria-label="Go back to dashboard"
      >
        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
        Back to Dashboard
      </Button>

      <Card className="border-border/50">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-secondary/20">
            <Upload className="h-8 w-8 text-primary" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl gradient-text">Upload Lecture Material</CardTitle>
          <CardDescription className="text-base">
            Upload your lecture notes to start earning XP!
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div
            className={`relative rounded-lg border-2 border-dashed transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            aria-label="Drop zone for file upload. Click or drag files here."
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                fileInputRef.current?.click();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,text/plain,application/pdf"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="File input"
              data-testid="input-file"
            />
            
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="mb-4 rounded-full bg-muted p-4">
                <FileText className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              </div>
              <p className="text-lg font-medium text-center">
                {fileName ? (
                  <span className="text-primary">{fileName}</span>
                ) : (
                  "Drag & drop your file here"
                )}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-4">
                Supported: .txt files (for PDFs, paste text below)
              </p>
            </div>
          </div>

          {(showPasteArea || fileName?.endsWith(".pdf")) && (
            <div className="p-4 rounded-lg bg-gold/10 border border-gold/30">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-medium text-gold">PDF Detected</p>
                  <p className="text-sm text-muted-foreground">
                    Please copy and paste the text content from your PDF below, or convert it to a .txt file.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lecture-title">Lecture Title</Label>
              <Input
                id="lecture-title"
                placeholder="e.g., Introduction to Data Structures"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                data-testid="input-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lecture-content">
                Lecture Content
                <span className="text-muted-foreground text-xs ml-2">
                  ({content.length} characters, min 50)
                </span>
              </Label>
              <Textarea
                id="lecture-content"
                placeholder="Paste or type your lecture notes here... (minimum 50 characters)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[200px] resize-y"
                data-testid="input-content"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-medium text-destructive">Error</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
            className={`w-full h-12 text-lg font-semibold ${
              canSubmit && !isLoading ? "animate-pulse-glow" : ""
            }`}
            data-testid="button-generate-quiz"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Generating Quiz...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" aria-hidden="true" />
                Generate Quiz
              </>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Earn 50+ XP for completing the review quiz!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
