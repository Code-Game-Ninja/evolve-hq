"use client";

import { useEffect, useState } from "react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, LabelList
} from "recharts";
import { TrendingUp, Zap } from "lucide-react";
import { leadStatusColors } from "./lead-data";

const COLORS = ["#f3350c", "#1a1a1a", "#12b76a", "#f79009", "#7a5af8", "#ee46bc", "#06aed4"];

interface AnalyticsData {
  distribution: Array<{ _id: string; count: number; value: number }>;
  priority: Array<{ _id: string; count: number }>;
  trend: Array<{ _id: { month: number; year: number }; leads: number; value: number }>;
  sources: Array<{ _id: string; count: number }>;
  funnel: Array<{ stage: string; count: number }>;
  projectedRevenue: number;
  avgVelocity: number;
}

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function CRMAnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/crm/analytics");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error("Failed to fetch analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[300px] rounded-[32px] border border-[#dddddd] bg-[#f1efed]/20 animate-pulse" />
        <div className="h-[300px] rounded-[32px] border border-[#dddddd] bg-[#f1efed]/20 animate-pulse" />
      </div>
    );
  }

  if (!data) return null;

  // Format trend data
  const trendData = data.trend.map(t => ({
    name: monthNames[t._id.month - 1],
    value: t.value,
    leads: t.leads
  }));

  // Format distribution data
  const distData = data.distribution.map(d => ({
    name: leadStatusColors[d._id as keyof typeof leadStatusColors]?.label || d._id,
    value: d.count,
    amount: d.value
  }));

  return (
    <div className="space-y-6">
      {/* High Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          className="rounded-[32px] border border-[#dddddd] p-6 backdrop-blur-md flex items-center justify-between"
          style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#999] mb-1">Projected Revenue</p>
            <h4 className="text-2xl font-bold text-[#1a1a1a]">₹{Math.round(data.projectedRevenue).toLocaleString('en-IN')}</h4>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-[#f3350c]/10 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-[#f3350c]" />
          </div>
        </div>
        
        <div 
          className="rounded-[32px] border border-[#dddddd] p-6 backdrop-blur-md flex items-center justify-between"
          style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#999] mb-1">Lead Velocity (Avg.)</p>
            <h4 className="text-2xl font-bold text-[#1a1a1a]">{data.avgVelocity} Days</h4>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-[#1a1a1a]/10 flex items-center justify-center">
            <Zap className="h-6 w-6 text-[#1a1a1a]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Chart */}
        <div 
          className="lg:col-span-8 rounded-[32px] border border-[#dddddd] p-8 backdrop-blur-md"
          style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold text-[#1a1a1a]">Pipeline Growth</h3>
              <p className="text-xs text-[#999]">Lead value trend over the last 6 months</p>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f3350c" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f3350c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#00000010" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#999" }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#999" }}
                  tickFormatter={(val) => `₹${val >= 100000 ? (val/100000).toFixed(1) + 'L' : (val/1000).toFixed(0) + 'k'}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: "16px", 
                    border: "none", 
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                    fontWeight: "bold"
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#f3350c" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart Distribution */}
        <div 
          className="lg:col-span-4 rounded-[32px] border border-[#dddddd] p-8 backdrop-blur-md"
          style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
        >
          <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">Lead Sources</h3>
          <p className="text-xs text-[#999] mb-8">Origin of your current pipeline</p>
          
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.sources.map(s => ({ name: s._id || "Other", value: s.count }))}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.sources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ 
                    borderRadius: "16px", 
                    border: "none", 
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                    fontSize: "11px",
                    fontWeight: "bold"
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {data.sources.slice(0, 4).map((s, i) => (
              <div key={s._id} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] font-bold text-[#666] truncate">{s._id || "Other"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Conversion Funnel */}
        <div 
          className="lg:col-span-7 rounded-[32px] border border-[#dddddd] p-8 backdrop-blur-md"
          style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
        >
          <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">Conversion Funnel</h3>
          <p className="text-xs text-[#999] mb-8">Drop-off rate between pipeline stages</p>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                layout="vertical" 
                data={data.funnel.map((item, index, arr) => {
                  const prevCount = index > 0 ? arr[index - 1].count : 0;
                  const conversion = prevCount > 0 ? Math.round((item.count / prevCount) * 100) : 0;
                  return {
                    ...item,
                    conversion: index === 0 ? "100%" : `${conversion}%`
                  };
                })}
                margin={{ left: 40, right: 60 }}
              >
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="stage" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "#1a1a1a" }}
                  width={100}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ 
                    borderRadius: "16px", 
                    border: "none", 
                    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
                    fontSize: "11px",
                    fontWeight: "bold"
                  }} 
                />
                <Bar 
                  dataKey="count" 
                  fill="#f3350c" 
                  radius={[0, 20, 20, 0]} 
                  barSize={30}
                >
                  <LabelList 
                    dataKey="conversion" 
                    position="right" 
                    style={{ fill: '#999', fontSize: '10px', fontWeight: 800 }}
                    offset={10}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Focus */}
        <div 
          className="lg:col-span-5 rounded-[32px] border border-[#dddddd] p-8 backdrop-blur-md"
          style={{ backgroundColor: "rgba(255,255,255,0.4)" }}
        >
          <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">Priority Focus</h3>
          <p className="text-xs text-[#999] mb-8">Breakdown of leads by urgency</p>
          
          <div className="space-y-6 py-4">
            {data.priority.sort((a, b) => b.count - a.count).map((p, i) => {
              const total = data.distribution.reduce((sum, d) => sum + d.count, 0);
              const percentage = total > 0 ? Math.round((p.count / total) * 100) : 0;
              return (
                <div key={p._id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]">{p._id}</span>
                    <span className="text-xs font-bold text-[#999]">{p.count} leads</span>
                  </div>
                  <div className="h-3 w-full bg-[#f1efed] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000" 
                      style={{ 
                        width: `${percentage}%`, 
                        backgroundColor: p._id === 'high' ? '#f3350c' : p._id === 'medium' ? '#f79009' : '#1a1a1a'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
