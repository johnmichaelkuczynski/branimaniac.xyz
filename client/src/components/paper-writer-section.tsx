import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, Loader2, ArrowRight, Copy, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import type { Figure } from "@shared/schema";

function getDisplayName(fullName: string): string {
  const keepFullName = ["James Allen", "William James", "ALLEN"];
  if (keepFullName.includes(fullName)) {
    return fullName;
  }
  const parts = fullName.split(' ');
  return parts[parts.length - 1];
}

interface PaperWriterSectionProps {
  onRegisterInput?: (setter: (topic: string) => void) => void;
  onTransferContent?: (content: string, target: 'chat' | 'model' | 'paper') => void;
}

export function PaperWriterSection({ onRegisterInput, onTransferContent }: PaperWriterSectionProps) {
  const [topic, setTopic] = useState("");
  const [selectedPhilosopher, setSelectedPhilosopher] = useState("");
  const [wordLength, setWordLength] = useState("1500");
  const [generatedPaper, setGeneratedPaper] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPaper);
    toast({
      title: "Copied to clipboard",
      description: "Paper has been copied.",
    });
  };

  const handleDelete = () => {
    setGeneratedPaper("");
    toast({
      title: "Output cleared",
      description: "The generated paper has been cleared.",
    });
  };

  // Register input setter with parent (includes focus)
  useEffect(() => {
    if (onRegisterInput) {
      onRegisterInput((topic: string) => {
        setTopic(topic);
        // Focus textarea after content is set
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      });
    }
  }, [onRegisterInput]);

  const { data: figures = [] } = useQuery<Figure[]>({
    queryKey: ["/api/figures"],
  });

  const handleGenerate = async () => {
    if (!topic.trim() || !selectedPhilosopher) {
      return;
    }

    setIsGenerating(true);
    setGeneratedPaper("");

    try {
      const response = await fetch(`/api/figures/${selectedPhilosopher}/write-paper`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic.trim(),
          wordLength: parseInt(wordLength) || 1500,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate paper");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let accumulatedText = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                setIsGenerating(false);
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedText += parsed.content;
                  setGeneratedPaper(accumulatedText);
                }
              } catch (e) {
                console.error("Parse error:", e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error generating paper:", error);
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const philosopher = figures.find(f => f.id === selectedPhilosopher);
    const filename = `${philosopher?.name.replace(/\s+/g, '_')}_${topic.slice(0, 30).replace(/\s+/g, '_')}.txt`;
    const blob = new Blob([generatedPaper], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <CardTitle>Paper Writer</CardTitle>
        </div>
        <CardDescription>
          Generate formal philosophical papers in authentic voice
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="philosopher-select-paper">Select Philosopher</Label>
              <Select
                value={selectedPhilosopher}
                onValueChange={setSelectedPhilosopher}
              >
                <SelectTrigger id="philosopher-select-paper" data-testid="select-philosopher-paper">
                  <SelectValue placeholder="Choose a philosopher..." />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {figures.map((figure) => (
                    <SelectItem key={figure.id} value={figure.id}>
                      {getDisplayName(figure.name)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic-input-paper">Paper Topic or Question</Label>
              <Textarea
                ref={textareaRef}
                id="topic-input-paper"
                placeholder="e.g., 'The nature of consciousness' or 'Can we prove the existence of God?'"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (topic.trim() && selectedPhilosopher && !isGenerating) {
                      handleGenerate();
                    }
                  }
                }}
                rows={6}
                data-testid="input-topic-paper"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="word-length-select">Paper Length</Label>
              <Select
                value={wordLength}
                onValueChange={setWordLength}
              >
                <SelectTrigger id="word-length-select" data-testid="select-word-length">
                  <SelectValue placeholder="Select length..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="500">Short (~500 words)</SelectItem>
                  <SelectItem value="1000">Medium (~1,000 words)</SelectItem>
                  <SelectItem value="1500">Standard (~1,500 words)</SelectItem>
                  <SelectItem value="2000">Long (~2,000 words)</SelectItem>
                  <SelectItem value="2500">Extended (~2,500 words)</SelectItem>
                  <SelectItem value="3000">Comprehensive (~3,000 words)</SelectItem>
                  <SelectItem value="4000">Major (~4,000 words)</SelectItem>
                  <SelectItem value="5000">Maximum (~5,000 words)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Longer papers generate in segments to maintain quality
              </p>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim() || !selectedPhilosopher}
              className="w-full"
              data-testid="button-generate-paper"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Paper...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Paper
                </>
              )}
            </Button>
          </div>

          {/* Output Column */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Label>Generated Paper</Label>
                {generatedPaper && !isGenerating && (
                  <span className="text-xs text-muted-foreground" data-testid="text-paper-word-count">
                    {generatedPaper.split(/\s+/).filter(w => w.length > 0).length.toLocaleString()} words
                  </span>
                )}
              </div>
              {generatedPaper && !isGenerating && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-7 px-2"
                    data-testid="button-copy-paper"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="h-7 px-2 text-destructive hover:text-destructive"
                    data-testid="button-delete-paper"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                  {onTransferContent && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 gap-1"
                          data-testid="button-transfer-paper"
                        >
                          Send to
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => onTransferContent(generatedPaper, 'chat')}
                          data-testid="menu-transfer-to-chat"
                        >
                          Chat Input
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onTransferContent(generatedPaper, 'model')}
                          data-testid="menu-transfer-to-model"
                        >
                          Model Builder
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="h-7 px-2"
                    data-testid="button-download-paper"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </Button>
                </div>
              )}
            </div>
            <div className="border rounded-lg p-4 min-h-[300px] max-h-[500px] overflow-y-auto bg-muted/30">
              {!generatedPaper && !isGenerating ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-center">
                  <div className="space-y-2">
                    <FileText className="w-12 h-12 mx-auto opacity-20" />
                    <p>Select a philosopher and topic to generate a paper</p>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{generatedPaper}</ReactMarkdown>
                  {isGenerating && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
