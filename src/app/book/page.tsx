"use client";

import React, { Suspense } from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Loader2, 
  Send, 
  CheckCircle2, 
  Navigation, 
  Link as LinkIcon, 
  Calendar as CalendarIcon, 
  Clock,
  HelpCircle,
  ShieldCheck,
  Mail
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function BookingPageContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isLocating, setIsLocating] = React.useState(false);
  const [locationMethod, setLocationMethod] = React.useState<'manual' | 'auto' | null>(null);

  // Appointment date and time state
  const [appointmentDate, setAppointmentDate] = React.useState<Date | undefined>(undefined);
  const [preferredTime, setPreferredTime] = React.useState<string>("");
  const [isDatePickerOpen, setIsDatePickerOpen] = React.useState(false);

  // Referral source state
  const [referralSource, setReferralSource] = React.useState<string>("");
  const [customReferral, setCustomReferral] = React.useState<string>("");

  const [formData, setFormData] = React.useState({
    customerName: "",
    email: "",
    phone: "",
    serviceType: "",
    locationUrl: "",
    description: ""
  });

  React.useEffect(() => {
    const s = searchParams?.get('service');
    if (s) {
      const lower = s.toLowerCase();
      if (lower.includes('clean') || lower.includes('water')) {
        setFormData(prev => ({ ...prev, serviceType: 'Clean Water Delivery' }));
      } else if (lower.includes('waste') || lower.includes('collection')) {
        setFormData(prev => ({ ...prev, serviceType: 'Liquid Waste Collection' }));
      } else if (lower.includes('dwts') || lower.includes('install')) {
        setFormData(prev => ({ ...prev, serviceType: 'Installation of DWTS' }));
      } else if (lower.includes('maintenance') || lower.includes('consult')) {
        setFormData(prev => ({ ...prev, serviceType: 'Maintenance & Consultancy' }));
      }
    }
  }, [searchParams]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Geolocation is not supported by your browser."
      });
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setFormData({ ...formData, locationUrl: mapsUrl });
        setLocationMethod('auto');
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        setLocationMethod('manual');
        toast({
          variant: "destructive",
          title: "Location Failed",
          description: "Could not retrieve your location. Please enter it manually."
        });
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = formData.email.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailPattern.test(trimmedEmail)) {
      toast({
        title: "Valid Email Required",
        description: "Please provide a valid email address to receive your service status updates."
      });
      return;
    }

    if (!formData.locationUrl) {
      toast({
        variant: "destructive",
        title: "Location Required",
        description: "Please provide a location link."
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedDate = appointmentDate ? format(appointmentDate, "yyyy-MM-dd") : null;
      const displayDate = appointmentDate ? format(appointmentDate, "PPP") : null;

      const finalReferral = referralSource === "Others" && customReferral.trim()
        ? `Others (${customReferral.trim()})`
        : (referralSource || null);

      const appointmentNotes = displayDate
        ? `Preferred Appointment: ${displayDate}${preferredTime ? ` (${preferredTime})` : ""}`
        : null;

      const referralNotes = finalReferral
        ? `Heard About Us: ${finalReferral}`
        : null;

      const fullDescription = [
        appointmentNotes,
        referralNotes,
        formData.description ? formData.description : null
      ].filter(Boolean).join("\n\n");

      const payload = {
        ...formData,
        referralSource: finalReferral,
        description: fullDescription,
        appointmentDate: formattedDate,
        appointmentDateFormatted: displayDate,
        preferredTime: preferredTime || null,
      };

      // Call same-origin API route to avoid cross-origin CORS errors on custom domains like sanex.rw
      let response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        // Graceful fallback to direct Cloud Function if API route is not available
        try {
          const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'nganila-f3948';
          const cloudFunctionUrl = process.env.NEXT_PUBLIC_FIREBASE_CREATE_BOOKING_URL || `https://us-central1-${projectId}.cloudfunctions.net/createBooking`;
          const directRes = await fetch(cloudFunctionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });
          if (directRes.ok) {
            response = directRes;
          }
        } catch (_) {
          // Keep original response for error handling
        }
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit booking');
      }

      setIsSubmitted(true);
      toast({ title: "Booking Successful", description: "Your request has been received." });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col font-sans">
        <Navbar />
        <main className="flex-grow flex items-center justify-center bg-[#f6f6f8] px-4 py-12">
          <Card className="w-full max-w-md text-center py-8 px-6 border border-[#d9dadf] shadow-xl rounded-2xl bg-white">
            <div className="h-16 w-16 bg-[#006400]/10 border border-[#006400]/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#006400]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <CardTitle className="text-xl font-extrabold text-[#26272e] mb-1">Service Request Received</CardTitle>
            <CardDescription className="text-sm text-[#636679]">
              Thank you, <strong>{formData.customerName}</strong>. Our dispatch team will contact you shortly regarding your <strong>{formData.serviceType}</strong> booking.
            </CardDescription>

            <div className="mt-4 p-3.5 bg-[#006400]/10 rounded-xl border border-[#006400]/30 text-xs text-[#26272e] text-left flex items-start gap-2.5">
              <Mail className="h-4 w-4 text-[#006400] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Email Updates Enabled:</span> Automated status change alerts will be sent to <strong>{formData.email}</strong>.
              </div>
            </div>

            {appointmentDate && (
              <div className="mt-5 p-3.5 bg-[#f6f6f8] rounded-xl text-left border border-[#d9dadf] text-sm max-w-xs mx-auto">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#9698a7]">Requested Appointment</div>
                <div className="font-bold text-[#26272e] flex items-center gap-2 mt-1">
                  <CalendarIcon className="h-4 w-4 text-[#636679] shrink-0" />
                  <span>{format(appointmentDate, "EEEE, MMMM d, yyyy")}</span>
                </div>
                {preferredTime && (
                  <div className="text-xs text-[#636679] flex items-center gap-1.5 mt-1 pl-6">
                    <Clock className="h-3.5 w-3.5 text-[#636679] shrink-0" />
                    <span>{preferredTime}</span>
                  </div>
                )}
              </div>
            )}

            <Button className="mt-6 bg-[#006400] hover:bg-[#005000] text-white font-bold h-12 px-8 rounded-xl shadow-md border border-[#006400]" onClick={() => window.location.href = "/"}>
              Return to Home
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar />
      <main className="flex-grow py-8 bg-[#f6f6f8]">
        <div className="container mx-auto px-4 md:px-16">
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-extrabold text-[#26272e] tracking-tight">Book a Service</h1>
              <p className="text-[#636679] text-sm">
                Looking to book a service for a residential property, or do you need a commercial liquid waste management plan? Let us know so we can guide you on the next steps.
              </p>
            </div>

            <Card className="shadow-xl border border-[#d9dadf] rounded-2xl overflow-hidden bg-white">
              <CardHeader className="bg-[#636679] text-white p-6">
                <CardTitle className="text-base font-bold uppercase tracking-wider">Service Request Form</CardTitle>
                <CardDescription className="text-slate-200 text-xs font-medium">Professional Liquid Waste Evacuation · Nationwide Coverage</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label htmlFor="name" className="text-[10px] font-bold uppercase text-muted-foreground">Full Name *</Label>
                      <Input id="name" placeholder="Enter your full name" required className="h-10 text-sm" value={formData.customerName} onChange={(e) => setFormData({...formData, customerName: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-[10px] font-bold uppercase text-muted-foreground">Phone Number *</Label>
                      <Input id="phone" placeholder="+250 78..." required className="h-10 text-sm" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="email" className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-primary" /> Email Address *
                      </Label>
                      <span className="text-[10px] text-muted-foreground font-medium">Required for status updates</span>
                    </div>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="name@company.com" 
                      required 
                      className="h-10 text-sm" 
                      value={formData.email} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Our dispatch team will send email notifications whenever the status of this request is updated.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="service" className="text-[10px] font-bold uppercase text-muted-foreground">Selected Service *</Label>
                    <Select value={formData.serviceType} onValueChange={(val) => setFormData({...formData, serviceType: val})} required>
                      <SelectTrigger id="service" className="h-10 text-sm">
                        <SelectValue placeholder="Choose Service Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Liquid Waste Evacuation">Liquid Waste Evacuation (Septic Tank / Pit Latrine / Kuvidura)</SelectItem>
                        <SelectItem value="Wastewater Transportation">Wastewater Transportation (Vacuum Tankers)</SelectItem>
                        <SelectItem value="Decentralized Wastewater Treatment">Decentralized Wastewater Treatment (DWTS)</SelectItem>
                        <SelectItem value="Maintenance & Consultancy">Maintenance & Consultancy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Appointment Date & Preferred Time Slot */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="appointment-date" className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3 text-primary" /> Appointment Date
                        </Label>
                        {appointmentDate && (
                          <button
                            type="button"
                            onClick={() => setAppointmentDate(undefined)}
                            className="text-[10px] text-muted-foreground hover:text-destructive underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            id="appointment-date"
                            type="button"
                            variant="outline"
                            className={cn(
                              "w-full h-10 px-3 justify-start text-left font-normal text-sm border-input hover:bg-muted/40 transition-colors",
                              !appointmentDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 text-primary shrink-0" />
                            <span className="truncate">
                              {appointmentDate ? format(appointmentDate, "EEE, MMM d, yyyy") : "Select date (optional)"}
                            </span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border shadow-2xl rounded-xl overflow-hidden bg-background" align="start">
                          <Calendar
                            mode="single"
                            selected={appointmentDate}
                            onSelect={(date) => {
                              setAppointmentDate(date);
                              setIsDatePickerOpen(false);
                            }}
                            disabled={(date) => {
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              return date < today;
                            }}
                            autoFocus
                          />
                          <div className="p-2 border-t flex items-center justify-between bg-muted/30 text-xs">
                            <span className="text-[11px] text-muted-foreground">Select upcoming date</span>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2 text-primary font-bold hover:bg-primary/10"
                                onClick={() => {
                                  setAppointmentDate(new Date());
                                  setIsDatePickerOpen(false);
                                }}
                              >
                                Today
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs px-2 text-primary font-bold hover:bg-primary/10"
                                onClick={() => {
                                  const tomorrow = new Date();
                                  tomorrow.setDate(tomorrow.getDate() + 1);
                                  setAppointmentDate(tomorrow);
                                  setIsDatePickerOpen(false);
                                }}
                              >
                                Tomorrow
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="preferred-time" className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3 text-primary" /> Preferred Time Slot
                      </Label>
                      <Select value={preferredTime} onValueChange={setPreferredTime}>
                        <SelectTrigger id="preferred-time" className="h-10 text-sm">
                          <SelectValue placeholder="Flexible / Any Time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Morning (08:00 - 12:00)">Morning (08:00 - 12:00)</SelectItem>
                          <SelectItem value="Afternoon (12:00 - 16:00)">Afternoon (12:00 - 16:00)</SelectItem>
                          <SelectItem value="Late Afternoon (16:00 - 18:00)">Late Afternoon (16:00 - 18:00)</SelectItem>
                          <SelectItem value="Urgent / As Soon As Possible">Urgent / As Soon As Possible</SelectItem>
                          <SelectItem value="Flexible">Flexible / All Day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Operational Location *</Label>
                    <div className="flex flex-wrap gap-x-[5px] gap-y-[20px]">
                      <Button type="button" variant="outline" size="sm" className="h-9 text-[10px] font-bold uppercase tracking-widest gap-2" disabled={isLocating} onClick={handleGetLocation}>
                        {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />} Detect Current Location
                      </Button>
                      <Button type="button" variant="outline" size="sm" className="h-9 text-[10px] font-bold uppercase tracking-widest gap-2" onClick={() => setLocationMethod('manual')}>
                        <LinkIcon className="h-4 w-4" /> Enter Link Manually
                      </Button>
                    </div>
                    {(locationMethod === 'manual' || formData.locationUrl) && (
                      <Input 
                        placeholder="Paste Google Maps Sharing URL" 
                        required 
                        className="h-10 text-sm" 
                        value={formData.locationUrl} 
                        onChange={(e) => setFormData({...formData, locationUrl: e.target.value})} 
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="referral-source" className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                      <HelpCircle className="h-3 w-3 text-primary" /> How Did You Hear About Us?
                    </Label>
                    <Select value={referralSource} onValueChange={setReferralSource}>
                      <SelectTrigger id="referral-source" className="h-10 text-sm">
                        <SelectValue placeholder="Select an option (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                        <SelectItem value="Facebook">Facebook</SelectItem>
                        <SelectItem value="Google Search">Google Search</SelectItem>
                        <SelectItem value="Email">Email</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                    {referralSource === "Others" && (
                      <Input 
                        placeholder="Please specify (e.g. Word of mouth, Referral, Event...)" 
                        className="h-10 text-sm mt-2" 
                        value={customReferral} 
                        onChange={(e) => setCustomReferral(e.target.value)} 
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="desc" className="text-[10px] font-bold uppercase text-muted-foreground">Additional Details</Label>
                    <Textarea id="desc" placeholder="Please describe your specific requirements..." className="min-h-[100px] text-sm" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                  </div>

                  <Button type="submit" className="w-full h-12 text-xs font-bold uppercase tracking-wider gap-2 bg-[#006400] hover:bg-[#005000] text-white rounded-xl shadow-md shadow-[#006400]/20 transition-all hover:scale-[1.01] border border-[#006400]" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />} Submit Service Request
                  </Button>

                  {/* Privacy & Terms Data Usage Assurance */}
                  <div className="rounded-xl border border-[#d9dadf] bg-[#f6f6f8] p-3.5 text-xs text-[#636679] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#26272e]">
                      <ShieldCheck className="h-4 w-4 text-[#636679]" />
                      <span>Data Privacy & Terms Assurance</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-[#636679]">
                      The contact information you share is used solely to contact you as the service requester regarding appointment scheduling, status updates, and field logistics. We never sell or share your data. Read our{" "}
                      <Link href="/privacy" className="font-bold underline text-[#26272e] hover:text-[#636679] transition-colors">
                        Privacy Policy
                      </Link>{" "}
                      and{" "}
                      <Link href="/terms" className="font-bold underline text-[#26272e] hover:text-[#636679] transition-colors">
                        Terms of Service
                      </Link>.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  );
}
