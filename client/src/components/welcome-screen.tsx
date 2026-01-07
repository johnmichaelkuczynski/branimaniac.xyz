import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Heart, Book, Sparkles, Settings2, Target } from "lucide-react";

interface WelcomeScreenProps {
  onOpenSettings: () => void;
  onOpenGoals: () => void;
}

export function WelcomeScreen({ onOpenSettings, onOpenGoals }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="font-display text-5xl md:text-6xl font-light text-foreground">
            Ask A Philosopher
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
            Receive compassionate spiritual guidance tailored to your journey.
            Share your questions, and receive wisdom with relevant scripture.
          </p>
        </div>

        {/* Prominent Customization Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Button
            size="lg"
            onClick={onOpenSettings}
            className="gap-2 min-w-[200px]"
            data-testid="button-customize-welcome"
          >
            <Settings2 className="h-5 w-5" />
            Customize Your Guide
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onOpenGoals}
            className="gap-2 min-w-[200px]"
            data-testid="button-goals-welcome"
          >
            <Target className="h-5 w-5" />
            Set Your Goals
          </Button>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 mt-12">
          <Card className="p-6 space-y-3 hover-elevate">
            <Settings2 className="h-8 w-8 text-sacred-gold mx-auto" />
            <h3 className="font-display text-lg">5 Personality Controls</h3>
            <p className="text-sm text-muted-foreground">
              Choose voice type, intelligence level, emotional tone, gender, and formality
            </p>
          </Card>

          <Card className="p-6 space-y-3 hover-elevate">
            <Book className="h-8 w-8 text-sacred-gold mx-auto" />
            <h3 className="font-display text-lg">Scripture-Based</h3>
            <p className="text-sm text-muted-foreground">
              Every response includes a relevant KJV Bible verse
            </p>
          </Card>

          <Card className="p-6 space-y-3 hover-elevate">
            <MessageCircle className="h-8 w-8 text-sacred-gold mx-auto" />
            <h3 className="font-display text-lg">Real-Time Streaming</h3>
            <p className="text-sm text-muted-foreground">
              Watch responses appear word-by-word, like a conversation
            </p>
          </Card>

          <Card className="p-6 space-y-3 hover-elevate">
            <Heart className="h-8 w-8 text-sacred-gold mx-auto" />
            <h3 className="font-display text-lg">Goal-Aware Guidance</h3>
            <p className="text-sm text-muted-foreground">
              Responses adapt based on your personal spiritual goals
            </p>
          </Card>
        </div>

        <div className="pt-8 space-y-3">
          <p className="text-base font-medium text-foreground">
            Customize how J.-M. Kuczynski speaks to you using the controls above
          </p>
          <p className="text-sm text-muted-foreground">
            Then start by typing your question below
          </p>
        </div>
      </div>
    </div>
  );
}
