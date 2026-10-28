
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
  Eye
} from "lucide-react";
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
    let firestoreSaved = false;

    // 1. Direct write to Firestore for instant and persistent saving in Cloud & client cache
    if (db) {
      try {
        await setDoc(doc(db, "settings", sectionId), {
          ...content,
          updatedAt: Date.now()
        }, { merge: true });
        firestoreSaved = true;
      } catch (dbErr: any) {
        console.warn(`Direct Firestore write error for ${sectionId}:`, dbErr);
      }
    }

    // 2. Also save to browser localStorage for immediate localhost persistence across refreshes
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(`nganila_setting_${sectionId}`, JSON.stringify(content));
      }
    } catch {
      // ignore
    }

    // 3. Invoke Cloud Function for backend audit/synchronization
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

    if (firestoreSaved || funcSuccess) {
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
    user?.email?.toLowerCase() === "orverxi@gmail.com" ||
    user?.email?.toLowerCase() === "sanexcompany@gmail.com";

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
                <TabsTrigger value="general" className="gap-2 text-[10px] font-bold uppercase"><Settings className="h-3 w-3 text-primary" /> Branding & Socials</TabsTrigger>
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

function NavigationEditor({ initialData, onSave }: { initialData: any, onSave: (data: any) => void }) {
  const [navLinks, setNavLinks] = React.useState<any[]>(initialData?.navLinks || []);

  React.useEffect(() => {
    if (initialData?.navLinks) setNavLinks(initialData.navLinks);
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Navigation Menu</CardTitle>
          <CardDescription className="text-xs">Manage links in the top header and footer.</CardDescription>
        </div>
        <Button size="sm" onClick={addLink} className="gap-2 h-9 text-[10px] font-bold uppercase tracking-widest"><Plus className="h-4 w-4" /> Add Link</Button>
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
          className="gap-2 h-10 text-[10px] font-bold uppercase tracking-widest w-full bg-primary text-black"
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

const DEFAULT_SLIDER_ITEMS = [
  { 
    title: "Nganira Company LTD", 
    description: "<p>Professional waste management and sanitation company in Kicukiro, Kigali, Rwanda. Verified member of ASSERWA operating a fleet of 5 vacuum tankers.</p>", 
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1779714862617_SANEX_VIDEO_higlights%20-%20Copy.mp4?alt=media",
    width: 2000,
    height: 1080,
    link: "/services",
    buttonText: "Our Core Services"
  },
  { 
    title: "Liquid Waste Evacuation & Transport", 
    description: "<p>Professional septic tank emptying, pit latrine draining (kuvidura), and vacuum tanker transportation with rapid dispatch across Kigali.</p>", 
    imageUrl: "https://firebasestorage.googleapis.com/v0/b/nganila-f3948.firebasestorage.app/o/uploads%2F1780321287848_B25A3099.jpg?alt=media",
    width: 1200,
    height: 600,
    link: "/book",
    buttonText: "Book an Exhauster Truck"
  }
];

function SliderEditor({ initialData, onSave }: { initialData: any, onSave: (data: any) => void }) {
  const [items, setItems] = React.useState<any[]>(() => {
    if (initialData?.items && Array.isArray(initialData.items) && initialData.items.length > 0) {
      return initialData.items;
    }
    if (typeof window !== "undefined") {
      try {
        const local = localStorage.getItem("nganila_setting_slider");
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed?.items) && parsed.items.length > 0) {
            return parsed.items;
          }
        }
      } catch {}
    }
    return DEFAULT_SLIDER_ITEMS;
  });

  React.useEffect(() => {
    if (initialData?.items && Array.isArray(initialData.items) && initialData.items.length > 0) {
      setItems(initialData.items);
    }
  }, [initialData]);

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { title: "", description: "", imageUrl: "", width: 1200, height: 600, link: "/articles", buttonText: "Learn More" }]);
  const removeItem = (index: number) => setItems(items.filter((_, i) => i !== index));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Homepage Slider</CardTitle>
          <CardDescription className="text-xs">Manage featured carousel slides.</CardDescription>
        </div>
        <Button size="sm" onClick={addItem} className="gap-2 h-9 text-[10px] font-bold uppercase tracking-widest"><Plus className="h-4 w-4" /> Add Slide</Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-5">
          {items.map((item, i) => (
            <Card key={i} className="p-5 space-y-4 bg-muted/20 relative group border-primary/20">
              <Button size="icon" variant="destructive" className="absolute top-4 right-4 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4" /></Button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Title</Label><Input className="h-9 text-xs" value={item.title} onChange={e => updateItem(i, 'title', e.target.value)} /></div>
                  <RichTextEditor 
                    label="Description" 
                    value={item.description} 
                    onChange={val => updateItem(i, 'description', val)} 
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Width (px)</Label><Input type="number" className="h-9 text-xs" value={item.width} onChange={e => updateItem(i, 'width', Number(e.target.value))} /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Height (px)</Label><Input type="number" className="h-9 text-xs" value={item.height} onChange={e => updateItem(i, 'height', Number(e.target.value))} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Btn Text</Label><Input className="h-9 text-xs" value={item.buttonText} onChange={e => updateItem(i, 'buttonText', e.target.value)} /></div>
                    <div className="space-y-1"><Label className="text-[10px] font-bold uppercase text-muted-foreground">Link</Label><Input className="h-9 text-xs" value={item.link} onChange={e => updateItem(i, 'link', e.target.value)} /></div>
                  </div>
                </div>
                <MediaPicker label="Slide Image/Video" value={item.imageUrl} onChange={(url) => updateItem(i, 'imageUrl', url)} />
              </div>
            </Card>
          ))}
        </div>
        <Button onClick={() => onSave({ items })} className="gap-2 h-10 text-[10px] font-bold uppercase tracking-widest w-full bg-primary text-black"><Save className="h-4 w-4" /> Save Slider Config</Button>
      </CardContent>
    </Card>
  );
}

