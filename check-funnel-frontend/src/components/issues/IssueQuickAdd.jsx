import { Check, X } from "lucide-react";
import { useState } from "react";
import IssueQuickAddTools from "./IssueQuickAddTools";

const initialForm = {
  title: "",
  notes: "",
  attachments: [],
};

export default function IssueQuickAdd({ onCancel, onSubmit }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    const title = form.title.trim();
    if (!title) {
      setError("Title is required.");
      return;
    }

    onSubmit({
      title,
      notes: form.notes.trim(),
      attachments: form.attachments,
    });
    setForm(initialForm);
    setError("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-[#003870]/15 bg-white p-4 shadow-md shadow-blue-900/5"
    >
      <input
        autoFocus
        value={form.title}
        onChange={(event) => {
          setForm((currentForm) => ({ ...currentForm, title: event.target.value }));
          setError("");
        }}
        placeholder="Issue title"
        className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-extrabold text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-[#003870] focus:bg-white"
      />
      <textarea
        value={form.notes}
        onChange={(event) => setForm((currentForm) => ({ ...currentForm, notes: event.target.value }))}
        placeholder="Description"
        rows={3}
        className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-600 outline-none transition placeholder:text-slate-300 focus:border-[#003870] focus:bg-white"
      />

      <IssueQuickAddTools
        attachments={form.attachments}
        onChange={(attachments) => setForm((currentForm) => ({ ...currentForm, attachments }))}
      />

      {error && (
        <p className="mt-2 text-xs font-bold text-red-500">
          {error}
        </p>
      )}

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-red-100 hover:bg-red-50 hover:text-red-500"
          aria-label="Cancel issue"
        >
          <X className="h-4 w-4" strokeWidth={3} />
        </button>
        <button
          type="submit"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#003870] text-white shadow-sm transition hover:bg-[#004b95]"
          aria-label="Save issue"
        >
          <Check className="h-4 w-4" strokeWidth={3} />
        </button>
      </div>
    </form>
  );
}
