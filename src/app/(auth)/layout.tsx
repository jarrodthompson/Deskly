export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(6,182,212,0.12),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(6,182,212,0.08),transparent_40%)]" />
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="size-9 rounded-lg bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-sm">
            <span className="text-white font-bold">D</span>
          </div>
          <span className="font-semibold text-lg tracking-tight">Deskly</span>
        </div>
        {children}
      </div>
    </div>
  );
}
