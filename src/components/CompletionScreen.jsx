export default function CompletionScreen({ streak, onFinish }) {
  return (
    <div className="min-h-svh bg-[#f9f9f7] text-[#1a1c1b] flex flex-col items-center justify-center px-6">
      {/* Checkmark */}
      <div className="w-24 h-24 rounded-3xl bg-white shadow-[0_20px_40px_rgba(26,28,27,0.06)] flex items-center justify-center mb-8">
        <div className="w-16 h-16 rounded-full bg-[#1a1c1b] flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      </div>

      <h1 className="text-5xl font-bold leading-tight tracking-tight text-center mb-8">
        Routine<br />Complete
      </h1>

      {/* Streak card */}
      <div className="w-full max-w-xs bg-[#eeeeec] rounded-2xl p-6 text-center mb-10">
        <p className="text-xs font-medium tracking-[0.2em] uppercase text-[#474747] mb-1">
          Succession
        </p>
        <p className="text-5xl font-bold mb-1">{streak}</p>
        <p className="text-sm text-[#474747]">day streak</p>
      </div>

      {/* Done button */}
      <div className="w-full max-w-xs flex flex-col gap-3">
        <button
          onClick={onFinish}
          className="w-full py-4 rounded-xl bg-[#1a1c1b] text-[#e5e2e1] text-base font-semibold uppercase tracking-wider active:scale-[0.98] transition-transform"
        >
          Done
        </button>
      </div>
    </div>
  )
}
