import createError from "../utils/createError.js";
import prisma from "../config/prisma.js";

export const getTempUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const skip = (page - 1) * size;

    const [tempUsers, total] = await Promise.all([
      prisma.tempUser.findMany({
        skip,
        take: size,
        orderBy: { createdAt: "desc" },
        include: {
          canEdit: {
            include: {
              user: true,
            },
          },
        },
      }),
      prisma.tempUser.count(),
    ]);

    res.json({
      data: tempUsers,
      pagination: {
        page,
        size,
        total,
        totalPages: Math.ceil(total / size),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getTempUserById = async (req, res, next) => {
  try {
    const tempUser = await prisma.tempUser.findUnique({
      where: { id: req.params.id },
      include: {
        canEdit: {
          include: {
            user: true,
          },
        },
        action: true,
        inviteUser: true,
      },
    });

    if (!tempUser) return next(createError(404, "ไม่พบ Temp User"));

    res.json(tempUser);
  } catch (err) {
    next(err);
  }
};

export const createTempUser = async (req, res, next) => {
  try {
    const { nickname, birthdate, canEditUserIds } = req.body;

    if (!nickname || !birthdate) {
      return next(createError(400, "กรุณาระบุ nickname และ birthdate"));
    }

    const tempUser = await prisma.tempUser.create({
      data: {
        nickname,
        birthdate: new Date(birthdate),
        ...(canEditUserIds &&
          canEditUserIds.length > 0 && {
            canEdit: {
              create: canEditUserIds.map((userId) => ({
                userId,
              })),
            },
          }),
      },
      include: {
        canEdit: {
          include: {
            user: true,
          },
        },
      },
    });

    res.status(201).json(tempUser);
  } catch (err) {
    next(err);
  }
};

export const updateTempUser = async (req, res, next) => {
  try {
    const { nickname, birthdate, canEditUserIds } = req.body;

    // ถ้ามี canEditUserIds ให้ลบของเก่าแล้วสร้างใหม่
    if (canEditUserIds !== undefined) {
      await prisma.canEditTempUserId.deleteMany({
        where: { tempUserId: req.params.id },
      });
    }

    const tempUser = await prisma.tempUser.update({
      where: { id: req.params.id },
      data: {
        ...(nickname && { nickname }),
        ...(birthdate && { birthdate: new Date(birthdate) }),
        ...(canEditUserIds &&
          canEditUserIds.length > 0 && {
            canEdit: {
              create: canEditUserIds.map((userId) => ({
                userId,
              })),
            },
          }),
      },
      include: {
        canEdit: {
          include: {
            user: true,
          },
        },
      },
    });

    res.json(tempUser);
  } catch (err) {
    if (err.code === "P2025") {
      return next(createError(404, "ไม่พบ Temp User"));
    }
    next(err);
  }
};

export const deleteTempUser = async (req, res, next) => {
  try {
    await prisma.tempUser.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "ลบ Temp User สำเร็จ" });
  } catch (err) {
    if (err.code === "P2025") {
      return next(createError(404, "ไม่พบ Temp User"));
    }
    next(err);
  }
};
