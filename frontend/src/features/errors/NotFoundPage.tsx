import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, AlertTriangle } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-8">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-muted-foreground" />
      </div>
      <h1 className="text-7xl font-black tracking-tight mb-2">404</h1>
      <h2 className="text-2xl font-semibold mb-3">Page introuvable</h2>
      <p className="text-muted-foreground max-w-sm mb-8">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Button asChild>
        <Link to="/dashboard" className="gap-2">
          <Home className="w-4 h-4" />
          Retour au tableau de bord
        </Link>
      </Button>
    </div>
  );
}
