import multer, { MulterError } from "multer";
import { Request } from "express";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for profile images

const allowedImageMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (allowedImageMimeTypes.has(file.mimetype)) {
    cb(null, true);
    return;
  }

  const error = new MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname);
  error.message = `Unsupported file type. Only images (JPEG, PNG, GIF, WEBP) are allowed.`;

  cb(error);
};

export const uploadProfileImage = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
}).single("profileImage");

