import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileJson, FileSpreadsheet, FileText } from "lucide-react";
import { Account } from "@/lib/api";
import { exportToCSV, exportToJSON, generateSummary } from "@/lib/export";
import { toast } from "sonner";

interface ExportDialogProps {
  accounts: Account[];
  trigger?: React.ReactNode;
}

export function ExportDialog({ accounts, trigger }: ExportDialogProps) {
  const summary = generateSummary(accounts);

  const handleExportCSV = () => {
    try {
      const timestamp = new Date().toISOString().split("T")[0];
      exportToCSV(accounts, `account-discovery-${timestamp}.csv`);
      toast.success("Exported to CSV successfully");
    } catch (error) {
      toast.error("Failed to export CSV");
    }
  };

  const handleExportJSON = () => {
    try {
      const timestamp = new Date().toISOString().split("T")[0];
      exportToJSON(accounts, `account-discovery-${timestamp}.json`);
      toast.success("Exported to JSON successfully");
    } catch (error) {
      toast.error("Failed to export JSON");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Accounts</DialogTitle>
          <DialogDescription>
            Download your discovered accounts in your preferred format.
          </DialogDescription>
        </DialogHeader>

        {/* Summary */}
        <div className="p-4 rounded-lg border border-border/50 bg-card/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Accounts</span>
            <Badge variant="secondary" className="font-mono">{summary.total}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Avg Confidence</span>
            <Badge variant="secondary" className="font-mono">{summary.avgConfidence}%</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Platforms</span>
            <Badge variant="secondary" className="font-mono">
              {Object.keys(summary.byPlatform).length}
            </Badge>
          </div>
        </div>

        {/* Export Options */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4"
            onClick={handleExportCSV}
            disabled={accounts.length === 0}
          >
            <FileSpreadsheet className="w-5 h-5 mr-3 text-green-500" />
            <div className="text-left">
              <div className="font-medium">Export as CSV</div>
              <div className="text-xs text-muted-foreground">
                Spreadsheet format for Excel, Google Sheets
              </div>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4"
            onClick={handleExportJSON}
            disabled={accounts.length === 0}
          >
            <FileJson className="w-5 h-5 mr-3 text-blue-500" />
            <div className="text-left">
              <div className="font-medium">Export as JSON</div>
              <div className="text-xs text-muted-foreground">
                Structured data for developers and tools
              </div>
            </div>
          </Button>
        </div>

        {accounts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            No accounts to export. Run a search first.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ExportDialog;
