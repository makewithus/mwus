"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { db, auth } from "@/lib/firebase/client";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function AdminClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const initialFormData = {
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    notes: "",
    clientSource: ""
  };
  const [formData, setFormData] = useState(initialFormData);

  const fetchClients = async () => {
    try {
      const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const clientsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(clientsData);
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create client");
      }

      toast.success("Client created successfully. A portal access email has been sent.");
      setShowModal(false);
      setFormData(initialFormData);
      fetchClients();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">Manage client accounts and organizations.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>Add Client</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">Loading clients...</TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">No clients found.</TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.companyName}</TableCell>
                    <TableCell>{client.contactPerson}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                        {client.status || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => toast.info("Client details page coming soon")}>View</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Client Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-surface border border-border p-6 rounded-none w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Client</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Company Name *</label>
                <input required type="text" className="w-full flex h-10 rounded-sm border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" 
                  value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Person *</label>
                <input required type="text" className="w-full flex h-10 rounded-sm border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" 
                  value={formData.contactPerson} onChange={e => {
                    const val = e.target.value.replace(/[^A-Za-z\s]/g, '');
                    if (e.target.value !== val) e.target.value = val;
                    setFormData({...formData, contactPerson: val});
                  }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input required type="email" className="w-full flex h-10 rounded-sm border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring" 
                  value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <input required type="tel" className="w-full flex h-10 rounded-sm border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formData.phone} onChange={e => {
                    const val = e.target.value.replace(/[^0-9+\-\s()]/g, '');
                    if (e.target.value !== val) e.target.value = val;
                    setFormData({...formData, phone: val});
                  }} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country / Location *</label>
                <input required type="text" className="w-full flex h-10 rounded-sm border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Website</label>
                <input type="url" placeholder="https://" className="w-full flex h-10 rounded-sm border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Client Source</label>
                <input type="text" placeholder="Referral, outbound, etc." className="w-full flex h-10 rounded-sm border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formData.clientSource} onChange={e => setFormData({...formData, clientSource: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea rows={2} className="w-full flex rounded-sm border border-input bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Creating...' : 'Create Client'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
