import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search as SearchIcon,
  Database,
  CheckCircle2,
  Trash2,
  TrendingUp,
  Activity,
  Shield,
  Zap,
  Sparkles,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { api, Stats, Search as SearchType, Platform } from "@/lib/api";
import { useLocation } from "wouter";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentSearches, setRecentSearches] = useState<SearchType[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, searchesData, platformsData] = await Promise.all([
        api.getStats(),
        api.getSearches(),
        api.getPlatforms(),
      ]);
      setStats(statsData);
      setRecentSearches(searchesData.searches.slice(0, 5));
      setPlatforms(platformsData.platforms);
    } catch (error) {
      toast.error("Failed to load dashboard data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Count platforms by tier
  const tier1Count = platforms.filter(p => p.tier === 1).length;
  const tier2Count = platforms.filter(p => p.tier === 2).length;
  const tier3Count = platforms.filter(p => p.tier === 3).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        
        <div className="container relative py-12">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-6">
              <Activity className="w-4 h-4" />
              <span>Account Discovery Dashboard</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Clean Up Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                Digital Footprint
              </span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
              Discover and manage old accounts across {platforms.length}+ social media platforms with our
              reliable three-tier verification system.
            </p>

            <Button
              size="lg"
              onClick={() => setLocation('/search')}
              className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              <SearchIcon className="w-5 h-5 mr-2" />
              Start New Search
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="container py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Searches
              </CardTitle>
              <Database className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.total_searches || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.completed_searches || 0} completed
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Accounts Found
              </CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.total_accounts || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats?.pending_accounts || 0} pending review
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-green-500/5 to-card/30 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Confirmed
              </CardTitle>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {stats?.confirmed_accounts || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Verified accounts
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-gradient-to-br from-blue-500/5 to-card/30 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Deleted
              </CardTitle>
              <Trash2 className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">
                {stats?.deleted_accounts || 0}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cleaned up
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Searches */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Recent Searches</CardTitle>
              <CardDescription>
                Your latest account discovery searches
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentSearches.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <SearchIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No searches yet</p>
                  <Button
                    variant="link"
                    onClick={() => setLocation('/search')}
                    className="mt-2"
                  >
                    Start your first search
                  </Button>
                </div>
              ) : (
                recentSearches.map((search) => (
                  <div
                    key={search.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-accent/50 transition-all cursor-pointer"
                    onClick={() => setLocation(`/results/${search.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">@{search.username}</p>
                      <p className="text-sm text-muted-foreground">
                        {search.accounts_found} accounts found
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          search.status === 'completed'
                            ? 'border-green-500/20 bg-green-500/10 text-green-500'
                            : search.status === 'running'
                            ? 'border-primary/20 bg-primary/10 text-primary'
                            : 'border-border'
                        }
                      >
                        {search.status}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Platform Stats */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Platform Coverage</CardTitle>
              <CardDescription>
                {platforms.length} platforms across 3 verification tiers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tier Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">Tier 1 - API</p>
                      <p className="text-xs text-muted-foreground">95% confidence</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {tier1Count}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-medium">Tier 2 - Browser</p>
                      <p className="text-xs text-muted-foreground">85% confidence</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {tier2Count}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-medium">Tier 3 - HTTP</p>
                      <p className="text-xs text-muted-foreground">70% confidence</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {tier3Count}
                  </Badge>
                </div>
              </div>

              {/* Platform Categories */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Platform Categories
                </h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(platforms.map(p => p.category))).map((category) => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <Card className="mt-12 border-primary/20 bg-gradient-to-br from-primary/5 via-card/50 to-accent/5 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-6 text-primary" />
            <h2 className="text-2xl font-bold mb-2">
              Ready to Clean Up Your Digital Presence?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Start a new search to discover old accounts across {platforms.length}+ platforms with our
              reliable three-tier verification system.
            </p>
            <Button
              size="lg"
              onClick={() => setLocation('/search')}
              className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              <SearchIcon className="w-5 h-5 mr-2" />
              Start New Search
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
