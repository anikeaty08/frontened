export default function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border-b aqua-divider bg-[var(--surface)]">
      <div className="mx-auto flex max-w-[92rem] flex-col gap-6 px-5 py-12 md:flex-row md:items-end md:justify-between lg:px-8">
        <div className="max-w-3xl">
          <p className="aqua-kicker">{eyebrow}</p>
          <h1 className="mt-4 text-4xl font-bold tracking-[-.045em] md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)] md:text-base">
            {description}
          </p>
        </div>
        {action}
      </div>
    </div>
  );
}
