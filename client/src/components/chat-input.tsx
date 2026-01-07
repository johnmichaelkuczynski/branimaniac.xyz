import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface ChatInputProps {
  onSend: (message: string, documentText?: string) => void;
  disabled?: boolean;
  externalContent?: { text: string; version: number };
}

export function ChatInput({ onSend, disabled, externalContent }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [uploadedDocument, setUploadedDocument] = useState<{ name: string; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Effect-driven external content injection with version tracking
  useEffect(() => {
    if (externalContent && externalContent.version > 0) {
      setMessage(externalContent.text);
      // Focus and scroll to textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [externalContent?.version]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim(), uploadedDocument?.text);
      setMessage("");
      setUploadedDocument(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['text/plain', 'application/pdf', 'application/msword', 
                        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(txt|pdf|doc|docx)$/i)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt, .pdf, .doc, or .docx file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "File must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      const text = await file.text();
      setUploadedDocument({ name: file.name, text });
      toast({
        title: "Document uploaded",
        description: `${file.name} is ready to discuss`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Could not read the file. Please try again.",
        variant: "destructive",
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div>
      <div className="max-w-4xl mx-auto p-4">
        {uploadedDocument && (
          <div className="mb-3 flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
            <Paperclip className="h-4 w-4 text-primary" />
            <span className="text-sm flex-1 truncate">{uploadedDocument.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setUploadedDocument(null)}
              className="h-6 w-6 p-0"
              data-testid="button-remove-document"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask and I shall answer"
              disabled={disabled}
              className="min-h-[165px] max-h-[400px] resize-none text-lg leading-relaxed p-4 pr-12 focus-visible:ring-sacred-gold bg-background/95 backdrop-blur-sm"
              data-testid="input-message"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="absolute bottom-2 right-2 h-8 w-8"
              data-testid="button-upload"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              data-testid="input-file"
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || disabled}
            size="icon"
            className="h-[165px] w-[100px] shrink-0"
            data-testid="button-send"
          >
            <Send className="h-8 w-8" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Press Enter to send, Shift + Enter for new line • Click 📎 to upload documents
        </p>
      </div>
    </div>
  );
}
