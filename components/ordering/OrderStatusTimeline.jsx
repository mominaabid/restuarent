const STEPS = [
  { status: "sent", label: "Received" },
  { status: "preparing", label: "Preparing" },
  { status: "ready", label: "Ready" },
  { status: "served", label: "Served" },
];

export default function OrderStatusTimeline({ status }) {
  const currentIndex = status === "pending_cashier" || status === "open"
    ? 0
    : STEPS.findIndex((step) => step.status === status);

  return (
    <ol className="flex items-center gap-2">
      {STEPS.map((step, index) => {
        const isDone = currentIndex >= 0 && index <= currentIndex;
        return (
          <li key={step.status} className="flex flex-1 items-center gap-2 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border font-body text-xs font-bold ${
                  isDone ? "border-brand-gold bg-brand-gold text-brand-black" : "border-white/20 text-white/40"
                }`}
              >
                {index + 1}
              </span>
              <span className={`font-body text-[11px] font-semibold uppercase tracking-wide ${isDone ? "text-white" : "text-white/35"}`}>
                {step.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span className={`h-0.5 flex-1 ${index < currentIndex ? "bg-brand-gold" : "bg-white/15"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
