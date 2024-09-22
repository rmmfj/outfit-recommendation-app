"use server";
import openai from "@/utils/openai";
import { ImageURL } from "openai/resources/beta/threads/messages";

const sendImgURLAndPromptToGPT = async ({
  model,
  prompt,
  imageUrl,
}: {
  model: string;
  prompt: string;
  imageUrl: string;
}): Promise<string | null> => {
  const NUM_MAX_RETRIES = 5;
  for (let numRetries = 0; numRetries < NUM_MAX_RETRIES; ++numRetries) {
      try {
          // Sending a request to the OpenAI API with both text and image inputs
          const completion = await openai.chat.completions.create({
              model: model,
              messages: [
                  {
                      role: "user",
                      content: [
                          { type: "text", text: prompt },
                          {
                              type: "image_url",
                              image_url: { url: imageUrl } as ImageURL,
                          },
                      ],
                  },
              ],
          });
          // Extracting and returning the response content
          const response = completion.choices[0].message.content;
          return response;
      } catch (e) {
          console.log("Failed to get response from GPT API.");
          console.log(e);
          if (numRetries < NUM_MAX_RETRIES) {
              console.log("Retrying...");
          }
      }
  }
  return null;
};

const isImageUrlValid = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: "HEAD" });
    // Check if the response is ok and content type is an image
    if (response.ok) {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error checking image URL:", error);
    return false;
  }
};

export { sendImgURLAndPromptToGPT, isImageUrlValid };
