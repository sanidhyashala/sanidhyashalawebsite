interface Props {
  name: string;
  subtitle?: string;
}

export default function AuthorCell({
  name,
  subtitle,
}: Props) {
  return (
    <div>

      <p className="font-medium text-slate-900 dark:text-white">
        {name}
      </p>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500">
          {subtitle}
        </p>
      )}

    </div>
  );
}