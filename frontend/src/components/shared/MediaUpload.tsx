import React, { useRef, useState } from "react";
import { useSyncStore } from "@/store/useSyncStore";
import { Camera, Image as ImageIcon, UploadCloud, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api";
import { toast } from "sonner";

interface MediaUploadProps {
  interventionId: string;
  onUploadSuccess?: () => void;
}

export function MediaUpload({ interventionId, onUploadSuccess }: MediaUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOnline, addAction } = useSyncStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileToUpload(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!fileToUpload) return;
    setIsUploading(true);

    try {
      if (isOnline) {
        // Upload immediately
        const formData = new FormData();
        formData.append("file", fileToUpload);
        
        // Mock API call to files route
        await fetchApi("/api/files/upload", {
          method: "POST",
          body: formData as any, // fetchApi might need adjustment to handle FormData, but standard fetch does
        });
        toast.success("Média envoyé avec succès !");
        onUploadSuccess?.();
      } else {
        // We can't serialize a File object into JSON easily, so we could read it as Base64 for the sync queue.
        // For this demo, we'll convert to Base64 and store it in the queue.
        const reader = new FileReader();
        reader.readAsDataURL(fileToUpload);
        reader.onloadend = () => {
          const base64data = reader.result;
          addAction({
            type: "UPLOAD_MEDIA",
            endpoint: "/api/files/upload-base64",
            method: "POST",
            payload: {
              interventionId,
              fileName: fileToUpload.name,
              fileType: fileToUpload.type,
              data: base64data,
            },
          });
        };
      }
      
      setFileToUpload(null);
      setPreviewUrl(null);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'envoi du média.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {previewUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-border">
          <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 rounded-full w-8 h-8"
            onClick={() => {
              setPreviewUrl(null);
              setFileToUpload(null);
            }}
          >
            <X className="w-4 h-4" />
          </Button>
          <div className="absolute bottom-2 left-2 right-2 flex gap-2">
            <Button className="w-full shadow-lg" onClick={handleUpload} disabled={isUploading}>
              {isUploading ? "Envoi..." : (isOnline ? "Envoyer" : "Sauvegarder pour envoi différé")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 rounded-xl"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="w-8 h-8 text-muted-foreground" />
            <span>Prendre une photo</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 rounded-xl"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
            <span>Galerie</span>
          </Button>
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </div>
  );
}
