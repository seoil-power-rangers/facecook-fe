import {
  BookOpen,
  Car,
  Dices,
  Dumbbell,
  FerrisWheel,
  Film,
  Footprints,
  Image,
  Plane,
  ShoppingBag,
  Utensils,
  Wine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * 활동 타일 12종. constants.ts의 ACTIVITIES와 이름을 맞춘다.
 * 나머지 아이콘은 전부 lucide-react에서 직접 가져다 쓴다.
 */
export const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  영화보기: Film,
  전시관람: Image,
  산책: Footprints,
  놀이공원: FerrisWheel,
  "술 한잔": Wine,
  드라이브: Car,
  여행: Plane,
  맛집탐방: Utensils,
  운동: Dumbbell,
  쇼핑: ShoppingBag,
  보드게임: Dices,
  독서: BookOpen,
};
