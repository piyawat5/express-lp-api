import createError from "../utils/createError.js";
import prisma from "../config/prisma.js";

export const getInviteStatuses = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const skip = (page - 1) * size;

    const [inviteStatuses, total] = await Promise.all([
      prisma.inviteStatus.findMany({
        skip,
        take: size,
        orderBy: { createdAt: "desc" },
      }),
      prisma.inviteStatus.count(),
    ]);

    res.json({
      data: inviteStatuses,
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

export const getInviteStatusById = async (req, res, next) => {
  try {
    const inviteStatus = await prisma.inviteStatus.findUnique({
      where: { id: req.params.id },
    });

    if (!inviteStatus) return next(createError(404, "ไม่พบ Invite Status"));

    res.json(inviteStatus);
  } catch (err) {
    next(err);
  }
};

export const createInviteStatus = async (req, res, next) => {
  try {
    const { value, name } = req.body;

    if (!value || !name) {
      return next(createError(400, "กรุณาระบุ value และ name"));
    }

    const inviteStatus = await prisma.inviteStatus.create({
      data: {
        value,
        name,
      },
    });

    res.status(201).json(inviteStatus);
  } catch (err) {
    if (err.code === "P2002") {
      return next(createError(400, "Invite Status name ซ้ำ"));
    }
    next(err);
  }
};

export const updateInviteStatus = async (req, res, next) => {
  try {
    const { value, name } = req.body;

    const inviteStatus = await prisma.inviteStatus.update({
      where: { id: req.params.id },
      data: {
        ...(value && { value }),
        ...(name && { name }),
      },
    });

    res.json(inviteStatus);
  } catch (err) {
    if (err.code === "P2025") {
      return next(createError(404, "ไม่พบ Invite Status"));
    }
    if (err.code === "P2002") {
      return next(createError(400, "Invite Status name ซ้ำ"));
    }
    next(err);
  }
};

export const deleteInviteStatus = async (req, res, next) => {
  try {
    await prisma.inviteStatus.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "ลบ Invite Status สำเร็จ" });
  } catch (err) {
    if (err.code === "P2025") {
      return next(createError(404, "ไม่พบ Invite Status"));
    }
    next(err);
  }
};
