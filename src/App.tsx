import { useState, useEffect } from "react";
import { useAuthStore } from "./stores/authStore";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { CreateGoal } from "./pages/CreateGoal";
import { GoalDetail } from "./pages/GoalDetail";
import { DailyCheckin } from "./pages/DailyCheckin";
import { RescueReplan } from "./pages/RescueReplan";
import { Settings } from "./pages/Settings";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { Navbar } from "./components/layout/Navbar";
import { PageContainer } from "./components/layout/PageContainer";

export default function App() {
  const [page, setPage] = useState<string>("login");
  const [selectedGoalId, setSelectedGoalId] = useState<string>("");
  const { isAuthenticated, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isAuthenticated) {
      setPage("dashboard");
    } else {
      setPage("login");
    }
  }, [isAuthenticated]);

  const renderContent = () => {
    switch (page) {
      case "login":
        return <Login setPage={setPage} />;
      case "dashboard":
        return (
          <ProtectedRoute>
            <Navbar currentPath="dashboard" setPage={setPage} />
            <PageContainer>
              <Dashboard setPage={setPage} setSelectedGoalId={setSelectedGoalId} />
            </PageContainer>
          </ProtectedRoute>
        );
      case "create-goal":
        return (
          <ProtectedRoute>
            <Navbar currentPath="create-goal" setPage={setPage} />
            <PageContainer>
              <CreateGoal setPage={setPage} setSelectedGoalId={setSelectedGoalId} />
            </PageContainer>
          </ProtectedRoute>
        );
      case "goal-detail":
        return (
          <ProtectedRoute>
            <Navbar currentPath="goal-detail" setPage={setPage} />
            <PageContainer>
              <GoalDetail goalId={selectedGoalId} setPage={setPage} />
            </PageContainer>
          </ProtectedRoute>
        );
      case "daily-checkin":
        return (
          <ProtectedRoute>
            <Navbar currentPath="daily-checkin" setPage={setPage} />
            <PageContainer>
              <DailyCheckin goalId={selectedGoalId} setPage={setPage} />
            </PageContainer>
          </ProtectedRoute>
        );
      case "replan":
        return (
          <ProtectedRoute>
            <Navbar currentPath="replan" setPage={setPage} />
            <PageContainer>
              <RescueReplan goalId={selectedGoalId} setPage={setPage} />
            </PageContainer>
          </ProtectedRoute>
        );
      case "settings":
        return (
          <ProtectedRoute>
            <Navbar currentPath="settings" setPage={setPage} />
            <PageContainer>
              <Settings />
            </PageContainer>
          </ProtectedRoute>
        );
      default:
        return <Login setPage={setPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#060A14]">
      {renderContent()}
    </div>
  );
}
