import React, { useState } from 'react';
import { ConnectionMode, ApiHealth } from '../types';
import { DIRECT_API_URL } from '../services/eventsApi';
import { RefreshCw, CheckCircle2, XCircle, Info, ExternalLink } from 'lucide-react';

interface ApiDiagnosticsProps {
  mode: ConnectionMode;
  onModeChange: (mode: ConnectionMode) => void;
  customUrl: string;
  onCustomUrlChange: (url: string) => void;
  health: ApiHealth | null;
  onCheckHealth: () => void;
  isCheckingHealth: boolean;
}

export const ApiDiagnostics: React.FC<ApiDiagnosticsProps> = ({
  mode,
  onModeChange,
  customUrl,
  onCustomUrlChange,
  health,
  onCheckHealth,
  isCheckingHealth,
}) => {
  const [showExplanation, setShowExplanation] = useState(false);

  return (
    <div className="bg-[#1a1712] border-b border-[#33301f] px-6 py-4 text-sm text-[#f0ece0]">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Banner explaining why the original error happened */}
        <div className="p-3 bg-[#1e1b15] border border-[#33301f] rounded-lg text-xs flex items-start gap-3">
          <Info className="w-4 h-4 text-[#e0a72e] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-[#f0ece0]">
              Why wasn&apos;t the API loading?
            </p>
            <p className="text-[#9b9583] leading-relaxed">
              The live endpoint (<code className="text-[#e0a72e]">{DIRECT_API_URL}</code>) does not send 
              browser CORS headers (<code className="text-[#e0a72e]">Access-Control-Allow-Origin</code>). Direct client-side browser 
              fetches get blocked by the browser&apos;s security sandbox.
              We fixed this by adding a local <strong className="text-[#f0ece0]">Express Server Proxy</strong> that fetches from Render on the backend where CORS does not apply.
            </p>
          </div>
        </div>

        {/* Mode Selector and Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#9b9583] block">
              Connection Transport Mode
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onModeChange('proxy')}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                  mode === 'proxy'
                    ? 'bg-[#e0a72e] text-[#16140f] border-[#e0a72e] font-semibold'
                    : 'bg-[#16140f] text-[#f0ece0] border-[#33301f] hover:border-[#e0a72e]/40'
                }`}
              >
                Server Proxy (Recommended)
              </button>

              <button
                type="button"
                onClick={() => onModeChange('cors-proxy')}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                  mode === 'cors-proxy'
                    ? 'bg-[#e0a72e] text-[#16140f] border-[#e0a72e] font-semibold'
                    : 'bg-[#16140f] text-[#f0ece0] border-[#33301f] hover:border-[#e0a72e]/40'
                }`}
              >
                Public CORS Bridge
              </button>

              <button
                type="button"
                onClick={() => onModeChange('direct')}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-colors ${
                  mode === 'direct'
                    ? 'bg-[#e0a72e] text-[#16140f] border-[#e0a72e] font-semibold'
                    : 'bg-[#16140f] text-[#f0ece0] border-[#33301f] hover:border-[#e0a72e]/40'
                }`}
              >
                Direct (Shows CORS error)
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#9b9583]">
                Custom API Base URL (Optional)
              </label>
              {customUrl && (
                <button
                  type="button"
                  onClick={() => onCustomUrlChange('')}
                  className="text-[11px] text-[#e0623a] hover:underline"
                >
                  Reset to default
                </button>
              )}
            </div>
            <input
              type="text"
              placeholder={DIRECT_API_URL}
              value={customUrl}
              onChange={(e) => onCustomUrlChange(e.target.value)}
              className="w-full bg-[#16140f] border border-[#33301f] text-[#f0ece0] text-xs px-3 py-2 rounded focus:outline-none focus:border-[#e0a72e]"
            />
          </div>
        </div>

        {/* Health status & Ping action */}
        <div className="pt-2 border-t border-[#33301f]/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#9b9583]">Upstream Status:</span>
            {health?.upstream === 'connected' ? (
              <span className="inline-flex items-center gap-1 text-[#34d399] font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected ({health.latencyMs}ms latency)
              </span>
            ) : health?.upstream === 'unreachable' ? (
              <span className="inline-flex items-center gap-1 text-[#e0623a] font-medium">
                <XCircle className="w-3.5 h-3.5" />
                Unreachable / Blocked
              </span>
            ) : (
              <span className="text-[#9b9583]">Checking...</span>
            )}
            {health?.error && (
              <span className="text-[#e0623a] text-[11px] max-w-md truncate">
                — {health.error}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCheckHealth}
              disabled={isCheckingHealth}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#1e1b15] border border-[#33301f] text-[#f0ece0] hover:border-[#e0a72e] text-xs transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isCheckingHealth ? 'animate-spin' : ''}`} />
              Ping API Health
            </button>

            <a
              href={DIRECT_API_URL + '/events?limit=3'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#e0a72e] hover:underline text-xs"
            >
              <span>Inspect raw Render API</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
