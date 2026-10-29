
"use client";

import React, { Suspense } from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { useUser, useDoc, useFirestore, useCollection, useFunctions } from "@/firebase";
import { doc, collection, query, orderBy, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { MediaPicker } from "@/components/MediaPicker";
import { RichTextEditor } from "@/components/RichTextEditor";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { useViewsDisplay, getArticleViewsCount } from "@/hooks/use-view-tracker";
import { 
  ChevronLeft, 
  ImageIcon, 
  Plus, 
  Trash2, 
  Save, 
  Loader2, 
  ShieldAlert,
  Layout,
  Sparkles,
  List,
  Globe,
  RefreshCw,
  Settings,
  Layers,
  FileText,
  Navigation as NavigationIcon,
  Clock,
  Shield,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Edit3,
  X,
  Phone,
  Mail,
  ChevronUp,
  ChevronDown,
  MessageCircle,
  Youtube,
  ExternalLink,
  Eye,
  Palette,
  Droplets,
  RotateCcw,
  Check
} from "lucide-react";
import { DEFAULT_BRAND_SETTINGS, generateBrandCss } from "@/lib/brand-theme";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { slugify, getArticleSlug, getArticleUrl } from "@/lib/slug";

function ContentManagementContent() {
  const { user, loading: authLoading } = useUser();
  const db = useFirestore();
  const functions = useFunctions();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "general";
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const userDocRef = React.useMemo(() => (db && user ? doc(db, "users", user.uid) : null), [db, user]);
  const { data: userProfile, loading: profileLoading } = useDoc(userDocRef);

  const generalRef = React.useMemo(() => (db ? doc(db, "settings", "general") : null), [db]);
  const heroRef = React.useMemo(() => (db ? doc(db, "settings", "hero") : null), [db]);
  const sliderRef = React.useMemo(() => (db ? doc(db, "settings", "slider") : null), [db]);
  const servicesRef = React.useMemo(() => (db ? doc(db, "settings", "services") : null), [db]);
  const highlightsRef = React.useMemo(() => (db ? doc(db, "settings", "highlights") : null), [db]);
  const impactRef = React.useMemo(() => (db ? doc(db, "settings", "impact") : null), [db]);
  const regionalRef = React.useMemo(() => (db ? doc(db, "settings", "regional") : null), [db]);
  const milestonesRef = React.useMemo(() => (db ? doc(db, "settings", "milestones") : null), [db]);

  const { data: generalData } = useDoc(generalRef);
  const { data: heroData } = useDoc(heroRef);
  const { data: sliderData } = useDoc(sliderRef);
  const { data: servicesData } = useDoc(servicesRef);
  const { data: highlightsData } = useDoc(highlightsRef);
  const { data: impactData } = useDoc(impactRef);
  const { data: regionalData } = useDoc(regionalRef);
  const { data: milestonesData } = useDoc(milestonesRef);

  const galleryQuery = React.useMemo(() => {
    if (!db) return null;
    return query(collection(db, "gallery"), orderBy("createdAt", "desc"));
  }, [db]);
  const { data: photos, loading: photosLoading } = useCollection(galleryQuery);

  const articlesQuery = React.useMemo(() => {
    if (!db) return null;
    return query(collection(db, "articles"), orderBy("createdAt", "desc"));
  }, [db]);
  const { data: articles, loading: articlesLoading } = useCollection(articlesQuery);

  const handleUpdateSection = async (sectionId: string, content: any) => {
    setIsSubmitting(true);
    let apiSaved = false;
    let firestoreSaved = false;

    // 1. Save to Next.js server API endpoint (persists to server disk and backend Firestore)
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionId, content })
      });
      if (res.ok) {
        apiSaved = true;
      }
    } catch (apiErr) {
      console.warn(`Server API save error for ${sectionId}:`, apiErr);
    }

    // 2. Direct write to Firestore for instant and persistent saving in Cloud & client cache
    if (db) {
      try {
        await setDoc(doc(db, "settings", sectionId), {
          ...content,
          updatedAt: Date.now()
        });
        firestoreSaved = true;
      } catch (dbErr: any) {
        console.warn(`Direct Firestore write error for ${sectionId}:`, dbErr);
      }
    }

    // 3. Clear/sync localStorage & apply instant theme update if general branding
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(`nganila_setting_${sectionId}`, JSON.stringify(content));
        if (sectionId === "general") {
          let styleEl = document.getElementById("brand-theme-styles") as HTMLStyleElement | null;
          if (!styleEl) {
            styleEl = document.createElement("style");
            styleEl.id = "brand-theme-styles";
            document.head.appendChild(styleEl);
          }
          styleEl.innerHTML = generateBrandCss(content);
        }
      }
    } catch {
      // ignore
    }

    // 4. Invoke Cloud Function for backend audit/synchronization
    let funcSuccess = false;
    if (functions) {
      try {
        const updateFunc = httpsCallable(functions, 'adminUpdateSiteSection');
        await updateFunc({ sectionId, content });
        funcSuccess = true;
      } catch (err: any) {
        console.warn(`adminUpdateSiteSection function warning for ${sectionId}:`, err.message);
      }
    }

    setIsSubmitting(false);

    if (apiSaved || firestoreSaved || funcSuccess) {
      toast({ 
        title: "Changes Saved", 
        description: `${sectionId.toUpperCase()} configuration has been permanently saved.` 
      });
    } else {
      toast({ 
        variant: "destructive", 
        title: "Save Failed", 
        description: "Could not write to database. Please check permissions." 
      });
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isAuthorized = 
    userProfile?.role === "admin" || 
    (user as any)?.admin === true || 
    user?.email?.toLowerCase() === "tharushyamagara@gmail.com" ||
    user?.email?.toLowerCase() === "orverxi@gmail.com";

  if (!user || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar isAdmin />
        <main className="flex-grow flex items-center justify-center px-4">
          <Card className="w-full max-w-md text-center py-12 border-t-4 border-t-[#8DB833]">
            <ShieldAlert className="mx-auto h-12 w-12 text-[#8DB833] mb-4" />
            <CardTitle>Unauthorized Access</CardTitle>
            <p className="mt-2 text-muted-foreground">You do not have permission to view this page.</p>
            <Button asChild className="mt-6">
              <Link href="/admin">Return to Dashboard</Link>
            </Button>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar isAdmin />
      <div className="flex-grow flex flex-col lg:flex-row">
        <AdminSidebar />
        <main className="flex-grow p-4 md:p-8 space-y-6 overflow-x-hidden">
          <Button asChild variant="ghost" className="mb-2 -ml-2">
            <Link href="/admin"><ChevronLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
          </Button>
          
          <div className="flex justify-between items-center mb-5">
            <div>
              <h1 className="text-2xl font-bold font-headline flex items-center gap-3">
                <ImageIcon className="h-7 w-7 text-primary" /> Content Management
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">Update branding, pages, media, and dynamic site sections.</p>
            </div>
          </div>

          <Tabs defaultValue={defaultTab} className="space-y-5">
            <div className="overflow-x-auto pb-2">
              <TabsList className="bg-white border p-1 h-auto flex-nowrap justify-start gap-2 min-w-max">
                <TabsTrigger value="general" className="gap-2 text-[10px] font-bold uppercase"><Palette className="h-3.5 w-3.5 text-primary" /> Branding & Customization</TabsTrigger>
                <TabsTrigger value="navigation" className="gap-2 text-[10px] font-bold uppercase"><NavigationIcon className="h-3 w-3 text-primary" /> Menu</TabsTrigger>
                <TabsTrigger value="articles" className="gap-2 text-[10px] font-bold uppercase"><FileText className="h-3 w-3 text-primary" /> Articles</TabsTrigger>
                <TabsTrigger value="slider" className="gap-2 text-[10px] font-bold uppercase"><Layers className="h-3 w-3 text-primary" /> Slider</TabsTrigger>
                <TabsTrigger value="hero" className="gap-2 text-[10px] font-bold uppercase"><Sparkles className="h-3 w-3 text-primary" /> Hero</TabsTrigger>
                <TabsTrigger value="highlights" className="gap-2 text-[10px] font-bold uppercase"><Shield className="h-3 w-3 text-primary" /> Highlights</TabsTrigger>
                <TabsTrigger value="services" className="gap-2 text-[10px] font-bold uppercase"><List className="h-3 w-3 text-primary" /> Services</TabsTrigger>
                <TabsTrigger value="impact" className="gap-2 text-[10px] font-bold uppercase"><RefreshCw className="h-3 w-3 text-primary" /> Impact UI</TabsTrigger>
                <TabsTrigger value="milestones" className="gap-2 text-[10px] font-bold uppercase"><Clock className="h-3 w-3 text-primary" /> Who We Are</TabsTrigger>
                <TabsTrigger value="regional" className="gap-2 text-[10px] font-bold uppercase"><Globe className="h-3 w-3 text-primary" /> Presence</TabsTrigger>
                <TabsTrigger value="gallery" className="gap-2 text-[10px] font-bold uppercase"><ImageIcon className="h-3 w-3 text-primary" /> Gallery</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="general">
              <GeneralEditor initialData={generalData} onSave={(data) => handleUpdateSection('general', data)} />
            </TabsContent>

            <TabsContent value="navigation">
              <NavigationEditor initialData={generalData} onSave={(data) => handleUpdateSection('general', data)} />
            </TabsContent>

            <TabsContent value="articles">
              <ArticleManager articles={articles} loading={articlesLoading} />
            </TabsContent>

            <TabsContent value="slider">
              <SliderEditor initialData={sliderData} onSave={(data) => handleUpdateSection('slider', data)} />
            </TabsContent>

            <TabsContent value="hero">
              <HeroEditor initialData={heroData} onSave={(data) => handleUpdateSection('hero', data)} />
            </TabsContent>

            <TabsContent value="highlights">
              <HighlightsEditor initialData={highlightsData} onSave={(data) => handleUpdateSection('highlights', data)} />
            </TabsContent>

            <TabsContent value="services">
              <ServicesEditor initialData={servicesData} onSave={(data) => handleUpdateSection('services', data)} />
            </TabsContent>

            <TabsContent value="impact">
              <ImpactEditor initialData={impactData} onSave={(data) => handleUpdateSection('impact', data)} />
            </TabsContent>

            <TabsContent value="milestones">
              <MilestonesEditor initialData={milestonesData} onSave={(data) => handleUpdateSection('milestones', data)} />
            </TabsContent>

            <TabsContent value="regional">
              <RegionalEditor initialData={regionalData} onSave={(data) => handleUpdateSection('regional', data)} />
            </TabsContent>

            <TabsContent value="gallery">
              <GalleryManager photos={photos} loading={photosLoading} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
      <Footer />
    </div>
  );
}

