import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const PasswordResetSchema = z.object({
  email: z.string().trim().email('Enter a valid email address').max(254),
});
export type PasswordResetInput = z.infer<typeof PasswordResetSchema>;

export const FacilityFilterSchema = z.object({
  facilityType: z.enum(['hospital', 'college', 'industrial', 'municipal', 'campus']),
  dateRange: z
    .object({
      start: z.date(),
      end: z.date(),
    })
    .refine((r) => r.end >= r.start, { message: 'End date must be after start date' }),
  modules: z.array(z.string()).min(1, 'Select at least one module'),
});
export type FacilityFilterInput = z.infer<typeof FacilityFilterSchema>;

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

interface FileCheck {
  valid: boolean;
  error?: string;
}

const MAGIC_SIGNATURES: { type: string; bytes: number[] }[] = [
  { type: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { type: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47] },
  // WebP: 'RIFF' header + 'WEBP' at offset 8
  { type: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] },
];

async function hasValidMagicBytes(file: File): Promise<boolean> {
  const buffer = await file.slice(0, 12).arrayBuffer();
  const view = new Uint8Array(buffer);
  return MAGIC_SIGNATURES.some(
    (sig) => sig.bytes.every((byte, i) => view[i] === byte) &&
      (sig.type !== 'image/webp' ||
        (view[8] === 0x57 && view[9] === 0x45 && view[10] === 0x42 && view[11] === 0x50)),
  );
}

/** Validate uploads by MIME type, size and magic bytes — never trust the client filename. */
export async function validateFileUpload(file: File): Promise<FileCheck> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG or WebP images are allowed' };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { valid: false, error: 'File must be smaller than 5 MB' };
  }
  const magicOk = await hasValidMagicBytes(file);
  return magicOk ? { valid: true } : { valid: false, error: 'File content does not match its type' };
}
