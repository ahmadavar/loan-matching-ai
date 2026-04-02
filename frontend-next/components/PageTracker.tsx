"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

export default function PageTracker({ page }: { page: string }) {
  useEffect(() => { track("page_view", page); }, [page]);
  return null;
}
