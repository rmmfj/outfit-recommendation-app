"use server";
import { ClothingType, Gender } from "@/type";

//prompt for recommendation
const constructPromptForRecommendation = ({
  clothingType,
  gender,
  numMaxSuggestion,
}: {
  clothingType: ClothingType;
  gender: Gender;
  numMaxSuggestion: number;
}): string => {
  const prompt: string = `
    請擔任我的造型師，仔細觀察這張圖片中的
    ${gender === "male" ? "男性" : "女性"}
    ${clothingType === "top" ? "上衣" : "下身類衣物"}
    ，請推薦${numMaxSuggestion}種與之搭配的
    ${
      clothingType === "top" ? "下身類衣物" : "上衣"
    }。
    對於每一種搭配，請提供一個風格名稱和推薦的原因。
    請使用下方 JSON 格式回覆，回答無需包含其他資訊：
    [
      {
        "styleName": "[風格名稱]",
        "description": "[推薦原因]",
        "item": {
          "顏色": "[顏色]", 
          "服裝類型": "[類型]", 
          "剪裁版型": "[描述]", 
          "設計特點": "[描述]", 
          "材質": "[材質]", 
          "細節": "[描述]", 
          ${
            clothingType === "top"
              ? '"褲管": "[描述]", "裙擺": "[描述]"'
              : '"領子": "[描述]", "袖子": "[描述]"'
          }
        }
      }
    ]
  `;
  return prompt;
};

//prompt for image
const constructPromptForImageSearch = ({
  clothingType,
  gender,
}: {
  clothingType: ClothingType;
  gender: Gender;
}): string => {
  const prompt: string = `
    請仔細觀察這張圖片中的
    ${gender === "male" ? "男性" : "女性"}
    ${clothingType === "top" ? "上衣" : "下身類衣物"}
    ，並且提供一組詳盡的描述。
    請使用下方 JSON 格式回覆，回答無需包含其他資訊：
    [
      {
        "styleName": "[衣物風格]",
        "description": "[衣物描述]",
        "item": {
          "顏色": "[顏色]", 
          "服裝類型": "[類型]", 
          "剪裁版型": "[描述]", 
          "設計特點": "[描述]", 
          "材質": "[材質]", 
          "細節": "[描述]", 
          ${
            clothingType === "top"
              ? '"領子": "[描述]", "袖子": "[描述]"'
              : '"褲管": "[描述]", "裙擺": "[描述]"'
          }
        }
      }
    ]
  `;
  return prompt;
};

const constructPromptForTextSearch = ({
  clothingType,
  userRequest,
  gender,
}: {
  clothingType: ClothingType;
  userRequest: string;
  gender: Gender;
}): string => {
  const prompt: string = `
    請將使用者的需求，盡可能的改寫成固定格式，讓我們能在資料庫中找到類似的衣物
    使用者的需求為：${userRequest}。
    請使用下方 JSON 格式回覆，回答無需包含其他資訊：
    [
      {
        "styleName": "[衣物風格]",
        "description": "[衣物描述]",
        "item": {
          "顏色": "[顏色]", 
          "服裝類型": "[類型]", 
          "剪裁版型": "[描述]", 
          "設計特點": "[描述]", 
          "材質": "[材質]", 
          "細節": "[描述]", 
          ${
            clothingType === "top"
              ? '"領子": "[描述]", "袖子": "[描述]"'
              : '"褲管": "[描述]", "裙擺": "[描述]"'
          }
        }
      }
    ]
  `;
  return prompt;
};

export { constructPromptForRecommendation, constructPromptForImageSearch, constructPromptForTextSearch }