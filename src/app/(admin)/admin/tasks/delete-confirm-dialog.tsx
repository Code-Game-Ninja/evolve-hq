// Admin Delete Confirm Dialog
"use client";

import { Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
}: DeleteConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          style={{
            backgroundColor: "rgba(0,0,0,0.4)",
            backdropFilter: "blur(4px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") onClose();
          }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-label="Confirm delete task"
            className="w-full max-w-[380px] mx-4 backdrop-blur-xl border border-[#dddddd] text-center"
            style={{
              backgroundColor: "rgba(241,239,237,0.85)",
              borderRadius: "24px",
              boxShadow: "0 24px 64px rgba(0,0,0,0.16)",
              padding: "32px",
            }}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Icon */}
            <div
              className="mx-auto mb-4 flex items-center justify-center h-12 w-12 rounded-full"
              style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
            >
              <Trash2 className="h-5 w-5" style={{ color: "#ef4444" }} />
            </div>

            <h3
              className="text-lg font-semibold mb-1"
              style={{ color: "#1a1a1a" }}
            >
              Delete Task?
            </h3>
            <p className="text-sm mb-6" style={{ color: "#888" }}>
              Are you sure you want to delete this task? This action cannot be
              undone.
            </p>

            {/* Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-full text-[13px] font-medium transition-all duration-200 backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa] hover:text-[#000000] hover:bg-[#e8e5e2] cursor-pointer"
                style={{
                  color: "#4d4d4d",
                  backgroundColor: "rgba(241,239,237,0.45)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200 border cursor-pointer hover:brightness-110"
                style={{
                  backgroundColor: "#ef4444",
                  borderColor: "#ef4444",
                  color: "#ffffff",
                }}
              >
                Delete
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
