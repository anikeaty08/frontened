"use client";

import { useEffect, useState, useRef } from "react";
import { Icon } from "@iconify/react";

interface LogEntry {
  time: string;
  type: string;
  status: string;
  statusColor: string;
  isSpecial?: boolean;
}

const INITIAL_LOGS: LogEntry[] = [
  { time: "14:21:05", type: "APK_UPLOAD", status: "OK", statusColor: "text-white" },
  { time: "14:21:12", type: "DECOMPILE", status: "MANIFEST_OK", statusColor: "text-white" },
  {
    time: "14:21:18",
    type: "THREAT_LVL",
    status: "HIGH",
    statusColor: "text-red-500",
    isSpecial: true,
  },
  { time: "14:21:33", type: "API_TRACE", status: "PASS", statusColor: "text-white" },
  { time: "14:21:45", type: "SANDBOX", status: "EXECUTING", statusColor: "text-white" },
  { time: "14:22:01", type: "C2_DETECT", status: "SCANNING", statusColor: "text-white" },
];

const LOG_TYPES = ["APK_UPLOAD", "DECOMPILE", "MANIFEST_SCAN", "API_MONITOR", "C2_DETECT", "MEM_DUMP", "TRAFFIC_CAP"];
const LOG_STATUSES = [
  { status: "OK", color: "text-white" },
  { status: "PASS", color: "text-white" },
  { status: "SUSPICIOUS", color: "text-orange-500" },
  { status: "ALERT", color: "text-red-500" },
  { status: "ACTIVE", color: "text-[#0052FF]" },
];

