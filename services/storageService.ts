import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebaseConfig';
import { UploadProgress } from '../types';

// Check if storage is available
const isStorageAvailable = () => {
  if (!storage) {
    throw new Error('Firebase Storage is not enabled. Image uploads are disabled. To enable, upgrade your Firebase project or wait for free tier access.');
  }
  return true;
};

// Upload avatar image
export const uploadAvatar = async (
  userId: string, 
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  isStorageAvailable();
  const storageRef = ref(storage!, `avatars/${userId}/${Date.now()}_${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.({ progress, status: 'uploading' });
      },
      (error) => {
        onProgress?.({ progress: 0, status: 'error', error: error.message });
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onProgress?.({ progress: 100, status: 'success', url: downloadURL });
        resolve(downloadURL);
      }
    );
  });
};

// Upload post images
export const uploadPostImages = async (
  postId: string,
  files: File[],
  onProgress?: (index: number, progress: UploadProgress) => void
): Promise<string[]> => {
  isStorageAvailable();
  const uploadPromises = files.map((file, index) => {
    const storageRef = ref(storage!, `posts/${postId}/${Date.now()}_${index}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(index, { progress, status: 'uploading' });
        },
        (error) => {
          onProgress?.(index, { progress: 0, status: 'error', error: error.message });
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onProgress?.(index, { progress: 100, status: 'success', url: downloadURL });
          resolve(downloadURL);
        }
      );
    });
  });

  return Promise.all(uploadPromises);
};

// Upload event cover image
export const uploadEventCover = async (
  eventId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  isStorageAvailable();
  const storageRef = ref(storage!, `events/${eventId}/${Date.now()}_${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.({ progress, status: 'uploading' });
      },
      (error) => {
        onProgress?.({ progress: 0, status: 'error', error: error.message });
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onProgress?.({ progress: 100, status: 'success', url: downloadURL });
        resolve(downloadURL);
      }
    );
  });
};

// Upload group cover image
export const uploadGroupCover = async (
  groupId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> => {
  isStorageAvailable();
  const storageRef = ref(storage!, `groups/${groupId}/${Date.now()}_${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.({ progress, status: 'uploading' });
      },
      (error) => {
        onProgress?.({ progress: 0, status: 'error', error: error.message });
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onProgress?.({ progress: 100, status: 'success', url: downloadURL });
        resolve(downloadURL);
      }
    );
  });
};

// Upload marketplace images
export const uploadMarketplaceImages = async (
  listingId: string,
  files: File[],
  onProgress?: (index: number, progress: UploadProgress) => void
): Promise<string[]> => {
  isStorageAvailable();
  const uploadPromises = files.map((file, index) => {
    const storageRef = ref(storage!, `marketplace/${listingId}/${Date.now()}_${index}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise<string>((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(index, { progress, status: 'uploading' });
        },
        (error) => {
          onProgress?.(index, { progress: 0, status: 'error', error: error.message });
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          onProgress?.(index, { progress: 100, status: 'success', url: downloadURL });
          resolve(downloadURL);
        }
      );
    });
  });

  return Promise.all(uploadPromises);
};

// Delete file from storage
export const deleteFile = async (url: string): Promise<void> => {
  try {
    isStorageAvailable();
    const fileRef = ref(storage!, url);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

type ChatUploadResult = {
  url: string;
  name: string;
  size: number;
  mimeType: string;
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Allow common doc types; users can share many file types like WhatsApp
const ALLOWED_FILE_TYPES = new Set([
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

function assertFileAllowed(file: File, kind: 'image' | 'file') {
  if (kind === 'image') {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      throw new Error('Unsupported image type. Please upload JPG, PNG, or WEBP.');
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error('Image is too large. Max size is 10MB.');
    }
  } else {
    if (file.size > MAX_FILE_BYTES) {
      throw new Error('File is too large. Max size is 20MB.');
    }
    // If we can detect the MIME type, validate. Some browsers provide empty type; allow but still size-limit.
    if (file.type && !ALLOWED_FILE_TYPES.has(file.type)) {
      throw new Error('Unsupported file type. Please upload PDF, DOCX, PPTX, ZIP, TXT, or similar.');
    }
  }
}

async function uploadToPath(
  path: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<ChatUploadResult> {
  isStorageAvailable();
  const storageRef = ref(storage!, path);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.({ progress, status: 'uploading' });
      },
      (error) => {
        onProgress?.({ progress: 0, status: 'error', error: error.message });
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onProgress?.({ progress: 100, status: 'success', url: downloadURL });
        resolve({
          url: downloadURL,
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
        });
      }
    );
  });
}

export async function uploadDirectChatImage(
  conversationId: string,
  senderId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<ChatUploadResult> {
  assertFileAllowed(file, 'image');
  const safeName = file.name.replace(/\s+/g, '_');
  return uploadToPath(
    `chat/direct/${conversationId}/${senderId}/${Date.now()}_${safeName}`,
    file,
    onProgress
  );
}

export async function uploadDirectChatFile(
  conversationId: string,
  senderId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<ChatUploadResult> {
  assertFileAllowed(file, 'file');
  const safeName = file.name.replace(/\s+/g, '_');
  return uploadToPath(
    `chat/direct/${conversationId}/${senderId}/files/${Date.now()}_${safeName}`,
    file,
    onProgress
  );
}

export async function uploadGroupChatImage(
  groupId: string,
  senderId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<ChatUploadResult> {
  assertFileAllowed(file, 'image');
  const safeName = file.name.replace(/\s+/g, '_');
  return uploadToPath(
    `chat/groups/${groupId}/${senderId}/${Date.now()}_${safeName}`,
    file,
    onProgress
  );
}

export async function uploadGroupChatFile(
  groupId: string,
  senderId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<ChatUploadResult> {
  assertFileAllowed(file, 'file');
  const safeName = file.name.replace(/\s+/g, '_');
  return uploadToPath(
    `chat/groups/${groupId}/${senderId}/files/${Date.now()}_${safeName}`,
    file,
    onProgress
  );
}

