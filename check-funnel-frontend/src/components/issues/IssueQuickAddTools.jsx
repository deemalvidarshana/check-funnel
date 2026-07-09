import { FileAudio, Mic, Paperclip, Square, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});

const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getPreferredMimeType = () => {
  if (!window.MediaRecorder) return "";

  const supportedTypes = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/ogg",
  ];

  return supportedTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "";
};

const getRecordingName = (mimeType) => {
  const extension = mimeType.includes("ogg") ? "ogg" : "webm";
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `voice-recording-${timestamp}.${extension}`;
};

const createAttachment = ({ name, size, type, dataUrl, source = "file" }) => ({
  id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name,
  size,
  type: type || "application/octet-stream",
  dataUrl,
  uploadedAt: new Date().toISOString(),
  source,
});

export default function IssueQuickAddTools({
  attachments = [],
  onChange,
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  useEffect(() => () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    cleanupStream();
  }, []);

  const addAttachments = (newAttachments) => {
    onChange([...attachments, ...newAttachments]);
  };

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
      acceptedAttachments.push(createAttachment({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
      }));
    }

    if (acceptedAttachments.length) addAttachments(acceptedAttachments);

    if (skippedNames.length) {
      setMessage(`Skipped files over 5MB: ${skippedNames.join(", ")}`);
    } else {
      setMessage("");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setMessage("Recording not supported.");
      return;
    }

    try {
      chunksRef.current = [];
      setMessage("Recording...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getPreferredMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstart = () => {
        setIsRecording(true);
        setMessage("Recording...");
      };

      recorder.onerror = () => {
        setIsRecording(false);
        setMessage("Recording failed.");
        cleanupStream();
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        cleanupStream();

        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];

        if (!blob.size) {
          setMessage("No audio captured.");
          return;
        }

        if (blob.size > MAX_ATTACHMENT_SIZE) {
          setMessage("Recording is over 5MB.");
          return;
        }

        const dataUrl = await blobToDataUrl(blob);
        addAttachments([createAttachment({
          name: getRecordingName(type),
          size: blob.size,
          type,
          dataUrl,
          source: "voice",
        })]);
        setMessage("Voice attached.");
      };

      recorder.start();
    } catch {
      setIsRecording(false);
      cleanupStream();
      setMessage("Mic permission blocked.");
    }
  };

  const handleRemove = (attachmentId) => {
    onChange(attachments.filter((attachment) => attachment.id !== attachmentId));
  };

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-[#003870] shadow-sm transition hover:bg-blue-50"
            aria-label="Attach file"
          >
            <Paperclip className="h-3.5 w-3.5" strokeWidth={3} />
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition ${
              isRecording
                ? "border-red-100 bg-red-50 text-red-600"
                : "border-slate-200 bg-white text-[#003870] hover:bg-blue-50"
            }`}
            aria-label={isRecording ? "Stop recording" : "Record voice"}
          >
            {isRecording ? (
              <Square className="h-3.5 w-3.5" strokeWidth={3} />
            ) : (
              <Mic className="h-3.5 w-3.5" strokeWidth={3} />
            )}
          </button>
        </div>

        {attachments.length > 0 && (
          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-extrabold text-[#003870]">
            {attachments.length} attached
          </span>
        )}
      </div>

      {message && (
        <p className="mt-2 text-xs font-bold text-slate-400">
          {message}
        </p>
      )}

      {attachments.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          {attachments.map((attachment) => {
            const Icon = attachment.type?.startsWith("audio/") ? FileAudio : Paperclip;

            return (
              <div
                key={attachment.id}
                className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-[#003870]" strokeWidth={3} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold text-slate-700">
                      {attachment.name}
                    </p>
                    <p className="text-[11px] font-bold text-slate-400">
                      {attachment.source === "voice" ? "Voice · " : ""}{formatFileSize(attachment.size)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(attachment.id)}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-red-500 shadow-sm transition hover:bg-red-50"
                  aria-label={`Remove ${attachment.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={3} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
