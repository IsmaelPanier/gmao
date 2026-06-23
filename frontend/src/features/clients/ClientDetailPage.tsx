import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ClientsService from "@/services/clients.service";
import { StatusBadge, PriorityBadge } from "@/components/shared/Badges";
import { formatDate } from "@/lib/utils";
import { ArrowLeft, Building2, User, Phone, Mail, MapPin, ClipboardList, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: () => ClientsService.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-40 skeleton rounded" />
        <div className="h-64 skeleton rounded-lg" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20">
        <div className="text-muted-foreground mb-4">Client introuvable</div>
        <Link to="/clients" className="text-primary hover:underline">Retour à la liste</Link>
      </div>
    );
  }

  const interventions = (client as any).interventions || [];

  return (
    <div className="space-y-6 max-w-5xl animate-fade-in" data-testid="client-detail-page">
      <div className="flex items-center justify-between">
        <Link to="/clients" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour aux clients
        </Link>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={client.type === "ENTREPRISE" ? "default" : "secondary"}>
                {client.type === "ENTREPRISE" ? "Entreprise" : "Particulier"}
              </Badge>
              {!client.isActive && <Badge variant="destructive">Inactif</Badge>}
            </div>
            <h1 className="text-3xl font-bold">
              {client.type === "ENTREPRISE" && client.companyName ? client.companyName : `${client.firstName} ${client.lastName}`}
            </h1>
            {client.type === "ENTREPRISE" && client.siret && (
              <div className="text-sm text-muted-foreground mt-1">SIRET: {client.siret}</div>
            )}
            {client.type === "ENTREPRISE" && client.companyName && (
              <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                <User className="w-4 h-4" /> Contact: {client.firstName} {client.lastName}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Téléphone
            </div>
            <div className="text-sm font-medium">{client.phone}</div>
          </div>
          {client.email && (
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </div>
              <div className="text-sm font-medium">{client.email}</div>
            </div>
          )}
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Adresse
            </div>
            <div className="text-sm font-medium">{client.address || "—"} {client.city || ""}</div>
          </div>
          {client.housingType && (
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> Type de logement
              </div>
              <div className="text-sm font-medium capitalize">{client.housingType.toLowerCase()}</div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ClipboardList className="w-5 h-5" /> Historique des interventions
        </h2>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="text-left px-4 py-3">N°</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Statut</th>
                  <th className="text-left px-4 py-3">Priorité</th>
                  <th className="w-12" />
                </tr>
              </thead>
              <tbody>
                {interventions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Aucune intervention trouvée pour ce client
                    </td>
                  </tr>
                ) : (
                  interventions.map((it: any) => (
                    <tr key={it.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link to={`/interventions/${it.id}`} className="font-mono text-xs font-semibold text-primary hover:underline">
                          {it.number}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium">{it.type}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {formatDate(it.scheduledDate)} {it.scheduledTime && <span className="text-muted-foreground/60">{it.scheduledTime}</span>}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={it.status} /></td>
                      <td className="px-4 py-3"><PriorityBadge priority={it.priority} /></td>
                      <td className="px-4 py-3">
                        <Link to={`/interventions/${it.id}`} className="p-1 hover:text-primary transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
