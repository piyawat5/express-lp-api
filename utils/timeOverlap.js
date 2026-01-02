import prisma from "../config/prisma.js";

/**
 * เช็คว่ามีกิจกรรมที่ซ้อนเวลากันหรือไม่
 * @param {Object} params - พารามิเตอร์สำหรับเช็คเวลา
 * @param {string} params.userId - User ID (ถ้ามี)
 * @param {string} params.tempUserId - Temp User ID (ถ้ามี)
 * @param {Date} params.startDate - วันเริ่มต้น
 * @param {Date} params.endDate - วันสิ้นสุด
 * @param {string} params.startTime - เวลาเริ่มต้น (HH:mm)
 * @param {string} params.endTime - เวลาสิ้นสุด (HH:mm)
 * @param {Object} params.scheduleRepeat - ข้อมูล schedule repeat
 * @param {string} params.excludeActionId - Action ID ที่ต้องการยกเว้น (สำหรับ update)
 * @returns {Promise<boolean>} - true ถ้ามีเวลาซ้อนกัน, false ถ้าไม่มี
 */

export const checkTimeOverlap = async ({
  userId,
  tempUserId,
  startDate,
  endDate,
  startTime,
  endTime,
  scheduleRepeat,
  excludeActionId,
}) => {
  // ดึง Actions ทั้งหมดของ user คนนี้
  const existingActions = await prisma.action.findMany({
    where: {
      ...(userId && { userId }),
      ...(tempUserId && { tempUserId }),
      ...(excludeActionId && {
        id: {
          not: excludeActionId,
        },
      }),
    },
    include: {
      scheduleRepeat: {
        include: {
          scheduleRepeatType: true,
        },
      },
    },
  });

  // เช็คแต่ละ action ว่าซ้อนกันหรือไม่
  for (const existingAction of existingActions) {
    // กรณีที่ 1: Action ใหม่เป็นแบบครั้งเดียว vs Action เดิมแบบครั้งเดียว
    if (!scheduleRepeat && !existingAction.scheduleRepeat) {
      if (
        isOneTimeOverlap(
          { startDate, endDate, startTime, endTime },
          {
            startDate: existingAction.startDate,
            endDate: existingAction.endDate,
            startTime: existingAction.startTime,
            endTime: existingAction.endTime,
          }
        )
      ) {
        return true;
      }
    }

    // กรณีที่ 2: Action ใหม่เป็นแบบครั้งเดียว vs Action เดิมแบบทำซ้ำ
    if (!scheduleRepeat && existingAction.scheduleRepeat) {
      if (
        isOneTimeVsRepeatOverlap(
          { startDate, endDate, startTime, endTime },
          existingAction.scheduleRepeat
        )
      ) {
        return true;
      }
    }

    // กรณีที่ 3: Action ใหม่เป็นแบบทำซ้ำ vs Action เดิมแบบครั้งเดียว
    if (scheduleRepeat && !existingAction.scheduleRepeat) {
      if (
        isOneTimeVsRepeatOverlap(
          {
            startDate: existingAction.startDate,
            endDate: existingAction.endDate,
            startTime: existingAction.startTime,
            endTime: existingAction.endTime,
          },
          scheduleRepeat
        )
      ) {
        return true;
      }
    }

    // กรณีที่ 4: Action ใหม่เป็นแบบทำซ้ำ vs Action เดิมแบบทำซ้ำ
    if (scheduleRepeat && existingAction.scheduleRepeat) {
      if (
        isRepeatVsRepeatOverlap(scheduleRepeat, existingAction.scheduleRepeat)
      ) {
        return true;
      }
    }
  }

  return false;
};

/**
 * เช็คว่า Action แบบครั้งเดียว 2 อันซ้อนกันหรือไม่
 */
