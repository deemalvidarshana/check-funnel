import { Mic, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const MAX_RECORDING_SIZE = 5 * 1024 * 1024;

const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(blob);
});

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

export default function IssueVoiceInput({ onRecordingComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [message, setMessage] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const stopTimer = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => () => {
    mediaRecorderRef.current?.state === "recording" && mediaRecorderRef.current.stop();
    cleanupStream();
    stopTimer();
  }, []);

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setMessage("Audio recording is not supported in this browser.");
      return;
    }

    try {
      setMessage("Requesting microphone permission...");
      chunksRef.current = [];
      setElapsedSeconds(0);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getPreferredMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data?.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstart = () => {
        setIsRecording(true);
        setMessage("Recording... click Stop Recording to upload the audio.");
        timerRef.current = window.setInterval(() => {
          setElapsedSeconds((seconds) => seconds + 1);
        }, 1000);
      };

      recorder.onerror = () => {
        setMessage("Recording failed. Please try again.");
        setIsRecording(false);
        stopTimer();
        cleanupStream();
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        stopTimer();
        cleanupStream();

        const type = recorder.mimeType || mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];

        if (!blob.size) {
          setMessage("No audio was captured. Please try again.");
          return;
        }

        if (blob.size > MAX_RECORDING_SIZE) {
          setMessage("Recording is larger than 5MB. Please record a shorter note.");
          return;
        }

        const dataUrl = await blobToDataUrl(blob);
        onRecordingComplete({
          id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: getRecordingName(type),
          size: blob.size,
          type,
          dataUrl,
          uploadedAt: new Date().toISOString(),
          source: "voice",
        });
        setMessage("Voice recording uploaded as an attachment.");
      };

      recorder.start();
    } catch {
      setMessage("Microphone permission was blocked or unavailable.");
      setIsRecording(false);
      cleanupStream();
      stopTimer();
    }
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-400">
          Voice Recording
        </p>
        <p className="mt-1 text-sm font-bold text-slate-500">
          Record audio and upload it as an attachment. No text is extracted.
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:items-end">
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-extrabold shadow-sm transition ${
            isRecording
              ? "bg-red-50 text-red-600 hover:bg-red-100"
              : "bg-blue-50 text-[#003870] hover:bg-blue-100"
          }`}
        >
          {isRecording ? (
            <Square className="h-4 w-4" strokeWidth={3} />
          ) : (
            <Mic className="h-4 w-4" strokeWidth={3} />
          )}
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>

        {message && (
          <p className="text-xs font-bold text-slate-400">
            {message}{isRecording ? ` ${elapsedSeconds}s` : ""}
          </p>
        )}
      </div>
    </div>
  );
}
