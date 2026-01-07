import { useState, useEffect } from "react";
import { Settings, MessageCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PersonaSettings } from "@shared/schema";

interface PersonaSettingsDialogProps {
  settings: PersonaSettings;
  onSave: (settings: Partial<PersonaSettings>) => void;
  isLoading?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PersonaSettingsDialog({
  settings,
  onSave,
  isLoading,
  open: controlledOpen,
  onOpenChange,
}: PersonaSettingsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(localSettings);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-settings">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Response Settings
          </DialogTitle>
          <DialogDescription>
            Control how philosophers respond to your questions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* AI Model Selection */}
          <div className="space-y-3">
            <Label htmlFor="selected-model" className="text-base font-medium">
              AI Model
            </Label>
            <p className="text-xs text-muted-foreground">
              Select which intelligence powers your philosophical responses
            </p>
            <Select
              value={localSettings.selectedModel || "zhi5"}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, selectedModel: value })
              }
            >
              <SelectTrigger id="selected-model" data-testid="select-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="zhi5">ZHI 5 - Real-time, witty, direct (default)</SelectItem>
                <SelectItem value="zhi1">ZHI 1 - Fast, versatile, creative</SelectItem>
                <SelectItem value="zhi2">ZHI 2 - Most sophisticated, nuanced reasoning</SelectItem>
                <SelectItem value="zhi3">ZHI 3 - Economical, efficient</SelectItem>
                <SelectItem value="zhi4">ZHI 4 - Research-augmented, fact-checked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dialogue Mode Toggle */}
          <div className="space-y-3 p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="dialogue-mode" className="text-base font-medium flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Dialogue Mode
                </Label>
                <p className="text-xs text-muted-foreground">
                  {localSettings.dialogueMode 
                    ? "Natural conversation - answers as long or short as appropriate"
                    : "Essay mode - responses aim for a target word count"}
                </p>
              </div>
              <Switch
                id="dialogue-mode"
                checked={localSettings.dialogueMode ?? true}
                onCheckedChange={(checked) =>
                  setLocalSettings({ ...localSettings, dialogueMode: checked })
                }
                data-testid="switch-dialogue-mode"
              />
            </div>
            {localSettings.dialogueMode && (
              <div className="text-xs text-primary mt-2 flex items-start gap-2">
                <FileText className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>
                  The thinker will engage conversationally: short answers when appropriate, 
                  may ask clarifying questions, and will push back on your ideas.
                </span>
              </div>
            )}
          </div>

          {/* Response Length - only show if not in dialogue mode */}
          {!localSettings.dialogueMode && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base font-medium">Response Length</Label>
                <span className="text-sm font-semibold text-primary" data-testid="text-response-length">
                  {localSettings.responseLength === 0 ? "Auto" : `${localSettings.responseLength} words`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Target word count for responses (0 = Auto)
              </p>
              <div className="space-y-2">
                <Slider
                  value={[localSettings.responseLength || 0]}
                  onValueChange={(value) =>
                    setLocalSettings({ ...localSettings, responseLength: value[0] })
                  }
                  min={0}
                  max={2000}
                  step={50}
                  data-testid="slider-response-length"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Auto</span>
                  <span>2000 words</span>
                </div>
              </div>
            </div>
          )}

          {/* Quote Frequency */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-base font-medium">Quote Frequency</Label>
              <span className="text-sm font-semibold text-primary" data-testid="text-quote-frequency">
                {localSettings.quoteFrequency === 0 ? "None required" : `${localSettings.quoteFrequency} quotes`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum number of quotes to include (0 = no requirement)
            </p>
            <div className="space-y-2">
              <Slider
                value={[localSettings.quoteFrequency || 0]}
                onValueChange={(value) =>
                  setLocalSettings({ ...localSettings, quoteFrequency: value[0] })
                }
                min={0}
                max={10}
                step={1}
                data-testid="slider-quote-frequency"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>No quotes</span>
                <span>10 quotes</span>
              </div>
            </div>
          </div>

          {/* Enhanced Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="enhanced-mode" className="text-base font-medium">
                Enhanced Mode
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow thinkers to apply their framework to modern topics
              </p>
            </div>
            <Switch
              id="enhanced-mode"
              checked={localSettings.enhancedMode || false}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, enhancedMode: checked })
              }
              data-testid="switch-enhanced-mode"
            />
          </div>

          {/* Write Paper Mode */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="write-paper" className="text-base font-medium">
                Academic Paper Mode
              </Label>
              <p className="text-xs text-muted-foreground">
                Use formal academic structure and argumentation
              </p>
            </div>
            <Switch
              id="write-paper"
              checked={localSettings.writePaper || false}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, writePaper: checked })
              }
              data-testid="switch-write-paper"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            data-testid="button-cancel-settings"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            data-testid="button-save-settings"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
