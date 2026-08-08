interface DraftRecoveryBannerProps {
  onContinue: () => void;

  onDiscard: () => void;
}

export default function DraftRecoveryBanner({
  onContinue,
  onDiscard,
}: DraftRecoveryBannerProps) {
  return (
    <div
      className="
        mb-6
        rounded-2xl
        border
        border-amber-300
        bg-amber-50
        p-5

        dark:border-amber-700
        dark:bg-amber-900/20
      "
    >
      <h3 className="font-semibold">
        Draft Found
      </h3>

      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        A previously saved journal draft was found.
        Would you like to continue editing it or
        start with a fresh journal?
      </p>

      <div className="mt-4 flex gap-3">

        <button
          type="button"
          onClick={onContinue}
          className="
            rounded-lg
            bg-slate-900
            px-4
            py-2
            text-white

            dark:bg-white
            dark:text-slate-900
          "
        >
          Continue Editing
        </button>

        <button
          type="button"
          onClick={onDiscard}
          className="
            rounded-lg
            border
            border-slate-300
            px-4
            py-2

            dark:border-slate-700
          "
        >
          Start Fresh
        </button>

      </div>

    </div>
  );
}