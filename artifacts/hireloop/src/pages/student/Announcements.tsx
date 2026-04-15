import { motion } from "framer-motion";
import { useListAnnouncements } from "@workspace/api-client-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Megaphone, Clock, AlertTriangle, Briefcase, Calendar, Info, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

export default function Announcements() {
  const { data: announcements, isLoading } = useListAnnouncements();
  const [search, setSearch] = useState("");

  const getIcon = (type: string) => {
    switch (type) {
      case "urgent": return <AlertTriangle className="text-destructive" size={20} />;
      case "placement": return <Briefcase className="text-primary" size={20} />;
      case "event": return <Calendar className="text-amber-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  };

  const filtered = (announcements ?? []).filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) || 
    a.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout requiredRole="student">
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
              <Megaphone className="text-primary" size={24} />
              Placement Notice Board
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Stay updated with the latest campus news and recruitment alerts.</p>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <Input 
              placeholder="Filter announcements..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-2xl bg-card animate-pulse border border-card-border" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4">
            {filtered.map((ann, index) => (
              <motion.div
                key={ann.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 rounded-2xl bg-card border border-card-border hover:border-primary/20 transition-all flex gap-5 items-start"
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                  {
                    "bg-destructive/10": ann.type === "urgent",
                    "bg-primary/10": ann.type === "placement",
                    "bg-amber-500/10": ann.type === "event",
                    "bg-blue-500/10": ann.type === "general",
                  }
                )}>
                  {getIcon(ann.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="font-semibold text-lg">{ann.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap bg-secondary/50 px-2.5 py-1 rounded-full">
                      <Clock size={12} />
                      {formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {ann.content}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <span className="px-2 py-0.5 rounded-md bg-primary/5 border border-primary/10 uppercase tracking-wider">
                      {ann.type}
                    </span>
                    <span className="text-muted-foreground font-normal">Posted by {ann.authorName}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
            <Megaphone size={48} className="text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">No matching announcements</h3>
            <p className="text-sm text-muted-foreground/60 mt-2">Check back later for fresh updates from the Placement Cell.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
