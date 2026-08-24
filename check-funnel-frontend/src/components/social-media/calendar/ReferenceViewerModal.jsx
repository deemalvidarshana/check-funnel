import React, { useEffect, useState } from 'react';

const getWordCount = (value) => {
  const text = String(value || '').trim();
  return text ? text.split(/\s+/).length : 0;
};

const ReferenceViewerModal = ({ isOpen, onClose, post, canEdit = false, onSave }) => {
  const [referenceText, setReferenceText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setReferenceText(post?.reelScript || '');
  }, [isOpen, post]);

  if (!isOpen) return null;

  const title = post?.visualCopy || post?.visual || post?.caption || 'Reference';

  const handleSave = async () => {
    if (!canEdit || !onSave || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(referenceText);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close reference"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <section className="relative flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
              <span className="material-symbols-outlined text-[22px] text-[#003870]">movie</span>
            <h2 className="truncate text-lg font-extrabold text-slate-900">Reference</h2>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3.5 py-2 text-[10px] font-extrabold uppercase leading-none tracking-wider text-slate-500">
              {getWordCount(referenceText)} Words
            </span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-[#003870]"
              title="Close"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-5 py-5 sm:px-6">
          <div className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Row Context</p>
            <p className="line-clamp-2 break-words text-sm font-bold leading-6 text-slate-500">{title}</p>
          </div>

          {canEdit ? (
            <textarea
              value={referenceText}
              onChange={(event) => setReferenceText(event.target.value)}
              placeholder="Enter reel reference..."
              className="min-h-[300px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-5 py-5 text-sm font-medium leading-7 text-slate-800 shadow-sm outline-none transition focus:border-[#003870] focus:ring-2 focus:ring-[#003870]/10 sm:px-6 sm:text-base sm:leading-8"
            />
          ) : referenceText.trim() ? (
            <div className="whitespace-pre-wrap break-words rounded-2xl border border-slate-200 bg-white px-5 py-5 text-sm font-medium leading-7 text-slate-800 shadow-sm sm:px-6 sm:text-base sm:leading-8">
              {referenceText}
            </div>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center">
              <span className="material-symbols-outlined text-[34px] text-slate-300">description</span>
              <p className="mt-3 text-sm font-extrabold text-slate-700">No reference available</p>
              <p className="mt-1 max-w-sm text-xs font-medium leading-5 text-slate-400">
                This row does not have a saved reel script reference yet.
              </p>
            </div>
          )}
        </div>

        {canEdit && (
          <footer className="shrink-0 border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#003870] px-5 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#002d5a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className={`material-symbols-outlined text-[19px] ${isSaving ? 'animate-spin' : ''}`}>
                {isSaving ? 'progress_activity' : 'save'}
              </span>
              {isSaving ? 'Saving...' : 'Save Reference'}
            </button>
          </footer>
        )}
      </section>
    </div>
  );
};

export default ReferenceViewerModal;
