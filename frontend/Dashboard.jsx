import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  Activity, Clock, CheckCircle2, AlertTriangle, TrendingUp, Calendar as CalIcon
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { STATUS_LABELS } from "@/lib/api";

const STATUS_COLORS = {
  a_planifier: "#a1a1aa",
  planifiee: "#6366f1",
  en_cours: "#f59e0b",
  en_attente: "#fb923c",
  terminee: "#16a34a",
  annulee: "#e11d48",
};

function StatCard({ label, value, sub, icon: Icon, accent }) {
  return (
    <div className="bg-white border border-zinc-200 p-5 rounded-sm transition-fast hover:border-zinc-400">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 ${accent} flex items-center justify-center rounded-sm`}>
          <Icon className="w-4 h-4 text-white" strokeWidth={2.2} />
        </div>
      </div>
      <div className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">{label}</div>
      <div className="font-display text-4xl font-bold tracking-tight text-zinc-950 mt-1">{value}</div>
      {sub && <div className="text-xs text-zinc-500 mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/stats")
      .then((r) => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return <div className="text-zinc-500" data-testid="dashboard-loading">Chargement…</div>;
  }

  const statusData = stats.by_status.map(s => ({
    name: STATUS_LABELS[s.status] || s.status,
    value: s.count,
    color: STATUS_COLORS[s.status] || "#a1a1aa",
  }));

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Vue d'ensemble</div>
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-zinc-950 mt-1">
          Bonjour, {user.name.split(" ")[0]}.
        </h1>
        <p className="text-zinc-600 mt-2">Voici l'état de vos opérations terrain en temps réel.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Aujourd'hui" value={stats.today} sub="Interventions planifiées" icon={CalIcon} accent="bg-[#002FA7]" />
        <StatCard label="En cours" value={stats.in_progress} sub="Sur le terrain" icon={Activity} accent="bg-amber-500" />
        <StatCard label="Terminées" value={stats.completed} sub="Total" icon={CheckCircle2} accent="bg-emerald-600" />
        <StatCard label="À traiter" value={stats.pending} sub="Planifiées / À planifier" icon={AlertTriangle} accent="bg-rose-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 p-5 rounded-sm">
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">Temps moyen d'intervention</div>
          <div className="font-display text-4xl font-bold tracking-tight mt-2 flex items-baseline gap-2">
            {stats.avg_duration}<span className="text-base font-medium text-zinc-500">min</span>
          </div>
          <div className="mt-3 text-sm text-zinc-600 flex items-center gap-2"><Clock className="w-4 h-4" /> Sur interventions clôturées</div>
        </div>
        <div className="bg-white border border-zinc-200 p-5 rounded-sm">
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">Taux de résolution</div>
          <div className="font-display text-4xl font-bold tracking-tight mt-2">{stats.resolution_rate}%</div>
          <div className="w-full h-2 bg-zinc-100 rounded-sm mt-3 overflow-hidden">
            <div className="h-full bg-[#002FA7]" style={{ width: `${stats.resolution_rate}%` }} />
          </div>
          <div className="mt-2 text-sm text-zinc-600 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> {stats.completed}/{stats.total} interventions</div>
        </div>
        <div className="bg-white border border-zinc-200 p-5 rounded-sm">
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500">Répartition par statut</div>
          <div className="h-32 mt-2">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={28} outerRadius={50} paddingAngle={2}>
                  {statusData.map((s, i) => <Cell key={i} fill={s.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs">
            {statusData.map((s) => (
              <span key={s.name} className="inline-flex items-center gap-1">
                <span className="w-2 h-2 inline-block" style={{ background: s.color }} />{s.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-zinc-200 p-5 rounded-sm">
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 mb-3">Interventions par mois</div>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={stats.by_month}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                <XAxis dataKey="month" stroke="#52525B" fontSize={11} />
                <YAxis stroke="#52525B" fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#002FA7" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white border border-zinc-200 p-5 rounded-sm">
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 mb-3">Productivité par technicien</div>
          {stats.by_technician.length === 0 ? (
            <div className="text-sm text-zinc-500 py-12 text-center">Aucune donnée</div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={stats.by_technician} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" horizontal={false} />
                  <XAxis type="number" stroke="#52525B" fontSize={11} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#52525B" fontSize={11} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#16a34a" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
