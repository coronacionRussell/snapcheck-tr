import { cn } from '@/lib/utils';

export default function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-6"
      >
        <defs>
          <linearGradient id="lightbulb-gradient" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FFA500" />
          </linearGradient>
        </defs>
        <path
          d="M6.4,2H12l2,2h4.6c0.6,0,1,0.4,1,1v14c0,0.6-0.4,1-1,1H5.4c-0.6,0-1-0.4-1-1V3c0-0.6,0.4-1,1-1H6.4z"
          className="fill-primary"
        />
        <path 
          d="M8,7h8v9H8V7z"
          fill="hsl(var(--card))"
        />
        <path 
          d="M9.5 9.5h5"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="1"
          strokeLinecap="round"
        />
         <path 
          d="M9.5 11.5h5"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="1"
          strokeLinecap="round"
        />
         <path 
          d="M9.5 13.5h3"
          stroke="hsl(var(--muted-foreground))"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path
          d="M10 16l1.5 1.5 3-3"
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle 
          cx="19"
          cy="6"
          r="3"
          fill="url(#lightbulb-gradient)"
        />
         <path
          d="M18,9h2v1h-2z"
          className="fill-primary"
        />
      </svg>

      <span className="font-headline text-xl font-bold">SnapCheck</span>
    </div>
  );
}
