import React, { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import InterventionsService from "@/services/interventions.service";
import { toast } from "sonner";
import type { InterventionMedia } from "@/types";

interface InterventionPhotosProps {
  interventionId: string;
  media: InterventionMedia[];
  canEdit: boolean;
}

export function InterventionPhotos({ interventionId, media, canEdit }: InterventionPhotosProps) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const photos = media?.filter((m) => m.type === "PHOTO") || [];

  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => InterventionsService.uploadMedia(interventionId, files),
    onSuccess: () => {
      toast.success("Photos envoyées avec succès");
      qc.invalidateQueries({ queryKey: ["intervention", interventionId] });
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || "Erreur lors de l'envoi");
    },
    onSettled: () => setIsUploading(false),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsUploading(true);
      const files = Array.from(e.target.files);
      uploadMutation.mutate(files);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Camera className="w-5 h-5 text-primary" />
          Photos ({photos.length})
        </h3>
        {canEdit && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              multiple
              className="hidden"
              // L'attribut capture="environment" permet d'ouvrir directement l'appareil photo sur mobile (si supporté)
              // mais en gardant 'multiple', le comportement dépend du navigateur (généralement il ouvre le selecteur de fichiers permettant de choisir l'appareil photo ou la galerie).
            />
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImagePlus className="w-4 h-4" />
              )}
              Ajouter des photos
            </Button>
          </div>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="bg-muted/30 border border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <Camera className="w-8 h-8 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Aucune photo pour cette intervention.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer relative group"
              onClick={() => setSelectedPhoto(photo.url)}
            >
              <img
                src={photo.url}
                alt={photo.filename || "Photo"}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full">
                  Agrandir
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 rounded-full transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPhoto(null);
            }}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedPhoto}
            alt="Preview"
            className="max-w-full max-h-[90vh] object-contain rounded-md"
            onClick={(e) => e.stopPropagation()} // empêche de fermer si on clique sur l'image
          />
        </div>
      )}
    </div>
  );
}
