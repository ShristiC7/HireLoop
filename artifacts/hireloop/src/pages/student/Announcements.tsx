import { motion } from "framer-motion";
import { useListAnnouncements } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Megaphone, Clock, AlertTriangle, Briefcase, Calendar, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const announcementColors: Record<string, string> = {
  urgent: "border-l-red-500",
  placement: "border-l-green-500",
  event: "border-l-blue-500",
  general: "border-l-primary",
};

const getIcon = (type: string) => {
  switch (type) {
    case "urgent": return <AlertTriangle size={18} className="text-red-500" />;
    case "placement": return <Briefcase size={18} className="text-green-500" />;
    case "event": return <Calendar size={18} className="text-blue-500" />;
    default: return <Info size={18} className="text-primary" />;
  }
};

export default function StudentAnnouncements() {
  const { data: announcements, isLoading } = useListAnnouncements();

  return (
    <DashboardLayout requiredRole="student">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
            <Megaphone className="text-primary" size={24} /> Notice Board
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Stay updated with the latest from the Placement Cell</p>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        ) : announcements && announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((ann, i) => (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "p-5 rounded-2xl bg-card border border-card-border border-l-4 flex gap-4 transition-all hover:bg-secondary/20",
                  announcementColors[ann.type]
                )}
              >
                <div className="pt-0.5">
                  {getIcon(ann.type)}
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <h2 className="text-[15px] font-bold text-foreground">{ann.title}</h2>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                      <Clock size={12} />
                      {formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {ann.content}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground capitalize">
                      {ann.type} Notice
                    </span>
                    <span className="text-xs text-muted-foreground pb-px">
                      Posted by {ann.authorName}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-card border border-dashed border-border text-center">
            <Megaphone size={40} className="text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold">No announcements</h3>
            <p className="text-muted-foreground text-sm mt-2">You're all caught up! Check back later for new updates.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
