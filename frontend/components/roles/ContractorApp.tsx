"use client";

import { useState, useRef } from "react";
import { useAppState, type WorkOrder } from "@/lib/app-state";
import { CategoryBadge, IconCamera, IconCheck, IconArrowLeft, IconMapPin } from "@/components/ui/Icons";

const CONTRACTOR_NAME = "Al-Jalil Builders";

function fmt(d: Date): string {
  return d.toLocaleString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function ContractorApp() {
  const { workOrders, startWork, completeWork } = useAppState();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [completePhoto, setCompletePhoto] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Only orders assigned to this contractor
  const myOrders = workOrders.filter((w) => w.contractor === CONTRACTOR_NAME);
  const active = myOrders.filter((w) => w.status === "ASSIGNED" || w.status === "IN_PROGRESS");
  const done   = myOrders.filter((w) => w.status === "COMPLETED" || w.status === "RESOLVED");
  const selected = myOrders.find((w) => w.id === selectedId) || null;

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompletePhoto(URL.createObjectURL(file));
  }

  return (
    <div style={{ background: "#F5F3EF", minHeight: 780, position: "relative" }}>
      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1.5" style={{ background: "#0A1F3C" }}>
        <span className="text-white text-xs font-medium">11:42</span>
        <span className="text-white text-xs font-semibold" style={{ fontFamily: "Outfit,sans-serif" }}>CivicPulse · Contractor</span>
        <span className="text-white text-xs">▲ 5G ▮</span>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 740, paddingBottom: 24 }}>
        {!selected ? (
          <div className="p-5">
            {/* Header */}
            <div className="mb-5">
              <p className="text-2xl font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>{CONTRACTOR_NAME}</p>
              <p className="text-sm" style={{ color: "#5A6B84" }}>Assigned work orders · Gulberg Town</p>
            </div>

            {/* Stat row */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {[
                { label: "Active", value: active.length, color: "#E0A400" },
                { label: "Completed", value: done.length, color: "#0E8A5F" },
                { label: "Total", value: myOrders.length, color: "#0A1F3C" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl p-3 text-center" style={{ boxShadow: "0 1px 4px rgba(10,31,60,0.08)" }}>
                  <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: "Outfit,sans-serif" }}>{s.value}</p>
                  <p className="text-[11px]" style={{ color: "#5A6B84" }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Active work orders */}
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#5A6B84" }}>Active Work Orders</p>
            {active.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: "0 1px 4px rgba(10,31,60,0.07)" }}>
                <p className="text-sm font-semibold" style={{ color: "#16233A" }}>No active work orders</p>
                <p className="text-xs mt-1" style={{ color: "#5A6B84" }}>New orders from the Department will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3 mb-5">
                {active.map((w) => (
                  <button key={w.id} onClick={() => { setSelectedId(w.id); setCompletePhoto(null); }}
                    className="w-full text-left bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(10,31,60,0.08)", border: "1px solid #F0EDE6" }}>
                    <div className="flex items-start gap-3">
                      <CategoryBadge category={w.category} size="lg" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-bold" style={{ color: "#16233A" }}>{w.category}</p>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{ background: w.status === "IN_PROGRESS" ? "#FFF3E0" : "#EAF0FA", color: w.status === "IN_PROGRESS" ? "#B8860B" : "#0E2A4E" }}>
                            {w.status === "IN_PROGRESS" ? "In Progress" : "Assigned"}
                          </span>
                        </div>
                        <p className="text-xs mb-1.5" style={{ color: "#5A6B84" }}>{w.description}</p>
                        <div className="flex items-center gap-1 text-[11px]" style={{ color: "#5A6B84" }}>
                          <IconMapPin size={12} color="#0E8A5F" /> {w.address}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Completed */}
            {done.length > 0 && (
              <>
                <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "#5A6B84" }}>Completed</p>
                <div className="space-y-2">
                  {done.map((w) => (
                    <div key={w.id} className="bg-white rounded-2xl p-3 flex items-center gap-3" style={{ boxShadow: "0 1px 3px rgba(10,31,60,0.07)", border: "1px solid #E7F4EF" }}>
                      <CategoryBadge category={w.category} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold" style={{ color: "#16233A" }}>{w.category}</p>
                        <p className="text-[11px]" style={{ color: "#5A6B84" }}>{w.address}</p>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: "#E7F4EF", color: "#0E8A5F" }}>
                        <IconCheck size={11} color="#0E8A5F" /> {w.status === "RESOLVED" ? "Paid" : "Done"}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          /* ── Work order detail ── */
          <div className="p-5">
            <button onClick={() => setSelectedId(null)} className="flex items-center gap-1 text-xs mb-3 font-medium" style={{ color: "#5A6B84" }}>
              <IconArrowLeft size={12} /> Back to orders
            </button>

            <div className="flex items-center gap-3 mb-4">
              <CategoryBadge category={selected.category} size="lg" />
              <div>
                <p className="text-lg font-bold" style={{ color: "#16233A", fontFamily: "Outfit,sans-serif" }}>{selected.category}</p>
                <p className="text-[11px] font-mono" style={{ color: "#5A6B84" }}>{selected.shortCode}</p>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white rounded-2xl p-3 mb-4" style={{ boxShadow: "0 1px 4px rgba(10,31,60,0.08)" }}>
              <div className="flex items-start gap-1.5">
                <IconMapPin size={14} color="#0E8A5F" />
                <div>
                  <p className="text-xs font-semibold" style={{ color: "#16233A" }}>{selected.address}</p>
                  {selected.latitude != null && selected.longitude != null && (
                    <p className="text-[11px] font-mono mt-0.5" style={{ color: "#5A6B84" }}>{selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Job details */}
            <div className="bg-white rounded-2xl p-4 mb-4" style={{ boxShadow: "0 1px 4px rgba(10,31,60,0.08)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#5A6B84" }}>Job Description</p>
              <p className="text-sm" style={{ color: "#16233A" }}>{selected.description}</p>
              {selected.cost != null && (
                <p className="text-xs mt-2" style={{ color: "#5A6B84" }}>Budget: <span className="font-bold" style={{ color: "#0E8A5F" }}>PKR {selected.cost.toLocaleString()}</span></p>
              )}
            </div>

            {/* Before photo (citizen) */}
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#5A6B84" }}>Reported Issue (Before)</p>
            <div className="rounded-2xl h-40 mb-4 overflow-hidden flex items-center justify-center" style={{ background: "#0A1F3C" }}>
              {selected.citizenPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={selected.citizenPhotoUrl} alt="Before" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center"><IconCamera size={28} color="rgba(255,255,255,0.4)" /><p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Citizen photo</p></div>
              )}
            </div>

            {/* Actions */}
            {selected.status === "ASSIGNED" && (
              <button onClick={() => startWork(selected.id)}
                className="w-full py-4 rounded-2xl text-sm font-bold text-white" style={{ background: "#E0A400", fontFamily: "Outfit,sans-serif" }}>
                Start Work
              </button>
            )}

            {selected.status === "IN_PROGRESS" && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#5A6B84" }}>Completion Photo (After)</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
                {!completePhoto ? (
                  <button onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed rounded-2xl py-10 flex flex-col items-center gap-2 mb-4 bg-white" style={{ borderColor: "#E6E3DC" }}>
                    <IconCamera size={26} color="#0E8A5F" />
                    <p className="text-sm font-semibold" style={{ color: "#0E8A5F" }}>Upload completion photo</p>
                  </button>
                ) : (
                  <div className="relative mb-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={completePhoto} alt="After" className="w-full h-40 object-cover rounded-2xl" />
                    <button onClick={() => setCompletePhoto(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full text-white text-xs font-bold" style={{ background: "#C0392B" }}>✕</button>
                  </div>
                )}
                <button onClick={() => { completeWork(selected.id, completePhoto || undefined); setSelectedId(null); }}
                  disabled={!completePhoto}
                  className="w-full py-4 rounded-2xl text-sm font-bold text-white disabled:opacity-40" style={{ background: "#0E8A5F", fontFamily: "Outfit,sans-serif" }}>
                  Mark Complete &amp; Submit
                </button>
              </div>
            )}

            {(selected.status === "COMPLETED" || selected.status === "RESOLVED") && (
              <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#E7F4EF", border: "1px solid #0E8A5F" }}>
                <IconCheck size={22} color="#0E8A5F" />
                <div>
                  <p className="text-sm font-bold" style={{ color: "#0E8A5F" }}>{selected.status === "RESOLVED" ? "Payment released" : "Awaiting citizen sign-off"}</p>
                  <p className="text-xs" style={{ color: "#5A6B84" }}>Completion photo submitted.</p>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "#5A6B84" }}>Timeline</p>
              <div className="bg-white rounded-2xl p-4" style={{ boxShadow: "0 1px 4px rgba(10,31,60,0.07)" }}>
                {selected.history.map((h, i) => (
                  <div key={i} className="flex gap-3 pb-3 last:pb-0">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#0E8A5F" }}>
                      <IconCheck size={12} color="white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold" style={{ color: "#16233A" }}>{h.label}</p>
                      <p className="text-[11px]" style={{ color: "#5A6B84" }}>{h.sublabel}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: "#B0BAC8" }}>{fmt(h.at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
