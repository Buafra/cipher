export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        glass
        rounded-3xl
        p-6
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-glow
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function Eyebrow({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="
        eyebrow
        mb-4
        flex
        items-center
        gap-2
      "
    >
      <span className="h-px w-6 bg-brass" />
      {children}
    </div>
  );
}