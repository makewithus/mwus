"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [archivingId, setArchivingId] = useState(null);
  const initialFormData = {
    name: "",
    clientId: "",
    description: "",
    startDate: "",
    expectedDeliveryDate: "",
    developerIds: [] // Will hold array of dev UIDs
  };
  const [formData, setFormData] = useState(initialFormData);

  const fetchData = async () => {
    try {
      const [snapshot, clientsSnapshot, devsSnapshot] = await Promise.all([
        getDocs(query(collection(db, "projects"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "clients"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "users"), where("role", "==", "developer")))
      ]);
      
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);
      setClients(clientsSnapshot.docs.map(d => ({id: d.id, ...d.data()})));
      setDevelopers(devsSnapshot.docs.map(d => ({id: d.id, ...d.data()})));

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load project data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getHealthBadgeVariant = (health) => {
    switch (health) {
      case 'on_track': return 'default';
      case 'at_risk': return 'secondary';
      case 'off_track': return 'destructive';
      default: return 'outline';
    }
  };

  const handleDevToggle = (devId) => {
    setFormData(prev => ({
      ...prev,
      developerIds: prev.developerIds.includes(devId)
        ? prev.developerIds.filter(id => id !== devId)
        : [...prev.developerIds, devId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      toast.success("Project created successfully");
      setShowModal(false);
      setFormData(initialFormData);
      // The API already returns the full created project - use it directly instead of
      // re-querying all three collections (projects/clients/developers) again.
      setProjects(prev => [{ id: data.id, ...data.project }, ...prev]);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleArchive = async (project) => {
    if (archivingId) return;
    const nextArchived = !project.archived;
    setArchivingId(project.id);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ archived: nextArchived }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update project");

      toast.success(nextArchived ? "Project archived" : "Project restored");
      setProjects(prev => prev.map(p => p.id === project.id ? { ...p, archived: nextArchived } : p));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setArchivingId(null);
    }
  };

  const visibleProjects = projects.filter(p => showArchived || !p.archived);

  return (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Monitor and manage all active client projects.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>New Project</Button>
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer w-fit">
        <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
        Show archived projects
      </label>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Loading projects...</TableCell>
                </TableRow>
              ) : visibleProjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">No projects found.</TableCell>
                </TableRow>
              ) : (
                visibleProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      {project.name}
                      {project.archived && <Badge variant="secondary" className="ml-2 text-[10px] uppercase">Archived</Badge>}
                    </TableCell>
                    <TableCell className="capitalize">{project.status?.replace('_', ' ')}</TableCell>
                    <TableCell>
                      <Badge variant={getHealthBadgeVariant(project.health)}>
                        {project.health?.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-secondary h-2 flex-1 rounded-full overflow-hidden">
                          <div
                            className="bg-foreground h-full rounded-full"
                            style={{ width: `${project.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{project.progress || 0}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/admin/projects/${project.id}`}>
                        <Button variant="outline" size="sm">Manage</Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={archivingId === project.id}
                        onClick={() => handleToggleArchive(project)}
                      >
                        {archivingId === project.id ? '...' : project.archived ? 'Restore' : 'Archive'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-surface border border-border p-6 rounded-none w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Project Name *</label>
                <input required type="text" className="w-full flex h-10 rounded-none border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" 
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Client *</label>
                <select required className="w-full flex h-10 rounded-none border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formData.clientId} onChange={e => setFormData({...formData, clientId: e.target.value})}>
                  <option value="">Select a Client...</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea className="w-full flex min-h-20 rounded-none border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input type="date" className="w-full flex h-10 rounded-none border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expected Delivery</label>
                  <input type="date" className="w-full flex h-10 rounded-none border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    value={formData.expectedDeliveryDate} onChange={e => setFormData({...formData, expectedDeliveryDate: e.target.value})} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assign Developers</label>
                <div className="border border-input rounded-none p-2 space-y-2 max-h-32 overflow-y-auto">
                  {developers.length === 0 && <span className="text-sm text-muted-foreground">No developers found.</span>}
                  {developers.map(dev => (
                    <label key={dev.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={formData.developerIds.includes(dev.id)} onChange={() => handleDevToggle(dev.id)} />
                      {dev.name} ({dev.email})
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Project'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
