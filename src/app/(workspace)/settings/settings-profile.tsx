// Settings — Profile section (default active)
"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Lock, Camera, Loader2, Crop, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import ReactCrop, { type Crop as CropType, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import imageCompression from "browser-image-compression";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useProfile } from "@/contexts/profile-context";

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Marketing",
  "Management",
  "HR",
  "Finance",
  "Operations",
];

interface ProfileData {
  name: string;
  phone: string;
  department: string;
  bio: string;
  image: string;
}

interface SettingsProfileProps {
  user: any;
}

export function SettingsProfile({ user }: SettingsProfileProps) {
  const { update: updateSession } = useSession();
  const { refreshProfile: refreshProfileContext } = useProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const email = user?.email || "";
  const position = user?.position || user?.role || "";

  // Original data from API (set after fetch)
  const [original, setOriginal] = useState<ProfileData>({
    name: user?.name || "",
    phone: "",
    department: "",
    bio: "",
    image: user?.image || "",
  });

  // Form state
  const [name, setName] = useState(original.name);
  const [phone, setPhone] = useState(original.phone);
  const [department, setDepartment] = useState(original.department);
  const [bio, setBio] = useState(original.bio);
  const [imagePreview, setImagePreview] = useState(original.image);
  const [imageFile, setImageFile] = useState<string | null>(null); // base64 data URL
  const [imageRemoved, setImageRemoved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saveError, setSaveError] = useState("");

  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState("");
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<CropType>();
  const [cropScale, setCropScale] = useState(1);
  const [cropRotation, setCropRotation] = useState(0);
  const [compressing, setCompressing] = useState(false);
  const cropImgRef = useRef<HTMLImageElement>(null);

  const bioMax = 200;

  // Fetch real profile from API
  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      if (!res.ok) return;
      const data = await res.json();
      const profileData: ProfileData = {
        name: data.name || user?.name || "",
        phone: data.phone || "",
        department: data.department || "",
        bio: data.bio || "",
        image: data.image || "",
      };
      setOriginal(profileData);
      setName(profileData.name);
      setPhone(profileData.phone);
      setDepartment(profileData.department);
      setBio(profileData.bio);
      setImagePreview(profileData.image);
      setImageFile(null);
      setImageRemoved(false);
    } catch {
      // fallback to session data
    } finally {
      setLoadingProfile(false);
    }
  }, [user?.name]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const initials = name
    .split(" ")
    .map((n: string) => n[0] || "")
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const hasChanges = useMemo(() => {
    return (
      name !== original.name ||
      phone !== original.phone ||
      department !== original.department ||
      bio !== original.bio ||
      imageFile !== null ||
      imageRemoved
    );
  }, [name, phone, department, bio, imageFile, imageRemoved, original]);

  // Handle photo file selection — opens crop modal
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSaveError("Please select an image file.");
      return;
    }

    setSaveError("");
    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result as string);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setCropScale(1);
      setCropRotation(0);
      setCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Set initial centered crop when image loads in crop modal
  const onCropImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    const initialCrop = centerCrop(
      makeAspectCrop({ unit: "%", width: 80 }, 1, naturalWidth, naturalHeight),
      naturalWidth,
      naturalHeight
    );
    setCrop(initialCrop);
    setCompletedCrop(initialCrop);
  };

  // Extract cropped region, compress, and set as profile image
  const handleCropApply = async () => {
    if (!completedCrop || !cropImgRef.current) return;

    setCompressing(true);
    try {
      const image = cropImgRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const pixelCrop = {
        x: completedCrop.x * scaleX,
        y: completedCrop.y * scaleY,
        width: completedCrop.width * scaleX,
        height: completedCrop.height * scaleY,
      };

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.save();
      if (cropRotation !== 0) {
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((cropRotation * Math.PI) / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
      ctx.restore();

      // Canvas to blob
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.95)
      );

      // Compress with browser-image-compression
      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.8,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });

      // Convert to base64
      const base64 = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.readAsDataURL(compressed);
      });

      setImagePreview(base64);
      setImageFile(base64);
      setImageRemoved(false);
      setCropModalOpen(false);
    } catch {
      setSaveError("Failed to process image. Try a different file.");
    } finally {
      setCompressing(false);
    }
  };

  const handleRemovePhoto = () => {
    setImagePreview("");
    setImageFile(null);
    setImageRemoved(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setSaveError("Name is required.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const updates: Record<string, unknown> = {};
      if (name !== original.name) updates.name = name.trim();
      if (phone !== original.phone) updates.phone = phone.trim();
      if (department !== original.department) updates.department = department;
      if (bio !== original.bio) updates.bio = bio.trim();
      if (imageFile) updates.image = imageFile;
      else if (imageRemoved) updates.image = "";

      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error || "Failed to save changes.");
        return;
      }

      // Update session for lightweight fields only (name).
      // Image is stored in DB and fetched fresh — base64 is too large for the JWT cookie.
      if (updates.name) {
        await updateSession({ name: updates.name });
      }

      // Refresh profile context so dropdown/dashboard get updated image+name
      await refreshProfileContext();

      // Refresh original data
      await fetchProfile();
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(original.name);
    setPhone(original.phone);
    setDepartment(original.department);
    setBio(original.bio);
    setImagePreview(original.image);
    setImageFile(null);
    setImageRemoved(false);
    setSaveError("");
    setRawImageSrc("");
  };

  const inputClass =
    "w-full h-11 px-4 rounded-xl text-sm outline-none transition-all duration-200 focus:border-[rgba(255,255,255,0.3)] focus:shadow-[0_0_0_3px_rgba(255,255,255,0.05)]";
  const inputStyle: React.CSSProperties = {
    backgroundColor: "rgba(26,26,26,0.6)",
    border: "1.5px solid rgba(255,255,255,0.1)",
    color: "#ffffff",
  };
  const labelClass = "text-[13px] font-semibold block mb-1.5";

  if (loadingProfile) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="rounded-[24px] h-[120px]" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
        <div className="rounded-[24px] h-[400px]" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handlePhotoSelect}
      />

      {/* Crop Modal */}
      <Dialog open={cropModalOpen} onOpenChange={(open) => !compressing && setCropModalOpen(open)}>
        <DialogContent
          className="sm:max-w-[520px] p-0 rounded-3xl border border-[rgba(255,255,255,0.1)] overflow-hidden"
          style={{ backgroundColor: "rgba(26,26,26,0.9)" }}
          showCloseButton={!compressing}
        >
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold" style={{ color: "#ffffff" }}>
              <Crop className="h-5 w-5" style={{ color: "#f3350c" }} />
              Crop Photo
            </DialogTitle>
            <DialogDescription className="text-[13px]" style={{ color: "#a0a0a0" }}>
              Drag to adjust crop area. Image will be auto-compressed.
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pt-4 pb-2">
            {/* Crop area */}
            <div
              className="rounded-2xl overflow-hidden flex items-center justify-center"
              style={{
                backgroundColor: "#0a0a0a",
                maxHeight: "380px",
              }}
            >
              {rawImageSrc && (
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  circularCrop
                  aspect={1}
                >
                  <img
                    ref={cropImgRef}
                    src={rawImageSrc}
                    alt="Crop preview"
                    onLoad={onCropImageLoad}
                    style={{
                      maxHeight: "380px",
                      maxWidth: "100%",
                      transform: `scale(${cropScale}) rotate(${cropRotation}deg)`,
                      transition: "transform 0.2s ease",
                    }}
                  />
                </ReactCrop>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                type="button"
                onClick={() => setCropScale((s) => Math.max(0.5, s - 0.1))}
                className="h-9 w-9 rounded-full flex items-center justify-center transition-all hover:bg-[rgba(255,255,255,0.1)]"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" style={{ color: "#a0a0a0" }} />
              </button>
              <div
                className="h-1 rounded-full mx-1"
                style={{
                  width: "80px",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  position: "relative",
                }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: "#f3350c",
                    width: `${((cropScale - 0.5) / 1.5) * 100}%`,
                    transition: "width 0.2s ease",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setCropScale((s) => Math.min(2, s + 0.1))}
                className="h-9 w-9 rounded-full flex items-center justify-center transition-all hover:bg-[rgba(255,255,255,0.1)]"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" style={{ color: "#a0a0a0" }} />
              </button>
              <div className="w-px h-5 mx-1" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
              <button
                type="button"
                onClick={() => setCropRotation((r) => (r + 90) % 360)}
                className="h-9 w-9 rounded-full flex items-center justify-center transition-all hover:bg-[rgba(255,255,255,0.1)]"
                style={{ border: "1px solid rgba(255,255,255,0.1)" }}
                title="Rotate"
              >
                <RotateCw className="h-4 w-4" style={{ color: "#a0a0a0" }} />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 pb-6 pt-2">
            <button
              type="button"
              onClick={() => setCropModalOpen(false)}
              disabled={compressing}
              className="h-10 px-5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer hover:bg-[rgba(255,255,255,0.1)] disabled:opacity-50"
              style={{
                backgroundColor: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#a0a0a0",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCropApply}
              disabled={compressing || !completedCrop}
              className="h-10 px-5 rounded-full text-sm font-semibold text-white transition-all duration-200 cursor-pointer active:scale-[0.97] disabled:opacity-50 hover:shadow-[0_4px_16px_rgba(243,53,12,0.25)] flex items-center gap-2"
              style={{ backgroundColor: "#f3350c" }}
              onMouseEnter={(e) => {
                if (!compressing) e.currentTarget.style.backgroundColor = "#c82c09";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f3350c";
              }}
            >
              {compressing && <Loader2 className="h-4 w-4 animate-spin" />}
              {compressing ? "Compressing..." : "Apply"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Photo Card */}
      <motion.div custom={0} initial="hidden" animate="visible" variants={cardVariant}>
        <div
          className="rounded-[24px] p-6 backdrop-blur-lg border border-[rgba(255,255,255,0.1)]"
          style={{ backgroundColor: "rgba(26,26,26,0.6)" }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Avatar */}
            <div
              className="relative w-20 h-20 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
              style={{
                background: imagePreview ? undefined : "linear-gradient(135deg, #f3350c, #ff6b47)",
                border: "3px solid #ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[28px] font-semibold text-white">{initials}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col items-center sm:items-start gap-1">
              <h3 className="text-lg font-semibold" style={{ color: "#ffffff" }}>
                {name || "Your Name"}
              </h3>
              <p className="text-[13px]" style={{ color: "#a0a0a0" }}>
                {position} · {email}
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-8 px-4 rounded-full text-xs font-semibold text-white transition-all duration-200 cursor-pointer hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)] flex items-center gap-1.5"
                  style={{ backgroundColor: "#0a0a0a" }}
                >
                  <Camera className="h-3.5 w-3.5" />
                  Change Photo
                </button>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="h-8 px-4 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)]"
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#a0a0a0",
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-[11px] mt-1" style={{ color: "#b6b6b6" }}>
                JPG, PNG or WebP. Auto-compressed.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Personal Information Card */}
      <motion.div custom={1} initial="hidden" animate="visible" variants={cardVariant}>
        <div
          className="rounded-[24px] p-6 backdrop-blur-lg border border-[rgba(255,255,255,0.1)]"
          style={{ backgroundColor: "rgba(26,26,26,0.6)" }}
        >
          <h3 className="text-lg font-semibold mb-5" style={{ color: "#ffffff" }}>
            Personal Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-5">
            {/* Full Name */}
            <div>
              <label className={labelClass} style={{ color: "#ffffff" }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {/* Email (disabled) */}
            <div>
              <label className={labelClass} style={{ color: "#ffffff" }}>
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  disabled
                  className={inputClass}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    border: "1.5px solid rgba(255,255,255,0.1)",
                    color: "#888",
                    cursor: "not-allowed",
                  }}
                />
                <Lock
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4"
                  style={{ color: "#b6b6b6" }}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className={labelClass} style={{ color: "#ffffff" }}>
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className={inputClass}
                style={inputStyle}
              />
            </div>

            {/* Department */}
            <div>
              <label className={labelClass} style={{ color: "#ffffff" }}>
                Department
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={inputClass + " cursor-pointer"}
                style={inputStyle}
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Position (disabled) */}
            <div className="sm:col-span-2">
              <label className={labelClass} style={{ color: "#ffffff" }}>
                Position
              </label>
              <input
                type="text"
                value={position}
                disabled
                className={inputClass}
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  color: "#888",
                  cursor: "not-allowed",
                }}
              />
            </div>
          </div>

          {/* Bio */}
          <div className="mt-5">
            <label className={labelClass} style={{ color: "#ffffff" }}>
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => {
                if (e.target.value.length <= bioMax) setBio(e.target.value);
              }}
              placeholder="Tell us about yourself..."
              className="w-full min-h-[80px] px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 resize-none focus:border-[#0a0a0a] focus:shadow-[0_0_0_3px_rgba(0,0,0,0.06)]"
              style={inputStyle}
            />
            <p className="text-[11px] text-right mt-1" style={{ color: "#b6b6b6" }}>
              {bio.length} / {bioMax}
            </p>
          </div>

          {/* Error message */}
          {saveError && (
            <div
              className="px-4 py-2.5 rounded-2xl text-xs font-medium mt-4"
              style={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#ef4444" }}
            >
              {saveError}
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-6">
            <button
              onClick={handleCancel}
              disabled={!hasChanges || saving}
              className="h-10 px-6 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer hover:bg-[rgba(255,255,255,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "transparent",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#a0a0a0",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || saving}
              className="h-10 px-6 rounded-full text-sm font-semibold text-white transition-all duration-200 cursor-pointer active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_4px_16px_rgba(243,53,12,0.25)] flex items-center justify-center gap-2"
              style={{ backgroundColor: "#f3350c" }}
              onMouseEnter={(e) => {
                if (hasChanges && !saving) e.currentTarget.style.backgroundColor = "#c82c09";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f3350c";
              }}
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
