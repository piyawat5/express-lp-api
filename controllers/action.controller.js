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

const sendEmail = async (email, content, subject = "แจ้งเตือน") => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: `
     <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #4CAF50; margin: 0;">Life Plan</h1>
            <p style="color: #666; margin-top: 5px;">ระบบจัดการกิจกรรมของคุณ</p>
          </div>
          
          <div style="border-left: 4px solid #4CAF50; padding-left: 15px; margin: 20px 0;">
            <p style="color: #333; font-size: 16px; line-height: 1.6; white-space: pre-line;">
              ${content}
            </p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
            <p>ขอบคุณที่ใช้บริการ Life Plan</p>
            <p>หากมีข้อสงสัย กรุณาติดต่อคุณเจมส์ 0616366635</p>
          </div>
        </div>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

export const testMail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    await sendEmail(email, otp);
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
      description,
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
          "กรุณาระบุ actionTypeId, locationId และ actionStatusId",
        ),
      );
    }

    // ต้องมี userId หรือ tempUserId อย่างใดอย่างหนึ่ง
    if (!userId && !tempUserId) {
      return next(createError(400, "กรุณาระบุ userId หรือ tempUserId"));
    }

    // ห้ามมีทั้ง userId และ tempUserId
    if (userId && tempUserId) {
      return next(
        createError(400, "ไม่สามารถระบุทั้ง userId และ tempUserId พร้อมกัน"),
      );
    }

    // Validate scheduleRepeat
    if (scheduleRepeat) {
      if (!scheduleRepeat.scheduleRepeatTypeId) {
        return next(
          createError(400, "กรุณาระบุ scheduleRepeatTypeId ใน scheduleRepeat"),
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
        description: description || null,
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
      message += `วัน/เวลาเริ่ม: ${
        new Date(action.startDate).toLocaleString("th-TH").split(" ")?.[0]
      } ${action.startTime} น.\n`;
      message += `วัน/เวลาสิ้นสุด: ${
        new Date(action.endDate).toLocaleString("th-TH").split(" ")?.[0]
      } ${action.endTime} น.\n`;

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
      description,
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
        ...(description !== undefined && { description }),
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

// ฟังก์ชันสำหรับ cronjob ตรวจสอบและแจ้งเตือน actions ประจำวัน
export const checkAndNotifyDailyActions = async () => {
  try {
    // กำหนดช่วงเวลาของวันนี้ (00:00:00 - 23:59:59)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ค้นหา actions ที่มีในวันนี้
    const actions = await prisma.action.findMany({
      where: {
        startDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        user: true,
        actionType: true,
        location: true,
        notiAction: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // ถ้าไม่มี action ในวันนี้ ก็จบการทำงาน
    if (actions.length === 0) {
      return res.status(404).json({ message: "ไม่มีกิจกรรมในวันนี้" });
    }

    let message = `📱 แจ้งเตือน Event ในวันนี้\n`;
    message += `📅 วันที่: ${today.toLocaleDateString("th-TH")}\n`;
    message += `📊 จำนวน: ${lineActions.length} กิจกรรม\n\n`;
    actions.forEach((action) => {
      message += `${index + 1}. ${action.actionType.name}\n`;
      message += `   📍 ${action.location.name}\n`;
      message += `   👤 คุณ${action.user.firstName}\n`;
      message += `   🕐 ${action.startTime} - ${action.endTime} น.\n\n`;
    });

    await sendLineMessage(message);

    return res.status(200).json({ message: "แจ้งเตือนสำเร็จ" });
  } catch (err) {
    return next(createError(500, err));
  }
};

// ฟังก์ชันสำหรับเช็ค actions ที่ใกล้ถึงเวลา (ทุกๆ 30 นาที)
export const checkAndNotifyUpcomingActions = async (req, res, next) => {
  try {
    const now = new Date();

    // กำหนดช่วงเวลา 30 นาทีข้างหน้า
    const timeWindow = new Date(now.getTime() + 30 * 60 * 1000);

    // ดึงวันที่ปัจจุบัน
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ค้นหา actions ที่เริ่มในวันนี้
    const actions = await prisma.action.findMany({
      where: {
        startDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        user: true,
        actionType: true,
        location: true,
        notiAction: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    if (actions.length === 0) {
      return res.status(200).json({
        message: "ไม่มีกิจกรรมในวันนี้",
        count: 0,
      });
    }

    // กรอง actions ที่ใกล้ถึงเวลา (ภายใน 30 นาที)
    const upcomingActions = actions.filter((action) => {
      // แปลง startTime (HH:mm) เป็น Date object
      const [hours, minutes] = action.startTime.split(":").map(Number);
      const actionStartTime = new Date(action.startDate);
      actionStartTime.setHours(hours, minutes, 0, 0);

      // เช็คว่าอยู่ในช่วง now ถึง +30 นาที
      return actionStartTime >= now && actionStartTime <= timeWindow;
    });

    // ถ้าไม่มี action ที่ใกล้ถึงเวลา
    if (upcomingActions.length === 0) {
      return res.status(200).json({
        message: "ไม่มีกิจกรรมที่ใกล้ถึงเวลาในขณะนี้",
        count: 0,
        nextCheck: new Date(now.getTime() + 30 * 60 * 1000),
      });
    }

    // กรอง actions ที่ต้องแจ้งเตือนผ่าน LINE
    const lineActions = upcomingActions.filter(
      (action) => action.notiAction?.value === "LINE",
    );

    // ส่งการแจ้งเตือน LINE (รวมทุก action ใน message เดียว)
    if (lineActions.length > 0) {
      let message = `⏰ แจ้งเตือน! มีกิจกรรมใกล้เริ่มแล้ว\n`;
      message += `📊 จำนวน: ${lineActions.length} กิจกรรม\n\n`;

      lineActions.forEach((action, index) => {
        const [hours, minutes] = action.startTime.split(":").map(Number);
        const actionStartTime = new Date(action.startDate);
        actionStartTime.setHours(hours, minutes, 0, 0);

        // คำนวณเวลาที่เหลือ (นาที)
        const minutesUntilStart = Math.round(
          (actionStartTime - now) / (60 * 1000),
        );

        message += `${index + 1}. ${action.actionType.name}\n`;
        message += `   ⏱️ เหลือเวลา: ${minutesUntilStart} นาที\n`;
        message += `   📍 สถานที่: ${action.location.name}\n`;
        message += `   👤 โดย: คุณ${action.user.firstName}\n`;
        message += `   🕐 เวลา: ${action.startTime} - ${action.endTime} น.\n`;
        message += `\n`;
      });

      // ยิง LINE ครั้งเดียว
      await sendLineMessage(message);
    }

    // ส่งการแจ้งเตือน EMAIL (ถ้ามี)
    const emailActions = upcomingActions.filter(
      (action) => action.notiAction?.value === "EMAIL",
    );

    if (emailActions.length > 0) {
      for (const action of emailActions) {
        if (action.user?.email) {
          const [hours, minutes] = action.startTime.split(":").map(Number);
          const actionStartTime = new Date(action.startDate);
          actionStartTime.setHours(hours, minutes, 0, 0);

          const minutesUntilStart = Math.round(
            (actionStartTime - now) / (60 * 1000),
          );
          const subject = `⏰ แจ้งเตือน: ${action.actionType.name} อีก ${minutesUntilStart} นาที`;

          const emailContent = `เรียน คุณ${action.user.firstName}\n\n

