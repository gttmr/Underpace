"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteMarathonButton({ id }: { id: number }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("정말 이 대회 일정을 삭제하시겠습니까?")) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/admin/marathons/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        alert("삭제에 실패했습니다.");
        setDeleting(false);
        return;
      }

      router.refresh();
    } catch {
      alert("네트워크 오류가 발생했습니다.");
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
    >
      {deleting ? "삭제 중..." : "삭제 🗑"}
    </button>
  );
}