function parseArrayField(arr: any, fallbackStr: any, defaultValue: string): string[] {
  if (Array.isArray(arr) && arr.length > 0) {
    const filtered = arr.filter((x: any) => typeof x === "string");
    if (filtered.length > 0) return filtered;
  }
  if (typeof fallbackStr === "string" && fallbackStr.trim()) {
    return [fallbackStr.trim()];
  }
  return [defaultValue];
}

function GeneralEditor({ initialData, onSave }: { initialData: any, onSave: (data: any) => void }) {
  const [formData, setFormData] = React.useState({ 
    siteName: initialData?.siteName || "Nganira Company LTD", 
    logoUrl: initialData?.logoUrl || "", 
    logoWidth: initialData?.logoWidth || 160, 
    logoHeight: initialData?.logoHeight || 40, 
    logoSpacing: initialData?.logoSpacing ?? 8, 
    phones: parseArrayField(initialData?.phones, initialData?.phone, "+250 788 840 000"), 
    emails: parseArrayField(initialData?.emails, initialData?.email, "info@nganira.rw"),
    socials: initialData?.socials || { twitter: "", linkedin: "", facebook: "", instagram: "", whatsapp: "", youtube: "" }
  });
  
  React.useEffect(() => { 
    if (initialData) {
      setFormData({
        siteName: initialData.siteName || "Nganira Company LTD",
        logoUrl: initialData.logoUrl || "",
        logoWidth: initialData.logoWidth || 160,
        logoHeight: initialData.logoHeight || 40,
        logoSpacing: initialData.logoSpacing ?? 8,
        phones: parseArrayField(initialData.phones, initialData.phone, "+250 788 840 000"),
        emails: parseArrayField(initialData.emails, initialData.email, "info@nganira.rw"),
        socials: initialData.socials || { twitter: "", linkedin: "", facebook: "", instagram: "", whatsapp: "", youtube: "" }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhones = formData.phones.map(p => p.trim()).filter(Boolean);
    const cleanEmails = formData.emails.map(em => em.trim()).filter(Boolean);

    onSave({
      ...formData,
      phones: cleanPhones.length > 0 ? cleanPhones : [formData.phones[0] || ""],
      phone: cleanPhones[0] || formData.phones[0] || "",
      emails: cleanEmails.length > 0 ? cleanEmails : [formData.emails[0] || ""],
      email: cleanEmails[0] || formData.emails[0] || ""
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Branding & Social Links</CardTitle>
        <CardDescription className="text-xs">
          Manage your organization name, logo, contact phone numbers, email addresses, and social media channels.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Site Name</Label>
              <Input className="h-9 text-xs" value={formData.siteName} onChange={e => setFormData({...formData, siteName: e.target.value})} />
            </div>
            <MediaPicker label="Company Logo" value={formData.logoUrl} onChange={(url) => setFormData({...formData, logoUrl: url})} />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Logo Width (px)</Label>
              <Input type="number" className="h-9 text-xs" value={formData.logoWidth} onChange={e => setFormData({...formData, logoWidth: Number(e.target.value)})} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Logo Height (px)</Label>
              <Input type="number" className="h-9 text-xs" value={formData.logoHeight} onChange={e => setFormData({...formData, logoHeight: Number(e.target.value)})} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Logo Spacing (px)</Label>
              <Input type="number" className="h-9 text-xs" value={formData.logoSpacing} onChange={e => setFormData({...formData, logoSpacing: Number(e.target.value)})} />
            </div>
          </div>

          {/* Contact Numbers and Emails */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl border bg-muted/10">
            {/* Phone Numbers Column */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  <Label className="text-xs font-bold uppercase tracking-wider">
                    Phone Numbers
                  </Label>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-black font-semibold">
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
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/20 text-black pointer-events-none">
                          Primary
                        </span>
                      )}
                    </div>
                    {/* Reorder buttons */}
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
                    {/* Delete button */}
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
                Phone #1 is your primary contact number. All phone numbers will be available to visitors.
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
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-black font-semibold">
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
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/20 text-black pointer-events-none">
                          Primary
                        </span>
                      )}
                    </div>
                    {/* Reorder buttons */}
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
                    {/* Delete button */}
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
                Email #1 is your primary contact address. All email addresses will be displayed on the site.
              </p>
            </div>
          </div>

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

          <Button type="submit" className="gap-2 h-10 text-[10px] font-bold uppercase tracking-widest w-full bg-primary text-black"><Save className="h-4 w-4" /> Save Branding & Socials</Button>
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
          <Button type="submit" className="h-10 text-[10px] font-bold uppercase tracking-widest w-full bg-primary text-black"><Save className="h-4 w-4 mr-2" /> Save Hero</Button>
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
        <Button onClick={() => onSave(formData)} className="h-10 text-[10px] font-bold uppercase tracking-widest w-full bg-primary text-black"><Save className="h-4 w-4 mr-2" /> Save Highlights</Button>
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
        <Button onClick={() => onSave(formData)} className="h-10 text-[10px] font-bold uppercase tracking-widest w-full bg-primary text-black"><Save className="h-4 w-4 mr-2" /> Save Services</Button>
      </CardContent>
    </Card>
  );
}

function ImpactEditor({ initialData, onSave }: { initialData: any, onSave: (data: any) => void }) {
  const [formData, setFormData] = React.useState(initialData || { items: [] });
  React.useEffect(() => { if (initialData) setFormData(initialData); }, [initialData]);

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { title: "New Impact", icon: "sparkles", points: ["<p>Describe impact point here.</p>"] }]
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
        <Button onClick={() => onSave(formData)} className="h-10 text-[10px] font-bold uppercase tracking-widest w-full bg-primary text-black">
          <Save className="h-4 w-4 mr-2" /> Save Impact Configuration
        </Button>
      </CardContent>
    </Card>
  );
}

function MilestonesEditor({ initialData, onSave }: { initialData: any, onSave: (data: any) => void }) {
  const [formData, setFormData] = React.useState({ 
    title: initialData?.title || "Who We Are", 
    description: initialData?.description || "",
    items: initialData?.items || [] 
  });

  React.useEffect(() => { 
    if (initialData) {
      setFormData({ 
        title: initialData.title || "Who We Are",
        description: initialData.description || "",
        items: initialData.items || [] 
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
        <Button onClick={() => onSave(formData)} className="h-11 text-[10px] font-bold uppercase tracking-widest w-full bg-primary text-black mt-4">
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
        <Button onClick={() => onSave(formData)} className="h-10 text-[10px] font-bold uppercase tracking-widest w-full bg-primary text-black"><Save className="h-4 w-4 mr-2" /> Save Presence Config</Button>
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
            <Button className="w-full h-10 text-[10px] font-bold uppercase tracking-widest bg-primary text-black" disabled={isSubmitting}>
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
