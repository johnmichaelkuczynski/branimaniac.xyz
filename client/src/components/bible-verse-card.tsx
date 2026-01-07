import { Card } from "@/components/ui/card";

interface BibleVerseCardProps {
  verseText: string;
  verseReference: string;
}

export function BibleVerseCard({ verseText, verseReference }: BibleVerseCardProps) {
  return (
    <Card className="p-4 border-l-4 sacred-border bg-card/50 backdrop-blur-sm" data-testid="card-bible-verse">
      <blockquote className="font-verse italic text-sm md:text-base leading-relaxed text-foreground">
        "{verseText}"
      </blockquote>
      <cite className="block mt-2 text-xs md:text-sm text-muted-foreground not-italic">
        — {verseReference}
      </cite>
    </Card>
  );
}
