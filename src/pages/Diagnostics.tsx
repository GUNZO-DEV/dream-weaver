import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trash2, Bell, Radio, Clock, FlaskConical, RefreshCw, Smartphone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  type AlarmDiagnosticEntry,
  type AlarmTriggerSource,
  type DeviceContext,
  clearAlarmDiagnostics,
  getDeviceContext,
  loadAlarmDiagnostics,
  subscribeAlarmDiagnostics,
} from "@/lib/alarmDiagnostics";

const sourceMeta: Record<
  AlarmTriggerSource,
  { label: string; icon: typeof Bell; tone: string }
> = {
  "native-notification": { label: "Native notification", icon: Bell, tone: "bg-primary/15 text-primary" },
  realtime: { label: "Realtime (server)", icon: Radio, tone: "bg-accent/15 text-accent-foreground" },
  "web-interval": { label: "Web interval", icon: Clock, tone: "bg-secondary/40 text-secondary-foreground" },
  test: { label: "Test alarm", icon: FlaskConical, tone: "bg-muted text-muted-foreground" },
  "snooze-repeat": { label: "Snooze repeat", icon: RefreshCw, tone: "bg-destructive/15 text-destructive" },
};

const formatTimestamp = (ms: number) => {
  const d = new Date(ms);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
};

const Diagnostics = () => {
  const [entries, setEntries] = useState<AlarmDiagnosticEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<DeviceContext | null>(null);
  const [contextResolving, setContextResolving] = useState(true);

  useEffect(() => {
    let mounted = true;
    void loadAlarmDiagnostics().then((initial) => {
      if (mounted) {
        setEntries(initial);
        setLoading(false);
      }
    });
    void getDeviceContext().then((ctx) => {
      if (mounted) {
        setDevice(ctx);
        setContextResolving(false);
      }
    });
    const unsub = subscribeAlarmDiagnostics((next) => {
      if (mounted) setEntries(next);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const handleClear = async () => {
    await clearAlarmDiagnostics();
  };

  const counts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.source] = (acc[e.source] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 safe-area-top">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            to="/settings"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">Back</span>
          </Link>
          <h1 className="text-base font-semibold">Diagnostics</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={entries.length === 0}
            className="text-destructive hover:text-destructive"
            aria-label="Clear diagnostics log"
          >
            <Trash2 size={18} />
          </Button>
        </div>
      </header>

      <section className="px-4 pt-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          This device
        </p>
        <Card className="p-4 bg-card/60 backdrop-blur border-border">
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-lg p-2 bg-primary/15 text-primary">
              <Smartphone size={18} />
            </div>
            <div className="min-w-0 flex-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <span className="text-muted-foreground">Platform</span>
              <span className="font-medium text-right truncate">{device?.platform ?? "—"}</span>

              <span className="text-muted-foreground">OS</span>
              <span className="font-medium text-right truncate">{device?.osVersion ?? "—"}</span>

              <span className="text-muted-foreground">Device</span>
              <span className="font-medium text-right truncate">
                {device?.manufacturer ? `${device.manufacturer} ${device.model ?? ""}` : device?.model ?? "—"}
              </span>

              <span className="text-muted-foreground">App</span>
              <span className="font-medium text-right truncate tabular-nums">
                {device?.appVersion ? `${device.appVersion} (${device.appBuild ?? "?"})` : "—"}
              </span>

              <span className="text-muted-foreground">WebView</span>
              <span className="font-medium text-right truncate">{device?.webViewVersion ?? "—"}</span>

              <span className="text-muted-foreground">Time zone</span>
              <span className="font-medium text-right truncate">{device?.timezone ?? "—"}</span>

              <span className="text-muted-foreground">Locale</span>
              <span className="font-medium text-right truncate">{device?.locale ?? "—"}</span>
            </div>
          </div>
        </Card>
      </section>

      <section className="px-4 pt-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
          Alarm trigger sources
        </p>
        <Card className="p-4 bg-card/60 backdrop-blur border-border">
          <div className="grid grid-cols-2 gap-3">
            {(Object.keys(sourceMeta) as AlarmTriggerSource[]).map((src) => {
              const Icon = sourceMeta[src].icon;
              return (
                <div
                  key={src}
                  className={`flex items-center gap-3 rounded-xl p-3 ${sourceMeta[src].tone}`}
                >
                  <Icon size={18} />
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs opacity-80">{sourceMeta[src].label}</span>
                    <span className="text-lg font-semibold tabular-nums">
                      {counts[src] ?? 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <section className="px-4 pt-6">
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Recent triggers
          </p>
          <span className="text-xs text-muted-foreground tabular-nums">
            {entries.length} entr{entries.length === 1 ? "y" : "ies"}
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Loading…</p>
        ) : entries.length === 0 ? (
          <Card className="p-8 bg-card/60 border-border text-center">
            <p className="text-sm text-muted-foreground">
              No alarm triggers recorded yet. Fire a test alarm or wait for one to ring.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry) => {
              const meta = sourceMeta[entry.source];
              const Icon = meta?.icon ?? Bell;
              return (
                <Card
                  key={entry.id}
                  className="p-3 bg-card/60 border-border flex items-start gap-3"
                >
                  <div className={`shrink-0 rounded-lg p-2 ${meta?.tone ?? ""}`}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                        {meta?.label ?? entry.source}
                      </Badge>
                      {entry.label && (
                        <span className="text-sm font-medium truncate">{entry.label}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                      {formatTimestamp(entry.timestamp)}
                    </p>
                    {entry.context && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          {entry.context.platform}
                          {entry.context.osVersion ? ` ${entry.context.osVersion}` : ""}
                        </Badge>
                        {entry.context.model && (
                          <Badge variant="secondary" className="text-[10px] font-normal">
                            {entry.context.model}
                          </Badge>
                        )}
                        {entry.context.appVersion && (
                          <Badge variant="secondary" className="text-[10px] font-normal tabular-nums">
                            v{entry.context.appVersion}
                            {entry.context.appBuild ? ` (${entry.context.appBuild})` : ""}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px] font-normal">
                          {entry.context.timezone}
                        </Badge>
                      </div>
                    )}
                    {(entry.alarmId || entry.meta) && (
                      <pre className="text-[10px] text-muted-foreground/80 mt-2 whitespace-pre-wrap break-all font-mono">
                        {JSON.stringify(
                          { alarmId: entry.alarmId, ...entry.meta },
                          null,
                          0
                        )}
                      </pre>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Diagnostics;
