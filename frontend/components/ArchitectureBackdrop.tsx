type ArchitectureBackdropProps = {
  imageOpacity?: string;
  overlayOpacity?: string;
};

export function ArchitectureBackdrop({
  imageOpacity = "0.08",
  overlayOpacity = "0.82",
}: ArchitectureBackdropProps) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div
        className="absolute inset-0 bg-[url('/architecture-bg.png')] bg-no-repeat"
        style={{
          backgroundSize: "cover",
          backgroundPosition: "center top",
          opacity: imageOpacity,
        }}
      />
      <div
        className="absolute inset-0"
        style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
      />
    </div>
  );
}
