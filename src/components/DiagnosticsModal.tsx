import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, ShieldCheck, Server, RefreshCw, ExternalLink } from 'lucide-react';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  upstreamOnline: boolean | null;
  latencyMs?: number;
  totalEvents?: number;
  onTestPing: () => Promise<void>;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({
  isOpen,
  onClose,
  upstreamOnline,
  latencyMs,
  totalEvents,
  onTestPing,
}) => {
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    try {
      await onTestPing();
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div
      id="diagnostics-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        id="diagnostics-modal"
        className="w-full max-w-xl rounded-xl border border-[#33301f] bg-[#1e1b15] p-6 text-[#f0ece0] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#33301f] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-[#e0a72e]/10 p-2 text-[#e0a72e]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#f0ece0]">API Diagnostics & Fix Summary</h2>
              <p className="text-xs text-[#9b9583]">Why the API wasn't loading & how it was resolved</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[#9b9583] hover:text-[#f0ece0]"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          {/* Root cause callout */}
          <div className="rounded-lg border border-[#e0623a]/30 bg-[#e0623a]/10 p-3.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-[#e0623a] mt-0.5" />
              <div>
                <p className="font-semibold text-[#e0623a]">Original Error: Missing CORS Headers</p>
                <p className="mt-1 text-[#f0ece0]/90 leading-relaxed">
                  The upstream host <code className="rounded bg-black/40 px-1 py-0.5 font-mono text-[11px]">events-api-a9et.onrender.com</code> does not return an <code className="font-mono text-[11px]">Access-Control-Allow-Origin</code> header. When your browser script attempted a direct <code className="font-mono text-[11px]">fetch()</code>, the browser security sandbox blocked it immediately with:
                </p>
                <code className="mt-1.5 block rounded bg-black/60 p-2 font-mono text-[11px] text-[#e0623a]">
                  "Couldn't reach the API. Check the URL and that CORS is enabled on your server."
                </code>
              </div>
            </div>
          </div>

          {/* Solutions implemented */}
          <div className="rounded-lg border border-[#33301f] bg-[#16140f] p-3.5 space-y-2">
            <p className="font-semibold text-[#e0a72e] flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
              Fixes Applied:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-[#9b9583]">
              <li>
                <strong className="text-[#f0ece0]">Server-Side API Proxy:</strong> Built an Express proxy route at <code className="text-[#e0a72e]">/api/events</code> that fetches from the upstream server server-side (Node.js has no CORS restrictions).
              </li>
              <li>
                <strong className="text-[#f0ece0]">Venue Name Resolution:</strong> Automatically merges venue details from <code className="text-[#e0a72e]">/api/venues</code> so events display actual venue locations instead of raw IDs.
              </li>
              <li>
                <strong className="text-[#f0ece0]">Rate Limit & Sleep Protection:</strong> Upstream Render has a 100 req/60s rate limit and free-tier spin-down. Added in-memory caching and timeout management.
              </li>
              <li>
                <strong className="text-[#f0ece0]">Search & UI Controls:</strong> Connected real-time search, category filters, and status toggles.
              </li>
            </ul>
          </div>

          {/* Connection status cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-lg border border-[#33301f] bg-[#16140f] p-3">
              <span className="text-[#9b9583]">Upstream API Status</span>
              <p className="mt-1 text-sm font-semibold flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${upstreamOnline ? 'bg-emerald-400' : 'bg-[#e0623a]'}`} />
                {upstreamOnline ? 'Online (Render.com)' : 'Connecting...'}
              </p>
            </div>
            <div className="rounded-lg border border-[#33301f] bg-[#16140f] p-3">
              <span className="text-[#9b9583]">Upstream Latency</span>
              <p className="mt-1 text-sm font-semibold text-[#f0ece0]">
                {latencyMs ? `${latencyMs} ms` : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-[#33301f] pt-4">
          <button
            onClick={handleTest}
            disabled={isTesting}
            className="flex items-center gap-1.5 rounded-md border border-[#33301f] bg-[#16140f] px-3 py-1.5 text-xs font-medium text-[#f0ece0] hover:border-[#e0a72e] hover:text-[#e0a72e] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
            <span>Test Connection Now</span>
          </button>

          <button
            onClick={onClose}
            className="rounded-md bg-[#e0a72e] px-4 py-1.5 text-xs font-semibold text-[#16140f] hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
