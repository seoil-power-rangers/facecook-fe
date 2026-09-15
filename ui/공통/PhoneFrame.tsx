/**
 * 모든 화면의 바깥 틀.
 *
 * 안전영역(노치·홈 인디케이터)을 여기 한 곳에서 비운다. 탭바·채팅 입력칸처럼
 * 바닥에 붙는 요소가 화면마다 다른데, 각자 처리하면 빠뜨리는 곳이 생긴다.
 *
 * 하단은 안전영역의 절반만 준다. 홈 인디케이터 막대 자체는 얇고 그 띠의
 * 가운데에 있어서, 절반이면 겹치지 않으면서 화면을 덜 잡아먹는다. 상단은
 * 그대로 둔다 — 거기는 상태바 시계·배터리가 실제로 그려지는 영역이라
 * 줄이면 글자가 겹친다.
 *
 * 다만 자판이 올라와 있을 때는 하단 여백을 걷는다. 홈 인디케이터를 자판이
 * 이미 덮고 있어서, 그대로 두면 입력칸과 자판 사이에 빈 띠가 생긴다.
 * 자판이 떴는지를 CSS로 아는 방법이 없어서 "입력칸에 포커스가 있는가"로
 * 대신한다. focus-within이 아니라 input·textarea로 좁힌 이유는, 안드로이드는
 * 버튼을 눌러도 포커스가 남아서 탭바가 인디케이터 밑으로 내려가기 때문이다.
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-(--color-bg) md:flex md:items-center md:justify-center md:py-8">
      <div className="phone-frame relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-(--color-surface) pb-[calc(env(safe-area-inset-bottom)/2)] pt-[env(safe-area-inset-top)] has-[input:focus]:pb-0 has-[textarea:focus]:pb-0 md:h-[900px] md:w-[430px] md:rounded-[2.5rem] md:shadow-xl md:ring-1 md:ring-(--color-border)">
        {children}
      </div>
    </div>
  );
}
