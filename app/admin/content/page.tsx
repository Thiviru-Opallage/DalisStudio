"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Loader2, Plus, Trash2, Edit2, Check, X, Upload } from "lucide-react";

// --- Types ---
interface HeroSectionData {
  id?: number;
  title: string;
  base_image: string;
  hover_image: string;
}

interface QuoteBracketImage {
  id: number;
  bracket_group: number;
  image_url: string;
  sort_order: number;
}

interface SignatureWork {
  id: number;
  title: string;
  description: string;
  image_url: string;
  sort_order: number;
}

interface WorksGridItem {
  id: number;
  title: string;
  description: string;
  image_url: string;
  width_class: string;
  height_class: string;
  top_class: string;
  left_class: string;
  z_index: number;
  ambient_dark: string;
  ambient_light: string;
  sort_order: number;
}

interface AboutHeroData {
  id?: number;
  base_image_dark: string;
  hover_image_dark: string;
  base_image_light: string;
  hover_image_light: string;
}

interface AboutQuoteData {
  one: string;
  two: string;
  three: string;
}

interface ContactData {
  id?: number;
  card_image_url: string;
  showreel_url: string;
}

type TabType = "hero" | "quote-brackets" | "signature-works" | "works-grid" | "about-hero" | "about-quote" | "contact";

