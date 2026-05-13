export const EMOTIONS = [
  'EXPLAIN',
  'APPROVE',
  'ATTENTION'
] as const;

export type EmotionType =
  typeof EMOTIONS[number];

export const EMOTION_VIDEO_MAP:
Record<EmotionType, string> = {

  EXPLAIN:
    '/assets/videos/explaining.mp4',

  APPROVE:
    '/assets/videos/thumbs_up.mp4',

  ATTENTION:
    '/assets/videos/hand_raise.mp4'
};