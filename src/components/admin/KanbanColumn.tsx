import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: string;
  title: string;
  count: number;
  color: string;
  children: ReactNode;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, status: string) => void;
}

const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-600' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-600' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-600' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-600' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-600' },
  gray: { bg: 'bg-gray-500/10', border: 'border-gray-500/30', text: 'text-gray-600' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-600' },
};

export function KanbanColumn({ id, title, count, color, children, onDragOver, onDrop }: KanbanColumnProps) {
  const colors = colorClasses[color] || colorClasses.gray;

  return (
    <div 
      className="flex flex-col min-w-[280px] max-w-[320px] flex-shrink-0"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, id)}
    >
      <div className={cn(
        "flex items-center justify-between rounded-t-lg border-b-2 px-3 py-2",
        colors.bg,
        colors.border
      )}>
        <h3 className={cn("font-semibold text-sm", colors.text)}>{title}</h3>
        <span className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
          colors.bg,
          colors.text
        )}>
          {count}
        </span>
      </div>
      <div className="flex-1 space-y-3 rounded-b-lg border border-t-0 bg-muted/30 p-3 min-h-[200px]">
        {children}
      </div>
    </div>
  );
}
