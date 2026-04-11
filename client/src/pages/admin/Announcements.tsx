import { useState, useEffect } from "react";
import { Megaphone, Plus, Loader2, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { useToast } from "../../hooks/use-toast";

interface Announcement {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  targetRole?: string | null;
  createdAt: string;
  expiresAt?: string | null;
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [targetRole, setTargetRole] = useState<"STUDENT" | "RECRUITER" | "">("STUDENT");
  const { toast } = useToast();

  const fetchAnnouncements = () => {
    api
      .get<{ data: Announcement[]; meta: unknown }>("/admin/announcements")
      .then((res) => setAnnouncements(res.data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || isPosting) return;
    setIsPosting(true);

    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        isPinned,
        targetRole: targetRole || null,
      };
      const res = await api.post<{ data: Announcement }>("/admin/announcements", payload);
      setAnnouncements((prev) => [res.data, ...prev]);
      setTitle("");
      setContent("");
      setIsPinned(false);
      toast({ title: "Announcement posted ✅" });
    } catch (err: unknown) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to post",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      toast({ title: "Announcement deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
        <p className="text-gray-500 text-sm mt-1">Post updates visible to students and recruiters</p>
      </div>

      {/* Post form */}
      <form onSubmit={handlePost} className="bg-white rounded-2xl border p-5 space-y-4">
        <h3 className="font-semibold flex items-center gap-2 text-gray-900">
          <Plus size={16} /> Post New Announcement
        </h3>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Announcement title"
          required
          className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your announcement..."
          required
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />

        <div className="flex gap-4 flex-wrap items-center">
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-600">Target Audience</label>
            <select
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as typeof targetRole)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="STUDENT">Students Only</option>
              <option value="RECRUITER">Recruiters Only</option>
              <option value="">Everyone</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-4">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Pin this announcement</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={isPosting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60"
        >
          {isPosting && <Loader2 size={14} className="animate-spin" />}
          Post Announcement
        </button>
      </form>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 size={18} className="animate-spin" />
          <span>Loading...</span>
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-2xl border p-8 text-center text-gray-500">
          <Megaphone size={32} className="mx-auto mb-2 text-gray-300" />
          <p>No announcements yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Megaphone size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-gray-900">{a.title}</h4>
                    {a.isPinned && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        Pinned
                      </span>
                    )}
                    {a.targetRole && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {a.targetRole}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{a.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1 shrink-0"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
