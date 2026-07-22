interface Props {
  date: string;
}

export default function DateCell({
  date,
}: Props) {
  return (
    <span className="text-sm text-slate-500">
      {new Date(date).toLocaleDateString(
        "en-IN",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      )}
    </span>
  );
}