export default function ContentManagementPage() {
  return (
    <Suspense fallback={<div className="h-screen w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ContentManagementContent />
    </Suspense>
  );
}

const DEFAULT_SITE_NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Services", href: "/services" },
  { name: "Articles", href: "/articles" },
  { name: "Publications", href: "/publications" },
  { name: "Gallery", href: "/gallery" },
  { name: "Contact", href: "/contact" },
];

function NavigationEditor({ initialData, onSave }: { initialData: any, onSave: (data: any) => void }) {
  const [navLinks, setNavLinks] = React.useState<any[]>(() => {
    if (Array.isArray(initialData?.navLinks) && initialData.navLinks.length > 0) {
      return initialData.navLinks;
    }
    return DEFAULT_SITE_NAV_LINKS;
  });

  React.useEffect(() => {
    if (Array.isArray(initialData?.navLinks) && initialData.navLinks.length > 0) {
      setNavLinks(initialData.navLinks);
    }
  }, [initialData]);

  const addLink = () => {
    setNavLinks([...navLinks, { name: "New Page", href: "/" }]);
  };

  const removeLink = (index: number) => {
    setNavLinks(navLinks.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: string, value: string) => {
    const newLinks = [...navLinks];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setNavLinks(newLinks);
  };

  const resetToDefault = () => {
    setNavLinks(DEFAULT_SITE_NAV_LINKS);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Navigation Menu</CardTitle>
          <CardDescription className="text-xs">Manage links in the top header and footer.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={resetToDefault} className="gap-1.5 h-9 text-[10px] font-bold uppercase tracking-widest">
            <RefreshCw className="h-3.5 w-3.5" /> Reset Defaults
          </Button>
          <Button size="sm" onClick={addLink} className="gap-2 h-9 text-[10px] font-bold uppercase tracking-widest"><Plus className="h-4 w-4" /> Add Link</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {navLinks.map((link, i) => (
            <div key={i} className="flex gap-2 p-3 border rounded-lg bg-muted/20 relative group">
              <div className="flex-grow space-y-2">
                <div className="space-y-1">
                  <Label className="text-[8px] font-bold uppercase text-muted-foreground">Label Name</Label>
                  <Input 
                    className="h-8 text-xs" 
                    value={link.name} 
                    onChange={e => updateLink(i, 'name', e.target.value)} 
                    placeholder="e.g. Services"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[8px] font-bold uppercase text-muted-foreground">URL Path</Label>
                  <Input 
                    className="h-8 text-xs font-mono" 
                    value={link.href} 
                    onChange={e => updateLink(i, 'href', e.target.value)} 
                    placeholder="e.g. /services"
                  />
                </div>
              </div>
              <Button 
                size="icon" 
                variant="destructive" 
                className="h-7 w-7 mt-5" 
                onClick={() => removeLink(i)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        <Button 
          onClick={() => onSave({ ...initialData, navLinks })} 
          className="gap-2 h-10 text-[10px] font-bold uppercase tracking-widest w-full bg-primary text-white hover:bg-primary/90"
        >
          <Save className="h-4 w-4" /> Save Navigation Menu
        </Button>
      </CardContent>
    </Card>
  );
}

function ArticleManager({ articles, loading }: { articles: any, loading: boolean }) {
  const functions = useFunctions();
  const { toast } = useToast();
  const { showViewsOnFrontend, toggleViewsDisplay, articleViews } = useViewsDisplay();
  const [isTogglingViews, setIsTogglingViews] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    title: "", slug: "", excerpt: "", content: "", imageUrl: "", imageAlt: "", imageWidth: 1200, imageHeight: 600, category: "Impact", author: "Nganira Team"
  });

  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 5;
  const articleList = articles || [];
  const paginatedArticles = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return articleList.slice(start, start + PAGE_SIZE);
  }, [articleList, page]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!functions) return;
    try {
      const finalSlug = formData.slug ? slugify(formData.slug) : slugify(formData.title);
      const payload = { ...formData, slug: finalSlug };

      if (isEditing) {
        const updateFunc = httpsCallable(functions, 'adminUpdateArticle');
        await updateFunc({ id: isEditing, ...payload });
        toast({ title: "Updated", description: "Article saved successfully." });
      } else {
        const addFunc = httpsCallable(functions, 'adminAddArticle');
        await addFunc(payload);
        toast({ title: "Created", description: "Article published." });
      }
      setIsEditing(null);
      setFormData({ title: "", slug: "", excerpt: "", content: "", imageUrl: "", imageAlt: "", imageWidth: 1200, imageHeight: 600, category: "Impact", author: "Nganira Team" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleEdit = (article: any) => {
    setIsEditing(article.id);
    setFormData({
      title: article.title || "",
      slug: article.slug || slugify(article.title || ""),
      excerpt: article.excerpt || "",
      content: article.content || "",
      imageUrl: article.imageUrl || "",
      imageAlt: article.imageAlt || "",
      imageWidth: article.imageWidth || 1200,
      imageHeight: article.imageHeight || 600,
      category: article.category || "Impact",
      author: article.author || "Nganira Team"
    });
  };

  const handleDelete = async (id: string) => {
    if (!functions || !confirm("Delete this article?")) return;
    try {
      const delFunc = httpsCallable(functions, 'adminDeleteArticle');
      await delFunc({ id });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Card className="lg:col-span-1 h-fit">
        <CardHeader>
          <CardTitle className="text-xl">{isEditing ? "Edit Article" : "New Article"}</CardTitle>
          <CardDescription className="text-xs">Create styled impact stories and case studies.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Title</Label>
              <Input 
                className="h-9 text-xs" 
                value={formData.title} 
                onChange={e => {
                  const newTitle = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    title: newTitle,
                    slug: (!prev.slug || prev.slug === slugify(prev.title)) ? slugify(newTitle) : prev.slug
                  }));
                }} 
                required 
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">SEO URL Slug</Label>
                <span className="text-[9px] text-muted-foreground">Keywords in link</span>
              </div>
              <Input 
                className="h-9 text-xs font-mono" 
                value={formData.slug} 
                placeholder={slugify(formData.title) || "article-title-slug"}
                onChange={e => setFormData({ ...formData, slug: slugify(e.target.value) })} 
              />
              <p className="text-[10px] text-muted-foreground truncate">
                Preview: <span className="text-primary font-semibold font-mono">/articles/{formData.slug || slugify(formData.title) || "..."}</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Category</Label>
                <Input className="h-9 text-xs" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Author</Label>
                <Input className="h-9 text-xs" value={formData.author} onChange={e => setFormData({...formData, author: e.target.value})} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Excerpt</Label>
              <Textarea className="min-h-[60px] text-xs" value={formData.excerpt} onChange={e => setFormData({...formData, excerpt: e.target.value})} />
            </div>
            <RichTextEditor 
              label="Content" 
              value={formData.content} 
              onChange={content => setFormData({...formData, content})} 
            />
            <MediaPicker label="Featured Image" value={formData.imageUrl} onChange={url => setFormData({...formData, imageUrl: url})} />
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Image Alt Text (SEO)</Label>
                <span className="text-[9px] text-muted-foreground">For Google Images ranking</span>
              </div>
              <Input 
                className="h-9 text-xs" 
                placeholder="e.g. Nganira 10000L vacuum exhauster truck in Kigali"
                value={formData.imageAlt} 
                onChange={e => setFormData({...formData, imageAlt: e.target.value})} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Width (px)</Label>
                <Input type="number" className="h-9 text-xs" value={formData.imageWidth} onChange={e => setFormData({...formData, imageWidth: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Height (px)</Label>
                <Input type="number" className="h-9 text-xs" value={formData.imageHeight} onChange={e => setFormData({...formData, imageHeight: Number(e.target.value)})} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-grow h-10 text-xs font-bold uppercase tracking-widest">{isEditing ? "Save Changes" : "Publish Article"}</Button>
              {isEditing && <Button type="button" variant="outline" className="h-10 text-xs font-bold uppercase tracking-widest" onClick={() => setIsEditing(null)}>Cancel</Button>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3 pb-3">
          <div>
            <CardTitle className="text-xl">Existing Articles</CardTitle>
            <CardDescription className="text-xs">
              Total Views: {articleList.reduce((sum: number, a: any) => sum + getArticleViewsCount(a, articleViews), 0)} tracked across articles
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 bg-muted/50 p-2 px-3 rounded-lg border">
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1 justify-end">
                <Eye className="h-3 w-3 text-emerald-600" />
                <span>Public Views Badge</span>
              </span>
              <span className="text-[11px] font-bold text-slate-700">
                {showViewsOnFrontend ? "Visible on Front End" : "Hidden (Admin Only)"}
              </span>
            </div>
            <Switch
              checked={showViewsOnFrontend}
              disabled={isTogglingViews}
              onCheckedChange={async (val) => {
                setIsTogglingViews(true);
                await toggleViewsDisplay(val);
                setIsTogglingViews(false);
                toast({
                  title: val ? "Public Views Enabled" : "Public Views Hidden",
                  description: val
                    ? "Article & publication view counts are now visible to visitors on the website."
                    : "Article & publication view counts are now hidden from public visitors. You can always track them as admin.",
                });
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {loading ? <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /> : paginatedArticles.map((a: any) => (
              <div key={a.id} className="flex gap-4 p-4 border rounded-lg hover:bg-muted/10 transition-colors">
                <div className="relative h-16 w-16 flex-shrink-0 bg-muted rounded overflow-hidden">
                  {a.imageUrl && <Image src={a.imageUrl} alt="" fill className="object-cover" />}
                </div>
                <div className="flex-grow">
                  <h4 className="font-bold text-sm">{a.title}</h4>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{a.excerpt}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0">{a.category}</Badge>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{getArticleViewsCount(a, articleViews)} views</span>
                    </span>
                    <span className="text-[8px] text-muted-foreground">{a.imageWidth}x{a.imageHeight}</span>
                    <Link 
                      href={getArticleUrl(a)} 
                      target="_blank" 
                      className="text-[10px] text-primary hover:underline font-mono inline-flex items-center gap-1 ml-auto"
                    >
                      {getArticleUrl(a)} <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => handleEdit(a)}><Edit3 className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>

          <AdminPagination
            currentPage={page}
            totalItems={articleList.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="articles"
            className="mt-4"
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SliderEditor({ initialData, onSave }: { initialData: any, onSave: (data: any) => void }) {
  const makeId = () => `slide_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  const [items, setItems] = React.useState<any[]>(() => {
    if (Array.isArray(initialData?.items)) {
      return initialData.items.map((it: any) => ({ ...it, _id: it._id || it.id || makeId() }));
    }
    return [];
  });

  const isUserEditingRef = React.useRef(false);

  // Load from server API on mount if initialData is not yet populated
  React.useEffect(() => {
    let active = true;
    fetch("/api/settings?section=slider")
      .then(res => res.json())
      .then(d => {
        if (active && d?.success && Array.isArray(d?.data?.items) && !isUserEditingRef.current) {
          setItems(d.data.items.map((it: any) => ({ ...it, _id: it._id || it.id || makeId() })));
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Sync from initialData only when fresh data arrives and user hasn't made uncommitted edits
  React.useEffect(() => {
    if (Array.isArray(initialData?.items) && !isUserEditingRef.current) {
      setItems(initialData.items.map((it: any) => ({ ...it, _id: it._id || it.id || makeId() })));
    }
  }, [initialData]);

  const updateItem = (index: number, field: string, value: any) => {
    isUserEditingRef.current = true;
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    isUserEditingRef.current = true;
    setItems([
      ...items, 
      { 
        _id: makeId(),
        title: "", 
        description: "", 
        imageUrl: "", 
        width: 1200, 
        height: 600, 
        link: "/services", 
        buttonText: "Learn More" 
      }
    ]);
  };

  const removeItem = (index: number) => {
    isUserEditingRef.current = true;
    setItems(items.filter((_, i) => i !== index));
  };

  const clearAllSlides = () => {
    if (confirm("Are you sure you want to remove all slides? This will leave the slider clean.")) {
      isUserEditingRef.current = true;
      setItems([]);
      onSave({ items: [] });
    }
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    isUserEditingRef.current = true;
    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setItems(updated);
  };

  const handleSave = () => {
    isUserEditingRef.current = false;
    // Strip temporary UI identifiers before saving
    const cleanItems = items.map(({ _id, ...rest }) => rest);
    onSave({ items: cleanItems });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
        <div>
          <CardTitle className="text-xl">Homepage Slider Carousel</CardTitle>
          <CardDescription className="text-xs">
            Manage slides for the full-width homepage carousel. Only slides you configure here will be displayed.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <Button size="sm" variant="outline" onClick={clearAllSlides} className="gap-1.5 h-9 text-[10px] font-bold uppercase tracking-widest text-destructive hover:bg-destructive/10">
              <Trash2 className="h-3.5 w-3.5" /> Clear All
            </Button>
          )}
          <Button size="sm" onClick={addItem} className="gap-1.5 h-9 text-[10px] font-bold uppercase tracking-widest bg-primary text-white hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Add Slide
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-5">
        {items.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/10 space-y-3">
            <Layers className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-muted-foreground">No slides configured yet.</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Click &quot;Add Slide&quot; above to create your first custom slide with your preferred title, description, and photo/video.
            </p>
            <Button size="sm" onClick={addItem} className="gap-2 h-9 text-xs font-bold bg-primary text-white hover:bg-primary/90">
              <Plus className="h-4 w-4" /> Add Your First Slide
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {items.map((item, i) => (
              <Card key={item._id || i} className="p-6 space-y-5 bg-card relative border-2 border-primary/20 rounded-2xl shadow-sm">
                {/* Header row with slide index and controls */}
                <div className="flex items-center justify-between pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <span className="h-6 w-6 rounded-full bg-primary text-white font-extrabold text-xs flex items-center justify-center">
                      {i + 1}
                    </span>
                    <h4 className="font-extrabold text-sm text-foreground">
                      {item.title ? item.title : `Slide #${i + 1}`}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 disabled:opacity-20" 
                      disabled={i === 0} 
                      onClick={() => moveSlide(i, 'up')}
                      title="Move slide up"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 disabled:opacity-20" 
                      disabled={i === items.length - 1} 
                      onClick={() => moveSlide(i, 'down')}
                      title="Move slide down"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="destructive" 
                      className="h-8 w-8 ml-2" 
                      onClick={() => removeItem(i)}
                      title="Delete this slide"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column: Text fields */}
                  <div className="space-y-4 lg:col-span-7">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Slide Title
                      </Label>
                      <Input 
                        className="h-10 text-sm font-semibold" 
                        value={item.title || ""} 
                        onChange={e => updateItem(i, 'title', e.target.value)} 
                        placeholder="e.g. Liquid Waste Evacuation & Transport" 
                      />
                    </div>

                    <RichTextEditor 
                      label="Slide Description" 
                      value={item.description || ""} 
                      onChange={val => updateItem(i, 'description', val)} 
                      placeholder="Write brief description for this slide..."
                    />

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Call-to-Action Link
                        </Label>
                        <Input 
                          className="h-9 text-xs font-mono" 
                          value={item.link || ""} 
                          onChange={e => updateItem(i, 'link', e.target.value)} 
                          placeholder="/book or /services" 
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          Button Text
                        </Label>
                        <Input 
                          className="h-9 text-xs" 
                          value={item.buttonText || ""} 
                          onChange={e => updateItem(i, 'buttonText', e.target.value)} 
                          placeholder="e.g. Learn More" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Media */}
                  <div className="lg:col-span-5 space-y-3">
                    <MediaPicker 
                      label="Slide Photo or Video" 
                      value={item.imageUrl || ""} 
                      onChange={(url) => updateItem(i, 'imageUrl', url)} 
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Button 
          onClick={handleSave} 
          className="gap-2 h-11 text-xs font-bold uppercase tracking-widest w-full bg-primary text-white shadow-md hover:bg-primary/90"
        >
          <Save className="h-4 w-4" /> Save All Slides Config
        </Button>
      </CardContent>
    </Card>
  );
}

function parseArrayField(arr: any, fallbackStr: any, defaultValue: string = ""): string[] {
  if (Array.isArray(arr)) {
    const filtered = arr.filter((x: any) => typeof x === "string");
    return filtered;
  }
  if (typeof fallbackStr === "string" && fallbackStr.trim()) {
    return [fallbackStr.trim()];
  }
  return defaultValue ? [defaultValue] : [];
}

function GeneralEditor({ initialData, onSave }: { initialData: any, onSave: (data: any) => void }) {
  const [formData, setFormData] = React.useState({ 
    siteName: initialData?.siteName || initialData?.companyName || DEFAULT_BRAND_SETTINGS.siteName, 
    companyName: initialData?.companyName || initialData?.siteName || DEFAULT_BRAND_SETTINGS.companyName,
    tagline: initialData?.tagline || DEFAULT_BRAND_SETTINGS.tagline,
    description: initialData?.description || DEFAULT_BRAND_SETTINGS.description,
    primaryColor: initialData?.primaryColor || DEFAULT_BRAND_SETTINGS.primaryColor,
    secondaryColor: initialData?.secondaryColor || DEFAULT_BRAND_SETTINGS.secondaryColor,
    darkColor: initialData?.darkColor || DEFAULT_BRAND_SETTINGS.darkColor,
    logoUrl: initialData?.logoUrl || "", 
    logoWidth: initialData?.logoWidth || 160, 
    logoHeight: initialData?.logoHeight || 44, 
    logoSpacing: initialData?.logoSpacing ?? 8, 
    phones: parseArrayField(initialData?.phones, initialData?.phone, "+250 788 450 120"), 
    emails: parseArrayField(initialData?.emails, initialData?.email, "info@nganira.rw"),
    socials: initialData?.socials || { ...DEFAULT_BRAND_SETTINGS.socials }
  });

  React.useEffect(() => { 
    if (initialData) {
      setFormData({
        siteName: initialData.siteName || initialData.companyName || DEFAULT_BRAND_SETTINGS.siteName,
        companyName: initialData.companyName || initialData.siteName || DEFAULT_BRAND_SETTINGS.companyName,
        tagline: initialData.tagline || DEFAULT_BRAND_SETTINGS.tagline,
        description: initialData.description || DEFAULT_BRAND_SETTINGS.description,
        primaryColor: initialData.primaryColor || DEFAULT_BRAND_SETTINGS.primaryColor,
        secondaryColor: initialData.secondaryColor || DEFAULT_BRAND_SETTINGS.secondaryColor,
        darkColor: initialData.darkColor || DEFAULT_BRAND_SETTINGS.darkColor,
        logoUrl: initialData.logoUrl || "",
        logoWidth: initialData.logoWidth || 160,
        logoHeight: initialData.logoHeight || 44,
        logoSpacing: initialData.logoSpacing ?? 8,
        phones: parseArrayField(initialData.phones, initialData.phone, "+250 788 450 120"),
        emails: parseArrayField(initialData.emails, initialData.email, "info@nganira.rw"),
        socials: initialData.socials || { ...DEFAULT_BRAND_SETTINGS.socials }
      });
    }
  }, [initialData]);

  const updateSocial = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socials: { ...prev.socials, [key]: value }
    }));
  };

  const addPhone = () => {
    setFormData(prev => ({
      ...prev,
      phones: [...prev.phones, ""]
    }));
  };

  const removePhone = (index: number) => {
    setFormData(prev => {
      const updated = prev.phones.filter((_, i) => i !== index);
      return {
        ...prev,
        phones: updated.length > 0 ? updated : [""]
      };
    });
  };

  const updatePhone = (index: number, value: string) => {
    setFormData(prev => {
      const updated = [...prev.phones];
      updated[index] = value;
      return { ...prev, phones: updated };
    });
  };

  const movePhone = (index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.phones.length) return prev;
      const updated = [...prev.phones];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return { ...prev, phones: updated };
    });
  };

  const addEmail = () => {
    setFormData(prev => ({
      ...prev,
      emails: [...prev.emails, ""]
    }));
  };

  const removeEmail = (index: number) => {
    setFormData(prev => {
      const updated = prev.emails.filter((_, i) => i !== index);
      return {
        ...prev,
        emails: updated.length > 0 ? updated : [""]
      };
    });
  };

  const updateEmail = (index: number, value: string) => {
    setFormData(prev => {
      const updated = [...prev.emails];
      updated[index] = value;
      return { ...prev, emails: updated };
    });
  };

  const moveEmail = (index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.emails.length) return prev;
      const updated = [...prev.emails];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return { ...prev, emails: updated };
    });
  };

  const resetToBrandDefaults = () => {
    if (confirm("Reset branding colors, logo, and tagline to default Nganira Company LTD values?")) {
      setFormData(prev => ({
        ...prev,
        primaryColor: DEFAULT_BRAND_SETTINGS.primaryColor,
        secondaryColor: DEFAULT_BRAND_SETTINGS.secondaryColor,
        darkColor: DEFAULT_BRAND_SETTINGS.darkColor,
        companyName: DEFAULT_BRAND_SETTINGS.companyName,
        siteName: DEFAULT_BRAND_SETTINGS.siteName,
        tagline: DEFAULT_BRAND_SETTINGS.tagline,
      }));
    }
  };

  const primaryPresets = [
    { name: "Forest Green", hex: "#006400" },
    { name: "Emerald", hex: "#059669" },
    { name: "Teal Green", hex: "#0d9488" },
    { name: "Royal Blue", hex: "#1d4ed8" },
    { name: "Ocean Navy", hex: "#0369a1" },
    { name: "Deep Burgundy", hex: "#831843" },
  ];

  const secondaryPresets = [
    { name: "Slate Mauve", hex: "#636679" },
    { name: "Cool Slate", hex: "#475569" },
    { name: "Charcoal", hex: "#334155" },
    { name: "Deep Navy", hex: "#1e293b" },
    { name: "Pitch Dark", hex: "#18181b" },
  ];

  const darkPresets = [
    { name: "Dark Surface", hex: "#26272e" },
    { name: "Night Slate", hex: "#0f172a" },
    { name: "Pure Black", hex: "#000000" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhones = formData.phones.map(p => p.trim()).filter(Boolean);
    const cleanEmails = formData.emails.map(em => em.trim()).filter(Boolean);

    const payload = {
      ...(initialData || {}),
      ...formData,
      siteName: formData.companyName || formData.siteName || "NGANIRA COMPANY LTD",
      companyName: formData.companyName || formData.siteName || "NGANIRA COMPANY LTD",
      tagline: formData.tagline || "Waste Water Management",
      phones: cleanPhones.length > 0 ? cleanPhones : [formData.phones[0] || ""],
      phone: cleanPhones[0] || formData.phones[0] || "",
      emails: cleanEmails.length > 0 ? cleanEmails : [formData.emails[0] || ""],
      email: cleanEmails[0] || formData.emails[0] || ""
    };

    onSave(payload);
  };

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-primary text-white border-0 font-bold uppercase text-[9px] tracking-wider">
              Live Customizer
            </Badge>
          </div>
          <CardTitle className="text-xl font-bold font-headline flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" /> Site Branding & Color Scheme
          </CardTitle>
          <CardDescription className="text-xs">
            Instantly customize the primary brand color (Green), secondary color (Dark Mauve/Slate), logo, and tagline.
          </CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetToBrandDefaults}
          className="gap-1.5 text-xs font-semibold shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset to Defaults
        </Button>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: Color Customization */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: formData.primaryColor }} />
                  1. Brand Colors Customization
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Change the main color and secondary dark color. Changes apply across all buttons, badges, navigation, and accents.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Primary Color Card */}
              <div className="p-4 rounded-xl border bg-muted/10 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    Main Color (Green)
                  </Label>
                  <span 
                    className="h-5 w-5 rounded-full border shadow-xs shrink-0" 
                    style={{ backgroundColor: formData.primaryColor }} 
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Controls buttons, active menus, badges, icons, and highlights.
                </p>
                
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="h-9 w-12 rounded-lg cursor-pointer border border-input p-0.5 bg-background shrink-0"
                    title="Choose primary color"
                  />
                  <Input
                    className="h-9 text-xs font-mono uppercase"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    placeholder="#006400"
                  />
                </div>

                <div className="pt-1">
                  <Label className="text-[9px] font-bold uppercase text-muted-foreground block mb-1.5">Quick Swatches</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {primaryPresets.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setFormData({ ...formData, primaryColor: preset.hex })}
                        className={`h-6 px-2 rounded-md text-[10px] font-bold text-white flex items-center gap-1 transition-all ${
                          formData.primaryColor.toLowerCase() === preset.hex.toLowerCase()
                            ? "ring-2 ring-primary ring-offset-1 scale-105"
                            : "opacity-85 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: preset.hex }}
                        title={preset.name}
                      >
                        {formData.primaryColor.toLowerCase() === preset.hex.toLowerCase() && (
                          <Check className="h-2.5 w-2.5" />
                        )}
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Secondary Color Card */}
              <div className="p-4 rounded-xl border bg-muted/10 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    Secondary Color (Dark)
                  </Label>
                  <span 
                    className="h-5 w-5 rounded-full border shadow-xs shrink-0" 
                    style={{ backgroundColor: formData.secondaryColor }} 
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Controls brand text headers, subtitle labels, and subtle dark tones.
                </p>
                
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="h-9 w-12 rounded-lg cursor-pointer border border-input p-0.5 bg-background shrink-0"
                    title="Choose secondary color"
                  />
                  <Input
                    className="h-9 text-xs font-mono uppercase"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    placeholder="#636679"
                  />
                </div>

                <div className="pt-1">
                  <Label className="text-[9px] font-bold uppercase text-muted-foreground block mb-1.5">Quick Swatches</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {secondaryPresets.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setFormData({ ...formData, secondaryColor: preset.hex })}
                        className={`h-6 px-2 rounded-md text-[10px] font-bold text-white flex items-center gap-1 transition-all ${
                          formData.secondaryColor.toLowerCase() === preset.hex.toLowerCase()
                            ? "ring-2 ring-primary ring-offset-1 scale-105"
                            : "opacity-85 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: preset.hex }}
                        title={preset.name}
                      >
                        {formData.secondaryColor.toLowerCase() === preset.hex.toLowerCase() && (
                          <Check className="h-2.5 w-2.5" />
                        )}
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dark Surface Tone */}
              <div className="p-4 rounded-xl border bg-muted/10 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                    Footer & Surface Color
                  </Label>
                  <span 
                    className="h-5 w-5 rounded-full border shadow-xs shrink-0" 
                    style={{ backgroundColor: formData.darkColor }} 
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Controls the website footer, dark modal dialogs, and deep card backgrounds.
                </p>
                
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.darkColor}
                    onChange={(e) => setFormData({ ...formData, darkColor: e.target.value })}
                    className="h-9 w-12 rounded-lg cursor-pointer border border-input p-0.5 bg-background shrink-0"
                    title="Choose dark tone color"
                  />
                  <Input
                    className="h-9 text-xs font-mono uppercase"
                    value={formData.darkColor}
                    onChange={(e) => setFormData({ ...formData, darkColor: e.target.value })}
                    placeholder="#26272e"
                  />
                </div>

                <div className="pt-1">
                  <Label className="text-[9px] font-bold uppercase text-muted-foreground block mb-1.5">Quick Swatches</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {darkPresets.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setFormData({ ...formData, darkColor: preset.hex })}
                        className={`h-6 px-2 rounded-md text-[10px] font-bold text-white flex items-center gap-1 transition-all ${
                          formData.darkColor.toLowerCase() === preset.hex.toLowerCase()
                            ? "ring-2 ring-primary ring-offset-1 scale-105"
                            : "opacity-85 hover:opacity-100"
                        }`}
                        style={{ backgroundColor: preset.hex }}
                        title={preset.name}
                      >
                        {formData.darkColor.toLowerCase() === preset.hex.toLowerCase() && (
                          <Check className="h-2.5 w-2.5" />
                        )}
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Logo, Company Name & Tagline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  2. Brand Identity, Logo & Tagline
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Set the organization name, tagline, and custom logo image with fallback to the water droplet emblem.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Company / Website Name
                </Label>
                <Input
                  className="h-9 text-xs font-semibold"
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value, siteName: e.target.value })
                  }
                  placeholder="e.g. NGANIRA COMPANY LTD"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Website Tagline
                </Label>
                <Input
                  className="h-9 text-xs font-semibold"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. Waste Water Management"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                    Website Logo (Image or Fallback Emblem)
                  </Label>
                  {formData.logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setFormData({ ...formData, logoUrl: "" })}
                      className="h-6 text-[10px] text-destructive hover:text-destructive gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Remove Custom Logo (Use Emblem)
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border bg-muted/10 items-center">
                  <div className="md:col-span-2">
                    <MediaPicker
                      label="Upload or Select Website Logo"
                      value={formData.logoUrl}
                      onChange={(url) => setFormData({ ...formData, logoUrl: url })}
                    />
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      Recommended: Transparent PNG, SVG, or WebP. When no image is provided, the website uses the modern water droplet emblem.
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-3 border rounded-lg bg-background">
                    <span className="text-[9px] font-bold uppercase text-muted-foreground mb-2">Live Logo Preview</span>
                    {formData.logoUrl ? (
                      <div className="h-12 w-auto max-w-full flex items-center justify-center p-1 border rounded bg-white shadow-xs">
                        <img
                          src={formData.logoUrl}
                          alt="Logo Preview"
                          className="h-10 w-auto max-w-[150px] object-contain"
                        />
                      </div>
                    ) : (
                      <div
                        className="h-12 w-12 rounded-xl text-white flex items-center justify-center shadow-md shadow-primary/20"
                        style={{ backgroundColor: formData.primaryColor }}
                      >
                        <Droplets className="h-6 w-6 text-white" />
                      </div>
                    )}
                    <span className="text-[9px] text-muted-foreground mt-1.5">
                      {formData.logoUrl ? "Custom Image Logo" : "Default Droplets Emblem"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 md:col-span-2">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">
                  Organization Summary / Description (SEO & Footer)
                </Label>
                <Textarea
                  rows={2}
                  className="text-xs resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Professional waste water management company operating in Kicukiro, Kigali, Rwanda."
                />
              </div>
            </div>
          </div>

          {/* Section 3: Live Interactive Website Preview Mockup */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  3. Real-Time Website Simulation
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Live preview of how your brand colors, logo, and typography render on the website.
                </p>
              </div>
            </div>

            <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
              {/* Simulated Header */}
              <div className="p-4 bg-white border-b flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {formData.logoUrl ? (
                    <div className="h-11 w-auto max-w-[150px] flex items-center justify-center overflow-hidden rounded-lg">
                      <img src={formData.logoUrl} alt="Logo" className="h-11 w-auto object-contain" />
                    </div>
                  ) : (
                    <div
                      className="h-11 w-11 rounded-xl text-white flex items-center justify-center shadow-md"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      <Droplets className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span
                      className="font-extrabold text-[16px] tracking-tight"
                      style={{ color: formData.secondaryColor }}
                    >
                      {formData.companyName || "NGANIRA COMPANY LTD"}
                    </span>
                    <span
                      className="text-[10px] uppercase tracking-wider font-medium -mt-0.5"
                      style={{ color: formData.secondaryColor, opacity: 0.75 }}
                    >
                      {formData.tagline || "Waste Water Management"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Simulated Active Nav Menu */}
                  <span
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    Home (Active)
                  </span>
                  <span
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ color: formData.secondaryColor }}
                  >
                    Services
                  </span>
                  <span
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ color: formData.secondaryColor }}
                  >
                    Publications
                  </span>

                  {/* Simulated CTA Button */}
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white uppercase tracking-wider shadow-sm transition-all"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    Book a Service
                  </button>
                </div>
              </div>

              {/* Simulated Content Body with Badges & Buttons */}
              <div className="p-5 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider shadow-xs"
                      style={{ backgroundColor: formData.primaryColor }}
                    >
                      Active Menu
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                      style={{
                        backgroundColor: `${formData.primaryColor}15`,
                        color: formData.primaryColor,
                        borderColor: `${formData.primaryColor}40`,
                      }}
                    >
                      Admin Badge
                    </span>
                  </div>
                  <h4
                    className="font-bold text-sm tracking-tight"
                    style={{ color: formData.secondaryColor }}
                  >
                    Interactive Component Styling
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Notice that text on active primary buttons and menus is always crisp white.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white uppercase tracking-wider shadow-sm flex items-center gap-2"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    <Globe className="h-3.5 w-3.5 text-white" />
                    Go to Public Portal
                  </button>
                </div>
              </div>

              {/* Simulated Footer Bar */}
              <div
                className="p-4 text-white flex flex-wrap items-center justify-between gap-3 text-xs"
                style={{ backgroundColor: formData.darkColor }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: formData.primaryColor }}
                  />
                  <span className="font-semibold text-white/90">
                    © {new Date().getFullYear()} {formData.companyName || "Nganira Company LTD"}. All rights reserved.
                  </span>
                </div>
                <div className="flex items-center gap-2 text-white/70 text-[11px]">
                  <span>{formData.tagline || "Waste Water Management"}</span>
                  <span>•</span>
                  <span>Kigali, Rwanda</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Contact & Social Channels */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  4. Contact Numbers & Email Addresses
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Manage phone numbers and email addresses displayed in the header, footer, and contact pages.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl border bg-muted/10">
              {/* Phone Numbers Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <Label className="text-xs font-bold uppercase tracking-wider">
                      Phone Numbers
                    </Label>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-white font-semibold">
                      {formData.phones.length}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPhone}
                    className="h-7 px-2.5 text-[10px] font-bold uppercase tracking-wider gap-1 border-primary/40 text-primary hover:bg-primary/10"
                  >
                    <Plus className="h-3 w-3" /> Add Phone
                  </Button>
                </div>

                <div className="space-y-2">
                  {formData.phones.map((p, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-background p-2 rounded-lg border shadow-sm">
                      <span className="text-[10px] font-mono text-muted-foreground w-6 text-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="relative flex-grow">
                        <Input
                          type="tel"
                          className="h-8 text-xs pr-16"
                          value={p}
                          onChange={e => updatePhone(idx, e.target.value)}
                          placeholder={idx === 0 ? "e.g. +250 788 303 628 (Primary)" : "e.g. +250 788 000 000"}
                        />
                        {idx === 0 && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary text-white pointer-events-none">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                          disabled={idx === 0}
                          onClick={() => movePhone(idx, 'up')}
                          title="Move up"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                          disabled={idx === formData.phones.length - 1}
                          onClick={() => movePhone(idx, 'down')}
                          title="Move down"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        disabled={formData.phones.length <= 1 && !p}
                        onClick={() => removePhone(idx)}
                        title="Remove phone"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Phone #1 is your primary contact number.
                </p>
              </div>

              {/* Email Addresses Column */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <Label className="text-xs font-bold uppercase tracking-wider">
                      Email Addresses
                    </Label>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-white font-semibold">
                      {formData.emails.length}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEmail}
                    className="h-7 px-2.5 text-[10px] font-bold uppercase tracking-wider gap-1 border-primary/40 text-primary hover:bg-primary/10"
                  >
                    <Plus className="h-3 w-3" /> Add Email
                  </Button>
                </div>

                <div className="space-y-2">
                  {formData.emails.map((em, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 bg-background p-2 rounded-lg border shadow-sm">
                      <span className="text-[10px] font-mono text-muted-foreground w-6 text-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="relative flex-grow">
                        <Input
                          type="email"
                          className="h-8 text-xs pr-16"
                          value={em}
                          onChange={e => updateEmail(idx, e.target.value)}
                          placeholder={idx === 0 ? "e.g. info@nganira.rw (Primary)" : "e.g. support@nganira.rw"}
                        />
                        {idx === 0 && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary text-white pointer-events-none">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                          disabled={idx === 0}
                          onClick={() => moveEmail(idx, 'up')}
                          title="Move up"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-5 text-muted-foreground hover:text-foreground disabled:opacity-20"
                          disabled={idx === formData.emails.length - 1}
                          onClick={() => moveEmail(idx, 'down')}
                          title="Move down"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        disabled={formData.emails.length <= 1 && !em}
                        onClick={() => removeEmail(idx)}
                        title="Remove email"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Email #1 is your primary email address.
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Social Channels */}
          <div className="border-t pt-5">
            <Label className="text-sm font-bold mb-4 block">Social Media Links</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2"><Twitter className="h-3 w-3" /> Twitter URL</Label>
                <Input className="h-9 text-xs" value={formData.socials?.twitter || ""} onChange={e => updateSocial('twitter', e.target.value)} placeholder="https://twitter.com/..." />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2"><Linkedin className="h-3 w-3" /> LinkedIn URL</Label>
                <Input className="h-9 text-xs" value={formData.socials?.linkedin || ""} onChange={e => updateSocial('linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2"><Facebook className="h-3 w-3" /> Facebook URL</Label>
                <Input className="h-9 text-xs" value={formData.socials?.facebook || ""} onChange={e => updateSocial('facebook', e.target.value)} placeholder="https://facebook.com/..." />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2"><Instagram className="h-3 w-3" /> Instagram URL</Label>
                <Input className="h-9 text-xs" value={formData.socials?.instagram || ""} onChange={e => updateSocial('instagram', e.target.value)} placeholder="https://instagram.com/..." />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2"><MessageCircle className="h-3 w-3" /> WhatsApp Link / Number</Label>
                <Input className="h-9 text-xs" value={formData.socials?.whatsapp || ""} onChange={e => updateSocial('whatsapp', e.target.value)} placeholder="https://wa.me/250788303628" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-2"><Youtube className="h-3 w-3" /> YouTube Channel URL</Label>
                <Input className="h-9 text-xs" value={formData.socials?.youtube || ""} onChange={e => updateSocial('youtube', e.target.value)} placeholder="https://youtube.com/@..." />
              </div>
            </div>
          </div>

          <Button 
            type="submit" 
            className="gap-2 h-11 text-xs font-bold uppercase tracking-widest w-full bg-primary text-white hover:opacity-90 shadow-md"
          >
            <Save className="h-4 w-4 text-white" /> Save Site Branding & Color Scheme
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function HeroEditor({ initialData, onSave }: { initialData: any, onSave: (data: any) => void }) {
  const [formData, setFormData] = React.useState(initialData || {});
  React.useEffect(() => { if (initialData) setFormData(initialData); }, [initialData]);
  return (
    <Card>
      <CardHeader><CardTitle className="text-xl">Hero Section</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Badge</Label><Input className="h-9 text-xs" value={formData.badge} onChange={e => setFormData({...formData, badge: e.target.value})} /></div>
            <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Title Part 1</Label><Input className="h-9 text-xs" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
            <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Title Accent</Label><Input className="h-9 text-xs" value={formData.titleAccent} onChange={e => setFormData({...formData, titleAccent: e.target.value})} /></div>
            <MediaPicker label="Hero Media" value={formData.imageUrl} onChange={url => setFormData({...formData, imageUrl: url})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Width (px)</Label><Input type="number" className="h-9 text-xs" value={formData.imageWidth} onChange={e => setFormData({...formData, imageWidth: Number(e.target.value)})} /></div>
            <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Height (px)</Label><Input type="number" className="h-9 text-xs" value={formData.imageHeight} onChange={e => setFormData({...formData, imageHeight: Number(e.target.value)})} /></div>
          </div>
          <RichTextEditor 
            label="Description" 
            value={formData.description} 
            onChange={val => setFormData({...formData, description: val})} 
          />
          <Button type="submit" className="h-10 text-[10px] font-bold uppercase tracking-widest w-full bg-primary text-white hover:bg-primary/90"><Save className="h-4 w-4 mr-2" /> Save Hero</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function HighlightsEditor({ initialData, onSave }: { initialData: any, onSave: (data: any) => void }) {
  const [formData, setFormData] = React.useState(initialData || { items: [] });
  React.useEffect(() => { if (initialData) setFormData(initialData); }, [initialData]);

  const updateItem = (i: number, f: string, v: any) => {
    const ni = [...formData.items]; ni[i] = { ...ni[i], [f]: v }; setFormData({ ...formData, items: ni });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Value Highlights</CardTitle>
        <Button size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest" onClick={() => setFormData({...formData, items: [...formData.items, {title: "", description: "", icon: "shield"}]})}><Plus className="h-4 w-4" /> Add Highlight</Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {formData.items.map((item: any, i: number) => (
            <Card key={i} className="p-4 space-y-3 relative border-primary/20 bg-muted/5">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Title</Label>
                <Input className="h-9 text-xs font-bold" value={item.title} onChange={e => updateItem(i, 'title', e.target.value)} placeholder="e.g. Nationwide Coverage" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Icon Identifier</Label>
                <Input className="h-9 text-xs" value={item.icon} onChange={e => updateItem(i, 'icon', e.target.value)} placeholder="e.g. shield, globe, zap" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Description</Label>
                <Textarea className="min-h-[60px] text-xs" value={item.description} onChange={e => updateItem(i, 'description', e.target.value)} />
              </div>
              <Button size="icon" variant="destructive" className="h-7 w-7 absolute top-2 right-2" onClick={() => setFormData({...formData, items: formData.items.filter((_:any, idx:number) => idx !== i)})}><Trash2 className="h-3 w-3" /></Button>
            </Card>
          ))}
        </div>
        <Button onClick={() => onSave(formData)} className="h-10 text-[10px] font-bold uppercase tracking-widest w-full bg-primary text-white hover:bg-primary/90"><Save className="h-4 w-4 mr-2" /> Save Highlights</Button>
      </CardContent>
    </Card>
  );
}

function ServicesEditor({ initialData, onSave }: { initialData: any, onSave: (data: any) => void }) {
  const [formData, setFormData] = React.useState(initialData || { items: [] });
  React.useEffect(() => { if (initialData) setFormData(initialData); }, [initialData]);
  const updateItem = (i: number, f: string, v: any) => {
    const ni = [...formData.items]; ni[i] = { ...ni[i], [f]: v }; setFormData({ ...formData, items: ni });
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Services</CardTitle>
        <Button size="sm" className="h-8 text-[10px] font-bold uppercase tracking-widest" onClick={() => setFormData({...formData, items: [...formData.items, {title: "", description: "", icon: "truck", imageUrl: "", width: 800, height: 600}]})}><Plus className="h-4 w-4" /> Add Service</Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {formData.items.map((item: any, i: number) => (
            <Card key={i} className="p-4 space-y-3 relative border-primary/20">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Service Title</Label>
                <Input className="h-9 text-xs font-bold" value={item.title} onChange={e => updateItem(i, 'title', e.target.value)} placeholder="Title" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Icon Identifier</Label>
                <Input className="h-9 text-xs" value={item.icon} onChange={e => updateItem(i, 'icon', e.target.value)} placeholder="e.g. truck, droplets, settings" />
              </div>
              <RichTextEditor 
                label="Description" 
                value={item.description} 
                onChange={val => updateItem(i, 'description', val)} 
              />
              <MediaPicker value={item.imageUrl} onChange={u => updateItem(i, 'imageUrl', u)} />
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Width</Label>
                  <Input type="number" className="h-8 text-[10px]" value={item.width} onChange={e => updateItem(i, 'width', Number(e.target.value))} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Height</Label>
                  <Input type="number" className="h-8 text-[10px]" value={item.height} onChange={e => updateItem(i, 'height', Number(e.target.value))} />
                </div>
              </div>
              <Button size="icon" variant="destructive" className="h-8 w-8 absolute top-2 right-2" onClick={() => setFormData({...formData, items: formData.items.filter((_:any, idx:number) => idx !== i)})}><Trash2 className="h-4 w-4" /></Button>
            </Card>
          ))}
        </div>
        <Button onClick={() => onSave(formData)} className="h-10 text-[10px] font-bold uppercase tracking-widest w-full bg-primary text-white hover:bg-primary/90"><Save className="h-4 w-4 mr-2" /> Save Services</Button>
      </CardContent>
    </Card>
  );
}

function ImpactEditor({ initialData, onSave }: { initialData: any, onSave: (data: any) => void }) {
  const [formData, setFormData] = React.useState({
    title: initialData?.title || "",
    subtitle: initialData?.subtitle || "",
    items: Array.isArray(initialData?.items) ? initialData.items : []
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        subtitle: initialData.subtitle || "",
        items: Array.isArray(initialData.items) ? initialData.items : []
      });
    }
  }, [initialData]);

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { title: "", icon: "sparkles", points: [""] }]
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Impact UI Stats</CardTitle>
          <CardDescription className="text-xs">Manage dynamic impact categories and points.</CardDescription>
        </div>
        <Button size="sm" onClick={addItem} className="gap-2 h-9 text-[10px] font-bold uppercase tracking-widest">
          <Plus className="h-4 w-4" /> Add Impact Category
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-4 p-4 border rounded-xl bg-primary/5">
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Section Title</Label>
            <Input 
              className="h-9 text-sm font-bold" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
              placeholder="e.g. Our Environmental & Community Impact"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Section Subtitle / Tagline</Label>
            <Textarea 
              className="text-xs" 
              rows={2}
              value={formData.subtitle} 
              onChange={e => setFormData({...formData, subtitle: e.target.value})} 
              placeholder="Subtitle describing the impact"
            />
          </div>
        </div>

        <div className="space-y-6">
          {formData.items.map((item: any, i: number) => (
            <div key={i} className="p-4 border rounded-xl border-primary/20 bg-muted/5 relative group">
              <Button 
                size="icon" 
                variant="destructive" 
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeItem(i)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Category Title</Label>
                  <Input 
                    className="h-9 text-xs font-bold" 
                    value={item.title} 
                    onChange={e => updateItem(i, 'title', e.target.value)} 
                    placeholder="Impact Category Title" 
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Icon Identifier</Label>
                  <Input 
                    className="h-9 text-xs" 
                    value={item.icon} 
                    onChange={e => updateItem(i, 'icon', e.target.value)} 
                    placeholder="e.g. leaf, heart, briefcase" 
                  />
                </div>
              </div>
              <RichTextEditor 
                label="Impact Points" 
                value={item.points?.join("")} 
                onChange={html => {
                  updateItem(i, 'points', [html]); // Store as single HTML block in array
                }} 
              />
            </div>
          ))}
        </div>
        {formData.items.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed rounded-xl">
            <p className="text-muted-foreground text-sm">No impact items configured. Click 'Add Impact Category' to start.</p>
          </div>
        )}
        <Button onClick={() => onSave(formData)} className="h-10 text-[10px] font-bold uppercase tracking-widest w-full bg-primary text-white hover:bg-primary/90">
          <Save className="h-4 w-4 mr-2" /> Save Impact Configuration
        </Button>
      </CardContent>
    </Card>
  );
}

