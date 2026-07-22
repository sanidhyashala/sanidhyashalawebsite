"use client";

import { useState } from "react";

export function useReflectionDraft() {
  const [content, setContent] = useState("");

  return {
    content,
    setContent,
  };
}