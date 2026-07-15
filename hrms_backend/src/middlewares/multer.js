import multer from "multer";
import path from "path";
import fs from "fs";

const uploadPath = "./public/temp";
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
    cb(null, filename);
  },
});

const universalFileFilter = (req, file, cb) => {
  const allowedExtensions = [
    // Images
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".webp",
    ".svg",
    ".ico",
    ".tiff",
    // Documents
    ".pdf",
    ".doc",
    ".docx",
    ".txt",
    ".rtf",
    ".odt",
    ".xls",
    ".xlsx",
    ".csv",
    ".ppt",
    ".pptx",
    // Archives
    ".zip",
    ".rar",
    ".7z",
    // Videos
    ".mp4",
    ".avi",
    ".mov",
    ".wmv",
    ".flv",
    ".webm",
    ".mkv",
    ".m4v",
    // Audio
    ".mp3",
    ".wav",
    ".ogg",
    ".m4a",
    ".flac",
  ];

  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type ${fileExtension} is not allowed. Supported types: ${allowedExtensions.join(", ")}`,
      ),
      false,
    );
  }
};

export const upload = multer({
  storage,
  fileFilter: universalFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export const resumeUpload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedResumeTypes = [".pdf", ".doc", ".docx", ".txt", ".rtf"];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedResumeTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only PDF, DOC, DOCX, TXT, and RTF files are allowed for resumes",
        ),
        false,
      );
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});
const excelFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
    "application/vnd.ms-excel", // xls
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only Excel files (.xlsx, .xls) are allowed"), false);
  }
};

export const uploadExcel = multer({
  storage: multer.memoryStorage(),
  fileFilter: excelFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
