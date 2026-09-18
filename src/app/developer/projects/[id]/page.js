"use client";

import { useEffect, useState, use } from "react";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export default function DeveloperProjectManagePage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const [project, setProject] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [progress, setProgress] = useState(0);
  const [savingProgress, setSavingProgress] = useState(false);

  const [updateContent, setUpdateContent] = useState("");
  const [updateVisibility, setUpdateVisibility] = useState("internal");
  const [postingUpdate, setPostingUpdate] = useState(false);

  const [milestones, setMilestones] = useState([]);
  const [savingMilestones, setSavingMilestones] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const docRef = doc(db, "projects", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProject({ id: docSnap.id, ...data });
          setProgress(data.progress || 0);
          setMilestones(data.milestones || []);
        }

        const updatesSnap = await getDocs(query(collection(db, `projects/${id}/updates`), orderBy("createdAt", "desc")));
        setUpdates(updatesSnap.docs.map(d => ({id: d.id, ...d.data()})));
      } catch (error) {
        console.error(error);
        toast.error("Failed to load project");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleUpdateProgress = async () => {
    if (savingProgress) return;
    setSavingProgress(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/projects/${id}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ progress: Number(progress) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Progress updated");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingProgress(false);
    }
  };

  const handlePostUpdate = async (e) => {
    e.preventDefault();
    if (postingUpdate) return;
    setPostingUpdate(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/projects/${id}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ content: updateContent, visibility: updateVisibility })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success("Update posted");
      setUpdateContent("");
      setUpdates([{ id: data.id, content: updateContent, visibility: updateVisibility, authorRole: 'developer', createdAt: new Date() }, ...updates]);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setPostingUpdate(false);
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
      toast.success("Milestones updated");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingMilestones(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!project) return <div className="p-8">Project not found.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
        <p className="text-muted-foreground">{project.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-surface border border-border p-6 rounded-none">
            <h2 className="text-xl font-semibold mb-4">Update Progress</h2>
            <div className="flex items-center gap-4">
              <input type="range" min="0" max="100" className="flex-1 accent-foreground" 
                value={progress} onChange={e => setProgress(e.target.value)} />
              <span className="font-bold w-12 text-right">{progress}%</span>
            </div>
            <Button className="mt-6 w-full" onClick={handleUpdateProgress} disabled={savingProgress}>
              {savingProgress ? 'Updating...' : 'Save Progress'}
            </Button>
          </div>

          <div className="bg-surface border border-border p-6 rounded-none">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <h2 className="text-xl font-semibold">Update Milestones</h2>
              <Button size="sm" onClick={handleSaveMilestones} disabled={savingMilestones}>Save</Button>
            </div>
            <div className="space-y-3">
              {!milestones || milestones.length === 0 ? (
                <p className="text-sm text-muted-foreground">No milestones defined.</p>
              ) : (
                milestones.map((m, i) => (
                  <div key={m.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 gap-2 border border-border bg-background rounded-sm">
                    <span className="text-sm font-medium">{m.title}</span>
                    <select className="border border-input rounded-sm px-2 py-1 text-xs bg-transparent"
                      value={m.status} onChange={e => {
                        const newM = [...milestones];
                        newM[i].status = e.target.value;
                        setMilestones(newM);
                      }}>
                      <option value="upcoming">Upcoming</option>
                      <option value="current">Current</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-surface border border-border p-6 rounded-none">
            <h2 className="text-xl font-semibold mb-4">Post Update</h2>
            <form onSubmit={handlePostUpdate} className="space-y-4">
              <textarea required className="w-full min-h-[100px] border border-input rounded-sm p-3 text-sm focus:outline-none focus:ring-1 focus:ring-foreground bg-background"
                placeholder="Write your update or blocker here..."
                value={updateContent} onChange={e => setUpdateContent(e.target.value)} />
              
              <div className="flex flex-col gap-3 mt-2">
                <select className="w-full border border-input rounded-sm p-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-foreground"
                  value={updateVisibility} onChange={e => setUpdateVisibility(e.target.value)}>
                  <option value="internal">Internal Note (Hidden from client)</option>
                  <option value="client">Client Update (Visible to client)</option>
                </select>
                <Button type="submit" disabled={postingUpdate} className="w-full">
                  {postingUpdate ? 'Posting...' : 'Post Update'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface border border-border p-6 rounded-none">
            <h2 className="text-xl font-semibold mb-4">Project Scope</h2>
            <div className="space-y-2">
              {!project.scope || project.scope.length === 0 ? (
                <p className="text-sm text-muted-foreground">No scope defined.</p>
              ) : (
                project.scope.map(s => (
                  <div key={s.id} className="flex justify-between items-center p-3 border border-border bg-background rounded-sm">
                    <span className={`text-sm ${s.status === 'excluded' ? 'line-through text-muted-foreground' : ''}`}>{s.title}</span>
                    <span className="text-xs font-semibold uppercase">{s.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-surface border border-border p-6 rounded-none">
            <h2 className="text-xl font-semibold mb-4">Project Updates</h2>
            <div className="space-y-4">
              {updates.length === 0 && <p className="text-sm text-muted-foreground">No updates yet.</p>}
              {updates.map(upd => (
                <div key={upd.id} className="p-4 border border-border rounded-sm bg-background">
                  <div className="flex justify-between items-start mb-2 text-xs text-muted-foreground">
                    <span className="capitalize">{upd.authorRole}</span>
                    <span className={`px-2 py-1 rounded-sm uppercase tracking-wider font-semibold ${upd.visibility === 'client' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' : 'bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-300'}`}>
                      {upd.visibility}
                    </span>
                  </div>
                  <p className="text-sm">{upd.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
