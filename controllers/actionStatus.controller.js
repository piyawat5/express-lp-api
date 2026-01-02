import createError from "../utils/createError.js";
import prisma from "../config/prisma.js";

export const getActionStatuses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const skip = (page - 1) * size;

    const [actionStatuses, total] = await Promise.all([
      prisma.actionStatus.findMany({
        skip,
        take: size,
        orderBy: { createdAt: "desc" },
      }),
      prisma.actionStatus.count(),
    ]);

    res.json({
      data: actionStatuses,
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

export const getActionStatusById = async (req, res, next) => {
  try {
    const actionStatus = await prisma.actionStatus.findUnique({
      where: { id: req.params.id },
    });

    if (!actionStatus) return next(createError(404, "ไม่พบ Action Status"));

    res.json(actionStatus);
  } catch (err) {
    next(err);
  }
};

export const createActionStatus = async (req, res, next) => {
  try {
    const { value, name } = req.body;

    if (!value || !name) {
      return next(createError(400, "กรุณาระบุ value และ name"));
    }

    const actionStatus = await prisma.actionStatus.create({
      data: {
        value,
        name,
      },
    });

    res.status(201).json(actionStatus);
  } catch (err) {
    if (err.code === "P2002") {
      return next(createError(400, "Action Status name ซ้ำ"));
    }
    next(err);
  }
};

export const updateActionStatus = async (req, res, next) => {
  try {
    const { value, name } = req.body;

    const actionStatus = await prisma.actionStatus.update({
      where: { id: req.params.id },
      data: {
        ...(value && { value }),
        ...(name && { name }),
      },
    });

    res.json(actionStatus);
  } catch (err) {
    if (err.code === "P2025") {
      return next(createError(404, "ไม่พบ Action Status"));
    }
    if (err.code === "P2002") {
      return next(createError(400, "Action Status name ซ้ำ"));
    }
    next(err);
  }
};

export const deleteActionStatus = async (req, res, next) => {
  try {
    await prisma.actionStatus.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "ลบ Action Status สำเร็จ" });
  } catch (err) {
    if (err.code === "P2025") {
      return next(createError(404, "ไม่พบ Action Status"));
    }
    next(err);
  }
};
