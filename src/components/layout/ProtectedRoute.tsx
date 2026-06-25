import React, { useEffect } from "react";
import { useAuthStore } from "../../stores/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, initialize, token } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated && token) {
      initialize();
    }
  }, [isAuthenticated, token, initialize]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#060A14] flex flex-col items-center justify-center text-[#F1F5F9]">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-sm text-[#94A3B8]">Verifying Security Access...</p>
      </div>
    );
  }

  if (!isAuthenticated && !token) {
    // Redirection or showing a beautiful landing screen that behaves gracefully
    return (
      <div className="min-h-screen bg-[#060A14] flex flex-col items-center justify-center text-[#F1F5F9] px-4">
        <div className="text-center max-w-md">
          <h2 className="text-3xl font-bold tracking-tight font-sans mb-3 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-200">
            Secure Shield Active
          </h2>
          <p className="text-[#94A3B8] mb-6 text-sm">
            Please log in or register your account credentials to view and synchronize your active goal timelines.
          </p>
          <a
            href="/"
            className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all"
          >
            Authenticate Credentials
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
