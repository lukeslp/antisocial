import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search as SearchIcon, Globe } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { useLocation } from "wouter";

export default function Search() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [deepSearch, setDeepSearch] = useState(false);

  const handleSearch = async () => {
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    setIsSearching(true);
    try {
      const search = await api.createSearch({
        username: username.trim(),
        deep_search: deepSearch,
      });

      toast.success(`Looking for @${username}${deepSearch ? ' everywhere' : ''}...`);
      setLocation(`/results/${search.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to start search");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <main className="container max-w-2xl px-4" role="main" aria-label="Search for accounts">
        <div className="text-center space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-5xl font-bold tracking-tight">
              Social Scout
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto">
              Track down those accounts you forgot you made
            </p>
          </div>

          {/* Search Input */}
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex gap-3">
              <label htmlFor="username-input" className="sr-only">Username to search</label>
              <Input
                id="username-input"
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="text-lg h-12"
                autoFocus
                aria-describedby="search-help"
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                size="lg"
                className="px-8 h-12"
                aria-label={isSearching ? "Search in progress" : "Start searching for accounts"}
              >
                {isSearching ? (
                  <>
                    <SearchIcon className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                    Looking...
                  </>
                ) : (
                  <>
                    <SearchIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                    Scout
                  </>
                )}
              </Button>
            </div>

            {/* Deep Search Toggle */}
            <div className="flex items-center justify-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
              <Switch
                id="deep-search"
                checked={deepSearch}
                onCheckedChange={setDeepSearch}
                aria-describedby="deep-search-desc"
              />
              <Label htmlFor="deep-search" className="flex items-center gap-2 cursor-pointer">
                <Globe className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm">
                  Go deep
                  <span className="text-muted-foreground ml-1">
                    ({deepSearch ? '700+' : '24'} sites)
                  </span>
                </span>
              </Label>
            </div>

            <p id="deep-search-desc" className="text-sm text-muted-foreground">
              {deepSearch
                ? 'Checking 700+ sites — typically 1-2 minutes, but leaves no stone unturned'
                : 'Quick scan of 24 popular platforms — usually under 30 seconds'}
            </p>
            <p id="search-help" className="sr-only">
              Enter the username you want to search for across social media platforms
            </p>
          </div>

          {/* Simple Explanation */}
          <div className="max-w-xl mx-auto pt-8">
            <div className="p-6 rounded-lg bg-card/50 border border-border/50 text-left space-y-3">
              <h3 className="font-semibold text-lg">What happens next</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Social Scout checks each platform for accounts matching your username.
                Results appear in real-time with links to profiles and deletion tips.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The "Go deep" option uses the{" "}
                <a
                  href="https://github.com/WebBreacher/WhatsMyName"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  WhatsMyName
                </a>{" "}
                database to scan 700+ additional sites beyond the core 24.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Mark which results are actually yours — feedback improves accuracy over time.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
