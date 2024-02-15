import "../../connection.js";
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";
import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";

const bucketName = process.env.S3_BUCKET_PLACES_IMAGES!;

const s3 = new S3Client({
  region: "eu-west-1",
});

export async function DeleteAllPhotosOfAPlace(placeId: string): Promise<void> {
  try {
    const place = await MongoPlaceModel.findById(placeId);
    if (!place) {
      throw new Error("Place not found");
    }
    const commonKey = `places/${place.googleId || placeId}/`;
    // Listar todos los objetos bajo el prefijo commonKey
    const listedObjects = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: commonKey,
      })
    );

    // Extraer las claves de los objetos listados
    const objectsToDelete =
      listedObjects.Contents?.map(({ Key }) => ({ Key })) || [];

    // Verificar si hay objetos para eliminar
    if (objectsToDelete.length === 0) return;

    // Eliminar los objetos listados
    await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {
          Objects: objectsToDelete,
          Quiet: true,
        },
      })
    );
    place.photos = [];
    delete place.mainPhoto;
    await place.save();
    console.log("Photos deleted");
  } catch (error) {
    console.error(error);
    throw new Error("Error deleting photos");
  }
}

// DeleteAllPhotosOfAPlace("65bc11fcd528e3169aeb8e38");
