import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2, Sparkles, ArrowRight, Copy, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

interface ModelBuilderSectionProps {
  onRegisterInput?: (setter: (text: string) => void) => void;
  onTransferContent?: (content: string, target: 'chat' | 'model' | 'paper') => void;
}

export function ModelBuilderSection({ onRegisterInput, onTransferContent }: ModelBuilderSectionProps) {
  const [originalText, setOriginalText] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [generatedModel, setGeneratedModel] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [critique, setCritique] = useState("");
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [refinementHistory, setRefinementHistory] = useState<Array<{ model: string; critique: string }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedModel);
    toast({
      title: "Copied to clipboard",
      description: "Model analysis has been copied.",
    });
  };

  const handleDelete = () => {
    setGeneratedModel("");
    setRefinementHistory([]);
    setShowRefineInput(false);
    setCritique("");
    toast({
      title: "Output cleared",
      description: "The generated model has been cleared.",
    });
  };

  // Register input setter with parent (includes focus)
  useEffect(() => {
    if (onRegisterInput) {
      onRegisterInput((text: string) => {
        setOriginalText(text);
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

  const handleGenerate = async () => {
    if (!originalText.trim()) {
      return;
    }

    setIsGenerating(true);
    setGeneratedModel("");
    setShowRefineInput(false);

    try {
      const response = await fetch("/api/model-builder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalText: originalText.trim(),
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
                setIsGenerating(false);
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedText += parsed.content;
                  setGeneratedModel(accumulatedText);
                }
              } catch (e) {
                console.error("Parse error:", e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error generating model:", error);
      setIsGenerating(false);
    }
  };

  const handleRefine = async () => {
    if (!critique.trim() || !generatedModel) {
      return;
    }

    setIsGenerating(true);
    const previousModel = generatedModel;
    const currentCritique = critique.trim();
    setGeneratedModel("");

    try {
      const response = await fetch("/api/model-builder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "refine",
          originalText: originalText.trim(),
          customInstructions: customInstructions.trim() || undefined,
          previousModel: previousModel,
          critique: currentCritique,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to refine model");
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
                // Success: save to history and clear critique
                setRefinementHistory(prev => [...prev, { model: previousModel, critique: currentCritique }]);
                setIsGenerating(false);
                setCritique("");
                break;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  accumulatedText += parsed.content;
                  setGeneratedModel(accumulatedText);
                }
              } catch (e) {
                console.error("Parse error:", e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error refining model:", error);
      // Restore the previous model on error
      setGeneratedModel(previousModel);
      setIsGenerating(false);
      toast({
        title: "Refinement failed",
        description: "Failed to refine the model. Your previous model has been restored.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <CardTitle>Model Builder</CardTitle>
        </div>
        <CardDescription>
          Validate philosophical theories and find isomorphic reinterpretations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="original-theory">Philosophical Response</Label>
              <Textarea
                ref={textareaRef}
                id="original-theory"
                placeholder="Paste the philosopher's response here, or click the arrow button on any response..."
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (originalText.trim() && !isGenerating) {
                      handleGenerate();
                    }
                  }
                }}
                rows={8}
                data-testid="input-original-theory"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-instructions">Custom Instructions (Optional)</Label>
              <Textarea
                id="custom-instructions"
                placeholder="e.g., 'Find a model from finance that validates Spinoza's theory' or 'Translate to modern cognitive science terms'"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (originalText.trim() && !isGenerating) {
                      handleGenerate();
                    }
                  }
                }}
                rows={4}
                data-testid="input-custom-instructions"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !originalText.trim()}
              className="w-full"
              data-testid="button-generate-model"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Model...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Model
                </>
              )}
            </Button>
          </div>

          {/* Output Column */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Label>Generated Model</Label>
                {generatedModel && !isGenerating && (
                  <span className="text-xs text-muted-foreground" data-testid="text-model-word-count">
                    {generatedModel.split(/\s+/).filter(w => w.length > 0).length.toLocaleString()} words
                  </span>
                )}
              </div>
              {generatedModel && !isGenerating && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-7 px-2"
                    data-testid="button-copy-model"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="h-7 px-2 text-destructive hover:text-destructive"
                    data-testid="button-delete-model"
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
                          data-testid="button-transfer-model"
                        >
                          Send to
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => onTransferContent(generatedModel, 'chat')}
                          data-testid="menu-transfer-to-chat"
                        >
                          Chat Input
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => onTransferContent(generatedModel, 'paper')}
                          data-testid="menu-transfer-to-paper"
                        >
                          Paper Writer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              )}
            </div>
            <div className="border rounded-lg p-4 min-h-[300px] max-h-[500px] overflow-y-auto bg-muted/30">
              {!generatedModel && !isGenerating ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-center">
                  <div className="space-y-2">
                    <Sparkles className="w-12 h-12 mx-auto opacity-20" />
                    <p>Generated model will appear here...</p>
                    <p className="text-xs">Click Generate to begin</p>
                  </div>
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{generatedModel}</ReactMarkdown>
                  {isGenerating && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                  )}
                </div>
              )}
            </div>

            {/* Refinement Section */}
            {generatedModel && !isGenerating && (
              <div className="space-y-2 mt-4">
                {!showRefineInput ? (
                  <Button
                    onClick={() => setShowRefineInput(true)}
                    variant="outline"
                    className="w-full"
                    data-testid="button-show-refine"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Refine Model
                  </Button>
                ) : (
                  <div className="space-y-2 p-4 border rounded-lg bg-muted/20">
                    <Label htmlFor="model-critique">Critique & Refinement Request</Label>
                    <Textarea
                      id="model-critique"
                      placeholder="e.g., 'The domain swap is correct but the validation for claim 2 is weak' or 'This model works but I need a simpler version'"
                      value={critique}
                      onChange={(e) => setCritique(e.target.value)}
                      rows={3}
                      data-testid="input-model-critique"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleRefine}
                        disabled={!critique.trim()}
                        className="flex-1"
                        data-testid="button-submit-refine"
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        Submit Refinement
                      </Button>
                      <Button
                        onClick={() => {
                          setShowRefineInput(false);
                          setCritique("");
                        }}
                        variant="outline"
                        data-testid="button-cancel-refine"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Refinement History */}
                {refinementHistory.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-sm text-muted-foreground">
                      Refinement History ({refinementHistory.length})
                    </Label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {refinementHistory.map((item, index) => (
                        <div 
                          key={index} 
                          className="p-3 border rounded-lg bg-muted/10 text-xs space-y-2"
                          data-testid={`refinement-history-${index}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-muted-foreground">
                              Critique #{index + 1}:
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setGeneratedModel(item.model);
                                toast({
                                  title: "Model restored",
                                  description: `Restored version from critique #${index + 1}`,
                                });
                              }}
                              className="h-6 px-2 text-xs"
                              data-testid={`button-restore-${index}`}
                            >
                              Restore
                            </Button>
                          </div>
                          <div className="text-foreground/80 italic">"{item.critique}"</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
