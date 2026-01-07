import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X, Users, Download, Search, Trash2, Copy, Check, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Figure, FigureMessage, PersonaSettings } from "@shared/schema";

interface ComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  figures: Figure[];
}

export function ComparisonModal({ open, onOpenChange, figures }: ComparisonModalProps) {
  const [selectedFigure1, setSelectedFigure1] = useState<Figure | null>(null);
  const [selectedFigure2, setSelectedFigure2] = useState<Figure | null>(null);
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");
  const [input, setInput] = useState("");
  const [streaming1, setStreaming1] = useState("");
  const [streaming2, setStreaming2] = useState("");
  const [pending1, setPending1] = useState("");
  const [pending2, setPending2] = useState("");
  const [isStreaming1, setIsStreaming1] = useState(false);
  const [isStreaming2, setIsStreaming2] = useState(false);
  const [messageCount1BeforePending, setMessageCount1BeforePending] = useState<number>(0);
  const [messageCount2BeforePending, setMessageCount2BeforePending] = useState<number>(0);
  const [copiedMessageId, setCopiedMessageId] = useState<string | number | null>(null);
  const messagesEndRef1 = useRef<HTMLDivElement>(null);
  const messagesEndRef2 = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleCopyMessage = async (messageId: string | number, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast({
        title: "Copied to clipboard",
        description: "Message content has been copied.",
      });
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const { data: messages1 = [] } = useQuery<FigureMessage[]>({
    queryKey: [`/api/figures/${selectedFigure1?.id}/messages`],
    enabled: !!selectedFigure1 && open,
  });

  const { data: messages2 = [] } = useQuery<FigureMessage[]>({
    queryKey: [`/api/figures/${selectedFigure2?.id}/messages`],
    enabled: !!selectedFigure2 && open,
  });

  // Fetch persona settings to pass with chat requests
  const { data: personaSettings } = useQuery<PersonaSettings>({
    queryKey: ["/api/persona-settings"],
  });

  const streamResponse = async (
    figure: Figure, 
    setStreaming: (msg: string) => void, 
    setIsStreaming: (val: boolean) => void,
    setPending: (msg: string) => void,
    setMessageCountBeforePending: (count: number) => void,
    messagesQueryKey: string
  ) => {
    if (!figure) {
      console.log("streamResponse: no figure provided");
      return;
    }

    console.log(`Starting stream for ${figure.name}, message: "${input.trim()}"`);
    setIsStreaming(true);
    setStreaming("");
    // DON'T clear pending here - let useEffect clear it once persisted
    // setPending(""); // REMOVED - this would wipe out previous response before persistence

    try {
      const response = await fetch(`/api/figures/${figure.id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({ 
          message: input.trim(),
          // Pass settings directly to avoid session mismatch issues
          settings: personaSettings ? {
            responseLength: personaSettings.responseLength || 750,
            quoteFrequency: personaSettings.quoteFrequency || 0,
            selectedModel: personaSettings.selectedModel || "zhi5",
            enhancedMode: personaSettings.enhancedMode ?? true,
            dialogueMode: personaSettings.dialogueMode ?? true,
          } : undefined
        }),
      });

      console.log(`Response status for ${figure.name}:`, response.status, response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response for ${figure.name}:`, errorText);
        throw new Error(`Failed to send message: ${response.status} ${errorText}`);
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

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setIsStreaming(false);
              
              // CRITICAL FIX: Keep streaming message visible as pending until persisted
              const currentMessages = queryClient.getQueryData<FigureMessage[]>([messagesQueryKey]) || [];
              setMessageCountBeforePending(currentMessages.length);
              setPending(accumulatedText);
              setStreaming("");
              
              // Refetch to get the real message from backend
              await queryClient.invalidateQueries({
                queryKey: [messagesQueryKey],
              });
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                accumulatedText += parsed.content;
                setStreaming(accumulatedText);
              }
            } catch (err) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error(`Stream error for ${figure.name}:`, error);
      setIsStreaming(false);
      setStreaming("");
      setPending("");
      // Show error to user (temporarily)
      setStreaming(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setStreaming(""), 3000);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isStreaming1 || isStreaming2 || !selectedFigure1 || !selectedFigure2) {
      console.log("handleSend blocked:", { 
        hasInput: !!input.trim(), 
        isStreaming1, 
        isStreaming2, 
        hasFigure1: !!selectedFigure1, 
        hasFigure2: !!selectedFigure2 
      });
      return;
    }
    
    console.log("Starting comparison chat with:", selectedFigure1.name, "and", selectedFigure2.name);
    
    // Send to both figures in parallel
    await Promise.all([
      streamResponse(
        selectedFigure1, 
        setStreaming1, 
        setIsStreaming1,
        setPending1,
        setMessageCount1BeforePending,
        `/api/figures/${selectedFigure1.id}/messages`
      ),
      streamResponse(
        selectedFigure2, 
        setStreaming2, 
        setIsStreaming2,
        setPending2,
        setMessageCount2BeforePending,
        `/api/figures/${selectedFigure2.id}/messages`
      ),
    ]);

    setInput("");
  };

  const handleReset = () => {
    setSelectedFigure1(null);
    setSelectedFigure2(null);
    setInput("");
    setStreaming1("");
    setStreaming2("");
    setPending1("");
    setPending2("");
    setMessageCount1BeforePending(0);
    setMessageCount2BeforePending(0);
  };

  const handleDelete = async () => {
    if (!selectedFigure1 || !selectedFigure2) return;
    
    try {
      // Delete both conversations
      await Promise.all([
        fetch(`/api/figures/${selectedFigure1.id}/messages`, {
          method: 'DELETE',
          credentials: 'include',
        }),
        fetch(`/api/figures/${selectedFigure2.id}/messages`, {
          method: 'DELETE',
          credentials: 'include',
        })
      ]);

      // Clear local state
      setStreaming1("");
      setStreaming2("");
      setPending1("");
      setPending2("");
      setMessageCount1BeforePending(0);
      setMessageCount2BeforePending(0);
      
      // Invalidate queries to refresh
      await queryClient.invalidateQueries({
        queryKey: [`/api/figures/${selectedFigure1.id}/messages`],
      });
      await queryClient.invalidateQueries({
        queryKey: [`/api/figures/${selectedFigure2.id}/messages`],
      });
    } catch (error) {
      console.error('Error deleting comparison messages:', error);
    }
  };

  // Clear pending message 1 once it appears in the fetched messages
  useEffect(() => {
    if (pending1 && messages1.length > 0) {
      if (messages1.length > messageCount1BeforePending) {
        const lastMessage = messages1[messages1.length - 1];
        // Use robust comparison to handle potential whitespace differences
        if (lastMessage.role === "assistant" && 
            lastMessage.content.trim() === pending1.trim()) {
          setPending1("");
          setMessageCount1BeforePending(0);
        }
      }
    }
  }, [messages1, pending1, messageCount1BeforePending]);

  // Clear pending message 2 once it appears in the fetched messages
  useEffect(() => {
    if (pending2 && messages2.length > 0) {
      if (messages2.length > messageCount2BeforePending) {
        const lastMessage = messages2[messages2.length - 1];
        // Use robust comparison to handle potential whitespace differences
        if (lastMessage.role === "assistant" && 
            lastMessage.content.trim() === pending2.trim()) {
          setPending2("");
          setMessageCount2BeforePending(0);
        }
      }
    }
  }, [messages2, pending2, messageCount2BeforePending]);

  const handleDownload = () => {
    if (!selectedFigure1 || !selectedFigure2) return;
    
    const timestamp = new Date().toLocaleString();
    let content = `Philosophical Comparison: ${selectedFigure1.name} vs ${selectedFigure2.name}\n`;
    content += `Generated: ${timestamp}\n`;
    content += `${'='.repeat(80)}\n\n`;
    
    // Get all assistant responses from both thinkers
    const responses1 = messages1.filter(m => m.role === 'assistant');
    const responses2 = messages2.filter(m => m.role === 'assistant');
    const userMessages = messages1.filter(m => m.role === 'user');
    
    // Include pending responses if they exist
    const allResponses1 = [...responses1.map(m => m.content)];
    const allResponses2 = [...responses2.map(m => m.content)];
    if (pending1) allResponses1.push(pending1);
    if (pending2) allResponses2.push(pending2);
    
    // Match questions with responses by index
    userMessages.forEach((userMsg, index) => {
      content += `QUESTION ${index + 1}:\n`;
      content += `${userMsg.content}\n\n`;
      content += `${'-'.repeat(80)}\n\n`;
      
      if (allResponses1[index]) {
        content += `${selectedFigure1.name.toUpperCase()}'S RESPONSE:\n`;
        content += `${allResponses1[index]}\n\n`;
      }
      
      if (allResponses2[index]) {
        content += `${selectedFigure2.name.toUpperCase()}'S RESPONSE:\n`;
        content += `${allResponses2[index]}\n\n`;
      }
      
      content += `${'='.repeat(80)}\n\n`;
    });
    
    // If no structured content, just dump all responses
    if (userMessages.length === 0 && (allResponses1.length > 0 || allResponses2.length > 0)) {
      if (allResponses1.length > 0) {
        content += `${selectedFigure1.name.toUpperCase()}'S RESPONSES:\n\n`;
        allResponses1.forEach((r, i) => {
          content += `Response ${i + 1}:\n${r}\n\n`;
        });
        content += `${'-'.repeat(80)}\n\n`;
      }
      if (allResponses2.length > 0) {
        content += `${selectedFigure2.name.toUpperCase()}'S RESPONSES:\n\n`;
        allResponses2.forEach((r, i) => {
          content += `Response ${i + 1}:\n${r}\n\n`;
        });
      }
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `${selectedFigure1.name.replace(/\s+/g, '_')}_vs_${selectedFigure2.name.replace(/\s+/g, '_')}_comparison_${Date.now()}.txt`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Comparison saved to file.",
    });
  };

  useEffect(() => {
    if (messagesEndRef1.current) {
      messagesEndRef1.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages1, streaming1, pending1]);

  useEffect(() => {
    if (messagesEndRef2.current) {
      messagesEndRef2.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages2, streaming2, pending2]);

  const isSelectionMode = !selectedFigure1 || !selectedFigure2;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              <DialogTitle className="text-xl">Compare Two Thinkers</DialogTitle>
            </div>
            {!isSelectionMode && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={messages1.length === 0 && messages2.length === 0}
                  data-testid="button-delete-comparison"
                  title="Delete conversation history"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={messages1.length === 0 && messages2.length === 0}
                  data-testid="button-download-comparison"
                  title="Download both responses"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  data-testid="button-change-thinkers"
                >
                  Change Thinkers
                </Button>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {isSelectionMode 
              ? "Select two philosophers to compare their perspectives side-by-side"
              : `Comparing: ${selectedFigure1?.name} vs ${selectedFigure2?.name}`
            }
          </p>
        </DialogHeader>

        {isSelectionMode ? (
          <div className="flex-1 px-6 py-8 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Select First Thinker */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {selectedFigure1 ? "✓ First Thinker Selected" : "Select First Thinker"}
                </h3>
                {selectedFigure1 ? (
                  <Card className="border-2 border-primary">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        {selectedFigure1.icon.startsWith('/') || selectedFigure1.icon.startsWith('http') ? (
                          <img 
                            src={selectedFigure1.icon} 
                            alt={selectedFigure1.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl">{selectedFigure1.icon}</span>
                        )}
                        <CardTitle>{selectedFigure1.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{selectedFigure1.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFigure1(null)}
                        className="mt-3"
                      >
                        Change
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search thinkers..."
                        value={search1}
                        onChange={(e) => setSearch1(e.target.value)}
                        className="pl-9"
                        data-testid="input-search-figure1"
                      />
                    </div>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2 pr-4">
                        {figures
                          .filter(f => f.id !== selectedFigure2?.id)
                          .filter(f => 
                            search1.trim() === "" || 
                            f.name.toLowerCase().includes(search1.toLowerCase()) ||
                            f.title.toLowerCase().includes(search1.toLowerCase())
                          )
                          .map((figure) => (
                          <Card
                            key={figure.id}
                            className="cursor-pointer hover:border-primary transition-colors"
                            onClick={() => setSelectedFigure1(figure)}
                            data-testid={`select-figure1-${figure.id}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                                {figure.icon.startsWith('/') || figure.icon.startsWith('http') ? (
                                  <img 
                                    src={figure.icon} 
                                    alt={figure.name}
                                    className="w-10 h-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-2xl">{figure.icon}</span>
                                )}
                                <div className="flex-1">
                                  <h4 className="font-semibold">{figure.name}</h4>
                                  <p className="text-xs text-muted-foreground">{figure.title}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              {/* Right Column - Select Second Thinker */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {selectedFigure2 ? "✓ Second Thinker Selected" : "Select Second Thinker"}
                </h3>
                {selectedFigure2 ? (
                  <Card className="border-2 border-primary">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        {selectedFigure2.icon.startsWith('/') || selectedFigure2.icon.startsWith('http') ? (
                          <img 
                            src={selectedFigure2.icon} 
                            alt={selectedFigure2.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-3xl">{selectedFigure2.icon}</span>
                        )}
                        <CardTitle>{selectedFigure2.name}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{selectedFigure2.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFigure2(null)}
                        className="mt-3"
                      >
                        Change
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search thinkers..."
                        value={search2}
                        onChange={(e) => setSearch2(e.target.value)}
                        className="pl-9"
                        data-testid="input-search-figure2"
                      />
                    </div>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-2 pr-4">
                        {figures
                          .filter(f => f.id !== selectedFigure1?.id)
                          .filter(f => 
                            search2.trim() === "" || 
                            f.name.toLowerCase().includes(search2.toLowerCase()) ||
                            f.title.toLowerCase().includes(search2.toLowerCase())
                          )
                          .map((figure) => (
                          <Card
                            key={figure.id}
                            className="cursor-pointer hover:border-primary transition-colors"
                            onClick={() => setSelectedFigure2(figure)}
                            data-testid={`select-figure2-${figure.id}`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center gap-3">
                              {figure.icon.startsWith('/') || figure.icon.startsWith('http') ? (
                                <img 
                                  src={figure.icon} 
                                  alt={figure.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-2xl">{figure.icon}</span>
                              )}
                              <div className="flex-1">
                                <h4 className="font-semibold">{figure.name}</h4>
                                <p className="text-xs text-muted-foreground">{figure.title}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Comparison View - Two Columns */}
            <div className="flex-1 grid grid-cols-2 gap-4 px-6 min-h-0">
              {/* Left Column - Figure 1 */}
              <div className="flex flex-col border-r pr-4 min-h-0">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b flex-shrink-0">
                  {selectedFigure1.icon.startsWith('/') || selectedFigure1.icon.startsWith('http') ? (
                    <div className="relative">
                      <img 
                        src={selectedFigure1.icon} 
                        alt={selectedFigure1.name}
                        className={`w-12 h-12 rounded-full object-cover border-2 border-primary/20 transition-transform duration-500 ${isStreaming1 ? 'animate-spin' : ''}`}
                      />
                      {isStreaming1 && (
                        <div className="absolute -inset-1 rounded-full border-2 border-primary/50 animate-ping" />
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <span className={`text-3xl transition-transform duration-500 ${isStreaming1 ? 'animate-spin' : ''}`}>
                        {selectedFigure1.icon}
                      </span>
                      {isStreaming1 && (
                        <div className="absolute -inset-2 rounded-full border-2 border-primary/50 animate-ping" />
                      )}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{selectedFigure1.name}</h3>
                    <p className="text-xs text-muted-foreground">{selectedFigure1.title}</p>
                  </div>
                </div>

                <ScrollArea className="flex-1 h-0">
                  <div className="space-y-4 pr-2">
                    {messages1.map((message) => (
                      <div
                        key={message.id}
                        className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[90%] rounded-lg px-3 py-2 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.role !== "user" && (
                          <div className="flex items-center justify-between w-full max-w-[90%] mt-1">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyMessage(message.id, message.content)}
                                className="h-6 px-2 text-xs"
                                data-testid={`button-copy-compare1-${message.id}`}
                              >
                                {copiedMessageId === message.id ? (
                                  <>
                                    <Check className="h-3 w-3 mr-1 text-green-500" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const encodedText = encodeURIComponent(message.content);
                                  window.location.href = `/model-builder?text=${encodedText}`;
                                }}
                                className="h-6 px-2 text-xs"
                                data-testid={`button-model-builder-compare1-${message.id}`}
                              >
                                Model Builder
                                <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {message.content.split(/\s+/).filter(w => w.length > 0).length.toLocaleString()} words
                            </span>
                          </div>
                        )}
                      </div>
                    ))}

                    {streaming1 && (
                      <div className="flex justify-start">
                        <div className="max-w-[90%] rounded-lg px-3 py-2 bg-muted">
                          <p className="text-sm whitespace-pre-wrap">{streaming1}</p>
                          <span className="inline-block w-1 h-4 bg-foreground/50 ml-0.5 animate-pulse" />
                        </div>
                      </div>
                    )}

                    {pending1 && !streaming1 && (
                      <div className="flex flex-col items-start">
                        <div className="max-w-[90%] rounded-lg px-3 py-2 bg-muted">
                          <p className="text-sm whitespace-pre-wrap">{pending1}</p>
                        </div>
                        <div className="flex items-center justify-between w-full max-w-[90%] mt-1">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyMessage('pending1', pending1)}
                              className="h-6 px-2 text-xs"
                              data-testid="button-copy-pending1"
                            >
                              {copiedMessageId === 'pending1' ? (
                                <>
                                  <Check className="h-3 w-3 mr-1 text-green-500" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {pending1.split(/\s+/).filter(w => w.length > 0).length.toLocaleString()} words
                          </span>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef1} />
                  </div>
                </ScrollArea>
              </div>

              {/* Right Column - Figure 2 */}
              <div className="flex flex-col pl-4 min-h-0">
                <div className="flex items-center gap-3 mb-4 pb-3 border-b flex-shrink-0">
                  {selectedFigure2.icon.startsWith('/') || selectedFigure2.icon.startsWith('http') ? (
                    <div className="relative">
                      <img 
                        src={selectedFigure2.icon} 
                        alt={selectedFigure2.name}
                        className={`w-12 h-12 rounded-full object-cover border-2 border-primary/20 transition-transform duration-500 ${isStreaming2 ? 'animate-spin' : ''}`}
                      />
                      {isStreaming2 && (
                        <div className="absolute -inset-1 rounded-full border-2 border-primary/50 animate-ping" />
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <span className={`text-3xl transition-transform duration-500 ${isStreaming2 ? 'animate-spin' : ''}`}>
                        {selectedFigure2.icon}
                      </span>
                      {isStreaming2 && (
                        <div className="absolute -inset-2 rounded-full border-2 border-primary/50 animate-ping" />
                      )}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">{selectedFigure2.name}</h3>
                    <p className="text-xs text-muted-foreground">{selectedFigure2.title}</p>
                  </div>
                </div>

                <ScrollArea className="flex-1 h-0">
                  <div className="space-y-4 pr-2">
                    {messages2.map((message) => (
                      <div
                        key={message.id}
                        className={`flex flex-col ${message.role === "user" ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[90%] rounded-lg px-3 py-2 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.role !== "user" && (
                          <div className="flex items-center justify-between w-full max-w-[90%] mt-1">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyMessage(message.id, message.content)}
                                className="h-6 px-2 text-xs"
                                data-testid={`button-copy-compare2-${message.id}`}
                              >
                                {copiedMessageId === message.id ? (
                                  <>
                                    <Check className="h-3 w-3 mr-1 text-green-500" />
                                    Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const encodedText = encodeURIComponent(message.content);
                                  window.location.href = `/model-builder?text=${encodedText}`;
                                }}
                                className="h-6 px-2 text-xs"
                                data-testid={`button-model-builder-compare2-${message.id}`}
                              >
                                Model Builder
                                <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {message.content.split(/\s+/).filter(w => w.length > 0).length.toLocaleString()} words
                            </span>
                          </div>
                        )}
                      </div>
                    ))}

                    {streaming2 && (
                      <div className="flex justify-start">
                        <div className="max-w-[90%] rounded-lg px-3 py-2 bg-muted">
                          <p className="text-sm whitespace-pre-wrap">{streaming2}</p>
                          <span className="inline-block w-1 h-4 bg-foreground/50 ml-0.5 animate-pulse" />
                        </div>
                      </div>
                    )}

                    {pending2 && !streaming2 && (
                      <div className="flex flex-col items-start">
                        <div className="max-w-[90%] rounded-lg px-3 py-2 bg-muted">
                          <p className="text-sm whitespace-pre-wrap">{pending2}</p>
                        </div>
                        <div className="flex items-center justify-between w-full max-w-[90%] mt-1">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyMessage('pending2', pending2)}
                              className="h-6 px-2 text-xs"
                              data-testid="button-copy-pending2"
                            >
                              {copiedMessageId === 'pending2' ? (
                                <>
                                  <Check className="h-3 w-3 mr-1 text-green-500" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-1" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                            {pending2.split(/\s+/).filter(w => w.length > 0).length.toLocaleString()} words
                          </span>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef2} />
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Input Area */}
            <div className="px-6 py-4 border-t">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={`Ask both ${selectedFigure1.name} and ${selectedFigure2.name} the same question...`}
                  disabled={isStreaming1 || isStreaming2}
                  data-testid="input-comparison-message"
                  className="min-h-[100px] resize-none"
                  rows={4}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isStreaming1 || isStreaming2}
                  data-testid="button-send-comparison"
                  className="h-10"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Both thinkers will respond simultaneously in real-time
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
