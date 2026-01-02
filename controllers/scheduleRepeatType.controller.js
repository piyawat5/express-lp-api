import createError from "../utils/createError.js";
import prisma from "../config/prisma.js";

export const getScheduleRepeatTypes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const skip = (page - 1) * size;

    const [scheduleRepeatTypes, total] = await Promise.all([
      prisma.scheduleRepeatType.findMany({
        skip,
        take: size,
        orderBy: { createdAt: "desc" },
      }),
      prisma.scheduleRepeatType.count(),
    ]);

    res.json({
      data: scheduleRepeatTypes,
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

export const getScheduleRepeatTypeById = async (req, res, next) => {
  try {
    const scheduleRepeatType = await prisma.scheduleRepeatType.findUnique({
      where: { id: req.params.id },
    });

    if (!scheduleRepeatType)
      return next(createError(404, "ไม่พบ Schedule Repeat Type"));

    res.json(scheduleRepeatType);
  } catch (err) {
    next(err);
  }
};

export const createScheduleRepeatType = async (req, res, next) => {
  try {
    const { value, name } = req.body;

    if (!value || !name) {
      return next(createError(400, "กรุณาระบุ value และ name"));
    }

    const scheduleRepeatType = await prisma.scheduleRepeatType.create({
      data: {
        value,
        name,
      },
    });

    res.status(201).json(scheduleRepeatType);
  } catch (err) {
    if (err.code === "P2002") {
      return next(createError(400, "Schedule Repeat Type name ซ้ำ"));
    }
    next(err);
  }
};

export const updateScheduleRepeatType = async (req, res, next) => {
  try {
    const { value, name } = req.body;

    const scheduleRepeatType = await prisma.scheduleRepeatType.update({
      where: { id: req.params.id },
      data: {
        ...(value && { value }),
        ...(name && { name }),
      },
    });

    res.json(scheduleRepeatType);
  } catch (err) {
    if (err.code === "P2025") {
      return next(createError(404, "ไม่พบ Schedule Repeat Type"));
    }
    if (err.code === "P2002") {
      return next(createError(400, "Schedule Repeat Type name ซ้ำ"));
    }
    next(err);
  }
};

export const deleteScheduleRepeatType = async (req, res, next) => {
  try {
    await prisma.scheduleRepeatType.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "ลบ Schedule Repeat Type สำเร็จ" });
  } catch (err) {
    if (err.code === "P2025") {
      return next(createError(404, "ไม่พบ Schedule Repeat Type"));
    }
    next(err);
  }
};
