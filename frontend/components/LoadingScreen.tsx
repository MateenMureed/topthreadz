'use client';

interface LoadingScreenProps {
  label?: string;
  fullScreen?: boolean;
}

export default function LoadingScreen({
  label = 'Weaving your experience',
  fullScreen = true,
}: LoadingScreenProps) {
  return (
    <div
      className={
        fullScreen
          ? 'fixed inset-0 z-50 flex items-center justify-center bg-surface-950'
          : 'flex items-center justify-center py-20'
      }
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-7">
        {/* Brand mark */}
        <span className="tt-pulse flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white text-sm font-black tracking-tight text-surface-950 shadow-lg">
          TT
        </span>

        {/* Wordmark */}
        <span className="text-sm font-black tracking-[0.32em] text-white/90">
          TOP&nbsp;THREADZ
        </span>

        {/* Stitch line — the signature element */}
        <svg
          width="220"
          height="28"
          viewBox="0 0 220 28"
          fill="none"
          className="overflow-visible"
        >
          <path
            d="M0,14 Q13.75,3 27.5,14 T55,14 T82.5,14 T110,14 T137.5,14 T165,14 T192.5,14 T220,14"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M0,14 Q13.75,3 27.5,14 T55,14 T82.5,14 T110,14 T137.5,14 T165,14 T192.5,14 T220,14"
            stroke="#C08A4E"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="9 7"
            className="tt-stitch"
          />
          <circle r="3.5" fill="#C08A4E" className="tt-needle" />
        </svg>

        {/* Caption */}
        <p className="flex items-center gap-1 text-xs font-medium tracking-wide text-white/40">
          {label}
          <span className="tt-dots inline-flex w-4 justify-start" />
        </p>
      </div>

      <style jsx>{`
        .tt-pulse {
          animation: tt-pulse 2.2s ease-in-out infinite;
        }
        @keyframes tt-pulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.06);
            opacity: 0.85;
          }
        }

        .tt-stitch {
          animation: tt-stitch 1.1s linear infinite;
        }
        @keyframes tt-stitch {
          to {
            stroke-dashoffset: -32;
          }
        }

        .tt-needle {
          offset-path: path(
            'M0,14 Q13.75,3 27.5,14 T55,14 T82.5,14 T110,14 T137.5,14 T165,14 T192.5,14 T220,14'
          );
          animation: tt-needle 2.6s linear infinite;
        }
        @keyframes tt-needle {
          from {
            offset-distance: 0%;
          }
          to {
            offset-distance: 100%;
          }
        }

        .tt-dots::after {
          content: '';
          animation: tt-dots 1.4s steps(4, end) infinite;
        }
        @keyframes tt-dots {
          0% {
            content: '';
          }
          25% {
            content: '.';
          }
          50% {
            content: '..';
          }
          75% {
            content: '...';
          }
          100% {
            content: '';
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .tt-pulse,
          .tt-stitch,
          .tt-needle,
          .tt-dots::after {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}