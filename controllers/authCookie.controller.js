import prisma from "../config/prisma.js";
import createError from "../utils/createError.js";
import bcrypt from "bcryptjs";

import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import axios from "axios";

// ------------------- function -----------------------
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "ยืนยันการสมัครสมาชิก - OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>ยืนยันการสมัครสมาชิก</h2>
        <p>รหัส OTP ของคุณคือ:</p>
        <div style="font-size: 32px; font-weight: bold; color: #4CAF50; text-align: center; padding: 20px; background: #f5f5f5; border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p>รหัสนี้จะหมดอายุใน 5 นาที</p>
        <p>หากคุณไม่ได้สมัครสมาชิก กรุณาเพิกเฉยต่ออีเมลนี้</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const register = async (req, res, next) => {
  try {
    /* 
      1.keep body
      2.check Email In DB
      3.Encrypt Password -> bcryptjs
      4.Insert into DB
      5.response
    */
    const { email, firstName, lastName, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        email: email,
      },
    });

    if (user) {
      return next(createError(409, "อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น"));
    }

    const hashPassword = bcrypt.hashSync(password, 10);
    const result = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        password: hashPassword,
      },
    });

    const { password: _, ...userWithoutPassword } = result;

    res.json({ message: "สมัครสำเร็จ!!!", user: userWithoutPassword });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(createError(401, "No token provided"));
  const token = authHeader.split(" ")[1];
  try {
    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) reject(createError(401, "token หมดอายุ"));
        else resolve(decoded);
      });
    });

    // เช็คว่ามี user ในระบบหรือยัง
    let user = await prisma.user.findFirst({
      where: { email: decoded.email },
    });

    // ถ้ายังไม่มี ให้สร้างใหม่
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: decoded.id,
          email: decoded.email,
          firstName: decoded.firstName || null,
          lastName: decoded?.lastName || null,
          avatar: decoded.avatar || null,
        },
      });
    }

    // ส่งข้อมูล user กลับไป
    res.json({
      ...decoded,
      userId: user.id,
      dbUser: user,
    });
  } catch (err) {
    next(err);
  }
};

export const authen = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next(createError(401, "No token provided"));
  const token = authHeader.split(" ")[1];
  try {
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
      if (err) {
        return next(createError(401, "token หมดอายุ"));
      }
      res.json(decoded);
    });
  } catch (err) {
    next(err);
  }
};

// ------------------------ LOGOUT ------------------------
// export const logout = async (req, res) => {
//   const refreshToken = req.cookies.jid;
//   if (refreshToken) {
//     await prisma.refreshToken.updateMany({
//       where: { tokenHash: hashRt(refreshToken) },
//       data: { revoked: true },
//     });
//   }

//   res.clearCookie("jid"); // ลบ cookie
//   res.json({ message: "Logged out" });
// };

// ------------------------ ME (ไม่ได้ใช้) ----------------------------
// export const authen = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) return next(createError(401, "No token provided"));
//   const token = authHeader.split(" ")[1];
//   try {
//     jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
//       if (err) {
//         return next(createError(401, "token หมดอายุ"));
//       }
//       res.json(decoded);
//     });
//   } catch (err) {
//     next(err);
//   }
// };

1;
