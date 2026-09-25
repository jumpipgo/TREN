import { useEffect, type ReactNode } from 'react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  id: string;
  label: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, id, label, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  return (
    <div id={id} className={`sheet ${open ? 'on' : ''}`} role="dialog" aria-modal="true" aria-label={label}>
      <div className="grab" />
      {children}
    </div>
  );
}

export function Toast({ message }: { message: string }) {
  return <div id="toast" className={message ? 'on' : ''} role="status">{message}</div>;
}
