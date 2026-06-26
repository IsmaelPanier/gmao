import * as Minio from 'minio';
import { env } from './env';
import { logger } from '../shared/logger';

export const minioClient = new Minio.Client({
  endPoint: env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(env.MINIO_PORT || '9000'),
  useSSL: env.MINIO_USE_SSL === 'true',
  accessKey: env.MINIO_ROOT_USER || 'admin',
  secretKey: env.MINIO_ROOT_PASSWORD || 'Admin1234!',
});

export const BUCKET_NAME = env.MINIO_BUCKET || 'gmao-media';

export async function initMinio() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'eu-west-1');
      logger.info(`Bucket ${BUCKET_NAME} created successfully`);
      
      // Set public read policy for the bucket so images can be viewed directly
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Action: ['s3:GetObject'],
            Effect: 'Allow',
            Principal: '*',
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      logger.info(`Bucket ${BUCKET_NAME} policy set to public read`);
    } else {
      logger.info(`Bucket ${BUCKET_NAME} already exists`);
    }
  } catch (error) {
    logger.error('Error initializing MinIO:', error);
  }
}
