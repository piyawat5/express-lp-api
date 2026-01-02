import createError from "../utils/createError.js";
import prisma from "../config/prisma.js";

export const getConfigTypes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const skip = (page - 1) * size;

    const [configTypes, total] = await Promise.all([
      prisma.configType.findMany({
        skip,
        take: size,
        include: {
          config: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.configType.count(),
    ]);

    res.json({
      data: configTypes,
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

export const getConfigTypeById = async (req, res, next) => {
  try {
    const configType = await prisma.configType.findUnique({
      where: { id: req.params.id },
      include: {
        config: true,
      },
    });

    if (!configType) return next(createError(404, "ไม่พบ Config Type"));

    res.json(configType);
  } catch (err) {
    next(err);
  }
};

export const createConfigType = async (req, res, next) => {
  try {
    const { value, name } = req.body;

    if (!value || !name) {
      return next(createError(400, "กรุณาระบุ value และ name"));
    }

    const configType = await prisma.configType.create({
      data: {
        value,
        name,
      },
    });

    res.status(201).json(configType);
  } catch (err) {
    if (err.code === "P2002") {
      return next(createError(400, "Config Type name ซ้ำ"));
    }
    next(err);
  }
};

export const updateConfigType = async (req, res, next) => {
  try {
    const { value, name } = req.body;

    const configType = await prisma.configType.update({
      where: { id: req.params.id },
      data: {
        ...(value && { value }),
        ...(name && { name }),
      },
    });

    res.json(configType);
  } catch (err) {
    if (err.code === "P2025") {
      return next(createError(404, "ไม่พบ Config Type"));
    }
    if (err.code === "P2002") {
      return next(createError(400, "Config Type name ซ้ำ"));
    }
    next(err);
  }
};

export const deleteConfigType = async (req, res, next) => {
  try {
    await prisma.configType.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "ลบ Config Type สำเร็จ" });
  } catch (err) {
    if (err.code === "P2025") {
      return next(createError(404, "ไม่พบ Config Type"));
    }
    next(err);
  }
};
