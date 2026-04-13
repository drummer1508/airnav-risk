import { createContext, useContext, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";

interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  orgUnitId: number | null;
  role: string;
  line: number;
  isActive: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  isSysadmin: boolean;
  isInputer: boolean;
  isReviewer: boolean;
  isApproval: boolean;
  canManageMaster: boolean;
  canCreateRisk: boolean;
  canReviewRisk: boolean;
  canApproveRisk: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", { username, password });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data);
      setLocation("/");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
      setLocation("/");
    },
  });

  const login = useCallback(async (username: string, password: string) => {
    return loginMutation.mutateAsync({ username, password });
  }, [loginMutation]);

  const logout = useCallback(async () => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const currentUser = user ?? null;
  const role = currentUser?.role || "";

  const value: AuthContextType = {
    user: currentUser,
    isLoading,
    login,
    logout,
    isSysadmin: role === "sysadmin",
    isInputer: role === "inputer",
    isReviewer: role === "reviewer",
    isApproval: role === "approval",
    canManageMaster: role === "sysadmin",
    canCreateRisk: role === "inputer" || ((role === "reviewer" || role === "approval") && (currentUser?.line ?? 1) >= 2),
    canReviewRisk: role === "reviewer",
    canApproveRisk: role === "approval",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
