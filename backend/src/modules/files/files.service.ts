import { Client } from "minio";
import { env } from "../../config/env";
import { AppError } from "../../shared/errors/AppError";
import prisma from "../../config/database";
import { MediaType } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// Initialize MinIO client
const minioClient = new Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

export const FilesService = {
  async ensureBucketExists() {
    const exists = await minioClient.bucketExists(env.MINIO_BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(env.MINIO_BUCKET_NAME, "us-east-1");
      // Set public policy for easy access in this demo (in production, use pre-signed URLs)
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { AWS: ["*"] },
            Action: ["s3:GetObject"],
            Resource: [`arn:aws:s3:::${env.MINIO_BUCKET_NAME}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(env.MINIO_BUCKET_NAME, JSON.stringify(policy));
    }
  },

  async uploadInterventionMedia(
    interventionId: string,
    userId: string,
    file: Express.Multer.File,
    type: MediaType
  ) {
    // 1. Validate intervention exists
    const intervention = await prisma.intervention.findUnique({
      where: { id: interventionId },
    });
    if (!intervention) throw AppError.notFound("Intervention not found");

    // 2. Upload to MinIO
    await this.ensureBucketExists();
    const ext = path.extname(file.originalname);
    const filename = `${interventionId}/${type.toLowerCase()}_${uuidv4()}${ext}`;

    await minioClient.putObject(
      env.MINIO_BUCKET_NAME,
      filename,
      file.buffer,
      file.size,
      { "Content-Type": file.mimetype }
    );

    // 3. Build public URL
    const protocol = env.MINIO_USE_SSL ? "https" : "http";
    const url = `${protocol}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}/${env.MINIO_BUCKET_NAME}/${filename}`;

    // 4. Save to database
    const media = await prisma.interventionMedia.create({
      data: {
        interventionId,
        type,
        url,
        filename: file.originalname,
        uploadedById: userId,
      },
    });

    return media;
  },

  async deleteMedia(mediaId: string, userId: string) {
    const media = await prisma.interventionMedia.findUnique({
      where: { id: mediaId },
      include: { intervention: true },
    });
    if (!media) throw AppError.notFound("Media not found");

    // Extract object name from URL
    const objectName = media.url.split(`/${env.MINIO_BUCKET_NAME}/`)[1];
    if (objectName) {
      await minioClient.removeObject(env.MINIO_BUCKET_NAME, objectName);
    }

    await prisma.interventionMedia.delete({ where: { id: mediaId } });
  },
};
