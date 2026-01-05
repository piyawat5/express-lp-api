import createError from "../utils/createError.js";
import { checkTimeOverlap } from "../utils/timeOverlap.js";
import prisma from "../config/prisma.js";
import nodemailer from "nodemailer";
import { sendLineMessage } from "../utils/lineNotify.js";

const transporter = nodemailer.createTransport({
  host: "thsv35.hostatom.com", // หรือ mail.yourdomain.com
  port: 587, // หรือ 465
  secure: false, // true ถ้าใช้ 465
  auth: {
    user: "bot01@family-sivarom.com",
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "แจ้งเตือนกิจกรรมของคุณบนในระบบ Life Plan",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>ชื่อกิจกรรม</h2>
        <div>เรียน ผู้ใช้ที่น่ารัก,</div>
        <p>ฉันหวังว่าคุณจะสบายดี! นี่คือการแจ้งเตือนเกี่ยวกับกิจกรรมที่กำลังจะมาถึงของคุณบนระบบ Life Plan:</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const testMail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    await sendOTPEmail(email, otp);
    res.json({ message: "ส่งอีเมล OTP สำเร็จ" });
  } catch (err) {
    next(err);
  }
};

export const getActions = async (req, res, next) => {
  try {
    const { startMonth, endMonth, userId, tempUserId } = req.query;

    if (!startMonth || !endMonth) {
      return next(createError(400, "กรุณาระบุ startMonth และ endMonth"));
    }

    const startDate = new Date(startMonth);
    const endDate = new Date(endMonth);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return next(createError(400, "รูปแบบวันที่ไม่ถูกต้อง"));
    }

    const whereClause = {
      OR: [
        {
          // Actions ครั้งเดียวที่อยู่ในช่วงเวลา
          AND: [
            {
              startDate: {
                lte: endDate,
              },
            },
            {
              OR: [
                {
                  endDate: {
                    gte: startDate,
                  },
                },
                {
                  endDate: null,
                  startDate: {
                    gte: startDate,
                  },
                },
              ],
            },
            {
              scheduleRepeat: null,
            },
          ],
        },
        {
          // Actions ที่มี scheduleRepeat
          scheduleRepeat: {
            isNot: null,
          },
        },
      ],
    };

    // Filter ตาม userId หรือ tempUserId ถ้ามี
    if (userId) {
      whereClause.userId = userId;
    }
    if (tempUserId) {
      whereClause.tempUserId = tempUserId;
    }

    const actions = await prisma.action.findMany({
      where: whereClause,
      include: {
        user: true,
        tempUser: true,
        actionType: {
          include: {
            configType: true,
          },
        },
        location: {
          include: {
            configType: true,
          },
        },
        inviteUser: {
          include: {
            user: true,
            tempUser: true,
            inviteStatus: true,
          },
        },
        attachfile: true,
        notiAction: true,
        actionStatus: true,
        scheduleRepeat: {
          include: {
            scheduleRepeatType: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ data: actions });
  } catch (err) {
    next(err);
  }
};

export const getActionById = async (req, res, next) => {
  try {
    const action = await prisma.action.findUnique({
      where: { id: req.params.id },
      include: {
        user: true,
        tempUser: true,
        actionType: {
          include: {
            configType: true,
          },
        },
        location: {
          include: {
            configType: true,
          },
        },
        inviteUser: {
          include: {
            user: true,
            tempUser: true,
            inviteStatus: true,
          },
        },
        attachfile: true,
        notiAction: true,
        actionStatus: true,
        scheduleRepeat: {
          include: {
            scheduleRepeatType: true,
          },
        },
      },
    });

    if (!action) return next(createError(404, "ไม่พบกิจกรรม"));

    res.json(action);
  } catch (err) {
    next(err);
  }
};

export const createAction = async (req, res, next) => {
  try {
    const {
      userId,
      tempUserId,
      actionTypeId,
      locationId,
      startDate,
      endDate,
      startTime,
      endTime,
      inviteUsers,
      attachfiles,
      notiActionId,
      actionStatusId,
      scheduleRepeat,
    } = req.body;

    // Validate required fields
    if (!actionTypeId || !locationId || !actionStatusId) {
      return next(
        createError(
          400,
          "กรุณาระบุ actionTypeId, locationId และ actionStatusId"
        )
      );
    }

    // ต้องมี userId หรือ tempUserId อย่างใดอย่างหนึ่ง
    if (!userId && !tempUserId) {
      return next(createError(400, "กรุณาระบุ userId หรือ tempUserId"));
    }

    // ห้ามมีทั้ง userId และ tempUserId
    if (userId && tempUserId) {
      return next(
        createError(400, "ไม่สามารถระบุทั้ง userId และ tempUserId พร้อมกัน")
      );
    }

    // Validate scheduleRepeat
    if (scheduleRepeat) {
      if (!scheduleRepeat.scheduleRepeatTypeId) {
        return next(
          createError(400, "กรุณาระบุ scheduleRepeatTypeId ใน scheduleRepeat")
        );
      }

      // ดึงข้อมูล scheduleRepeatType เพื่อเอา name มาใช้
      const scheduleRepeatType = await prisma.scheduleRepeatType.findUnique({
        where: { id: scheduleRepeat.scheduleRepeatTypeId },
      });

      if (scheduleRepeatType) {
        scheduleRepeat.scheduleRepeatType = scheduleRepeatType;
      }
    } else {
      // Action ครั้งเดียวต้องมี startDate
      if (!startDate) {
        return next(createError(400, "กรุณาระบุ startDate"));
      }
    }

    // เช็คเวลาซ้อนกัน
    const targetUserId = userId || tempUserId;
    const userType = userId ? "userId" : "tempUserId";

    const hasOverlap = await checkTimeOverlap({
      [userType]: targetUserId,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      startTime,
      endTime,
      scheduleRepeat,
      excludeActionId: null,
    });

    if (hasOverlap) {
      return next(createError(400, "มีกิจกรรมที่ซ้อนเวลากันอยู่แล้ว"));
    }

    // สร้าง Action
    const action = await prisma.action.create({
      data: {
        userId: userId || null,
        tempUserId: tempUserId || null,
        actionTypeId,
        locationId,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        startTime: startTime || null,
        endTime: endTime || null,
        notiActionId: notiActionId || null,
        actionStatusId,
        ...(scheduleRepeat && {
          scheduleRepeat: {
            create: {
              scheduleRepeatTypeId: scheduleRepeat.scheduleRepeatTypeId,
              month: scheduleRepeat.month || null,
              date: scheduleRepeat.date || null,
              day: scheduleRepeat.day || null,
              timeStart: scheduleRepeat.timeStart || null,
              timeEnd: scheduleRepeat.timeEnd || null,
            },
          },
        }),
        ...(inviteUsers &&
          inviteUsers.length > 0 && {
            inviteUser: {
              create: inviteUsers.map((invite) => ({
                userId: invite.userId || null,
                tempUserId: invite.tempUserId || null,
                inviteStatusId: invite.inviteStatusId,
              })),
            },
          }),
        ...(attachfiles &&
          attachfiles.length > 0 && {
            attachfile: {
              create: attachfiles.map((file) => ({
                fileUrl: file.fileUrl,
              })),
            },
          }),
      },
      include: {
        user: true,
        tempUser: true,
        actionType: true,
        location: true,
        inviteUser: {
          include: {
            user: true,
            tempUser: true,
            inviteStatus: true,
          },
        },
        attachfile: true,
        notiAction: true,
        actionStatus: true,
        scheduleRepeat: {
          include: {
            scheduleRepeatType: true,
          },
        },
      },
    });

    const notiAction = await prisma.notiAction.findUnique({
      where: {
        id: notiActionId,
      },
    });

    // ถ้าไม่เจอจะได้ null
    if (!notiAction) {
      return next(createError(404, "NotiAction not found"));
    }

    if (notiAction.value === "LINE") {
      // ส่งไลน์
      let message = `📱Event ใหม่ถูกสร้าง\n\n`;
      message += `👤โดย: คุณ${action.user.firstName}\n`;
      message += `Title: ${action.actionType.name}\n`;
      message += `สถานที่: ${action.location.name}\n`;
      message += `วัน/เวลาเริ่ม: ${new Date(action.startDate).toLocaleString(
        "th-TH"
      )} ${action.startTime} น.\n`;
      message += `วัน/เวลาสิ้นสุด: ${new Date(action.endDate).toLocaleString(
        "th-TH"
      )} ${action.endTime} น.\n`;

      await sendLineMessage(message);
    } else if (notiAction.value === "EMAIL") {
    }

    res.status(201).json(action);
  } catch (err) {
    next(err);
  }
};

export const updateAction = async (req, res, next) => {
  try {
    const {
      actionTypeId,
      locationId,
      startDate,
      endDate,
      startTime,
      endTime,
      notiActionId,
      actionStatusId,
      scheduleRepeat,
    } = req.body;

    // ดึงข้อมูล action เดิม
    const existingAction = await prisma.action.findUnique({
      where: { id: req.params.id },
      include: {
        scheduleRepeat: true,
      },
    });

    if (!existingAction) {
      return next(createError(404, "ไม่พบกิจกรรม"));
    }

    // เช็คเวลาซ้อนกัน (ถ้ามีการแก้ไขเวลา)
    if (startDate || endDate || startTime || endTime || scheduleRepeat) {
      const targetUserId = existingAction.userId || existingAction.tempUserId;
      const userType = existingAction.userId ? "userId" : "tempUserId";

      const hasOverlap = await checkTimeOverlap({
        [userType]: targetUserId,
        startDate: startDate ? new Date(startDate) : existingAction.startDate,
        endDate: endDate ? new Date(endDate) : existingAction.endDate,
        startTime: startTime || existingAction.startTime,
        endTime: endTime || existingAction.endTime,
        scheduleRepeat: scheduleRepeat || existingAction.scheduleRepeat,
        excludeActionId: req.params.id,
      });

      if (hasOverlap) {
        return next(createError(400, "มีกิจกรรมที่ซ้อนเวลากันอยู่แล้ว"));
      }
    }

    // Update scheduleRepeat ถ้ามี
    if (scheduleRepeat !== undefined) {
      // ลบ scheduleRepeat เดิม (ถ้ามี)
      if (existingAction.scheduleRepeat) {
        await prisma.scheduleRepeat.delete({
          where: { actionId: req.params.id },
        });
      }

      // สร้างใหม่ (ถ้ามีข้อมูล)
      if (scheduleRepeat && scheduleRepeat.scheduleRepeatTypeId) {
        await prisma.scheduleRepeat.create({
          data: {
            actionId: req.params.id,
            scheduleRepeatTypeId: scheduleRepeat.scheduleRepeatTypeId,
            month: scheduleRepeat.month || null,
            date: scheduleRepeat.date || null,
            day: scheduleRepeat.day || null,
            timeStart: scheduleRepeat.timeStart || null,
            timeEnd: scheduleRepeat.timeEnd || null,
          },
        });
      }
    }

    // Update action
    const action = await prisma.action.update({
      where: { id: req.params.id },
      data: {
        ...(actionTypeId && { actionTypeId }),
        ...(locationId && { locationId }),
        ...(startDate !== undefined && {
          startDate: startDate ? new Date(startDate) : null,
        }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(notiActionId !== undefined && { notiActionId }),
        ...(actionStatusId && { actionStatusId }),
      },
      include: {
        user: true,
        tempUser: true,
        actionType: true,
        location: true,
        inviteUser: {
          include: {
            user: true,
            tempUser: true,
            inviteStatus: true,
          },
        },
        attachfile: true,
        notiAction: true,
        actionStatus: true,
        scheduleRepeat: {
          include: {
            scheduleRepeatType: true,
          },
        },
      },
    });

    res.json(action);
  } catch (err) {
    if (err.code === "P2025") {
      return next(createError(404, "ไม่พบกิจกรรม"));
    }
    next(err);
  }
};

export const deleteAction = async (req, res, next) => {
  try {
    await prisma.action.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "ลบกิจกรรมสำเร็จ" });
  } catch (err) {
    if (err.code === "P2025") {
      return next(createError(404, "ไม่พบกิจกรรม"));
    }
    next(err);
  }
};
