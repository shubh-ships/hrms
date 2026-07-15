import { RekognitionClient, IndexFacesCommand, SearchFacesByImageCommand,  ListCollectionsCommand,
  CreateCollectionCommand, } from "@aws-sdk/client-rekognition";
import dotenv from "dotenv";
dotenv.config();

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION
});

async function ensureCollectionExists(collectionId) {
  const list = await rekognition.send(new ListCollectionsCommand({}));
  if (!list.CollectionIds.includes(collectionId)) {
    console.log(`🆕 Creating collection: ${collectionId}`);
    await rekognition.send(new CreateCollectionCommand({ CollectionId: collectionId }));
    console.log(`✅ Collection created: ${collectionId}`);
  } else {
    console.log(`✅ Collection already exists: ${collectionId}`);
  }
}


export const addFaceToUser = async (imageBuffer, externalId) => {
  const collectionId = process.env.AWS_REKOGNITION_COLLECTION;
  await ensureCollectionExists(collectionId);

  const params = {
    CollectionId: collectionId,
    Image: { Bytes: imageBuffer },
    ExternalImageId: externalId,
  };

  const result = await rekognition.send(new IndexFacesCommand(params));
  if (!result.FaceRecords.length) throw new Error("No face detected");
  return result.FaceRecords.map(record => record.Face.FaceId);
};
export const searchFace = async (imageBuffer) => {
  const params = {
    CollectionId: process.env.AWS_REKOGNITION_COLLECTION,
    Image: { Bytes: imageBuffer },
    MaxFaces: 1,
    FaceMatchThreshold: 90,
  };

  const result = await rekognition.send(new SearchFacesByImageCommand(params));
  if (!result.FaceMatches || result.FaceMatches.length === 0) return null;

  const matchedFace = result.FaceMatches[0];
  return {
    faceId: matchedFace.Face.FaceId,
    similarity: matchedFace.Similarity,
    externalImageId: matchedFace.Face.ExternalImageId,
  };
};
