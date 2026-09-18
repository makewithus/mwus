"use client";

import { useEffect, useState } from "react";
import { getProjectsByClient } from "@/lib/services/projects";
import { useAuth } from "@/lib/auth/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function ClientDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      if (user?.clientId) {
        try {
          const data = await getProjectsByClient(user.clientId);
          setProjects(data);
        } catch (error) {
          console.error("Error loading client projects:", error);
          toast.error("Failed to load your projects");
        } finally {
          setLoading(false);
        }
      }
    }
    loadProjects();
  }, [user]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold tracking-tight mb-8">My Projects</h1>
      
      {loading ? (
        <div className="space-y-4">
          {[1].map(i => (
            <div key={i} className="p-6 bg-surface border border-border rounded-none animate-pulse h-32" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-border rounded-none">
          <p className="text-muted-foreground text-sm">You have no active projects.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {projects.map(project => (
            <div key={project.id} className="p-6 bg-surface border border-border rounded-none">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="font-semibold text-lg">{project.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{project.description || "No description provided."}</p>
                </div>
                <span className="text-xs px-2 py-1 bg-foreground text-background rounded-none font-medium uppercase tracking-wider">{project.status}</span>
              </div>
              <div className="space-y-4 text-sm text-muted-foreground max-w-xl">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Overall Progress</span>
                    <span className="font-medium text-foreground">{project.progress}% COMPLETE</span>
                  </div>
                  <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                    <div className="bg-foreground h-full transition-all duration-500" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
                
                <Link href={`/client/projects/${project.id}`}>
                  <Button variant="outline" className="w-full sm:w-auto">View Details</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
