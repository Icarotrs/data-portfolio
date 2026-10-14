"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

function formatToday() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

/** Today's date in the visitor's timezone (year only before hydration). */
export function CornerDate() {
  const date = useSyncExternalStore(noop, formatToday, () => String(new Date().getFullYear()));
  return <span>{date}</span>;
}
