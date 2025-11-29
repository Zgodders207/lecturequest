import { useState, useRef, useCallback } from "react";
import { Upload, FileText, AlertCircle, Sparkles, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

interface UploadViewProps {
  onUpload: (content: string, title: string) => void;
  onBack: () => void;
  isLoading: boolean;
  error: string | null;
}

export function UploadView({ onUpload, onBack, isLoading, error }: UploadViewProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
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

  const processFile = useCallback(async (file: File) => {
    setParseError(null);
    setFileName(file.name);
    setFileType(file.type);
    
    const supportedTypes = [
      "text/plain",
      "application/pdf", 
      "text/html"
    ];
    
    const isSupported = supportedTypes.includes(file.type) || 
      file.name.endsWith(".txt") ||
      file.name.endsWith(".pdf") ||
      file.name.endsWith(".html") ||
      file.name.endsWith(".htm");

    if (!isSupported) {
      setParseError("Unsupported file type. Please upload PDF, HTML, or TXT files.");
      return;
    }

    if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setContent(text);
        const extractedTitle = text.split("\n")[0]?.slice(0, 100) || file.name.replace(".txt", "");
        setTitle(extractedTitle);
      };
      reader.readAsText(file);
    } else {
      setIsParsing(true);
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const base64 = (e.target?.result as string).split(",")[1];
            
            const response = await apiRequest("POST", "/api/parse-file", {
              fileData: base64,
              fileType: file.type,
              fileName: file.name
            });
            
            const result = await response.json();
            
            if (result.error) {
              setParseError(result.error);
            } else {
              setContent(result.text);
              setTitle(result.title || file.name.replace(/\.[^/.]+$/, ""));
            }
          } catch (err: any) {
            console.error("Parse error:", err);
            setParseError(err.message || "Failed to parse file. Please try again or paste text manually.");
          } finally {
            setIsParsing(false);
          }
        };
        reader.readAsDataURL(file);
      } catch (err: any) {
        setIsParsing(false);
        setParseError("Failed to read file. Please try again.");
      }
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

  const clearFile = () => {
    setFileName(null);
    setFileType(null);
    setContent("");
    setTitle("");
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const canSubmit = content.trim().length >= 50 && title.trim().length > 0;

  const getFileTypeLabel = () => {
    if (!fileName) return null;
    if (fileName.endsWith(".pdf")) return "PDF";
    if (fileName.endsWith(".html") || fileName.endsWith(".htm")) return "HTML";
    if (fileName.endsWith(".txt")) return "TXT";
    return "File";
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-xl mx-auto px-6 py-16 animate-fade-in">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-10 -ml-2"
          data-testid="button-back"
          aria-label="Go back to dashboard"
        >
          <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
          Back
        </Button>

        <div className="space-y-3 mb-10">
          <h1 className="font-serif text-display-sm tracking-tight">Upload Lecture</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Upload your study materials to generate a personalized quiz and earn XP.
          </p>
        </div>

        <div className="space-y-8">
          <div
            className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
              dragActive
                ? "border-primary bg-primary/5"
                : fileName && content
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            role="button"
            tabIndex={0}
            aria-label="Drop zone for file upload"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                fileInputRef.current?.click();
              }
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.html,.htm,text/plain,application/pdf,text/html"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="File input"
              data-testid="input-file"
            />
            
            <div className="flex flex-col items-center justify-center py-14 px-6">
              {isParsing ? (
                <>
                  <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" aria-hidden="true" />
                  <p className="font-medium text-lg">Processing {fileName}...</p>
                  <p className="text-muted-foreground mt-1">Extracting text content</p>
                </>
              ) : fileName && content ? (
                <>
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Check className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-lg">{fileName}</span>
                    <Badge variant="secondary" className="text-xs">{getFileTypeLabel()}</Badge>
                  </div>
                  <p className="text-muted-foreground">
                    {content.length.toLocaleString()} characters extracted
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground mt-4 underline-offset-4 hover:underline transition-colors"
                    data-testid="button-clear-file"
                  >
                    Choose different file
                  </button>
                </>
              ) : (
                <>
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Upload className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <p className="font-medium text-lg">Drop your file here</p>
                  <p className="text-muted-foreground mt-1">or click to browse</p>
                  <div className="flex gap-2 mt-5">
                    <Badge variant="outline" className="font-normal">PDF</Badge>
                    <Badge variant="outline" className="font-normal">HTML</Badge>
                    <Badge variant="outline" className="font-normal">TXT</Badge>
                  </div>
                </>
              )}
            </div>
          </div>

          {parseError && (
            <div className="p-5 rounded-xl bg-destructive/10 border border-destructive/20">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-medium">Processing failed</p>
                  <p className="text-sm text-muted-foreground mt-1">{parseError}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    You can paste the content manually below.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="lecture-title" className="text-sm font-medium">Title</Label>
              <Input
                id="lecture-title"
                placeholder="e.g., Introduction to Data Structures"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl h-12"
                data-testid="input-title"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="lecture-content" className="text-sm font-medium">Content</Label>
                <span className="text-xs text-muted-foreground">
                  {content.length.toLocaleString()} / 50 min
                </span>
              </div>
              <Textarea
                id="lecture-content"
                placeholder="Paste or type your lecture notes here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[180px] resize-y rounded-xl"
                data-testid="input-content"
              />
            </div>
          </div>

          {error && (
            <div className="p-5 rounded-xl bg-destructive/10 border border-destructive/20">
              <div className="flex items-start gap-4">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm text-muted-foreground mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading || isParsing}
            className="w-full rounded-xl"
            size="lg"
            data-testid="button-generate-quiz"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Generating Quiz...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                Generate Quiz
              </>
            )}
          </Button>

          <p className="text-center text-muted-foreground">
            Complete the quiz to earn 50+ XP
          </p>
        </div>
      </div>
    </div>
  );
}
