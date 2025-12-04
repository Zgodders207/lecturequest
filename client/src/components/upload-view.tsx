import { useState, useRef, useCallback } from "react";
import { Upload, FileText, AlertCircle, ArrowLeft, Check, Loader2, BookOpen, Plus, Trash2, Files } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
// Removed apiRequest import - file parsing now happens client-side

interface UploadViewProps {
  onSave: (content: string, title: string) => void;
  onBack: () => void;
  isSaving: boolean;
  error: string | null;
}

interface BatchLecture {
  id: string;
  title: string;
  content: string;
  filename?: string;
  status: "pending" | "processing" | "completed" | "error";
  error?: string;
}

interface BatchResult {
  batchId: string;
  total: number;
  successCount: number;
  errorCount: number;
  results: Array<{
    index: number;
    lectureId: string | null;
    title: string;
    status: "completed" | "error";
    error?: string;
  }>;
}

function extractTitleFromContent(content: string): string {
  const lines = content.split(/[\n\r]+/).map(line => line.trim()).filter(line => line.length > 0);
  
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
  
  const firstLine = lines[0]?.trim() || "";
  return firstLine.slice(0, 100) || "Untitled Lecture";
}

export function UploadView({ onSave, onBack, isSaving, error }: UploadViewProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Batch upload state
  const [batchLectures, setBatchLectures] = useState<BatchLecture[]>([]);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const batchFileInputRef = useRef<HTMLInputElement>(null);

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
        const extractedTitle = extractTitleFromContent(text);
        setTitle(extractedTitle);
      };
      reader.readAsText(file);
    } else {
      // File parsing requires backend API - not available in localStorage-only mode
      setParseError("File upload requires backend processing. Please use the 'Paste Text' tab to manually enter your lecture content.");
      setIsParsing(false);
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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    if (!title || title === "Untitled Lecture") {
      const extractedTitle = extractTitleFromContent(newContent);
      setTitle(extractedTitle);
    }
  };

  const handleSubmit = () => {
    if (content.trim().length >= 50 && title.trim()) {
      onSave(content.trim(), title.trim());
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

  // Batch upload functions
  const addManualEntry = () => {
    const newEntry: BatchLecture = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: "",
      content: "",
      status: "pending"
    };
    setBatchLectures(prev => [...prev, newEntry]);
  };

  const updateBatchLecture = (id: string, updates: Partial<BatchLecture>) => {
    setBatchLectures(prev => prev.map(lecture => 
      lecture.id === id ? { ...lecture, ...updates } : lecture
    ));
  };

  const removeBatchLecture = (id: string) => {
    setBatchLectures(prev => prev.filter(lecture => lecture.id !== id));
  };

  const processBatchFiles = useCallback(async (files: FileList) => {
    const newLectures: BatchLecture[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isSupported = 
        file.type === "text/plain" || 
        file.type === "application/pdf" || 
        file.type === "text/html" ||
        file.name.endsWith(".txt") ||
        file.name.endsWith(".pdf") ||
        file.name.endsWith(".html") ||
        file.name.endsWith(".htm");

      if (!isSupported) continue;

      const lectureEntry: BatchLecture = {
        id: `file-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        title: "",
        content: "",
        filename: file.name,
        status: "processing"
      };
      newLectures.push(lectureEntry);
    }

    setBatchLectures(prev => [...prev, ...newLectures]);

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const lectureId = newLectures[i]?.id;
      if (!lectureId) continue;

      try {
        if (file.type === "text/plain" || file.name.endsWith(".txt")) {
          const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = () => reject(new Error("Failed to read file"));
            reader.readAsText(file);
          });
          
          const extractedTitle = extractTitleFromContent(text);
          updateBatchLecture(lectureId, { 
            content: text, 
            title: extractedTitle,
            status: "pending"
          });
        } else {
          // File parsing requires backend API - not available in localStorage-only mode
          throw new Error("File upload requires backend processing. Only .txt files are supported in localStorage mode.");
          
          if (result.error) {
            updateBatchLecture(lectureId, { 
              status: "error",
              error: result.error
            });
          } else {
            const extractedTitle = result.title || extractTitleFromContent(result.text);
            updateBatchLecture(lectureId, { 
              content: result.text, 
              title: extractedTitle,
              status: "pending"
            });
          }
        }
      } catch (err: any) {
        updateBatchLecture(lectureId, { 
          status: "error",
          error: err.message || "Failed to process file"
        });
      }
    }
  }, []);

  const handleBatchFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processBatchFiles(e.target.files);
    }
    if (batchFileInputRef.current) {
      batchFileInputRef.current.value = "";
    }
  }, [processBatchFiles]);

  const handleBatchDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processBatchFiles(e.dataTransfer.files);
    }
  }, [processBatchFiles]);

  const submitBatchUpload = async () => {
    const validLectures = batchLectures.filter(
      l => l.status === "pending" && l.content.trim().length >= 50 && l.title.trim().length > 0
    );

    if (validLectures.length === 0) {
      setBatchError("No valid lectures to upload. Each lecture needs a title and at least 50 characters of content.");
      return;
    }

    // Batch upload requires backend API - not available in localStorage-only mode
    setBatchError("Batch upload requires backend processing. Please use single lecture upload via the 'Paste Text' tab.");
    setIsBatchUploading(false);
  };

  const resetBatchUpload = () => {
    setBatchLectures([]);
    setBatchResult(null);
    setBatchError(null);
    setBatchProgress(0);
  };

  const validBatchCount = batchLectures.filter(
    l => l.status === "pending" && l.content.trim().length >= 50 && l.title.trim().length > 0
  ).length;

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-16 animate-fade-in">
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
          <h1 className="font-serif text-display-sm tracking-tight">Upload Lectures</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Add your study materials to your library. Upload a single lecture or multiple at once.
          </p>
        </div>

        <Tabs defaultValue="single" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="single" data-testid="tab-single-upload">
              <FileText className="h-4 w-4 mr-2" />
              Single Upload
            </TabsTrigger>
            <TabsTrigger value="batch" data-testid="tab-batch-upload">
              <Files className="h-4 w-4 mr-2" />
              Batch Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single">
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
                  <p className="text-xs text-muted-foreground">
                    Auto-extracted from your content. You can edit it.
                  </p>
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
                    onChange={handleContentChange}
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
                disabled={!canSubmit || isSaving || isParsing}
                className="w-full rounded-xl"
                size="lg"
                data-testid="button-save-lecture"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Saving...
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
                    Save to Library
                  </>
                )}
              </Button>

              <p className="text-center text-muted-foreground text-sm">
                After saving, you can review this lecture anytime from your dashboard.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="batch">
            <div className="space-y-6">
              {batchResult ? (
                <div className="space-y-6">
                  <div className="p-6 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-lg">Batch Upload Complete</p>
                        <p className="text-sm text-muted-foreground">
                          {batchResult.successCount} of {batchResult.total} lectures uploaded successfully
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {batchResult.results.map((result, idx) => (
                        <div 
                          key={idx}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            result.status === "completed" 
                              ? "bg-primary/5" 
                              : "bg-destructive/5"
                          }`}
                          data-testid={`batch-result-${idx}`}
                        >
                          <span className="font-medium truncate flex-1">{result.title}</span>
                          {result.status === "completed" ? (
                            <Badge variant="secondary" className="ml-2">
                              <Check className="h-3 w-3 mr-1" />
                              Saved
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="ml-2">
                              Failed
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={resetBatchUpload}
                      className="flex-1 rounded-xl"
                      data-testid="button-upload-more"
                    >
                      Upload More Lectures
                    </Button>
                    <Button
                      onClick={onBack}
                      className="flex-1 rounded-xl"
                      data-testid="button-go-to-library"
                    >
                      Go to Library
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
                      dragActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/50 hover:bg-muted/30"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleBatchDrop}
                  >
                    <input
                      ref={batchFileInputRef}
                      type="file"
                      accept=".txt,.pdf,.html,.htm,text/plain,application/pdf,text/html"
                      onChange={handleBatchFileInput}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      multiple
                      data-testid="input-batch-files"
                    />
                    
                    <div className="flex flex-col items-center justify-center py-10 px-6">
                      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Files className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                      </div>
                      <p className="font-medium text-lg">Drop multiple files here</p>
                      <p className="text-muted-foreground mt-1">or click to select files</p>
                      <div className="flex gap-2 mt-4">
                        <Badge variant="outline" className="font-normal">PDF</Badge>
                        <Badge variant="outline" className="font-normal">HTML</Badge>
                        <Badge variant="outline" className="font-normal">TXT</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-sm text-muted-foreground">or add manually</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <Button
                    variant="outline"
                    onClick={addManualEntry}
                    className="w-full rounded-xl"
                    data-testid="button-add-manual-entry"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lecture Entry
                  </Button>

                  {batchLectures.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Lectures to Upload ({batchLectures.length})</h3>
                        {validBatchCount > 0 && (
                          <Badge variant="secondary">{validBatchCount} ready</Badge>
                        )}
                      </div>

                      <div className="space-y-3">
                        {batchLectures.map((lecture, idx) => (
                          <Card key={lecture.id} className="p-4" data-testid={`batch-lecture-${idx}`}>
                            <div className="flex items-start gap-3">
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                  {lecture.filename && (
                                    <Badge variant="outline" className="text-xs">
                                      <FileText className="h-3 w-3 mr-1" />
                                      {lecture.filename}
                                    </Badge>
                                  )}
                                  {lecture.status === "processing" && (
                                    <Badge variant="secondary">
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      Processing
                                    </Badge>
                                  )}
                                  {lecture.status === "error" && (
                                    <Badge variant="destructive">Error</Badge>
                                  )}
                                  {lecture.status === "completed" && (
                                    <Badge variant="secondary">
                                      <Check className="h-3 w-3 mr-1" />
                                      Uploaded
                                    </Badge>
                                  )}
                                </div>

                                {lecture.status !== "completed" && (
                                  <>
                                    <Input
                                      placeholder="Lecture title"
                                      value={lecture.title}
                                      onChange={(e) => updateBatchLecture(lecture.id, { title: e.target.value })}
                                      className="rounded-lg"
                                      disabled={lecture.status === "processing"}
                                      data-testid={`batch-title-${idx}`}
                                    />
                                    
                                    <Textarea
                                      placeholder="Lecture content (min 50 characters)"
                                      value={lecture.content}
                                      onChange={(e) => {
                                        const newContent = e.target.value;
                                        const updates: Partial<BatchLecture> = { content: newContent };
                                        if (!lecture.title) {
                                          updates.title = extractTitleFromContent(newContent);
                                        }
                                        updateBatchLecture(lecture.id, updates);
                                      }}
                                      className="min-h-[100px] resize-y rounded-lg"
                                      disabled={lecture.status === "processing"}
                                      data-testid={`batch-content-${idx}`}
                                    />

                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                      <span>{lecture.content.length.toLocaleString()} characters</span>
                                      {lecture.content.length < 50 && (
                                        <span className="text-amber-500">Need at least 50 characters</span>
                                      )}
                                    </div>
                                  </>
                                )}

                                {lecture.error && (
                                  <p className="text-sm text-destructive">{lecture.error}</p>
                                )}
                              </div>

                              {lecture.status !== "completed" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeBatchLecture(lecture.id)}
                                  className="text-muted-foreground hover:text-destructive"
                                  data-testid={`button-remove-${idx}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {batchError && (
                    <div className="p-5 rounded-xl bg-destructive/10 border border-destructive/20">
                      <div className="flex items-start gap-4">
                        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">Upload Error</p>
                          <p className="text-sm text-muted-foreground mt-1">{batchError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isBatchUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Uploading lectures...</span>
                        <span>{batchProgress}%</span>
                      </div>
                      <Progress value={batchProgress} className="h-2" />
                    </div>
                  )}

                  {batchLectures.length > 0 && (
                    <Button
                      onClick={submitBatchUpload}
                      disabled={validBatchCount === 0 || isBatchUploading}
                      className="w-full rounded-xl"
                      size="lg"
                      data-testid="button-batch-upload"
                    >
                      {isBatchUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading {validBatchCount} Lectures...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload {validBatchCount} Lecture{validBatchCount !== 1 ? "s" : ""}
                        </>
                      )}
                    </Button>
                  )}

                  <p className="text-center text-muted-foreground text-sm">
                    Upload up to 20 lectures at once. Each lecture needs a title and at least 50 characters of content.
                  </p>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
