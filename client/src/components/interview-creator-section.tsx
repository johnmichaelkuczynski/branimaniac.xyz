import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Loader2, Copy, Trash2, Download, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DragDropUpload } from "@/components/ui/drag-drop-upload";
import { useQuery } from "@tanstack/react-query";
import type { Figure } from "@shared/schema";

function getDisplayName(fullName: string): string {
  const keepFullName = ["James Allen", "William James", "ALLEN"];
  if (keepFullName.includes(fullName)) {
    return fullName;
  }
  const parts = fullName.split(' ');
  return parts[parts.length - 1];
}

interface InterviewCreatorSectionProps {
  onRegisterInput?: (setter: (content: string) => void) => void;
  onRegisterOutputs?: (outputGetters: Record<string, () => string>) => void;
}

type InterviewMode = 'conservative' | 'aggressive';
type InterviewerTone = 'neutral' | 'dialectical' | 'hostile';

export function InterviewCreatorSection({ 
  onRegisterInput, 
  onRegisterOutputs 
}: InterviewCreatorSectionProps) {
  const [selectedThinker, setSelectedThinker] = useState<string>('');
  const [mode, setMode] = useState<InterviewMode>('conservative');
  const [topic, setTopic] = useState('');
  const [interviewerTone, setInterviewerTone] = useState<InterviewerTone>('neutral');
  const [wordLength, setWordLength] = useState<number>(1500);
  const [inputMode, setInputMode] = useState<'topic' | 'upload'>('topic');
  const [uploadedText, setUploadedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [interview, setInterview] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [totalChapters, setTotalChapters] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false);
  const [waitTimeRemaining, setWaitTimeRemaining] = useState(0);
  const uploadedFileRef = useRef<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState(0);
  const { toast } = useToast();

  const { data: figures = [] } = useQuery<Figure[]>({
    queryKey: ['/api/figures'],
  });

  useEffect(() => {
    if (onRegisterInput) {
      onRegisterInput((content: string) => {
        setTopic(content);
        setInputMode('topic');
      });
    }
  }, [onRegisterInput]);

  useEffect(() => {
    if (onRegisterOutputs) {
      onRegisterOutputs({
        interview: () => interview
      });
    }
  }, [onRegisterOutputs, interview]);

  const handleFileAccepted = async (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    uploadedFileRef.current = file;
    setUploadedFileName(file.name);
    setUploadedFileSize(file.size);

    if (fileExtension === 'txt') {
      try {
        const text = await file.text();
        setUploadedText(text);
        toast({
          title: "File uploaded",
          description: `${file.name} ready (${text.length} characters)`,
        });
      } catch (error) {
        toast({
          title: "File uploaded",
          description: file.name,
        });
      }
    } else {
      setUploadedText(`File: ${file.name} (${fileExtension?.toUpperCase()})`);
      toast({
        title: "File uploaded",
        description: `${file.name} will be processed by server`,
      });
    }
  };

  const handleValidationError = (error: { title: string; description: string }) => {
    toast({
      title: error.title,
      description: error.description,
      variant: "destructive",
    });
  };

  const handleClearFile = () => {
    uploadedFileRef.current = null;
    setUploadedFileName('');
    setUploadedFileSize(0);
    setUploadedText('');
  };

  const handleGenerate = async () => {
    if (!selectedThinker) {
      toast({
        title: "Thinker required",
        description: "Please select a thinker to interview",
        variant: "destructive",
      });
      return;
    }

    if (inputMode === 'topic' && (!topic || topic.trim().length < 5)) {
      toast({
        title: "Topic required",
        description: "Please provide a topic for the interview",
        variant: "destructive",
      });
      return;
    }

    if (inputMode === 'upload' && !uploadedFileRef.current && !uploadedText) {
      toast({
        title: "File required",
        description: "Please upload a file to discuss",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setInterview('');
    setWordCount(0);
    setCurrentChapter(0);
    setTotalChapters(Math.ceil(wordLength / 2000));

    try {
      const formData = new FormData();
      formData.append('thinkerId', selectedThinker);
      formData.append('mode', mode);
      formData.append('interviewerTone', interviewerTone);
      formData.append('wordLength', wordLength.toString());

      if (inputMode === 'upload' && uploadedFileRef.current) {
        formData.append('file', uploadedFileRef.current);
      } else {
        formData.append('topic', topic);
      }

      const response = await fetch('/api/interview-creator', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate interview');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.content) {
                accumulatedText += parsed.content;
                setInterview(accumulatedText);
              }
              
              if (parsed.wordCount) {
                setWordCount(parsed.wordCount);
              }

              if (parsed.chapter) {
                setCurrentChapter(parsed.chapter);
              }

              if (parsed.waiting) {
                setIsWaiting(true);
                setWaitTimeRemaining(parsed.waitTime || 60);
                
                const countdown = setInterval(() => {
                  setWaitTimeRemaining(prev => {
                    if (prev <= 1) {
                      clearInterval(countdown);
                      setIsWaiting(false);
                      return 0;
                    }
                    return prev - 1;
                  });
                }, 1000);
              }
              
              if (parsed.done) {
                setIsWaiting(false);
              }
              
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {
            }
          }
        }
      }

      toast({
        title: "Interview generated",
        description: `Created ${accumulatedText.split(/\s+/).length} word interview`,
      });

      uploadedFileRef.current = null;
      setUploadedFileName('');
      setUploadedFileSize(0);

    } catch (error) {
      console.error('Error generating interview:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setIsWaiting(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(interview);
      toast({
        title: "Copied!",
        description: "Interview copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const thinkerName = figures.find(f => f.id === selectedThinker)?.name || 'interview';
    const blob = new Blob([interview], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview_${thinkerName.replace(/\s+/g, '_')}_${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Interview saved as text file",
    });
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this interview?')) {
      setInterview('');
      setWordCount(0);
      setCurrentChapter(0);
      toast({
        title: "Deleted",
        description: "Interview cleared",
      });
    }
  };

  const selectedFigure = figures.find(f => f.id === selectedThinker);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Mic className="w-8 h-8" />
          Interview Creator
        </h2>
        <p className="text-muted-foreground mt-2">
          Generate in-depth interviews with philosophical and literary figures.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interview Settings</CardTitle>
          <CardDescription>
            Configure your interview parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="thinker-select">Select Thinker to Interview</Label>
            <Select
              value={selectedThinker}
              onValueChange={setSelectedThinker}
            >
              <SelectTrigger
                id="thinker-select"
                data-testid="select-thinker"
                className="mt-2"
              >
                <SelectValue placeholder="Choose a thinker..." />
              </SelectTrigger>
              <SelectContent>
                {figures.map((figure) => (
                  <SelectItem key={figure.id} value={figure.id}>
                    {getDisplayName(figure.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div className="space-y-1">
              <Label htmlFor="mode-toggle" className="text-base font-medium">Interview Mode</Label>
              <p className="text-sm text-muted-foreground">
                {mode === 'conservative' 
                  ? "Conservative: Textually accurate to the thinker's stated positions"
                  : "Aggressive: Reconstructs and extends beyond stated views, incorporates later knowledge"
                }
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm ${mode === 'conservative' ? 'font-medium' : 'text-muted-foreground'}`}>
                Conservative
              </span>
              <Switch
                id="mode-toggle"
                data-testid="toggle-mode"
                checked={mode === 'aggressive'}
                onCheckedChange={(checked) => setMode(checked ? 'aggressive' : 'conservative')}
              />
              <span className={`text-sm ${mode === 'aggressive' ? 'font-medium' : 'text-muted-foreground'}`}>
                Aggressive
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="tone-select">Interviewer Tone</Label>
            <Select
              value={interviewerTone}
              onValueChange={(v) => setInterviewerTone(v as InterviewerTone)}
            >
              <SelectTrigger
                id="tone-select"
                data-testid="select-tone"
                className="mt-2"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neutral">Neutral - Well-disposed, asks for clarification, objective</SelectItem>
                <SelectItem value="dialectical">Dialectically Engaged - Active participant, agrees/disagrees, cooperative equal</SelectItem>
                <SelectItem value="hostile">Hostile - Challenges vigorously through legitimate logic</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-1">
              {interviewerTone === 'neutral' && "Listens attentively, asks clarifying questions, relates views to broader topics"}
              {interviewerTone === 'dialectical' && "Actively engaged, volunteers own views, sometimes agrees, sometimes disagrees"}
              {interviewerTone === 'hostile' && "Attempts to challenge and critique the interviewee's positions through rigorous logic"}
            </p>
          </div>

          <div>
            <Label>Interview Length: {wordLength.toLocaleString()} words</Label>
            <Slider
              data-testid="slider-length"
              value={[wordLength]}
              onValueChange={(v) => setWordLength(v[0])}
              min={500}
              max={10000}
              step={500}
              className="mt-2"
            />
            <p className="text-sm text-muted-foreground mt-1">
              {wordLength > 2000 
                ? `Will be generated in ${Math.ceil(wordLength / 2000)} chapters (~2000 words each)`
                : "Single chapter interview"
              }
            </p>
          </div>

          <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'topic' | 'upload')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="topic" data-testid="tab-topic">Topic</TabsTrigger>
              <TabsTrigger value="upload" data-testid="tab-upload-interview">Upload Text</TabsTrigger>
            </TabsList>

            <TabsContent value="topic" className="space-y-4">
              <div>
                <Label htmlFor="topic-input">Interview Topic</Label>
                <Textarea
                  id="topic-input"
                  data-testid="textarea-topic"
                  placeholder="What would you like to discuss? e.g., 'The nature of the unconscious' or 'Free will and determinism'"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
              </div>
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <DragDropUpload
                onFileAccepted={handleFileAccepted}
                onValidationError={handleValidationError}
                accept=".txt,.pdf,.doc,.docx,.md"
                maxSizeMB={5}
              />

              {uploadedFileName && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{uploadedFileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {(uploadedFileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFile}
                      data-testid="button-clear-file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The interview will discuss this text with the selected thinker
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedThinker || (inputMode === 'topic' && !topic.trim())}
            className="w-full"
            data-testid="button-generate-interview"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isWaiting 
                  ? `Chapter ${currentChapter} complete. Next chapter in ${waitTimeRemaining}s...`
                  : `Generating${totalChapters > 1 ? ` Chapter ${currentChapter || 1}/${totalChapters}` : ''}...`
                }
              </>
            ) : (
              `Generate Interview${selectedFigure ? ` with ${selectedFigure.name}` : ''}`
            )}
          </Button>
        </CardContent>
      </Card>

      {interview && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Generated Interview</CardTitle>
                <CardDescription>
                  {wordCount.toLocaleString()} words
                  {currentChapter > 0 && totalChapters > 1 && ` • ${currentChapter} chapter${currentChapter > 1 ? 's' : ''}`}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  data-testid="button-copy-interview"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDownload}
                  data-testid="button-download-interview"
                >
                  <Download className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleDelete}
                  data-testid="button-delete-interview"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              className="whitespace-pre-wrap font-serif text-base leading-relaxed max-h-[600px] overflow-y-auto p-4 bg-muted/30 rounded-lg"
              data-testid="text-interview-output"
            >
              {interview}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
