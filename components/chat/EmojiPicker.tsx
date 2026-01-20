import React, { useMemo } from 'react';

const DEFAULT_EMOJIS = [
  '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😍','😘','😜','🤔','😎','🥳','😴',
  '👍','👎','👏','🙌','🙏','💪','🔥','✨','💯','❤️','💙','💚','💛','💜','🖤','🤍',
  '🎉','🎊','🎓','📚','📌','✅','❌','⭐','🌟','💡','🧠','🫶'
];

export type EmojiPickerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
};

export default function EmojiPicker({ isOpen, onClose, onSelect }: EmojiPickerProps) {
  const emojis = useMemo(() => DEFAULT_EMOJIS, []);
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop (mobile friendly) */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed z-50 bottom-24 left-3 right-3 sm:left-4 sm:right-auto sm:w-[320px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Emojis</p>
          <button
            onClick={onClose}
            className="px-2 py-1 text-xs text-slate-500 hover:text-slate-700 touch-manipulation min-h-[32px]"
          >
            Close
          </button>
        </div>
        <div className="p-3 max-h-56 overflow-y-auto">
          <div className="grid grid-cols-8 gap-1.5">
            {emojis.map((e) => (
              <button
                key={e}
                onClick={() => onSelect(e)}
                className="text-xl hover:bg-slate-50 rounded-lg p-2 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={`Emoji ${e}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}


