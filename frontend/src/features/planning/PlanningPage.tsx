import React from "react";
import { Calendar } from "lucide-react";

export default function PlanningPage() {
  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-[80vh]">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Organisation</div>
        <h1 className="text-3xl font-bold tracking-tight">Planning</h1>
      </div>
      
      <div className="flex-1 bg-card border border-border rounded-lg flex flex-col items-center justify-center text-center p-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
          <Calendar className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Vue Calendrier Interactive</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          La vue calendrier avec glisser-déposer (drag-and-drop) sera disponible dans la prochaine mise à jour de GMAO Pro. 
          Vous pourrez planifier vos interventions directement sur la timeline.
        </p>
      </div>
    </div>
  );
}
