"use client";

import toast, { Toaster, ToastBar } from "react-hot-toast";

const TOAST_DURATION_MS = 20_000; // 20 seconds

// Background: blue-tinted dark to match site (#0B2E65)
const TOAST_BG = "#1a2744";
const TOAST_SUCCESS_OUTLINE = "#10b981";
const TOAST_ERROR_OUTLINE = "#ef4444";
const TOAST_TEXT = "#E0E0E0";
const TOAST_TEXT_MUTED = "#B0B0B0";

const SuccessIcon = () => (
  <span
    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-transparent"
    style={{ borderColor: TOAST_SUCCESS_OUTLINE }}
    aria-hidden
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TOAST_SUCCESS_OUTLINE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  </span>
);

const ErrorIcon = () => (
  <span
    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 bg-transparent"
    style={{ borderColor: TOAST_ERROR_OUTLINE }}
    aria-hidden
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TOAST_ERROR_OUTLINE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  </span>
);

export default function ToasterWithClose() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      toastOptions={{
        duration: TOAST_DURATION_MS,
        style: {
          background: TOAST_BG,
          color: TOAST_TEXT,
          borderRadius: "10px",
          padding: "14px 40px 14px 14px",
          boxShadow: "0 10px 40px -10px rgba(0,0,0,0.4)",
          border: "none",
        },
        success: {
          duration: TOAST_DURATION_MS,
          style: { border: `2px solid ${TOAST_SUCCESS_OUTLINE}` },
        },
        error: {
          duration: TOAST_DURATION_MS,
          style: { border: `2px solid ${TOAST_ERROR_OUTLINE}` },
        },
      }}
    >
      {(t) => {
        const duration = typeof t.duration === "number" ? t.duration : TOAST_DURATION_MS;
        const showProgress = t.type !== "loading" && duration > 0 && duration < Infinity;
        const progressColor = t.type === "error" ? "bg-red-400/90" : t.type === "success" ? "bg-emerald-400/90" : "bg-white/50";
        return (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <span className="relative flex w-full min-w-0 items-start gap-3 pr-10">
                {t.type !== "loading" && (
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => toast.dismiss(t.id)}
                    className="absolute top-0 right-0 rounded p-1.5 transition-colors hover:bg-white/10 focus:outline-none"
                    style={{ color: TOAST_TEXT_MUTED }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                )}
                {t.type === "success" && <SuccessIcon />}
                {t.type === "error" && <ErrorIcon />}
                {t.type !== "success" && t.type !== "error" && icon}
                <span className="min-w-0 flex-1 pt-0.5 text-[15px] font-medium leading-snug" style={{ color: TOAST_TEXT }}>
                  {message}
                </span>
                {showProgress && (
                  <span
                    className={`absolute bottom-0 left-0 h-1 rounded-b-[9px] ${progressColor}`}
                    style={{
                      width: "100%",
                      animation: `toast-progress-shrink ${duration}ms linear forwards`,
                    }}
                    aria-hidden
                  />
                )}
              </span>
            )}
          </ToastBar>
        );
      }}
    </Toaster>
  );
}
