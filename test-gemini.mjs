import { GoogleGenAI } from "@google/genai";
import { readFileSync } from "fs";

const envContent = readFileSync(".env.local", "utf-8");
const apiKey = envContent.split("=")[1].trim();

const ai = new GoogleGenAI({ apiKey });

async function tryModel(modelName, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: "Salom! Sen ishlayapsanmi? Bir og'iz gap bilan javob ber.",
      });
      console.log(`GEMINI JAVOBI (${modelName}):`, response.text);
      return true;
    } catch (err) {
      console.log(`Urinish ${i + 1}/${retries} - model: ${modelName} - xato:`, err.status || err.message);
      if (i < retries - 1) await new Promise((r) => setTimeout(r, 3000));
    }
  }
  return false;
}

async function main() {
  const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-2.5-flash-lite"];
  for (const model of models) {
    const ok = await tryModel(model);
    if (ok) return;
  }
  console.log("Barcha modellar band yoki xato berdi.");
}

main();