// Shared input styling so every text field, textarea, and select is clearly readable
const INPUT_CLASSES =
  "text-gray-900 placeholder:text-gray-400 bg-white";

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<TabType>("hero");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // States for dynamic content from DB
  const [heroData, setHeroData] = useState<HeroSectionData>({ title: "", base_image: "", hover_image: "" });
  const [bracketImages, setBracketImages] = useState<QuoteBracketImage[]>([]);
  const [signatureWorks, setSignatureWorks] = useState<SignatureWork[]>([]);
  const [worksGridItems, setWorksGridItems] = useState<WorksGridItem[]>([]);
  const [aboutHeroData, setAboutHeroData] = useState<AboutHeroData>({ base_image_dark: "", hover_image_dark: "", base_image_light: "", hover_image_light: "" });
  const [aboutQuoteData, setAboutQuoteData] = useState<AboutQuoteData>({ one: "", two: "", three: "" });
  const [contactData, setContactData] = useState<ContactData>({ card_image_url: "", showreel_url: "" });

  // Creation/Edit forms states
  const [bracketForm, setBracketForm] = useState({ id: null as number | null, bracket_group: 1, image_url: "", sort_order: 0 });
  const [isEditingBracket, setIsEditingBracket] = useState(false);

  const [sigForm, setSigForm] = useState({ id: null as number | null, title: "", description: "", image_url: "", sort_order: 0 });
  const [isEditingSig, setIsEditingSig] = useState(false);

  const [gridForm, setGridForm] = useState({
    id: null as number | null,
    title: "",
    description: "",
    image_url: "",
    width_class: "w-48",
    height_class: "h-64",
    top_class: "",
    left_class: "",
    z_index: 10,
    ambient_dark: "from-emerald-950 to-neutral-950",
    ambient_light: "from-emerald-100 via-white to-white",
  });
  const [isEditingGrid, setIsEditingGrid] = useState(false);

  // Form refs for smooth scrolling on edit
  const bracketFormRef = useRef<HTMLFormElement>(null);
  const sigFormRef = useRef<HTMLFormElement>(null);
  const gridFormRef = useRef<HTMLFormElement>(null);

  // Draft file state (maps form keys to File objects)
  const [pendingFiles, setPendingFiles] = useState<Record<string, File>>({});
  // Local previews for Selected files (object URLs)
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    // Clear drafts/previews when active tab changes
    setPendingFiles({});
    setFilePreviews({});
    fetchData();
  }, [activeTab]);

  const showMsg = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "hero") {
        const res = await fetch("/api/content/hero");
        const data = await res.json();
        if (res.ok) setHeroData(data);
      } else if (activeTab === "quote-brackets") {
        const res = await fetch("/api/admin/content/quote-brackets");
        const data = await res.json();
        if (res.ok) setBracketImages(data);
      } else if (activeTab === "signature-works") {
        const res = await fetch("/api/admin/content/signature-works");
        const data = await res.json();
        if (res.ok) setSignatureWorks(data);
      } else if (activeTab === "works-grid") {
        const res = await fetch("/api/admin/content/works-grid");
        const data = await res.json();
        if (res.ok) setWorksGridItems(data);
      } else if (activeTab === "about-hero") {
        const res = await fetch("/api/content/about-hero");
        const data = await res.json();
        if (res.ok) setAboutHeroData(data);
      } else if (activeTab === "about-quote") {
        const res = await fetch("/api/content/about-quote");
        const data = await res.json();
        if (res.ok) setAboutQuoteData(data);
      } else if (activeTab === "contact") {
        const res = await fetch("/api/content/contact");
        const data = await res.json();
        if (res.ok) setContactData(data);
      }
    } catch (err) {
      showMsg("Failed to load section data", "error");
    } finally {
      setLoading(false);
    }
  };

  // Keep tracking selected file locally without uploading immediately (Prevent Drafts on Server)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFiles(prev => ({ ...prev, [key]: file }));

    // Revoke previous local object URL if exists to avoid memory leak
    if (filePreviews[key] && filePreviews[key].startsWith("blob:")) {
      URL.revokeObjectURL(filePreviews[key]);
    }

    const localUrl = URL.createObjectURL(file);
    setFilePreviews(prev => ({ ...prev, [key]: localUrl }));
  };

  // Perform uploads on submit/save action only
  const uploadPendingFiles = async (keys: string[]): Promise<Record<string, string>> => {
    const uploadedUrls: Record<string, string> = {};
    for (const key of keys) {
      const file = pendingFiles[key];
      if (!file) continue;

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Upload failed for ${key}`);
      }
      uploadedUrls[key] = data.url;
    }

    // Clear successfully uploaded keys from pendingFiles
    setPendingFiles(prev => {
      const next = { ...prev };
      keys.forEach(k => delete next[k]);
      return next;
    });

    return uploadedUrls;
  };

  // --- Hero Actions ---
  const saveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Upload files first if selected
      const urls = await uploadPendingFiles(["hero_base", "hero_hover"]);

      const payload = {
        title: heroData.title,
        base_image: urls.hero_base || heroData.base_image,
        hover_image: urls.hero_hover || heroData.hover_image,
      };

      const res = await fetch("/api/admin/content/hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const d = await res.json();
        setHeroData(d.hero);
        showMsg("Hero section updated successfully");
      } else {
        const d = await res.json();
        showMsg(d.error || "Update failed", "error");
      }
    } catch (err: any) {
      showMsg(err.message || "Failed to save Hero section", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Quote Brackets Actions ---
  const saveBracketImage = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = bracketForm.image_url;
      if (pendingFiles.bracket_img) {
        const urls = await uploadPendingFiles(["bracket_img"]);
        imageUrl = urls.bracket_img;
      }

      if (!imageUrl) {
        showMsg("Please upload an image first", "error");
        setLoading(false);
        return;
      }

      const method = isEditingBracket ? "PATCH" : "POST";
      const payload = isEditingBracket
        ? { id: bracketForm.id, bracket_group: bracketForm.bracket_group, image_url: imageUrl, sort_order: Number(bracketForm.sort_order) }
        : { bracket_group: bracketForm.bracket_group, image_url: imageUrl };

      const res = await fetch("/api/admin/content/quote-brackets", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showMsg(isEditingBracket ? "Bracket image updated" : "Bracket image added");
        setBracketForm({ id: null, bracket_group: 1, image_url: "", sort_order: 0 });
        setIsEditingBracket(false);
        setFilePreviews(prev => {
          const next = { ...prev };
          delete next.bracket_img;
          return next;
        });
        fetchData();
      } else {
        const d = await res.json();
        showMsg(d.error || "Failed to save", "error");
      }
    } catch (err: any) {
      showMsg(err.message || "Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  const editBracketImage = (img: QuoteBracketImage) => {
    setBracketForm({
      id: img.id,
      bracket_group: img.bracket_group,
      image_url: img.image_url,
      sort_order: img.sort_order,
    });
    setFilePreviews(prev => ({ ...prev, bracket_img: img.image_url }));
    setIsEditingBracket(true);

    // Smooth scroll to form
    setTimeout(() => {
      bracketFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const deleteBracketImage = async (id: number) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    try {
      const res = await fetch(`/api/admin/content/quote-brackets?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showMsg("Bracket image deleted");
        fetchData();
      } else {
        showMsg("Failed to delete", "error");
      }
    } catch (err) {
      showMsg("Network error", "error");
    }
  };

  // --- Signature Works Actions ---
  const saveSignatureWork = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = sigForm.image_url;
      if (pendingFiles.sig_img) {
        const urls = await uploadPendingFiles(["sig_img"]);
        imageUrl = urls.sig_img;
      }

      if (!imageUrl) {
        showMsg("Please upload an image first", "error");
        setLoading(false);
        return;
      }

      const method = isEditingSig ? "PATCH" : "POST";
      const payload = isEditingSig ? {
        id: sigForm.id,
        title: sigForm.title,
        description: sigForm.description,
        image_url: imageUrl,
        sort_order: Number(sigForm.sort_order),
      } : {
        title: sigForm.title,
        description: sigForm.description,
        image_url: imageUrl,
        sort_order: Number(sigForm.sort_order),
      };

      const res = await fetch("/api/admin/content/signature-works", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showMsg(isEditingSig ? "Signature work updated" : "Signature work created");
        setSigForm({ id: null, title: "", description: "", image_url: "", sort_order: 0 });
        setIsEditingSig(false);
        setFilePreviews(prev => {
          const next = { ...prev };
          delete next.sig_img;
          return next;
        });
        fetchData();
      } else {
        const d = await res.json();
        showMsg(d.error || "Save failed", "error");
      }
    } catch (err: any) {
      showMsg(err.message || "Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  const editSignatureWork = (work: SignatureWork) => {
    setSigForm({
      id: work.id,
      title: work.title,
      description: work.description,
      image_url: work.image_url,
      sort_order: work.sort_order,
    });
    setFilePreviews(prev => ({ ...prev, sig_img: work.image_url }));
    setIsEditingSig(true);

    // Smooth scroll to form
    setTimeout(() => {
      sigFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const deleteSignatureWork = async (id: number) => {
    if (!confirm("Are you sure you want to delete this work?")) return;
    try {
      const res = await fetch(`/api/admin/content/signature-works?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showMsg("Signature work deleted");
        fetchData();
      } else {
        showMsg("Failed to delete", "error");
      }
    } catch (err) {
      showMsg("Network error", "error");
    }
  };

  // --- Works Grid Actions ---
  const saveWorksGridItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrl = gridForm.image_url;
      if (pendingFiles.grid_img) {
        const urls = await uploadPendingFiles(["grid_img"]);
        imageUrl = urls.grid_img;
      }

      if (!imageUrl) {
        showMsg("Please upload an image first", "error");
        setLoading(false);
        return;
      }

      const method = isEditingGrid ? "PATCH" : "POST";
      const payload = isEditingGrid ? {
        id: gridForm.id,
        title: gridForm.title,
        description: gridForm.description,
        image_url: imageUrl,
        width_class: gridForm.width_class,
        height_class: gridForm.height_class,
        top_class: gridForm.top_class || undefined,
        left_class: gridForm.left_class || undefined,
        z_index: Number(gridForm.z_index),
        ambient_dark: gridForm.ambient_dark,
        ambient_light: gridForm.ambient_light,
      } : {
        title: gridForm.title,
        description: gridForm.description,
        image_url: imageUrl,
        width_class: gridForm.width_class,
        height_class: gridForm.height_class,
        top_class: gridForm.top_class || undefined,
        left_class: gridForm.left_class || undefined,
        z_index: Number(gridForm.z_index),
        ambient_dark: gridForm.ambient_dark,
        ambient_light: gridForm.ambient_light,
      };

      const res = await fetch("/api/admin/content/works-grid", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showMsg(isEditingGrid ? "Works Grid item updated" : "Works Grid item created");
        setGridForm({
          id: null,
          title: "",
          description: "",
          image_url: "",
          width_class: "w-48",
          height_class: "h-64",
          top_class: "",
          left_class: "",
          z_index: 10,
          ambient_dark: "from-emerald-950 to-neutral-950",
          ambient_light: "from-emerald-100 via-white to-white",
        });
        setIsEditingGrid(false);
        setFilePreviews(prev => {
          const next = { ...prev };
          delete next.grid_img;
          return next;
        });
        fetchData();
      } else {
        const d = await res.json();
        showMsg(d.error || "Save failed", "error");
      }
    } catch (err: any) {
      showMsg(err.message || "Network error", "error");
    } finally {
      setLoading(false);
    }
  };

  const editWorksGridItem = (item: WorksGridItem) => {
    setGridForm({
      id: item.id,
      title: item.title,
      description: item.description,
      image_url: item.image_url,
      width_class: item.width_class,
      height_class: item.height_class,
      top_class: item.top_class,
      left_class: item.left_class,
      z_index: item.z_index,
      ambient_dark: item.ambient_dark,
      ambient_light: item.ambient_light,
    });
    setFilePreviews(prev => ({ ...prev, grid_img: item.image_url }));
    setIsEditingGrid(true);

    // Smooth scroll to form
    setTimeout(() => {
      gridFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  const deleteWorksGridItem = async (id: number) => {
    if (!confirm("Are you sure you want to delete this works grid item?")) return;
    try {
      const res = await fetch(`/api/admin/content/works-grid?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showMsg("Works Grid item deleted");
        fetchData();
      } else {
        showMsg("Failed to delete", "error");
      }
    } catch (err) {
      showMsg("Network error", "error");
    }
  };

  // --- About Hero Actions ---
  const saveAboutHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const urls = await uploadPendingFiles([
        "about_base_dark",
        "about_hover_dark",
        "about_base_light",
        "about_hover_light"
      ]);

      const payload = {
        base_image_dark: urls.about_base_dark || aboutHeroData.base_image_dark,
        hover_image_dark: urls.about_hover_dark || aboutHeroData.hover_image_dark,
        base_image_light: urls.about_base_light || aboutHeroData.base_image_light,
        hover_image_light: urls.about_hover_light || aboutHeroData.hover_image_light,
      };

      const res = await fetch("/api/admin/content/about-hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const d = await res.json();
        setAboutHeroData(d.hero);
        showMsg("About Hero section updated");
      } else {
        showMsg("Failed to update", "error");
      }
    } catch (err: any) {
      showMsg(err.message || "Failed to save About Hero", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- About Quote Actions ---
  const saveAboutQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const urls = await uploadPendingFiles([
        "about_quote_one",
        "about_quote_two",
        "about_quote_three"
      ]);

      const payload = {
        one: urls.about_quote_one || aboutQuoteData.one,
        two: urls.about_quote_two || aboutQuoteData.two,
        three: urls.about_quote_three || aboutQuoteData.three,
      };

      const res = await fetch("/api/admin/content/about-quote", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setAboutQuoteData(payload);
        showMsg("About Quote images updated");
      } else {
        showMsg("Failed to update", "error");
      }
    } catch (err: any) {
      showMsg(err.message || "Failed to save About Quote", "error");
    } finally {
      setLoading(false);
    }
  };

  // --- Contact Actions ---
  const saveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const urls = await uploadPendingFiles(["contact_card", "contact_showreel"]);

      const payload = {
        card_image_url: urls.contact_card || contactData.card_image_url,
        showreel_url: urls.contact_showreel || contactData.showreel_url,
      };

      const res = await fetch("/api/admin/content/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const d = await res.json();
        setContactData(d.contact);
        showMsg("Contact content updated");
      } else {
        showMsg("Failed to update", "error");
      }
    } catch (err: any) {
      showMsg(err.message || "Failed to save Contact section", "error");
    } finally {
      setLoading(false);
    }
  };

  // Tab configurations
  const TABS = [
    { key: "hero", label: "Hero" },
    { key: "quote-brackets", label: "Quote Brackets" },
    { key: "signature-works", label: "Signature Works" },
    { key: "works-grid", label: "Works Grid" },
    { key: "about-hero", label: "About Hero" },
    { key: "about-quote", label: "About Quote" },
    { key: "contact", label: "Contact" },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* --- Header --- */}
      <div className="border-b border-gray-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Manage Site Content</h1>
        <p className="text-sm text-gray-500 mt-1">
          Customize and manage dynamic images, video assets, layouts, and copy across the public pages.
        </p>
      </div>

      {/* --- Toast message --- */}
      {message && (
        <div
          className={`fixed bottom-5 left-4 right-4 sm:left-auto sm:right-5 z-[100] px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? <Check className="w-4 h-4 flex-shrink-0" /> : <X className="w-4 h-4 flex-shrink-0" />}
          {message.text}
        </div>
      )}

      {/* --- Tab Navigation --- */}
      <div className="flex overflow-x-auto no-scrollbar gap-1 sm:gap-2 border-b border-gray-200 -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as TabType)}
            className={`flex-shrink-0 whitespace-nowrap px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === tab.key
                ? "border-black text-black"
                : "border-transparent text-gray-500 hover:text-black hover:border-gray-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- Content Area --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
          <span className="text-sm text-gray-500 font-medium">Processing changes...</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm">
          {/* ================================= HERO TAB ================================= */}
          {activeTab === "hero" && (
            <form onSubmit={saveHero} className="space-y-6 max-w-3xl">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Hero Section Content</h2>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Hero Headline Title</label>
                <input
                  type="text"
                  required
                  value={heroData.title}
                  onChange={e => setHeroData({ ...heroData, title: e.target.value })}
                  className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-black ${INPUT_CLASSES}`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Base Image */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">Base Image (Default Background)</label>
                  <div className="relative aspect-video w-full border rounded-xl overflow-hidden bg-gray-50 group flex items-center justify-center">
                    {(filePreviews.hero_base || heroData.base_image) ? (
                      <Image
                        src={filePreviews.hero_base || heroData.base_image}
                        alt="Hero Base Preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileSelect(e, "hero_base")}
                    className="block w-full text-xs text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-black hover:file:bg-gray-200 cursor-pointer"
                  />
                </div>

                {/* Hover Image */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">Hover Image (Reveal Effect)</label>
                  <div className="relative aspect-video w-full border rounded-xl overflow-hidden bg-gray-50 group flex items-center justify-center">
                    {(filePreviews.hero_hover || heroData.hover_image) ? (
                      <Image
                        src={filePreviews.hero_hover || heroData.hover_image}
                        alt="Hero Hover Preview"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileSelect(e, "hero_hover")}
                    className="block w-full text-xs text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-black hover:file:bg-gray-200 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </form>
          )}

          {/* ================================= QUOTE BRACKETS TAB ================================= */}
          {activeTab === "quote-brackets" && (
            <div className="space-y-8">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Quote Section Animation Carousels</h2>

              {/* Add/Edit image form */}
              <form ref={bracketFormRef} onSubmit={saveBracketImage} className="bg-gray-50 p-4 rounded-xl border w-full max-w-xl space-y-4">
                <h3 className="text-sm font-bold text-gray-700">
                  {isEditingBracket ? "Edit Bracket Image" : "Add Image to Bracket Group"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 min-w-0">
                    <label className="block text-xs font-semibold text-gray-600">Bracket Group</label>
                    <select
                      value={bracketForm.bracket_group}
                      onChange={e => setBracketForm({ ...bracketForm, bracket_group: Number(e.target.value) })}
                      className={`w-full border rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-black ${INPUT_CLASSES}`}
                    >
                      <option value={1}>Group 1 (Fast)</option>
                      <option value={2}>Group 2 (Slow)</option>
                      <option value={3}>Group 3 (Ending)</option>
                    </select>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <label className="block text-xs font-semibold text-gray-600">Upload Image File</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileSelect(e, "bracket_img")}
                      className="block w-full text-xs text-gray-700 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-white file:border-gray-300 file:text-xs file:font-semibold hover:file:bg-gray-100 cursor-pointer"
                    />
                  </div>
                </div>

                {isEditingBracket && (
                  <div className="space-y-1 w-full sm:max-w-xs">
                    <label className="block text-xs font-semibold text-gray-600">Sort Order</label>
                    <input
                      type="number"
                      value={bracketForm.sort_order}
                      onChange={e => setBracketForm({ ...bracketForm, sort_order: Number(e.target.value) })}
                      className={`w-full border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-black ${INPUT_CLASSES}`}
                    />
                  </div>
                )}

                {filePreviews.bracket_img && (
                  <div className="relative w-24 h-24 border rounded overflow-hidden bg-white">
                    <Image src={filePreviews.bracket_img} alt="Preview" fill className="object-cover" />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-black text-white px-4 py-2.5 sm:py-2 rounded-lg text-xs font-bold hover:bg-neutral-800 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {isEditingBracket ? "Save Changes" : <><Plus className="w-3.5 h-3.5" /> Add Image</>}
                  </button>
                  {isEditingBracket && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingBracket(false);
                        setBracketForm({ id: null, bracket_group: 1, image_url: "", sort_order: 0 });
                        setFilePreviews(prev => {
                          const next = { ...prev };
                          delete next.bracket_img;
                          return next;
                        });
                      }}
                      className="w-full sm:w-auto border text-gray-600 px-4 py-2.5 sm:py-2 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Group Galleries */}
              {[1, 2, 3].map(groupNum => {
                const groupImages = bracketImages.filter(x => x.bracket_group === groupNum);
                return (
                  <div key={groupNum} className="space-y-3">
                    <h3 className="font-bold text-sm text-gray-800 border-l-2 border-black pl-2">
                      Bracket Group {groupNum} ({groupNum === 2 ? "Slow Carousel" : "Fast Carousel"})
                    </h3>
                    {groupImages.length === 0 ? (
                      <p className="text-xs text-gray-400">No images seeded yet in this group.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                        {groupImages.map(img => (
                          <div key={img.id} className="relative group border rounded-xl overflow-hidden bg-gray-50 aspect-square flex flex-col justify-between shadow-sm">
                            <div className="relative w-full flex-1">
                              <Image src={img.image_url} alt="Bracket visual" fill className="object-cover" />
                            </div>
                            <div className="p-2 bg-white border-t flex items-center justify-between">
                              <span className="text-[10px] text-gray-400 font-mono">Order: {img.sort_order}</span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => editBracketImage(img)}
                                  className="text-blue-600 hover:text-blue-800 p-1 cursor-pointer"
                                  title="Edit"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteBracketImage(img.id)}
                                  className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ================================= SIGNATURE WORKS TAB ================================= */}
          {activeTab === "signature-works" && (
            <div className="space-y-8">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Signature Works Projects</h2>

              {/* Form (Add or Edit) */}
              <form ref={sigFormRef} onSubmit={saveSignatureWork} className="bg-gray-50 p-4 rounded-xl border w-full max-w-xl space-y-4">
                <h3 className="text-sm font-bold text-gray-700">{isEditingSig ? "Edit Project" : "Create New Project"}</h3>
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600">Project Title</label>
                  <input
                    type="text"
                    required
                    value={sigForm.title}
                    onChange={e => setSigForm({ ...sigForm, title: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black ${INPUT_CLASSES}`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600">Project Description</label>
                  <textarea
                    required
                    rows={3}
                    value={sigForm.description}
                    onChange={e => setSigForm({ ...sigForm, description: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black ${INPUT_CLASSES}`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 min-w-0">
                    <label className="block text-xs font-semibold text-gray-600">Upload Image File</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileSelect(e, "sig_img")}
                      className="block w-full text-xs text-gray-700 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-white file:border-gray-300 file:text-xs file:font-semibold hover:file:bg-gray-100 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <label className="block text-xs font-semibold text-gray-600">Display Hierarchy (Sort Order)</label>
                    <input
                      type="number"
                      value={sigForm.sort_order}
                      onChange={e => setSigForm({ ...sigForm, sort_order: Number(e.target.value) })}
                      className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black ${INPUT_CLASSES}`}
                    />
                  </div>
                </div>

                {filePreviews.sig_img && (
                  <div className="relative w-32 aspect-video border rounded overflow-hidden bg-white">
                    <Image src={filePreviews.sig_img} alt="Preview" fill className="object-cover" />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-black text-white px-4 py-2.5 sm:py-2 rounded-lg text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    {isEditingSig ? "Save Changes" : "Create Project"}
                  </button>
                  {isEditingSig && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingSig(false);
                        setSigForm({ id: null, title: "", description: "", image_url: "", sort_order: 0 });
                        setFilePreviews(prev => {
                          const next = { ...prev };
                          delete next.sig_img;
                          return next;
                        });
                      }}
                      className="w-full sm:w-auto border text-gray-600 px-4 py-2.5 sm:py-2 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Projects list — table on desktop, stacked cards on mobile */}
              <div className="hidden md:block border rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b">
                      <th className="px-4 py-3">Thumbnail</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3">Order</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs text-gray-700">
                    {signatureWorks.map(work => (
                      <tr key={work.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="relative w-16 h-10 rounded border overflow-hidden bg-gray-100">
                            <Image src={work.image_url} alt="work" fill className="object-cover" />
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{work.title}</td>
                        <td className="px-4 py-3 max-w-sm truncate text-gray-700">{work.description}</td>
                        <td className="px-4 py-3 text-gray-700">{work.sort_order}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => editSignatureWork(work)}
                            className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => deleteSignatureWork(work.id)}
                            className="text-red-500 hover:text-red-700 inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {signatureWorks.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-gray-400">No projects added yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile stacked cards */}
              <div className="md:hidden space-y-3">
                {signatureWorks.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6 border rounded-xl">No projects added yet.</p>
                )}
                {signatureWorks.map(work => (
                  <div key={work.id} className="border rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="relative w-full aspect-video bg-gray-100">
                      <Image src={work.image_url} alt="work" fill className="object-cover" />
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-sm text-gray-900">{work.title}</h4>
                        <span className="flex-shrink-0 text-[10px] font-mono text-gray-400 bg-gray-50 border rounded px-1.5 py-0.5">
                          Order: {work.sort_order}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{work.description}</p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => editSignatureWork(work)}
                          className="flex-1 justify-center text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 inline-flex items-center gap-1 text-xs font-semibold rounded-lg py-2 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => deleteSignatureWork(work.id)}
                          className="flex-1 justify-center text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 inline-flex items-center gap-1 text-xs font-semibold rounded-lg py-2 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================= WORKS GRID TAB ================================= */}
          {activeTab === "works-grid" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b pb-2 gap-2">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">Works Grid (Interactive Domino Canvas)</h2>
                <WorksGridGuide />
              </div>

              {/* Form (Add or Edit) */}
              <form ref={gridFormRef} onSubmit={saveWorksGridItem} className="bg-gray-50 p-4 rounded-xl border space-y-4">
                <h3 className="text-sm font-bold text-gray-700">{isEditingGrid ? "Edit Works Grid Card" : "Create New Works Grid Card"}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 min-w-0">
                    <label className="block text-xs font-semibold text-gray-600">Card Title</label>
                    <input
                      type="text"
                      required
                      value={gridForm.title}
                      onChange={e => setGridForm({ ...gridForm, title: e.target.value })}
                      className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black ${INPUT_CLASSES}`}
                    />
                  </div>

                  <div className="space-y-2 min-w-0">
                    <label className="block text-xs font-semibold text-gray-600">Upload Image File</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileSelect(e, "grid_img")}
                      className="block w-full text-xs text-gray-700 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-white file:border-gray-300 file:text-xs file:font-semibold hover:file:bg-gray-100 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600">Card Description (Popup copy)</label>
                  <textarea
                    required
                    rows={2}
                    value={gridForm.description}
                    onChange={e => setGridForm({ ...gridForm, description: e.target.value })}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black ${INPUT_CLASSES}`}
                  />
                </div>

                <h4 className="text-xs font-bold text-gray-500 uppercase border-b pb-1 pt-2">Positional coordinates & dimensions</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  <div className="space-y-1 min-w-0">
                    <label className="block text-[10px] font-semibold text-gray-600">Width Class</label>
                    <input
                      type="text"
                      value={gridForm.width_class}
                      onChange={e => setGridForm({ ...gridForm, width_class: e.target.value })}
                      placeholder="e.g. w-48"
                      className={`w-full border rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-black ${INPUT_CLASSES}`}
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <label className="block text-[10px] font-semibold text-gray-600">Height Class</label>
                    <input
                      type="text"
                      value={gridForm.height_class}
                      onChange={e => setGridForm({ ...gridForm, height_class: e.target.value })}
                      placeholder="e.g. h-64"
                      className={`w-full border rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-black ${INPUT_CLASSES}`}
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <label className="block text-[10px] font-semibold text-gray-600">Top Class (Optional)</label>
                    <input
                      type="text"
                      value={gridForm.top_class}
                      onChange={e => setGridForm({ ...gridForm, top_class: e.target.value })}
                      placeholder="e.g. top-[40%]"
                      className={`w-full border rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-black ${INPUT_CLASSES}`}
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <label className="block text-[10px] font-semibold text-gray-600">Left Class (Optional)</label>
                    <input
                      type="text"
                      value={gridForm.left_class}
                      onChange={e => setGridForm({ ...gridForm, left_class: e.target.value })}
                      placeholder="e.g. left-[12%]"
                      className={`w-full border rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-black ${INPUT_CLASSES}`}
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <label className="block text-[10px] font-semibold text-gray-600">Z-Index (Layer)</label>
                    <input
                      type="number"
                      value={gridForm.z_index}
                      onChange={e => setGridForm({ ...gridForm, z_index: Number(e.target.value) })}
                      className={`w-full border rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-black ${INPUT_CLASSES}`}
                    />
                  </div>
                </div>

                <h4 className="text-xs font-bold text-gray-500 uppercase border-b pb-1 pt-2">Hover ambient glow theme colors</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 min-w-0">
                    <label className="block text-[10px] font-semibold text-gray-600">Ambient Glow Dark Theme</label>
                    <input
                      type="text"
                      value={gridForm.ambient_dark}
                      onChange={e => setGridForm({ ...gridForm, ambient_dark: e.target.value })}
                      placeholder="e.g. from-emerald-950 to-neutral-950"
                      className={`w-full border rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-black ${INPUT_CLASSES}`}
                    />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <label className="block text-[10px] font-semibold text-gray-600">Ambient Glow Light Theme</label>
                    <input
                      type="text"
                      value={gridForm.ambient_light}
                      onChange={e => setGridForm({ ...gridForm, ambient_light: e.target.value })}
                      placeholder="e.g. from-emerald-100 via-white to-white"
                      className={`w-full border rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-black ${INPUT_CLASSES}`}
                    />
                  </div>
                </div>

                {filePreviews.grid_img && (
                  <div className="relative w-32 aspect-video border rounded overflow-hidden bg-white">
                    <Image src={filePreviews.grid_img} alt="Preview" fill className="object-cover" />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    className="w-full sm:w-auto bg-black text-white px-4 py-2.5 sm:py-2 rounded-lg text-xs font-bold hover:bg-neutral-800 transition-colors cursor-pointer"
                  >
                    {isEditingGrid ? "Save Changes" : "Create Card"}
                  </button>
                  {isEditingGrid && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingGrid(false);
                        setGridForm({
                          id: null,
                          title: "",
                          description: "",
                          image_url: "",
                          width_class: "w-48",
                          height_class: "h-64",
                          top_class: "",
                          left_class: "",
                          z_index: 10,
                          ambient_dark: "from-emerald-950 to-neutral-950",
                          ambient_light: "from-emerald-100 via-white to-white",
                        });
                        setFilePreviews(prev => {
                          const next = { ...prev };
                          delete next.grid_img;
                          return next;
                        });
                      }}
                      className="w-full sm:w-auto border text-gray-600 px-4 py-2.5 sm:py-2 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>

              {/* Grid Items list — table on desktop, stacked cards on mobile */}
              <div className="hidden md:block border rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b">
                      <th className="px-4 py-3">Thumbnail</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Size Class</th>
                      <th className="px-4 py-3">Top / Left</th>
                      <th className="px-4 py-3">Z-Index</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-xs text-gray-700">
                    {worksGridItems.map(item => (
                      <tr key={item.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3">
                          <div className="relative w-12 h-16 rounded border overflow-hidden bg-gray-100">
                            <Image src={item.image_url} alt="Grid artwork" fill className="object-cover" />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{item.title}</div>
                          <div className="text-[10px] text-gray-400 max-w-[200px] truncate">{item.description}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-[10px] text-gray-700">{item.width_class} x {item.height_class}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-gray-700">{item.top_class} &middot; {item.left_class}</td>
                        <td className="px-4 py-3 text-gray-700">{item.z_index}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => editWorksGridItem(item)}
                            className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => deleteWorksGridItem(item.id)}
                            className="text-red-500 hover:text-red-700 inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {worksGridItems.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-400">No cards in works grid.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile stacked cards */}
              <div className="md:hidden space-y-3">
                {worksGridItems.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-6 border rounded-xl">No cards in works grid.</p>
                )}
                {worksGridItems.map(item => (
                  <div key={item.id} className="border rounded-xl overflow-hidden bg-white shadow-sm">
                    <div className="flex gap-3 p-3">
                      <div className="relative w-16 h-20 flex-shrink-0 rounded-lg border overflow-hidden bg-gray-100">
                        <Image src={item.image_url} alt="Grid artwork" fill className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <h4 className="font-semibold text-sm text-gray-900 truncate">{item.title}</h4>
                        <p className="text-[11px] text-gray-500 line-clamp-2">{item.description}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 px-3 pb-2 text-[10px] font-mono text-gray-600">
                      <div className="bg-gray-50 border rounded px-2 py-1 truncate">
                        <span className="block text-gray-400 font-sans">Size</span>
                        {item.width_class} x {item.height_class}
                      </div>
                      <div className="bg-gray-50 border rounded px-2 py-1 truncate">
                        <span className="block text-gray-400 font-sans">Top/Left</span>
                        {item.top_class || "—"} · {item.left_class || "—"}
                      </div>
                      <div className="bg-gray-50 border rounded px-2 py-1 truncate">
                        <span className="block text-gray-400 font-sans">Z-Index</span>
                        {item.z_index}
                      </div>
                    </div>
                    <div className="flex gap-2 px-3 pb-3 pt-1 border-t">
                      <button
                        onClick={() => editWorksGridItem(item)}
                        className="flex-1 justify-center text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 inline-flex items-center gap-1 text-xs font-semibold rounded-lg py-2 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => deleteWorksGridItem(item.id)}
                        className="flex-1 justify-center text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 inline-flex items-center gap-1 text-xs font-semibold rounded-lg py-2 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================= ABOUT HERO TAB ================================= */}
          {activeTab === "about-hero" && (
            <form onSubmit={saveAboutHero} className="space-y-6 max-w-3xl">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">About Hero Section Photography</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Dark mode set */}
                <div className="bg-gray-50 p-4 rounded-xl border space-y-4">
                  <h3 className="font-bold text-sm text-gray-800 border-l-2 border-black pl-2">Dark Theme Variant</h3>

                  {/* Dark Base */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-700">Grayscale / Normal State</label>
                    <div className="relative aspect-[3/4] w-48 border rounded-lg overflow-hidden bg-white mx-auto">
                      {(filePreviews.about_base_dark || aboutHeroData.base_image_dark) ? (
                        <Image src={filePreviews.about_base_dark || aboutHeroData.base_image_dark} alt="Dark Base Preview" fill className="object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-300"><Upload /></div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileSelect(e, "about_base_dark")}
                      className="block w-full text-xs text-gray-700 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-white file:border-gray-300 file:text-[10px] file:font-semibold hover:file:bg-gray-100 cursor-pointer"
                    />
                  </div>

                  {/* Dark Hover */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-700">Colored / Hover Reveal State</label>
                    <div className="relative aspect-[3/4] w-48 border rounded-lg overflow-hidden bg-white mx-auto">
                      {(filePreviews.about_hover_dark || aboutHeroData.hover_image_dark) ? (
                        <Image src={filePreviews.about_hover_dark || aboutHeroData.hover_image_dark} alt="Dark Hover Preview" fill className="object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-300"><Upload /></div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileSelect(e, "about_hover_dark")}
                      className="block w-full text-xs text-gray-700 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-white file:border-gray-300 file:text-[10px] file:font-semibold hover:file:bg-gray-100 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Light mode set */}
                <div className="bg-gray-50 p-4 rounded-xl border space-y-4">
                  <h3 className="font-bold text-sm text-gray-800 border-l-2 border-black pl-2">Light Theme Variant</h3>

                  {/* Light Base */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-700">Grayscale / Normal State</label>
                    <div className="relative aspect-[3/4] w-48 border rounded-lg overflow-hidden bg-white mx-auto">
                      {(filePreviews.about_base_light || aboutHeroData.base_image_light) ? (
                        <Image src={filePreviews.about_base_light || aboutHeroData.base_image_light} alt="Light Base Preview" fill className="object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-300"><Upload /></div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileSelect(e, "about_base_light")}
                      className="block w-full text-xs text-gray-700 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-white file:border-gray-300 file:text-[10px] file:font-semibold hover:file:bg-gray-100 cursor-pointer"
                    />
                  </div>

                  {/* Light Hover */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-gray-700">Colored / Hover Reveal State</label>
                    <div className="relative aspect-[3/4] w-48 border rounded-lg overflow-hidden bg-white mx-auto">
                      {(filePreviews.about_hover_light || aboutHeroData.hover_image_light) ? (
                        <Image src={filePreviews.about_hover_light || aboutHeroData.hover_image_light} alt="Light Hover Preview" fill className="object-cover" />
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-300"><Upload /></div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleFileSelect(e, "about_hover_light")}
                      className="block w-full text-xs text-gray-700 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-white file:border-gray-300 file:text-[10px] file:font-semibold hover:file:bg-gray-100 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Save About Hero Photography
              </button>
            </form>
          )}

          {/* ================================= ABOUT QUOTE TAB ================================= */}
          {activeTab === "about-quote" && (
            <form onSubmit={saveAboutQuote} className="space-y-6 max-w-3xl">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">About Page Bracket Images</h2>
              <p className="text-xs text-gray-500">
                These three images display statically inside the bracket masks in the About Page typographic quote.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Bracket image 1 */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-gray-700">Bracket One (Row 2)</label>
                  <div className="relative aspect-square w-full border rounded-lg overflow-hidden bg-gray-50 group flex items-center justify-center">
                    {(filePreviews.about_quote_one || aboutQuoteData.one) ? (
                      <Image src={filePreviews.about_quote_one || aboutQuoteData.one} alt="Bracket One Preview" fill className="object-cover" />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileSelect(e, "about_quote_one")}
                    className="block w-full text-xs text-gray-700 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-white file:border-gray-300 file:text-[10px] file:font-semibold hover:file:bg-gray-100 cursor-pointer"
                  />
                </div>

                {/* Bracket image 2 */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-gray-700">Bracket Two (Row 4)</label>
                  <div className="relative aspect-square w-full border rounded-lg overflow-hidden bg-gray-50 group flex items-center justify-center">
                    {(filePreviews.about_quote_two || aboutQuoteData.two) ? (
                      <Image src={filePreviews.about_quote_two || aboutQuoteData.two} alt="Bracket Two Preview" fill className="object-cover" />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileSelect(e, "about_quote_two")}
                    className="block w-full text-xs text-gray-700 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-white file:border-gray-300 file:text-[10px] file:font-semibold hover:file:bg-gray-100 cursor-pointer"
                  />
                </div>

                {/* Bracket image 3 */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-gray-700">Bracket Three (Row 5)</label>
                  <div className="relative aspect-square w-full border rounded-lg overflow-hidden bg-gray-50 group flex items-center justify-center">
                    {(filePreviews.about_quote_three || aboutQuoteData.three) ? (
                      <Image src={filePreviews.about_quote_three || aboutQuoteData.three} alt="Bracket Three Preview" fill className="object-cover" />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileSelect(e, "about_quote_three")}
                    className="block w-full text-xs text-gray-700 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-white file:border-gray-300 file:text-[10px] file:font-semibold hover:file:bg-gray-100 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Save Bracket Images
              </button>
            </form>
          )}

          {/* ================================= CONTACT TAB ================================= */}
          {activeTab === "contact" && (
            <form onSubmit={saveContact} className="space-y-6 max-w-3xl">
              <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Contact Section Media Assets</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Card Image */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">Contact Card Display Image</label>
                  <div className="relative aspect-[3/4] w-48 border rounded-lg overflow-hidden bg-gray-50 group flex items-center justify-center mx-auto">
                    {(filePreviews.contact_card || contactData.card_image_url) ? (
                      <Image src={filePreviews.contact_card || contactData.card_image_url} alt="Contact Card Preview" fill className="object-cover" />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleFileSelect(e, "contact_card")}
                    className="block w-full text-xs text-gray-700 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-white file:border-gray-300 file:text-xs file:font-semibold hover:file:bg-gray-100 cursor-pointer"
                  />
                </div>

                {/* Showreel Video */}
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">Showreel Video Asset (.mp4)</label>
                  <div className="relative aspect-video w-full border rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                    {(filePreviews.contact_showreel || contactData.showreel_url) ? (
                      <video
                        src={filePreviews.contact_showreel || contactData.showreel_url}
                        controls
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-300" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="video/mp4"
                    onChange={e => handleFileSelect(e, "contact_showreel")}
                    className="block w-full text-xs text-gray-700 file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:bg-white file:border-gray-300 file:text-xs file:font-semibold hover:file:bg-gray-100 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="bg-black text-white px-6 py-2.5 rounded-xl text-sm font-semibold shadow hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Save Contact Assets
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Works Grid: inline collapsible guide ────────────────────────────────────

function WorksGridGuide() {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors border border-gray-200 rounded-full px-3 py-1 hover:border-gray-400 cursor-pointer select-none whitespace-nowrap"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 16v-4m0-4h.01" />
        </svg>
        <span className="hidden sm:inline">How to use</span>
      </button>

      {open && (
        <>
          {/* Backdrop on mobile to allow tap-outside-to-close and prevent layout jank */}
          <div
            className="fixed inset-0 z-40 sm:hidden bg-black/20"
            onClick={() => setOpen(false)}
          />
          <div
            className="
              fixed left-4 right-4 top-1/2 -translate-y-1/2 z-50 max-h-[85vh] overflow-y-auto
              sm:absolute sm:left-auto sm:right-0 sm:top-8 sm:translate-y-0 sm:max-h-none sm:overflow-visible sm:w-80
              bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-xs text-gray-600 space-y-3
            "
          >
            {/* Close */}
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-gray-800 text-sm">Works Grid — How it works</p>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* What it is */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1 border border-gray-100">
              <p className="font-semibold text-gray-700">What is the Works Grid?</p>
              <p className="leading-relaxed text-gray-500">
                It's the overlapping image canvas on the <span className="font-medium text-gray-700">/works</span> page.
                Each card is placed at a fixed position on a large freeform canvas — images overlap each other like a collage.
                Visitors can click any image to open a detail view.
              </p>
            </div>

            {/* Field guide */}
            <div className="space-y-2">
              <p className="font-semibold text-gray-700">Field Guide</p>

              <div className="space-y-1.5">
                <GuideRow
                  label="Width / Height Class"
                  desc='Tailwind size classes like "w-48" or "h-64". Controls how big the card appears on canvas. Larger = more dominant.'
                  code="w-48 · h-64"
                />
                <GuideRow
                  label="Top / Left Class"
                  desc='Where the card sits on the canvas. Use percentages for flexibility — e.g. "top-[40%]" means 40% from the top of the canvas.'
                  code="top-[40%] · left-[20%]"
                />
                <GuideRow
                  label="Z-Index (Layer)"
                  desc="Controls which cards appear on top when images overlap. Higher number = closer to the viewer. Use values between 10–100. No two cards should share the same value."
                  code="e.g. 50 = in front · 10 = behind"
                />
                <GuideRow
                  label="Ambient Glow"
                  desc='Background gradient shown on mobile when this card is active. Use Tailwind gradient classes. Dark for dark mode, Light for light mode.'
                  code="from-emerald-950 to-neutral-950"
                />
              </div>
            </div>

            {/* Tips */}
            <div className="border-t border-gray-100 pt-2 space-y-1 text-[11px] text-gray-400">
              <p className="font-semibold text-gray-500 text-xs">Tips</p>
              <p>• Keep z-index values unique and spread out (e.g. 10, 20, 30…) so editing is easy later.</p>
              <p>• The card order in the list below determines the animation sequence on page load.</p>
              <p>• Images look best at portrait ratio — taller than wide.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function GuideRow({ label, desc, code }: { label: string; desc: string; code: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2.5 space-y-0.5">
      <p className="font-semibold text-gray-700">{label}</p>
      <p className="text-gray-400 leading-relaxed">{desc}</p>
      <p className="font-mono text-[10px] text-gray-500 bg-white border border-gray-100 rounded px-1.5 py-0.5 inline-block mt-0.5">{code}</p>
    </div>
  );
}