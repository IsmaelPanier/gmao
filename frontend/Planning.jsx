import React, { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import { Link } from "react-router-dom";

function startOfWeek(d) {
  const n = new Date(d);
  const day = (n.getDay() + 6) % 7; // Monday=0
  n.setDate(n.getDate() - day);
  n.setHours(0, 0, 0, 0);
  return n;
}
function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function fmtDate(d) { return d.toISOString().slice(0, 10); }

const FR_DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const FR_MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

export default function Planning() {
  const [view, setView] = useState("week");
  const [anchor, setAnchor] = useState(new Date());
  const [items, setItems] = useState([]);
  const [techs, setTechs] = useState([]);
  const [techFilter, setTechFilter] = useState("all");

  const range = useMemo(() => {
    if (view === "day") {
      const d = fmtDate(anchor);
      return { from: d, to: d, days: [new Date(anchor)] };
    }
    if (view === "week") {
      const s = startOfWeek(anchor);
      const e = addDays(s, 6);
      const days = Array.from({ length: 7 }, (_, i) => addDays(s, i));
      return { from: fmtDate(s), to: fmtDate(e), days };
    }
    // month
    const s = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const e = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    const gridStart = startOfWeek(s);
    const days = [];
    for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i));
    return { from: fmtDate(s), to: fmtDate(e), days };
  }, [view, anchor]);

  useEffect(() => {
    api.get("/users").then(r => setTechs(r.data.filter(u => u.role === "technicien")));
  }, []);

  useEffect(() => {
    const params = { date_from: range.from, date_to: range.to };
    if (techFilter !== "all") params.technician_id = techFilter;
    api.get("/interventions", { params }).then(r => setItems(r.data));
  }, [range.from, range.to, techFilter]);

  const onDrop = async (e, day) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("intervention-id");
    if (!id) return;
    await api.put(`/interventions/${id}`, { scheduled_date: fmtDate(day) });
    const params = { date_from: range.from, date_to: range.to };
    if (techFilter !== "all") params.technician_id = techFilter;
    const r = await api.get("/interventions", { params });
    setItems(r.data);
  };

  const itemsByDay = useMemo(() => {
    const map = {};
    for (const it of items) {
      (map[it.scheduled_date] ||= []).push(it);
    }
    return map;
  }, [items]);

  const move = (delta) => {
    const d = new Date(anchor);
    if (view === "day") d.setDate(d.getDate() + delta);
    else if (view === "week") d.setDate(d.getDate() + delta * 7);
    else d.setMonth(d.getMonth() + delta);
    setAnchor(d);
  };

  const title = view === "month"
    ? `${FR_MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`
    : view === "day"
      ? anchor.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      : `Semaine du ${startOfWeek(anchor).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;

  return (
    <div className="space-y-6" data-testid="planning-page">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Planification</div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Planning</h1>
          <p className="text-zinc-600 mt-1 capitalize">{title}</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={techFilter} onValueChange={setTechFilter}>
            <SelectTrigger className="rounded-sm w-48" data-testid="planning-tech-filter"><SelectValue placeholder="Technicien" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les techniciens</SelectItem>
              {techs.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="inline-flex border border-zinc-300 rounded-sm bg-white">
            {["day", "week", "month"].map(v => (
              <button key={v} onClick={() => setView(v)}
                data-testid={`view-${v}`}
                className={`px-3 py-2 text-sm transition-fast ${view === v ? "bg-[#002FA7] text-white" : "text-zinc-700 hover:bg-zinc-50"}`}>
                {v === "day" ? "Jour" : v === "week" ? "Semaine" : "Mois"}
              </button>
            ))}
          </div>
          <div className="inline-flex gap-1">
            <Button variant="outline" size="icon" onClick={() => move(-1)} data-testid="planning-prev" className="rounded-sm"><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" onClick={() => setAnchor(new Date())} className="rounded-sm">Aujourd'hui</Button>
            <Button variant="outline" size="icon" onClick={() => move(1)} data-testid="planning-next" className="rounded-sm"><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      {view === "day" && (
        <div className="bg-white border border-zinc-200 rounded-sm">
          <DayColumn day={range.days[0]} items={itemsByDay[fmtDate(range.days[0])] || []} onDrop={onDrop} expanded />
        </div>
      )}

      {view === "week" && (
        <div className="grid grid-cols-1 md:grid-cols-7 border border-zinc-200 rounded-sm overflow-hidden bg-white">
          {range.days.map((d, i) => (
            <DayColumn key={i} day={d} items={itemsByDay[fmtDate(d)] || []} onDrop={onDrop} />
          ))}
        </div>
      )}

      {view === "month" && (
        <div className="bg-white border border-zinc-200 rounded-sm overflow-hidden">
          <div className="grid grid-cols-7 bg-zinc-50 border-b border-zinc-200">
            {FR_DAYS.map(d => <div key={d} className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-500">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {range.days.map((d, i) => {
              const inMonth = d.getMonth() === anchor.getMonth();
              const dayItems = itemsByDay[fmtDate(d)] || [];
              return (
                <div key={i}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => onDrop(e, d)}
                  className={`min-h-[110px] border-b border-r border-zinc-100 p-2 ${inMonth ? "bg-white" : "bg-zinc-50/50 text-zinc-400"}`}>
                  <div className="text-xs font-semibold mb-1">{d.getDate()}</div>
                  <div className="space-y-1">
                    {dayItems.slice(0, 3).map(it => (
                      <Link key={it.id} to={`/interventions/${it.id}`}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("intervention-id", it.id)}
                        className="block text-[10px] px-1.5 py-1 rounded-sm border border-[#002FA7]/30 bg-[#002FA7]/5 hover:bg-[#002FA7]/10 truncate cursor-grab"
                        data-testid={`cal-event-${it.id}`}>
                        <span className="font-mono font-semibold">{it.scheduled_time}</span> {it.client?.name}
                      </Link>
                    ))}
                    {dayItems.length > 3 && <div className="text-[10px] text-zinc-500">+{dayItems.length - 3}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DayColumn({ day, items, onDrop, expanded }) {
  const isToday = fmtDate(day) === fmtDate(new Date());
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, day)}
      className={`border-r border-zinc-200 last:border-r-0 ${expanded ? "min-h-[400px]" : "min-h-[240px]"}`}
    >
      <div className={`px-3 py-2 border-b border-zinc-200 ${isToday ? "bg-[#002FA7] text-white" : "bg-zinc-50"}`}>
        <div className="text-xs font-bold uppercase tracking-wider opacity-80">
          {day.toLocaleDateString("fr-FR", { weekday: "short" })}
        </div>
        <div className="font-display text-xl font-bold">{day.getDate()}</div>
      </div>
      <div className="p-2 space-y-2">
        {items.length === 0 && <div className="text-xs text-zinc-400 text-center py-4">Aucune</div>}
        {items.sort((a, b) => (a.scheduled_time || "").localeCompare(b.scheduled_time || "")).map(it => (
          <Link key={it.id} to={`/interventions/${it.id}`}
            draggable
            onDragStart={(e) => e.dataTransfer.setData("intervention-id", it.id)}
            data-testid={`cal-event-${it.id}`}
            className="block border border-zinc-200 hover:border-[#002FA7] rounded-sm p-2 bg-white transition-fast cursor-grab">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="font-mono text-[10px] font-bold">{it.scheduled_time}</span>
              <PriorityBadge priority={it.priority} />
            </div>
            <div className="text-xs font-semibold truncate">{it.type}</div>
            <div className="text-[11px] text-zinc-500 truncate">{it.client?.name}</div>
            <div className="mt-1"><StatusBadge status={it.status} /></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