⏰ กิจกรรมของคุณใกล้เริ่มแล้ว!\n

📋 กิจกรรม: ${action.actionType.name}\n
⏱️ เหลือเวลาอีก: ${minutesUntilStart} นาที\n
📍 สถานที่: ${action.location.name}\n
🕐 เวลา: ${action.startTime} - ${action.endTime} น.\n\n

กรุณาเตรียมตัวให้พร้อม ขอให้มีความสุขกับกิจกรรม!`;
          await sendEmail(action.user.email, emailContent, subject);
        }
      }
    }

    return res.status(200).json({
      message: "แจ้งเตือนสำเร็จ",
      count: upcomingActions.length,
      lineNotifications: lineActions.length,
      emailNotifications: emailActions.length,
      actions: upcomingActions.map((a) => ({
        id: a.id,
        title: a.actionType.name,
        startTime: a.startTime,
        location: a.location.name,
      })),
      nextCheck: new Date(now.getTime() + 30 * 60 * 1000),
    });
  } catch (err) {
    console.error("Error in checkAndNotifyUpcomingActions:", err);
    return next(createError(500, err.message));
  }
};

// ดึงกิจกรรมที่กำลังดำเนินการอยู่ในขณะนี้
export const getCurrentActions = async (req, res, next) => {
  try {
    const now = new Date();

    // กำหนดวันที่ปัจจุบัน (00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // กำหนดวันพรุ่งนี้ (00:00:00)
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // ดึง actions ที่เริ่มในวันนี้หรือก่อนหน้านี้ และยังไม่จบ (ไม่รวม scheduleRepeat)
    const actions = await prisma.action.findMany({
      where: {
        AND: [
          {
            startDate: {
              lte: now, // เริ่มก่อนหรือเท่ากับเวลาปัจจุบัน
            },
          },
          {
            OR: [
              {
                // กรณีมี endDate
                endDate: {
                  gte: today, // จบหลังหรือเท่ากับวันนี้
                },
              },
              {
                // กรณีไม่มี endDate (ใช้ startDate แทน)
                endDate: null,
                startDate: {
                  gte: today,
                  lt: tomorrow,
                },
              },
            ],
          },
          {
            scheduleRepeat: null, // ไม่รวม scheduleRepeat
          },
        ],
      },
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
        startDate: "asc",
      },
    });

    // กรองเฉพาะ actions ที่กำลังดำเนินการ (เช็คเวลา)
    const currentActions = actions.filter((action) => {
      // ถ้าไม่มี startTime หรือ endTime ให้ถือว่ากิจกรรมทั้งวัน
      if (!action.startTime || !action.endTime) {
        // เช็คว่าวันนี้อยู่ระหว่าง startDate และ endDate หรือไม่
        const startDate = new Date(action.startDate);
        startDate.setHours(0, 0, 0, 0);

        const endDate = action.endDate
          ? new Date(action.endDate)
          : new Date(action.startDate);
        endDate.setHours(23, 59, 59, 999);

        return now >= startDate && now <= endDate;
      }

      // แปลง startTime และ endTime เป็น Date object
      const [startHours, startMinutes] = action.startTime
        .split(":")
        .map(Number);
      const [endHours, endMinutes] = action.endTime.split(":").map(Number);

      const actionStartTime = new Date(action.startDate);
      actionStartTime.setHours(startHours, startMinutes, 0, 0);

      // ถ้ามี endDate ให้ใช้ endDate, ถ้าไม่มีให้ใช้ startDate
      const actionEndDateTime = action.endDate
        ? new Date(action.endDate)
        : new Date(action.startDate);
      actionEndDateTime.setHours(endHours, endMinutes, 0, 0);

      // เช็คว่าเวลาปัจจุบันอยู่ระหว่าง start และ end หรือไม่
      return now >= actionStartTime && now <= actionEndDateTime;
    });

    res.json({
      data: currentActions,
      count: currentActions.length,
      currentTime: now,
    });
  } catch (err) {
    next(err);
  }
};

// ดึงกิจกรรม 5 รายการล่าสุดของ user
export const getRecentActions = async (req, res, next) => {
  try {
    const { userId, tempUserId, limit = 5 } = req.query;

    // ต้องระบุ userId หรือ tempUserId อย่างน้อย 1 อัน
    if (!userId && !tempUserId) {
      return next(createError(400, "กรุณาระบุ userId หรือ tempUserId"));
    }

    const whereClause = {};

    // Filter ตาม userId หรือ tempUserId
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
        createdAt: "desc", // เรียงจากล่าสุด
      },
      take: parseInt(limit), // จำกัดจำนวน (default 5)
    });

    res.status(200).json({
      data: actions,
      count: actions.length,
      limit: parseInt(limit),
      message: actions.length === 0 ? "ไม่พบกิจกรรม" : "พบกิจกรรม",
    });
  } catch (err) {
    next(err);
  }
};

export const copyActions = async (req, res, next) => {
  try {
    const { actions } = req.body;

    // Validate input
    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return next(
        createError(400, "กรุณาระบุ actions ที่ต้องการ copy (array)"),
      );
    }

    // รวบรวม scheduleRepeatTypeIds ทั้งหมดที่ต้องใช้
    const scheduleRepeatTypeIds = [
      ...new Set(
        actions
          .filter((a) => a.scheduleRepeat?.scheduleRepeatTypeId)
          .map((a) => a.scheduleRepeat.scheduleRepeatTypeId),
      ),
    ];

    // Query scheduleRepeatTypes ทั้งหมดพร้อมกัน (1 query)
    const scheduleRepeatTypes = {};
    if (scheduleRepeatTypeIds.length > 0) {
      const types = await prisma.scheduleRepeatType.findMany({
        where: {
          id: {
            in: scheduleRepeatTypeIds,
          },
        },
      });
      types.forEach((type) => {
        scheduleRepeatTypes[type.id] = type;
      });
    }

    // ดึง userId/tempUserId ที่ไม่ซ้ำกัน
    const userIds = [
      ...new Set(actions.filter((a) => a.userId).map((a) => a.userId)),
    ];
    const tempUserIds = [
      ...new Set(actions.filter((a) => a.tempUserId).map((a) => a.tempUserId)),
    ];

    // ดึง existing actions ของ users เหล่านี้ทั้งหมดมาเลย (1-2 queries แทน N queries)
    const existingActionsMap = {};

    if (userIds.length > 0) {
      const existingUserActions = await prisma.action.findMany({
        where: {
          userId: {
            in: userIds,
          },
        },
        include: {
          scheduleRepeat: {
            include: {
              scheduleRepeatType: true,
            },
          },
        },
      });
      userIds.forEach((userId) => {
        existingActionsMap[`user_${userId}`] = existingUserActions.filter(
          (a) => a.userId === userId,
        );
      });
    }

    if (tempUserIds.length > 0) {
      const existingTempUserActions = await prisma.action.findMany({
        where: {
          tempUserId: {
            in: tempUserIds,
          },
        },
        include: {
          scheduleRepeat: {
            include: {
              scheduleRepeatType: true,
            },
          },
        },
      });
      tempUserIds.forEach((tempUserId) => {
        existingActionsMap[`tempUser_${tempUserId}`] =
          existingTempUserActions.filter((a) => a.tempUserId === tempUserId);
      });
    }

    // เก็บข้อมูลของแต่ละ action ที่จะสร้าง
    const actionsToCreate = [];
    const conflictDetails = [];

    // Loop เช็คทุก action
    for (let i = 0; i < actions.length; i++) {
      const actionData = actions[i];

      // Validate required fields
      if (
        !actionData.actionTypeId ||
        !actionData.locationId ||
        !actionData.actionStatusId
      ) {
        return next(
          createError(
            400,
            `Action ลำดับที่ ${i + 1}: กรุณาระบุ actionTypeId, locationId และ actionStatusId`,
          ),
        );
      }

      // ต้องมี userId หรือ tempUserId อย่างใดอย่างหนึ่ง
      if (!actionData.userId && !actionData.tempUserId) {
        return next(
          createError(
            400,
            `Action ลำดับที่ ${i + 1}: กรุณาระบุ userId หรือ tempUserId`,
          ),
        );
      }

      // ห้ามมีทั้ง userId และ tempUserId
      if (actionData.userId && actionData.tempUserId) {
        return next(
          createError(
            400,
            `Action ลำดับที่ ${i + 1}: ไม่สามารถระบุทั้ง userId และ tempUserId พร้อมกัน`,
          ),
        );
      }

      // Validate scheduleRepeat
      if (actionData.scheduleRepeat) {
        if (!actionData.scheduleRepeat.scheduleRepeatTypeId) {
          return next(
            createError(
              400,
              `Action ลำดับที่ ${i + 1}: กรุณาระบุ scheduleRepeatTypeId ใน scheduleRepeat`,
            ),
          );
        }

        // ใช้ข้อมูลที่ query มาแล้ว
        const scheduleRepeatType =
          scheduleRepeatTypes[actionData.scheduleRepeat.scheduleRepeatTypeId];
        if (scheduleRepeatType) {
          actionData.scheduleRepeat.scheduleRepeatType = scheduleRepeatType;
        }
      } else {
        // Action ครั้งเดียวต้องมี startDate
        if (!actionData.startDate) {
          return next(
            createError(400, `Action ลำดับที่ ${i + 1}: กรุณาระบุ startDate`),
          );
        }
      }

      // เช็คเวลาซ้อนกันโดยใช้ existing actions ที่ query มาแล้ว
      const targetUserId = actionData.userId || actionData.tempUserId;
      const userKey = actionData.userId
        ? `user_${actionData.userId}`
        : `tempUser_${actionData.tempUserId}`;
      const existingActions = existingActionsMap[userKey] || [];

      // เช็คเวลาซ้อนกันแบบไม่ต้อง query (ใช้ข้อมูลที่มีแล้ว)
      const hasOverlap = checkTimeOverlapInMemory(actionData, existingActions);

      if (hasOverlap) {
        const dateInfo = actionData.scheduleRepeat
          ? `รูปแบบ: ${actionData.scheduleRepeat.scheduleRepeatType?.name || "ทำซ้ำ"}`
          : `วันที่: ${actionData.startDate}${actionData.endDate && actionData.endDate !== actionData.startDate ? ` ถึง ${actionData.endDate}` : ""}`;

        const timeInfo = actionData.scheduleRepeat
          ? `เวลา: ${actionData.scheduleRepeat.timeStart} - ${actionData.scheduleRepeat.timeEnd}`
          : `เวลา: ${actionData.startTime || "ไม่ระบุ"} - ${actionData.endTime || "ไม่ระบุ"}`;

        conflictDetails.push({
          index: i + 1,
          dateInfo,
          timeInfo,
        });
      }

      actionsToCreate.push(actionData);
    }

    // ถ้ามี action ใดอันหนึ่งที่ซ้ำ ให้ reject ทั้งหมด
    if (conflictDetails.length > 0) {
      const errorMessage = conflictDetails
        .map(
          (conflict) =>
            `Action ลำดับที่ ${conflict.index}: ${conflict.dateInfo}, ${conflict.timeInfo}`,
        )
        .join("\n");

      return next(
        createError(400, `พบกิจกรรมที่มีเวลาซ้ำกัน:\n${errorMessage}`),
      );
    }

    // ถ้าไม่มีซ้ำเลย ให้สร้างทั้งหมด
    const createdActions = [];

    for (const actionData of actionsToCreate) {
      const action = await prisma.action.create({
        data: {
          userId: actionData.userId || null,
          tempUserId: actionData.tempUserId || null,
          actionTypeId: actionData.actionTypeId,
          locationId: actionData.locationId,
          startDate: actionData.startDate
            ? new Date(actionData.startDate)
            : null,
          endDate: actionData.endDate ? new Date(actionData.endDate) : null,
          startTime: actionData.startTime || null,
          endTime: actionData.endTime || null,
          notiActionId: actionData.notiActionId || null,
          actionStatusId: actionData.actionStatusId,
          description: actionData.description || null,
          ...(actionData.scheduleRepeat && {
            scheduleRepeat: {
              create: {
                scheduleRepeatTypeId:
                  actionData.scheduleRepeat.scheduleRepeatTypeId,
                month: actionData.scheduleRepeat.month || null,
                date: actionData.scheduleRepeat.date || null,
                day: actionData.scheduleRepeat.day || null,
                timeStart: actionData.scheduleRepeat.timeStart || null,
                timeEnd: actionData.scheduleRepeat.timeEnd || null,
              },
            },
          }),
          ...(actionData.inviteUsers &&
            actionData.inviteUsers.length > 0 && {
              inviteUser: {
                create: actionData.inviteUsers.map((invite) => ({
                  userId: invite.userId || null,
                  tempUserId: invite.tempUserId || null,
                  inviteStatusId: invite.inviteStatusId,
                })),
              },
            }),
          ...(actionData.attachfiles &&
            actionData.attachfiles.length > 0 && {
              attachfile: {
                create: actionData.attachfiles.map((file) => ({
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

      createdActions.push(action);
    }

    res.status(201).json({
      message: `สร้างกิจกรรมสำเร็จ ${createdActions.length} รายการ`,
      data: createdActions,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * เช็คเวลาซ้อนกันโดยใช้ existing actions ที่มีอยู่แล้ว (ไม่ต้อง query)
 */
const checkTimeOverlapInMemory = (newAction, existingActions) => {
  for (const existingAction of existingActions) {
    // กรณีที่ 1: Action ใหม่เป็นแบบครั้งเดียว vs Action เดิมแบบครั้งเดียว
    if (!newAction.scheduleRepeat && !existingAction.scheduleRepeat) {
      if (isOneTimeOverlapMemory(newAction, existingAction)) {
        return true;
      }
    }

    // กรณีที่ 2: Action ใหม่เป็นแบบครั้งเดียว vs Action เดิมแบบทำซ้ำ
    if (!newAction.scheduleRepeat && existingAction.scheduleRepeat) {
      if (
        isOneTimeVsRepeatOverlapMemory(newAction, existingAction.scheduleRepeat)
      ) {
        return true;
      }
    }

    // กรณีที่ 3: Action ใหม่เป็นแบบทำซ้ำ vs Action เดิมแบบครั้งเดียว
    if (newAction.scheduleRepeat && !existingAction.scheduleRepeat) {
      if (
        isOneTimeVsRepeatOverlapMemory(existingAction, newAction.scheduleRepeat)
      ) {
        return true;
      }
    }

    // กรณีที่ 4: Action ใหม่เป็นแบบทำซ้ำ vs Action เดิมแบบทำซ้ำ
    if (newAction.scheduleRepeat && existingAction.scheduleRepeat) {
      if (
        isRepeatVsRepeatOverlapMemory(
          newAction.scheduleRepeat,
          existingAction.scheduleRepeat,
        )
      ) {
        return true;
      }
    }
  }

  return false;
};

// Helper functions (copy from timeOverlap.js แต่รับ object แทน query)
const isOneTimeOverlapMemory = (action1, action2) => {
  const start1 = new Date(action1.startDate);
  const end1 = action1.endDate ? new Date(action1.endDate) : start1;
  const start2 = new Date(action2.startDate);
  const end2 = action2.endDate ? new Date(action2.endDate) : start2;

  if (start1 > end2 || start2 > end1) {
    return false;
  }

  if (
    !action1.startTime ||
    !action1.endTime ||
    !action2.startTime ||
    !action2.endTime
  ) {
    return true;
  }

  const datetime1Start = combineDateAndTime(start1, action1.startTime);
  const datetime1End = combineDateAndTime(end1, action1.endTime);
  const datetime2Start = combineDateAndTime(start2, action2.startTime);
  const datetime2End = combineDateAndTime(end2, action2.endTime);

  return !(datetime1End <= datetime2Start || datetime2End <= datetime1Start);
};

const isOneTimeVsRepeatOverlapMemory = (oneTimeAction, repeat) => {
  const repeatType = repeat.scheduleRepeatType?.name;
  const startDate = new Date(oneTimeAction.startDate);
  const endDate = oneTimeAction.endDate
    ? new Date(oneTimeAction.endDate)
    : startDate;

  if (repeatType === "DAILY") {
    if (
      repeat.timeStart &&
      repeat.timeEnd &&
      oneTimeAction.startTime &&
      oneTimeAction.endTime
    ) {
      let currentDate = new Date(startDate);
      const end = new Date(endDate);

      while (currentDate <= end) {
        const datetime1Start = combineDateAndTime(
          currentDate,
          oneTimeAction.startTime,
        );
        const datetime1End = combineDateAndTime(
          currentDate,
          oneTimeAction.endTime,
        );
        const datetime2Start = combineDateAndTime(
          currentDate,
          repeat.timeStart,
        );
        const datetime2End = combineDateAndTime(currentDate, repeat.timeEnd);

        if (
          !(datetime1End <= datetime2Start || datetime2End <= datetime1Start)
        ) {
          return true;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return false;
    }
    return true;
  }

  // เพิ่ม logic สำหรับ WEEKLY, MONTHLY, YEARLY ตามต้องการ
  return false;
};

const isRepeatVsRepeatOverlapMemory = (repeat1, repeat2) => {
  const type1 = repeat1.scheduleRepeatType?.name;
  const type2 = repeat2.scheduleRepeatType?.name;

  if (type1 === "DAILY" && type2 === "DAILY") {
    if (
      repeat1.timeStart &&
      repeat1.timeEnd &&
      repeat2.timeStart &&
      repeat2.timeEnd
    ) {
      return isTimeOverlapMemory(
        repeat1.timeStart,
        repeat1.timeEnd,
        repeat2.timeStart,
        repeat2.timeEnd,
      );
    }
    return true;
  }

  // เพิ่ม logic สำหรับ type อื่นๆ
  return false;
};

const isTimeOverlapMemory = (start1, end1, start2, end2) => {
  const toMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const start1Minutes = toMinutes(start1);
  const end1Minutes = toMinutes(end1);
  const start2Minutes = toMinutes(start2);
  const end2Minutes = toMinutes(end2);

  return !(end1Minutes <= start2Minutes || end2Minutes <= start1Minutes);
};
