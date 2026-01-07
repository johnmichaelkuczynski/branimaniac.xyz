import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowLeft, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function ModelBuilder() {
  const [, setLocation] = useLocation();
  const [originalText, setOriginalText] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [generatedModel, setGeneratedModel] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // Get original text from URL state on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const textParam = params.get("text");
    if (textParam) {
      try {
        setOriginalText(decodeURIComponent(textParam));
      } catch (e) {
        console.error("Failed to decode text parameter:", e);
      }
    }
  }, []);

  const handleGenerate = async () => {
    if (!originalText.trim()) {
      return;
    }

    setIsGenerating(true);
    setGeneratedModel("");

    try {
      const response = await fetch("/api/model-builder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalText,
          customInstructions: customInstructions.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate model");
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
                continue;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedText += parsed.content;
                  setGeneratedModel(accumulatedText);
                }
              } catch (e) {
                console.error("Failed to parse SSE data:", e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error generating model:", error);
      setGeneratedModel("Error: Failed to generate model. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Chat
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6" />
              Model Builder
            </h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Input */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Original Theory</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="original-text">Philosophical Response</Label>
                  <Textarea
                    id="original-text"
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    placeholder="Paste the philosopher's response here, or click the arrow button on any response..."
                    className="min-h-[300px] mt-2"
                    data-testid="input-original-text"
                  />
                </div>

                <div>
                  <Label htmlFor="custom-instructions">
                    Custom Instructions (Optional)
                  </Label>
                  <Textarea
                    id="custom-instructions"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g., 'Find a model from finance that validates Spinoza's theory' or 'Translate to modern cognitive science terms'"
                    className="min-h-[120px] mt-2"
                    data-testid="input-custom-instructions"
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={!originalText.trim() || isGenerating}
                  className="w-full"
                  data-testid="button-generate"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGenerating ? "Generating Model..." : "Generate Model"}
                </Button>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-muted">
              <CardHeader>
                <CardTitle className="text-lg">What is a Model?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>
                  A <strong>model</strong> is an assignment of new meanings to a theory's primitive terms that:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Preserves the formal structure of the theory</li>
                  <li>Makes the theory's claims come out true</li>
                  <li>May completely change what the theory is ABOUT</li>
                </ul>
                <p className="mt-3 text-muted-foreground">
                  Example: Spinoza's "God/Substance" → "Spatiotemporal Reality" creates an isomorphic theory with the same structure but different referents.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Output */}
          <div>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Generated Model</CardTitle>
              </CardHeader>
              <CardContent>
                {!generatedModel && !isGenerating && (
                  <div className="text-muted-foreground text-center py-12">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Generated model will appear here...</p>
                    <p className="text-sm mt-2">Click Generate to begin</p>
                  </div>
                )}

                {isGenerating && !generatedModel && (
                  <div className="text-muted-foreground text-center py-12">
                    <div className="animate-pulse">
                      <Sparkles className="h-12 w-12 mx-auto mb-4" />
                      <p>Analyzing theory structure...</p>
                    </div>
                  </div>
                )}

                {generatedModel && (
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none"
                    data-testid="text-generated-model"
                  >
                    <ReactMarkdown>{generatedModel}</ReactMarkdown>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
