import React, { useRef, useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getApiError } from "@/services/api";
import InterventionsService from "@/services/interventions.service";
import { Camera, PenLine, Trash2, CheckCircle2, Loader2 } from "lucide-react";

interface Props {
  interventionId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: () => void;
}

export function CloseInterventionModal({ interventionId, open, onOpenChange, onSuccess }: Props) {
  const qc = useQueryClient();
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [hasSignature, setHasSignature] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setNotes("");
      setPhotos([]);
      setPhotoPreviews([]);
      setHasSignature(false);
      clearCanvas();
    }
  }, [open]);

  function getCanvasPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    setIsDrawing(true);
    lastPos.current = getCanvasPos(e);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    const pos = getCanvasPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current!.x, lastPos.current!.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    lastPos.current = pos;
    setHasSignature(true);
  }

  function stopDraw() {
    setIsDrawing(false);
    lastPos.current = null;
  }

  function clearCanvas() {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSignature(false);
  }

  function getSignatureFile(): File | null {
    if (!hasSignature || !canvasRef.current) return null;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const byteString = atob(dataUrl.split(",")[1]);
    const arr = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) arr[i] = byteString.charCodeAt(i);
    const blob = new Blob([arr], { type: "image/png" });
    return new File([blob], "signature.png", { type: "image/png" });
  }

  function handlePhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPhotos((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreviews((prev) => [...prev, ev.target!.result as string]);
      reader.readAsDataURL(f);
    });
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
  }

  const closeMutation = useMutation({
    mutationFn: async () => {
      // 1. Upload photos si présentes
      if (photos.length > 0) {
        await InterventionsService.uploadMedia(interventionId, photos);
      }

      // 2. Upload signature si présente
      const sigFile = getSignatureFile();
      if (sigFile) {
        await InterventionsService.uploadSignature(interventionId, sigFile);
      }

      // 3. Mettre à jour le statut + notes
      await InterventionsService.timeLog(interventionId, "END");

      if (notes.trim()) {
        await InterventionsService.update(interventionId, { notes });
      }
    },
    onSuccess: () => {
      toast.success("Intervention clôturée avec succès");
      qc.invalidateQueries({ queryKey: ["intervention", interventionId] });
      qc.invalidateQueries({ queryKey: ["interventions"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      onOpenChange(false);
      onSuccess();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Clôturer l'intervention
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Commentaire de clôture</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Décrivez les travaux effectués, observations particulières..."
              rows={3}
            />
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <Camera className="w-4 h-4" /> Photos (optionnel)
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotosChange}
            />
            {photoPreviews.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photoPreviews.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} alt="" className="w-16 h-16 object-cover rounded border" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute -top-1 -right-1 bg-destructive text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera className="w-4 h-4 mr-1.5" /> Ajouter des photos
            </Button>
          </div>

          {/* Signature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1.5">
                <PenLine className="w-4 h-4" /> Signature client (optionnelle)
              </Label>
              {hasSignature && (
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={clearCanvas}>
                  <Trash2 className="w-3 h-3 mr-1" /> Effacer
                </Button>
              )}
            </div>
            <div className="border rounded-lg bg-muted/30 overflow-hidden touch-none">
              <canvas
                ref={canvasRef}
                width={480}
                height={160}
                className="w-full cursor-crosshair"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
            </div>
            {!hasSignature && (
              <p className="text-xs text-muted-foreground">Signez dans le cadre ci-dessus ou laissez vide.</p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={closeMutation.isPending}>
            Annuler
          </Button>
          <Button
            onClick={() => closeMutation.mutate()}
            disabled={closeMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {closeMutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Clôture en cours...</>
            ) : (
              <><CheckCircle2 className="w-4 h-4 mr-2" /> Valider la clôture</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
