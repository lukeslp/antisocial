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

      toast.success(`Search started for @${username}${deepSearch ? ' (deep search)' : ''}`);
      setLocation(`/results/${search.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to start search");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container max-w-2xl px-4">
        <div className="text-center space-y-8">
          {/* Header */}
          <div className="space-y-3">
            <h1 className="text-5xl font-bold tracking-tight">
              Find Your Old Accounts
            </h1>
            <p className="text-xl text-muted-foreground max-w-lg mx-auto">
              Search 24 major platforms to discover accounts you may have forgotten about
            </p>
          </div>

          {/* Search Input */}
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="text-lg h-12"
                autoFocus
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching}
                size="lg"
                className="px-8 h-12"
              >
                {isSearching ? (
                  <>
                    <SearchIcon className="mr-2 h-5 w-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <SearchIcon className="mr-2 h-5 w-5" />
                    Search
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
              />
              <Label htmlFor="deep-search" className="flex items-center gap-2 cursor-pointer">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  Deep Search
                  <span className="text-muted-foreground ml-1">
                    ({deepSearch ? '765+' : '24'} platforms)
                  </span>
                </span>
              </Label>
            </div>

            <p className="text-sm text-muted-foreground">
              {deepSearch
                ? 'Searching 765+ platforms via WhatsMyName database (slower, more thorough)'
                : 'Quick search across 24 major platforms'}
            </p>
          </div>

          {/* Simple Explanation */}
          <div className="max-w-xl mx-auto pt-8">
            <div className="p-6 rounded-lg bg-card/50 border border-border/50 text-left space-y-3">
              <h3 className="font-semibold text-lg">How it works</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We search 24 major platforms using official APIs, browser automation, and intelligent content analysis. 
                Each result includes a direct link to the account and step-by-step deletion instructions.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Mark results as correct or incorrect to help us improve accuracy and filter your final report.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
