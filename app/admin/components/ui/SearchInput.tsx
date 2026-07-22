interface Props {
  placeholder?: string;
}

export default function SearchInput({
  placeholder = "Search...",
}: Props) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      className="
        w-full
        rounded-2xl
        border
        border-slate-200
        bg-white
        px-4
        py-2.5
        text-sm
        outline-none
        transition

        focus:border-slate-900
        focus:ring-2
        focus:ring-slate-900/10

        dark:border-slate-700
        dark:bg-slate-900
        dark:text-white
        dark:focus:border-white
      "
    />
  );
}