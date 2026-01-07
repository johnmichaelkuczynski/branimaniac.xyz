import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, List, Copy, Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

interface PositionGeneratorSectionProps {
  onRegisterInput?: (setter: (content: string) => void) => void;
}

export function PositionGeneratorSection({ onRegisterInput }: PositionGeneratorSectionProps) {
  const [selectedThinker, setSelectedThinker] = useState('');
  const [topic, setTopic] = useState('');
  const [numPositions, setNumPositions] = useState('20');
  const [generatedPositions, setGeneratedPositions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const topicInputRef = useRef<HTMLInputElement>(null);

  const { data: figures = [] } = useQuery<Figure[]>({
    queryKey: ["/api/figures"],
  });

  useEffect(() => {
    if (onRegisterInput) {
      onRegisterInput((content: string) => setTopic(content));
    }
  }, [onRegisterInput]);

  const handleGenerate = async () => {
    if (!selectedThinker) {
      toast({
        title: "Missing thinker",
        description: "Please select a thinker.",
        variant: "destructive",
      });
      return;
    }

    const positionsNum = parseInt(numPositions) || 20;
    if (positionsNum < 5 || positionsNum > 50) {
      toast({
        title: "Invalid number",
        description: "Number of positions must be between 5 and 50.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedPositions('');

    try {
      const response = await fetch('/api/positions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thinker: selectedThinker,
          topic: topic.trim(),
          numPositions: positionsNum,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let fullText = '';

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
                fullText += parsed.content;
                setGeneratedPositions(fullText);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      if (fullText) {
        toast({
          title: "Positions generated",
          description: `Generated position statements for ${selectedThinker} on "${topic}"`,
        });
      }

    } catch (error) {
      console.error('Position generation error:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate positions",
        variant: "destructive",
      });
      setGeneratedPositions('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedPositions);
      toast({
        title: "Copied",
        description: "Position statements copied to clipboard",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!generatedPositions) return;
    
    const blob = new Blob([generatedPositions], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedThinker.replace(/\s+/g, '_')}_positions_${topic.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded",
      description: "Position statements saved to file",
    });
  };

  const handleClear = () => {
    setGeneratedPositions('');
    setTopic('');
  };

  return (
    <Card className="bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-rose-50/40 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 border-amber-200/50 dark:border-slate-600">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
          <List className="w-5 h-5" />
          Position Generator
        </CardTitle>
        <CardDescription>
          Generate boom-boom-boom lists of any thinker's positions on a given topic
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="position-thinker">Select Thinker</Label>
            <Select value={selectedThinker} onValueChange={setSelectedThinker}>
              <SelectTrigger id="position-thinker" data-testid="select-position-thinker">
                <SelectValue placeholder="Choose a thinker..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {figures.map((figure) => (
                  <SelectItem key={figure.id} value={figure.name}>
                    {getDisplayName(figure.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position-topic">Topic (optional)</Label>
            <Input
              id="position-topic"
              ref={topicInputRef}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Optional: consciousness, free will, causation..."
              data-testid="input-position-topic"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="num-positions">Number of Positions</Label>
            <Input
              id="num-positions"
              type="number"
              min="5"
              max="50"
              value={numPositions}
              onChange={(e) => setNumPositions(e.target.value)}
              data-testid="input-num-positions"
            />
            <p className="text-xs text-muted-foreground">5-50 positions</p>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !selectedThinker}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          data-testid="button-generate-positions"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Positions...
            </>
          ) : (
            <>
              <List className="w-4 h-4 mr-2" />
              Generate Position Statements
            </>
          )}
        </Button>

        {generatedPositions && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Generated Position Statements</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  data-testid="button-copy-positions"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  data-testid="button-download-positions"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  data-testid="button-clear-positions"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              </div>
            </div>
            <div 
              className="min-h-[400px] max-h-[600px] overflow-y-auto p-4 font-mono text-sm bg-white/80 dark:bg-slate-900/80 border rounded-md whitespace-pre-wrap"
              data-testid="textarea-generated-positions"
            >
              {generatedPositions}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
