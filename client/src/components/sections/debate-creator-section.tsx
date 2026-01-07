import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Users, Swords, Upload, Search, X, Download, Copy, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Figure } from "@shared/schema";
import { DragDropUpload } from "@/components/ui/drag-drop-upload";

export function DebateCreatorSection() {
  const [debateMode, setDebateMode] = useState<"auto" | "custom">("auto");
  const [selectedThinker1, setSelectedThinker1] = useState<Figure | null>(null);
  const [selectedThinker2, setSelectedThinker2] = useState<Figure | null>(null);
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");
  const [paperText, setPaperText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [enhanced, setEnhanced] = useState(true);
  const [debateResult, setDebateResult] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(debateResult);
    toast({
      title: "Copied to clipboard",
      description: "Debate has been copied.",
    });
  };

  const handleClear = () => {
    setDebateResult("");
    toast({
      title: "Output cleared",
      description: "The debate has been cleared.",
    });
  };

  const { data: figures = [] } = useQuery<Figure[]>({
    queryKey: ['/api/figures'],
  });

  const generateDebateMutation = useMutation({
    mutationFn: async (params: {
      thinker1Id: string;
      thinker2Id: string;
      mode: "auto" | "custom";
      instructions?: string;
      paperText?: string;
      enhanced: boolean;
    }) => {
      setIsStreaming(true);
      setDebateResult("");

      const response = await fetch("/api/debate/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error("Failed to generate debate");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      return new Promise<void>(async (resolve, reject) => {
        try {
          let accumulatedText = "";
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  setIsStreaming(false);
                  resolve();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    accumulatedText += parsed.content;
                    setDebateResult(accumulatedText);
                  }
                  if (parsed.error) {
                    console.error("Streaming error:", parsed.error);
                    setIsStreaming(false);
                    reject(new Error(parsed.error));
                    return;
                  }
                } catch (err) {
                  // Ignore parsing errors for incomplete chunks
                }
              }
            }
          }
        } catch (error) {
          console.error("Stream reading error:", error);
          setIsStreaming(false);
          setDebateResult("");
          reject(error);
        }
      });
    },
  });

  const handleFileAccepted = async (file: File) => {
    setUploadedFileName(file.name);
    
    // Read file content as text
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setPaperText(content);
    };
    reader.readAsText(file);
  };
  
  const handleClearFile = () => {
    setPaperText("");
    setUploadedFileName("");
  };

  const handleGenerate = () => {
    if (!selectedThinker1 || !selectedThinker2 || isStreaming) return;

    generateDebateMutation.mutate({
      thinker1Id: selectedThinker1.id,
      thinker2Id: selectedThinker2.id,
      mode: debateMode,
      instructions: debateMode === "custom" ? customInstructions : undefined,
      paperText: paperText || undefined,
      enhanced,
    });
  };

  const handleReset = () => {
    setSelectedThinker1(null);
    setSelectedThinker2(null);
    setSearch1("");
    setSearch2("");
    setDebateMode("auto");
    setCustomInstructions("");
    setPaperText("");
    setUploadedFileName("");
    setDebateResult("");
  };

  const handleDownload = () => {
    if (!debateResult) return;
    
    const thinker1Name = selectedThinker1?.name || "Thinker1";
    const thinker2Name = selectedThinker2?.name || "Thinker2";
    const filename = `debate-${thinker1Name}-vs-${thinker2Name}-${Date.now()}.txt`;
    
    const blob = new Blob([debateResult], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredFigures1 = figures
    .filter(f => f.id !== selectedThinker2?.id)
    .filter(f => 
      search1.trim() === "" || 
      f.name.toLowerCase().includes(search1.toLowerCase()) ||
      f.title.toLowerCase().includes(search1.toLowerCase())
    );

  const filteredFigures2 = figures
    .filter(f => f.id !== selectedThinker1?.id)
    .filter(f => 
      search2.trim() === "" || 
      f.name.toLowerCase().includes(search2.toLowerCase()) ||
      f.title.toLowerCase().includes(search2.toLowerCase())
    );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Swords className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-semibold">Create a Debate</h2>
        </div>
        <p className="text-muted-foreground text-sm">
          Select two thinkers to engage in philosophical combat. Choose auto mode for maximum disagreement or customize the debate parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left Panel - Configuration */}
        <div className="space-y-6">
          {/* Thinker Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Select Debaters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* First Thinker */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">First Thinker</Label>
                {selectedThinker1 ? (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted">
                    <div className="flex items-center gap-3">
                      {selectedThinker1.icon.startsWith('/') || selectedThinker1.icon.startsWith('http') ? (
                        <img 
                          src={selectedThinker1.icon} 
                          alt={selectedThinker1.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">{selectedThinker1.icon}</span>
                      )}
                      <div>
                        <p className="font-semibold">{selectedThinker1.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedThinker1.title}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedThinker1(null)}
                      data-testid="button-clear-thinker1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search thinkers..."
                        value={search1}
                        onChange={(e) => setSearch1(e.target.value)}
                        className="pl-9"
                        data-testid="input-search-debate-thinker1"
                      />
                    </div>
                    <ScrollArea className="h-[200px] border rounded-lg">
                      <div className="p-2 space-y-1">
                        {filteredFigures1.map((figure) => (
                          <div
                            key={figure.id}
                            onClick={() => setSelectedThinker1(figure)}
                            className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer transition-colors"
                            data-testid={`select-debate-thinker1-${figure.id}`}
                          >
                            {figure.icon.startsWith('/') || figure.icon.startsWith('http') ? (
                              <img 
                                src={figure.icon} 
                                alt={figure.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-xl">{figure.icon}</span>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{figure.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{figure.title}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              {/* Second Thinker */}
              <div>
                <Label className="text-sm font-semibold mb-2 block">Second Thinker</Label>
                {selectedThinker2 ? (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-muted">
                    <div className="flex items-center gap-3">
                      {selectedThinker2.icon.startsWith('/') || selectedThinker2.icon.startsWith('http') ? (
                        <img 
                          src={selectedThinker2.icon} 
                          alt={selectedThinker2.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl">{selectedThinker2.icon}</span>
                      )}
                      <div>
                        <p className="font-semibold">{selectedThinker2.name}</p>
                        <p className="text-xs text-muted-foreground">{selectedThinker2.title}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedThinker2(null)}
                      data-testid="button-clear-thinker2"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="relative mb-2">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search thinkers..."
                        value={search2}
                        onChange={(e) => setSearch2(e.target.value)}
                        className="pl-9"
                        data-testid="input-search-debate-thinker2"
                      />
                    </div>
                    <ScrollArea className="h-[200px] border rounded-lg">
                      <div className="p-2 space-y-1">
                        {filteredFigures2.map((figure) => (
                          <div
                            key={figure.id}
                            onClick={() => setSelectedThinker2(figure)}
                            className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer transition-colors"
                            data-testid={`select-debate-thinker2-${figure.id}`}
                          >
                            {figure.icon.startsWith('/') || figure.icon.startsWith('http') ? (
                              <img 
                                src={figure.icon} 
                                alt={figure.name}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-xl">{figure.icon}</span>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{figure.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{figure.title}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Debate Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Debate Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="debate-mode"
                  checked={debateMode === "custom"}
                  onCheckedChange={(checked) => setDebateMode(checked ? "custom" : "auto")}
                  data-testid="switch-debate-mode"
                />
                <Label htmlFor="debate-mode" className="cursor-pointer">
                  {debateMode === "auto" ? "Auto (Maximum Disagreement)" : "Custom Instructions"}
                </Label>
              </div>

              {debateMode === "custom" && (
                <div>
                  <Label className="text-sm mb-2 block">Topic or Instructions</Label>
                  <Textarea
                    placeholder="Enter a topic (e.g., 'free will', 'the nature of consciousness', 'whether empiricism is self-refuting') or specific instructions..."
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    rows={4}
                    className="resize-none"
                    data-testid="textarea-custom-instructions"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Just type a topic or question - no paper required
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Enhanced Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enhanced-mode"
                  checked={enhanced}
                  onCheckedChange={setEnhanced}
                  data-testid="switch-enhanced-mode"
                />
                <Label htmlFor="enhanced-mode" className="cursor-pointer">
                  Enable RAG for deeper philosophical grounding
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Uses retrieval-augmented generation to ground responses in actual philosophical positions
              </p>
            </CardContent>
          </Card>

          {/* Paper Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="w-4 h-4" />
                Optional: Add Context
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <DragDropUpload
                onFileAccepted={handleFileAccepted}
                onClear={handleClearFile}
                currentFileName={uploadedFileName}
                accept=".txt,.md,.doc,.docx,.pdf"
                maxSizeBytes={5 * 1024 * 1024}
                data-testid="drag-drop-upload-debate"
              />
              <div>
                <Label className="text-sm mb-2 block">Or paste additional context:</Label>
                <Textarea
                  placeholder="Optional: paste a paper, argument, or additional context for the debate..."
                  value={paperText}
                  onChange={(e) => setPaperText(e.target.value)}
                  rows={3}
                  className="resize-none"
                  data-testid="textarea-paper-content"
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={!selectedThinker1 || !selectedThinker2 || isStreaming}
              className="flex-1"
              data-testid="button-generate-debate"
            >
              {isStreaming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Streaming Debate...
                </>
              ) : (
                <>
                  <Swords className="w-4 h-4 mr-2" />
                  Generate Debate
                </>
              )}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={isStreaming}
              data-testid="button-reset-debate"
            >
              Reset
            </Button>
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="flex flex-col">
          <Card className="flex flex-col h-full min-h-[600px]">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Debate Results</CardTitle>
                  {debateResult && !isStreaming && (
                    <p className="text-xs text-muted-foreground mt-1" data-testid="text-debate-word-count">
                      {debateResult.split(/\s+/).filter(w => w.length > 0).length.toLocaleString()} words
                    </p>
                  )}
                </div>
                {debateResult && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleCopy}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      data-testid="button-copy-debate"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button
                      onClick={handleClear}
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-destructive hover:text-destructive"
                      data-testid="button-clear-debate"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      data-testid="button-download-debate"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
              {debateResult ? (
                <ScrollArea className="flex-1 px-6 pb-6">
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap" data-testid="debate-result">
                    {debateResult}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex items-center justify-center flex-1 text-center text-muted-foreground px-6 pb-6">
                  <div>
                    <Swords className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Select two thinkers and click "Generate Debate"</p>
                    <p className="text-sm mt-1">The debate will appear here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
