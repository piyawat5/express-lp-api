import prisma from "../config/prisma.js";
import createError from "../utils/createError.js";

export const inviteUsersToAction = async (req, res, next) => {
  try {
    const { actionId } = req.params;
    const { inviteUsers } = req.body;

    if (!inviteUsers || inviteUsers.length === 0) {
      return next(createError(400, "กรุณาระบุรายชื่อผู้ที่ต้องการเชิญ"));
    }

    // เช็คว่า action มีอยู่จริง
    const action = await prisma.action.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      return next(createError(404, "ไม่พบกิจกรรม"));
    }

    // สร้าง invites
    const createdInvites = await prisma.inviteUser.createMany({
      data: inviteUsers.map((invite) => ({
        actionId,
        userId: invite.userId || null,
        tempUserId: invite.tempUserId || null,
        inviteStatusId: invite.inviteStatusId,
      })),
    });

    // ดึงข้อมูล invites ที่สร้างแล้ว
    const invites = await prisma.inviteUser.findMany({
      where: { actionId },
      include: {
        user: true,
        tempUser: true,
        inviteStatus: true,
      },
    });

    res.status(201).json({
      message: `เชิญผู้ใช้สำเร็จ ${createdInvites.count} คน`,
      data: invites,
    });
  } catch (err) {
    next(err);
  }
};

export const updateInviteStatus = async (req, res, next) => {
  try {
    const { inviteStatusId } = req.body;

    if (!inviteStatusId) {
      return next(createError(400, "กรุณาระบุ inviteStatusId"));
    }

    const invite = await prisma.inviteUser.update({
      where: { id: req.params.id },
      data: {
        inviteStatusId,
      },
      include: {
        user: true,
        tempUser: true,
        inviteStatus: true,
        action: true,
      },
    });

    res.json(invite);
  } catch (err) {
    if (err.code === "P2025") {
      return next(createError(404, "ไม่พบคำเชิญ"));
    }
    next(err);
  }
};

export const deleteInvite = async (req, res, next) => {
  try {
    await prisma.inviteUser.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "ลบคำเชิญสำเร็จ" });
  } catch (err) {
    if (err.code === "P2025") {
      return next(createError(404, "ไม่พบคำเชิญ"));
    }
    next(err);
  }
};
