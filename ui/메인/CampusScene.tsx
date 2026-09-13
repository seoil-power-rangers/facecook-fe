/**
 * 홈 히어로 배경 — 안뇽이가 서 있는 캠퍼스 풍경.
 *
 * 마스코트가 주인공이라 배경은 일부러 채도를 낮췄다. 윤곽선도 넣지 않는다 —
 * 안뇽이만 남색 윤곽선을 가져서 앞으로 떠 보이게 하려는 것.
 *
 * 색은 이 그림에만 쓰이므로 globals.css 토큰으로 빼지 않고 여기 모아둔다.
 */
const SCENE = {
  skyTop: "#B5D8F2",
  skyMid: "#D6EAF8",
  skyLow: "#EDF5F7",
  cloud: "#FFFFFF",
  lawnTop: "#CBE3B8",
  lawnBottom: "#B7D8A4",
  path: "#E8E0CC",
  trunk: "#C9AE84",
  leafLight: "#AED89C",
  leafMid: "#9FCB8E",
  leafDark: "#8FBF7F",
  wall: "#F4EFE4",
  wallLight: "#FBF7EE",
  roof: "#C3D2E0",
  roofDark: "#B9CADB",
  metal: "#8FA6BC",
  window: "#CFE2F2",
  door: "#D8C6A8",
  doorLine: "#C2AE8D",
  clockFace: "#E9F1F8",
} as const;

export function CampusScene() {
  return (
    <svg
      viewBox="0 0 430 360"
      preserveAspectRatio="xMidYMax slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="campus-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SCENE.skyTop} />
          <stop offset="55%" stopColor={SCENE.skyMid} />
          <stop offset="100%" stopColor={SCENE.skyLow} />
        </linearGradient>
        <linearGradient id="campus-lawn" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SCENE.lawnTop} />
          <stop offset="100%" stopColor={SCENE.lawnBottom} />
        </linearGradient>
      </defs>

      <rect width="430" height="360" fill="url(#campus-sky)" />

      <g fill={SCENE.cloud} opacity=".72">
        <g>
          <ellipse cx="62" cy="66" rx="30" ry="17" />
          <ellipse cx="92" cy="60" rx="22" ry="20" />
          <ellipse cx="116" cy="68" rx="24" ry="14" />
        </g>
        <g opacity=".7">
          <ellipse cx="318" cy="44" rx="26" ry="14" />
          <ellipse cx="344" cy="39" rx="19" ry="17" />
          <ellipse cx="366" cy="46" rx="20" ry="12" />
        </g>
        <g opacity=".55">
          <ellipse cx="238" cy="104" rx="34" ry="12" />
          <ellipse cx="266" cy="100" rx="22" ry="14" />
        </g>
      </g>

      {/* 뒤쪽 나무 */}
      <g>
        <rect x="56" y="228" width="7" height="30" rx="3" fill={SCENE.trunk} />
        <circle cx="59" cy="218" r="24" fill={SCENE.leafMid} />
        <circle cx="45" cy="228" r="16" fill={SCENE.leafLight} />
        <circle cx="74" cy="229" r="15" fill={SCENE.leafDark} />

        <rect x="372" y="232" width="7" height="28" rx="3" fill={SCENE.trunk} />
        <circle cx="375" cy="222" r="22" fill={SCENE.leafMid} />
        <circle cx="390" cy="232" r="15" fill={SCENE.leafLight} />
        <circle cx="360" cy="233" r="14" fill={SCENE.leafDark} />
      </g>

      {/* 학교 건물 */}
      <g>
        <rect x="96" y="176" width="238" height="86" rx="6" fill={SCENE.wall} />
        <rect x="96" y="176" width="238" height="12" rx="6" fill={SCENE.roof} />

        <rect x="186" y="130" width="58" height="132" rx="6" fill={SCENE.wallLight} />
        <path d="M215 104 L250 132 L180 132 Z" fill={SCENE.roofDark} />
        <rect x="212" y="92" width="5" height="14" rx="2" fill={SCENE.metal} />
        <circle cx="215" cy="152" r="12" fill={SCENE.clockFace} />
        <circle cx="215" cy="152" r="12" fill="none" stroke={SCENE.roofDark} strokeWidth="2.5" />
        <path
          d="M215 146 V152 L219 155"
          stroke={SCENE.metal}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        <g fill={SCENE.window}>
          <rect x="112" y="198" width="17" height="21" rx="3" />
          <rect x="137" y="198" width="17" height="21" rx="3" />
          <rect x="162" y="198" width="17" height="21" rx="3" />
          <rect x="112" y="228" width="17" height="21" rx="3" />
          <rect x="137" y="228" width="17" height="21" rx="3" />
          <rect x="162" y="228" width="17" height="21" rx="3" />

          <rect x="251" y="198" width="17" height="21" rx="3" />
          <rect x="276" y="198" width="17" height="21" rx="3" />
          <rect x="301" y="198" width="17" height="21" rx="3" />
          <rect x="251" y="228" width="17" height="21" rx="3" />
          <rect x="276" y="228" width="17" height="21" rx="3" />
          <rect x="301" y="228" width="17" height="21" rx="3" />

          <rect x="199" y="176" width="14" height="18" rx="3" />
          <rect x="217" y="176" width="14" height="18" rx="3" />
        </g>

        <path d="M199 262 V224 a16 16 0 0 1 32 0 V262 Z" fill={SCENE.door} />
        <path d="M215 224 V262" stroke={SCENE.doorLine} strokeWidth="2" />
      </g>

      <path d="M0 258 Q215 244 430 258 L430 360 L0 360 Z" fill="url(#campus-lawn)" />
      <path d="M188 258 L242 258 L272 360 L158 360 Z" fill={SCENE.path} />

      <g fill={SCENE.leafMid}>
        <circle cx="28" cy="300" r="15" />
        <circle cx="44" cy="306" r="11" />
        <circle cx="404" cy="296" r="16" />
        <circle cx="386" cy="304" r="11" />
      </g>
    </svg>
  );
}
