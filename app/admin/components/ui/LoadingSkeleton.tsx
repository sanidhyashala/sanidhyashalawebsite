interface Props {
  className?: string;
}

export default function LoadingSkeleton({
  className = "",
}: Props) {
  return (
    <div
      className={`
        animate-pulse
        rounded-2xl
        bg-slate-200
        dark:bg-slate-800
        ${className}
      `}
    />
  );
}