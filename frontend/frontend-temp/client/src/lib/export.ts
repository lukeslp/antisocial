import { Account } from "./api";

/**
 * Export accounts to CSV format
 */
export function exportToCSV(accounts: Account[], filename: string = "accounts.csv"): void {
  const headers = [
    "Platform",
    "Username",
    "Display Name",
    "Profile URL",
    "Status",
    "Confidence Score",
    "Bio",
    "Discovered At",
  ];

  const rows = accounts.map((account) => [
    account.platform_name,
    account.username,
    account.display_name || "",
    account.profile_url,
    account.status,
    account.confidence_score.toString(),
    (account.bio || "").replace(/"/g, '""'), // Escape quotes
    account.discovered_at || "",
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${cell}"`).join(",")
    ),
  ].join("\n");

  downloadFile(csvContent, filename, "text/csv");
}

/**
 * Export accounts to JSON format
 */
export function exportToJSON(accounts: Account[], filename: string = "accounts.json"): void {
  const exportData = {
    exported_at: new Date().toISOString(),
    total_accounts: accounts.length,
    accounts: accounts.map((account) => ({
      platform: account.platform_name,
      platform_id: account.platform_id,
      username: account.username,
      display_name: account.display_name,
      profile_url: account.profile_url,
      avatar_url: account.avatar_url,
      bio: account.bio,
      status: account.status,
      confidence_score: account.confidence_score,
      discovered_at: account.discovered_at,
    })),
  };

  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadFile(jsonContent, filename, "application/json");
}

/**
 * Helper function to trigger file download
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a summary report of accounts
 */
export function generateSummary(accounts: Account[]): {
  total: number;
  byStatus: Record<string, number>;
  byPlatform: Record<string, number>;
  avgConfidence: number;
} {
  const byStatus: Record<string, number> = {};
  const byPlatform: Record<string, number> = {};
  let totalConfidence = 0;

  accounts.forEach((account) => {
    // Count by status
    byStatus[account.status] = (byStatus[account.status] || 0) + 1;
    
    // Count by platform
    byPlatform[account.platform_name] = (byPlatform[account.platform_name] || 0) + 1;
    
    // Sum confidence
    totalConfidence += account.confidence_score;
  });

  return {
    total: accounts.length,
    byStatus,
    byPlatform,
    avgConfidence: accounts.length > 0 ? Math.round(totalConfidence / accounts.length) : 0,
  };
}
