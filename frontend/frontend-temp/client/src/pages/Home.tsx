import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Home() {
  const [, setLocation] = useLocation();

  // Redirect to search page
  useEffect(() => {
    setLocation("/search");
  }, [setLocation]);

  return null;
}
