import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  Shield,
  Trash2,
  AlertCircle,
  ThumbsDown,
  Download,
} from "lucide-react";
import { useState, useEffect } from "react";
import { api, Account } from "@/lib/api";
import { PlatformIcon, PlatformBadge } from "@/components/PlatformIcon";
import { ExportDialog } from "@/components/ExportDialog";

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadAccounts();
  }, [statusFilter]);

  const loadAccounts = async () => {
    try {
      const data = await api.getAccounts(statusFilter);
      setAccounts(data.accounts);
    } catch (error: any) {
      toast.error(error.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === accounts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(accounts.map(a => a.id)));
    }
  };

  const handleBulkUpdate = async (status: string) => {
    if (selectedIds.size === 0) {
      toast.error("No accounts selected");
      return;
    }

    try {
      await api.bulkUpdateAccounts({
        account_ids: Array.from(selectedIds),
        status,
      });
      
      setAccounts(prev =>
        prev.map(acc =>
          selectedIds.has(acc.id) ? { ...acc, status: status as any } : acc
        )
      );
      
      setSelectedIds(new Set());
      toast.success(`${selectedIds.size} account(s) updated`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update accounts");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading accounts...</p>
        </div>
      </div>
    );
  }

  // Separate accounts
  const activeAccounts = accounts.filter(a => a.status !== 'false_positive');
  const falsePositives = accounts.filter(a => a.status === 'false_positive');

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">All Accounts</h1>
            <p className="text-muted-foreground">
              Manage all discovered accounts across platforms
            </p>
          </div>

          {/* Filters and Actions */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="false_positive">False Positive</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                </SelectContent>
              </Select>

              {selectedIds.size > 0 && (
                <Badge variant="secondary" className="font-mono">
                  {selectedIds.size} selected
                </Badge>
              )}

              <ExportDialog accounts={accounts} />
            </div>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-green-500/20 bg-green-500/10 text-green-500 hover:bg-green-500/20"
                  onClick={() => handleBulkUpdate('confirmed')}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20"
                  onClick={() => handleBulkUpdate('false_positive')}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Mark False
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-blue-500/20 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                  onClick={() => handleBulkUpdate('deleted')}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Mark Deleted
                </Button>
              </div>
            )}
          </div>

          {/* Select All */}
          {activeAccounts.length > 0 && statusFilter !== 'false_positive' && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg border border-border/50 bg-card/30">
              <Checkbox
                checked={selectedIds.size === activeAccounts.length && activeAccounts.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">
                Select all {activeAccounts.length} account{activeAccounts.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Active Accounts List */}
          {statusFilter !== 'false_positive' && (
            <div className="space-y-4 mb-12">
              {activeAccounts.length === 0 ? (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="py-12 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      No accounts found with status "{statusFilter}"
                    </p>
                  </CardContent>
                </Card>
              ) : (
                activeAccounts.map((account) => (
                  <Card
                    key={account.id}
                    className={`border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all ${
                      selectedIds.has(account.id) ? 'ring-2 ring-primary/20' : ''
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Checkbox */}
                        <Checkbox
                          checked={selectedIds.has(account.id)}
                          onCheckedChange={() => handleToggleSelect(account.id)}
                          className="mt-1"
                        />

                        {/* Platform Icon */}
                        <PlatformIcon platformId={account.platform_id} size="lg" />

                        {/* Avatar */}
                        <Avatar className="w-14 h-14 border-2 border-border">
                          <AvatarImage src={account.avatar_url} alt={account.display_name} />
                          <AvatarFallback>
                            {account.display_name?.[0] || account.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
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

                            {/* Badges */}
                            <div className="flex flex-col items-end gap-2">
                              <Badge
                                variant="outline"
                                className={`font-mono ${
                                  account.confidence_score >= 90
                                    ? 'border-green-500/20 bg-green-500/10 text-green-500'
                                    : account.confidence_score >= 75
                                    ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-500'
                                    : 'border-blue-500/20 bg-blue-500/10 text-blue-500'
                                }`}
                              >
                                <Shield className="w-3 h-3 mr-1" />
                                {account.confidence_score}%
                              </Badge>

                              <Badge
                                variant="outline"
                                className={
                                  account.status === 'confirmed'
                                    ? 'border-green-500/20 bg-green-500/10 text-green-500'
                                    : account.status === 'deleted'
                                    ? 'border-blue-500/20 bg-blue-500/10 text-blue-500'
                                    : 'border-border'
                                }
                              >
                                {account.status}
                              </Badge>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(account.profile_url, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Profile
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* False Positives Section */}
          {(statusFilter === 'all' || statusFilter === 'false_positive') && falsePositives.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-muted-foreground">
                <ThumbsDown className="w-5 h-5 text-red-400" />
                False Positives
                <Badge variant="secondary" className="font-mono">{falsePositives.length}</Badge>
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                These accounts were marked as not belonging to you.
              </p>
              
              <div className="grid gap-3">
                {falsePositives.map((account) => (
                  <Card
                    key={account.id}
                    className="border-red-500/10 bg-red-500/5 backdrop-blur-sm opacity-60 hover:opacity-80 transition-all"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Platform Icon */}
                        <PlatformIcon platformId={account.platform_id} size="sm" />

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{account.display_name || account.username}</span>
                            <PlatformBadge 
                              platformId={account.platform_id} 
                              platformName={account.platform_name} 
                            />
                          </div>
                          <p className="text-sm text-muted-foreground">@{account.username}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Badge className="border-red-500/20 bg-red-500/10 text-red-400">
                            <XCircle className="w-3 h-3 mr-1" />
                            False Positive
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={async () => {
                              try {
                                await api.updateAccount(account.id, { status: 'pending' });
                                setAccounts(prev =>
                                  prev.map(acc =>
                                    acc.id === account.id ? { ...acc, status: 'pending' } : acc
                                  )
                                );
                                toast.success("Account restored");
                              } catch (error: any) {
                                toast.error(error.message || "Failed to restore account");
                              }
                            }}
                          >
                            Undo
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
