import React from 'react';
import { FileText, Download } from 'lucide-react';

export type FileAttachment = {
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
};

function formatBytes(bytes?: number) {
  if (!bytes || bytes <= 0) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function FileAttachmentCard({ file }: { file: FileAttachment }) {
  const sizeText = formatBytes(file.size);
  const meta = [file.mimeType, sizeText].filter(Boolean).join(' • ');

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <div className="p-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0">
          <FileText size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
          {meta && <p className="text-xs text-slate-500 truncate">{meta}</p>}
        </div>
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary text-white rounded-full touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-indigo-700 transition-colors"
          aria-label="Download file"
        >
          <Download size={18} />
        </a>
      </div>
    </div>
  );
}


