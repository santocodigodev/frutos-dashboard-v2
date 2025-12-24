type StatsCardProps = {
  title: string;
  value: string | number;
  change?: string;
  color?: string;
};

export default function StatsCard({ title, value, change, color = "purple" }: StatsCardProps) {
  const colorClass = color === "green"
    ? "text-green-600"
    : color === "red"
    ? "text-red-600"
    : "text-purple-600";
  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col items-start min-w-[160px] text-gray-500">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-gray-500">{title}</div>
      {change && <div className={`text-xs mt-1 ${colorClass}`}>{change}</div>}
    </div>
  );
}
