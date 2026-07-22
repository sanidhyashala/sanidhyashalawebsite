interface ReflectionMetaProps {
  author: string;
  createdAt: string;
}

export default function ReflectionMeta({
  author,
  createdAt,
}: ReflectionMetaProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

  return (
    <div
      className="
        mt-8
        flex
        items-center
        justify-between

        border-t
        border-slate-200
        pt-6

        dark:border-slate-800
      "
    >
      <div className="flex items-center gap-2">
        <div
          className="
            h-2
            w-2
            rounded-full

            bg-blue-600
            dark:bg-blue-400
          "
        />

        <span
          className="
            text-sm
            font-medium

            text-blue-900
            dark:text-blue-400
          "
        >
          {author}
        </span>
      </div>

      <time
        dateTime={createdAt}
        className="
          text-sm

          text-slate-500
          dark:text-slate-400
        "
      >
        {formattedDate}
      </time>
    </div>
  );
}