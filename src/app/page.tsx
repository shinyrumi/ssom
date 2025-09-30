export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 p-6 text-neutral-50">
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm uppercase tracking-[0.4em] text-neutral-400">THE SSOM</p>
        <h1 className="mt-4 text-3xl font-semibold">피드 경험 준비 중</h1>
        <p className="mt-3 text-neutral-300">
          MZ 세대 취향을 반영한 쓰레드 기반 대화를 위해 기본 인프라를 구축하는 단계입니다.
          향후 오늘의 질문, 댓글 트리, 상호 하트 배너가 이 공간에 표시될 예정입니다.
        </p>
      </div>
    </main>
  );
}
