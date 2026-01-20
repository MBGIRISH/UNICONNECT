import React from 'react';
import { X } from 'lucide-react';

export type ImageLightboxProps = {
  isOpen: boolean;
  src: string | null;
  alt?: string;
  onClose: () => void;
};

export default function ImageLightbox({ isOpen, src, alt, onClose }: ImageLightboxProps) {
  if (!isOpen || !src) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/90 flex items-center justify-center safe-top safe-bottom">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 text-white rounded-full touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Close image preview"
      >
        <X size={22} />
      </button>
      <img
        src={src}
        alt={alt || 'Preview'}
        className="max-w-[95vw] max-h-[85vh] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}


