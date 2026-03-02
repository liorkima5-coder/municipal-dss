"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Settings2,
  AlertTriangle,
  Clock,
  Coins,
  CheckCircle2,
  Plus,
  Minus,
  Loader2,
  Menu,
  X,
  LayoutDashboard,
  ChevronDown // שימוש ב-Chevron הרשמי של הספריה
} from "lucide-react";
import dynamic from "next/dynamic";
import "leaflet/dist/leaflet.css";

import { PDFDownloadLink } from "@react-pdf/renderer";
import { TeamPDF } from "./TeamPDF";

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), { ssr: false });
const Polyline = dynamic(() => import("react-leaflet").then((mod) => mod.Polyline), { ssr: false });

const COLORS = ["#2563eb", "#dc2626", "#16a34a", "#ca8a04", "#7c3aed", "#db2777", "#ea580c", "#0891b2", "#4f46e5", "#525252"];

export default function MunicipalDashboard() {
  const [data, setData] = useState<any>(null);
  const [budget, setBudget] = useState(40000);
  const [teams, setTeams] = useState(3);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      import("leaflet").then((leaflet) => {
        const L = leaflet.default;
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
          iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
          shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        });
        setL(L);
      });
    }
  }, []);

  const fetchOptimization = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/optimize-routes?budget=${budget}&teams=${teams}`);
      if (!res.ok) throw new Error("Server Error");
      const result = await res.json();
      setData(result);
      if (window.innerWidth < 768) setSidebarOpen(false);
    } catch {
      alert("שגיאת תקשורת עם השרת");
    } finally {
      setLoading(false);
    }
  }, [budget, teams, loading]);

  const stats = useMemo(() => [
    { label: "תקציב נוצל", val: `₪${Math.round(data?.summary?.total_cost || 0).toLocaleString()}`, icon: <Coins className="text-blue-500" /> },
    { label: "משימות", val: data?.summary?.selected_count || 0, icon: <CheckCircle2 className="text-green-500" /> },
    { label: "SLA צפוי", val: "98.2%", icon: <Clock className="text-purple-500" /> },
    { label: "מדד סיכון", val: "9.2", icon: <AlertTriangle className="text-amber-500" /> },
  ], [data]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-[#f1f5f9] text-slate-900 font-sans" dir="rtl">
      <button 
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-3 bg-white rounded-2xl shadow-lg border border-slate-200"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`
        fixed lg:static inset-y-0 right-0 z-40 w-[320px] bg-white/80 backdrop-blur-xl border-l border-white/20 
        transition-transform duration-300 ease-in-out shadow-2xl p-8 flex flex-col
        ${isSidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
      `}>
        <div className="flex items-center gap-3 mb-12">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-xl font-black leading-none">SmartCity</h1>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter text-right block italic">DSS</span>
          </div>
        </div>

        <div className="space-y-8 flex-1">
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-inner">
            <label className="block text-[11px] font-black text-slate-400 uppercase mb-3 text-right">מספר צוותים</label>
            <div className="flex justify-between items-center bg-white p-2 rounded-2xl shadow-sm">
              <button onClick={() => setTeams(Math.max(1, teams - 1))} className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><Minus size={18}/></button>
              <span className="font-black text-2xl tabular-nums">{teams}</span>
              <button onClick={() => setTeams(Math.min(10, teams + 1))} className="p-2 hover:bg-slate-50 rounded-lg transition-colors"><Plus size={18}/></button>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-inner">
            <label className="block text-[11px] font-black text-slate-400 uppercase mb-1 text-right">תקציב יעד</label>
            <div className="text-2xl font-black text-blue-600 mb-4 tabular-nums text-right">₪{budget.toLocaleString()}</div>
            <input
              type="range" min="10000" max="250000" step="5000" value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <button
            onClick={fetchOptimization}
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] font-black shadow-lg shadow-blue-200 transition-all active:scale-95 flex justify-center items-center gap-2 group"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>הפק תוכנית עבודה <LayoutDashboard size={18} /></>}
          </button>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col items-center gap-3">
          <img src="/logo.png" alt="Footer Logo" className="w-8 opacity-50" />
          <p className="text-[10px] text-slate-400 font-bold text-center leading-relaxed">
            כל הזכויות שמורות למערכת SmartCity
          </p>
        </div>
      </aside>

      <main className="flex-1 p-4 lg:p-10 overflow-y-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((kpi, i) => (
            <div key={i} className="bg-white/60 backdrop-blur-md p-6 rounded-[32px] border border-white shadow-sm text-right">
              <div className="mb-4 bg-white w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm">
                {kpi.icon}
              </div>
              <div className="text-[11px] font-black text-slate-400 uppercase mb-1">{kpi.label}</div>
              <div className="font-black text-2xl text-slate-800 tabular-nums">{kpi.val}</div>
            </div>
          ))}
        </div>

        <div className="bg-white p-2 rounded-[40px] shadow-2xl border border-white mb-10 h-[350px] lg:h-[500px] overflow-hidden relative">
          {L && (
            <MapContainer center={[31.77, 35.21]} zoom={13} style={{ height: "100%", width: "100%", borderRadius: "34px" }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              {data?.data?.map((route: any, rIdx: number) => (
                <React.Fragment key={rIdx}>
                  {route.route_steps?.length > 0 && (
                    <Polyline
                      positions={route.route_steps.map((s: any) => [s.lat, s.lon])}
                      pathOptions={{ color: COLORS[rIdx % COLORS.length], weight: 6 }}
                    />
                  )}
                  {route.route_steps?.map((step: any) => (
                    <Marker key={step.id} position={[step.lat, step.lon]}>
                      <Popup>
                        <div className="text-right font-sans">
                          <div className="font-bold border-b pb-1 mb-1 italic">משימה #{step.id}</div>
                          <div className="text-xs text-slate-600">{step.category}</div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </React.Fragment>
              ))}
            </MapContainer>
          )}
        </div>

        <div className="space-y-8 text-right">
          <h2 className="text-2xl font-black flex items-center gap-3 justify-end text-right">
             תוכניות עבודה לצוותים <ChevronDown className="text-blue-600" />
          </h2>
          {data?.data?.map((route: any, idx: number) => (
            <div key={idx} className="bg-white rounded-[40px] shadow-xl border border-slate-100 overflow-hidden flex flex-col md:flex-row transition-transform hover:scale-[1.01]">
              <div className="p-8 md:w-72 flex flex-col justify-between items-end text-white" style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                <div className="text-right">
                  <h3 className="font-black text-3xl mb-1 italic">צוות {route.team_id}</h3>
                  <p className="text-xs opacity-80 font-bold uppercase tracking-widest">{route.route_steps?.length} משימות</p>
                </div>
                
                <PDFDownloadLink
                  document={<TeamPDF team={route} />}
                  fileName={`WorkPlan_Team_${route.team_id}.pdf`}
                  className="mt-6 w-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white border border-white/30 px-6 py-4 rounded-2xl font-black text-sm text-center"
                >
                  {({ loading }) => loading ? "מכין קובץ..." : "ייצא תוכנית PDF"}
                </PDFDownloadLink>
              </div>

              <div className="flex-1 p-8 text-right">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-right">
                  {route.route_steps?.map((task: any, i: number) => (
                    <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 group">
                      <div className="bg-white px-4 py-2 rounded-xl shadow-sm text-green-600 font-black tabular-nums">
                        ₪{Math.round(task.cost).toLocaleString()}
                      </div>
                      <div className="flex flex-col text-right">
                        <span className="text-[10px] font-black text-slate-400">ID #{task.id}</span>
                        <span className="font-bold text-slate-700">{task.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
