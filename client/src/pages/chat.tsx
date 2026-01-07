import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ChatMessage } from "@/components/chat-message";
import { ChatInput } from "@/components/chat-input";
import { ThemeToggle } from "@/components/theme-toggle";
import { FigureChat } from "@/components/figure-chat";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Search, Users, Star, User, LogOut, History, Download, MessageSquare, Plus } from "lucide-react";
import type { Message, PersonaSettings, Figure } from "@shared/schema";
import { ComparisonModal } from "@/components/comparison-modal";
import { ModelBuilderSection } from "@/components/model-builder-section";
import { PaperWriterSection } from "@/components/paper-writer-section";
import { QuoteGeneratorSection } from "@/components/quote-generator-section";
import { PositionGeneratorSection } from "@/components/position-generator-section";
import { DialogueCreatorSection } from "@/components/dialogue-creator-section";
import { InterviewCreatorSection } from "@/components/interview-creator-section";
import { DebateCreatorSection } from "@/components/sections/debate-creator-section";
import { ThinkingPanel } from "@/components/thinking-panel";
import { AuditPanel } from "@/components/audit-panel";
import { FileSearch } from "lucide-react";

interface TraceEvent {
  timestamp: number;
  type: 'query' | 'search_start' | 'passage_found' | 'passage_rejected' | 'direct_answer' | 'alignment_check' | 'generation_start' | 'complete' | 'error';
  table?: 'positions' | 'quotes' | 'chunks';
  sql?: string;
  passage?: string;
  passageId?: number;
  reason?: string;
  answerNumber?: 1 | 2 | 3;
  aligned?: boolean;
  conflicting?: boolean;
  message?: string;
}

const DEFAULT_PERSONA_SETTINGS: Partial<PersonaSettings> = {
  responseLength: 750,
  writePaper: false,
  quoteFrequency: 0,
  enhancedMode: true,
  dialogueMode: true,
};