function MilestonesEditor({ initialData, onSave }: { initialData: any, onSave: (data: any) => void }) {
  const [formData, setFormData] = React.useState({ 
    title: initialData?.title || "", 
    description: initialData?.description || "",
    vision: initialData?.vision || "",
    mission: initialData?.mission || "",
    items: Array.isArray(initialData?.items) ? initialData.items : [] 
  });

  React.useEffect(() => { 
    if (initialData) {
      setFormData({ 
        title: initialData.title || "",
        description: initialData.description || "",
        vision: initialData.vision || "",
        mission: initialData.mission || "",
        items: Array.isArray(initialData.items) ? initialData.items : [] 
      });
    }
  }, [initialData]);
  
  const updateItem = (i: number, f: string, v: any) => {
    const ni = [...formData.items]; 
    ni[i] = { ...ni[i], [f]: v }; 
    setFormData({ ...formData, items: ni });
  };

  const removeItem = (index: number) => {
    const ni = formData.items.filter((_: any, i: number) => i !== index);
    setFormData({ ...formData, items: ni });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { year: "202X", title: "New Milestone", description: "<p></p>", icon: "clock" }]
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Who We Are / Evolution</CardTitle>
          <CardDescription className="text-xs">Manage section headers and growth milestones.</CardDescription>
        </div>
        <Button size="sm" onClick={addItem} className="gap-2 h-9 text-[10px] font-bold uppercase tracking-widest">
          <Plus className="h-4 w-4" /> Add Milestone
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 p-4 border rounded-xl bg-primary/5">
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Section Title</Label>
            <Input 
              className="h-9 text-sm font-bold" 
              value={formData.title} 
              onChange={e => setFormData({...formData, title: e.target.value})} 
            />
          </div>
          <RichTextEditor 
            label="Who We Are Introduction" 
            value={formData.description} 
            onChange={html => setFormData({...formData, description: html})} 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Our Vision</Label>
              <Textarea 
                className="text-xs" 
                rows={3}
                value={formData.vision} 
                onChange={e => setFormData({...formData, vision: e.target.value})} 
                placeholder="Vision statement"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Our Mission</Label>
              <Textarea 
                className="text-xs" 
                rows={3}
                value={formData.mission} 
                onChange={e => setFormData({...formData, mission: e.target.value})} 
                placeholder="Mission statement"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {formData.items.map((item: any, i: number) => (
            <div key={i} className="p-4 border rounded-xl relative bg-muted/5 group border-primary/10">
              <Button 
                size="icon" 
                variant="destructive" 
                className="absolute -top-2 -right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" 
                onClick={() => removeItem(i)}
                title="Remove Milestone"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Year</Label>
                  <Input className="h-9 text-xs" value={item.year} onChange={e => updateItem(i, 'year', e.target.value)} placeholder="Year" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Title</Label>
                  <Input className="h-9 text-xs font-bold" value={item.title} onChange={e => updateItem(i, 'title', e.target.value)} placeholder="Milestone Title" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Icon Identifier</Label>
                  <Input className="h-9 text-xs" value={item.icon} onChange={e => updateItem(i, 'icon', e.target.value)} placeholder="e.g. clock, rocket, shield" />
                </div>
              </div>
              <RichTextEditor 
                label="Item Details"
                value={item.description} 
                onChange={val => updateItem(i, 'description', val)} 
                placeholder="Describe the milestone event..."
              />
            </div>
          ))}
          {formData.items.length === 0 && (
            <div className="text-center py-10 border-2 border-dashed rounded-xl">
              <p className="text-muted-foreground text-sm">No milestones listed. Click 'Add Milestone' to begin.</p>
            </div>
          )}
        </div>
        <Button onClick={() => onSave(formData)} className="h-11 text-[10px] font-bold uppercase tracking-widest w-full bg-primary text-white hover:bg-primary/90 mt-4">
          <Save className="h-4 w-4 mr-2" /> Save Who We Are Configuration
        </Button>
      </CardContent>
    </Card>
  );
}

