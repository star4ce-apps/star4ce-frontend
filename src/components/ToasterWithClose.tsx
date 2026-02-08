"use client";

import toast, { Toaster, ToastBar } from "react-hot-toast";

const TOAST_DURATION_MS = 20_000; // 20 seconds

const SuccessIcon = () => (
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20" aria-hidden>
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  </span>
);

const ErrorIcon = () => (
  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/20" aria-hidden>
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
          background: "#1e293b",
          color: "#f8fafc",
          borderRadius: "12px",
          padding: "14px 36px 14px 14px",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)",
        },
        success: {
          duration: TOAST_DURATION_MS,
          iconTheme: { primary: "#10b981", secondary: "#fff" },
        },
        error: {
          duration: TOAST_DURATION_MS,
          iconTheme: { primary: "#ef4444", secondary: "#fff" },
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
              <span className="relative flex w-full min-w-0 items-start gap-3 pr-6">
                {t.type !== "loading" && (
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => toast.dismiss(t.id)}
                    className="absolute top-0 right-0 rounded-md p-1.5 text-white/70 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
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
                <span className="min-w-0 flex-1 pt-0.5 text-[15px] leading-snug text-slate-100">
                  {message}
                </span>
                {showProgress && (
                  <span
                    className={`absolute bottom-0 left-0 h-1 rounded-b-[11px] ${progressColor}`}
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
