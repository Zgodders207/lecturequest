import { useState, useRef, useCallback } from "react";
import { Upload, FileText, AlertCircle, Sparkles, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
                : fileName 
                  ? "border-success bg-success/5"
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
              accept=".txt,.pdf,.html,.htm,text/plain,application/pdf,text/html"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="File input"
              data-testid="input-file"
            />
            
            <div className="flex flex-col items-center justify-center py-12 px-4">
              {isParsing ? (
                <>
                  <div className="mb-4 rounded-full bg-primary/20 p-4">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" aria-hidden="true" />
                  </div>
                  <p className="text-lg font-medium text-center">
                    Processing {fileName}...
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Extracting text content
                  </p>
                </>
              ) : fileName && content ? (
                <>
                  <div className="mb-4 rounded-full bg-success/20 p-4">
                    <Check className="h-8 w-8 text-success" aria-hidden="true" />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-medium text-success">{fileName}</span>
                    <Badge variant="secondary">{getFileTypeLabel()}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {content.length.toLocaleString()} characters extracted
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                    className="mt-2"
                    data-testid="button-clear-file"
                  >
                    Upload different file
                  </Button>
                </>
              ) : (
                <>
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <FileText className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <p className="text-lg font-medium text-center">
                    Drag & drop your file here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse
                  </p>
                  <div className="flex gap-2 mt-4">
                    <Badge variant="outline">PDF</Badge>
                    <Badge variant="outline">HTML</Badge>
                    <Badge variant="outline">TXT</Badge>
                  </div>
                </>
              )}
            </div>
          </div>

          {parseError && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-medium text-destructive">File Processing Error</p>
                  <p className="text-sm text-muted-foreground">{parseError}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    You can also paste the content manually in the text area below.
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
                  ({content.length.toLocaleString()} characters, min 50)
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
            disabled={!canSubmit || isLoading || isParsing}
            className={`w-full h-12 text-lg font-semibold ${
              canSubmit && !isLoading && !isParsing ? "animate-pulse-glow" : ""
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