export default function Chat() {
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingAssistantMessage, setPendingAssistantMessage] = useState<string>("");
  const [pendingUserMessage, setPendingUserMessage] = useState<string>("");
  const [messageCountBeforePending, setMessageCountBeforePending] = useState<number>(0);
  const [userMessageCountBeforePending, setUserMessageCountBeforePending] = useState<number>(0);
  const [selectedFigure, setSelectedFigure] = useState<Figure | null>(null);
  const [figureDialogOpen, setFigureDialogOpen] = useState(false);
  const [figureSearchQuery, setFigureSearchQuery] = useState("");
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [showChatHistory, setShowChatHistory] = useState(false);
  
  // Audit mode state
  const [auditMode, setAuditMode] = useState(false);
  const [auditEvents, setAuditEvents] = useState<TraceEvent[]>([]);
  const [auditReport, setAuditReport] = useState<string>("");
  const [currentQuestion, setCurrentQuestion] = useState<string>("");

  // Content transfer system: refs to input setters
  const [chatInputContent, setChatInputContent] = useState<{ text: string; version: number }>({ text: "", version: 0 });
  const modelBuilderInputRef = useRef<(text: string) => void>(() => {});
  const paperWriterTopicRef = useRef<(topic: string) => void>(() => {});
  const dialogueCreatorInputRef = useRef<(text: string) => void>(() => {});

  // Transfer handler for cross-section content flow
  const handleContentTransfer = (content: string, target: 'chat' | 'model' | 'paper' | 'dialogue') => {
    if (target === 'chat') {
      setChatInputContent(prev => ({ text: content, version: prev.version + 1 }));
      // Scroll to chat input
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (target === 'model') {
      if (modelBuilderInputRef.current) {
        modelBuilderInputRef.current(content);
        // Scroll to model builder section
        document.getElementById('model-builder-section')?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (target === 'paper') {
      if (paperWriterTopicRef.current) {
        paperWriterTopicRef.current(content);
        // Scroll to paper writer section
        document.getElementById('paper-writer-section')?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (target === 'dialogue') {
      if (dialogueCreatorInputRef.current) {
        dialogueCreatorInputRef.current(content);
        // Scroll to dialogue creator section
        document.getElementById('dialogue-creator-section')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      return await apiRequest("DELETE", `/api/messages/${messageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
  });

  // Delete message handler
  const handleDeleteMessage = (messageId: string) => {
    deleteMessageMutation.mutate(messageId);
  };

  const { data: fetchedSettings, isLoading: settingsLoading } = useQuery<PersonaSettings>({
    queryKey: ["/api/persona-settings"],
  });

  const { data: figures = [], isLoading: figuresLoading } = useQuery<Figure[]>({
    queryKey: ["/api/figures"],
  });

  // User login state
  const { data: userData } = useQuery<{ user: { id: string; username: string; firstName: string } | null }>({
    queryKey: ["/api/user"],
  });

  // Chat history
  const { data: chatHistoryData, refetch: refetchChatHistory } = useQuery<{ 
    conversations: { id: string; title: string; messageCount: number; preview: string; createdAt: string }[] 
  }>({
    queryKey: ["/api/chat-history"],
    enabled: !!userData?.user,
  });
  
  const personaSettings = fetchedSettings || DEFAULT_PERSONA_SETTINGS as PersonaSettings;

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });

  const updatePersonaMutation = useMutation({
    mutationFn: async (settings: Partial<PersonaSettings>) => {
      return apiRequest("POST", "/api/persona-settings", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/persona-settings"] });
    },
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (username: string) => {
      return apiRequest("POST", "/api/login", { username });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat-history"] });
      setLoginUsername("");
      toast({ title: "Logged in", description: "You can now access your past chats" });
    },
    onError: () => {
      toast({ title: "Login failed", description: "Please try again", variant: "destructive" });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/logout", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat-history"] });
      toast({ title: "Logged out" });
    },
  });

  // New chat mutation
  const newChatMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/chat/new", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat-history"] });
      toast({ title: "New chat started" });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUsername.trim().length >= 2) {
      loginMutation.mutate(loginUsername.trim());
    }
  };

  const handleSendMessage = async (content: string, documentText?: string) => {
    setIsStreaming(true);
    setStreamingMessage("");
    setPendingAssistantMessage("");
    
    // Reset audit state if in audit mode
    if (auditMode) {
      setAuditEvents([]);
      setAuditReport("");
      setCurrentQuestion(content);
    }

    // CRITICAL FIX: Track pending user message to keep it visible until persisted
    const currentMessages = queryClient.getQueryData<Message[]>(["/api/messages"]) || [];
    setUserMessageCountBeforePending(currentMessages.length);
    setPendingUserMessage(content);

    // Choose endpoint based on audit mode
    const endpoint = auditMode ? "/api/chat/stream-audited" : "/api/chat/stream";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: content, documentText }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let accumulatedText = "";
        let buffer = "";
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode without streaming flag to get complete chunks
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                setIsStreaming(false);
                
                // CRITICAL FIX v2: Don't clear streaming message yet
                // Keep it visible as pendingAssistantMessage until refetch confirms persistence
                // Track message count to ensure we wait for the NEW message, not just any matching text
                const currentMessages = queryClient.getQueryData<Message[]>(["/api/messages"]) || [];
                setMessageCountBeforePending(currentMessages.length);
                setPendingAssistantMessage(accumulatedText);
                setStreamingMessage("");
                
                // Refetch to get the real message from backend (with correct ID)
                queryClient.refetchQueries({ queryKey: ["/api/messages"] });
                break;
              }
              try {
                const parsed = JSON.parse(data);
                
                // Handle audit trace events
                if (parsed.trace && auditMode) {
                  setAuditEvents(prev => [...prev, parsed.trace as TraceEvent]);
                }
                
                // Handle audit report
                if (parsed.auditReport && auditMode) {
                  setAuditReport(parsed.auditReport);
                }
                
                // Handle regular content
                if (parsed.content) {
                  accumulatedText += parsed.content;
                  setStreamingMessage(accumulatedText);
                }
              } catch (e) {
                console.error("Parse error:", e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
      setIsStreaming(false);
      setStreamingMessage("");
      setPendingAssistantMessage("");
      setPendingUserMessage("");
      setMessageCountBeforePending(0);
      setUserMessageCountBeforePending(0);
    }
  };

  // Clear pending user message once it appears in the fetched messages
  useEffect(() => {
    if (pendingUserMessage && messages.length > 0) {
      if (messages.length > userMessageCountBeforePending) {
        // Find the most recent user message that matches our pending content
        const recentUserMessages = messages.filter(m => m.role === "user");
        if (recentUserMessages.length > 0) {
          const lastUserMessage = recentUserMessages[recentUserMessages.length - 1];
          if (lastUserMessage.content.trim() === pendingUserMessage.trim()) {
            setPendingUserMessage("");
            setUserMessageCountBeforePending(0);
          }
        }
      }
    }
  }, [messages, pendingUserMessage, userMessageCountBeforePending]);

  // Clear pending assistant message once it appears in the fetched messages
  useEffect(() => {
    if (pendingAssistantMessage && messages.length > 0) {
      // Only clear if message count has increased (confirming new message was persisted)
      // AND the last message matches our pending content
      if (messages.length > messageCountBeforePending) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === "assistant" && lastMessage.content.trim() === pendingAssistantMessage.trim()) {
          setPendingAssistantMessage("");
          setMessageCountBeforePending(0);
        }
      }
    }
  }, [messages, pendingAssistantMessage, messageCountBeforePending]);

  // Auto-scroll: scroll when streaming OR when new messages appear
  useEffect(() => {
    if (streamingMessage || pendingAssistantMessage || pendingUserMessage) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamingMessage, pendingAssistantMessage, pendingUserMessage]);
  
  // Also scroll when message count changes (new messages added)
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  if (settingsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const filteredFigures = figures.filter((figure) =>
    figure.name.toLowerCase().includes(figureSearchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col lg:flex-row">
      {/* Far Left Column: Philosopher Figures - ALWAYS VISIBLE */}
      <aside className="w-40 border-r border-amber-200/30 dark:border-slate-700 flex-shrink-0 overflow-y-auto bg-gradient-to-b from-amber-50/50 via-orange-50/30 to-amber-50/50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800 hidden lg:block">
        <div className="p-2 border-b border-amber-200/30 dark:border-slate-700 sticky top-0 bg-amber-50/80 dark:bg-slate-800/90 backdrop-blur-sm z-10 space-y-2">
          <div className="text-xs font-semibold text-center text-muted-foreground">
            Talk with
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search..."
              value={figureSearchQuery}
              onChange={(e) => setFigureSearchQuery(e.target.value)}
              className="h-7 text-xs pl-7 pr-2"
              data-testid="input-search-figures"
            />
          </div>
        </div>
        <div className="p-2">
          {figuresLoading ? (
            <div className="text-xs text-muted-foreground text-center">Loading...</div>
          ) : filteredFigures.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center">
              {figureSearchQuery ? "No matches" : "No figures"}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {/* Row-major layout: reads left-to-right, top-to-bottom alphabetically */}
              {filteredFigures.map((figure) => (
                <button
                  key={figure.id}
                  onClick={() => {
                    setSelectedFigure(figure);
                    setFigureDialogOpen(true);
                  }}
                  className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-primary/10 transition-colors group"
                  title={`${figure.name} - ${figure.title}`}
                  data-testid={`button-talk-${figure.id}`}
                >
                  {figure.icon && (figure.icon.startsWith('/') || figure.icon.startsWith('http')) ? (
                    <img 
                      src={figure.icon} 
                      alt={figure.name}
                      className="w-8 h-8 rounded-full object-cover border border-border"
                    />
                  ) : figure.icon ? (
                    <span className="text-xl">{figure.icon}</span>
                  ) : (
                    <User className="w-8 h-8 text-muted-foreground" />
                  )}
                  <span className="text-[10px] leading-tight text-center font-medium group-hover:text-primary">
                    {(() => {
                      const parts = figure.name.split(' ');
                      if (parts.length >= 2 && parts[parts.length - 2] === 'Le') {
                        return parts.slice(-2).join(' ');
                      }
                      return parts.slice(-1)[0];
                    })()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* Middle Sidebar: Settings */}
      <aside className="lg:w-64 border-r border-amber-200/30 dark:border-slate-700 flex-shrink-0 overflow-y-auto bg-gradient-to-b from-amber-50/40 via-orange-50/20 to-amber-50/40 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800">
        <div className="p-4 border-b border-amber-200/30 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-amber-50/80 dark:bg-slate-800/90 backdrop-blur-sm z-10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Settings</h2>
          </div>
          <ThemeToggle />
        </div>

        <div className="p-4 space-y-4">
          {/* Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="response-length" className="text-sm font-medium">
                  Response Length (words)
                </Label>
                <Input
                  id="response-length"
                  type="number"
                  placeholder="750"
                  value={personaSettings.responseLength || 750}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 750 : parseInt(e.target.value, 10);
                    if (!isNaN(value) && value >= 0) {
                      updatePersonaMutation.mutate({ responseLength: value });
                    }
                  }}
                  min={0}
                  data-testid="input-response-length"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Default: 750 words
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t">
                <Label htmlFor="quote-frequency" className="text-sm font-medium">
                  Number of Quotes
                </Label>
                <Input
                  id="quote-frequency"
                  type="text"
                  inputMode="numeric"
                  placeholder="7"
                  value={personaSettings.quoteFrequency || 7}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    if (inputValue === '') {
                      updatePersonaMutation.mutate({ quoteFrequency: 7 });
                      return;
                    }
                    if (!/^\d+$/.test(inputValue)) return;
                    
                    const value = parseInt(inputValue, 10);
                    if (!isNaN(value) && value >= 0 && value <= 50) {
                      updatePersonaMutation.mutate({ quoteFrequency: value });
                    }
                  }}
                  data-testid="input-quote-frequency"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Default: 7 quotes (0-50 range)
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t">
                <Label htmlFor="ai-model" className="text-sm font-medium">
                  AI Model
                </Label>
                <Select
                  value={personaSettings.selectedModel || "zhi5"}
                  onValueChange={(value) => {
                    updatePersonaMutation.mutate({ selectedModel: value });
                  }}
                >
                  <SelectTrigger id="ai-model" className="text-sm" data-testid="select-ai-model">
                    <SelectValue placeholder="Select AI Model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zhi5" data-testid="option-zhi5">
                      ZHI 5 (default)
                    </SelectItem>
                    <SelectItem value="zhi1" data-testid="option-zhi1">
                      ZHI 1
                    </SelectItem>
                    <SelectItem value="zhi2" data-testid="option-zhi2">
                      ZHI 2
                    </SelectItem>
                    <SelectItem value="zhi3" data-testid="option-zhi3">
                      ZHI 3
                    </SelectItem>
                    <SelectItem value="zhi4" data-testid="option-zhi4">
                      ZHI 4
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Choose which AI model to use for responses
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enhanced-mode" className="text-sm font-medium">
                      Enhanced Mode
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Allow philosophers to extrapolate beyond their historical writings
                    </p>
                  </div>
                  <Switch
                    id="enhanced-mode"
                    checked={personaSettings.enhancedMode || false}
                    onCheckedChange={(checked) => {
                      updatePersonaMutation.mutate({ enhancedMode: checked });
                    }}
                    data-testid="switch-enhanced-mode"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  When enabled, philosophers apply their frameworks to modern topics and anachronistic scenarios (e.g., Freud on AI, Founding Fathers on modern surveillance). When disabled, responses stay strictly grounded in their actual writings.
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dialogue-mode" className="text-sm font-medium">
                      Dialogue Mode
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {personaSettings.dialogueMode 
                        ? "Natural conversation - variable length responses"
                        : "Essay mode - fixed word count responses"}
                    </p>
                  </div>
                  <Switch
                    id="dialogue-mode"
                    checked={personaSettings.dialogueMode ?? true}
                    onCheckedChange={(checked) => {
                      updatePersonaMutation.mutate({ dialogueMode: checked });
                    }}
                    data-testid="switch-dialogue-mode"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  When enabled, philosophers respond naturally with variable length answers and can ask questions back. When disabled, responses target the word count setting.
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="audit-mode" className="text-sm font-medium flex items-center gap-1.5">
                      <FileSearch className="w-4 h-4" />
                      Audit Mode
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {auditMode 
                        ? "Full corpus search trace visible"
                        : "Standard chat mode"}
                    </p>
                  </div>
                  <Switch
                    id="audit-mode"
                    checked={auditMode}
                    onCheckedChange={setAuditMode}
                    data-testid="switch-audit-mode"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  When enabled, shows live trace of every database query, passage found/rejected, and alignment decisions. Generates downloadable audit report.
                </p>
              </div>

            </CardContent>
          </Card>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main
        className="flex-1 flex relative bg-gradient-to-br from-amber-50/80 via-orange-50/40 to-rose-50/60 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"
      >
        <div className="absolute inset-0 bg-background/40 dark:bg-background/60 backdrop-blur-[2px]" />
        
        <div className="flex-1 flex flex-col relative">

        {/* Header - Fixed */}
        <header className="border-b bg-background/95 backdrop-blur-md relative z-20">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" data-testid="icon-gold-star" />
              <a
                href="mailto:contact@zhisystems.ai"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-contact"
              >
                Contact Us
              </a>
            </div>
            <div className="flex items-center gap-3 mx-4">
              <div className="relative flex-shrink-0">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg border-2 border-primary/20 ${isStreaming ? 'animate-pulse' : ''}`}>
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <h1 className="font-display text-xl font-light whitespace-nowrap">
                Talk With A Great Thinker
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {userData?.user ? (
                <>
                  <Button
                    onClick={() => setShowChatHistory(!showChatHistory)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    data-testid="button-chat-history"
                  >
                    <History className="w-4 h-4" />
                    My Chats
                  </Button>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span data-testid="text-username">{userData.user.username}</span>
                  </div>
                  <Button
                    onClick={() => logoutMutation.mutate()}
                    variant="ghost"
                    size="sm"
                    data-testid="button-logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <form onSubmit={handleLogin} className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="h-8 w-32 text-sm"
                    data-testid="input-login-username"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={loginUsername.trim().length < 2 || loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? "..." : "Login"}
                  </Button>
                </form>
              )}
              <Button
                onClick={() => setComparisonModalOpen(true)}
                variant="outline"
                size="sm"
                className="gap-2"
                data-testid="button-compare-thinkers"
              >
                <Users className="w-4 h-4" />
                Compare Thinkers
              </Button>
            </div>
          </div>
        </header>

        {/* Chat History Dropdown */}
        {showChatHistory && userData?.user && (
          <div className="absolute right-4 top-20 z-30 w-80 bg-background border rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <History className="w-4 h-4" />
                Your Past Chats
              </h3>
              <Button
                onClick={() => {
                  newChatMutation.mutate();
                  setShowChatHistory(false);
                }}
                size="sm"
                variant="outline"
                className="gap-1"
                data-testid="button-new-chat"
              >
                <Plus className="w-3 h-3" />
                New
              </Button>
            </div>
            {chatHistoryData?.conversations && chatHistoryData.conversations.length > 0 ? (
              <div className="space-y-2">
                {chatHistoryData.conversations.map((chat) => (
                  <div
                    key={chat.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    data-testid={`chat-history-item-${chat.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium truncate">{chat.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {chat.preview}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {chat.messageCount} messages
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(chat.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <a
                        href={`/api/chat/${chat.id}/download`}
                        download
                        className="flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`button-download-chat-${chat.id}`}
                      >
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="w-4 h-4" />
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No chats yet. Start a conversation!
              </p>
            )}
          </div>
        )}

        {/* Scrollable Content Area with All Three Sections */}
        <div className="relative z-10 flex-1 overflow-y-auto">
          {/* Chat Messages Section */}
          <div className="min-h-[400px]">
            {messages.length === 0 && !streamingMessage && !pendingAssistantMessage ? (
              <div className="h-full flex items-center justify-center p-8">
                <Card className="max-w-lg bg-[#f8fafc] dark:from-slate-800/90 dark:via-slate-700/80 dark:to-slate-800/70 border-[#3b82f6]/20 dark:border-slate-600 shadow-lg">
                  <CardContent className="pt-8 pb-8 text-center space-y-5">
                    <div className="text-6xl font-bold text-[#3b82f6] mx-auto">
                      智
                    </div>
                    <div className="space-y-3">
                      <h2 className="text-2xl font-display font-light text-[#0f172a] dark:text-slate-100">
                        Ask A Thinker
                      </h2>
                      <p className="text-[#0f172a]/80 dark:text-slate-200/70 text-sm leading-relaxed max-w-md mx-auto">
                        Powered by Zhi's proprietary LLM, trained directly on complete works—not summaries, not paraphrases, not third-party interpretations.
                      </p>
                    </div>
                    <div className="text-left text-sm text-[#0f172a]/70 dark:text-slate-300/60 space-y-1 max-w-md mx-auto">
                      <p><span className="font-semibold text-[#3b82f6]">Dialogue</span> — Conversation in their authentic voice</p>
                      <p><span className="font-semibold text-[#3b82f6] cursor-pointer hover:underline" onClick={() => document.getElementById('paper-writer-section')?.scrollIntoView({ behavior: 'smooth' })}>Essay</span> — Up to 2,000 words on any topic</p>
                      <p><span className="font-semibold text-[#3b82f6] cursor-pointer hover:underline" onClick={() => document.getElementById('debate-creator-section')?.scrollIntoView({ behavior: 'smooth' })}>Debate</span> — Stage an argument between any two thinkers</p>
                      <p><span className="font-semibold text-[#3b82f6] cursor-pointer hover:underline" onClick={() => document.getElementById('interview-creator-section')?.scrollIntoView({ behavior: 'smooth' })}>Interview</span> — Generate a custom interview with any thinker</p>
                      <p><span className="font-semibold text-[#3b82f6] cursor-pointer hover:underline" onClick={() => document.getElementById('paper-writer-section')?.scrollIntoView({ behavior: 'smooth' })}>Paper</span> — Have any thinker write a full paper for you (up to 5,000 words)</p>
                      <p><span className="font-semibold text-[#3b82f6] cursor-pointer hover:underline" onClick={() => document.getElementById('quote-generator-section')?.scrollIntoView({ behavior: 'smooth' })}>Quotes</span> — Pull a thinker's actual quotes on any topic</p>
                      <p><span className="font-semibold text-[#3b82f6] cursor-pointer hover:underline" onClick={() => document.getElementById('position-generator-section')?.scrollIntoView({ behavior: 'smooth' })}>Positions</span> — Extract a thinker's positions on any subject</p>
                      <p><span className="font-semibold text-[#3b82f6] cursor-pointer hover:underline" onClick={() => document.getElementById('model-builder-section')?.scrollIntoView({ behavior: 'smooth' })}>Model Builder</span> — Find a true interpretation of any theory (maps obscure concepts onto real structures)</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto px-4 py-8">
                {messages.map((message) => (
                  <ChatMessage 
                    key={message.id} 
                    message={message}
                    onTransferContent={handleContentTransfer}
                    onDeleteMessage={handleDeleteMessage}
                  />
                ))}
                {pendingUserMessage && (
                  <ChatMessage
                    message={{
                      id: "pending-user",
                      conversationId: "",
                      role: "user",
                      content: pendingUserMessage,
                      createdAt: new Date(),
                    }}
                    isStreaming={false}
                    onTransferContent={handleContentTransfer}
                  />
                )}
                {streamingMessage && (
                  <ChatMessage
                    message={{
                      id: "streaming",
                      conversationId: "",
                      role: "assistant",
                      content: streamingMessage,
                      createdAt: new Date(),
                    }}
                    isStreaming={true}
                    onTransferContent={handleContentTransfer}
                  />
                )}
                {pendingAssistantMessage && !streamingMessage && (
                  <ChatMessage
                    message={{
                      id: "pending",
                      conversationId: "",
                      role: "assistant",
                      content: pendingAssistantMessage,
                      createdAt: new Date(),
                    }}
                    isStreaming={false}
                    onTransferContent={handleContentTransfer}
                  />
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Chat Input - Fixed at bottom of chat section */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t relative z-10">
            <ChatInput 
              onSend={handleSendMessage} 
              disabled={isStreaming}
              externalContent={chatInputContent}
            />
          </div>

          {/* Model Builder Section */}
          <div id="model-builder-section" className="px-4 py-8 border-t-4 border-primary/20">
            <ModelBuilderSection 
              onRegisterInput={(setter) => { modelBuilderInputRef.current = setter; }}
              onTransferContent={handleContentTransfer}
            />
          </div>

          {/* Paper Writer Section */}
          <div id="paper-writer-section" className="px-4 py-8 border-t-4 border-primary/20">
            <PaperWriterSection 
              onRegisterInput={(setter) => { paperWriterTopicRef.current = setter; }}
              onTransferContent={handleContentTransfer}
            />
          </div>

          {/* Quote Generator Section */}
          <div id="quote-generator-section" className="px-4 py-8 border-t-4 border-primary/20">
            <QuoteGeneratorSection />
          </div>

          {/* Position Generator Section */}
          <div id="position-generator-section" className="px-4 py-8 border-t-4 border-primary/20">
            <PositionGeneratorSection />
          </div>

          {/* Dialogue Creator Section */}
          <div id="dialogue-creator-section" className="px-4 py-8 border-t-4 border-primary/20">
            <DialogueCreatorSection 
              onRegisterInput={(setter) => { dialogueCreatorInputRef.current = setter; }}
            />
          </div>

          {/* Interview Creator Section */}
          <div id="interview-creator-section" className="px-4 py-8 border-t-4 border-primary/20">
            <InterviewCreatorSection />
          </div>

          {/* Debate Creator Section */}
          <div id="debate-creator-section" className="px-4 py-8 border-t-4 border-primary/20">
            <DebateCreatorSection />
          </div>
        </div>
        </div>
        
        {/* Thinking Panel - appears when AI is generating response */}
        <ThinkingPanel 
          thinkerName="J.-M. Kuczynski"
          isActive={isStreaming}
        />
      </main>

      {/* Audit Panel - appears when audit mode is enabled */}
      {auditMode && (
        <aside className="w-80 flex-shrink-0 border-l hidden lg:block">
          <AuditPanel
            isActive={isStreaming}
            events={auditEvents}
            question={currentQuestion}
            onDownloadReport={() => {
              if (auditReport) {
                const blob = new Blob([auditReport], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `audit-report-${Date.now()}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              } else {
                toast({ title: "No report available", description: "Ask a question first to generate an audit report." });
              }
            }}
          />
        </aside>
      )}

      {/* Figure Chat Dialog */}
      <FigureChat 
        key={selectedFigure?.id} // CRITICAL: Force remount when figure changes to clear React Query cache
        figure={selectedFigure} 
        open={figureDialogOpen} 
        onOpenChange={setFigureDialogOpen}
        onTransferContent={handleContentTransfer}
      />

      {/* Comparison Modal */}
      <ComparisonModal
        open={comparisonModalOpen}
        onOpenChange={setComparisonModalOpen}
        figures={figures}
      />
    </div>
  );
}
