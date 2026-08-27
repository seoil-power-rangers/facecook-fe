/** 시안에 쓰인 아이콘. 총학생회 에셋이 오기 전까지 쓰는 라인 아이콘. */

type IconProps = { className?: string };

function Svg({ children, className }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-full w-full"}
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" strokeWidth={2.6} />
  </Svg>
);

export const ChevronLeft = (p: IconProps) => (
  <Svg {...p}>
    <path d="m15 5-7 7 7 7" strokeWidth={2} />
  </Svg>
);

export const ChevronRight = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9 5 7 7-7 7" strokeWidth={2} />
  </Svg>
);

export const LockIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" />
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
  </Svg>
);

export const PersonIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="8" r="3.4" />
    <path d="M5 20c.7-3.7 3.6-5.6 7-5.6s6.3 1.9 7 5.6" />
  </Svg>
);

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.2" />
    <path d="m16 16 4 4" />
  </Svg>
);

export const CameraIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 8.5h3l1.4-2h6.2l1.4 2h3v10h-15z" />
    <circle cx="12" cy="13" r="3.2" />
  </Svg>
);

export const QrIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <path d="M13.5 13.5h3v3m4 0v4h-7v-3" />
  </Svg>
);

/** 06 활동 타일 12종. constants.ts의 ACTIVITIES와 이름을 맞춘다. */
export const ACTIVITY_ICONS: Record<string, (p: IconProps) => React.ReactElement> = {
  영화보기: (p) => (
    <Svg {...p}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M8 5.5v13M16 5.5v13M3.5 12h17" />
    </Svg>
  ),
  전시관람: (p) => (
    <Svg {...p}>
      <rect x="3.5" y="5" width="17" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m5 17 4.5-5 3.5 4 2.5-2.5L19 17" />
    </Svg>
  ),
  산책: (p) => (
    <Svg {...p}>
      <circle cx="13" cy="4.6" r="1.9" />
      <path d="m9 21 2.4-5.6-1.9-2.4.9-4.1 3.2 1.4 2.2 2.6M11.4 15.4 15 19" />
    </Svg>
  ),
  놀이공원: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="11" r="7" />
      <path d="M12 4v14M5 11h14m-2.1-5.1L7.1 16.1m9.8 0L7.1 5.9" />
    </Svg>
  ),
  "술 한잔": (p) => (
    <Svg {...p}>
      <path d="M5 5h14l-7 7.5zM12 12.5V19m-3.5 0h7" />
    </Svg>
  ),
  드라이브: (p) => (
    <Svg {...p}>
      <path d="M4 15.5h16v-3l-1.8-4H5.8L4 12.5z" />
      <circle cx="7.5" cy="17.5" r="1.6" />
      <circle cx="16.5" cy="17.5" r="1.6" />
    </Svg>
  ),
  여행: (p) => (
    <Svg {...p}>
      <path d="M20.5 3.5 3 10.2l6.4 2.6 2.6 6.4z" />
      <path d="m9.4 12.8 5.6-5.6" />
    </Svg>
  ),
  맛집탐방: (p) => (
    <Svg {...p}>
      <path d="M6 3.5v7M8.6 3.5v7M7.3 10.5v10M17 3.5c-1.6 1.4-2.2 3.2-2.2 5 0 1.4.7 2.4 2.2 2.6v9.4" />
    </Svg>
  ),
  운동: (p) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 4v16M4 12h16" />
    </Svg>
  ),
  쇼핑: (p) => (
    <Svg {...p}>
      <path d="M5.5 8h13l-1 11.5h-11z" />
      <path d="M9 8V6.4a3 3 0 0 1 6 0V8" />
    </Svg>
  ),
  보드게임: (p) => (
    <Svg {...p}>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      <circle cx="9" cy="9" r="1.1" fill="currentColor" />
      <circle cx="15" cy="15" r="1.1" fill="currentColor" />
    </Svg>
  ),
  독서: (p) => (
    <Svg {...p}>
      <path d="M12 6.5C10.4 5.2 8.2 4.7 4.5 4.8v13c3.7-.1 5.9.4 7.5 1.7 1.6-1.3 3.8-1.8 7.5-1.7v-13c-3.7-.1-5.9.4-7.5 1.7z" />
      <path d="M12 6.5v13" />
    </Svg>
  ),
};
