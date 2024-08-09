import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import mm from "music-metadata";

export default async function GetAudioDuration(
  audioUrl: string
): Promise<number | undefined> {
  const client = new S3Client({
    region: "eu-west-1",
  });
  const { Body } = await client.send(
    new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_AUDIOS!,
      Key: audioUrl,
    })
  );
  if (!Body) return 0;
  const chunks: any[] = [];

  if (Body instanceof Readable) {
    for await (const chunk of Body) {
      chunks.push(chunk);
    }
  }
  const buffer = Buffer.concat(chunks);
  const metadata = await mm.parseBuffer(buffer, {
    mimeType: "audio/mpeg",
    size: buffer.length,
  });
  return metadata.format.duration;
}
