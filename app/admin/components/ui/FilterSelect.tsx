interface Props {
  children: React.ReactNode;
}

export default function FilterSelect({
  children,
}: Props) {
  return (
    <select
      className="
        rounded-2xl
        border
        border-slate-200
        bg-white
        px-4
        py-2.5
        text-sm
        outline-none

        dark:border-slate-700
        dark:bg-slate-900
        dark:text-white
      "
    >
      {children}
    </select>
  );
}