export default function CommandTerminal() {
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const date = new Date();
      const timeString = date.toTimeString().split(" ")[0];
      const randomType = LOG_TYPES[Math.floor(Math.random() * LOG_TYPES.length)];
      const randomStatus = LOG_STATUSES[Math.floor(Math.random() * LOG_STATUSES.length)];

      const isThreat = Math.random() > 0.85;

      const newLog: LogEntry = isThreat
        ? {
            time: timeString,
            type: "THREAT_LVL",
            status: "HIGH",
            statusColor: "text-red-500",
            isSpecial: true,
          }
        : {
            time: timeString,
            type: randomType,
            status: randomStatus.status,
            statusColor: randomStatus.color,
          };

      setLogs((prev) => [...prev.slice(-40), newLog]); // Keep last 40 logs
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <section id="intelligence" className="py-32 px-6 lg:px-12 w-full relative z-10 bg-black">
      <div className="max-w-[100rem] mx-auto reveal">
        <div className="mb-16 flex flex-col md:flex-row justify-between items-end gap-8 border-b border-[#151515] pb-8">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white uppercase mb-4">
              Command Terminal
            </h2>
            <p className="text-sm text-[#777] font-mono tracking-widest uppercase">Absolute transparency. Total control.</p>
          </div>
          <div className="text-right text-xs font-mono text-[#555]">
            [ LIVE DEMONSTRATION ]<br />
            VERSION 4.2.0
          </div>
        </div>

        {/* Massive Dashboard Mockup */}
        <div className="w-full glass-panel rounded-xl overflow-hidden border border-[#1A1A1A] relative shadow-2xl">
          {/* Dashboard Header */}
          <div className="bg-[#050505] border-b border-[#1A1A1A] px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#333]"></div>
                <div className="w-3 h-3 rounded-full bg-[#333]"></div>
                <div className="w-3 h-3 rounded-full bg-[#333]"></div>
              </div>
              <div className="h-4 w-px bg-[#222]"></div>
              <span className="text-xs font-mono text-white">CLISTE_OS // ROOT</span>
            </div>
            <div className="flex gap-4 text-xs font-mono">
              <span className="text-[#0052FF]">CONNECTED</span>
              <span className="text-[#777]">LIVE FEED</span>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 bg-black/50">
            {/* Sidebar */}
            <div className="hidden lg:block lg:col-span-2 border-r border-[#1A1A1A] p-6 space-y-8">
              <div>
                <div className="text-[0.6rem] font-mono text-[#555] uppercase tracking-widest mb-4">Navigation</div>
                <ul className="space-y-3 text-xs font-mono">
                  <li className="text-white flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Icon icon="solar:widget-5-linear" /> APK Overview
                    </span>{" "}
                    <span className="w-1 h-1 bg-white rounded-full"></span>
                  </li>
                  <li className="text-[#777] hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                    <Icon icon="solar:shield-keyhole-linear" /> Malware Logs
                  </li>
                  <li className="text-[#777] hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                    <Icon icon="solar:database-linear" /> Sandbox Status
                  </li>
                  <li className="text-[#777] hover:text-white transition-colors cursor-pointer flex items-center gap-2">
                    <Icon icon="solar:routing-2-linear" /> C2 Infrastructure
                  </li>
                </ul>
              </div>
              <div>
                <div className="text-[0.6rem] font-mono text-[#555] uppercase tracking-widest mb-4">System Alerts</div>
                <div className="bg-[#111] border border-[#222] p-3 text-[0.65rem] font-mono text-[#777]">
                  <span className="text-[#0052FF]">INFO:</span> Automated multi-agent report generated.
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="col-span-1 lg:col-span-7 border-r border-[#1A1A1A] p-6 lg:p-10 flex flex-col gap-8 grid-bg relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black pointer-events-none"></div>

              {/* Top Stats */}
              <div className="grid grid-cols-3 gap-6 relative z-10">
                <div className="bg-[#050505] border border-[#1A1A1A] p-4 corner-brackets group">
                  <div className="text-[0.6rem] font-mono text-[#555] uppercase tracking-widest mb-2">Analyzed APKs</div>
                  <div className="text-xl lg:text-3xl font-mono text-white tracking-tight">84.2K</div>
                </div>
                <div className="bg-[#050505] border border-[#1A1A1A] p-4 corner-brackets group">
                  <div className="text-[0.6rem] font-mono text-[#555] uppercase tracking-widest mb-2">Detected Threats</div>
                  <div className="text-xl lg:text-3xl font-mono text-[#0052FF] tracking-tight">1,420</div>
                </div>
                <div className="bg-[#050505] border border-[#1A1A1A] p-4 corner-brackets group">
                  <div className="text-[0.6rem] font-mono text-[#555] uppercase tracking-widest mb-2">Sandbox Load</div>
                  <div className="text-xl lg:text-3xl font-mono text-white tracking-tight">14%</div>
                </div>
              </div>

              {/* Complex Chart Mockup */}
              <div className="bg-[#050505] border border-[#1A1A1A] flex-1 p-6 relative z-10 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <div className="text-xs font-mono text-white uppercase tracking-widest">Scan Ingress / Queue</div>
                  <div className="flex gap-2">
                    <span className="text-[0.6rem] font-mono px-2 py-1 bg-[#111] text-white">1H</span>
                    <span className="text-[0.6rem] font-mono px-2 py-1 text-[#555]">24H</span>
                    <span className="text-[0.6rem] font-mono px-2 py-1 text-[#555]">7D</span>
                  </div>
                </div>

                <div className="flex-1 flex items-end gap-1 opacity-70 min-h-[120px]">
                  {/* Simulated Bar Chart */}
                  <div className="w-full bg-[#111] h-[20%] hover:bg-[#222] transition-all duration-300"></div>
                  <div className="w-full bg-[#111] h-[35%] hover:bg-[#222] transition-all duration-300"></div>
                  <div className="w-full bg-[#111] h-[15%] hover:bg-[#222] transition-all duration-300"></div>
                  <div className="w-full bg-[#111] h-[40%] hover:bg-[#222] transition-all duration-300"></div>
                  <div className="w-full bg-[#111] h-[60%] hover:bg-[#222] transition-all duration-300"></div>
                  <div className="w-full bg-[#0052FF] h-[85%] relative group">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black font-mono text-[0.6rem] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      PEAK
                    </div>
                  </div>
                  <div className="w-full bg-[#111] h-[50%] hover:bg-[#222] transition-all duration-300"></div>
                  <div className="w-full bg-[#111] h-[30%] hover:bg-[#222] transition-all duration-300"></div>
                  <div className="w-full bg-[#111] h-[45%] hover:bg-[#222] transition-all duration-300"></div>
                  <div className="w-full bg-[#111] h-[25%] hover:bg-[#222] transition-all duration-300"></div>
                  <div className="w-full bg-[#111] h-[10%] hover:bg-[#222] transition-all duration-300"></div>
                  <div className="w-full bg-[#111] h-[15%] hover:bg-[#222] transition-all duration-300"></div>
                </div>
              </div>
            </div>

            {/* Live Log Feed */}
            <div className="col-span-1 lg:col-span-3 p-0 bg-[#050505] flex flex-col h-[30rem] lg:h-auto border-t lg:border-t-0 border-[#1A1A1A]">
              <div className="p-4 border-b border-[#1A1A1A]">
                <div className="text-xs font-mono text-white uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#0052FF] rounded-full animate-ping"></span> Live Feed
                </div>
              </div>
              <div
                className="flex-1 p-4 overflow-y-auto scrollbar-thin relative max-h-[35rem]"
                ref={logContainerRef}
                style={{ scrollBehavior: "smooth" }}
              >
                <div className="space-y-1 text-[0.65rem] font-mono flex flex-col">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className={`data-row p-2 border-l-2 flex justify-between transition-all duration-300 ${
                        log.isSpecial
                          ? "border-[#0052FF] bg-[rgba(0,82,255,0.05)]"
                          : "border-transparent"
                      }`}
                    >
                      <span className="text-[#555]">{`[${log.time}]`}</span>
                      <span className={log.isSpecial ? "text-[#0052FF]" : "text-[#777]"}>{log.type}</span>
                      <span className={log.statusColor}>{log.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
