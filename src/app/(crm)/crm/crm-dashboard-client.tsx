// CRM Dashboard Client
"use client";

import { useState } from "react";
import { Handshake, TrendingUp, FileText, ArrowRight, MessageSquare, Plus, Zap } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { formatCurrency } from "./lead-data";

// Dynamic import for heavy charts
const CRMAnalyticsCharts = dynamic(
  () => import("./crm-charts").then((mod) => mod.CRMAnalyticsCharts),
  { 
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[300px] rounded-[32px] border border-[#dddddd] bg-[#f1efed]/20 animate-pulse" />
        <div className="h-[300px] rounded-[32px] border border-[#dddddd] bg-[#f1efed]/20 animate-pulse" />
      </div>
    ),
    ssr: false 
  }
);

interface CrmStats {
  totalLeads: number;
  openDeals: number;
  wonDeals: number;
  newInquiries: number;
  pipelineValue: number;
}

export function CrmDashboardClient({ initialData }: { initialData: CrmStats }) {
  const [stats] = useState(initialData);

  const statsConfig = [
    { label: "Total Leads", value: stats.totalLeads, icon: TrendingUp, color: "#f3350c", href: "/crm/leads" },
    { label: "New Inquiries", value: stats.newInquiries, icon: MessageSquare, color: "#1a1a1a", href: "/crm/inquiries" },
    { label: "Open Deals", value: stats.openDeals, icon: Handshake, color: "#f3350c", href: "/crm/leads" },
    { label: "Pipeline Value", value: formatCurrency(stats.pipelineValue), icon: FileText, color: "#0a0a0a", href: "/crm/leads" },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1a1a1a]">CRM Dashboard</h1>
          <p className="text-sm text-[#999] mt-1">
            Real-time insights into your sales pipeline and agency growth
          </p>
        </div>

        <div className="flex items-center gap-3">
           <Link 
            href="/crm/leads"
            className="flex items-center gap-2 bg-[#1a1a1a] text-white px-5 py-3 rounded-2xl text-sm font-bold hover:bg-[#333] transition-all shadow-lg shadow-black/10"
          >
            <Plus className="h-4 w-4" />
            New Lead
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsConfig.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-[32px] border border-[#dddddd] backdrop-blur-lg p-6 hover:border-[#aaaaaa] hover:shadow-xl transition-all duration-300"
            style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase tracking-widest text-[#999] group-hover:text-[#666] transition-colors">
                {stat.label}
              </span>
              <div
                className="h-10 w-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300"
                style={{ backgroundColor: `${stat.color}10` }}
              >
                <stat.icon
                  className="h-5 w-5"
                  style={{ color: stat.color }}
                />
              </div>
            </div>
            <p className="text-3xl font-bold text-[#1a1a1a]">
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      {/* Analytics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#f3350c]" />
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#999]">Intelligence Dashboard</h2>
        </div>
        <CRMAnalyticsCharts />
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions / Pipeline Info */}
        <div 
          className="lg:col-span-2 rounded-[40px] border border-[#dddddd] p-10 overflow-hidden relative group"
          style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
        >
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-[#1a1a1a] mb-3">Master Your Pipeline</h2>
            <p className="text-base text-[#666] mb-10 max-w-md leading-relaxed">
              Track leads through every stage of your sales funnel. Current active pipeline holds <span className="font-bold text-[#1a1a1a]">{formatCurrency(stats.pipelineValue)}</span> in potential revenue.
            </p>
            
            <Link 
              href="/crm/leads"
              className="inline-flex items-center gap-3 bg-[#f3350c] text-white px-8 py-4 rounded-2xl text-sm font-bold hover:bg-[#d02d0a] transition-all group/btn shadow-xl shadow-[#f3350c]/20"
            >
              Open Pipeline Board
              <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          {/* Decorative element */}
          <div className="absolute right-[-40px] bottom-[-40px] opacity-[0.03] pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-700">
            <TrendingUp size={400} strokeWidth={1} />
          </div>
        </div>

        {/* Support/Inquiries Card */}
        <div 
          className="rounded-[40px] border border-[#dddddd] p-10 flex flex-col relative overflow-hidden"
          style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
        >
          <div className="h-14 w-14 rounded-2xl bg-[#1a1a1a] flex items-center justify-center mb-8 shadow-lg shadow-black/10">
            <MessageSquare className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-3">Active Inquiries</h2>
          <p className="text-base text-[#666] mb-10 flex-1 leading-relaxed">
            {stats.newInquiries > 0 
              ? `You have ${stats.newInquiries} unread submissions from potential clients. Prompt response increases conversion by 40%.`
              : "All clear! You've handled all recent client inquiries from the website contact forms."}
          </p>
          
          <Link 
            href="/crm/inquiries"
            className="flex items-center justify-center gap-2 w-full border-2 border-[#1a1a1a] bg-transparent px-5 py-4 rounded-2xl text-sm font-bold text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all"
          >
            Inbox Management
          </Link>
        </div>
      </div>
    </div>
  );
}
