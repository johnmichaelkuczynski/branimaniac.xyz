import { useState } from "react";
import { Target, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Goal } from "@shared/schema";

interface GoalsDialogProps {
  goals: Goal[];
  onAddGoal: (text: string) => void;
  onDeleteGoal: (id: string) => void;
  isLoading?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function GoalsDialog({
  goals,
  onAddGoal,
  onDeleteGoal,
  isLoading,
  open: controlledOpen,
  onOpenChange,
}: GoalsDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const [newGoal, setNewGoal] = useState("");

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      onAddGoal(newGoal.trim());
      setNewGoal("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" data-testid="button-goals">
          <Target className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Your Spiritual Goals
          </DialogTitle>
          <DialogDescription>
            Share what you're seeking in your spiritual journey
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Add New Goal */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a new goal..."
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddGoal();
                }
              }}
              data-testid="input-new-goal"
            />
            <Button
              onClick={handleAddGoal}
              disabled={!newGoal.trim() || isLoading}
              size="icon"
              data-testid="button-add-goal"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Goals List */}
          <div className="space-y-2 min-h-[200px]">
            {goals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No goals yet. Share what you're seeking.
                </p>
              </div>
            ) : (
              goals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-md bg-card border border-card-border hover-elevate"
                  data-testid={`goal-${goal.id}`}
                >
                  <p className="flex-1 text-sm">{goal.text}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => onDeleteGoal(goal.id)}
                    disabled={isLoading}
                    data-testid={`button-delete-goal-${goal.id}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
