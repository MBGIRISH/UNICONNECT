// Cloudinary Image Upload Service (Alternative to Firebase Storage)
// Uses free Cloudinary tier - no billing required!

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
}

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dlnlwudgr';
const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY || '589967352537727';

type CloudinaryRawResponse = {
  secure_url: string;
  public_id: string;
  bytes: number;
  resource_type: string;
  format?: string;
};

const MAX_CHAT_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_CHAT_FILE_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_CHAT_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Allow common doc types; browsers sometimes provide empty type - we allow if size ok.
const ALLOWED_CHAT_FILE_TYPES = new Set([
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/vnd.ms-powerpoint', // ppt
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
  'application/vnd.ms-excel', // xls
  'text/plain',
]);

function assertChatImageAllowed(file: File) {
  if (!ALLOWED_CHAT_IMAGE_TYPES.has(file.type)) {
    throw new Error('Unsupported image type. Please upload JPG, PNG, or WEBP.');
  }
  if (file.size > MAX_CHAT_IMAGE_BYTES) {
    throw new Error('Image is too large. Max size is 10MB.');
  }
}

function assertChatFileAllowed(file: File) {
  if (file.size > MAX_CHAT_FILE_BYTES) {
    throw new Error('File is too large. Max size is 20MB.');
  }
  if (file.type && !ALLOWED_CHAT_FILE_TYPES.has(file.type)) {
    throw new Error('Unsupported file type. Please upload PDF, DOCX, PPTX, ZIP, TXT, or similar.');
  }
}

/**
 * Upload a single image to Cloudinary
 * Uses unsigned upload (no API secret needed)
 */
export const uploadImageToCloudinary = async (
  file: File,
  folder: string = 'uniconnect'
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'uniconnect_uploads'); // Your Cloudinary unsigned preset
    formData.append('folder', folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudinary error:', errorData);
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data: CloudinaryResponse = await response.json();
    return data.secure_url;
  } catch (error: any) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error(error.message || 'Image upload failed. Please try again.');
  }
};

/**
 * Upload a file (PDF/DOCX/PPT/ZIP/etc.) to Cloudinary as "raw"
 * NOTE: Your Cloudinary unsigned preset must allow raw uploads.
 */
export const uploadFileToCloudinary = async (
  file: File,
  folder: string = 'uniconnect'
): Promise<{ url: string; name: string; size: number; mimeType: string }> => {
  assertChatFileAllowed(file);
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'uniconnect_uploads');
    formData.append('folder', folder);
    formData.append('resource_type', 'raw');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Cloudinary raw upload error:', errorData);
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data: CloudinaryRawResponse = await response.json();
    return {
      url: data.secure_url,
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
    };
  } catch (error: any) {
    console.error('Error uploading file to Cloudinary:', error);
    throw new Error(error.message || 'File upload failed. Please try again.');
  }
};

/**
 * Chat-specific image upload (validates type/size)
 */
export const uploadChatImageToCloudinary = async (
  file: File,
  folder: string
): Promise<string> => {
  assertChatImageAllowed(file);
  return uploadImageToCloudinary(file, folder);
};

/**
 * Upload multiple images to Cloudinary
 */
export const uploadMultipleImages = async (
  files: File[],
  folder: string = 'uniconnect'
): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file => uploadImageToCloudinary(file, folder));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};

/**
 * Upload avatar image
 */
export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  return uploadImageToCloudinary(file, `uniconnect/avatars/${userId}`);
};

/**
 * Upload profile background image
 */
export const uploadBackgroundImage = async (userId: string, file: File): Promise<string> => {
  return uploadImageToCloudinary(file, `uniconnect/backgrounds/${userId}`);
};

/**
 * Upload post images
 */
export const uploadPostImages = async (postId: string, files: File[]): Promise<string[]> => {
  return uploadMultipleImages(files, `uniconnect/posts/${postId}`);
};

/**
 * Upload event cover image
 */
export const uploadEventCover = async (eventId: string, file: File): Promise<string> => {
  return uploadImageToCloudinary(file, `uniconnect/events/${eventId}`);
};

/**
 * Upload group cover image
 */
export const uploadGroupCover = async (groupId: string, file: File): Promise<string> => {
  return uploadImageToCloudinary(file, `uniconnect/groups/${groupId}`);
};

/**
 * Upload marketplace images
 */
export const uploadMarketplaceImages = async (listingId: string, files: File[]): Promise<string[]> => {
  return uploadMultipleImages(files, `uniconnect/marketplace/${listingId}`);
};

// Check if Cloudinary is configured
export const isCloudinaryConfigured = (): boolean => {
  return !!(CLOUDINARY_CLOUD_NAME && CLOUDINARY_CLOUD_NAME !== 'demo');
};