function RegionalEditor({ initialData, onSave }: { initialData: any, onSave: (data: any) => void }) {
  const [formData, setFormData] = React.useState(initialData || { items: [] });
  React.useEffect(() => { if (initialData) setFormData(initialData); }, [initialData]);
  return (
    <Card>
      <CardHeader><CardTitle className="text-xl">Our Presence</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {formData.items.map((item: any, i: number) => (
            <div key={i} className="p-4 border rounded border-primary/20 bg-muted/5">
              <Input className="h-9 text-xs font-bold mb-2" value={item.name} onChange={e => {
                const ni = [...formData.items]; ni[i].name = e.target.value; setFormData({...formData, items: ni});
              }} placeholder="City Name" />
              <Input className="h-9 text-xs mb-2" value={item.status} onChange={e => {
                const ni = [...formData.items]; ni[i].status = e.target.value; setFormData({...formData, items: ni});
              }} placeholder="Operational Status" />
              <Input className="h-9 text-xs" value={item.capacity} onChange={e => {
                const ni = [...formData.items]; ni[i].capacity = e.target.value; setFormData({...formData, items: ni});
              }} placeholder="Capacity/Fleet info" />
            </div>
          ))}
        </div>
        <Button onClick={() => onSave(formData)} className="h-10 text-[10px] font-bold uppercase tracking-widest w-full bg-primary text-white hover:bg-primary/90"><Save className="h-4 w-4 mr-2" /> Save Presence Config</Button>
      </CardContent>
    </Card>
  );
}

