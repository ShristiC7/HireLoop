import { useState } from "react";
import { defaultAnnouncements, Announcement } from "../../data/announcements";
import { Megaphone, Plus } from "lucide-react";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(defaultAnnouncements);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      date: new Date().toISOString().split("T")[0],
    };

    setAnnouncements([newAnnouncement, ...announcements]);
    setTitle("");
    setContent("");
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Announcements</h2>

      <form onSubmit={handlePost} className="bg-card rounded-xl border p-5 space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Plus size={16} /> Post New Announcement
        </h3>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Announcement title"
          required
          className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your announcement..."
          required
          rows={3}
          className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
        <button
          type="submit"
          className="px-5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Post Announcement
        </button>
      </form>

      <div className="space-y-3">
        {announcements.map((a) => (
          <div key={a.id} className="bg-card rounded-xl border p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                <Megaphone size={16} />
              </div>
              <div>
                <h4 className="font-medium">{a.title}</h4>
                <p className="text-sm text-muted-foreground mt-1">{a.content}</p>
                <p className="text-xs text-muted-foreground mt-2">{a.date}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
