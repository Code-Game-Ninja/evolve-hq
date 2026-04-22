// CMS — Website Settings tab
"use client";

import { useState, useEffect } from "react";
import {
  Globe,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Github,
  AlertTriangle,
  Save,
  Loader2,
  Check,
  Link2,
} from "lucide-react";
import {
  inputStyle,
  textareaStyle,
  labelStyle,
  handleFocus,
  handleBlur,
} from "./dialog-styles";

// Sub-tab type
type SettingsSubTab = "general" | "contact" | "social";

const subTabs: { value: SettingsSubTab; label: string }[] = [
  { value: "general", label: "General" },
  { value: "contact", label: "Contact" },
  { value: "social", label: "Social" },
];

interface SiteSettingsData {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialLinks: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    github: string;
  };
}

const DEFAULTS: SiteSettingsData = {
  siteName: "",
  siteDescription: "",
  contactEmail: "",
  contactPhone: "",
  address: "",
  socialLinks: { facebook: "", twitter: "", instagram: "", linkedin: "", github: "" },
};

export function SettingsTab() {
  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>("general");
  const [data, setData] = useState<SiteSettingsData>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Fetch settings on mount
  useEffect(() => {
    async function fetchSettings() {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const json = await res.json();
          const merged: SiteSettingsData = { ...DEFAULTS, ...json };
          merged.socialLinks = { ...DEFAULTS.socialLinks, ...(json.socialLinks || {}) };
          setData(merged);
        }
      } catch {
        setError("Failed to load settings.");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to save");

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function setField<K extends keyof SiteSettingsData>(key: K, value: SiteSettingsData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function setSocialField(key: keyof SiteSettingsData["socialLinks"], value: string) {
    setData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [key]: value },
    }));
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="animate-pulse space-y-4 pt-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-11 rounded-full border border-[#dddddd]"
            style={{ backgroundColor: "rgba(241,239,237,0.5)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-2">
        {subTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveSubTab(tab.value)}
            className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
            style={{
              backgroundColor:
                activeSubTab === tab.value
                  ? "#1a1a1a"
                  : "rgba(255,255,255,0.5)",
              color: activeSubTab === tab.value ? "#ffffff" : "#737373",
              border: "1px solid",
              borderColor: activeSubTab === tab.value ? "#1a1a1a" : "#dddddd",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-sm text-red-600">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Section content */}
      <div
        className="p-5 border border-[#dddddd] backdrop-blur-lg space-y-5"
        style={{ backgroundColor: "rgba(241,239,237,0.45)", borderRadius: "20px" }}
      >
        {/* GENERAL */}
        {activeSubTab === "general" && (
          <div className="space-y-4">
            <SectionHeader icon={<Globe className="h-4 w-4" />} title="General" />
            <Field label="Site Name">
              <input
                style={inputStyle}
                value={data.siteName}
                onChange={(e) => setField("siteName", e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="EVOLVE"
              />
            </Field>
            <Field label="Site Description">
              <textarea
                style={textareaStyle}
                rows={3}
                value={data.siteDescription}
                onChange={(e) => setField("siteDescription", e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="Short description of the website"
              />
            </Field>
          </div>
        )}

        {/* CONTACT */}
        {activeSubTab === "contact" && (
          <div className="space-y-4">
            <SectionHeader icon={<Mail className="h-4 w-4" />} title="Contact Info" />
            <Field label="Contact Email">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: "#737373" }} />
                <input
                  style={{ ...inputStyle, paddingLeft: "36px" }}
                  type="email"
                  value={data.contactEmail}
                  onChange={(e) => setField("contactEmail", e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="info@evolve.agency"
                />
              </div>
            </Field>
            <Field label="Phone Number">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: "#737373" }} />
                <input
                  style={{ ...inputStyle, paddingLeft: "36px" }}
                  type="tel"
                  value={data.contactPhone}
                  onChange={(e) => setField("contactPhone", e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="+91 98765 43210"
                />
              </div>
            </Field>
            <Field label="Address">
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 h-3.5 w-3.5 pointer-events-none" style={{ color: "#737373" }} />
                <textarea
                  style={{ ...textareaStyle, paddingLeft: "36px" }}
                  rows={2}
                  value={data.address}
                  onChange={(e) => setField("address", e.target.value)}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Office address"
                />
              </div>
            </Field>
          </div>
        )}

        {/* SOCIAL */}
        {activeSubTab === "social" && (
          <div className="space-y-4">
            <SectionHeader icon={<Link2 className="h-4 w-4" />} title="Social Links" />
            {(
              [
                { key: "facebook", label: "Facebook", Icon: Facebook, placeholder: "https://facebook.com/evolve" },
                { key: "twitter", label: "Twitter / X", Icon: Twitter, placeholder: "https://twitter.com/evolve" },
                { key: "instagram", label: "Instagram", Icon: Instagram, placeholder: "https://instagram.com/evolve" },
                { key: "linkedin", label: "LinkedIn", Icon: Linkedin, placeholder: "https://linkedin.com/company/evolve" },
                { key: "github", label: "GitHub", Icon: Github, placeholder: "https://github.com/evolve" },
              ] as const
            ).map(({ key, label, Icon, placeholder }) => (
              <Field key={key} label={label}>
                <div className="relative">
                  <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: "#737373" }} />
                  <input
                    style={{ ...inputStyle, paddingLeft: "36px" }}
                    type="url"
                    value={data.socialLinks[key]}
                    onChange={(e) => setSocialField(key, e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                  />
                </div>
              </Field>
            ))}
          </div>
        )}

      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold text-white transition-all disabled:opacity-60"
          style={{ backgroundColor: saved ? "#22c55e" : "#f3350c" }}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving…" : saved ? "Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

// Helpers
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-1 border-b border-[#eeeeee]">
      <span style={{ color: "#f3350c" }}>{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#737373" }}>
        {title}
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}
