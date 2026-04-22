// Toast notification component for CMS
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className="pointer-events-auto flex items-center gap-2.5 px-4 py-3 backdrop-blur-xl border border-[#dddddd] shadow-lg"
              style={{
                backgroundColor:
                  t.type === "error"
                    ? "rgba(254,226,226,0.9)"
                    : "rgba(241,239,237,0.92)",
                borderRadius: "16px",
                maxWidth: "340px",
                borderColor:
                  t.type === "error" ? "rgba(239,68,68,0.3)" : "#dddddd",
              }}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {t.type === "success" && (
                <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#22c55e" }} />
              )}
              {t.type === "error" && (
                <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "#ef4444" }} />
              )}
              {t.type === "info" && (
                <AlertCircle className="h-4 w-4 shrink-0" style={{ color: "#707070" }} />
              )}

              <span className="text-[13px] font-medium flex-1" style={{ color: "#1a1a1a" }}>
                {t.message}
              </span>

              <button
                onClick={() => removeToast(t.id)}
                className="h-5 w-5 flex items-center justify-center shrink-0 rounded-full hover:bg-black/5 cursor-pointer"
              >
                <X className="h-3 w-3" style={{ color: "#737373" }} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
