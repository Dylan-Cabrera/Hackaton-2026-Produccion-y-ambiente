import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../errors/app-error.js';

export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
export const PRODUCT_IMAGES_SUBDIR = 'products';
const PRODUCT_IMAGES_DIR = path.join(UPLOADS_DIR, PRODUCT_IMAGES_SUBDIR);

// Mismo límite que muestra el frontend (ProductImageField.jsx)
const MAX_SIZE_MB = 5;

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

fs.mkdirSync(PRODUCT_IMAGES_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: PRODUCT_IMAGES_DIR,
    // Nunca se usa el nombre original: evita path traversal y colisiones
    filename: (_req, file, cb) => cb(null, `${randomUUID()}${EXTENSION_BY_MIME[file.mimetype]}`)
  }),
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype in EXTENSION_BY_MIME) {
      cb(null, true);
    } else {
      cb(new ValidationError('La imagen tiene que ser JPG, PNG, WEBP o GIF'));
    }
  }
});

// El mimetype lo declara el cliente: se confirma con la firma real del archivo
// para no servir, por ejemplo, un HTML renombrado como .png.
function hasImageSignature(filePath: string): boolean {
  const fd = fs.openSync(filePath, 'r');
  const header = Buffer.alloc(12);
  fs.readSync(fd, header, 0, 12, 0);
  fs.closeSync(fd);

  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng = header.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  const isGif = header.subarray(0, 4).toString('ascii') === 'GIF8';
  const isWebp = header.subarray(0, 4).toString('ascii') === 'RIFF' && header.subarray(8, 12).toString('ascii') === 'WEBP';
  return isJpeg || isPng || isGif || isWebp;
}

export const uploadProductImage = (req: Request, res: Response, next: NextFunction) => {
  upload.single('image')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? `La imagen no puede superar los ${MAX_SIZE_MB} MB`
          : 'No se pudo procesar la imagen';
      return next(new ValidationError(message));
    }
    if (err) {
      return next(err);
    }
    if (!req.file) {
      return next(new ValidationError('Falta la imagen (campo "image")'));
    }
    if (!hasImageSignature(req.file.path)) {
      fs.unlinkSync(req.file.path);
      return next(new ValidationError('El archivo no es una imagen válida'));
    }
    return next();
  });
};
