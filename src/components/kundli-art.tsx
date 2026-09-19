export function KundliArt({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 480 480" fill="none" aria-hidden="true">
    <circle cx="240" cy="240" r="229" stroke="currentColor" strokeOpacity=".25" />
    <circle cx="240" cy="240" r="213" stroke="currentColor" strokeOpacity=".5" strokeDasharray="1 11" strokeWidth="3" />
    <g stroke="currentColor" strokeWidth="1.25">
      <rect x="95" y="95" width="290" height="290" rx="4" />
      <path d="m240 95 145 145-145 145L95 240Zm-145 0 290 290m0-290L95 385" />
    </g>
    <g fill="currentColor" fontFamily="Arial, sans-serif" fontSize="12" textAnchor="middle">
      <text x="240" y="184">1</text><text x="167" y="125">2</text><text x="120" y="174">3</text>
      <text x="178" y="244">4</text><text x="120" y="318">5</text><text x="168" y="362">6</text>
      <text x="240" y="310">7</text><text x="310" y="362">8</text><text x="361" y="315">9</text>
      <text x="305" y="244">10</text><text x="361" y="171">11</text><text x="310" y="125">12</text>
    </g>
    <circle cx="240" cy="240" r="26" fill="currentColor" fillOpacity=".12" />
    <path d="m240 221 5 14 14 5-14 5-5 14-5-14-14-5 14-5Z" fill="currentColor" />
    <g fill="currentColor"><circle cx="240" cy="11" r="4" /><circle cx="240" cy="469" r="4" /><circle cx="11" cy="240" r="4" /><circle cx="469" cy="240" r="4" /></g>
  </svg>;
}
