import { MockUI } from "@/app/components/mock-ui";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <>
      {/* Header */}
      <header className="space-y-3 text-center">
        <p className="text-balance text-2xl font-medium text-foreground sm:text-3xl">
          Train interview performance under pressure
        </p>
      </header>

      {/* Supporting paragraph */}
      <p className="text-pretty text-center text-muted-foreground">
        Most interviews don&apos;t fail on content — they fail on delivery.
        Pressure breaks structure, clarity dissolves, and the moment slips away.
        Pulse simulates that exact moment, so you can master it.
      </p>

      {/* Mock UI */}
      <MockUI />

      {/* How it works */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">How it works</h2>
        <ol className="space-y-1.5 text-sm text-muted-foreground">
          <li>
            <span className="mr-2 text-foreground">1.</span>
            Countdown — 5 seconds to prepare
          </li>
          <li>
            <span className="mr-2 text-foreground">2.</span>
            Record — answer under time pressure
          </li>
          <li>
            <span className="mr-2 text-foreground">3.</span>
            Review — watch, read transcript, add takes
          </li>
        </ol>
      </div>

      {/* What it trains */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">What it trains</h2>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li>Structured thinking under pressure</li>
          <li>Clear, confident communication</li>
          <li>Reducing freeze moments</li>
        </ul>
      </div>

      {/* CTAs */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <Button size="lg" className="w-full sm:w-auto">
          Start Practice
        </Button>
        <button
          type="button"
          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Try a question
        </button>
      </div>
    </>
  );
}
