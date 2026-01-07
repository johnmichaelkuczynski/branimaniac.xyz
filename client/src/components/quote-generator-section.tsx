import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Quote, Copy, Trash2, BookOpen, FileUp, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import type { Figure } from "@shared/schema";
import { DragDropUpload } from "@/components/ui/drag-drop-upload";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

// Convert full names to last names, with exceptions for disambiguation
function getDisplayName(fullName: string): string {
  // Keep full names for these to avoid confusion
  const keepFullName = ["James Allen", "William James", "ALLEN"];
  if (keepFullName.includes(fullName)) {
    return fullName;
  }
  // Extract last name
  const parts = fullName.split(' ');
  return parts[parts.length - 1];
}

interface QuoteGeneratorSectionProps {
  onRegisterInput?: (setter: (content: string) => void) => void;
}

export function QuoteGeneratorSection({ onRegisterInput }: QuoteGeneratorSectionProps) {
  const [mode, setMode] = useState<'author' | 'upload'>('author');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [authorComboboxOpen, setAuthorComboboxOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [numQuotes, setNumQuotes] = useState('10');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedFileSize, setUploadedFileSize] = useState(0);
  const [generatedQuotes, setGeneratedQuotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const queryTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch available figures
  const { data: figures = [] } = useQuery<Figure[]>({
    queryKey: ["/api/figures"],
  });

  // Register input setter for external content transfer
  useEffect(() => {
    if (onRegisterInput) {
      onRegisterInput((content: string) => setQuery(content));
    }
  }, [onRegisterInput]);

  const handleGenerate = async () => {
    if (mode === 'author' && !selectedAuthor) {
      toast({
        title: "Missing information",
        description: "Please select an author.",
        variant: "destructive",
      });
      return;
    }

    if (mode === 'upload' && !selectedFile) {
      toast({
        title: "No file selected",
        description: "Please upload a file to extract quotes from.",
        variant: "destructive",
      });
      return;
    }

    const quotesNum = parseInt(numQuotes) || 10;
    if (quotesNum < 1 || quotesNum > 50) {
      toast({
        title: "Invalid number",
        description: "Number of quotes must be between 1 and 50.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedQuotes('');

    try {
      if (mode === 'author') {
        // Use public quote generation API for site authors
        const response = await fetch('/api/quotes/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: query.trim() || undefined,
            author: selectedAuthor,
            numQuotes: quotesNum,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Format quotes with numbering and source attribution
        let formattedQuotes = '';
        
        // Add fallback note if applicable
        if (data.meta?.fallbackNote) {
          formattedQuotes = `${data.meta.fallbackNote}\n\n`;
        }
        
        if (data.quotes && data.quotes.length > 0) {
          formattedQuotes += data.quotes
            .map((q: any, index: number) => 
              `${index + 1}. "${q.text}"`
            )
            .join('\n\n');
        } else {
          // This should rarely happen with the new fallback system, but handle gracefully
          formattedQuotes = `Searching ${selectedAuthor}'s works for related content...\n\nThe database is being queried. If no results appear, try a broader topic or different phrasing.`;
        }

        setGeneratedQuotes(formattedQuotes);

        toast({
          title: data.meta?.usedFallback ? "Related quotes found" : "Quotes generated",
          description: `Found ${data.quotes?.length || 0} quotes from ${selectedAuthor}`,
        });

      } else {
        // Upload mode: extract quotes from user's document
        const formData = new FormData();
        formData.append('file', selectedFile!);
        formData.append('query', query.trim() || 'all');
        formData.append('numQuotes', quotesNum.toString());

        const response = await fetch('/api/quotes/extract', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success || !data.quotes || data.quotes.length === 0) {
          setGeneratedQuotes('No quotes found in the uploaded file. Try adjusting your search criteria.');
          return;
        }

        // Format quotes with numbering
        const formattedQuotes = data.quotes
          .map((q: string, index: number) => `${index + 1}. "${q}"`)
          .join('\n\n');

        setGeneratedQuotes(formattedQuotes);

        toast({
          title: "Quotes extracted",
          description: `Found ${data.quotes.length} quotes from ${selectedFile!.name}`,
        });
      }
    } catch (error) {
      console.error('Quote generation error:', error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate quotes",
        variant: "destructive",
      });
      setGeneratedQuotes('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileAccepted = (file: File) => {
    setSelectedFile(file);
    setUploadedFileName(file.name);
    setUploadedFileSize(file.size);
    toast({
      title: "File uploaded",
      description: file.name,
    });
  };

  const handleValidationError = (error: { title: string; description: string }) => {
    toast({
      title: error.title,
      description: error.description,
      variant: "destructive",
    });
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setUploadedFileName('');
    setUploadedFileSize(0);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedQuotes);
    toast({
      title: "Copied to clipboard",
      description: "Quotes have been copied successfully",
    });
  };

  const handleDelete = () => {
    setGeneratedQuotes('');
    toast({
      title: "Quotes deleted",
      description: "The generated quotes have been cleared",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Quote className="w-5 h-5 text-primary" />
          <CardTitle>Quote Generator</CardTitle>
        </div>
        <CardDescription>
          Extract quotes from site authors or upload your own documents
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={mode} onValueChange={(v) => setMode(v as 'author' | 'upload')} className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="author" data-testid="tab-mode-author">
              <BookOpen className="w-4 h-4 mr-2" />
              Site Authors
            </TabsTrigger>
            <TabsTrigger value="upload" data-testid="tab-mode-upload">
              <FileUp className="w-4 h-4 mr-2" />
              Upload File
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Column */}
          <div className="space-y-4">
            {mode === 'author' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="author-select-quotes">Select Author</Label>
                  <Popover open={authorComboboxOpen} onOpenChange={setAuthorComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={authorComboboxOpen}
                        className="w-full justify-between font-normal"
                        data-testid="select-author-quotes"
                      >
                        {selectedAuthor ? getDisplayName(selectedAuthor) : "Type or select an author..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search authors..." />
                        <CommandList>
                          <CommandEmpty>No author found.</CommandEmpty>
                          <CommandGroup>
                            {figures.map((figure) => (
                              <CommandItem
                                key={figure.id}
                                value={figure.name}
                                onSelect={(currentValue) => {
                                  setSelectedAuthor(currentValue === selectedAuthor ? "" : currentValue);
                                  setAuthorComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedAuthor === figure.name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {getDisplayName(figure.name)}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="query-input-quotes">
                    Query (topic or keywords) — Optional
                  </Label>
                  <Textarea
                    ref={queryTextareaRef}
                    id="query-input-quotes"
                    placeholder="Leave blank for best quotes, or specify topic: 'religion', 'ethics', 'epistemology', etc."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (selectedAuthor && !isGenerating) {
                          handleGenerate();
                        }
                      }
                    }}
                    rows={4}
                    data-testid="input-query-quotes"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Upload Document</Label>
                  <DragDropUpload
                    accept=".txt,.pdf,.doc,.docx"
                    maxSizeBytes={5 * 1024 * 1024}
                    onFileAccepted={handleFileAccepted}
                    onValidationError={handleValidationError}
                    onClear={handleClearFile}
                    currentFileName={uploadedFileName}
                    currentFileSize={uploadedFileSize}
                    data-testid="drag-drop-upload-quotes"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="query-input-upload">
                    Search Criteria — Optional
                  </Label>
                  <Textarea
                    id="query-input-upload"
                    placeholder="Leave blank for best quotes, or specify keywords to filter results"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (selectedFile && !isGenerating) {
                          handleGenerate();
                        }
                      }
                    }}
                    rows={3}
                    data-testid="input-query-upload"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="num-quotes-input">Number of Quotes (1-50)</Label>
              <Input
                id="num-quotes-input"
                type="number"
                min="1"
                max="50"
                value={numQuotes}
                onChange={(e) => setNumQuotes(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if ((mode === 'author' && selectedAuthor && query.trim() && !isGenerating) || 
                        (mode === 'upload' && selectedFile && !isGenerating)) {
                      handleGenerate();
                    }
                  }
                }}
                placeholder="10"
                data-testid="input-num-quotes"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || (mode === 'author' && !selectedAuthor) || (mode === 'upload' && !selectedFile)}
              className="w-full"
              data-testid="button-generate-quotes"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Quotes...
                </>
              ) : (
                <>
                  <Quote className="w-4 h-4 mr-2" />
                  Generate Quotes
                </>
              )}
            </Button>
          </div>

          {/* Output Column */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Label>Generated Quotes</Label>
                {generatedQuotes && !isGenerating && (
                  <span className="text-xs text-muted-foreground" data-testid="text-quotes-word-count">
                    {generatedQuotes.split(/\s+/).filter(w => w.length > 0).length.toLocaleString()} words
                  </span>
                )}
              </div>
              {generatedQuotes && !isGenerating && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-7 px-2"
                    data-testid="button-copy-quotes"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    className="h-7 px-2 text-destructive hover:text-destructive"
                    data-testid="button-delete-quotes"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              )}
            </div>
            <div className="min-h-[400px] p-4 rounded-md border bg-muted/30">
              {generatedQuotes ? (
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap font-serif">
                  {generatedQuotes}
                  {isGenerating && (
                    <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {isGenerating ? (
                    <Loader2 className="w-8 h-8 animate-spin" />
                  ) : (
                    <p className="text-center">
                      {mode === 'author' 
                        ? 'Select an author, enter a query, and click "Generate Quotes"'
                        : 'Upload a document and click "Generate Quotes"'
                      }
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
