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

