"use server";
import { ProfileTable, RecommendationPreview } from "@/type";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

const createProfile = async (user_id: string): Promise<boolean> => {
  const supabase = createClient();
  const { data } = await supabase
    .from("profile")
    .select("*")
    .eq("user_id", user_id)
    .single();
  if (data) return false;
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Failed to retrieve authenticated user");
    }
    const username = user.email?.split("@")[0];

    const { error } = await supabase.from("profile").insert({
      user_id,
      username,
      avatar_url: user.user_metadata.avatar_url,
    });

    if (error) {
      throw new Error(`Error inserting profile data: ${error.message}`);
    }

    return true;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to create profile");
  }
};

const getProfileByUserId = async (user_id: string): Promise<ProfileTable> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("profile")
    .select("*")
    .eq("user_id", user_id);
  if (error) {
    throw new Error(`Error fetching user profile: ${error.message}`);
  }
  if (!data || data.length === 0) {
    throw new Error(`User with ID ${user_id} not found`);
  }
  return data[0];
};

const updateUserProfile = async (
  origin: string,
  username?: string,
  avatar_url?: string
): Promise<boolean> => {
  try {
    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error("Failed to retrieve authenticated user");
    }
    const updates: { username?: string; avatar_url?: string } = {};
    if (username) {
      updates.username = username;
    }
    if (avatar_url) {
      updates.avatar_url = avatar_url;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("profile")
        .update(updates)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating profile:", error);
      } else {
        console.log("Profile updated successfully");
      }
    } else {
      console.log("No valid fields to update");
    }

    revalidatePath(origin);
    return true;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to update profile");
  }
};

const getPreviewsByUserId = async (
  user_id: string
): Promise<RecommendationPreview[]> => {
  try {
    const supabase = createClient();
    const { data, error: getUploadError } = await supabase
      .from("recommendation")
      .select(
        `
        *,
        upload (
          image_url
        )
      `
      )
      .eq("user_id", user_id);

    // console.log(data);

    if (!data || data.length == 0) {
      return [];
    }

    if (getUploadError) {
      throw new Error(`Error getting upload data`);
    }
    return data;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to get profile");
  }
};

const signOut = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  return true;
};

export {
  createProfile,
  getPreviewsByUserId,
  getProfileByUserId,
  signOut,
  updateUserProfile,
};
