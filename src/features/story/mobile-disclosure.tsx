"use client";

import { useState, type ReactNode } from "react";
import styles from "./mobile-disclosure.module.css";

export function MobileDisclosure({
  id,
  more,
  less,
  children,
}: {
  id: string;
  more: string;
  less: string;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={styles.disclosure}>
      <button type="button" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(value => !value)}>
        {expanded ? less : more}
        <span aria-hidden="true">{expanded ? "−" : "+"}</span>
      </button>
      <div id={id} className={styles.content} data-expanded={expanded}>
        {children}
      </div>
    </div>
  );
}
