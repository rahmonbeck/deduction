import { GoogleGenAI } from "@google/genai";
import { readFileSync, writeFileSync } from "fs";

const envContent = readFileSync(".env.local", "utf-8");
const apiKey = envContent.split("\n").find(l => l.startsWith("GEMINI_API_KEY")).split("=")[1].trim();

const ai = new GoogleGenAI({ apiKey });

async function main() {
  const interaction = await ai.interactions.create({
    model: "gemini-2.5-flash-image",
    input: "Qorong'u kutubxona xonasi, stol ustida ochiq qo'lyozma, derazadan oy yorug'i tushib turibdi, detektiv topishmoq uslubida, atmosferali",
  });

  if (interaction.output_image) {
    const buffer = Buffer.from(interaction.output_image.data, "base64");
    writeFileSync("test-rasm.png", buffer);
    console.log("RASM SAQLANDI: test-rasm.png");
  } else {
    console.log("Rasm topilmadi. To'liq javob:", JSON.stringify(interaction, null, 2));
  }
}

main().catch((err) => console.error("XATO:", err));