"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const q = query(
          collection(db, "auditLogs"),
          orderBy("createdAt", "desc"),
          limit(20)
        );
        const snapshot = await getDocs(q);
        const logsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLogs(logsData);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
        toast.error("Failed to load audit logs");
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  return (
    <div className="p-8 w-full max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">System-wide chronological feed of actions.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">Loading audit logs...</TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">No logs found.</TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="uppercase text-[10px]">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.actorName || log.actorId}</TableCell>
                    <TableCell className="text-muted-foreground">{log.entityType} {log.entityId ? `(${log.entityId})` : ""}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {log.description || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setSelectedLog(log)}>View</Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={() => setSelectedLog(null)}>
          <div className="bg-surface border border-border p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold">Audit Record</h2>
              <Badge variant="secondary" className="uppercase text-[10px]">{selectedLog.action}</Badge>
            </div>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground shrink-0">Timestamp</dt><dd className="text-right">{formatDate(selectedLog.createdAt)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground shrink-0">Actor</dt><dd className="text-right">{selectedLog.actorName || selectedLog.actorId} ({selectedLog.actorRole})</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted-foreground shrink-0">Resource</dt><dd className="text-right">{selectedLog.entityType} {selectedLog.entityId ? `(${selectedLog.entityId})` : ""}</dd></div>
              {selectedLog.clientId && <div className="flex justify-between gap-4"><dt className="text-muted-foreground shrink-0">Client</dt><dd className="text-right">{selectedLog.clientId}</dd></div>}
              {selectedLog.projectId && <div className="flex justify-between gap-4"><dt className="text-muted-foreground shrink-0">Project</dt><dd className="text-right">{selectedLog.projectId}</dd></div>}
            </dl>
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase mb-1">Description</h3>
              <p className="text-sm border border-border bg-background p-3 whitespace-pre-wrap wrap-break-word">{selectedLog.description || "-"}</p>
            </div>
            {selectedLog.previousValue && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase mb-1">Previous Value</h3>
                <pre className="text-xs border border-border bg-background p-3 overflow-x-auto whitespace-pre-wrap wrap-break-word">{JSON.stringify(selectedLog.previousValue, null, 2)}</pre>
              </div>
            )}
            {selectedLog.newValue && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase mb-1">New Value</h3>
                <pre className="text-xs border border-border bg-background p-3 overflow-x-auto whitespace-pre-wrap wrap-break-word">{JSON.stringify(selectedLog.newValue, null, 2)}</pre>
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedLog(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
