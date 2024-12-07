"use server";
import { SearchResult, ValidatedRecommendation } from "@/type";
import { handleDatabaseError } from "./activity";
import { sendImgURLAndPromptToGPT, sendPromptToGPT } from "./utils/chat";
import {
  semanticSearchForSearching
} from "./utils/matching";
import {
  constructPromptForImageSearch,
  constructPromptForTextSearch,
} from "./utils/prompt";
import { validateLabelString } from "./utils/validate";

import { ClothingType, Gender } from "@/type";

const getLabelString = async (
  model: string,
  sendFunction: (model: string, prompt: string, imageUrlOrQuery: string) => Promise<string | null>,
  promptGenerator: (input: { gender: Gender; imageUrlOrQuery: string }) => string,
  gender: Gender|undefined,
  imageUrlOrQuery: string
): Promise<{ labelString: string; clothing_type?: ClothingType; gender?: Gender }> => {
  const MAX_RETRIES = 5;
  let rawLabelString: string | null = null;
  let cleanedLabels: ValidatedRecommendation[] = [];
  let attempts = 0;
  let detectedClothingType: ClothingType | undefined;
  let detectedGender: Gender | undefined;

  while (rawLabelString?.length === 0 || cleanedLabels.length === 0) {
    if (attempts >= MAX_RETRIES) {
      console.error("Max retries reached.");
      return { labelString: "", clothing_type: undefined, gender: undefined };
    }

    const prompt = promptGenerator({ gender, imageUrlOrQuery });
    // console.log("the prompt is: ", prompt);
    rawLabelString = await sendFunction(model, prompt, imageUrlOrQuery);
    // console.log("rawLabelString: ", rawLabelString);

    if (rawLabelString) {
      let clothingTypeString = rawLabelString;
      if (typeof clothingTypeString !== "string") {
        console.log("Recommendations is not a string:", clothingTypeString);
        rawLabelString = null;
        continue;
      }

      const cleanedClothingType = clothingTypeString.replace(/```json\s*|\s*```/g, "").trim();

      if (!cleanedClothingType.startsWith("[")) {
        console.log("Cleaned recommendations does not start with '[':", cleanedClothingType);
        rawLabelString = null;
        continue;
      }

      try {
        const parsedData = JSON.parse(cleanedClothingType)[0];
        detectedClothingType =
          parsedData.clothing_type === "上半身" ? "top" :
          parsedData.clothing_type === "下半身" ? "bottom" :
          undefined;
        detectedGender =
          parsedData.gender === "男性" ? "male" :
          parsedData.gender === "女性" ? "female" :
          undefined;
        cleanedLabels = validateLabelString(rawLabelString, true, detectedClothingType);
      } catch (parseError) {
        console.error("Failed to parse rawLabelString JSON:", parseError);
        detectedClothingType = undefined;
        detectedGender = undefined;
      }
    }

    if (rawLabelString?.length === 0 || cleanedLabels.length === 0) {
      console.warn("Retrying due to invalid results...");
    }
    attempts++;
  }

  return {
    labelString: cleanedLabels[0]?.labelString || "",
    clothing_type: detectedClothingType,
    gender: detectedGender
  };
};

const getLabelStringForImageSearch = async (
  gender: Gender | undefined,
  model: string,
  imageUrl: string
): Promise<{ labelString: string; clothing_type?: ClothingType; gender?: Gender }> => {
  return await getLabelString(
    model,
    async (model, prompt, imageUrl) => await sendImgURLAndPromptToGPT({ model, prompt, imageUrl }),
    ({ gender }) => constructPromptForImageSearch({ gender }),
    gender,
    imageUrl
  );
};

// Specific function for text search
const getLabelStringForTextSearch = async (
  gender: Gender|undefined,
  model: string,
  query: string
): Promise<{ labelString: string; clothing_type?: ClothingType; gender?: Gender }> => {
  return await getLabelString(
    model,
    async (model, prompt) => await sendPromptToGPT({ model, prompt }),
    ({ gender, imageUrlOrQuery }) => constructPromptForTextSearch({ query: imageUrlOrQuery, gender }),
    gender,
    query
  );
};


const handleSearch = async (
  labelString: string,
  gender: Gender,
  page: number,
  user_id: string | null,
  priceLowerBound?: number,
  priceUpperBound?: number,
  providers?: string[],
  clothingType?: ClothingType,
): Promise<SearchResult | null> => {
  try {
    const searchResult: SearchResult | null = await semanticSearchForSearching({
      suggestedLabelString: labelString,
      gender,
      priceLowerBound,
      priceUpperBound,
      providers,
      clothingType,
      page,
      user_id,
    });
    console.log("handle searsh searchResult: ", searchResult);
    return searchResult;
  } catch (error) {
    handleDatabaseError(error, "handleImageSearch");
    return null;
  }
};

export { getLabelStringForImageSearch, getLabelStringForTextSearch, handleSearch };
