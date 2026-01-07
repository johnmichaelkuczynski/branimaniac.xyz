import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, HelpCircle, MessageSquare, Send } from "lucide-react";
import { kuczynskiTopics, type TopicQuestion } from "@/data/kuczynski-topics";
import { freudTopics } from "@/data/freud-topics";
import { jungTopics } from "@/data/jung-topics";
import { humeTopics } from "@/data/hume-topics";
import { russellTopics } from "@/data/russell-topics";
import { nietzscheTopics } from "@/data/nietzsche-topics";
import { berkeleyTopics } from "@/data/berkeley-topics";
import { confuciusTopics } from "@/data/confucius-topics";
import { galileoTopics } from "@/data/galileo-topics";
import { adamSmithTopics } from "@/data/adam-smith-topics";
import { francisBaconTopics } from "@/data/francis-bacon-topics";
import { leibnizTopics } from "@/data/leibniz-topics";
import { spinozaTopics } from "@/data/spinoza-topics";
import { goldmanTopics } from "@/data/goldman-topics";
import { reichTopics } from "@/data/reich-topics";
import { lebonTopics } from "@/data/lebon-topics";
import { williamJamesTopics } from "@/data/william-james-topics";
import { aristotleTopics } from "@/data/aristotle-topics";
import { marxTopics } from "@/data/marx-topics";
import { platoTopics } from "@/data/plato-topics";
import { darwinTopics } from "@/data/darwin-topics";
import { millTopics } from "@/data/mill-topics";
import { kantTopics } from "@/data/kant-topics";
import { rousseauTopics } from "@/data/rousseau-topics";
import { newtonTopics } from "@/data/newton-topics";
import { schopenhauerTopics } from "@/data/schopenhauer-topics";
import { adlerTopics } from "@/data/adler-topics";
import { bergsonTopics } from "@/data/bergson-topics";
import { engelsTopics } from "@/data/engels-topics";
import { lockeTopics } from "@/data/locke-topics";
import { spencerTopics } from "@/data/spencer-topics";
import { peirceTopics } from "@/data/peirce-topics";
import { veblenTopics } from "@/data/veblen-topics";
import { whewellTopics } from "@/data/whewell-topics";
import { popperTopics } from "@/data/popper-topics";
import { voltaireTopics } from "@/data/voltaire-topics";
import { maimonidesTopics } from "@/data/maimonides-topics";
import { hobbesTopics } from "@/data/hobbes-topics";
import { descartesTopics } from "@/data/descartes-topics";
import { lutherTopics } from "@/data/luther-topics";
import { deweyTopics } from "@/data/dewey-topics";
import { stekelTopics } from "@/data/stekel-topics";
import { hegelTopics } from "@/data/hegel-topics";
import { larochefoucauldTopics } from "@/data/larochefoucauld-topics";
import { poincareTopics } from "@/data/poincare-topics";

interface WhatToAskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  figureName: string;
  figureId: string;
  onSelectPrompt: (prompt: string) => void;
}

