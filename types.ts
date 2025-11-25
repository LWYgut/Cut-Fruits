export interface Point {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  type: 'fruit' | 'bomb';
  emoji: string;
  radius: number;
  isSliced: boolean;
  color: string; // For particle effects
}

export interface SlicedFruit {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number; // The rotation of the emoji content
  rotationSpeed: number;
  cutAngle: number; // The angle of the cut (defines the clipping line)
  side: 'left' | 'right';
  emoji: string;
  color: string;
  radius: number;
  life: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number; // 0 to 1
  color: string;
  size: number;
}

export enum GameState {
  MENU,
  PLAYING,
  GAME_OVER,
}

export interface GameResult {
  score: number;
  fruitsSliced: number;
  bombsHit: number;
  rankTitle?: string;
  rankDescription?: string;
}