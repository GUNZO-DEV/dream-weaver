import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AlarmProvider } from "@/contexts/AlarmContext";
import { PermissionOnboarding } from "@/components/PermissionOnboarding";
import Index from "./pages/Index";
import Stats from "./pages/Stats";
import Sounds from "./pages/Sounds";
import Alarm from "./pages/Alarm";
import Settings from "./pages/Settings";
import Dreams from "./pages/Dreams";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Diagnostics from "./pages/Diagnostics";

const queryClient = new QueryClient();

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// Public route wrapper (redirects to home if logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }
  
  if (user) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/stats" element={<ProtectedRoute><Stats /></ProtectedRoute>} />
      <Route path="/sounds" element={<ProtectedRoute><Sounds /></ProtectedRoute>} />
      <Route path="/alarm" element={<ProtectedRoute><Alarm /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/dreams" element={<ProtectedRoute><Dreams /></ProtectedRoute>} />
      {/* Hidden diagnostics screen — not linked from nav. Direct URL only. */}
      <Route path="/diagnostics" element={<ProtectedRoute><Diagnostics /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  // Global error handler for unhandled promise rejections (iOS crash prevention)
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled rejection:", event.reason);
      event.preventDefault(); // Prevent the default crash behavior
    };

    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AlarmProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <PermissionOnboarding />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AlarmProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
