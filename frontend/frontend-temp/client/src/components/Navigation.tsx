import { FileText } from "lucide-react";
import { Link } from "wouter";

export default function Navigation() {
  return (
    <nav className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">Social Scout</span>
          </Link>

          {/* Tagline */}
          <div className="text-sm text-muted-foreground hidden md:block">
            Track down those accounts you forgot you made
          </div>
        </div>
      </div>
    </nav>
  );
}
