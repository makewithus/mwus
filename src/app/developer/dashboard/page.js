"use client";

import { useEffect, useState } from "react";
import { getProjectsByDeveloper } from "@/lib/services/projects";
import { useAuth } from "@/lib/auth/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { getCurrentStage } from "@/components/projects/MilestoneTracker";

export default function DeveloperDashboard() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProjects() {
      if (user?.uid) {
        try {
          const data = await getProjectsByDeveloper(user.uid);
          setProjects(data);
        } catch (error) {
          console.error("Error loading developer projects:", error);
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
      <h1 className="text-2xl font-semibold tracking-tight mb-8">My Assigned Projects</h1>
      
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="p-6 bg-surface border border-border rounded-none animate-pulse h-32" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center bg-surface border border-border rounded-none">
          <p className="text-muted-foreground text-sm">No projects assigned to you yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map(project => (
            <div key={project.id} className="p-6 bg-surface border border-border rounded-none flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-semibold text-lg leading-tight">{project.name}</h3>
                  <span className="text-xs px-2 py-1 bg-muted rounded-none font-medium uppercase tracking-wider shrink-0 ml-2">{project.status}</span>
                </div>
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-6">{project.description}</p>
                )}
              </div>
              
              <div className="space-y-6 text-sm text-muted-foreground mt-auto">
                <div className="space-y-2">
                  {getCurrentStage(project.milestones) && (
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Current Stage</span>
                      <span className="font-bold text-foreground">{getCurrentStage(project.milestones)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground">Health</span>
                    <span className="font-bold text-foreground capitalize">{project.health?.replace('_', ' ') || 'On Track'}</span>
                  </div>
                  {project.expectedDeliveryDate && (
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">Delivery</span>
                      <span className="font-bold text-foreground">{new Date(project.expectedDeliveryDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium text-foreground">Progress</span>
                    <span className="font-bold text-foreground">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div className="bg-foreground h-full transition-all duration-500" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
                
                <Link href={`/developer/projects/${project.id}`}>
                  <Button variant="outline" className="w-full">Manage Project</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
