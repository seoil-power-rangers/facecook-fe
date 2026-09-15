/**
 * 모든 화면의 바깥 틀.
 *
 * 안전영역(노치·홈 인디케이터)을 여기 한 곳에서 비운다. 탭바·채팅 입력칸처럼
 * 바닥에 붙는 요소가 화면마다 다른데, 각자 처리하면 빠뜨리는 곳이 생긴다.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-(--color-bg) md:flex md:items-center md:justify-center md:py-8">
      <div className="phone-frame relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-(--color-surface) pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] md:h-[900px] md:w-[430px] md:rounded-[2.5rem] md:shadow-xl md:ring-1 md:ring-(--color-border)">
        {children}
      </div>
    </div>
  );
}
