import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ExternalLink, Trash2, AlertTriangle, Clock, Shield } from "lucide-react";
import { PlatformIcon } from "./PlatformIcon";

interface DeletionStep {
  step: number;
  title: string;
  description: string;
}

interface DeletionGuide {
  platformId: string;
  platformName: string;
  difficulty: "easy" | "medium" | "hard";
  estimatedTime: string;
  deletionUrl: string;
  notes?: string;
  steps: DeletionStep[];
}

// Platform-specific deletion guides
const deletionGuides: Record<string, DeletionGuide> = {
  github: {
    platformId: "github",
    platformName: "GitHub",
    difficulty: "easy",
    estimatedTime: "5 minutes",
    deletionUrl: "https://github.com/settings/admin",
    steps: [
      { step: 1, title: "Go to Settings", description: "Click your profile photo, then click Settings." },
      { step: 2, title: "Navigate to Account", description: "In the left sidebar, click Account." },
      { step: 3, title: "Delete Account", description: "Scroll to 'Delete account' and click 'Delete your account'." },
      { step: 4, title: "Confirm", description: "Read the warnings, type your username, and confirm deletion." },
    ],
    notes: "Your repositories, gists, and contributions will be permanently deleted. Consider downloading your data first.",
  },
  twitter: {
    platformId: "twitter",
    platformName: "Twitter/X",
    difficulty: "easy",
    estimatedTime: "5 minutes",
    deletionUrl: "https://twitter.com/settings/deactivate",
    steps: [
      { step: 1, title: "Go to Settings", description: "Click More > Settings and Support > Settings and privacy." },
      { step: 2, title: "Your Account", description: "Click 'Your account' then 'Deactivate your account'." },
      { step: 3, title: "Deactivate", description: "Review the information and click 'Deactivate'." },
      { step: 4, title: "Confirm", description: "Enter your password to confirm. Account deleted after 30 days." },
    ],
    notes: "Your account is deactivated immediately but not deleted for 30 days. Log back in to cancel.",
  },
  instagram: {
    platformId: "instagram",
    platformName: "Instagram",
    difficulty: "medium",
    estimatedTime: "10 minutes",
    deletionUrl: "https://www.instagram.com/accounts/remove/request/permanent/",
    steps: [
      { step: 1, title: "Log In", description: "Log into Instagram from a web browser (not the app)." },
      { step: 2, title: "Delete Page", description: "Go to the Delete Your Account page." },
      { step: 3, title: "Select Reason", description: "Select a reason for deletion from the dropdown." },
      { step: 4, title: "Confirm", description: "Re-enter your password and click 'Permanently delete my account'." },
    ],
    notes: "You can also temporarily disable your account instead of permanent deletion.",
  },
  facebook: {
    platformId: "facebook",
    platformName: "Facebook",
    difficulty: "medium",
    estimatedTime: "15 minutes",
    deletionUrl: "https://www.facebook.com/help/delete_account",
    steps: [
      { step: 1, title: "Settings", description: "Click your profile photo > Settings & privacy > Settings." },
      { step: 2, title: "Your Information", description: "Click 'Your Facebook Information' in the left menu." },
      { step: 3, title: "Deactivation", description: "Click 'Deactivation and Deletion', select 'Delete Account'." },
      { step: 4, title: "Confirm", description: "Click Continue, enter password, and confirm deletion." },
    ],
    notes: "Facebook keeps your data for 30 days. Download your data first via 'Download Your Information'.",
  },
  reddit: {
    platformId: "reddit",
    platformName: "Reddit",
    difficulty: "easy",
    estimatedTime: "5 minutes",
    deletionUrl: "https://www.reddit.com/settings/account",
    steps: [
      { step: 1, title: "Settings", description: "Go to User Settings > Account." },
      { step: 2, title: "Delete Account", description: "Scroll to bottom and click 'Delete Account'." },
      { step: 3, title: "Verify", description: "Enter your username and password." },
      { step: 4, title: "Confirm", description: "Check the box and click 'Delete'." },
    ],
    notes: "Your posts and comments will remain but show [deleted] as the author.",
  },
  linkedin: {
    platformId: "linkedin",
    platformName: "LinkedIn",
    difficulty: "medium",
    estimatedTime: "10 minutes",
    deletionUrl: "https://www.linkedin.com/psettings/account-management",
    steps: [
      { step: 1, title: "Settings", description: "Click your photo > Settings & Privacy." },
      { step: 2, title: "Account Management", description: "Click 'Account management' under Account preferences." },
      { step: 3, title: "Close Account", description: "Click 'Close account' and select a reason." },
      { step: 4, title: "Confirm", description: "Enter your password and click 'Close account'." },
    ],
    notes: "Consider downloading your data and connections list before deletion.",
  },
  steam: {
    platformId: "steam",
    platformName: "Steam",
    difficulty: "hard",
    estimatedTime: "30+ minutes",
    deletionUrl: "https://help.steampowered.com/en/wizard/HelpDeleteAccount",
    steps: [
      { step: 1, title: "Support", description: "Go to Steam Support and log in." },
      { step: 2, title: "Account", description: "Click 'My Account' then 'Data Related to Your Steam Account'." },
      { step: 3, title: "Delete", description: "Select 'Delete my Steam account' and follow prompts." },
      { step: 4, title: "Wait", description: "Steam will email you. Confirm via email link." },
    ],
    notes: "All games, wallet funds, and items will be permanently lost. This cannot be undone.",
  },
  tiktok: {
    platformId: "tiktok",
    platformName: "TikTok",
    difficulty: "easy",
    estimatedTime: "5 minutes",
    deletionUrl: "https://www.tiktok.com/setting",
    steps: [
      { step: 1, title: "Settings", description: "Go to Profile > Menu > Settings and privacy." },
      { step: 2, title: "Account", description: "Tap 'Manage account'." },
      { step: 3, title: "Delete", description: "Tap 'Delete account' at the bottom." },
      { step: 4, title: "Confirm", description: "Follow the prompts to verify and confirm deletion." },
    ],
    notes: "Account is deactivated for 30 days before permanent deletion.",
  },
  youtube: {
    platformId: "youtube",
    platformName: "YouTube",
    difficulty: "medium",
    estimatedTime: "10 minutes",
    deletionUrl: "https://www.youtube.com/account_advanced",
    steps: [
      { step: 1, title: "Settings", description: "Click your profile > Settings > Advanced settings." },
      { step: 2, title: "Delete Channel", description: "Click 'Delete channel' under the channel name." },
      { step: 3, title: "Verify", description: "Sign in again to verify identity." },
      { step: 4, title: "Confirm", description: "Select 'I want to permanently delete my content' and confirm." },
    ],
    notes: "This only deletes your YouTube channel, not your Google account.",
  },
  twitch: {
    platformId: "twitch",
    platformName: "Twitch",
    difficulty: "easy",
    estimatedTime: "5 minutes",
    deletionUrl: "https://www.twitch.tv/settings/security",
    steps: [
      { step: 1, title: "Settings", description: "Go to Settings > Security and Privacy." },
      { step: 2, title: "Delete", description: "Scroll to 'Delete Account' section." },
      { step: 3, title: "Disable", description: "First disable your account, then delete." },
      { step: 4, title: "Confirm", description: "Enter your password and confirm deletion." },
    ],
    notes: "Your username will become available to others after deletion.",
  },
};