function GalleryManager({ photos, loading }: { photos: any, loading: boolean }) {
  const functions = useFunctions();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = React.useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [width, setWidth] = React.useState(800);
  const [height, setHeight] = React.useState(600);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 9;
  const photoList = photos || [];
  const paginatedPhotos = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return photoList.slice(start, start + PAGE_SIZE);
  }, [photoList, page]);

  const resetForm = () => {
    setIsEditing(null);
    setPhotoUrl("");
    setDescription("");
    setWidth(800);
    setHeight(600);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!functions || !photoUrl) return;
    setIsSubmitting(true);
    try {
      if (isEditing) {
        const updateFunc = httpsCallable(functions, 'adminUpdateGalleryItem');
        await updateFunc({ id: isEditing, imageUrl: photoUrl, description, width, height });
        toast({ title: "Updated", description: "Photo updated successfully." });
      } else {
        const addFunc = httpsCallable(functions, 'adminAddGalleryItem');
        await addFunc({ imageUrl: photoUrl, description, width, height });
        toast({ title: "Success", description: "Photo added to gallery." });
      }
      resetForm();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (photo: any) => {
    setIsEditing(photo.id);
    setPhotoUrl(photo.imageUrl);
    setDescription(photo.description);
    setWidth(photo.width || 800);
    setHeight(photo.height || 600);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!functions || !confirm("Delete this photo?")) return;
    setDeletingId(id);
    try {
      const delFunc = httpsCallable(functions, 'adminDeleteGalleryItem');
      await delFunc({ id });
      toast({ title: "Deleted", description: "Photo removed from gallery." });
      if (isEditing === id) resetForm();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <Card className="lg:col-span-1 h-fit sticky top-24">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">{isEditing ? "Edit Photo" : "Add to Gallery"}</CardTitle>
            <CardDescription className="text-xs">Manage visual service proof.</CardDescription>
          </div>
          {isEditing && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={resetForm}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <MediaPicker value={photoUrl} onChange={setPhotoUrl} label="Gallery Item (Image/Video)" />
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Caption</Label>
              <Input className="h-9 text-xs" value={description} onChange={e => setDescription(e.target.value)} placeholder="Service description..." required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Width (px)</Label>
                <Input type="number" className="h-9 text-xs" value={width} onChange={e => setWidth(Number(e.target.value))} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-bold uppercase text-muted-foreground">Height (px)</Label>
                <Input type="number" className="h-9 text-xs" value={height} onChange={e => setHeight(Number(e.target.value))} />
              </div>
            </div>
            <Button className="w-full h-10 text-[10px] font-bold uppercase tracking-widest bg-primary text-white hover:bg-primary/90" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {isEditing ? "Save Changes" : "Add Photo"}
            </Button>
            {isEditing && (
              <Button type="button" variant="outline" className="w-full h-10 text-[10px] font-bold uppercase tracking-widest" onClick={resetForm}>
                Cancel Edit
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle className="text-xl">Gallery Photos</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {loading ? <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /> : paginatedPhotos.map((p: any) => (
              <div key={p.id} className="group relative aspect-video rounded-lg overflow-hidden border border-primary/10">
                <Image src={p.imageUrl} alt="" fill className="object-cover" />
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    onClick={() => handleEdit(p)}
                    disabled={deletingId === p.id}
                  >
                    <Edit3 className="h-4 w-4 text-primary" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="destructive" 
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                  >
                    {deletingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[9px] text-white font-medium line-clamp-1">{p.description}</p>
                </div>
              </div>
            ))}
            {!loading && photoList.length === 0 && (
              <div className="col-span-full py-20 text-center opacity-50">
                <ImageIcon className="h-10 w-10 mx-auto mb-2" />
                <p className="text-sm">No photos in gallery.</p>
              </div>
            )}
          </div>

          <AdminPagination
            currentPage={page}
            totalItems={photoList.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            itemLabel="photos"
            className="mt-4"
          />
        </CardContent>
      </Card>
    </div>
  );
}
