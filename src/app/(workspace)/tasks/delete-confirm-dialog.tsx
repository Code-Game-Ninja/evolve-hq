// Delete confirmation dialog — glass-styled modal
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
        <>
          {/* Overlay */}
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
          >
            {/* Dialog */}
            <motion.div
              className="w-full max-w-[380px] mx-4 backdrop-blur-xl border border-[#dddddd]"
              style={{
                backgroundColor: "rgba(241,239,237,0.9)",
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
              <div className="flex justify-center mb-4">
                <div
                  className="flex items-center justify-center h-12 w-12 rounded-full"
                  style={{ backgroundColor: "rgba(239,68,68,0.1)" }}
                >
                  <Trash2
                    className="h-5 w-5"
                    style={{ color: "#ef4444" }}
                  />
                </div>
              </div>

              {/* Text */}
              <h3
                className="text-lg font-semibold text-center"
                style={{ color: "#1a1a1a" }}
              >
                Are you sure you want to delete?
              </h3>
              <p
                className="text-[13px] text-center mt-2"
                style={{ color: "#888" }}
              >
                This action cannot be undone.
              </p>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-full text-[13px] font-medium transition-all duration-200 backdrop-blur-lg border border-[#dddddd] hover:border-[#aaaaaa] hover:bg-[#e8e5e2] cursor-pointer"
                  style={{
                    backgroundColor: "rgba(241,239,237,0.45)",
                    color: "#4d4d4d",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-200 border cursor-pointer"
                  style={{
                    backgroundColor: "#ef4444",
                    borderColor: "#ef4444",
                    color: "#ffffff",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#dc2626";
                    e.currentTarget.style.borderColor = "#dc2626";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#ef4444";
                    e.currentTarget.style.borderColor = "#ef4444";
                  }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
