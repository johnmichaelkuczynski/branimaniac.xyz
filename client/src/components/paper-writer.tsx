import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Download, Loader2 } from "lucide-react";
import type { Figure } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface PaperWriterProps {
  figure: Figure;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaperWriter({ figure, open, onOpenChange }: PaperWriterProps) {
  const [topic, setTopic] = useState("");
  const [paper, setPaper] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic for the paper",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setPaper("");

    try {
      const response = await fetch(`/api/figures/${figure.id}/write-paper`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic: topic.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate paper");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let accumulatedText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            
            if (data === "[DONE]") {
              setIsGenerating(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedText += parsed.content;
                setPaper(accumulatedText);
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (err) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Error generating paper:", error);
      toast({
        title: "Error",
        description: "Failed to generate paper. Please try again.",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!paper) return;

    const timestamp = new Date().toLocaleString();
    let content = `${topic}\n`;
    content += `By ${figure.name}\n`;
    content += `Generated: ${timestamp}\n`;
    content += `${'='.repeat(60)}\n\n`;
    content += paper;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${figure.name.replace(/\s+/g, '_')}_${topic.replace(/\s+/g, '_')}_paper_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Paper downloaded",
      description: "Your paper has been saved successfully",
    });
  };

  const handleClose = () => {
    if (!isGenerating) {
      onOpenChange(false);
      // Reset after animation completes
      setTimeout(() => {
        setTopic("");
        setPaper("");
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl h-[700px] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Paper Writer - {figure.name}
              </DialogTitle>
              <DialogDescription className="mt-2">
                Request an original paper (up to 1500 words) written by {figure.name} in their authentic voice, drawing on their philosophical knowledge
              </DialogDescription>
            </div>
            {paper && !isGenerating && (
              <Button
                onClick={handleDownload}
                variant="default"
                size="sm"
                data-testid="button-download-paper"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Paper
              </Button>
            )}
          </div>

          {!paper && (
            <div className="mt-4 space-y-4">
              <div>
                <Label htmlFor="topic" className="text-sm font-medium">
                  Paper Topic
                </Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={`e.g., "The nature of consciousness" or "Critique of modern capitalism"`}
                  disabled={isGenerating}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleGenerate();
                    }
                  }}
                  data-testid="input-paper-topic"
                  className="mt-2"
                />
              </div>
              <Button
                onClick={handleGenerate}
                disabled={!topic.trim() || isGenerating}
                className="w-full"
                data-testid="button-generate-paper"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating paper...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Paper
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogHeader>

        {(paper || isGenerating) && (
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <h1 className="text-2xl font-bold mb-2">{topic}</h1>
              <p className="text-muted-foreground italic mb-6">By {figure.name}</p>
              <div className="whitespace-pre-wrap leading-relaxed">
                {paper}
                {isGenerating && (
                  <span className="inline-block w-1 h-4 bg-foreground/50 ml-1 animate-pulse" />
                )}
              </div>
            </div>
          </ScrollArea>
        )}

        {!paper && !isGenerating && (
          <div className="flex-1 flex items-center justify-center px-6 py-8">
            <div className="text-center max-w-md">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Create an Original Philosophical Paper
              </h3>
              <p className="text-sm text-muted-foreground">
                Enter a topic above and {figure.name} will write an original paper in their authentic voice, 
                drawing on their philosophical knowledge and using quotes from their actual works.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
