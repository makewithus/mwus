"use client";

import { useEffect, useState, use } from "react";
import { doc, getDoc, collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/Card";

export default function ClientProjectPage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const [project, setProject] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const docRef = doc(db, "projects", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProject({ id: docSnap.id, ...docSnap.data() });
        }

        // Fetch Timeline
        const timelineSnap = await getDocs(query(collection(db, `projects/${id}/timeline`), orderBy("createdAt", "desc")));
        setTimeline(timelineSnap.docs.map(d => ({id: d.id, ...d.data()})));

        // Fetch Client Updates
        const updatesSnap = await getDocs(query(collection(db, `projects/${id}/updates`), where("visibility", "==", "client")));
        const updatesData = updatesSnap.docs.map(d => ({id: d.id, ...d.data()}));
        updatesData.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setUpdates(updatesData);

      } catch (error) {
        console.error(error);
        toast.error("Failed to load project details");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!project) return <div className="p-8">Project not found.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
        <p className="text-muted-foreground">{project.description}</p>
        <div className="mt-4 flex items-center gap-4">
          <span className="text-xs px-2 py-1 bg-foreground text-background rounded-sm font-medium uppercase tracking-wider">{project.status}</span>
          <span className="text-sm font-medium">{project.progress}% Complete</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Updates</h2>
          <div className="space-y-4">
            {updates.length === 0 && <p className="text-sm text-muted-foreground">No updates yet.</p>}
            {updates.map(upd => (
              <div key={upd.id} className="p-4 border border-border rounded-sm bg-surface">
                <div className="flex justify-between items-start mb-2 text-xs text-muted-foreground">
                  <span className="capitalize">{upd.authorName || upd.authorRole}</span>
                  <span>{upd.createdAt?.toDate?.()?.toLocaleDateString()}</span>
                </div>
                <p className="text-sm">{upd.content}</p>
              </div>
            ))}
          </div>

          <h2 className="text-xl font-semibold pt-4">Project Scope</h2>
          <div className="space-y-2">
            {!project.scope || project.scope.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scope defined yet.</p>
            ) : (
              project.scope.map(s => (
                <div key={s.id} className="p-3 border border-border rounded-sm flex justify-between items-center bg-surface">
                  <span className={`text-sm ${s.status === 'excluded' ? 'line-through text-muted-foreground' : ''}`}>{s.title}</span>
                  <span className="text-xs font-semibold uppercase">{s.status}</span>
                </div>
              ))
            )}
          </div>

          <h2 className="text-xl font-semibold pt-4">Milestones</h2>
          <div className="space-y-2">
            {!project.milestones || project.milestones.length === 0 ? (
              <p className="text-sm text-muted-foreground">No milestones defined yet.</p>
            ) : (
              project.milestones.map(m => (
                <div key={m.id} className="p-3 border border-border rounded-sm flex justify-between items-center bg-surface">
                  <span className={`text-sm ${m.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{m.title}</span>
                  <span className="text-xs font-semibold uppercase">{m.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Project Timeline</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                {timeline.length === 0 && <p className="text-sm text-muted-foreground text-center relative z-10">No events recorded.</p>}
                {timeline.map((event, index) => (
                  <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-none border border-white bg-foreground text-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-sm border border-border bg-surface shadow">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-foreground text-sm">{event.title}</div>
                        <time className="text-xs font-medium text-muted-foreground">{event.createdAt?.toDate?.()?.toLocaleDateString()}</time>
                      </div>
                      <div className="text-sm text-muted-foreground">{event.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
