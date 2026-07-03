"use client";

const title = "ADS + MAD";

export function HandwritingText() {
  return (
    <div className="relative">
      <div className="font-sans text-[72px] leading-[1.1] font-semibold tracking-wide text-[#1C1C1E]">
        <div className="whitespace-nowrap">
          {title.split("").map((char, i) => (
            <span
              key={`t-${i}`}
              className="inline-block opacity-0 translate-y-2.5 animate-[writeIn_0.3s_ease-out_forwards]"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </div>
      </div>

      <p
        className="mt-7 font-sans text-[17px] tracking-wide text-[#6C6C70] opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]"
        style={{
          animationDelay: `${title.length * 0.15 + 0.3}s`,
        }}
      >
        Project Management Platform
      </p>
    </div>
  );
}
