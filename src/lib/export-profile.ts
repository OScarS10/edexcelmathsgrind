import { listSessionRecords } from "@/lib/db/session-db";
import { getProfile } from "@/lib/profile/student-profile";
import { getActiveUser } from "@/lib/profile/accounts";

export interface DataExport {
  exportedAt: string;
  app: "edexcel-maths-grind";
  appVersion: string;
  user: string;
  profile: ReturnType<typeof getProfile>;
  sessions: Awaited<ReturnType<typeof listSessionRecords>>;
  note: string;
}

export async function exportAllData(): Promise<void> {
  const user = getActiveUser();
  const profile = getProfile();
  const sessions = await listSessionRecords(1000, user);
  const payload: DataExport = {
    exportedAt: new Date().toISOString(),
    app: "edexcel-maths-grind",
    appVersion: "1",
    user,
    profile,
    sessions,
    note: "Backup of this browser's Edexcel Maths Grind data. Import isn't available yet — keep the file safe if you clear browser data.",
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `edexcel-maths-grind-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}