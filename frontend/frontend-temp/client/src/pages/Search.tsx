import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search as SearchIcon, Zap, Globe } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { useLocation } from "wouter";

type SearchMode = "quick" | "deep";

export default function Search() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mode, setMode] = useState<SearchMode>("quick");

  const handleSearch = async () => {
    if (!username.trim()) {
      toast.error("Enter a username first");
      return;
    }

    setIsSearching(true);
    try {
      const search = await api.createSearch({
        username: username.trim(),
        deep_search: mode === "deep",
      });

      toast.success(
        mode === "deep"
          ? `Hunting @${username} across 700+ sites...`
          : `Scanning 24 platforms for @${username}...`
      );
      setLocation(`/results/${search.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to start search");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <main className="w-full max-w-xl" role="main" aria-label="Search for accounts">
        <div className="space-y-10">

          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-6xl font-bold tracking-tighter">
              antisocial
            </h1>
            <p className="text-muted-foreground text-lg">
              find the accounts you forgot you made
            </p>
          </div>

          {/* Search input */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <label htmlFor="username-input" className="sr-only">Username to search</label>
              <Input
                id="username-input"
                placeholder="your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="text-lg h-12 font-mono"
                autoFocus
                aria-describedby="mode-desc"
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                size="lg"
                className="px-8 h-12 shrink-0"
                aria-label={isSearching ? "Search in progress" : "Start searching"}
              >
                {isSearching ? (
                  <>
                    <SearchIcon className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    searching
                  </>
                ) : (
                  <>
                    <SearchIcon className="mr-2 h-4 w-4" aria-hidden="true" />
                    hunt
                  </>
                )}
              </Button>
            </div>

            {/* Mode selector — the main UX decision */}
            <div
              className="grid grid-cols-2 gap-3"
              role="radiogroup"
              aria-label="Search depth"
              id="mode-desc"
            >
              <button
                type="button"
                role="radio"
                aria-checked={mode === "quick"}
                onClick={() => setMode("quick")}
                className={[
                  "p-4 rounded-lg border text-left transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  mode === "quick"
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border bg-card/50 hover:border-border/80 hover:bg-card/70",
                ].join(" ")}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className={`w-4 h-4 ${mode === "quick" ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                  <span className="font-semibold text-sm">Quick scan</span>
                  {mode === "quick" && (
                    <span className="ml-auto text-xs font-medium text-primary">default</span>
                  )}
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums">24</div>
                <div className="text-xs text-muted-foreground mt-0.5">platforms · ~30 seconds</div>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={mode === "deep"}
                onClick={() => setMode("deep")}
                className={[
                  "p-4 rounded-lg border text-left transition-all",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  mode === "deep"
                    ? "border-primary bg-primary/10 ring-1 ring-primary"
                    : "border-border bg-card/50 hover:border-border/80 hover:bg-card/70",
                ].join(" ")}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Globe className={`w-4 h-4 ${mode === "deep" ? "text-primary" : "text-muted-foreground"}`} aria-hidden="true" />
                  <span className="font-semibold text-sm">Deep dive</span>
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums">700+</div>
                <div className="text-xs text-muted-foreground mt-0.5">platforms · 1–2 minutes</div>
              </button>
            </div>

            <p className="text-xs text-muted-foreground text-center px-2">
              {mode === "quick"
                ? "Checks 24 high-traffic platforms — GitHub, Reddit, Twitter, Instagram, and more."
                : <>Adds 700+ sites from the <a href="https://github.com/WebBreacher/WhatsMyName" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">WhatsMyName</a> database on top of the core 24.</>
              }
            </p>
          </div>

          {/* What happens next */}
          <div className="p-5 rounded-lg bg-card/40 border border-border/40 space-y-2 text-sm text-muted-foreground">
            <p>Results come in as each platform is checked — no waiting for everything to finish.</p>
            <p>Mark which accounts are actually yours. Feedback improves accuracy over time.</p>
          </div>

        </div>
      </main>
    </div>
  );
}
