import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { MarathonSignupForm } from "@/components/marathon/MarathonSignupForm";

export default async function MarathonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id, 10);
  if (isNaN(id)) notFound();

  const marathon = await prisma.marathon.findUnique({
    where: { id },
    include: {
      participants: {
        orderBy: { submittedAt: "asc" },
      },
    },
  });

  if (!marathon) notFound();

  const d = new Date(marathon.date + "T00:00:00");
  const isPast = d < new Date(new Date().toISOString().split("T")[0] + "T00:00:00");

  return (
    <main className="max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col pt-safe px-4 pb-24">
      <div className="flex items-center mb-6 pt-4">
        <Link href="/schedule" className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-slate-800 ml-2">대회 상세 정보</h1>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-orange-400"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 pr-4">
            <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded mb-2">
              마라톤
            </span>
            <h2 className="text-xl font-bold text-slate-800 leading-tight">
              {marathon.title}
            </h2>
          </div>
        </div>

        <div className="space-y-3 mt-5 border-t pt-5">
          <div className="flex items-center text-slate-600">
            <svg className="w-5 h-5 mr-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
              <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" />
              <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" />
              <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" />
            </svg>
            <span className="text-[15px]">{marathon.date} {marathon.startTime}</span>
          </div>

          <div className="flex items-start text-slate-600">
            <svg className="w-5 h-5 mr-3 text-slate-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[15px] leading-relaxed">
              {marathon.location || "장소 미정"}
            </span>
          </div>

          {marathon.link && (
            <div className="flex items-start text-slate-600">
              <svg className="w-5 h-5 mr-3 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <a href={marathon.link} target="_blank" rel="noopener noreferrer" className="text-[15px] text-blue-500 hover:underline break-all">
                신청 링크 열기
              </a>
            </div>
          )}

          {marathon.description && (
             <div className="flex items-start text-slate-600">
               <svg className="w-5 h-5 mr-3 text-slate-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
               </svg>
               <span className="text-[15px] leading-relaxed whitespace-pre-wrap">
                 {marathon.description}
               </span>
             </div>
          )}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">참가 신청</h2>
        {isPast ? (
           <div className="bg-slate-100 rounded-xl p-6 text-center text-slate-500 shadow-sm border border-slate-200">
             이 대회의 일정이 이미 지났습니다.
           </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
             <MarathonSignupForm marathon={marathon} />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-lg font-bold text-slate-800">참가 예정자</h2>
          <span className="bg-orange-100 text-orange-700 text-sm font-semibold px-2.5 py-0.5 rounded-full">
            {marathon.participants.length}명
          </span>
        </div>

        {marathon.participants.length > 0 ? (
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 divide-y">
            {marathon.participants.map((p, i) => (
              <div key={p.id} className="p-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 text-sm font-medium">
                  {i + 1}
                </div>
                <div>
                   <p className="font-semibold text-slate-800">{p.name}</p>
                   {p.note && <p className="text-sm text-slate-500 mt-0.5">{p.note}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
           <div className="bg-white rounded-2xl p-8 text-center border border-slate-100">
             <div className="text-4xl mb-3">🏃</div>
             <p className="text-slate-500 font-medium">아직 참가 신청자가 없습니다</p>
             <p className="text-sm text-slate-400 mt-1">첫 번째로 신청해보세요!</p>
           </div>
        )}
      </div>
    </main>
  );
}
