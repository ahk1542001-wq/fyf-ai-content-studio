"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Workspace } from "@/backend/types";

interface WorkspaceContextType {
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  isLoading: boolean;
  switchWorkspace: (workspaceId: string) => void;
  createWorkspace: (data: {
    name: string;
    pageName: string;
    industry?: string;
    targetAudience?: string;
    brandDescription?: string;
    riskSensitivity?: "standard" | "strict" | "relaxed";
  }) => Promise<Workspace>;
  refreshWorkspaces: () => Promise<void>;
}

const DEFAULT_WORKSPACE: Workspace = {
  id: "ws-fyf",
  name: "FYF AI",
  pageName: "FYF AI",
  demoMode: true,
  riskSensitivity: "strict",
  industry: "Enterprise AI Systems",
  targetAudience: "Burmese SME business owners and creators",
  brandSummary: "Practical practitioner-grounded AI agent workflows"
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const STORAGE_KEY = "fyf_active_workspace_id";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([DEFAULT_WORKSPACE]);
  const [activeId, setActiveId] = useState<string>("ws-fyf");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const res = await fetch("/api/workspaces");
      if (res.ok) {
        const data = await res.json();
        if (data.workspaces && Array.isArray(data.workspaces)) {
          setWorkspaces(data.workspaces);
        }
      }
    } catch (err) {
      console.error("Failed to load workspaces:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setActiveId(saved);
      }
    }
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const switchWorkspace = useCallback((workspaceId: string) => {
    setActiveId(workspaceId);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, workspaceId);
      // Trigger a window custom event so all open tabs or components can react
      window.dispatchEvent(new CustomEvent("workspaceChanged", { detail: { workspaceId } }));
    }
  }, []);

  const createWorkspace = useCallback(async (data: {
    name: string;
    pageName: string;
    industry?: string;
    targetAudience?: string;
    brandDescription?: string;
    riskSensitivity?: "standard" | "strict" | "relaxed";
  }) => {
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error?.message || "Failed to create workspace");
    }

    const json = await res.json();
    const newWs: Workspace = json.workspace;
    setWorkspaces((prev) => [...prev, newWs]);
    switchWorkspace(newWs.id);
    return newWs;
  }, [switchWorkspace]);

  const currentWorkspace = workspaces.find((w) => w.id === activeId) || workspaces[0] || DEFAULT_WORKSPACE;

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        currentWorkspace,
        isLoading,
        switchWorkspace,
        createWorkspace,
        refreshWorkspaces: fetchWorkspaces
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
