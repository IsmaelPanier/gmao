import * as Minio from 'minio';
import { env } from './env';
import { logger } from './logger';

export const minioClient = new Minio.Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

export const BUCKET_NAME = env.MINIO_BUCKET_NAME;

const PUBLIC_READ_POLICY = JSON.stringify({
  Version: '2012-10-17',
  Statement: [
    {
      Action: ['s3:GetObject'],
      Effect: 'Allow',
      Principal: '*',
      Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
    },
  ],
});

export async function initMinio() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'eu-west-1');
      logger.info(`Bucket ${BUCKET_NAME} created successfully`);
    } else {
      logger.info(`Bucket ${BUCKET_NAME} already exists`);
    }
    // Always ensure public read policy is applied (minio-init may have created the bucket without it)
    await minioClient.setBucketPolicy(BUCKET_NAME, PUBLIC_READ_POLICY);
    logger.info(`Bucket ${BUCKET_NAME} policy set to public read`);
  } catch (error) {
    logger.error('Error initializing MinIO:', error);
  }
}
