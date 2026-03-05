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

    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: messageToAi,
    });

    // ✅ Header สำคัญมาก — บอก browser ว่านี่คือ streaming
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // ✅ flush ทันทีก่อนเลย
    res.flushHeaders();

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(text);
        // ✅ บังคับ flush ทุก chunk — สำคัญมาก!
        if (res.flush) res.flush();
      }
    }

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