const isOneTimeOverlap = (action1, action2) => {
  const start1 = action1.startDate;
  const end1 = action1.endDate || action1.startDate;
  const start2 = action2.startDate;
  const end2 = action2.endDate || action2.startDate;

  // เช็ควันที่ซ้อนกัน
  if (start1 > end2 || start2 > end1) {
    return false;
  }

  // ถ้าไม่มีเวลาระบุ ถือว่าซ้อนกัน (เป็น all-day event)
  if (
    !action1.startTime ||
    !action1.endTime ||
    !action2.startTime ||
    !action2.endTime
  ) {
    return true;
  }

  // สร้าง DateTime รวมทั้งวันที่และเวลา
  const datetime1Start = combineDateAndTime(start1, action1.startTime);
  const datetime1End = combineDateAndTime(end1, action1.endTime);
  const datetime2Start = combineDateAndTime(start2, action2.startTime);
  const datetime2End = combineDateAndTime(end2, action2.endTime);

  // เช็คว่า datetime ซ้อนกัน
  return !(datetime1End <= datetime2Start || datetime2End <= datetime1Start);
};

/**
 * รวม Date และ Time เป็น DateTime
 */
const combineDateAndTime = (date, time) => {
  const [hours, minutes] = time.split(":").map(Number);
  const datetime = new Date(date);
  datetime.setHours(hours, minutes, 0, 0);
  return datetime;
};

/**
 * เช็คว่า Action แบบครั้งเดียว vs Action แบบทำซ้ำ ซ้อนกันหรือไม่
 */
const isOneTimeVsRepeatOverlap = (oneTimeAction, repeat) => {
  const repeatType = repeat.scheduleRepeatType?.value;

  if (repeatType === "DAILY") {
    // ทำทุกวัน - ต้องเช็คเวลา
    if (
      repeat.timeStart &&
      repeat.timeEnd &&
      oneTimeAction.startTime &&
      oneTimeAction.endTime
    ) {
      return isTimeOverlap(
        repeat.timeStart,
        repeat.timeEnd,
        oneTimeAction.startTime,
        oneTimeAction.endTime
      );
    }
    return true;
  }

  if (repeatType === "WEEKLY") {
    // ทำทุกสัปดาห์ในวันที่กำหนด
    const dayOfWeek = oneTimeAction.startDate.getDay(); // 0 = Sunday, 1 = Monday, ...
    const repeatDays = repeat.day ? repeat.day.split(",").map(Number) : [];

    if (repeatDays.includes(dayOfWeek)) {
      if (
        repeat.timeStart &&
        repeat.timeEnd &&
        oneTimeAction.startTime &&
        oneTimeAction.endTime
      ) {
        return isTimeOverlap(
          repeat.timeStart,
          repeat.timeEnd,
          oneTimeAction.startTime,
          oneTimeAction.endTime
        );
      }
      return true;
    }
    return false;
  }

  if (repeatType === "MONTHLY") {
    // ทำทุกเดือนในวันที่กำหนด
    const dateOfMonth = oneTimeAction.startDate.getDate();
    const repeatDates = repeat.date ? repeat.date.split(",").map(Number) : [];

    if (repeatDates.includes(dateOfMonth)) {
      if (
        repeat.timeStart &&
        repeat.timeEnd &&
        oneTimeAction.startTime &&
        oneTimeAction.endTime
      ) {
        return isTimeOverlap(
          repeat.timeStart,
          repeat.timeEnd,
          oneTimeAction.startTime,
          oneTimeAction.endTime
        );
      }
      return true;
    }
    return false;
  }

  if (repeatType === "YEARLY") {
    // ทำทุกปีในเดือนและวันที่กำหนด
    const month = oneTimeAction.startDate.getMonth() + 1; // 1-12
    const dateOfMonth = oneTimeAction.startDate.getDate();

    const repeatMonths = repeat.month
      ? repeat.month.split(",").map(Number)
      : [];
    const repeatDates = repeat.date ? repeat.date.split(",").map(Number) : [];

    if (repeatMonths.includes(month) && repeatDates.includes(dateOfMonth)) {
      if (
        repeat.timeStart &&
        repeat.timeEnd &&
        oneTimeAction.startTime &&
        oneTimeAction.endTime
      ) {
        return isTimeOverlap(
          repeat.timeStart,
          repeat.timeEnd,
          oneTimeAction.startTime,
          oneTimeAction.endTime
        );
      }
      return true;
    }
    return false;
  }

  return false;
};

/**
 * เช็คว่า Action แบบทำซ้ำ 2 อันซ้อนกันหรือไม่
 */
