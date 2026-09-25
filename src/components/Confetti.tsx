import { useEffect, useState } from 'react';

interface Piece {
  id: number;
  left: number;
  size: number;
  color: string;
  delay: number;
  duration: number;
  rotation: number;
}

export function Confetti({ trigger }: { trigger: number }) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  useEffect(() => {
    if (!trigger) return;
    const colors = ['#C6F542', '#FFFFFF', '#F0B849', '#43D9C6'];
    const next = Array.from({ length: 46 }, (_, id) => ({
      id,
      left: Math.random() * 100,
      size: id % 3 === 0 ? 7 : 6,
      color: colors[id % colors.length],
      delay: Math.random() * 0.5,
      duration: 1.6 + Math.random() * 1.3,
      rotation: Math.random() * 360,
    }));
    setPieces(next);
    const timer = window.setTimeout(() => setPieces([]), 3600);
    return () => window.clearTimeout(timer);
  }, [trigger]);

  return <>{pieces.map((piece) => <i key={piece.id} className="cf" style={{ left: `${piece.left}vw`, width: piece.size, height: piece.id % 3 === 0 ? piece.size : 13, borderRadius: piece.id % 3 === 0 ? '50%' : undefined, background: piece.color, animationDuration: `${piece.duration}s`, animationDelay: `${piece.delay}s`, transform: `rotate(${piece.rotation}deg)` }} />)}</>;
}
