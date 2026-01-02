import createError from "../utils/createError.js";
import prisma from "../config/prisma.js";

export const getNotiActions = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const skip = (page - 1) * size;

    const [notiActions, total] = await Promise.all([
      prisma.notiAction.findMany({
        skip,
        take: size,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notiAction.count(),
    ]);

    res.json({
      data: notiActions,
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

export const getNotiActionById = async (req, res, next) => {
  try {
    const notiAction = await prisma.notiAction.findUnique({
      where: { id: req.params.id },
    });

    if (!notiAction) return next(createError(404, "ไม่พบ Noti Action"));

    res.json(notiAction);
  } catch (err) {
    next(err);
  }
};

export const createNotiAction = async (req, res, next) => {
  try {
    const { value, name } = req.body;

    if (!value || !name) {
      return next(createError(400, "กรุณาระบุ value และ name"));
    }

    const notiAction = await prisma.notiAction.create({
      data: {
        value,
        name,
      },
    });

    res.status(201).json(notiAction);
  } catch (err) {
    next(err);
  }
};

export const updateNotiAction = async (req, res, next) => {
  try {
    const { value, name } = req.body;

    const notiAction = await prisma.notiAction.update({
      where: { id: req.params.id },
      data: {
        ...(value && { value }),
        ...(name && { name }),
      },
    });

    res.json(notiAction);
  } catch (err) {
    if (err.code === "P2025") {
      return next(createError(404, "ไม่พบ Noti Action"));
    }
    next(err);
  }
};

export const deleteNotiAction = async (req, res, next) => {
  try {
    await prisma.notiAction.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "ลบ Noti Action สำเร็จ" });
  } catch (err) {
    if (err.code === "P2025") {
      return next(createError(404, "ไม่พบ Noti Action"));
    }
    next(err);
  }
};
