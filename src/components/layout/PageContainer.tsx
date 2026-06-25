import React from "react";

interface PageContainerProps {
  children: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#060A14] text-slate-100 flex flex-col relative overflow-x-hidden select-none selection:bg-indigo-500/30 font-sans">
      {/* Background ambient glowing shapes */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-radial from-indigo-500/10 via-transparent to-transparent opacity-80" />
      <div className="pointer-events-none absolute right-0 bottom-0 w-[400px] h-[400px] bg-radial from-emerald-500/5 via-transparent to-transparent opacity-60" />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 flex flex-col">
        {children}
      </main>
    </div>
  );
};
