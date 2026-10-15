"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/firebase";
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ShieldCheck, 
  Loader2, 
  RefreshCw,
  ExternalLink,
  Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConfigStatus {
  configured: boolean;
  senderEmail?: string;
  senderName?: string;
  apiUrl?: string;
  authPrefix?: string;
}

interface TestResult {
  success: boolean;
  status: string;
  message: string;
  notice?: string;
  recipientMasked?: string;
  requestId?: string;
  code?: string;
  durationMs?: number;
  error?: string;
}

export function ZohoEmailDiagnostics() {
  const { user } = useUser();
  const { toast } = useToast();

  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingConfig, setIsCheckingConfig] = useState(true);
  const [config, setConfig] = useState<ConfigStatus | null>(null);
  const [lastResult, setLastResult] = useState<TestResult | null>(null);

  // Set default recipient to current user's email once loaded
  useEffect(() => {
    if (user?.email && !recipient) {
      setRecipient(user.email);
    }
  }, [user?.email, recipient]);

  // Fetch current server-side configuration status
  const fetchConfig = async () => {
    setIsCheckingConfig(true);
    try {
      const token = user ? await user.getIdToken() : "";
      const res = await fetch("/api/email/test", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      } else {
        setConfig({ configured: false });
      }
    } catch {
      setConfig({ configured: false });
    } finally {
      setIsCheckingConfig(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConfig();
    }
  }, [user]);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim()) {
      toast({
        variant: "destructive",
        title: "Recipient Required",
        description: "Please enter a valid recipient email address.",
      });
      return;
    }

    setIsLoading(true);
    setLastResult(null);

    try {
      const token = user ? await user.getIdToken() : "";
      const res = await fetch("/api/email/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          recipientEmail: recipient.trim(),
          customSubject: subject.trim() || undefined,
        }),
      });

      const data = await res.json();
      setLastResult(data);

      if (res.ok && data.success) {
        toast({
          title: "Test Email Dispatched",
          description: `Accepted by Zoho CPaaS (Req ID: ${data.requestId || "OK"})`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Dispatch Unsuccessful",
          description: data.error || data.message || "Failed to send test email.",
        });
      }
    } catch (err: any) {
      setLastResult({
        success: false,
        status: "network_error",
        message: err.message || "Network error communicating with test endpoint",
      });
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border bg-white shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-900 text-white p-5 border-b border-primary/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                Zoho CPaaS Email Infrastructure
                {isCheckingConfig ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                ) : config?.configured ? (
                  <Badge className="bg-primary text-black font-bold text-[10px]">
                    Active Provider
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-amber-400 text-amber-300 font-bold text-[10px]">
                    Unconfigured (Using Fallback)
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs text-slate-300">
                Official Transactional Email API (cpaas.zoho.com) for real-time booking updates & notifications
              </CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchConfig}
            className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs h-8 gap-1.5"
            disabled={isCheckingConfig}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isCheckingConfig ? "animate-spin" : ""}`} /> Refresh Status
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* Environment & Provider Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg border bg-slate-50">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Provider Status
            </div>
            <div className="font-bold flex items-center gap-1.5 text-foreground">
              {config?.configured ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-[#8DB833]" />
                  <span>Zoho CPaaS Configured</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>Token Missing in .env</span>
                </>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {config?.configured
                ? "Outbound messages routed via Zoho CPaaS v1.1 API"
                : "Set ZOHO_CPAAS_SEND_MAIL_TOKEN in environment to activate"}
            </p>
          </div>

          <div className="p-3 rounded-lg border bg-slate-50">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              Configured Sender
            </div>
            <div className="font-bold text-foreground truncate">
              {config?.senderName || "SANEX Company Ltd"}
            </div>
            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
              &lt;{config?.senderEmail || "sanexcompany@gmail.com"}&gt;
            </div>
          </div>

          <div className="p-3 rounded-lg border bg-slate-50">
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
              API Endpoint
            </div>
            <div className="font-mono text-[11px] text-foreground truncate">
              {config?.apiUrl || "https://cpaas.zoho.com/v1.1/email"}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Auth: Zoho-enczapikey
            </div>
          </div>
        </div>

        {/* Test Email Form */}
        <form onSubmit={handleSendTest} className="border rounded-xl p-4 bg-muted/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" /> Send Diagnostic Test Email
            </h3>
            <span className="text-[11px] text-muted-foreground">Privileged Admin Operation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Recipient Email Address *
              </Label>
              <Input
                type="email"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="recipient@example.com"
                className="h-9 text-xs"
                disabled={isLoading}
              />
              <p className="text-[10px] text-muted-foreground">
                Destination mailbox to receive the test verification dispatch.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Custom Subject (Optional)
              </Label>
              <Input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Zoho CPaaS Test Dispatch"
                className="h-9 text-xs"
                disabled={isLoading}
              />
              <p className="text-[10px] text-muted-foreground">
                Leave blank to use the default automated test subject.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" /> Rate limited to 5 test dispatches/min to protect sender reputation
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto h-9 text-xs font-bold bg-primary text-black hover:bg-primary/90 gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Transmitting to Zoho...
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" /> Transmit Test Email
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Test Result Inspection Box */}
        {lastResult && (
          <div
            className={`rounded-xl border p-4 text-xs space-y-2.5 transition-all ${
              lastResult.success
                ? "bg-[#8DB833]/10 border-[#8DB833]/40 text-[#0f172a]"
                : "bg-red-50 border-red-200 text-red-900"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                {lastResult.success ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-[#8DB833] shrink-0" />
                    <span>Dispatched Successfully (Accepted by Zoho CPaaS)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
                    <span>Transmission Failed</span>
                  </>
                )}
              </div>
              {lastResult.durationMs && (
                <Badge variant="outline" className="text-[10px] bg-white">
                  {lastResult.durationMs}ms latency
                </Badge>
              )}
            </div>

            <p className="text-xs leading-relaxed">{lastResult.message || lastResult.error}</p>

            {lastResult.notice && (
              <div className="flex items-start gap-1.5 p-2 rounded bg-white/70 border border-slate-200 text-[11px] text-slate-700">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{lastResult.notice}</span>
              </div>
            )}

            {lastResult.requestId && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 font-mono text-[11px]">
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                    Zoho Request ID
                  </span>
                  <span className="font-bold">{lastResult.requestId}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                    Response Code
                  </span>
                  <span className="font-bold">{lastResult.code || "EM_104"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[9px] uppercase tracking-wider">
                    Recipient
                  </span>
                  <span className="font-bold">{lastResult.recipientMasked || recipient}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Documentation & Help Link */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
          <span>Official Zoho CPaaS API Documentation</span>
          <a
            href="https://www.zoho.com/cpaas/help/api/email-sending.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-bold inline-flex items-center gap-1"
          >
            zoho.com/cpaas/help/api/email-sending.html <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
