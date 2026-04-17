import { useState } from "react";
import { motion } from "framer-motion";
import { useListAnnouncements, useCreateAnnouncement, getListAnnouncementsQueryKey } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Megaphone, Plus, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const ANNOUNCEMENT_TYPES = ["general", "urgent", "placement", "event"] as const;
const typeColors: Record<string, string> = {
  urgent: "border-l-red-500 bg-red-500/5",
  placement: "border-l-green-500 bg-green-500/5",
  event: "border-l-blue-500 bg-blue-500/5",
  general: "border-l-primary bg-primary/5",
};
const typeBadge: Record<string, string> = {
  urgent: "bg-red-500/10 text-red-400 border-red-500/20",
  placement: "bg-green-500/10 text-green-400 border-green-500/20",
  event: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  general: "bg-primary/10 text-primary border-primary/20",
};

export default function AdminAnnouncements() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<typeof ANNOUNCEMENT_TYPES[number]>("general");
  const [showForm, setShowForm] = useState(false);

  const { data: announcements, isLoading } = useListAnnouncements();
  const createAnnouncement = useCreateAnnouncement();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    createAnnouncement.mutate({ data: { title, content, type } }, {
      onSuccess: () => {
        setTitle("");
        setContent("");
        setType("general");
        setShowForm(false);
        queryClient.invalidateQueries({ queryKey: getListAnnouncementsQueryKey() });
        toast({ title: "Announcement published!" });
      },
      onError: () => toast({ title: "Failed to publish", variant: "destructive" }),
    });
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Megaphone size={20} className="text-primary" />
              <h1 className="text-2xl font-bold font-serif">Announcements</h1>
            </div>
            <p className="text-muted-foreground text-sm">Broadcast updates to students and recruiters</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold"
            data-testid="button-new-announcement"
          >
            <Plus size={15} /> New Announcement
          </motion.button>
        </div>

        {/* Create form */}
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-card border border-primary/20"
          >
            <h2 className="font-semibold mb-4">Create Announcement</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block">Type</label>
                <div className="flex gap-2">
                  {ANNOUNCEMENT_TYPES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border capitalize transition-all", type === t ? typeBadge[t] : "border-border text-muted-foreground hover:border-primary/30")}
                      data-testid={`type-${t}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Title</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title" data-testid="input-title" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block">Content</label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={4}
                  placeholder="Write your announcement..."
                  className="w-full bg-transparent border border-input rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="input-content"
                />
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleCreate}
                  disabled={createAnnouncement.isPending}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-60"
                  data-testid="button-publish"
                >
                  <Megaphone size={14} />
                  {createAnnouncement.isPending ? "Publishing..." : "Publish"}
                </motion.button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-card rounded-2xl animate-pulse" />)}</div>
        ) : (announcements ?? []).length === 0 ? (
          <div className="text-center py-16">
            <Megaphone size={40} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-semibold">No announcements yet</p>
            <p className="text-muted-foreground text-sm mt-2">Create your first announcement above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(announcements ?? []).map((ann, i) => (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={cn("p-5 rounded-2xl border border-card-border border-l-2", typeColors[ann.type])}
                data-testid={`announcement-${ann.id}`}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="font-semibold text-sm">{ann.title}</h3>
                  <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize shrink-0", typeBadge[ann.type])}>{ann.type}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{ann.content}</p>
                <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                  <Clock size={11} />
                  {formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
