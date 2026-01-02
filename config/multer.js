import multer from "multer";

// เก็บไฟล์ไว้ในหน่วยความจำ (ไม่เขียนลงดิสก์)
const storage = multer.memoryStorage();

const upload = multer({ storage });

export default upload;
