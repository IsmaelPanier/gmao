import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Link } from "react-router-dom";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { Calendar, ClipboardList, MapPin } from "lucide-react";

export default function MyInterventions() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/interventions").then(r => setItems(r.data));
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayItems = items.filter(i => i.scheduled_date === today);
  const upcoming = items.filter(i => i.scheduled_date > today && i.status !== "terminee" && i.status !== "annulee");
  const inProgress = items.filter(i => i.status === "en_cours");

  return (
    <div className="space-y-6" data-testid="my-interventions-page">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Tableau de bord</div>
        <h1 className="font-display text-4xl font-bold tracking-tight">Mes interventions</h1>
      </div>

      <Section title="En cours" items={inProgress} accent="bg-amber-500" />
      <Section title="Aujourd'hui" items={todayItems} accent="bg-[#002FA7]" />
      <Section title="À venir" items={upcoming} accent="bg-zinc-700" />
    </div>
  );
}

function Section({ title, items, accent }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-1.5 h-6 ${accent}`} />
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        <span className="text-xs text-zinc-500">({items.length})</span>
      </div>
      {items.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-sm py-8 text-center text-zinc-400">
          <ClipboardList className="w-6 h-6 mx-auto mb-2" /> Aucune intervention
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(it => (
            <Link key={it.id} to={`/interventions/${it.id}`}
              data-testid={`my-intervention-${it.id}`}
              className="bg-white border border-zinc-200 hover:border-[#002FA7] rounded-sm p-4 transition-fast">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] font-bold text-zinc-500">{it.number}</span>
                <PriorityBadge priority={it.priority} />
              </div>
              <h3 className="font-semibold text-zinc-900">{it.type}</h3>
              <div className="text-sm text-zinc-600 mt-1">{it.client?.name}</div>
              <div className="text-xs text-zinc-500 mt-2 flex items-center gap-1"><MapPin className="w-3 h-3" /> {it.address}</div>
              <div className="text-xs text-zinc-500 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> {it.scheduled_date} à {it.scheduled_time}</div>
              <div className="mt-3"><StatusBadge status={it.status} /></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
