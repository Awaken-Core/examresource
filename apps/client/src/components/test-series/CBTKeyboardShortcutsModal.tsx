import React from 'react';

interface Props {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function CBTKeyboardShortcutsModal({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'A B C D or 1 2 3 4', desc: 'Choose that option. Square boxes accept more than one.' },
    { key: '→  N  Enter', desc: 'Save and open the next question' },
    { key: '←  P', desc: 'Previous question' },
    { key: 'F  M', desc: 'Flag this question for review' },
    { key: 'C', desc: 'Clear the current response' },
    { key: 'Enter on the conduct page', desc: 'Agree and open the questions' },
    { key: 'F11', desc: 'Toggle full screen mode' },
    { key: '?', desc: 'Open or close this guide' },
  ];

  return (
    <dialog
      open
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 w-full h-full max-w-none max-h-none border-0 m-0"
    >
      <div className="bg-surface border border-border rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h3 id="shortcuts-title" className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Keyboard Shortcuts Guide
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Shortcuts"
            className="w-7 h-7 rounded-lg bg-surface-raised border border-border text-muted hover:text-white flex items-center justify-center cursor-pointer transition text-xs"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2 max-h-[50vh] overflow-y-auto">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-surface-raised border border-border/70 text-xs"
            >
              <span className="text-slate-700 dark:text-slate-300">{sc.desc}</span>
              <kbd className="px-2 py-1 rounded-md bg-black/40 border border-border/80 font-mono text-[11px] font-bold text-white shrink-0">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 border-t border-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </dialog>
  );
}
