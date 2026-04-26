"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { UserPlus, Plus, FolderPlus, BarChart3, Contact, Settings } from "lucide-react";

const quickActions = [
  { label: "Add Employee", icon: UserPlus, href: "/admin/team" },
  { label: "Client Directory", icon: Contact, href: "/crm/clients" },
  { label: "Create Task", icon: Plus, href: "/admin/tasks" },
  { label: "Manage Projects", icon: FolderPlus, href: "/admin/cms" },
  { label: "View Reports", icon: BarChart3, href: "/admin/hr" },
  { label: "Settings", icon: Settings, href: "/admin/settings" },
];

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.08 * i,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

export function QuickActions() {
  return (
    <motion.div
      custom={9}
      initial="hidden"
      animate="visible"
      variants={cardVariant as any}
      className="rounded-[32px] overflow-hidden backdrop-blur-xl border border-border p-8 shadow-2xl bg-card/30"
    >
      <div className="mb-6">
        <h2 className="text-lg font-bold text-foreground tracking-tight">Rapid Command</h2>
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest mt-0.5">Quick Access</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {quickActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <Link
              key={i}
              href={action.href}
              className="flex flex-col items-center justify-center p-6 rounded-[24px] bg-card/50 border border-border hover:bg-accent hover:border-foreground/20 transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-primary/10 transition-all">
                <Icon size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors text-center">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );
}
