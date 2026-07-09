import { Download, FileAudio, Paperclip, Trash2, Upload } from "lucide-react";

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

export default function IssueAttachmentUploader({
  attachments = [],
  onChange,
}) {
  const getAttachmentIcon = (attachment) => (
    attachment.type?.startsWith("audio/") ? FileAudio : Paperclip
  );

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    const acceptedAttachments = [];
    const skippedNames = [];

    for (const file of files) {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        skippedNames.push(file.name);
        continue;
      }

      const dataUrl = await readFileAsDataUrl(file);
      acceptedAttachments.push({
        id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        dataUrl,
        uploadedAt: new Date().toISOString(),
      });
    }

    if (acceptedAttachments.length) {
      onChange([...attachments, ...acceptedAttachments]);
    }

    if (skippedNames.length) {
      window.alert(`Some files were skipped because they are larger than 5MB: ${skippedNames.join(", ")}`);
    }
  };

  const handleRemove = (attachmentId) => {
    onChange(attachments.filter((attachment) => attachment.id !== attachmentId));
  };

  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">
            Attachments
          </p>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Upload files related to this issue.
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-extrabold text-[#003870] transition hover:border-[#003870]/30 hover:bg-blue-50">
          <Upload className="h-4 w-4" strokeWidth={3} />
          Upload File
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {attachments.length > 0 ? (
          attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#003870]">
                    {(() => {
                      const Icon = getAttachmentIcon(attachment);
                      return <Icon className="h-4 w-4" strokeWidth={3} />;
                    })()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-slate-900">
                      {attachment.name}
                    </p>
                    <p className="text-xs font-bold text-slate-400">
                      {attachment.source === "voice" ? "Voice recording · " : ""}{formatFileSize(attachment.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={attachment.dataUrl}
                    download={attachment.name}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#003870] shadow-sm transition hover:bg-blue-50"
                    aria-label={`Download ${attachment.name}`}
                  >
                    <Download className="h-4 w-4" strokeWidth={3} />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemove(attachment.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-500 shadow-sm transition hover:bg-red-50"
                    aria-label={`Remove ${attachment.name}`}
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={3} />
                  </button>
                </div>
              </div>

              {attachment.type?.startsWith("audio/") && (
                <audio
                  controls
                  src={attachment.dataUrl}
                  className="mt-3 w-full"
                >
                  <track kind="captions" />
                </audio>
              )}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm font-bold text-slate-400">
            No files uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
}
