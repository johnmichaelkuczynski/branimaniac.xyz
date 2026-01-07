import { BibleVerseCard } from "./bible-verse-card";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { ArrowRight, Copy, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@shared/schema";

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
  onTransferContent?: (content: string, target: 'chat' | 'model' | 'paper' | 'dialogue') => void;
  onDeleteMessage?: (messageId: string) => void;
}

export function ChatMessage({ message, isStreaming, onTransferContent, onDeleteMessage }: ChatMessageProps) {
  const isUser = message.role === "user";
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast({
      title: "Copied to clipboard",
      description: "Message content has been copied.",
    });
  };

  const handleDelete = () => {
    if (onDeleteMessage) {
      onDeleteMessage(message.id);
      toast({
        title: "Message deleted",
        description: "The message has been removed.",
      });
    }
  };

  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300`}
      data-testid={`message-${message.id}`}
    >
      <div className={`max-w-[85%] md:max-w-[75%] space-y-3 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        {!isUser && !isStreaming && (
          <div className="flex items-center gap-2 self-start">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2"
              data-testid="button-copy-message"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            {onDeleteMessage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-7 px-2 text-destructive hover:text-destructive"
                data-testid="button-delete-message"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            )}
          </div>
        )}
        <div
          className={`px-4 py-3 md:px-6 md:py-4 rounded-2xl ${
            isUser
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-card text-card-foreground border border-card-border rounded-bl-sm"
          }`}
        >
          <p className="text-base md:text-lg leading-relaxed whitespace-pre-wrap">
            {message.content}
            {isStreaming && (
              <span className="inline-block w-2 h-5 ml-1 bg-current animate-pulse" />
            )}
          </p>
        </div>

        {!isUser && !isStreaming && message.content && (
          <div className="w-full flex justify-between items-center mt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-7 px-2"
              data-testid="button-copy-message-bottom"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded" data-testid="text-word-count">
              {message.content.split(/\s+/).filter(w => w.length > 0).length.toLocaleString()} words
            </span>
          </div>
        )}

        {!isUser && message.verseText && message.verseReference && (
          <BibleVerseCard
            verseText={message.verseText}
            verseReference={message.verseReference}
          />
        )}

        {!isUser && !isStreaming && onTransferContent && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="self-end text-xs gap-1"
                data-testid="button-transfer-response"
              >
                Send to
                <ArrowRight className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={() => onTransferContent(message.content, 'model')}
                data-testid="menu-transfer-to-model"
              >
                Model Builder
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onTransferContent(message.content, 'paper')}
                data-testid="menu-transfer-to-paper"
              >
                Paper Writer
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onTransferContent(message.content, 'dialogue')}
                data-testid="menu-transfer-to-dialogue"
              >
                Dialogue Creator
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
