import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, FileText, Download, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import ReactMarkdown from "react-markdown";
import type { Figure } from "@shared/schema";

export default function PaperWriter() {
  const [topic, setTopic] = useState("");
  const [selectedPhilosopher, setSelectedPhilosopher] = useState("");
  const [generatedPaper, setGeneratedPaper] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-slate-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="absolute inset-0 bg-background/60 dark:bg-background/70 backdrop-blur-sm" />
      
      <div className="relative z-10 container mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/'}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Chat
            </Button>
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold">Paper Writer</h1>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Column */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Write a Philosophical Paper</CardTitle>
                <CardDescription>
                  Choose a philosopher and provide a topic for an original philosophical paper
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="philosopher-select">Select Philosopher</Label>
                  <Select
                    value={selectedPhilosopher}
                    onValueChange={setSelectedPhilosopher}
                  >
                    <SelectTrigger id="philosopher-select" data-testid="select-philosopher">
                      <SelectValue placeholder="Choose a philosopher..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-80">
                      {figures.map((figure) => (
                        <SelectItem key={figure.id} value={figure.id}>
                          {figure.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="topic-input">Paper Topic or Question</Label>
                  <Textarea
                    id="topic-input"
                    placeholder="e.g., 'The nature of consciousness' or 'Can we prove the existence of God?'"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    rows={4}
                    data-testid="input-topic"
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !topic.trim() || !selectedPhilosopher}
                  className="w-full"
                  data-testid="button-generate"
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">What is a Philosophical Paper?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>
                  A philosophical paper is a formal academic work that presents original arguments and analysis on a philosophical topic.
                </p>
                <p>
                  The Paper Writer generates papers in the authentic voice and style of the selected philosopher, using their distinctive methods and drawing from their actual works.
                </p>
                <p className="font-medium text-foreground">Features:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Formal academic structure</li>
                  <li>Rigorous argumentation</li>
                  <li>Scholarly language and tone</li>
                  <li>Citations from philosopher's works</li>
                  <li>Up to 1500 words</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Output Column */}
          <div>
            <Card className="h-[calc(100vh-12rem)]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Generated Paper</CardTitle>
                  {generatedPaper && !isGenerating && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      data-testid="button-download"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="h-[calc(100%-5rem)] overflow-y-auto">
                {!generatedPaper && !isGenerating ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <div className="text-center space-y-2">
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
