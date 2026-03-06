import createError from "../utils/createError.js";
import { checkTimeOverlap } from "../utils/timeOverlap.js";
import prisma from "../config/prisma.js";
import nodemailer from "nodemailer";
import { sendLineMessage } from "../utils/lineNotify.js";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const getAnalysMissAction = async (req, res, next) => {
  try {
    const LostActivity = "วิ่ง";
    const time = "06.00 am";
    const missingDays = 12;

    const messageToAi = `ช่วยวิเคราะห์หน่อยครับว่าทำไมฉันถึงขาดกิจกรรม ${LostActivity} เวลา ${time} ถึง ${missingDays} วันในเดือนนี้ และควรจัดการตัวเองอย่างไร`;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.flushHeaders();

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: messageToAi,
    });

    for await (const chunk of stream) {
      const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error(error);
    next(error);
  }
};

export const getAnalysMissAction2 = async (req, res, next) => {
  const LostActivity = "วิ่ง";
  const time = "06.00 am";
  const missingDays = 12;

  const messageToAi = `ช่วยวิเคราะห์หน่อยครับว่าทำไมฉันถึงขาดกิจกรรม ${LostActivity} เวลา ${time} ถึง ${missingDays} วันในเดือนนี้ และควรจัดการตัวเองอย่างไร`;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: messageToAi }],
        }),
      },
    );

    const data = await response.json();
    console.log(data.choices[0].message.content);
    res.json({
      reply: data,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};