const isRepeatVsRepeatOverlap = (repeat1, repeat2) => {
  const type1 =
    repeat1.scheduleRepeatType?.value || repeat1.scheduleRepeatTypeId;
  const type2 =
    repeat2.scheduleRepeatType?.value || repeat2.scheduleRepeatTypeId;

  // ถ้าทั้งคู่เป็น DAILY
  if (type1 === "DAILY" && type2 === "DAILY") {
    if (
      repeat1.timeStart &&
      repeat1.timeEnd &&
      repeat2.timeStart &&
      repeat2.timeEnd
    ) {
      return isTimeOverlap(
        repeat1.timeStart,
        repeat1.timeEnd,
        repeat2.timeStart,
        repeat2.timeEnd
      );
    }
    return true;
  }

  // ถ้าทั้งคู่เป็น WEEKLY
  if (type1 === "WEEKLY" && type2 === "WEEKLY") {
    const days1 = repeat1.day ? repeat1.day.split(",").map(Number) : [];
    const days2 = repeat2.day ? repeat2.day.split(",").map(Number) : [];

    const hasCommonDay = days1.some((day) => days2.includes(day));

    if (hasCommonDay) {
      if (
        repeat1.timeStart &&
        repeat1.timeEnd &&
        repeat2.timeStart &&
        repeat2.timeEnd
      ) {
        return isTimeOverlap(
          repeat1.timeStart,
          repeat1.timeEnd,
          repeat2.timeStart,
          repeat2.timeEnd
        );
      }
      return true;
    }
    return false;
  }

  // ถ้าทั้งคู่เป็น MONTHLY
  if (type1 === "MONTHLY" && type2 === "MONTHLY") {
    const dates1 = repeat1.date ? repeat1.date.split(",").map(Number) : [];
    const dates2 = repeat2.date ? repeat2.date.split(",").map(Number) : [];

    const hasCommonDate = dates1.some((date) => dates2.includes(date));

    if (hasCommonDate) {
      if (
        repeat1.timeStart &&
        repeat1.timeEnd &&
        repeat2.timeStart &&
        repeat2.timeEnd
      ) {
        return isTimeOverlap(
          repeat1.timeStart,
          repeat1.timeEnd,
          repeat2.timeStart,
          repeat2.timeEnd
        );
      }
      return true;
    }
    return false;
  }

  // ถ้าทั้งคู่เป็น YEARLY
  if (type1 === "YEARLY" && type2 === "YEARLY") {
    const months1 = repeat1.month ? repeat1.month.split(",").map(Number) : [];
    const months2 = repeat2.month ? repeat2.month.split(",").map(Number) : [];
    const dates1 = repeat1.date ? repeat1.date.split(",").map(Number) : [];
    const dates2 = repeat2.date ? repeat2.date.split(",").map(Number) : [];

    const hasCommonMonth = months1.some((month) => months2.includes(month));
    const hasCommonDate = dates1.some((date) => dates2.includes(date));

    if (hasCommonMonth && hasCommonDate) {
      if (
        repeat1.timeStart &&
        repeat1.timeEnd &&
        repeat2.timeStart &&
        repeat2.timeEnd
      ) {
        return isTimeOverlap(
          repeat1.timeStart,
          repeat1.timeEnd,
          repeat2.timeStart,
          repeat2.timeEnd
        );
      }
      return true;
    }
    return false;
  }

  // กรณีที่เป็นคนละ type (เช่น DAILY vs WEEKLY)
  // ต้องเช็คละเอียดขึ้น แต่เพื่อความง่าย ถือว่าอาจซ้อนกันได้
  if (
    repeat1.timeStart &&
    repeat1.timeEnd &&
    repeat2.timeStart &&
    repeat2.timeEnd
  ) {
    return isTimeOverlap(
      repeat1.timeStart,
      repeat1.timeEnd,
      repeat2.timeStart,
      repeat2.timeEnd
    );
  }

  return true; // เพื่อความปลอดภัย ถ้าไม่แน่ใจให้ถือว่าซ้อนกัน
};

/**
 * เช็คว่าเวลา 2 ช่วงซ้อนกันหรือไม่
 * @param {string} start1 - เวลาเริ่มต้น 1 (HH:mm)
 * @param {string} end1 - เวลาสิ้นสุด 1 (HH:mm)
 * @param {string} start2 - เวลาเริ่มต้น 2 (HH:mm)
 * @param {string} end2 - เวลาสิ้นสุด 2 (HH:mm)
 */
const isTimeOverlap = (start1, end1, start2, end2) => {
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
