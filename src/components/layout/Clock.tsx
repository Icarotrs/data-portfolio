"use client";

import { useEffect, useState } from "react";

const time = (d: Date) =>
  d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
const date = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase();

/** Live local time and date, top-right corner. */
export function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="label text-right text-on-bg-muted" aria-hidden="true">
      <p className="tabular-nums">{now ? time(now) : " "}</p>
      <p>{now ? date(now) : " "}</p>
    </div>
  );
}
