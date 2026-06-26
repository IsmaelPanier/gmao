import multer from 'multer';

// Configuration de multer pour stocker les fichiers en mémoire
// Cela permet de les uploader directement vers MinIO via les streams
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit per file
  },
});