// Default guide for platforms without specific instructions
const defaultGuide: Omit<DeletionGuide, "platformId" | "platformName"> = {
  difficulty: "medium",
  estimatedTime: "10-15 minutes",
  deletionUrl: "",
  steps: [
    { step: 1, title: "Find Settings", description: "Look for a Settings, Account, or Profile menu." },
    { step: 2, title: "Account Settings", description: "Navigate to Account or Privacy settings." },
    { step: 3, title: "Delete Option", description: "Look for 'Delete Account', 'Close Account', or 'Deactivate'." },
    { step: 4, title: "Confirm", description: "Follow the prompts to verify and confirm deletion." },
  ],
  notes: "If you can't find deletion options, try searching '[platform name] delete account' or contact their support.",
};

interface DeletionGuideDialogProps {
  platformId: string;
  platformName: string;
  profileUrl: string;
  trigger?: React.ReactNode;
}

export function DeletionGuideDialog({
  platformId,
  platformName,
  profileUrl,
  trigger,
}: DeletionGuideDialogProps) {
  const guide = deletionGuides[platformId.toLowerCase()] || {
    ...defaultGuide,
    platformId,
    platformName,
    deletionUrl: profileUrl,
  };

  const difficultyColors = {
    easy: "text-green-500 bg-green-500/10 border-green-500/20",
    medium: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20",
    hard: "text-red-500 bg-red-500/10 border-red-500/20",
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            How to Delete
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <PlatformIcon platformId={platformId} size="md" />
            <div>
              <DialogTitle>Delete {platformName} Account</DialogTitle>
              <DialogDescription>
                Step-by-step guide to remove your account
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Info badges */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${difficultyColors[guide.difficulty]}`}>
            <Shield className="w-3 h-3" />
            {guide.difficulty.charAt(0).toUpperCase() + guide.difficulty.slice(1)}
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border border-border bg-card">
            <Clock className="w-3 h-3" />
            {guide.estimatedTime}
          </div>
        </div>

        {/* Steps */}
        <ScrollArea className="max-h-[300px] pr-4">
          <div className="space-y-4">
            {guide.steps.map((step) => (
              <div key={step.step} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                  {step.step}
                </div>
                <div>
                  <h4 className="font-medium text-sm">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Notes */}
        {guide.notes && (
          <div className="flex gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-200">{guide.notes}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-2">
          {guide.deletionUrl && (
            <Button
              className="flex-1"
              onClick={() => window.open(guide.deletionUrl, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Go to Deletion Page
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => window.open(profileUrl, "_blank")}
          >
            View Profile
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DeletionGuideDialog;
