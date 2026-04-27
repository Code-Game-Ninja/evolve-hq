// Deals Client — Shows won and lost deals
"use client";

import { useState, useMemo } from "react";
import { Handshake, TrendingUp, TrendingDown, Search, Calendar, Building2, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { type Lead, formatCurrency } from "../lead-data";

interface DealsClientProps {
  wonDeals: Lead[];
  lostDeals: Lead[];
}

export function DealsClient({ wonDeals, lostDeals }: DealsClientProps) {
  const [activeTab, setActiveTab] = useState<"won" | "lost">("won");
  const [search, setSearch] = useState("");

  const deals = activeTab === "won" ? wonDeals : lostDeals;
  
  const filteredDeals = useMemo(() => {
    if (!search) return deals;
    const q = search.toLowerCase();
    return deals.filter(d => 
      d.name.toLowerCase().includes(q) || 
      d.company?.toLowerCase().includes(q)
    );
  }, [deals, search]);

  const totalValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const lostValue = lostDeals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Handshake className="h-5 w-5 text-[#f3350c]" />
            <h1 className="text-2xl font-bold" style={{ color: "#ffffff" }}>Deals</h1>
          </div>
          <p className="text-sm" style={{ color: "#a0a0a0" }}>Closed opportunities and deal history</p>
        </div>

        <Link 
          href="/crm/leads"
          className="flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: "#a0a0a0" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Pipeline
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setActiveTab("won")}
          className={`rounded-[24px] border p-6 text-left transition-all ${
            activeTab === "won" 
              ? "" 
              : "hover:bg-white/5"
          }`}
          style={{
            borderColor: activeTab === "won" ? "#12b76a" : "rgba(255,255,255,0.1)",
            backgroundColor: activeTab === "won" ? "rgba(18,183,106,0.1)" : "rgba(26,26,26,0.6)"
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(18,183,106,0.1)" }}>
              <TrendingUp className="h-4 w-4" style={{ color: "#12b76a" }} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#a0a0a0" }}>Won Deals</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: "#ffffff" }}>{wonDeals.length}</p>
          <p className="text-sm font-medium" style={{ color: "#12b76a" }}>{formatCurrency(totalValue)}</p>
        </button>

        <button
          onClick={() => setActiveTab("lost")}
          className={`rounded-[24px] border p-6 text-left transition-all ${
            activeTab === "lost" 
              ? "" 
              : "hover:bg-white/5"
          }`}
          style={{
            borderColor: activeTab === "lost" ? "#ef4444" : "rgba(255,255,255,0.1)",
            backgroundColor: activeTab === "lost" ? "rgba(239,68,68,0.1)" : "rgba(26,26,26,0.6)"
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(239,68,68,0.1)" }}>
              <TrendingDown className="h-4 w-4" style={{ color: "#ef4444" }} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#a0a0a0" }}>Lost Deals</span>
          </div>
          <p className="text-3xl font-bold" style={{ color: "#ffffff" }}>{lostDeals.length}</p>
          <p className="text-sm font-medium" style={{ color: "#ef4444" }}>{formatCurrency(lostValue)}</p>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#a0a0a0" }} />
        <input
          type="text"
          placeholder="Search deals..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 pl-11 pr-4 rounded-2xl border backdrop-blur-md focus:outline-none transition-all text-sm"
          style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(26,26,26,0.6)", color: "#ffffff" }}
        />
      </div>

      {/* Deals List */}
      <div className="space-y-3">
        {filteredDeals.length === 0 ? (
          <div className="text-center py-16">
            <Handshake className="h-12 w-12 mx-auto mb-4" style={{ color: "rgba(255,255,255,0.2)" }} />
            <p style={{ color: "#a0a0a0" }}>No {activeTab} deals found</p>
          </div>
        ) : (
          filteredDeals.map((deal) => (
            <div
              key={deal._id}
              className="rounded-[24px] border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              style={{ borderColor: "rgba(255,255,255,0.1)", backgroundColor: "rgba(26,26,26,0.6)" }}
            >
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: activeTab === "won" ? "rgba(18,183,106,0.1)" : "rgba(239,68,68,0.1)" }}>
                  {activeTab === "won" ? (
                    <TrendingUp className="h-5 w-5" style={{ color: "#12b76a" }} />
                  ) : (
                    <TrendingDown className="h-5 w-5" style={{ color: "#ef4444" }} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold" style={{ color: "#ffffff" }}>{deal.name}</h3>
                  {deal.company && (
                    <div className="flex items-center gap-1.5 text-xs mt-1" style={{ color: "#a0a0a0" }}>
                      <Building2 className="h-3 w-3" />
                      <span>{deal.company}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-lg font-bold" style={{ color: "#ffffff" }}>{formatCurrency(deal.value)}</p>
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: "#a0a0a0" }}>Deal Value</p>
                </div>
                <div className="px-3 py-1.5 rounded-full text-xs font-bold uppercase" style={{ backgroundColor: activeTab === "won" ? "rgba(18,183,106,0.1)" : "rgba(239,68,68,0.1)", color: activeTab === "won" ? "#12b76a" : "#ef4444" }}>
                  {activeTab}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
