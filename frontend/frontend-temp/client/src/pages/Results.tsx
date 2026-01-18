import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Info,
  Download,
  ChevronDown,
  ChevronUp,
  Search as SearchIcon,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { api, Search, Account, PlatformCheck } from "@/lib/api";
import { useRoute } from "wouter";
import { PlatformIcon, PlatformBadge } from "@/components/PlatformIcon";
import { DeletionGuideDialog } from "@/components/DeletionGuideDialog";

export default function Results() {
  const [, params] = useRoute("/results/:id");
  const searchId = params?.id ? parseInt(params.id) : null;

  const [search, setSearch] = useState<Search | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [negativeChecks, setNegativeChecks] = useState<PlatformCheck[]>([]);
  const [showNegativeResults, setShowNegativeResults] = useState(false);
  const [loading, setLoading] = useState(true);

  // Use ref to avoid stale closure in polling interval
  const searchStatusRef = useRef<string | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    searchStatusRef.current = search?.status || null;
  }, [search?.status]);

  useEffect(() => {
    if (searchId) {
      loadData();
      // Poll for updates while search is running or pending
      const interval = setInterval(() => {
        const status = searchStatusRef.current;
        if (status === 'running' || status === 'pending' || status === null) {
          loadData();
        }
      }, 2000); // Poll every 2 seconds to balance freshness with server load
      return () => clearInterval(interval);
    }
  }, [searchId]);

  const loadData = async () => {
    if (!searchId) return;

    try {
      const [searchData, resultsData] = await Promise.all([
        api.getSearch(searchId),
        api.getSearchResults(searchId),
      ]);
      setSearch(searchData);
      setAccounts(resultsData.accounts);

      // Load negative checks when search is completed
      if (searchData.status === 'completed') {
        const checksData = await api.getSearchChecks(searchId, false);
        setNegativeChecks(checksData.checks);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load search results");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAccount = async (accountId: number, isCorrect: boolean) => {
    try {
      const status = isCorrect ? 'confirmed' : 'false_positive';
      await api.updateAccount(accountId, { status });
      setAccounts(prev =>
        prev.map(acc =>
          acc.id === accountId ? { ...acc, status: status as any } : acc
        )
      );
      toast.success(isCorrect ? "Confirmed as yours" : "Hidden from results");
    } catch (error: any) {
      toast.error(error.message || "Failed to update account");
    }
  };

  const handleFeedback = async (accountId: number, feedback: number) => {
    try {
      const account = accounts.find(a => a.id === accountId);
      // Toggle off if clicking same feedback
      const newFeedback = account?.accuracy_feedback === feedback ? 0 : feedback;
      await api.submitFeedback(accountId, newFeedback);
      setAccounts(prev =>
        prev.map(acc =>
          acc.id === accountId ? { ...acc, accuracy_feedback: newFeedback } : acc
        )
      );
      if (newFeedback === 1) toast.success("Marked as accurate");
      else if (newFeedback === -1) toast.success("Marked as inaccurate");
      else toast.success("Feedback cleared");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit feedback");
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const confirmedAccounts = accounts.filter(a => a.status === 'confirmed');
      
      if (confirmedAccounts.length === 0) {
        toast.error("No confirmed accounts to export");
        return;
      }

      let url: string;
      if (format === 'csv') {
        const headers = ['Platform', 'Username', 'Display Name', 'Profile URL', 'Confidence'];
        const rows = confirmedAccounts.map(acc => [
          acc.platform_name,
          acc.username,
          acc.display_name || '',
          acc.profile_url,
          `${acc.confidence_score}%`,
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accounts-${search?.username}.csv`;
        a.click();
      } else {
        const json = JSON.stringify(confirmedAccounts, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accounts-${search?.username}.json`;
        a.click();
      }

      // Clean up blob URL to prevent memory leak
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${confirmedAccounts.length} accounts`);
    } catch (error: any) {
      toast.error("Failed to export accounts");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Fetching your results...</p>
        </div>
      </div>
    );
  }

  if (!search) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500" />
          <p className="text-muted-foreground">Couldn't find that search</p>
        </div>
      </div>
    );
  }

  const progress = search.platforms_total
    ? (search.platforms_checked / search.platforms_total) * 100
    : 0;

  // Only show confirmed and pending accounts (hide false positives)
  const visibleAccounts = accounts.filter(a => a.status !== 'false_positive');
  const confirmedCount = accounts.filter(a => a.status === 'confirmed').length;

  const getVerificationMethod = (score: number) => {
    if (score >= 90) return "Verified through official API";
    if (score >= 80) return "Checked with browser automation";
    return "Found via HTTP request";
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8 max-w-4xl" role="main" aria-label="Search results">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">@{search.username}</h1>
            <p className="text-muted-foreground">
              {visibleAccounts.length === 0
                ? 'No accounts found yet'
                : visibleAccounts.length === 1
                  ? '1 account found'
                  : `${visibleAccounts.length} accounts found`}
              {confirmedCount > 0 && ` · ${confirmedCount} yours`}
            </p>
          </div>
          
          {confirmedCount > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                aria-label="Export confirmed accounts as CSV file"
              >
                <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('json')}
                aria-label="Export confirmed accounts as JSON file"
              >
                <Download className="w-4 h-4 mr-2" aria-hidden="true" />
                Export JSON
              </Button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {search.status === 'running' && (
          <Card className="mb-6 border-border/50">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" aria-hidden="true" />
                    <span className="text-muted-foreground">
                      Checking sites...
                      {search.accounts_found > 0 && ` (found ${search.accounts_found} so far)`}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-primary/70">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                      Live
                    </span>
                  </div>
                  <span className="font-mono font-medium">
                    {search.platforms_checked} / {search.platforms_total || 0}
                  </span>
                </div>
                <Progress
                  value={progress}
                  className="h-2"
                  aria-label={`Search progress: ${search.platforms_checked} of ${search.platforms_total || 0} platforms checked`}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <div className="space-y-3">
          {visibleAccounts.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  {search.status === 'running'
                    ? 'Nothing yet — still looking...'
                    : 'No accounts found with this username'}
                </p>
              </CardContent>
            </Card>
          ) : (
            visibleAccounts.map((account) => (
              <Card
                key={account.id}
                className={`border-border/50 transition-all ${
                  account.status === 'confirmed' 
                    ? 'bg-green-500/5 border-green-500/20' 
                    : 'hover:border-primary/30'
                }`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    {/* Platform Icon */}
                    <PlatformIcon platformId={account.platform_id} size="lg" />

                    {/* Avatar */}
                    <Avatar className="w-12 h-12 border-2 border-border">
                      <AvatarImage src={account.avatar_url} alt={account.display_name} />
                      <AvatarFallback>
                        {account.display_name?.[0] || account.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1">
                            {account.display_name || account.username}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <PlatformBadge 
                              platformId={account.platform_id} 
                              platformName={account.platform_name} 
                            />
                            <span className="text-sm text-muted-foreground">@{account.username}</span>
                          </div>
                          {account.bio && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {account.bio}
                            </p>
                          )}
                        </div>

                        {/* Confidence with Tooltip */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className="font-mono cursor-help"
                            >
                              <Info className="w-3 h-3 mr-1" />
                              {account.confidence_score}%
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-sm">{getVerificationMethod(account.confidence_score)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(account.profile_url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Profile
                        </Button>

                        <DeletionGuideDialog
                          platformId={account.platform_id}
                          platformName={account.platform_name}
                          profileUrl={account.profile_url}
                        />

                        {/* Accuracy Feedback */}
                        <div className="flex items-center gap-1 ml-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`p-2 ${
                                  account.accuracy_feedback === 1
                                    ? 'text-green-500 bg-green-500/10'
                                    : 'text-muted-foreground hover:text-green-500'
                                }`}
                                onClick={() => handleFeedback(account.id, 1)}
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Good find</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className={`p-2 ${
                                  account.accuracy_feedback === -1
                                    ? 'text-red-500 bg-red-500/10'
                                    : 'text-muted-foreground hover:text-red-500'
                                }`}
                                onClick={() => handleFeedback(account.id, -1)}
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Wrong result</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        {account.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-green-500/20 bg-green-500/10 text-green-500 hover:bg-green-500/20"
                              onClick={() => handleMarkAccount(account.id, true)}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              That's me
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                              onClick={() => handleMarkAccount(account.id, false)}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Not me
                            </Button>
                          </>
                        )}

                        {account.status === 'confirmed' && (
                          <Badge className="border-green-500/20 bg-green-500/10 text-green-500">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Confirmed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Completion Message */}
        {search.status === 'completed' && visibleAccounts.length > 0 && (
          <div className="mt-6 p-4 rounded-lg bg-card/50 border border-border/50 text-center">
            <p className="text-sm text-muted-foreground">
              All done! Mark which accounts are yours, then export the list.
            </p>
          </div>
        )}

        {/* Negative Results - Platforms Checked but Not Found */}
        {search.status === 'completed' && negativeChecks.length > 0 && (
          <div className="mt-6">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between p-4 rounded-lg bg-card/30 border border-border/50 hover:bg-card/50"
              onClick={() => setShowNegativeResults(!showNegativeResults)}
              aria-expanded={showNegativeResults}
              aria-controls="negative-results"
            >
              <div className="flex items-center gap-2">
                <SearchIcon className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <span className="text-sm text-muted-foreground">
                  {negativeChecks.length} sites with nothing
                </span>
              </div>
              {showNegativeResults ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
              )}
            </Button>

            {showNegativeResults && (
              <div id="negative-results" className="mt-3 p-4 rounded-lg bg-card/20 border border-border/30">
                <p className="text-xs text-muted-foreground mb-3">
                  Didn't find anything on these. Click to double-check yourself if you want.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {negativeChecks.map((check) => (
                    <a
                      key={check.id}
                      href={check.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded bg-card/30 hover:bg-card/50 transition-colors text-sm text-muted-foreground hover:text-foreground"
                    >
                      <PlatformIcon platformId={check.platform_id} size="sm" />
                      <span className="truncate">{check.platform_name}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
