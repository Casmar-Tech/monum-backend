import "../../connection.js";
import { Types } from "mongoose";
import sharp from "sharp";
import { MongoPlaceModel } from "../infrastructure/mongoModel/MongoPlaceModel.js";
import {
  LARGE_PHOTO_MAX_WIDTH_PX,
  MEDIUM_PHOTO_MAX_WIDTH_PX,
  ORIGINAL_PHOTO_MAX_WIDTH_PX,
  SMALL_PHOTO_MAX_WIDTH_PX,
} from "../infrastructure/s3/photos.js";
import {
  GetObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import IPhoto from "../domain/interfaces/IPhoto.js";

const s3 = new S3Client({
  region: "eu-west-1",
});

const bucketName = process.env.S3_BUCKET_PLACES_IMAGES!;

async function RepostImagesToPlace(placeId: string): Promise<void> {
  const place = await MongoPlaceModel.findById(placeId);

  const listObjectCommandCheck = new ListObjectsCommand({
    Bucket: bucketName,
    Prefix: `places/${placeId}`,
  });
  const dataCheck = await s3.send(listObjectCommandCheck);
  if (dataCheck.Contents?.length) {
    return;
  }

  const googlePlaceId = await MongoPlaceModel.aggregate([
    { $match: { _id: new Types.ObjectId(placeId) } },
    {
      $lookup: {
        from: "places",
        localField: "_id",
        foreignField: "_id",
        as: "place",
      },
    },
    {
      $addFields: {
        place: {
          $first: "$place",
        },
      },
    },
    {
      $project: {
        googleId: "$place.googleId",
      },
    },
  ]);
  if (!place) {
    throw new Error("Place not found");
  }
  const idOfPlace =
    (googlePlaceId && googlePlaceId[0] && googlePlaceId[0].googleId) || placeId;

  const listObjectCommand = new ListObjectsCommand({
    Bucket: bucketName,
    Prefix: `places/${idOfPlace}`,
  });

  const data = await s3.send(listObjectCommand);

  const allPhotosUnique =
    data.Contents?.map((content) => content.Key)
      .filter(
        (key) =>
          key?.endsWith("original.jpg") ||
          key?.endsWith("original.jpeg") ||
          key?.endsWith("original.webp")
      )
      .slice(0, 5) || [];

  let index = 0;
  place.photos = [];

  for (const photo of allPhotosUnique) {
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: photo,
    });

    const photoData = await s3.send(getObjectCommand);
    const photoString = await photoData.Body?.transformToByteArray();
    const metadata = await sharp(photoString).metadata();
    if (!metadata || !metadata.width || !metadata.height) {
      throw new Error("Error getting metadata from photo");
    }

    const id = new Types.ObjectId();

    const commonKey = `places/${placeId}/${id}`;

    let photoDocument: IPhoto = {
      url: commonKey,
      width: metadata.width,
      height: metadata.height,
      sizes: {},
    };

    for (const size of ["original", "small", "medium", "large"]) {
      let width = 0;
      switch (size) {
        case "small":
          width = SMALL_PHOTO_MAX_WIDTH_PX;
          break;
        case "medium":
          width = MEDIUM_PHOTO_MAX_WIDTH_PX;
          break;
        case "large":
          width = LARGE_PHOTO_MAX_WIDTH_PX;
          break;
        case "original":
          width = ORIGINAL_PHOTO_MAX_WIDTH_PX;
          break;
      }

      const imageResized = sharp(photoString).resize(width).webp();
      const buffer = await imageResized.toBuffer();

      const objectKey = `${commonKey}/${size}.webp`;

      const bucketParams = {
        Bucket: bucketName,
        Key: objectKey,
        Body: buffer,
      };

      await s3.send(new PutObjectCommand(bucketParams));

      console.log(`Photo for place ${placeId} with size ${size} added to S3`);

      photoDocument.sizes[size] = objectKey;
    }

    if (photoDocument) {
      if (index === 0) {
        place.mainPhoto = photoDocument;
        index++;
      } else {
        Array.isArray(place.photos) && place.photos.push(photoDocument);
      }
    }
  }

  await place.save();

  console.log(place.photos.length);
}

async function RepostImagesToPlaces(): Promise<void> {
  const places = await MongoPlaceModel.find({
    $and: [{ "photos.0": { $exists: true } }, { deleted: { $ne: true } }],
  });
  const placeSliced = places;
  let index = 0;
  for (const place of placeSliced) {
    await RepostImagesToPlace(place._id.toString());
    index++;
    console.log(`Place ${index} of ${places.length}`);
  }
}
RepostImagesToPlaces();
