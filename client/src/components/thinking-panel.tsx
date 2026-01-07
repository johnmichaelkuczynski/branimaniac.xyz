import { useEffect, useState, useRef } from "react";
import { Brain, Sparkles } from "lucide-react";
import { getQuotesForThinker } from "@/data/thinker-quotes";

interface ThinkingPanelProps {
  thinkerName: string;
  isActive: boolean;
  figureId?: string;
}

export function ThinkingPanel({ thinkerName, isActive, figureId }: ThinkingPanelProps) {
  const [thoughts, setThoughts] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive) {
      // Get quotes specific to this thinker from centralized data
      const thinkerQuotes = getQuotesForThinker(thinkerName, figureId);
      const shuffled = [...thinkerQuotes].sort(() => Math.random() - 0.5);
      setThoughts(shuffled);
      setCurrentIndex(0);
      
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % shuffled.length);
      }, 2000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setThoughts([]);
      setCurrentIndex(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, thinkerName, figureId]);

  useEffect(() => {
    if (scrollRef.current && isActive) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentIndex, isActive]);

  if (!isActive) return null;

  // Show more quotes to fill the panel - up to 12 visible at once
  const visibleThoughts = thoughts.slice(0, currentIndex + 1).slice(-12);

  return (
    <div className="w-72 h-full min-h-0 bg-[#0f172a] border-l border-[#3b82f6]/30 backdrop-blur-sm flex flex-col shadow-inner">
      <div className="p-3 border-b border-[#3b82f6]/30 bg-[#0f172a] shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="w-5 h-5 text-[#3b82f6] animate-pulse" />
            <Sparkles className="w-3 h-3 text-[#3b82f6] absolute -top-1 -right-1 animate-bounce" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#3b82f6]">
              {thinkerName} is thinking...
            </p>
            <p className="text-xs text-[#94a3b8] italic">
              Consulting the archives
            </p>
          </div>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col justify-end"
      >
        <div className="space-y-3">
          {visibleThoughts.map((thought, idx) => (
            <div
              key={`${currentIndex}-${idx}`}
              className={`text-xs leading-relaxed text-[#f8fafc] italic font-serif transition-all duration-700 ${
                idx === visibleThoughts.length - 1 
                  ? 'opacity-100' 
                  : idx === visibleThoughts.length - 2
                    ? 'opacity-80'
                    : idx === visibleThoughts.length - 3
                      ? 'opacity-65'
                      : 'opacity-50'
              }`}
              style={{
                animation: idx === visibleThoughts.length - 1 ? 'fadeSlideIn 0.7s ease-out' : undefined
              }}
            >
              <span className="text-[#3b82f6]">"</span>{thought}<span className="text-[#3b82f6]">"</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-2 border-t border-[#3b82f6]/30 bg-[#0f172a] shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-[#1e293b] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#3b82f6] rounded-full animate-pulse"
              style={{
                width: '100%',
                animation: 'shimmer 2s ease-in-out infinite'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
