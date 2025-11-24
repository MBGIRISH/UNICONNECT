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

