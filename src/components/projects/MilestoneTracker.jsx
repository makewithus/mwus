const SYMBOLS = {
  completed: "✓", // ✓
  current: "●",   // ●
  upcoming: "○",  // ○
  blocked: "!",
};

const LABELS = {
  completed: "Completed",
  current: "Current",
  upcoming: "Upcoming",
  blocked: "Blocked",
};

// Section 07: "✓ Completed / ● Current / ○ Upcoming / ! Blocked" - a stage-by-stage
// journey view, not just a percentage. Doubles as the source of "current stage" text.
export function MilestoneTracker({ milestones }) {
  if (!milestones || milestones.length === 0) {
    return <p className="text-sm text-muted-foreground">No milestones defined yet.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-3">
      {milestones.map((m, i) => (
        <div key={m.id} className="flex items-center">
          <div className="flex flex-col items-center gap-1 px-2 text-center w-24">
            <div
              className={`flex items-center justify-center w-8 h-8 border text-sm font-bold shrink-0 ${
                m.status === "completed" ? "bg-foreground text-background border-foreground" :
                m.status === "current" ? "border-foreground text-foreground" :
                m.status === "blocked" ? "border-destructive text-destructive" :
                "border-border text-muted-foreground"
              }`}
              title={LABELS[m.status] || LABELS.upcoming}
            >
              {SYMBOLS[m.status] || SYMBOLS.upcoming}
            </div>
            <span className="text-xs font-medium leading-tight">{m.title}</span>
          </div>
          {i < milestones.length - 1 && (
            <span className="text-muted-foreground text-sm shrink-0">&rarr;</span>
          )}
        </div>
      ))}
    </div>
  );
}

// Doc's "Preferred V1 behavior" note: derive current stage from milestones where practical.
export function getCurrentStage(milestones) {
  if (!milestones || milestones.length === 0) return null;
  const blocked = milestones.find(m => m.status === "blocked");
  if (blocked) return blocked.title;
  const current = milestones.find(m => m.status === "current");
  if (current) return current.title;
  const firstUpcoming = milestones.find(m => m.status === "upcoming");
  if (firstUpcoming) return firstUpcoming.title;
  return milestones[milestones.length - 1]?.title || null;
}
