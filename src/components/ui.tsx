"use client";

import { useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { ArrowRight, CircleAlert, Compass, LoaderCircle, Star, X } from "lucide-react";
import type { Astrologer } from "@/types/domain";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return <button className={`btn btn-${variant} ${className}`} {...props} />;
}

export function Avatar({
  astrologer,
  size = 56,
  className = "",
}: {
  astrologer: Astrologer;
  size?: number;
  className?: string;
}) {
  return (
    <Image
      className={`avatar ${className}`}
      src={astrologer.image}
      alt={astrologer.name}
      width={size}
      height={size}
      style={{ width: size, height: size, background: astrologer.color }}
    />
  );
}

export function Stars({ rating, count }: { rating: number; count?: number }) {
  return (
    <span className="rating">
      <Star size={14} fill="currentColor" aria-hidden="true" />
      <strong>{rating.toFixed(1)}</strong>
      {count !== undefined && <span className="muted">({count.toLocaleString("en-IN")})</span>}
    </span>
  );
}

export function Badge({ children, tone = "muted" }: { children: ReactNode; tone?: "gold" | "green" | "muted" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function EmptyState({
  title,
  description,
  href,
  label,
}: {
  title: string;
  description: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Compass size={30} strokeWidth={1.3} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      {href && (
        <Link className="btn btn-primary" href={href}>
          {label || "Explore astrologers"}
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  className = "",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const previousFocus = useRef<HTMLElement | null>(null);
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content
          className={`modal-content ${className}`}
          aria-describedby={undefined}
          onOpenAutoFocus={() => {
            if (document.activeElement instanceof HTMLElement) previousFocus.current = document.activeElement;
          }}
          onCloseAutoFocus={event => {
            event.preventDefault();
            previousFocus.current?.focus();
          }}
        >
          <div className="modal-heading">
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Close className="icon-button" aria-label="Close dialog">
              <X size={20} />
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function LoadingState() {
  return (
    <div className="loading-state" role="status">
      <LoaderCircle size={24} className="spin" />
      <span>Finding a little clarity...</span>
      <div className="skeleton-grid">
        {[1, 2, 3].map(i => (
          <div className="skeleton" key={i} />
        ))}
      </div>
    </div>
  );
}

export function ErrorNotice({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="error-notice" role="alert">
      <CircleAlert size={18} />
      <span>{message}</span>
    </div>
  );
}

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="page-heading-action">{action}</div>}
    </div>
  );
}
