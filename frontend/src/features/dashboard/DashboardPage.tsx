import React from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardService from "@/services/dashboard.service";
import { useAuth } from "@/features/auth/AuthContext";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/Badges";
import { formatDate, formatDuration } from "@/lib/utils";
import { STATUS_CHART_COLORS, CHART_COLORS } from "@/lib/constants";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Activity, CheckCircle2, AlertTriangle, Calendar, Clock, TrendingUp, Users, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
      </div>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      <div className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground mt-1">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} />;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: DashboardService.getStats,
    staleTime: 30_000,
  });

  if (isLoading || !stats) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-48 mt-2" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  // ==== VUE TECHNICIEN ====
  if (user?.role === "technician") {
    return (
      <div className="space-y-8 animate-fade-in" data-testid="dashboard-technician">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Espace Technicien</div>
          <h1 className="text-4xl font-bold tracking-tight mt-1">Bonjour, {user.name.split(" ")[0]}.</h1>
          <p className="text-muted-foreground mt-2">{formatDate(new Date())} — Prêt pour votre journée sur le terrain ?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to={`/interventions?date=${new Date().toISOString().slice(0, 10)}`} className="block transition-transform hover:scale-[1.02]">
            <StatCard label="Aujourd'hui" value={stats.today} sub="Missions planifiées" icon={Calendar} color="bg-primary" />
          </Link>
          <Link to="/interventions?status=in_progress" className="block transition-transform hover:scale-[1.02]">
            <StatCard label="En cours" value={stats.in_progress} sub="Missions actives" icon={Activity} color="bg-amber-500" />
          </Link>
          <Link to="/interventions?status=pending" className="block transition-transform hover:scale-[1.02]">
            <StatCard label="À accepter" value={stats.pending} sub="Nouvelles assignations" icon={AlertTriangle} color="bg-rose-600" />
          </Link>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Vos prochaines missions
              </div>
              <Link to="/interventions" className="text-xs text-primary hover:underline flex items-center gap-1">
                Voir toutes <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="divide-y divide-border">
              {stats.recent.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-sm">Aucune mission planifiée</div>
              ) : (
                stats.recent.map((item) => (
                  <Link
                    key={item.id}
                    to={`/interventions/${item.id}`}
                    className="flex items-center justify-between gap-4 py-4 hover:bg-muted/30 -mx-6 px-6 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-muted-foreground">{item.number}</span>
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="text-sm font-semibold truncate">{item.type}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{item.client.firstName} {item.client.lastName} — {item.address}</div>
                    </div>
                    <Button variant="secondary" size="sm">Consulter</Button>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==== VUE MANAGER / ADMIN ====
  const pieData = stats.by_status.map((s) => ({
    name: s.status,
    value: s.count,
    color: STATUS_CHART_COLORS[s.status],
  })).filter((d) => d.value > 0);

  return (
    <div className="space-y-8 animate-fade-in" data-testid="dashboard-page">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Vue d'ensemble</div>
        <h1 className="text-4xl font-bold tracking-tight mt-1">Bonjour, {user?.name.split(" ")[0]}.</h1>
        <p className="text-muted-foreground mt-2">{formatDate(new Date())} — Voici l'état de vos opérations terrain.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to={`/interventions?date=${new Date().toISOString().slice(0, 10)}`} className="block transition-transform hover:scale-[1.02]">
          <StatCard label="Aujourd'hui" value={stats.today} sub="Interventions planifiées" icon={Calendar} color="bg-primary" />
        </Link>
        <Link to="/interventions?status=in_progress" className="block transition-transform hover:scale-[1.02]">
          <StatCard label="En cours" value={stats.in_progress} sub="Sur le terrain" icon={Activity} color="bg-amber-500" />
        </Link>
        <Link to="/interventions?status=completed" className="block transition-transform hover:scale-[1.02]">
          <StatCard label="Terminées" value={stats.completed} sub="Total" icon={CheckCircle2} color="bg-emerald-600" />
        </Link>
        <Link to="/interventions?status=pending" className="block transition-transform hover:scale-[1.02]">
          <StatCard label="À traiter" value={stats.pending} sub="Créées / Assignées / Attente" icon={AlertTriangle} color="bg-rose-600" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Temps moyen d'intervention</div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-bold">{stats.avg_duration}</span>
              <span className="text-muted-foreground font-medium">min</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-3">
              <Clock className="w-4 h-4" />
              <span>Sur interventions clôturées</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Taux de résolution</div>
            <div className="text-4xl font-bold mt-2">{stats.resolution_rate}%</div>
            <div className="w-full h-2 bg-muted rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${stats.resolution_rate}%` }}
              />
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
              <TrendingUp className="w-4 h-4" />
              <span>{stats.completed}/{stats.total} interventions</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground mb-2">Répartition par statut</div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={30} outerRadius={52} paddingAngle={2}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val, name) => [val, name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs">
              {pieData.map((s) => (
                <span key={s.name} className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  <span className="text-muted-foreground capitalize">{s.name.replace("_", " ")}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-0">
            <div className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Productivité par technicien</div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-56">
              {stats.by_technician.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Aucune donnée disponible</div>
              ) : (
                <ResponsiveContainer>
                  <BarChart data={stats.by_technician} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={110} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} cursor={{fill: 'transparent'}} />
                    <Bar 
                      dataKey="count" 
                      name="Terminées" 
                      fill={CHART_COLORS.success} 
                      radius={[0, 4, 4, 0]} 
                      onClick={(data) => {
                        if (data && data.id) {
                          navigate(`/interventions?technicianId=${data.id}&date=${new Date().toISOString().slice(0, 10)}`);
                        }
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-0">
            <div className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground">Charge de travail (Equipe)</div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-56">
              {!stats.team_workload || stats.team_workload.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">Aucune donnée disponible</div>
              ) : (
                <ResponsiveContainer>
                  <BarChart data={stats.team_workload} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={110} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} cursor={{fill: 'transparent'}} />
                    <Bar 
                      dataKey="count" 
                      name="Missions actives" 
                      fill={CHART_COLORS.warning} 
                      radius={[0, 4, 4, 0]} 
                      onClick={(data) => {
                        if (data && data.id) {
                          navigate(`/interventions?technicianId=${data.id}&date=${new Date().toISOString().slice(0, 10)}`);
                        }
                      }}
                      style={{ cursor: "pointer" }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Activité récente
            </div>
            <Link to="/interventions" className="text-xs text-primary hover:underline flex items-center gap-1">
              Voir tout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-border">
            {stats.recent.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground text-sm">Aucune activité récente</div>
            ) : (
              stats.recent.map((item) => (
                <Link
                  key={item.id}
                  to={`/interventions/${item.id}`}
                  className="flex items-center gap-4 py-3 hover:bg-muted/30 -mx-6 px-6 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-xs text-muted-foreground">{item.number}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="text-sm font-medium truncate">{item.type}</div>
                    <div className="text-xs text-muted-foreground">{item.client.firstName} {item.client.lastName}</div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(item.updatedAt)}</div>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
