"use client";

import { useState } from "react";

interface Props {
  title: string;
  body: string;
}

export default function PinnedNoticeCard({ title, body }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="bg-amber-50 border-b border-amber-200 cursor-pointer select-none"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="max-w-xl mx-auto px-4 py-3 flex items-start gap-3">
        {/* left accent */}
        <div className="w-0.5 bg-amber-400 rounded-full self-stretch shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black text-amber-800 tracking-tight">{title}</span>
            <span className="text-[10px] font-bold text-amber-500 shrink-0 uppercase tracking-wider">
              {expanded ? "닫기" : "더보기"}
            </span>
          </div>
          <p className={`text-xs text-amber-700 mt-1 whitespace-pre-wrap ${expanded ? "" : "line-clamp-1"}`}>
            {body}
          </p>
        </div>
      </div>
    </div>
  );
}