export function WhatToAskModal({ 
  open, 
  onOpenChange, 
  figureName, 
  figureId,
  onSelectPrompt 
}: WhatToAskModalProps) {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const getTopicsForFigure = (figureId: string): TopicQuestion[] => {
    if (figureId === "common" || figureName.toLowerCase().includes("kuczynski") || figureId === "jmk") {
      return kuczynskiTopics;
    }
    if (figureName.toLowerCase().includes("freud") || figureId === "freud") {
      return freudTopics;
    }
    if (figureName.toLowerCase().includes("jung") || figureId === "jung") {
      return jungTopics;
    }
    if (figureName.toLowerCase().includes("hume") || figureId === "hume") {
      return humeTopics;
    }
    if (figureName.toLowerCase().includes("russell") || figureId === "russell") {
      return russellTopics;
    }
    if (figureName.toLowerCase().includes("nietzsche") || figureId === "nietzsche") {
      return nietzscheTopics;
    }
    if (figureName.toLowerCase().includes("berkeley") || figureId === "berkeley") {
      return berkeleyTopics;
    }
    if (figureName.toLowerCase().includes("confucius") || figureId === "confucius") {
      return confuciusTopics;
    }
    if (figureName.toLowerCase().includes("galileo") || figureId === "galileo") {
      return galileoTopics;
    }
    if (figureName.toLowerCase().includes("adam smith") || figureName.toLowerCase().includes("smith") || figureId === "adam-smith") {
      return adamSmithTopics;
    }
    if (figureName.toLowerCase().includes("francis bacon") || figureName.toLowerCase().includes("bacon") || figureId === "francis-bacon") {
      return francisBaconTopics;
    }
    if (figureName.toLowerCase().includes("leibniz") || figureId === "leibniz") {
      return leibnizTopics;
    }
    if (figureName.toLowerCase().includes("spinoza") || figureId === "spinoza") {
      return spinozaTopics;
    }
    if (figureName.toLowerCase().includes("goldman") || figureName.toLowerCase().includes("emma") || figureId === "goldman") {
      return goldmanTopics;
    }
    if (figureName.toLowerCase().includes("reich") || figureName.toLowerCase().includes("wilhelm") || figureId === "reich") {
      return reichTopics;
    }
    if (figureName.toLowerCase().includes("le bon") || figureName.toLowerCase().includes("lebon") || figureId === "lebon") {
      return lebonTopics;
    }
    if (figureName.toLowerCase().includes("william james") || figureName.toLowerCase().includes("james") || figureId === "william-james") {
      return williamJamesTopics;
    }
    if (figureName.toLowerCase().includes("aristotle") || figureId === "aristotle") {
      return aristotleTopics.map(t => ({ topic: t.title, description: t.description, questions: t.questions }));
    }
    if (figureName.toLowerCase().includes("marx") || figureId === "marx") {
      return marxTopics;
    }
    if (figureName.toLowerCase().includes("plato") || figureId === "plato") {
      return platoTopics;
    }
    if (figureName.toLowerCase().includes("darwin") || figureId === "darwin") {
      return darwinTopics;
    }
    if (figureName.toLowerCase().includes("mill") || figureId === "mill") {
      return millTopics;
    }
    if (figureName.toLowerCase().includes("kant") || figureId === "kant") {
      return kantTopics;
    }
    if (figureName.toLowerCase().includes("rousseau") || figureId === "rousseau") {
      return rousseauTopics;
    }
    if (figureName.toLowerCase().includes("newton") || figureId === "newton") {
      return newtonTopics;
    }
    if (figureName.toLowerCase().includes("schopenhauer") || figureId === "schopenhauer") {
      return schopenhauerTopics;
    }
    if (figureName.toLowerCase().includes("adler") || figureId === "adler") {
      return adlerTopics;
    }
    if (figureName.toLowerCase().includes("bergson") || figureId === "bergson") {
      return bergsonTopics;
    }
    if (figureName.toLowerCase().includes("engels") || figureId === "engels") {
      return engelsTopics;
    }
    if (figureName.toLowerCase().includes("locke") || figureId === "locke") {
      return lockeTopics;
    }
    if (figureName.toLowerCase().includes("spencer") || figureId === "spencer") {
      return spencerTopics;
    }
    if (figureName.toLowerCase().includes("peirce") || figureId === "peirce") {
      return peirceTopics;
    }
    if (figureName.toLowerCase().includes("veblen") || figureId === "veblen") {
      return veblenTopics;
    }
    if (figureName.toLowerCase().includes("whewell") || figureId === "whewell") {
      return whewellTopics;
    }
    if (figureName.toLowerCase().includes("popper") || figureId === "popper") {
      return popperTopics;
    }
    if (figureName.toLowerCase().includes("voltaire") || figureId === "voltaire") {
      return voltaireTopics;
    }
    if (figureName.toLowerCase().includes("maimonides") || figureId === "maimonides") {
      return maimonidesTopics;
    }
    if (figureName.toLowerCase().includes("hobbes") || figureId === "hobbes") {
      return hobbesTopics;
    }
    if (figureName.toLowerCase().includes("descartes") || figureId === "descartes") {
      return descartesTopics;
    }
    if (figureName.toLowerCase().includes("luther") || figureId === "luther") {
      return lutherTopics;
    }
    if (figureName.toLowerCase().includes("dewey") || figureId === "dewey") {
      return deweyTopics;
    }
    if (figureName.toLowerCase().includes("stekel") || figureId === "stekel") {
      return stekelTopics;
    }
    if (figureName.toLowerCase().includes("hegel") || figureId === "hegel") {
      return hegelTopics;
    }
    if (figureName.toLowerCase().includes("rochefoucauld") || figureId === "larochefoucauld") {
      return larochefoucauldTopics;
    }
    if (figureName.toLowerCase().includes("poincar") || figureId === "poincare") {
      return poincareTopics;
    }
    return [];
  };

  const topics = getTopicsForFigure(figureId);

  const handleTopicClick = (topic: string) => {
    onSelectPrompt(`TELL ME ABOUT ${topic.toUpperCase()}`);
    onOpenChange(false);
  };

  const handleQuestionClick = (question: string) => {
    onSelectPrompt(question);
    onOpenChange(false);
  };

  const toggleTopic = (topic: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTopic(expandedTopic === topic ? null : topic);
  };

  if (topics.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              What to Ask {figureName}
            </DialogTitle>
            <DialogDescription>
              Topic suggestions for this philosopher are coming soon.
            </DialogDescription>
          </DialogHeader>
          <div className="py-8 text-center text-muted-foreground">
            <p>No topic suggestions available yet for {figureName}.</p>
            <p className="text-sm mt-2">Feel free to ask any philosophical question!</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            What to Ask {figureName}
          </DialogTitle>
          <DialogDescription>
            Click a topic to expand and see questions. Click a question to auto-fill the input.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto pr-2" style={{ maxHeight: 'calc(85vh - 160px)' }}>
          <div className="space-y-2 py-2">
            {topics.map((topicData, index) => (
              <div 
                key={index} 
                className="border rounded-lg overflow-hidden bg-card"
              >
                <div 
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={(e) => toggleTopic(topicData.topic, e)}
                  data-testid={`topic-row-${index}`}
                >
                  <div className="flex-shrink-0 text-primary">
                    {expandedTopic === topicData.topic ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground">{topicData.topic}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {topicData.description}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 gap-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTopicClick(topicData.topic);
                    }}
                    data-testid={`ask-topic-${index}`}
                  >
                    <Send className="w-3 h-3" />
                    Ask
                  </Button>
                </div>

                {expandedTopic === topicData.topic && (
                  <div className="border-t bg-muted/30">
                    <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                      <div className="px-3 py-1 text-xs font-medium text-muted-foreground sticky top-0 bg-muted/30">
                        {topicData.questions.length} questions:
                      </div>
                      {topicData.questions.map((question, qIndex) => (
                        <Button
                          key={qIndex}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-left h-auto py-2 px-3 text-sm hover:bg-primary/10"
                          onClick={() => handleQuestionClick(question)}
                          data-testid={`question-${index}-${qIndex}`}
                        >
                          <MessageSquare className="w-3 h-3 mr-2 flex-shrink-0 text-primary" />
                          <span className="line-clamp-2">{question}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t text-center">
          <p className="text-xs text-muted-foreground">
            {topics.length} topics • {topics.reduce((sum, t) => sum + t.questions.length, 0)} suggested questions
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
