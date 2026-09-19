"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="container empty-state" role="alert"><h1>Let&apos;s try that again.</h1><p>Something interrupted this page. Your saved demo data has not been reset.</p><button className="btn btn-primary" onClick={reset}>Try again</button><Link className="text-link" href="/">Return to ASTRA</Link></div>;
}
