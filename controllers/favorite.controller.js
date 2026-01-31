import createError from "../utils/createError.js";
import prisma from "../config/prisma.js";

// ดึง favorites ทั้งหมดของ user
export const getFavorites = async (req, res, next) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return next(createError(400, "กรุณาระบุ userId"));
    }

    const favorites = await prisma.favorite.findMany({
      where: {
        userId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        action: {
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({ data: favorites });
  } catch (err) {
    next(err);
  }
};

// ดึง favorite ตาม id
export const getFavoriteById = async (req, res, next) => {
  try {
    const favorite = await prisma.favorite.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        action: {
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
        },
      },
    });

    if (!favorite) {
      return next(createError(404, "ไม่พบรายการโปรด"));
    }

    res.json(favorite);
  } catch (err) {
    next(err);
  }
};

// เพิ่ม favorite
export const createFavorite = async (req, res, next) => {
  try {
    const { userId, actionId } = req.body;

    // Validate required fields
    if (!userId || !actionId) {
      return next(createError(400, "กรุณาระบุ userId และ actionId"));
    }

    // เช็คว่า user มีอยู่จริงหรือไม่
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return next(createError(404, "ไม่พบผู้ใช้"));
    }

    // เช็คว่า action มีอยู่จริงหรือไม่
    const action = await prisma.action.findUnique({
      where: { id: actionId },
      include: {
        actionType: true,
        location: true,
      },
    });

    if (!action) {
      return next(createError(404, "ไม่พบกิจกรรม"));
    }

    // เช็คว่า user เคย favorite action นี้แล้วหรือยัง (ตาม actionId)
    const existingFavoriteByActionId = await prisma.favorite.findFirst({
      where: {
        userId: userId,
        actionId: actionId,
      },
    });

    if (existingFavoriteByActionId) {
      return next(createError(400, "คุณได้เพิ่มกิจกรรมนี้เป็นรายการโปรดแล้ว"));
    }

    // เช็คว่า user มี favorite ที่มี actionTypeId และ locationId เหมือนกันหรือไม่
    const existingFavoriteByTypeAndLocation = await prisma.favorite.findFirst({
      where: {
        userId: userId,
        action: {
          actionTypeId: action.actionTypeId,
          locationId: action.locationId,
        },
      },
      include: {
        action: {
          include: {
            actionType: true,
            location: true,
          },
        },
      },
    });

    if (existingFavoriteByTypeAndLocation) {
      return next(
        createError(
          400,
          `คุณมีรายการโปรดที่เป็น "${existingFavoriteByTypeAndLocation.action.actionType.name}" ที่ "${existingFavoriteByTypeAndLocation.action.location.name}" แล้ว`,
        ),
      );
    }

    // สร้าง favorite
    const favorite = await prisma.favorite.create({
      data: {
        userId: userId,
        actionId: actionId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        action: {
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
        },
      },
    });

    res.status(201).json(favorite);
  } catch (err) {
    // Handle unique constraint error
    if (err.code === "P2002") {
      return next(createError(400, "คุณได้เพิ่มกิจกรรมนี้เป็นรายการโปรดแล้ว"));
    }
    next(err);
  }
};

// ลบ favorite
export const deleteFavorite = async (req, res, next) => {
  try {
    // เช็คว่า favorite มีอยู่จริงหรือไม่
    const favorite = await prisma.favorite.findUnique({
      where: { id: req.params.id },
    });

    if (!favorite) {
      return next(createError(404, "ไม่พบรายการโปรด"));
    }

    await prisma.favorite.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "ลบรายการโปรดสำเร็จ" });
  } catch (err) {
    if (err.code === "P2025") {
      return next(createError(404, "ไม่พบรายการโปรด"));
    }
    next(err);
  }
};

// ลบ favorite ตาม userId และ actionId
export const deleteFavoriteByUserAndAction = async (req, res, next) => {
  try {
    const { userId, actionId } = req.body;

    if (!userId || !actionId) {
      return next(createError(400, "กรุณาระบุ userId และ actionId"));
    }

    const favorite = await prisma.favorite.findFirst({
      where: {
        userId: userId,
        actionId: actionId,
      },
    });

    if (!favorite) {
      return next(createError(404, "ไม่พบรายการโปรด"));
    }

    await prisma.favorite.delete({
      where: { id: favorite.id },
    });

    res.json({ message: "ลบรายการโปรดสำเร็จ" });
  } catch (err) {
    next(err);
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

    // ดึง actions ที่เริ่มในวันนี้ (ไม่รวม scheduleRepeat)
    const todayActions = await prisma.action.findMany({
      where: {
        startDate: {
          gte: today,
          lt: tomorrow,
        },
        scheduleRepeat: null,
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
    });

    // กรองเฉพาะ actions ที่กำลังดำเนินการ
    const currentActions = todayActions.filter((action) => {
      // ถ้าไม่มี startTime หรือ endTime ให้ข้าม
      if (!action.startTime || !action.endTime) {
        return false;
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
