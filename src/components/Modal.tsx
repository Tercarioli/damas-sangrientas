import { useEffect, useRef } from 'react';
export function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); const d = ref.current; return () => d?.close(); }, []);
  return <dialog ref={ref} className="modal" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><button className="close" onClick={onClose} aria-label="Close dialog">×</button><div className="eyebrow">LAST MOVE / FIELD NOTES</div><h2>{title}</h2>{children}</dialog>;
}
