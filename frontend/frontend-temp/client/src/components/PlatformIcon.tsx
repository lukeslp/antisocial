import { 
  Github, 
  Twitter, 
  Instagram, 
  Youtube, 
  Twitch,
  Linkedin,
  Facebook,
  Music,
  Gamepad2,
  Code,
  Palette,
  Video,
  BookOpen,
  Camera,
  MessageCircle,
  Globe,
  Key,
  User,
  Rss,
  Share2,
  type LucideProps,
} from "lucide-react";
import { forwardRef } from "react";

// Platform icon mapping
const platformIcons: Record<string, React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>> = {
  github: Github,
  twitter: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  twitch: Twitch,
  linkedin: Linkedin,
  facebook: Facebook,
  soundcloud: Music,
  steam: Gamepad2,
  gitlab: Code,
  devto: Code,
  dribbble: Palette,
  behance: Palette,
  vimeo: Video,
  medium: BookOpen,
  pinterest: Camera,
  reddit: MessageCircle,
  mastodon: Share2,
  bluesky: MessageCircle,
  tumblr: Rss,
  keybase: Key,
  gravatar: User,
  tiktok: Video,
  patreon: User,
};

// Platform brand colors (Tailwind-compatible)
const platformColorClasses: Record<string, { bg: string; border: string; text: string }> = {
  github: { bg: "bg-gray-800/20", border: "border-gray-600/40", text: "text-gray-300" },
  twitter: { bg: "bg-sky-500/20", border: "border-sky-500/40", text: "text-sky-400" },
  instagram: { bg: "bg-pink-500/20", border: "border-pink-500/40", text: "text-pink-400" },
  youtube: { bg: "bg-red-500/20", border: "border-red-500/40", text: "text-red-400" },
  twitch: { bg: "bg-purple-500/20", border: "border-purple-500/40", text: "text-purple-400" },
  linkedin: { bg: "bg-blue-600/20", border: "border-blue-600/40", text: "text-blue-400" },
  facebook: { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-400" },
  soundcloud: { bg: "bg-orange-500/20", border: "border-orange-500/40", text: "text-orange-400" },
  steam: { bg: "bg-slate-700/20", border: "border-slate-600/40", text: "text-slate-300" },
  gitlab: { bg: "bg-orange-600/20", border: "border-orange-600/40", text: "text-orange-400" },
  devto: { bg: "bg-gray-800/20", border: "border-gray-600/40", text: "text-gray-300" },
  dribbble: { bg: "bg-pink-400/20", border: "border-pink-400/40", text: "text-pink-400" },
  behance: { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-400" },
  vimeo: { bg: "bg-cyan-500/20", border: "border-cyan-500/40", text: "text-cyan-400" },
  medium: { bg: "bg-gray-800/20", border: "border-gray-600/40", text: "text-gray-300" },
  pinterest: { bg: "bg-red-600/20", border: "border-red-600/40", text: "text-red-400" },
  reddit: { bg: "bg-orange-600/20", border: "border-orange-600/40", text: "text-orange-400" },
  mastodon: { bg: "bg-indigo-500/20", border: "border-indigo-500/40", text: "text-indigo-400" },
  bluesky: { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-400" },
  tumblr: { bg: "bg-slate-600/20", border: "border-slate-600/40", text: "text-slate-400" },
  keybase: { bg: "bg-blue-400/20", border: "border-blue-400/40", text: "text-blue-400" },
  gravatar: { bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-400" },
  tiktok: { bg: "bg-gray-800/20", border: "border-gray-600/40", text: "text-gray-300" },
  patreon: { bg: "bg-red-500/20", border: "border-red-500/40", text: "text-red-400" },
};

const defaultColors = { bg: "bg-gray-500/20", border: "border-gray-500/40", text: "text-gray-400" };

interface PlatformIconProps {
  platformId: string;
  className?: string;
  showBackground?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
}

export function PlatformIcon({ 
  platformId, 
  className = "", 
  showBackground = true,
  size = "md" 
}: PlatformIconProps) {
  const Icon = platformIcons[platformId.toLowerCase()] || Globe;
  const colors = platformColorClasses[platformId.toLowerCase()] || defaultColors;
  
  const sizeClasses = {
    xs: "w-5 h-5",
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };
  
  const iconSizeClasses = {
    xs: "w-2.5 h-2.5",
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  if (!showBackground) {
    return <Icon className={`${iconSizeClasses[size]} ${colors.text} ${className}`} />;
  }

  return (
    <div 
      className={`${sizeClasses[size]} ${colors.bg} ${colors.border} border rounded-lg flex items-center justify-center ${className}`}
    >
      <Icon className={`${iconSizeClasses[size]} ${colors.text}`} />
    </div>
  );
}

// Platform name with icon inline
interface PlatformBadgeProps {
  platformId: string;
  platformName: string;
  className?: string;
}

export function PlatformBadge({ platformId, platformName, className = "" }: PlatformBadgeProps) {
  const Icon = platformIcons[platformId.toLowerCase()] || Globe;
  const colors = platformColorClasses[platformId.toLowerCase()] || defaultColors;

  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium ${colors.bg} ${colors.border} ${colors.text} border ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{platformName}</span>
    </div>
  );
}

export default PlatformIcon;
