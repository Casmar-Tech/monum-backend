import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import "../../connection.js";
import { MongoMediaModel } from "../../medias/infrastructure/mongoModel/MongoMediaModel.js";
import mm from "music-metadata";
import { Readable } from "stream";

const client = new S3Client({
  region: "eu-west-1",
});

async function CalculateMediasDuration() {
  let medias = await MongoMediaModel.find({ deleted: { $ne: true } });
  let index = 0;
  for (const media of medias) {
    console.log(`Calculating media ${index++} of ${medias.length}`);
    if (!media.url) continue;
    await Promise.all(
      Object.entries(media.url).map(async (audio) => {
        const { Body } = await client.send(
          new GetObjectCommand({
            Bucket: process.env.S3_BUCKET_AUDIOS!,
            Key: audio[1],
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
        media.duration = {
          ...media.duration,
          [audio[0]]: metadata.format.duration || 0,
        };
      })
    );
    await media.save();
  }
  console.log("All medias duration calculated!");
}

CalculateMediasDuration();
