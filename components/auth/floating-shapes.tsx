export function FloatingShapes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-15">
      <div className="absolute top-[10%] right-[15%] size-[200px] animate-[float_8s_ease-in-out_infinite] rounded-full border-2 border-[#D4A96A]" />
      <div className="absolute right-[25%] bottom-[20%] size-[120px] animate-[float_10s_ease-in-out_infinite_reverse] border-2 border-[#C9894A] rotate-[15deg]" />
      <div
        className="absolute top-1/2 right-[10%] animate-[float_12s_ease-in-out_infinite]"
        style={{
          width: 0,
          height: 0,
          borderLeft: "80px solid transparent",
          borderRight: "80px solid transparent",
          borderBottom: "140px solid #E8D8C2",
        }}
      />
    </div>
  );
}