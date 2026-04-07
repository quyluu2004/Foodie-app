import { Platform } from 'react-native';

/** Giới hạn nội dung trang chủ trên web (tránh kéo giãn toàn màn hình) */
export const MAX_HOME_CONTENT_WIDTH = 920;

function contentInnerWidth(windowWidth: number): number {
  if (Platform.OS === 'web') return Math.min(windowWidth, MAX_HOME_CONTENT_WIDTH);
  return windowWidth;
}

/** Thẻ công thức cuộn ngang — truyền `useWindowDimensions().width` */
export function getRecipeCardWidthFor(windowWidth: number): number {
  const inner = contentInnerWidth(windowWidth);
  return Math.min(Math.max(Math.round(inner * 0.72), 236), 300);
}

export function getRecipeCardImageHeight(cardWidth: number): number {
  return Math.round(cardWidth * 0.82);
}

/** 2 cột “Gần đây” */
export function getRecentCardWidthFor(windowWidth: number): number {
  const inner = contentInnerWidth(windowWidth);
  const horizontalPad = 32;
  const gap = 12;
  return Math.max(140, Math.floor((inner - horizontalPad - gap) / 2));
}

/** Thẻ danh mục ngang */
export function getCategoryCardWidthFor(windowWidth: number): number {
  const inner = contentInnerWidth(windowWidth);
  return Math.min(188, Math.max(158, Math.round(inner * 0.42)));
}
