import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Database, Search, CheckCircle, XCircle, AlertTriangle, Clock, FileText } from "lucide-react";

interface TraceEvent {
  timestamp: number;
  type: 'query' | 'search_start' | 'passage_found' | 'passage_rejected' | 'direct_answer' | 'alignment_check' | 'generation_start' | 'complete' | 'error';
  table?: 'positions' | 'quotes' | 'chunks';
  sql?: string;
  passage?: string;
  passageId?: number;
  reason?: string;
  answerNumber?: 1 | 2 | 3;
  aligned?: boolean;
  conflicting?: boolean;
  message?: string;
}

interface AuditPanelProps {
  isActive: boolean;
  events: TraceEvent[];
  onDownloadReport: () => void;
  thinker?: string;
  question?: string;
}

export function AuditPanel({ isActive, events, onDownloadReport, thinker, question }: AuditPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<number>>(new Set());
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);
  
  const toggleExpand = (index: number) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };
  
  const getEventIcon = (event: TraceEvent) => {
    switch (event.type) {
      case 'query':
        return <Database className="w-3 h-3 text-blue-500" />;
      case 'search_start':
        return <Search className="w-3 h-3 text-amber-500" />;
      case 'direct_answer':
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'passage_rejected':
        return <XCircle className="w-3 h-3 text-red-400" />;
      case 'alignment_check':
        return event.conflicting 
          ? <AlertTriangle className="w-3 h-3 text-orange-500" />
          : <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'generation_start':
        return <FileText className="w-3 h-3 text-purple-500" />;
      case 'complete':
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'error':
        return <XCircle className="w-3 h-3 text-red-600" />;
      default:
        return <Clock className="w-3 h-3 text-muted-foreground" />;
    }
  };
  
  const getTableBadge = (table?: string) => {
    if (!table) return null;
    const colors: Record<string, string> = {
      positions: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      quotes: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      chunks: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    };
    return (
      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${colors[table] || ''}`}>
        {table}
      </Badge>
    );
  };
  
  const directAnswerCount = events.filter(e => e.type === 'direct_answer').length;
  const rejectedCount = events.filter(e => e.type === 'passage_rejected').length;
  const lastAlignment = events.find(e => e.type === 'alignment_check');
  
  if (!isActive && events.length === 0) {
    return null;
  }
  
  return (
    <Card className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 border-l">
      <CardHeader className="py-3 px-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Audit Trace
          </CardTitle>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={onDownloadReport}
            disabled={events.length === 0}
            className="h-7 text-xs"
            data-testid="button-download-audit"
          >
            <Download className="w-3 h-3 mr-1" />
            Report
          </Button>
        </div>
        
        {question && (
          <div className="text-xs text-muted-foreground mt-2 line-clamp-2">
            <span className="font-medium">Q:</span> {question}
          </div>
        )}
        
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-600 dark:text-green-400">
            {directAnswerCount}/3 Direct
          </Badge>
          <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-500">
            {rejectedCount} Rejected
          </Badge>
          {lastAlignment && (
            <Badge 
              variant="outline" 
              className={`text-[10px] ${lastAlignment.conflicting 
                ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' 
                : 'bg-green-500/10 text-green-600 dark:text-green-400'}`}
            >
              {lastAlignment.conflicting ? 'CONFLICTING' : lastAlignment.aligned ? 'ALIGNED' : 'PENDING'}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <ScrollArea className="flex-1" ref={scrollRef}>
        <CardContent className="p-2 space-y-1">
          {events.length === 0 && isActive && (
            <div className="text-xs text-muted-foreground text-center py-4 animate-pulse">
              Waiting for search to begin...
            </div>
          )}
          
          {events.map((event, idx) => {
            const isExpanded = expandedEvents.has(idx);
            const time = new Date(event.timestamp).toISOString().split('T')[1].split('.')[0];
            
            return (
              <div 
                key={idx}
                className={`text-[11px] p-2 rounded border cursor-pointer transition-colors ${
                  event.type === 'direct_answer' 
                    ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                    : event.type === 'error'
                    ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
                    : event.type === 'alignment_check' && event.conflicting
                    ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800'
                    : 'bg-background border-border hover:bg-muted/50'
                }`}
                onClick={() => toggleExpand(idx)}
                data-testid={`trace-event-${idx}`}
              >
                <div className="flex items-start gap-2">
                  {getEventIcon(event)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-muted-foreground font-mono">{time}</span>
                      <span className="font-medium uppercase text-[10px]">{event.type.replace('_', ' ')}</span>
                      {getTableBadge(event.table)}
                      {event.answerNumber && (
                        <Badge className="text-[9px] px-1 py-0 bg-green-500">
                          #{event.answerNumber}
                        </Badge>
                      )}
                    </div>
                    
                    {event.message && (
                      <div className="text-muted-foreground mt-1 break-words">
                        {event.message}
                      </div>
                    )}
                    
                    {event.passage && (
                      <div className={`mt-1 text-foreground italic ${isExpanded ? '' : 'line-clamp-2'}`}>
                        "{event.passage}"
                      </div>
                    )}
                    
                    {event.reason && (
                      <div className="mt-1 text-muted-foreground">
                        <span className="font-medium">Reason:</span> {event.reason}
                      </div>
                    )}
                    
                    {isExpanded && event.sql && (
                      <div className="mt-2 p-2 bg-muted/50 rounded font-mono text-[10px] break-all">
                        {event.sql}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {isActive && events.length > 0 && events[events.length - 1].type !== 'complete' && (
            <div className="text-xs text-center py-2 text-muted-foreground animate-pulse">
              Searching...
            </div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
