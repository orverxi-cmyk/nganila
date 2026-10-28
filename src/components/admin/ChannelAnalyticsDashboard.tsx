"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from "recharts";
import { 
  TrendingUp, 
  Share2, 
  Search, 
  Mail, 
  Globe, 
  HelpCircle, 
  Award, 
  ArrowUpRight, 
  Sparkles,
  RefreshCw,
  Clock
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BookingData {
  id: string;
  customerName?: string;
  email?: string;
  phone?: string;
  serviceType?: string;
  status?: string;
  referralSource?: string;
  description?: string;
  createdAt?: number | string;
}

interface ChannelAnalyticsDashboardProps {
  bookings: BookingData[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const BRAND_GREEN = "#8DB833";
export const BRAND_BLACK = "#000000";
export const BRAND_PIE_COLORS = ["#8DB833", "#000000", "#6E9222", "#262626", "#A5CD4C", "#404040"];

export const CHANNEL_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  "LinkedIn": { 
    label: "LinkedIn", 
    color: BRAND_GREEN, 
    icon: Share2, 
    bg: "bg-primary/10 text-black border-primary/20" 
  },
  "Google Search": { 
    label: "Google Search", 
    color: BRAND_GREEN, 
    icon: Search, 
    bg: "bg-primary/10 text-black border-primary/20" 
  },
  "Facebook": { 
    label: "Facebook", 
    color: BRAND_GREEN, 
    icon: Globe, 
    bg: "bg-primary/10 text-black border-primary/20" 
  },
  "Email": { 
    label: "Email", 
    color: BRAND_GREEN, 
    icon: Mail, 
    bg: "bg-primary/10 text-black border-primary/20" 
  },
  "Others": { 
    label: "Others", 
    color: BRAND_BLACK, 
    icon: HelpCircle, 
    bg: "bg-muted text-black border-border" 
  },
  "Direct / Unspecified": { 
    label: "Direct / Unspecified", 
    color: BRAND_BLACK, 
    icon: Globe, 
    bg: "bg-muted text-black border-border" 
  }
};

// Normalized Channel Extraction - strictly respects live data
export const getChannelKey = (source?: string): string => {
  if (!source || !source.trim()) return "Direct / Unspecified";
  const trimmed = source.trim();
  const lower = trimmed.toLowerCase();
  if (lower === "linkedin" || lower.includes("linkedin")) return "LinkedIn";
  if (lower === "google" || lower.includes("google")) return "Google Search";
  if (lower === "facebook" || lower.includes("facebook")) return "Facebook";
  if (lower === "email" || lower.includes("email") || lower.includes("mail")) return "Email";
  if (lower === "other" || lower === "others") return "Others";
  return trimmed;
};

export const getChannelConfig = (channelName: string): { label: string; color: string; icon: any; bg: string } => {
  if (CHANNEL_CONFIG[channelName]) {
    return CHANNEL_CONFIG[channelName];
  }
  const lower = channelName.toLowerCase();
  if (lower.includes("linkedin")) return CHANNEL_CONFIG["LinkedIn"];
  if (lower.includes("google") || lower.includes("search")) return CHANNEL_CONFIG["Google Search"];
  if (lower.includes("facebook") || lower.includes("fb")) return CHANNEL_CONFIG["Facebook"];
  if (lower.includes("email") || lower.includes("mail")) return CHANNEL_CONFIG["Email"];
  return {
    label: channelName,
    color: BRAND_GREEN,
    icon: Globe,
    bg: "bg-primary/10 text-black border-primary/20"
  };
};

export function ChannelAnalyticsDashboard({ bookings = [], onRefresh, isRefreshing = false }: ChannelAnalyticsDashboardProps) {
  const [timeFilter, setTimeFilter] = React.useState<"all" | "30d" | "7d">("all");

  // Filter bookings by timeframe
  const filteredBookings = React.useMemo(() => {
    const now = Date.now();
    return bookings.filter(b => {
      if (timeFilter === "all") return true;
      const createdAt = typeof b.createdAt === "number" ? b.createdAt : new Date(b.createdAt || 0).getTime();
      if (!createdAt) return true;
      const daysDiff = (now - createdAt) / (1000 * 60 * 60 * 24);
      return timeFilter === "30d" ? daysDiff <= 30 : daysDiff <= 7;
    });
  }, [bookings, timeFilter]);

  // Aggregate channel statistics strictly from real live bookings (zero mock channels)
  const channelStats = React.useMemo(() => {
    const counts: Record<string, { total: number; confirmed: number; pending: number; cancelled: number }> = {};

    filteredBookings.forEach(booking => {
      const rawSource = (booking.referralSource || "").trim();
      const key = rawSource ? getChannelKey(rawSource) : "Direct / Unspecified";
      if (!counts[key]) {
        counts[key] = { total: 0, confirmed: 0, pending: 0, cancelled: 0 };
      }
      counts[key].total += 1;
      const status = (booking.status || "pending").toLowerCase();
      if (status === "confirmed" || status === "completed") {
        counts[key].confirmed += 1;
      } else if (status === "cancelled") {
        counts[key].cancelled += 1;
      } else {
        counts[key].pending += 1;
      }
    });

    const totalAll = filteredBookings.length;
    if (totalAll === 0) return [];

    return Object.entries(counts).map(([name, data]) => {
      const share = Math.round((data.total / totalAll) * 100);
      const conversionRate = data.total > 0 ? Math.round((data.confirmed / data.total) * 100) : 0;
      const config = getChannelConfig(name);
      return {
        name,
        total: data.total,
        confirmed: data.confirmed,
        pending: data.pending,
        cancelled: data.cancelled,
        share,
        conversionRate,
        color: config.color,
        bg: config.bg,
        icon: config.icon
      };
    }).sort((a, b) => b.total - a.total);
  }, [filteredBookings]);

  // Key performance metrics
  const totalLeads = filteredBookings.length;
  const activeChannels = channelStats.filter(c => c.total > 0);
  const topVolumeChannel = activeChannels.length > 0 ? activeChannels[0] : null;
  const topConversionChannel = [...activeChannels].sort((a, b) => b.conversionRate - a.conversionRate)[0] || null;
  const trackedDigitalLeads = channelStats
    .filter(c => c.name !== "Direct / Unspecified")
    .reduce((sum, c) => sum + c.total, 0);
  const trackingCoverage = totalLeads > 0 ? Math.round((trackedDigitalLeads / totalLeads) * 100) : 0;

  // Chart data strictly from real live channels using brand palette
  const pieChartData = channelStats.filter(c => c.total > 0).map((c, index) => ({
    name: c.name,
    value: c.total,
    color: BRAND_PIE_COLORS[index % BRAND_PIE_COLORS.length]
  }));

  const barChartData = channelStats.filter(c => c.total > 0).map(c => ({
    name: c.name,
    "Confirmed Bookings": c.confirmed,
    "Pending Inquiries": c.pending,
    "Total Requests": c.total
  }));

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary/20 text-black border-primary/30 font-bold uppercase text-[10px] tracking-wider">
              Marketing Intelligence
            </Badge>
            <span className="text-xs text-muted-foreground">• Live Service Referral Tracking</span>
          </div>
          <h2 className="text-2xl font-bold font-headline tracking-tight text-foreground">
            Communication Channels Performance
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify which outreach and marketing sources generate the most confirmed waste management bookings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Timeframe Filter Buttons */}
          <div className="bg-muted p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setTimeFilter("all")}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all",
                timeFilter === "all" ? "bg-white text-black shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeFilter("30d")}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all",
                timeFilter === "30d" ? "bg-white text-black shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setTimeFilter("7d")}
              className={cn(
                "px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all",
                timeFilter === "7d" ? "bg-white text-black shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Last 7 Days
            </button>
          </div>

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-9 text-[10px] font-bold uppercase tracking-widest gap-2"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Top Lead Channel */}
        <Card className="border bg-white shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full pointer-events-none" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider">Top Acquisition Channel</span>
              <Award className="h-4 w-4 text-black" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {topVolumeChannel && topVolumeChannel.total > 0 ? topVolumeChannel.name : "None yet"}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-primary text-white font-bold text-[10px]">
                {topVolumeChannel && topVolumeChannel.total > 0 ? `${topVolumeChannel.share}% Share` : "0%"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {topVolumeChannel && topVolumeChannel.total > 0 ? `${topVolumeChannel.total} total inquiries` : "0 inquiries recorded"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Highest Conversion Channel */}
        <Card className="border bg-white shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full pointer-events-none" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider">Highest Conversion Rate</span>
              <TrendingUp className="h-4 w-4 text-black" />
            </div>
            <div className="text-2xl font-bold text-foreground">
              {topConversionChannel && topConversionChannel.total > 0 ? topConversionChannel.name : "None yet"}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-black text-white font-bold text-[10px]">
                {topConversionChannel && topConversionChannel.total > 0 ? `${topConversionChannel.conversionRate}% Conversion` : "0%"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {topConversionChannel && topConversionChannel.total > 0 ? `${topConversionChannel.confirmed} confirmed` : "0 confirmed"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total Service Inquiries */}
        <Card className="border bg-white shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-black/5 rounded-bl-full pointer-events-none" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Service Inquiries</span>
              <Clock className="h-4 w-4 text-black" />
            </div>
            <div className="text-3xl font-bold text-foreground">{totalLeads}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Across all customer acquisition touchpoints
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Digital Attribution Rate */}
        <Card className="border bg-white shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-bl-full pointer-events-none" />
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider">Digital Channel Attribution</span>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="text-3xl font-bold text-foreground">{trackingCoverage}%</div>
            <div className="mt-2 space-y-1">
              <Progress value={trackingCoverage} className="h-1.5 bg-muted [&>div]:bg-primary" />
              <div className="flex justify-between text-[10px] text-muted-foreground font-medium pt-0.5">
                <span>{trackedDigitalLeads} identified</span>
                <span>{totalLeads - trackedDigitalLeads} direct/untracked</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Chart: Channel Inquiries & Outcomes */}
        <Card className="lg:col-span-2 border bg-white shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Inquiries & Confirmation by Channel</CardTitle>
                <CardDescription className="text-xs">
                  Compare total inquiries versus confirmed bookings for each communication stream.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {barChartData.length > 0 ? (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: "#64748B" }} 
                      interval={0}
                      angle={-15}
                      textAnchor="end"
                    />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: "10px", 
                        border: "1px solid #E2E8F0", 
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" 
                      }} 
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                    <Bar dataKey="Confirmed Bookings" fill={BRAND_GREEN} radius={[4, 4, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="Pending Inquiries" fill={BRAND_BLACK} radius={[4, 4, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 bg-muted/10 rounded-xl border border-dashed text-muted-foreground">
                <TrendingUp className="h-8 w-8 mb-2 opacity-40 text-primary" />
                <p className="text-sm font-bold text-foreground">No Live Inbound Channel Data Yet</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  When clients submit booking requests via the service portal, channel volumes and conversion outcomes will render dynamically here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Chart: Channel Share Donut */}
        <Card className="border bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Acquisition Channel Share</CardTitle>
            <CardDescription className="text-xs">
              Relative distribution of service request origin.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {pieChartData.length > 0 ? (
              <div className="h-[280px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any, name: any) => [`${val} requests`, name]}
                      contentStyle={{ borderRadius: "8px", border: "1px solid #E2E8F0" }} 
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center" 
                      wrapperStyle={{ fontSize: "11px", paddingTop: "5px" }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center metric */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[65%] text-center pointer-events-none">
                  <div className="text-2xl font-bold font-headline">{totalLeads}</div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Leads</div>
                </div>
              </div>
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center text-center p-6 bg-muted/10 rounded-xl border border-dashed text-muted-foreground">
                <Globe className="h-8 w-8 mb-2 opacity-40 text-primary" />
                <p className="text-sm font-bold text-foreground">No Acquisition Data</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Channel share distribution will appear here once service requests are placed.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Channel Breakdown Scorecard */}
      <Card className="border bg-white shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-lg font-bold">Channel Performance Scorecard</CardTitle>
              <CardDescription className="text-xs">
                Detailed breakdown of client conversion efficacy per channel.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest self-start sm:self-auto">
              <Link href="/admin/bookings">
                Inspect All Bookings <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {totalLeads === 0 ? (
            <div className="py-12 text-center p-4">
              <Globe className="h-10 w-10 mx-auto text-muted-foreground opacity-30 mb-2" />
              <p className="text-sm font-bold text-foreground">No Channel Inquiries Yet</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-md mx-auto">
                When clients book services through the booking form and select their referral channel, conversion rates and volume metrics for each channel will be tracked here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {channelStats.filter(c => c.total > 0).map((channel) => {
                const IconComponent = channel.icon;
                return (
                  <div key={channel.name} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Channel Brand Icon & Name */}
                    <div className="flex items-center gap-3.5 min-w-[220px]">
                      <div 
                        className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border bg-primary/10 border-primary/20 text-black"
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground flex items-center gap-2">
                          {channel.name}
                          {channel.conversionRate >= 60 && channel.total >= 1 && (
                            <Badge className="bg-primary text-white border-none text-[9px] px-1.5 py-0 h-4 font-bold">
                              High Yield
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {channel.total} request{channel.total === 1 ? "" : "s"} ({channel.share}% of total)
                        </div>
                      </div>
                    </div>

                    {/* Middle: Progress Bar representation of share */}
                    <div className="flex-grow max-w-md hidden sm:block">
                      <div className="flex justify-between text-[11px] mb-1 font-medium">
                        <span className="text-muted-foreground">Share of inquiries</span>
                        <span className="font-bold text-black">{channel.share}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${channel.share}%`, backgroundColor: BRAND_GREEN }}
                        />
                      </div>
                    </div>

                    {/* Right: Confirmation Rate & Counts */}
                    <div className="flex items-center gap-4 justify-between md:justify-end">
                      <div className="text-right">
                        <div className="text-xs font-bold text-foreground">
                          {channel.confirmed} confirmed / {channel.total} total
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {channel.conversionRate}% conversion rate
                        </div>
                      </div>

                      <Button 
                        asChild 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2.5 text-[10px] font-bold uppercase tracking-wider text-black hover:bg-primary hover:text-black"
                      >
                        <Link href={`/admin/bookings?channel=${encodeURIComponent(channel.name)}`}>
                          Filter <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strategic Marketing Insights & Recommendations */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20 shadow-sm">
        <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-foreground">
                Actionable Marketing Insight
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-2xl leading-relaxed">
                {topConversionChannel && topConversionChannel.total > 0
                  ? `Your highest converting communication channel is ${topConversionChannel.name} with a ${topConversionChannel.conversionRate}% confirmation rate. Prioritize customer engagement and ad allocation on this channel to optimize return on marketing spend.`
                  : "Live insights will unlock automatically as client bookings are submitted through the service portal."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
