"use client";

const line1 = "ADS";
const line2 = "+MAD";

export function HandwritingText() {
  return (
    <div className="relative">
      <div className="font-sans text-[72px] leading-[1.1] font-semibold tracking-wide text-[#1C1C1E]">
        <div className="mb-2">
          {line1.split("").map((char, i) => (
            <span
              key={`l1-${i}`}
              className="inline-block opacity-0 translate-y-2.5 animate-[writeIn_0.3s_ease-out_forwards]"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {char}
            </span>
          ))}
        </div>

        <div>
          {line2.split("").map((char, i) => (
            <span
              key={`l2-${i}`}
              className="inline-block opacity-0 translate-y-2.5 animate-[writeIn_0.3s_ease-out_forwards]"
              style={{
                animationDelay: `${line1.length * 0.15 + i * 0.15}s`,
              }}
            >
              {char}
            </span>
          ))}
        </div>
      </div>

      <p
        className="mt-7 font-sans text-[17px] tracking-wide text-[#6C6C70] opacity-0 animate-[fadeIn_0.8s_ease-out_forwards]"
        style={{
          animationDelay: `${(line1.length + line2.length) * 0.15 + 0.3}s`,
        }}
      >
        Project Management Platform
      </p>
    </div>
  );
}
