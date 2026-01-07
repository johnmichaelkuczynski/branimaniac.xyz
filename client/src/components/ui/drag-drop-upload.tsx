import { useState, useRef, ReactNode } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DragDropUploadProps {
  accept: string;
  maxSizeBytes: number;
  onFileAccepted: (file: File) => void;
  onValidationError?: (error: { title: string; description: string }) => void;
  onClear?: () => void;
  currentFileName?: string;
  currentFileSize?: number;
  disabled?: boolean;
  children?: ReactNode;
  className?: string;
  "data-testid"?: string;
}

export function DragDropUpload({
  accept,
  maxSizeBytes,
  onFileAccepted,
  onValidationError,
  onClear,
  currentFileName,
  currentFileSize,
  disabled = false,
  children,
  className,
  "data-testid": testId,
}: DragDropUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only deactivate if leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setIsDragActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const acceptedExtensions = accept
      .split(',')
      .map(ext => ext.trim().replace('.', '').toLowerCase());

    if (!fileExtension || !acceptedExtensions.includes(fileExtension)) {
      if (onValidationError) {
        onValidationError({
          title: "Invalid file type",
          description: `Please upload ${accept.split(',').join(', ')} files only`,
        });
      }
      return;
    }

    // Validate file size
    if (file.size > maxSizeBytes) {
      if (onValidationError) {
        onValidationError({
          title: "File too large",
          description: `Please upload files smaller than ${formatFileSize(maxSizeBytes)}`,
        });
      }
      return;
    }

    onFileAccepted(file);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-testid={testId}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-all cursor-pointer",
          "hover:border-primary/50 hover:bg-accent/5",
          isDragActive && "border-primary bg-primary/5 scale-[1.02]",
          disabled && "opacity-50 cursor-not-allowed",
          !currentFileName && "min-h-[140px] flex items-center justify-center"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
          aria-label="File upload"
        />

        {currentFileName ? (
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Upload className="w-5 h-5 flex-shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate" title={currentFileName}>
                  {currentFileName}
                </p>
                {currentFileSize && (
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(currentFileSize)}
                  </p>
                )}
              </div>
            </div>
            {onClear && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={disabled}
                data-testid={testId ? `${testId}-clear` : undefined}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center">
            <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium mb-1">
              Drag & drop or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              {accept.split(',').join(', ')} (max {formatFileSize(maxSizeBytes)})
            </p>
            <p className="text-xs text-muted-foreground mt-1 opacity-70">
              Tap to choose on mobile
            </p>
          </div>
        )}
      </div>

      {children}
    </div>
  );
}
