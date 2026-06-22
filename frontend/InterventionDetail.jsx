import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api, { formatApiError, API, STATUS_LABELS } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge, PriorityBadge } from "@/components/Badges";
import {
  ArrowLeft, Play, Square, MessageSquare, Image as ImageIcon, FileDown,
  MapPin, Clock, User, Building2, Trash2, Send, Pen
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

function SignaturePad({ onChange, label }) {
  const ref = useRef(null);
  const drawing = useRef(false);

  useEffect(() => {
    const c = ref.current; const ctx = c.getContext("2d");
    ctx.strokeStyle = "#09090B"; ctx.lineWidth = 2; ctx.lineCap = "round";
  }, []);

  const pos = (e) => {
    const c = ref.current; const r = c.getBoundingClientRect();
    const t = e.touches?.[0];
    return { x: (t?.clientX ?? e.clientX) - r.left, y: (t?.clientY ?? e.clientY) - r.top };
  };
  const start = (e) => { e.preventDefault(); drawing.current = true; const p = pos(e); const ctx = ref.current.getContext("2d"); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const move = (e) => { if (!drawing.current) return; e.preventDefault(); const p = pos(e); const ctx = ref.current.getContext("2d"); ctx.lineTo(p.x, p.y); ctx.stroke(); };
  const end = () => { if (!drawing.current) return; drawing.current = false; onChange(ref.current.toDataURL("image/png")); };
  const clear = () => { const c = ref.current; c.getContext("2d").clearRect(0, 0, c.width, c.height); onChange(null); };

  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">{label}</div>
      <canvas
        ref={ref}
        width={500} height={160}
        className="sig-canvas w-full rounded-sm"
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
        data-testid={`signature-${label.replace(/\s/g, "-").toLowerCase()}`}
      />
      <Button variant="ghost" size="sm" onClick={clear} className="mt-1 text-xs">Effacer</Button>
    </div>
  );
}

export default function InterventionDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [it, setIt] = useState(null);
  const [comment, setComment] = useState("");
  const [closeOpen, setCloseOpen] = useState(false);
  const [worksDone, setWorksDone] = useState("");
  const [sigTech, setSigTech] = useState(null);
  const [sigClient, setSigClient] = useState(null);
  const [techs, setTechs] = useState([]);

  const load = async () => {
    const r = await api.get(`/interventions/${id}`);
    setIt(r.data); setWorksDone(r.data.works_done || "");
  };
  useEffect(() => { load(); api.get("/users").then(r => setTechs(r.data.filter(u => u.role === "technicien"))); /* eslint-disable-next-line */ }, [id]);

  if (!it) return <div className="text-zinc-500">Chargement…</div>;

  const isAssigned = it.assigned_technicians?.includes(user.id);
  const canManage = ["admin", "responsable"].includes(user.role);
  const canAct = canManage || (user.role === "technicien" && isAssigned);

  const start = async () => {
    try { const r = await api.post(`/interventions/${id}/start`); setIt(r.data); toast.success("Intervention démarrée"); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const complete = async () => {
    try {
      const r = await api.post(`/interventions/${id}/complete`, { works_done: worksDone, signature_tech: sigTech, signature_client: sigClient });
      setIt(r.data); setCloseOpen(false); toast.success("Intervention terminée");
    } catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const sendComment = async () => {
    if (!comment.trim()) return;
    try { await api.post(`/interventions/${id}/comments`, { text: comment }); setComment(""); load(); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const onPhoto = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try { await api.post(`/interventions/${id}/photos`, { data: reader.result }); toast.success("Photo ajoutée"); load(); }
      catch (err) { toast.error(formatApiError(err.response?.data?.detail)); }
    };
    reader.readAsDataURL(file);
  };

  const changeStatus = async (s) => {
    try { const r = await api.put(`/interventions/${id}`, { status: s }); setIt(r.data); toast.success("Statut mis à jour"); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const reassign = async (tid) => {
    const list = it.assigned_technicians.includes(tid)
      ? it.assigned_technicians.filter(x => x !== tid)
      : [...it.assigned_technicians, tid];
    try { const r = await api.put(`/interventions/${id}`, { assigned_technicians: list }); setIt(r.data); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  const del = async () => {
    if (!window.confirm("Supprimer cette intervention ?")) return;
    try { await api.delete(`/interventions/${id}`); toast.success("Supprimée"); nav("/interventions"); }
    catch (e) { toast.error(formatApiError(e.response?.data?.detail)); }
  };

  return (
    <div className="space-y-6 max-w-6xl" data-testid="intervention-detail">
      <div>
        <button onClick={() => nav(-1)} className="text-sm text-zinc-600 hover:text-zinc-900 inline-flex items-center gap-1 mb-3">
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <div className="font-mono text-xs font-bold tracking-wider text-zinc-500">{it.number}</div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mt-1">{it.type}</h1>
            <div className="flex items-center gap-2 mt-3"><StatusBadge status={it.status} /><PriorityBadge priority={it.priority} /></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {it.status === "planifiee" && canAct && (
              <Button onClick={start} data-testid="start-intervention" className="rounded-sm bg-amber-500 hover:bg-amber-600">
                <Play className="w-4 h-4 mr-2" /> Démarrer
              </Button>
            )}
            {it.status === "en_cours" && canAct && (
              <Button onClick={() => setCloseOpen(true)} data-testid="complete-intervention" className="rounded-sm bg-emerald-600 hover:bg-emerald-700">
                <Square className="w-4 h-4 mr-2" /> Clôturer
              </Button>
            )}
            <Button asChild variant="outline" className="rounded-sm">
              <a data-testid="download-pdf" href={`${API}/interventions/${id}/report.pdf`} target="_blank" rel="noreferrer">
                <FileDown className="w-4 h-4 mr-2" /> Rapport PDF
              </a>
            </Button>
            {canManage && (
              <Button variant="outline" onClick={del} className="rounded-sm text-rose-600 hover:bg-rose-50">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-zinc-200 rounded-sm p-5">
            <div className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 mb-3">Détails</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><div className="text-zinc-500 text-xs uppercase font-semibold">Client</div><div>{it.client?.name} {it.client?.company && `(${it.client.company})`}</div></div>
              <div><div className="text-zinc-500 text-xs uppercase font-semibold">Adresse</div><div className="flex items-start gap-1"><MapPin className="w-3 h-3 mt-1 text-zinc-400" />{it.address}</div></div>
              <div><div className="text-zinc-500 text-xs uppercase font-semibold">Date prévue</div><div>{it.scheduled_date} à {it.scheduled_time}</div></div>
              <div><div className="text-zinc-500 text-xs uppercase font-semibold">Durée estimée</div><div className="flex items-center gap-1"><Clock className="w-3 h-3 text-zinc-400" />{it.duration_estimated} min</div></div>
              <div className="sm:col-span-2"><div className="text-zinc-500 text-xs uppercase font-semibold">Description</div><div className="whitespace-pre-wrap">{it.description || "—"}</div></div>
              {it.works_done && (
                <div className="sm:col-span-2"><div className="text-zinc-500 text-xs uppercase font-semibold">Travaux réalisés</div><div className="whitespace-pre-wrap">{it.works_done}</div></div>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white border border-zinc-200 rounded-sm p-5">
            <div className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 mb-3 flex items-center gap-2">
              <MessageSquare className="w-3 h-3" /> Commentaires ({it.comments?.length || 0})
            </div>
            <div className="space-y-3 mb-4 max-h-72 overflow-y-auto">
              {(!it.comments || it.comments.length === 0) && <div className="text-sm text-zinc-500">Aucun commentaire.</div>}
              {it.comments?.map((c) => (
                <div key={c.id} className="border-l-2 border-zinc-200 pl-3 py-1">
                  <div className="text-xs text-zinc-500"><span className="font-semibold text-zinc-700">{c.by}</span> · {new Date(c.at).toLocaleString("fr-FR")}</div>
                  <div className="text-sm mt-0.5">{c.text}</div>
                </div>
              ))}
            </div>
            {canAct && (
              <div className="flex gap-2">
                <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Ajouter un commentaire…"
                          rows={2} className="rounded-sm" data-testid="comment-input" />
                <Button onClick={sendComment} data-testid="send-comment" className="rounded-sm bg-[#002FA7] hover:bg-[#002277] self-stretch">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Photos */}
          <div className="bg-white border border-zinc-200 rounded-sm p-5">
            <div className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 mb-3 flex items-center gap-2">
              <ImageIcon className="w-3 h-3" /> Photos ({it.photos?.length || 0})
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
              {it.photos?.map((p) => (
                <a key={p.id} href={p.data} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden border border-zinc-200 rounded-sm">
                  <img src={p.data} alt={p.caption} className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
            {canAct && (
              <label className="inline-flex items-center gap-2 cursor-pointer text-sm text-[#002FA7] font-semibold">
                <input type="file" accept="image/*" capture="environment" onChange={onPhoto} className="hidden" data-testid="photo-input" />
                <ImageIcon className="w-4 h-4" /> Ajouter une photo
              </label>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {canManage && (
            <div className="bg-white border border-zinc-200 rounded-sm p-5">
              <div className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 mb-3">Affectation</div>
              <div className="flex flex-wrap gap-2">
                {techs.map((t) => (
                  <button key={t.id} onClick={() => reassign(t.id)}
                    data-testid={`reassign-${t.id}`}
                    className={`px-3 py-1.5 text-xs border rounded-sm transition-fast ${
                      it.assigned_technicians.includes(t.id)
                        ? "bg-[#002FA7] text-white border-[#002FA7]"
                        : "bg-white border-zinc-300 hover:border-zinc-400"
                    }`}>{t.name}</button>
                ))}
              </div>
              <div className="mt-4">
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Statut</div>
                <Select value={it.status} onValueChange={changeStatus}>
                  <SelectTrigger className="rounded-sm" data-testid="change-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {it.technicians?.length > 0 && (
            <div className="bg-white border border-zinc-200 rounded-sm p-5">
              <div className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 mb-3">Techniciens</div>
              <div className="space-y-2">
                {it.technicians.map(t => (
                  <div key={t.id} className="flex items-center gap-2 text-sm">
                    <div className="w-7 h-7 bg-zinc-900 text-white rounded-sm flex items-center justify-center font-semibold text-xs">
                      {t.name.charAt(0)}
                    </div>
                    <div><div className="font-medium">{t.name}</div><div className="text-xs text-zinc-500">{t.email}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-zinc-200 rounded-sm p-5">
            <div className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 mb-3">Historique</div>
            <div className="space-y-2 text-xs">
              {it.history?.map((h, i) => (
                <div key={i} className="flex justify-between gap-2">
                  <span>{h.action} — <span className="text-zinc-500">{h.by}</span></span>
                  <span className="text-zinc-400 whitespace-nowrap">{new Date(h.at).toLocaleDateString("fr-FR")} {new Date(h.at).toLocaleTimeString("fr-FR", {hour: "2-digit", minute: "2-digit"})}</span>
                </div>
              ))}
            </div>
          </div>

          {it.duration_real != null && (
            <div className="bg-white border border-zinc-200 rounded-sm p-5">
              <div className="text-xs font-bold uppercase tracking-[0.15em] text-zinc-500 mb-2">Durée réelle</div>
              <div className="font-display text-3xl font-bold">{it.duration_real} <span className="text-base text-zinc-500">min</span></div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={closeOpen} onOpenChange={setCloseOpen}>
        <DialogContent className="rounded-sm max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><Pen className="w-5 h-5" /> Clôture de l'intervention</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-600 mb-2">Travaux réalisés</div>
              <Textarea value={worksDone} onChange={(e) => setWorksDone(e.target.value)} rows={4} className="rounded-sm"
                        data-testid="works-done" placeholder="Décrivez les travaux effectués…" />
            </div>
            <SignaturePad label="Signature technicien" onChange={setSigTech} />
            <SignaturePad label="Signature client" onChange={setSigClient} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseOpen(false)} className="rounded-sm">Annuler</Button>
            <Button onClick={complete} data-testid="confirm-complete" className="rounded-sm bg-emerald-600 hover:bg-emerald-700">Valider la clôture</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
