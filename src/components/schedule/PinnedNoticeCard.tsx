"use client";

import { useState } from "react";

interface Props {
  title: string;
  body: string;
}

export default function PinnedNoticeCard({ title, body }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div
        className="max-w-xl mx-auto px-4 py-3 flex items-start gap-2 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-amber-500 text-sm font-bold shrink-0 mt-0.5">📢</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-amber-800">{title}</span>
            <span className="text-amber-500 text-xs shrink-0">{expanded ? "닫기 ▲" : "더보기 ▼"}</span>
          </div>
          {expanded ? (
            <p className="text-xs text-amber-700 mt-1 whitespace-pre-wrap">{body}</p>
          ) : (
            <p className="text-xs text-amber-700 mt-0.5 line-clamp-2">{body}</p>
          )}
        </div>
      </div>
    </div>
  );
}
