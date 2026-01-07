import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Heart, MessageCircle } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background pointer-events-none" />
      
      <div className="flex-1 flex items-center justify-center p-4 relative">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-8 pb-8 px-8 text-center space-y-6">
            <div className="space-y-2">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h1 className="text-4xl font-serif font-bold tracking-tight">
                Ask A Philosopher
              </h1>
              <p className="text-lg text-muted-foreground">
                Receive profound philosophical guidance powered by AI
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="grid gap-3">
                <div className="flex items-start gap-3 text-left">
                  <Heart className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Personalized Wisdom</p>
                    <p className="text-sm text-muted-foreground">
                      Customize the AI's voice, intelligence, and emotional tone
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <MessageCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Biblical Guidance</p>
                    <p className="text-sm text-muted-foreground">
                      Every response includes relevant King James Bible verses
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleLogin}
                size="lg"
                className="w-full mt-6"
                data-testid="button-login"
              >
                Sign In with Replit
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Login with Google, GitHub, or Email
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
