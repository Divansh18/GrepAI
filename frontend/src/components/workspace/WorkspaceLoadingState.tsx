type WorkspaceLoadingStateProps = {
  title: string;
  description: string;
};

export function WorkspaceLoadingState({
  title,
  description,
}: WorkspaceLoadingStateProps) {
  return (
    <main
      className="relative min-h-screen overflow-hidden bg-[#FCFCFD] text-[#111318]"
      style={{ fontFamily: "var(--font-landing-inter), sans-serif" }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(17,19,24,0.042) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[980px] items-center px-6 sm:px-10 lg:px-12">
        <section className="w-full max-w-[560px] pb-16">
          <p
            className="text-[11px] uppercase tracking-[0.28em] text-[#737B8C]"
            style={{ fontFamily: "var(--font-ibm-plex-mono), monospace" }}
          >
            GrepAI
          </p>

          <h1 className="mt-6 text-[clamp(2.3rem,5vw,3.7rem)] font-semibold tracking-[-0.04em] text-[#111318]">
            {title}
          </h1>

          <p className="mt-4 max-w-[440px] text-[15px] leading-[1.7] text-[#737B8C]">
            {description}
          </p>

          <div className="mt-10 h-px w-full overflow-hidden bg-[#E6E8ED]">
            <span className="block h-full w-[28%] bg-[#5865D8]/35 animate-[callbackProgress_1.8s_ease-in-out_infinite] motion-reduce:animate-none" />
          </div>
        </section>
      </div>
    </main>
  );
}
