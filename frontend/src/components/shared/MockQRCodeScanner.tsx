import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { QrCode, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function MockQRCodeScanner() {
  const [open, setOpen] = useState(false);
  const [scannedId, setScannedId] = useState("INT-12345"); // Default mock
  const navigate = useNavigate();

  const handleScan = () => {
    toast.success(`Code QR scanné: ${scannedId}`);
    setOpen(false);
    // Dans une vraie application, on vérifierait si l'intervention existe 
    // et on naviguerait vers /interventions/:id
    // Pour la démo, on affiche juste le toast.
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full h-16 text-lg gap-3 rounded-xl shadow-lg bg-primary hover:bg-primary/90" size="lg">
          <QrCode className="w-6 h-6" /> Scanner un équipement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan de code QR</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          <div className="relative w-48 h-48 border-4 border-dashed border-primary/50 rounded-xl flex items-center justify-center bg-muted/20">
            <QrCode className="w-24 h-24 text-muted-foreground opacity-50 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-transparent h-2 w-full animate-scan" />
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Ceci est un simulateur. Entrez un ID d'intervention ou d'équipement pour simuler le scan.
          </p>
          <input 
            type="text" 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={scannedId}
            onChange={(e) => setScannedId(e.target.value)}
            placeholder="Ex: INT-12345"
          />
          <Button onClick={handleScan} className="w-full">
            Simuler le scan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
