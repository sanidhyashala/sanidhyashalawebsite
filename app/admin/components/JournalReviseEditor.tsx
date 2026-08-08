"use client";

import { useState, useTransition } from "react";
// 👇 Aapka original backend action yahan import kar liya hai
import { saveJournalAction } from "@/app/lib/journal/actions/saveJournalAction";

interface JournalEditorProps {
  slug: string;
  initialHindi: string;
  initialEnglish: string;
}

export default function JournalEditor({
  slug,
  initialHindi,
  initialEnglish,
}: JournalEditorProps) {
  const [hindi, setHindi] = useState(initialHindi);
  const [english, setEnglish] = useState(initialEnglish);
  const [isPending, startTransition] = useTransition();
  
  // 👇 Naya state add kiya taaki save hone par success/error message dikh sake
  const [saveMessage, setSaveMessage] = useState<{ text: string; type: "success" | "error" | "" }>({ text: "", type: "" });

  function handleSave() {
    startTransition(async () => {
      setSaveMessage({ text: "", type: "" }); // Purana message hatao
      
      try {
        // 👇 Backend ko actual data bhej rahe hain
        const result = await saveJournalAction({
          slug,
          hindi,
          english,
        });

        if (result.success) {
          setSaveMessage({ text: result.message, type: "success" });
        } else {
          setSaveMessage({ text: result.message, type: "error" });
        }
      } catch (error) {
        setSaveMessage({
          text: error instanceof Error ? error.message : "Failed to save journal.",
          type: "error",
        });
      }
    });
  }

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Editing</h2>
        <p className="text-sm text-slate-500">{slug}</p>
      </div>

      <div className="space-y-2">
        <label className="font-medium">Hindi Source</label>
        <textarea
          value={hindi}
          onChange={(e) => setHindi(e.target.value)}
          rows={18}
          className="w-full rounded-xl border border-slate-300 p-4 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      <div className="space-y-2">
        <label className="font-medium">English Source</label>
        <textarea
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          rows={18}
          className="w-full rounded-xl border border-slate-300 p-4 font-mono text-sm dark:border-slate-700 dark:bg-slate-900"
        />
      </div>

      {/* 👇 Save hone par User ko message dikhane ke liye UI */}
      {saveMessage.text && (
        <div
          className={`rounded-xl p-4 text-sm ${
            saveMessage.type === "success"
              ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300"
              : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300"
          }`}
        >
          {saveMessage.text}
        </div>
      )}

      <div className="pt-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Journal"}
        </button>
      </div>
    </section>
  );
}