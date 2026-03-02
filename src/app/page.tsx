"use client";
import React, { useState, useEffect } from 'react';
import { MapPin, Truck, Settings2, BarChart3 } from 'lucide-react';

export default function MunicipalDashboard() {
  const [data, setData] = useState<any>(null);
  const [budget, setBudget] = useState(15000);
  const [teams, setTeams] = useState(3);
  const [loading, setLoading] = useState(false);

  const fetchOptimization = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/optimize-routes?budget=${budget}&teams=${teams}`);
      const result = await res.json();
      setData(result);
    } catch (e) {
      console.error("Failed to fetch", e);
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans">
      {/* Sidebar - Controls */}
      <div className="w-80 bg-gray-800 p-6 border-r border-gray-700 flex flex-col gap-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings2 className="text-blue-400" />
          <h1 className="text-xl font-bold">מנוע סימולציה</h1>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">תקציב יומי (₪)</label>
            <input 
              type="range" min="5000" max="50000" step="1000"
              value={budget} onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="text-right mt-1 text-blue-400 font-mono">{budget.toLocaleString()} ₪</div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">מספר צוותים</label>
            <input 
              type="number" min="1" max="10"
              value={teams} onChange={(e) => setTeams(Number(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button 
            onClick={fetchOptimization}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold transition-all disabled:opacity-50"
          >
            {loading ? "מחשב אופטימיזציה..." : "הרץ סימולציה"}
          </button>
        </div>

        {data && (
          <div className="mt-8 space-y-4 border-t border-gray-700 pt-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">משימות שנבחרו</span>
              <span className="text-xl font-bold text-green-400">{data.summary.selected_count}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">ניצול תקציב</span>
              <span className="text-xl font-bold text-yellow-400">{Math.round(data.summary.total_cost).toLocaleString()} ₪</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">מרחק כולל</span>
              <span className="text-xl font-bold text-purple-400">{data.summary.total_distance_km.toFixed(1)} ק"מ</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Content - Map Placeholder & Route List */}
      <div className="flex-1 flex flex-col p-8 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="text-red-500" /> תוכנית עבודה יומית - ירושלים
          </h2>
          <div className="bg-gray-800 px-4 py-2 rounded-full border border-gray-700 text-sm flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            מחובר ל-Neon DB
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-y-auto">
          {data?.data.map((route: any, idx: number) => (
            <div key={idx} className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-xl">
              <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-blue-500/20 text-blue-400`}>
                    <Truck size={20} />
                  </div>
                  <h3 className="font-bold">צוות {route.team_id}</h3>
                </div>
                <span className="text-xs text-gray-500 font-mono">{route.total_distance_meters} מטרים</span>
              </div>
              
              <div className="space-y-3">
                {route.route_steps.map((step: any, sIdx: number) => (
                  <div key={sIdx} className="flex items-start gap-3 text-sm group">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                      {sIdx !== route.route_steps.length - 1 && <div className="w-px h-10 bg-gray-700"></div>}
                    </div>
                    <div className="flex-1 bg-gray-700/30 p-3 rounded hover:bg-gray-700/50 transition-colors">
                      <div className="flex justify-between">
                        <span className="font-bold">#{step.issue_id} - {step.category}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] ${step.severity > 3 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                          חומרה {step.severity}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 font-mono">
                        LAT: {step.lat.toFixed(4)}, LON: {step.lon.toFixed(4)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!data && (
            <div className="col-span-full h-full border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center text-gray-500 gap-4">
              <BarChart3 size={48} />
              <p>לחץ על "הרץ סימולציה" כדי לקבל תוכנית עבודה אופטימלית</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}