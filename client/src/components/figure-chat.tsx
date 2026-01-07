import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Download, FileText, Upload, X, ArrowRight, HelpCircle, Copy, Check } from "lucide-react";
import type { Figure, FigureMessage, PersonaSettings } from "@shared/schema";
import { PaperWriter } from "@/components/paper-writer";
import { WhatToAskModal } from "@/components/what-to-ask-modal";
import { ThinkingPanel } from "@/components/thinking-panel";

interface FigureChatProps {
  figure: Figure | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferContent?: (content: string, target: 'chat' | 'model' | 'paper' | 'dialogue') => void;
}

export function FigureChat({ figure, open, onOpenChange, onTransferContent }: FigureChatProps) {
  const [input, setInput] = useState("");
  const [streamingMessage, setStreamingMessage] = useState("");
  const [pendingAssistantMessage, setPendingAssistantMessage] = useState("");
  const [messageCountBeforePending, setMessageCountBeforePending] = useState<number>(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [paperWriterOpen, setPaperWriterOpen] = useState(false);
  const [whatToAskOpen, setWhatToAskOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; content: string } | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyMessage = async (messageId: string | number, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const { data: messages = [] } = useQuery<FigureMessage[]>({
    queryKey: [`/api/figures/${figure?.id}/messages`],
    enabled: !!figure && open,
  });

  // Fetch persona settings to pass with chat requests
  const { data: personaSettings } = useQuery<PersonaSettings>({
    queryKey: ["/api/persona-settings"],
  });

  // CRITICAL FIX: Reset input and uploaded file when figure changes or dialog closes
  useEffect(() => {
    // Clear state when dialog closes OR when figure changes (even if dialog stays open)
    setInput("");
    setUploadedFile(null);
    setStreamingMessage("");
    setPendingAssistantMessage("");
  }, [figure?.id, open]);

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!figure) return;

      setIsStreaming(true);
      setStreamingMessage("");
      setPendingAssistantMessage("");

      const response = await fetch(`/api/figures/${figure.id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          message,
          uploadedDocument: uploadedFile ? {
            name: uploadedFile.name,
            content: uploadedFile.content
          } : undefined,
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

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      return new Promise<void>(async (resolve, reject) => {
        try {
          let accumulatedText = ""; // Local accumulator to avoid stale state
          
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
                  // CRITICAL FIX v2: Keep message visible until refetch confirms persistence
                  // Track message count to ensure we wait for the NEW message
                  // Use local accumulator to avoid stale state closure bug
                  const currentMessages = queryClient.getQueryData<FigureMessage[]>([`/api/figures/${figure.id}/messages`]) || [];
                  setMessageCountBeforePending(currentMessages.length);
                  setPendingAssistantMessage(accumulatedText);
                  setStreamingMessage("");
                  queryClient.invalidateQueries({
                    queryKey: [`/api/figures/${figure.id}/messages`],
                  });
                  resolve();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    accumulatedText += parsed.content;
                    setStreamingMessage(accumulatedText);
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
          setStreamingMessage("");
          setPendingAssistantMessage("");
          setMessageCountBeforePending(0);
          reject(error);
        }
      });
    },
  });

  const clearChatMutation = useMutation({
    mutationFn: async () => {
      if (!figure) return;
      const response = await fetch(`/api/figures/${figure.id}/messages`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to clear chat");
    },
    onSuccess: () => {
      if (!figure) return;
      queryClient.invalidateQueries({
        queryKey: [`/api/figures/${figure.id}/messages`],
      });
    },
  });

  const handleSend = () => {
    if (!input.trim() || isStreaming || !figure) return;
    
    const message = input.trim();
    setInput("");
    sendMessageMutation.mutate(message);
    setUploadedFile(null); // Clear uploaded file after sending
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 1MB)
    if (file.size > 1024 * 1024) {
      alert("File too large. Please upload a file smaller than 1MB.");
      return;
    }

    // Check file type
    const allowedTypes = [".txt", ".md", ".doc", ".docx", ".pdf"];
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    
    if (!allowedTypes.includes(fileExtension)) {
      alert("Please upload a text file (.txt, .md, .doc, .docx, or .pdf)");
      return;
    }

    try {
      const text = await file.text();
      setUploadedFile({
        name: file.name,
        content: text
      });
    } catch (error) {
      console.error("Error reading file:", error);
      alert("Error reading file. Please try again.");
    }
  };

  const handleDownload = () => {
    if (!figure || messages.length === 0) return;

    const timestamp = new Date().toLocaleString();
    let content = `Conversation with ${figure.name}\n`;
    content += `${figure.title}\n`;
    content += `Downloaded: ${timestamp}\n`;
    content += `${'='.repeat(60)}\n\n`;

    messages.forEach((message) => {
      const role = message.role === 'user' ? 'You' : figure.name;
      content += `${role}:\n${message.content}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${figure.name.replace(/\s+/g, '_')}_conversation_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clear pending message once it appears in the fetched messages
  useEffect(() => {
    if (pendingAssistantMessage && messages.length > 0) {
      // Only clear if message count has increased (confirming new message was persisted)
      if (messages.length > messageCountBeforePending) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === "assistant" && lastMessage.content === pendingAssistantMessage) {
          setPendingAssistantMessage("");
          setMessageCountBeforePending(0);
        }
      }
    }
  }, [messages, pendingAssistantMessage, messageCountBeforePending]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingMessage, pendingAssistantMessage]);

  if (!figure) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] w-[90vw] h-[85vh] flex p-0 bg-gradient-to-br from-amber-50/95 via-orange-50/90 to-rose-50/85 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="flex-1 flex flex-col min-w-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="relative">
              {figure.icon.startsWith('/') || figure.icon.startsWith('http') ? (
                <>
                  <img 
                    src={figure.icon} 
                    alt={figure.name}
                    className={`w-16 h-16 rounded-full object-cover border-2 border-primary/20 transition-transform duration-500 ${isStreaming ? 'animate-spin' : ''}`}
                    data-testid={`icon-${figure.id}`}
                  />
                  {isStreaming && (
                    <div className="absolute -inset-1 rounded-full border-2 border-primary/50 animate-ping" />
                  )}
                </>
              ) : (
                <>
                  <span 
                    className={`text-4xl block transition-transform duration-500 ${isStreaming ? 'animate-spin' : ''}`}
                    data-testid={`icon-${figure.id}`}
                  >
                    {figure.icon}
                  </span>
                  {isStreaming && (
                    <div className="absolute -inset-2 rounded-full border-2 border-primary/50 animate-ping" />
                  )}
                </>
              )}
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl">{figure.name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{figure.title}</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setWhatToAskOpen(true)}
                data-testid="button-what-to-ask"
                title="Get topic and question suggestions"
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                What to Ask
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setPaperWriterOpen(true)}
                data-testid="button-write-paper"
              >
                <FileText className="w-4 h-4 mr-1" />
                Write Paper
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={messages.length === 0}
                data-testid="button-download-chat"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => clearChatMutation.mutate()}
                disabled={clearChatMutation.isPending || messages.length === 0}
                data-testid="button-clear-chat"
              >
                Clear Chat
              </Button>
            </div>
          </div>
          <DialogDescription className="text-sm text-muted-foreground mt-3">
            {figure.description}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 py-4">
            {messages.length === 0 && !streamingMessage && !pendingAssistantMessage && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  Start a conversation with {figure.name}
                </p>
              </div>
            )}

            {messages.map((message) => {
              const isUser = message.role === "user";
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  data-testid={`figure-message-${message.id}`}
                >
                  <div className={`max-w-[80%] space-y-2 flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                    <div
                      className={`rounded-lg px-4 py-3 ${
                        isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {!isUser && (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyMessage(message.id, message.content)}
                            className="text-xs"
                            data-testid={`button-copy-${message.id}`}
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
                              if (onTransferContent) {
                                onTransferContent(message.content, 'model');
                                onOpenChange(false); // Close dialog
                              } else {
                                // Fallback: scroll to Model Builder section on main page
                                onOpenChange(false);
                                setTimeout(() => {
                                  document.getElementById('model-builder-section')?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                              }
                            }}
                            className="text-xs"
                            data-testid={`button-model-builder-${message.id}`}
                          >
                            Send to Model Builder
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded" data-testid={`word-count-${message.id}`}>
                          {message.content.split(/\s+/).filter(w => w.length > 0).length.toLocaleString()} words
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {streamingMessage && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-3 bg-muted">
                  <p className="text-sm whitespace-pre-wrap">{streamingMessage}</p>
                  <span className="inline-block w-1 h-4 bg-foreground/50 ml-0.5 animate-pulse" />
                </div>
              </div>
            )}

            {pendingAssistantMessage && !streamingMessage && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-3 bg-muted">
                  <p className="text-sm whitespace-pre-wrap">{pendingAssistantMessage}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="px-6 py-4 border-t">
          {uploadedFile && (
            <div className="mb-3 p-3 bg-muted rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">{uploadedFile.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(uploadedFile.content.length / 1024).toFixed(1)}KB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUploadedFile(null)}
                data-testid="button-remove-upload"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.doc,.docx,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              data-testid="input-file-upload"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              data-testid="button-upload-file"
              className="h-10 flex-shrink-0"
              title="Upload document for analysis"
            >
              <Upload className="w-4 h-4" />
            </Button>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={uploadedFile ? `Ask ${figure.name} to analyze, evaluate, or rewrite the uploaded document...` : `Ask ${figure.name} a question...`}
              disabled={isStreaming}
              data-testid="input-figure-message"
              className="min-h-[120px] resize-none"
              rows={5}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              data-testid="button-send-figure-message"
              className="h-10 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        </div>
        
        {/* Thinking Panel - appears when philosopher is generating response */}
        <ThinkingPanel 
          thinkerName={figure.name}
          isActive={isStreaming}
          figureId={figure.id}
        />
      </DialogContent>
      
      <PaperWriter 
        figure={figure}
        open={paperWriterOpen}
        onOpenChange={setPaperWriterOpen}
      />

      <WhatToAskModal
        open={whatToAskOpen}
        onOpenChange={setWhatToAskOpen}
        figureName={figure.name}
        figureId={figure.id}
        onSelectPrompt={(prompt) => {
          sendMessageMutation.mutate(prompt);
        }}
      />
    </Dialog>
  );
}
