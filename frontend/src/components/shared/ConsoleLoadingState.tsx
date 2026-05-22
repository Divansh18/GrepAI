type ConsoleLoadingStateProps = {
  label: string;
  title: string;
  command: string;
  withProgress?: boolean;
};

export function ConsoleLoadingState({
  label,
  title,
  command,
  withProgress = false,
}: ConsoleLoadingStateProps) {
  return (
    <main className="min-h-screen bg-[#000000] text-[#F5F5F2]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] items-center px-6 sm:px-8 lg:px-10">
        <section className="w-full max-w-[640px] -translate-y-6">
          <p className="font-[var(--font-ibm-plex-mono)] text-[11px] uppercase tracking-[0.3em] text-[#6B6560]">
            {label}
          </p>

          <h1 className="mt-7 text-[clamp(2.7rem,6vw,4.6rem)] font-bold tracking-[-0.04em] text-[#F5F5F2]">
            {title}
          </h1>

          <p className="mt-6 font-[var(--font-ibm-plex-mono)] text-[13px] tracking-[0.02em] text-white/58">
            {command}
            <span className="ml-1 inline-block animate-[editorialCursor_1.8s_steps(1,end)_infinite]">
              |
            </span>
          </p>

          {withProgress ? (
            <div className="mt-14 h-px w-full overflow-hidden bg-white/10">
              <span className="block h-full w-[36%] bg-white/60 animate-[callbackProgress_1.8s_ease-in-out_infinite]" />
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
