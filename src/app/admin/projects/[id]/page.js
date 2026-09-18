"use client";

import { useEffect, useState, use } from "react";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { MilestoneTracker } from "@/components/projects/MilestoneTracker";

export default function AdminProjectManagePage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const [project, setProject] = useState(null);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingScope, setSavingScope] = useState(false);
  const [savingMilestones, setSavingMilestones] = useState(false);
  const [archiving, setArchiving] = useState(false);

  const [formData, setFormData] = useState({});
  const [scope, setScope] = useState([]);
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const docRef = doc(db, "projects", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProject({ id: docSnap.id, ...data });
          setFormData({
            status: data.status || "onboarding",
            health: data.health || "on_track",
            developerIds: data.developerIds || [],
            startDate: data.startDate || "",
            expectedDeliveryDate: data.expectedDeliveryDate || ""
          });
          setScope(data.scope || []);
          setMilestones(data.milestones || []);
        }

        const devsSnap = await getDocs(query(collection(db, "users"), where("role", "==", "developer")));
        setDevelopers(devsSnap.docs.map(d => ({id: d.id, ...d.data()})));

      } catch (error) {
        console.error(error);
        toast.error("Failed to load project");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleDevToggle = (devId) => {
    setFormData(prev => ({
      ...prev,
      developerIds: prev.developerIds.includes(devId)
        ? prev.developerIds.filter(id => id !== devId)
        : [...prev.developerIds, devId]
    }));
  };

  const handleSaveProjectDetails = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Project updated successfully");
      setProject(prev => ({ ...prev, ...formData }));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveScope = async () => {
    if (savingScope) return;
    setSavingScope(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/projects/${id}/scope`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ scope })
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error); }
      toast.success("Scope saved successfully");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingScope(false);
    }
  };

  const handleSaveMilestones = async () => {
    if (savingMilestones) return;
    setSavingMilestones(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/projects/${id}/milestones`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ milestones })
      });
      if (!res.ok) { const data = await res.json(); throw new Error(data.error); }
      toast.success("Milestones saved successfully");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingMilestones(false);
    }
  };

  const handleToggleArchive = async () => {
    if (archiving) return;
    const nextArchived = !project.archived;
    setArchiving(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ archived: nextArchived })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(nextArchived ? "Project archived" : "Project restored");
      setProject(prev => ({ ...prev, archived: nextArchived }));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setArchiving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!project) return <div className="p-8">Project not found.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          {project.archived && <span className="text-xs px-2 py-1 bg-muted uppercase tracking-wider font-medium">Archived</span>}
        </div>
        <Button variant="outline" onClick={handleToggleArchive} disabled={archiving}>
          {archiving ? '...' : project.archived ? 'Restore Project' : 'Archive Project'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="border border-border bg-surface p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <h2 className="text-xl font-semibold">Project Details</h2>
              <Button onClick={handleSaveProjectDetails} disabled={saving}>{saving ? 'Saving...' : 'Save Details'}</Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select className="w-full flex h-10 rounded-none border border-input bg-background px-3 py-2 text-sm"
                  value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  <option value="onboarding">Onboarding</option>
                  <option value="in_progress">In Progress</option>
                  <option value="client_review">Client Review</option>
                  <option value="revisions">Revisions</option>
                  <option value="finalization">Finalization</option>
                  <option value="delivered">Delivered</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Health</label>
                <select className="w-full flex h-10 rounded-none border border-input bg-background px-3 py-2 text-sm"
                  value={formData.health} onChange={e => setFormData({...formData, health: e.target.value})}>
                  <option value="on_track">On Track</option>
                  <option value="at_risk">At Risk</option>
                  <option value="delayed">Delayed</option>
                  <option value="on_hold">On Hold</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input type="date" className="w-full flex h-10 rounded-none border border-input bg-background px-3 py-2 text-sm"
                    value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expected Delivery</label>
                  <input type="date" className="w-full flex h-10 rounded-none border border-input bg-background px-3 py-2 text-sm"
                    value={formData.expectedDeliveryDate} onChange={e => setFormData({...formData, expectedDeliveryDate: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          <div className="border border-border bg-surface p-6">
            <h2 className="text-xl font-semibold mb-4">Assigned Developers</h2>
            <div className="border border-input rounded-none p-4 space-y-2 max-h-64 overflow-y-auto">
              {developers.map(dev => (
                <label key={dev.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={formData.developerIds.includes(dev.id)} onChange={() => handleDevToggle(dev.id)} />
                  {dev.name} ({dev.email})
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border bg-surface p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <h2 className="text-xl font-semibold">Project Scope</h2>
              <Button onClick={handleSaveScope} disabled={savingScope}>{savingScope ? 'Saving...' : 'Save Scope'}</Button>
            </div>
            <div className="space-y-3">
              {scope.map((item, i) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-2">
                  <input className="flex-1 border border-input rounded-none px-3 py-1 text-sm bg-transparent"
                    value={item.title} onChange={e => {
                      const newScope = [...scope];
                      newScope[i].title = e.target.value;
                      setScope(newScope);
                    }} placeholder="Scope item (e.g. Home page)" />
                  <select className="border border-input rounded-none px-2 text-sm bg-background"
                    value={item.status} onChange={e => {
                      const newScope = [...scope];
                      newScope[i].status = e.target.value;
                      setScope(newScope);
                    }}>
                    <option value="included">Included</option>
                    <option value="excluded">Excluded</option>
                  </select>
                  <Button variant="outline" onClick={() => setScope(scope.filter((_, idx) => idx !== i))}>X</Button>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => setScope([...scope, { id: Date.now().toString(36) + Math.random().toString(36).substring(2), title: '', status: 'included' }])}>
                + Add Scope Item
              </Button>
            </div>
          </div>

          <div className="border border-border bg-surface p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <h2 className="text-xl font-semibold">Milestones</h2>
              <Button onClick={handleSaveMilestones} disabled={savingMilestones}>{savingMilestones ? 'Saving...' : 'Save Milestones'}</Button>
            </div>
            <div className="mb-4 pb-4 border-b border-border overflow-x-auto">
              <MilestoneTracker milestones={milestones} />
            </div>
            <div className="space-y-3">
              {milestones.map((item, i) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-2">
                  <input className="flex-1 border border-input rounded-none px-3 py-1 text-sm bg-transparent"
                    value={item.title} onChange={e => {
                      const newM = [...milestones];
                      newM[i].title = e.target.value;
                      setMilestones(newM);
                    }} placeholder="Milestone (e.g. UI Design)" />
                  <select className="border border-input rounded-none px-2 text-sm bg-background"
                    value={item.status} onChange={e => {
                      const newM = [...milestones];
                      newM[i].status = e.target.value;
                      setMilestones(newM);
                    }}>
                    <option value="upcoming">Upcoming</option>
                    <option value="current">Current</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                  </select>
                  <Button variant="outline" onClick={() => setMilestones(milestones.filter((_, idx) => idx !== i))}>X</Button>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => setMilestones([...milestones, { id: Date.now().toString(36) + Math.random().toString(36).substring(2), title: '', status: 'upcoming' }])}>
                + Add Milestone
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
