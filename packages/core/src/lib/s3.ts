import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { env } from "@repo/config";

export const s3Client = new S3Client({
  region: env.USE_LOCALSTACK ? "us-east-1" : env.AWS_REGION!,
  credentials: {
    accessKeyId: env.USE_LOCALSTACK ? "test" : env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: env.USE_LOCALSTACK ? "test" : env.AWS_SECRET_ACCESS_KEY!,
  },
  endpoint: env.USE_LOCALSTACK ? "http://127.0.0.1:4566" : undefined,
  forcePathStyle: env.USE_LOCALSTACK,
});

const BUCKET_NAME = env.USE_LOCALSTACK ? "documesh-local" : env.S3_BUCKET_NAME!;

export async function getUploadUrl(orgId: string, filename: string) {
  const key = `${orgId}/${uuidv4()}-${filename}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return { url, key };
}

export async function getDownloadUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function checkFileExists(key: string) {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    const response = await s3Client.send(command);
    return { exists: true, size: response.ContentLength };
  } catch {
    return { exists: false, size: 0 };
  }
}

export async function downloadFile(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });
  const response = await s3Client.send(command);
  const byteArray = await response.Body?.transformToByteArray();
  if (!byteArray) throw new Error("Empty body");
  return Buffer.from(byteArray);
}
