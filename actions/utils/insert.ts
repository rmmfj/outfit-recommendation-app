"use server";
import supabase from "@/lib/supabaseClient";
import { ClothingType, Gender } from "@/type";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { UnstoredResult } from "./matching";

const base64ToBlob = (base64: string): Blob => {
  const byteString = atob(base64.split(",")[1]);
  const mimeString = base64.split(",")[0].split(":")[1].split(";")[0];

  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

const storeImageToStorage = async (base64: string) => {
  console.time("storeImageToStorage");
  const blob: Blob = base64ToBlob(base64);
  const filename = `image-${uuidv4()}`;
  // console.log(filename);
  await supabase.storage.from("image").upload(filename, blob, {
    cacheControl: "3600",
    upsert: false,
  });
  const {
    data: { publicUrl },
  } = supabase.storage.from("image").getPublicUrl(filename);
  console.timeEnd("storeImageToStorage");
  return publicUrl;
};

// Inserts results into the database
const insertResults = async (
  results: UnstoredResult[]
): Promise<number[] | null> => {
  try {
    const { data, error } = await supabase
      .from("result")
      .insert(results)
      .select("id");

    if (error) {
      console.error("Error inserting results:", error);
      return null;
    }

    return data ? data.map((obj) => obj.id) : [];
  } catch (error) {
    console.error("Unexpected error in insertResults:", error);
    return null;
  }
};

// Inserts a suggestion into the database
const insertSuggestion = async ({
  recommendationId,
  labelString,
  styleName,
  description,
}: {
  recommendationId: number;
  labelString: string;
  styleName: string;
  description: string;
}): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from("suggestion")
      .insert({
        recommendation_id: recommendationId,
        label_string: labelString,
        style_name: styleName,
        description: description,
      })
      .select("id");

    if (error) {
      console.error("Error inserting suggestion:", error);
      return -1;
    }

    return data && data.length > 0 ? data[0].id : -1;
  } catch (error) {
    console.error("Unexpected error in insertSuggestion:", error);
    return -1;
  }
};

// Inserts a new recommendation into the database
const insertRecommendation = async ({
  paramId,
  uploadId,
  userId,
}: {
  paramId: number;
  uploadId: number;
  userId: string;
}): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from("recommendation")
      .insert([{ param_id: paramId, upload_id: uploadId, user_id: userId }])
      .select("id");

    if (error) {
      console.error("Error inserting recommendation:", error);
      return -1;
    }

    return data && data.length > 0 ? data[0].id : -1;
  } catch (error) {
    console.error("Unexpected error in insertRecommendation:", error);
    return -1;
  }
};

const insertParam = async (
  gender: Gender,
  clothingType: ClothingType,
  model: string
): Promise<number> => {
  const { data, error } = await supabase
    .from("param")
    .insert([
      {
        gender,
        clothing_type: clothingType,
        model,
      },
    ])
    .select("id");
  if (error) {
    console.log(error);
  }
  if (data && data.length > 0) {
    const paramId = data[0].id;
    return paramId as number;
  } else {
    return -1;
  }
};

const insertUpload = async (imageUrl: string, userId: string) => {
  const { data, error } = await supabase
    .from("upload")
    .insert([{ image_url: imageUrl, user_id: userId }])
    .select("id");
  revalidatePath("/upload");
  if (error) {
    console.log(error);
  }
  if (data && data.length > 0) {
    const uploadId = data[0].id;
    return uploadId as number;
  } else {
    return -1;
  }
};

export {
  insertParam,
  insertRecommendation,
  insertResults,
  insertSuggestion,
  insertUpload,
  storeImageToStorage,
};
