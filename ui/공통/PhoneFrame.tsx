export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-(--color-bg) md:flex md:items-center md:justify-center md:py-8">
      <div className="phone-frame relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-(--color-surface) md:h-[900px] md:w-[430px] md:rounded-[2.5rem] md:shadow-xl md:ring-1 md:ring-(--color-border)">
        {children}
      </div>
    </div>
  );
}
