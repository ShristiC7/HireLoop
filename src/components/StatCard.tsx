import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: string;
}

export default function StatCard({ title, value, icon, color = "bg-gradient-to-br from-purple-500 to-purple-600" }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-5 hover:shadow-lg transition-all hover:border-gray-300">
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
    </div>
  );
}
