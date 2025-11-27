import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Settings, RotateCcw, Play, AlertTriangle } from 'lucide-react';
import { Board } from './components/Board';
import { 
  BoardState, 
  createBoardFromFEN, 
  getLegalMoves, 
  boardToFEN, 
  isPosValid 
} from './utils/xiangqi';
import { getBestMove } from './services/geminiService';
import { Color, Move, Position, Difficulty, GameStatus, PieceType } from './types';

const INITIAL_FEN = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1";

function App() {
  const [board, setBoard] = useState<BoardState>([]);
  const [turn, setTurn] = useState<Color>(Color.RED);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [validDestinations, setValidDestinations] = useState<Position[]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.PLAYING);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Audio refs (optional polish)
  const moveSound = useRef<HTMLAudioElement | null>(null);
  
  // Initialize game
  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    const { board: initialBoard, turn: initialTurn } = createBoardFromFEN(INITIAL_FEN);
    setBoard(initialBoard);
    setTurn(initialTurn);
    setGameStatus(GameStatus.PLAYING);
    setLastMove(null);
    setSelectedPos(null);
    setValidDestinations([]);
    setIsAiThinking(false);
    setAiError(null);
  };

  const handleSquareClick = (pos: Position) => {
    if (gameStatus !== GameStatus.PLAYING || isAiThinking) return;
    if (turn !== Color.RED) return; // Human plays Red

    const piece = board[pos.y][pos.x];

    // If clicking on own piece, select it
    if (piece && piece.color === turn) {
      setSelectedPos(pos);
      // Calculate valid moves for this piece
      const allLegalMoves = getLegalMoves(board, turn);
      const movesForPiece = allLegalMoves
        .filter(m => m.from.x === pos.x && m.from.y === pos.y)
        .map(m => m.to);
      setValidDestinations(movesForPiece);
      return;
    }

    // If clicking on a valid destination for selected piece, move
    if (selectedPos && validDestinations.some(d => d.x === pos.x && d.y === pos.y)) {
      executeMove({ from: selectedPos, to: pos });
    } else {
        // Deselect if clicking empty space or invalid
        setSelectedPos(null);
        setValidDestinations([]);
    }
  };

  const executeMove = (move: Move) => {
    const movingPiece = board[move.from.y][move.from.x];
    if (!movingPiece) return;

    // Capture sound effect simulation or just logic
    const targetPiece = board[move.to.y][move.to.x];
    
    // Update board
    const newBoard = board.map(row => [...row]);
    newBoard[move.to.y][move.to.x] = movingPiece;
    newBoard[move.from.y][move.from.x] = null;
    
    setBoard(newBoard);
    setLastMove(move);
    setSelectedPos(null);
    setValidDestinations([]);

    // Check game over
    // Simple check: did we capture a General? (Xiangqi ends when General is captured or no legal moves)
    // Actually standard rule is Checkmate, but capturing General is the underlying "king capture" logic in simple implementations
    // Proper way: Check if opponent has legal moves.
    
    if (targetPiece?.type === PieceType.GENERAL) {
        setGameStatus(GameStatus.CHECKMATE); // Should have been checkmate before, but this is a fail-safe
        return;
    }

    const nextTurn = turn === Color.RED ? Color.BLACK : Color.RED;
    setTurn(nextTurn);

    // Check if next player has moves
    const nextPlayerMoves = getLegalMoves(newBoard, nextTurn);
    if (nextPlayerMoves.length === 0) {
        setGameStatus(GameStatus.CHECKMATE);
    }
  };

  // AI Turn Effect
  useEffect(() => {
    if (turn === Color.BLACK && gameStatus === GameStatus.PLAYING) {
      const makeAiMove = async () => {
        setIsAiThinking(true);
        setAiError(null);
        
        try {
            // Short delay for realism
            await new Promise(r => setTimeout(r, 500));
            
            const fen = boardToFEN(board, turn);
            const legalMoves = getLegalMoves(board, turn);
            
            if (legalMoves.length === 0) {
                setGameStatus(GameStatus.CHECKMATE); // AI has no moves, Human wins
                setIsAiThinking(false);
                return;
            }

            const bestMove = await getBestMove(fen, difficulty, legalMoves, Color.RED);
            
            if (bestMove) {
                executeMove(bestMove);
            } else {
                // Fallback random
                const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
                executeMove(randomMove);
            }
        } catch (e) {
            console.error("AI Error", e);
            setAiError("AI had trouble thinking. Retrying...");
            // Simple retry logic: just random move to keep game going
            const legalMoves = getLegalMoves(board, turn);
            if(legalMoves.length > 0) {
                 executeMove(legalMoves[Math.floor(Math.random() * legalMoves.length)]);
            }
        } finally {
            setIsAiThinking(false);
        }
      };
      
      makeAiMove();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turn, gameStatus]); // Dependency on turn triggers AI

  const getStatusText = () => {
    if (gameStatus === GameStatus.CHECKMATE) {
      return turn === Color.RED ? "You Lost!" : "You Won!";
    }
    if (gameStatus === GameStatus.STALEMATE) return "Stalemate";
    if (isAiThinking) return "AI is thinking...";
    return turn === Color.RED ? "Your Turn (Red)" : "Waiting...";
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-stone-100 font-sans text-stone-800">
      
      <header className="mb-6 text-center">
        <h1 className="text-4xl md:text-5xl font-bold font-serif mb-2 text-red-800 tracking-wide">
          中国象棋
        </h1>
        <p className="text-stone-500 text-sm md:text-base tracking-widest uppercase">Xiangqi Master AI</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 items-start max-w-6xl w-full">
        
        {/* Main Board Area */}
        <div className="flex-1 w-full flex justify-center">
            <Board 
                board={board} 
                onSquareClick={handleSquareClick}
                selectedPos={selectedPos}
                lastMove={lastMove}
                validDestinations={validDestinations}
                isAiThinking={isAiThinking}
            />
        </div>

        {/* Controls Sidebar */}
        <div className="w-full lg:w-80 bg-white p-6 rounded-xl shadow-lg border border-stone-200 flex flex-col gap-6">
            
            {/* Status Card */}
            <div className={`p-4 rounded-lg text-center border-l-4 shadow-sm transition-colors ${
                gameStatus === GameStatus.CHECKMATE ? 'bg-red-50 border-red-500' :
                turn === Color.RED ? 'bg-red-50 border-red-500' : 'bg-stone-100 border-stone-800'
            }`}>
                <h2 className="text-xl font-bold mb-1">{getStatusText()}</h2>
                {isAiThinking && (
                    <div className="flex justify-center gap-1 mt-2">
                        <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-75"></div>
                        <div className="w-2 h-2 bg-stone-400 rounded-full animate-bounce delay-150"></div>
                    </div>
                )}
            </div>

            {/* Difficulty Selector */}
            <div className="space-y-2">
                <label className="text-sm font-semibold text-stone-500 uppercase flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {Object.values(Difficulty).map((diff) => (
                        <button
                            key={diff}
                            onClick={() => setDifficulty(diff)}
                            disabled={gameStatus === GameStatus.PLAYING && turn === Color.BLACK}
                            className={`py-2 px-1 text-sm rounded-md transition-all font-medium ${
                                difficulty === diff 
                                ? 'bg-stone-800 text-white shadow-md' 
                                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                            }`}
                        >
                            {diff}
                        </button>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 gap-3">
                <button 
                    onClick={resetGame}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold shadow-md active:scale-95 transition-transform"
                >
                    <RotateCcw className="w-5 h-5" /> New Game
                </button>
            </div>

            {/* Rules / Info */}
            <div className="mt-auto pt-4 border-t border-stone-100 text-xs text-stone-400">
                <p>AI powered by Gemini 2.5 Flash.</p>
                <p>Red moves first.</p>
            </div>

            {aiError && (
                 <div className="p-3 bg-amber-50 text-amber-700 text-sm rounded border border-amber-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {aiError}
                 </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default App;
