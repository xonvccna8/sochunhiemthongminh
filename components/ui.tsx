'use client';

import { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, LoaderCircle, X } from 'lucide-react';

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-lockup">
      <div className="brand-mark">S</div>
      {!compact && (
        <div>
          <div className="brand-name">Sổ Chủ Nhiệm</div>
          <div className="brand-meta">10C3 · 2026 – 2027</div>
        </div>
      )}
    </div>
  );
}

export function Field({
  label,
  required,
  hint,
  error,
  children,
  className = '',
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`field ${className}`}>
      <span className="field-label">
        {label} {required && <b>*</b>}
      </span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function Notice({ type = 'success', children }: { type?: 'success' | 'error'; children: ReactNode }) {
  return (
    <div className={`notice ${type}`}>
      {type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span>{children}</span>
    </div>
  );
}

export function Spinner({ label = 'Đang tải dữ liệu...' }: { label?: string }) {
  return (
    <div className="full-loader" role="status">
      <LoaderCircle className="spin" size={32} />
      <p>{label}</p>
    </div>
  );
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className={`modal ${wide ? 'modal-wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Đóng"><X size={20} /></button>
        </header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}
