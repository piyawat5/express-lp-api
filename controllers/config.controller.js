import prisma from "../config/prisma.js";
import createError from "../utils/createError.js";

export const getConfigs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const size = parseInt(req.query.size) || 10;
    const skip = (page - 1) * size;
    const { configTypeId } = req.query;

    const whereClause = {};
    if (configTypeId) {
      whereClause.configTypeId = configTypeId;
    }

    const [configs, total] = await Promise.all([
      prisma.config.findMany({
        where: whereClause,
        skip,
        take: size,
        include: {
          configType: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.config.count({ where: whereClause }),
    ]);

    res.json({
      data: configs,
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

export const getConfigById = async (req, res, next) => {
  try {
    const config = await prisma.config.findUnique({
      where: { id: req.params.id },
      include: {
        configType: true,
      },
    });

    if (!config) return next(createError(404, "ไม่พบ Config"));

    res.json(config);
  } catch (err) {
    next(err);
  }
};

export const createConfig = async (req, res, next) => {
  try {
    const { value, name, configTypeId } = req.body;

    if (!value || !name || !configTypeId) {
      return next(createError(400, "กรุณาระบุ value, name และ configTypeId"));
    }

    const config = await prisma.config.create({
      data: {
        value,
        name,
        configTypeId,
      },
      include: {
        configType: true,
      },
    });

    res.status(201).json(config);
  } catch (err) {
    if (err.code === "P2002") {
      return next(createError(400, "Config name ซ้ำ"));
    }
    next(err);
  }
};

export const updateConfig = async (req, res, next) => {
  try {
    const { value, name, configTypeId } = req.body;

    const config = await prisma.config.update({
      where: { id: req.params.id },
      data: {
        ...(value && { value }),
        ...(name && { name }),
        ...(configTypeId && { configTypeId }),
      },
      include: {
        configType: true,
      },
    });

    res.json(config);
  } catch (err) {
    if (err.code === "P2025") {
      return next(createError(404, "ไม่พบ Config"));
    }
    if (err.code === "P2002") {
      return next(createError(400, "Config name ซ้ำ"));
    }
    next(err);
  }
};

export const deleteConfig = async (req, res, next) => {
  try {
    await prisma.config.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "ลบ Config สำเร็จ" });
  } catch (err) {
    if (err.code === "P2025") {
      return next(createError(404, "ไม่พบ Config"));
    }
    next(err);
  }
};
