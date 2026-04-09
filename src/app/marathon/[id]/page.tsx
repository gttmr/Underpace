import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { MarathonSignupForm } from "@/components/marathon/MarathonSignupForm";

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

export default async function MarathonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsedId = parseInt(id, 10);
  if (isNaN(parsedId)) notFound();

  const marathon = await prisma.marathon.findUnique({
    where: { id: parsedId },
    include: { participants: { orderBy: { submittedAt: "asc" } } },
  });
  if (!marathon) notFound();

  const d = new Date(marathon.date + "T00:00:00");
  const isPast = d < new Date(new Date().toISOString().split("T")[0] + "T00:00:00");
  const [, month, day] = marathon.date.split("-");
  const dayName = DAY_KO[d.getDay()];

  return (
    <div className="min-h-screen bg-brand-page pb-24">
      {/* header */}
      <header className="bg-white shadow-[0_1px_12px_rgba(0,0,0,0.07)] sticky top-0 z-30">
        <div className="max-w-xl mx-auto px-4 h-14 grid grid-cols-[1fr_auto_1fr] items-center">
          <Link href="/" className="text-brand-text-muted hover:text-brand-text transition-colors font-black text-lg leading-none">←</Link>
          <Link href="/"><Image src="/logo.svg" alt="Underpace" width={120} height={36} className="object-contain" priority /></Link>
          <div />
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-5 space-y-4">
        {/* info card */}
        <div className="bg-brand-surface-elevated rounded-2xl border border-emerald-200 shadow-sm overflow-hidden animate-fade-up">
          <div className="bg-emerald-50 px-5 py-4 flex items-end justify-between">
            <div>
              <span className="text-[10px] font-black text-emerald-700 tracking-widest uppercase bg-emerald-100 px-2 py-0.5 rounded-md">
                대회
              </span>
              <h2 className="text-xl font-black text-emerald-900 mt-1.5 leading-tight">{marathon.title}</h2>
              <p className="text-sm font-semibold text-emerald-700 mt-0.5">
                {parseInt(month, 10)}월 {parseInt(day, 10)}일 ({dayName})
              </p>
            </div>
            {isPast && (
              <span className="text-[10px] font-black bg-brand-dimmed text-brand-dimmed-text px-2 py-1 rounded-lg">종료됨</span>
            )}
          </div>

          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-2.5 text-sm text-brand-text-muted">
              <svg className="w-3.5 h-3.5 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{marathon.date} {marathon.startTime}</span>
            </div>
            <div className="flex items-start gap-2.5 text-sm text-brand-text-muted">
              <svg className="w-3.5 h-3.5 shrink-0 text-emerald-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{marathon.location || "장소 미정"}</span>
            </div>
            {marathon.link && (
              <div className="flex items-center gap-2.5">
                <svg className="w-3.5 h-3.5 shrink-0 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <a
                  href={marathon.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-brand-text hover:underline break-all"
                >
                  신청 링크 열기 →
                </a>
              </div>
            )}
            {marathon.description && (
              <p className="text-sm text-brand-text-subtle bg-brand-surface rounded-xl px-3 py-2.5 leading-relaxed whitespace-pre-wrap">
                {marathon.description}
              </p>
            )}
          </div>
        </div>

        {/* signup */}
        <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-[3px] h-4 bg-brand-primary rounded-full" />
            <h2 className="text-xs font-black text-brand-text-subtle uppercase tracking-widest">참가 신청</h2>
          </div>
          {isPast ? (
            <div className="bg-brand-surface-elevated rounded-2xl p-6 text-center border border-brand-primary-border">
              <p className="text-sm font-bold text-brand-text-subtle">이 대회의 일정이 이미 지났습니다.</p>
            </div>
          ) : (
            <div className="bg-brand-surface-elevated rounded-2xl border border-brand-primary-border shadow-sm p-5">
              <MarathonSignupForm marathon={marathon} />
            </div>
          )}
        </div>

        {/* participants */}
        <div className="animate-fade-up" style={{ animationDelay: "120ms" }}>
          <div className="flex items-center justify-between mb-3 px-0.5">
            <div className="flex items-center gap-2">
              <div className="w-[3px] h-4 bg-emerald-500 rounded-full" />
              <h2 className="text-xs font-black text-brand-text-subtle uppercase tracking-widest">참가 예정자</h2>
            </div>
            <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-2 py-0.5 rounded-full">
              {marathon.participants.length}명
            </span>
          </div>

          {marathon.participants.length > 0 ? (
            <div className="bg-brand-surface-elevated rounded-2xl overflow-hidden border border-brand-primary-border divide-y divide-[rgba(0,29,110,0.08)]">
              {marathon.participants.map((p, i) => (
                <div key={p.id} className="px-4 py-3.5 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-brand-text text-sm">{p.name}</p>
                    {p.note && <p className="text-xs text-brand-text-subtle mt-0.5">{p.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-brand-surface-elevated rounded-2xl p-10 text-center border border-brand-primary-border">
              <p className="text-3xl mb-2">🏃</p>
              <p className="font-bold text-brand-text-subtle text-sm">아직 참가 신청자가 없습니다</p>
              <p className="text-xs text-brand-text-subtle mt-1">첫 번째로 신청해보세요!</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
