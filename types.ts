export enum Color {
  RED = 'w', // using standard FEN notation 'w' for Red (plays first)
  BLACK = 'b'
}

export enum PieceType {
  GENERAL = 'k',
  ADVISOR = 'a',
  ELEPHANT = 'b', // 'b' for bishop/elephant in FEN
  HORSE = 'n',    // 'n' for knight/horse
  ROOK = 'r',
  CANNON = 'c',
  SOLDIER = 'p'
}

export interface Position {
  x: number; // 0-8
  y: number; // 0-9
}

export interface Piece {
  type: PieceType;
  color: Color;
}

export interface Move {
  from: Position;
  to: Position;
}

export enum GameStatus {
  PLAYING,
  CHECKMATE,
  STALEMATE,
  DRAW
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard'
}
