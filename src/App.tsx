import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { getApiUrl } from "@/lib/api";
import Index from "./pages/Index";
const ChatPage = lazy(() => import("./pages/ChatPage"));
const ComparisonPage = lazy(() => import("./pages/ComparisonPage"));
const SummarizePage = lazy(() => import("./pages/SummarizePage"));
const DraftingPage = lazy(() => import("./pages/DraftingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
import ProtectedRoute from "./components/ProtectedRoute";
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Silently pre-warm backend (e.g. Render free instance cold start) on app load
    fetch(getApiUrl('/health')).catch(() => {});
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense
          fallback={
            <div className="grid min-h-screen place-items-center bg-ink text-sm text-bone-dim" role="status">
              Loading…
            </div>
          }
        >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/chat" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/draft" element={<ProtectedRoute><DraftingPage /></ProtectedRoute>} />
          <Route path="/drafting" element={<Navigate to="/draft" replace />} />
          <Route path="/compare" element={<ProtectedRoute><ComparisonPage /></ProtectedRoute>} />
          <Route path="/comparison" element={<Navigate to="/compare" replace />} />
          <Route path="/summarize" element={<ProtectedRoute><SummarizePage /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);
};

export default App;
