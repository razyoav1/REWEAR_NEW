import { useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Camera, X, ChevronRight, Loader2, RotateCcw, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { CATEGORIES, GENDERS, type ClothingCategory, type ClothingGender, type ListingCondition } from "@/types";
import { cn, getCurrencySymbol, formatPrice } from "@/lib/utils";


const COMMON_COLORS = ["Black", "White", "Grey", "Brown", "Beige", "Blue", "Navy", "Red", "Pink", "Green", "Yellow", "Orange", "Purple", "Multicolor"];

const STEPS = ["Photos", "Details", "Price", "Preview"];

// Unified photo type — either an already-uploaded URL or a new local file
type PhotoEntry =
  | { kind: "existing"; url: string }
  | { kind: "new"; file: File; preview: string };

function getPreview(p: PhotoEntry): string {
  return p.kind === "existing" ? p.url : p.preview;
}

interface DraftData {
  title: string;
  category: ClothingCategory | "";
  brand: string;
  condition: ListingCondition | "";
  size: string;
  colors: string[];
  description: string;
  price: string;
  priceFlexible: boolean | null;
  gender: ClothingGender | "";
}

function loadDraft(key: string): DraftData | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function loadDraftPhotos(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function dataUrlToPhotoEntry(dataUrl: string, index: number): PhotoEntry {
  const arr = dataUrl.split(",");
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) return { kind: "new" as const, file: new File([], `photo-${index}.jpg`), preview: dataUrl };
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  const u8 = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
  const file = new File([u8], `draft-photo-${index}.jpg`, { type: mime });
  return { kind: "new", file, preview: dataUrl };
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, b64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)![1];
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

async function compressToDataUrl(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX = 800;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.65));
    };
    img.src = src;
  });
}

export default function CreateListing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const { user, profile } = useAuth();
  const { t, isRTL } = useLanguage();

  const CONDITIONS: { value: ListingCondition; label: string; desc: string }[] = [
    { value: "new_with_tags", label: "New with tags", desc: t.condNewWithTagsDesc },
    { value: "like_new", label: "Like new", desc: t.condLikeNewDesc },
    { value: "good", label: "Good", desc: t.condGoodDesc },
    { value: "fair", label: "Fair", desc: t.condFairDesc },
  ];

  // User-scoped draft keys so different users never share drafts
  const draftKey = `rewear_create_draft_${user?.id ?? ""}`;
  const draftPhotosKey = `rewear_create_draft_photos_${user?.id ?? ""}`;

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(isEditMode);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showDraftBanner, setShowDraftBanner] = useState(() =>
    !isEditMode && (!!loadDraft(draftKey) || loadDraftPhotos(draftPhotosKey).length > 0)
  );

  // Form state
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ClothingCategory | "">("");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState<ListingCondition | "">("");
  const [size, setSize] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const [priceFlexible, setPriceFlexible] = useState<boolean | null>(null);
  const [gender, setGender] = useState<ClothingGender | "">("");
  const [validationError, setValidationError] = useState("");

  const [processingPhotos, setProcessingPhotos] = useState(false);

  // Drag-and-drop state (mouse + touch)
  const dragIndexRef = useRef<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  // Skip the first effect run so we don't delete saved draft photos on mount
  const photoEffectInitialized = useRef(false);

  // Load existing listing in edit mode
  useEffect(() => {
    if (!editId) return;
    async function loadListing() {
      const { data, error } = await supabase
        .from("clothing_listings")
        .select("*")
        .eq("id", editId)
        .single();
      if (error || !data) {
        toast.error("Failed to load listing");
        navigate(-1);
        return;
      }
      // Ownership check — prevent loading another user's listing into the edit form
      if (data.seller_id !== user?.id) {
        toast.error("You can only edit your own listings");
        navigate(-1);
        return;
      }
      setTitle(data.title ?? "");
      setCategory((data.category as ClothingCategory) ?? "");
      setBrand(data.brand ?? "");
      setCondition((data.condition as ListingCondition) ?? "");
      setSize(data.size_value ?? "");
      setColors(data.colors ?? []);
      setDescription(data.description ?? "");
      setPrice(String(data.price ?? ""));
      setPriceFlexible(data.price_flexible ?? null);
      setGender((data.gender as ClothingGender) ?? "");
      const existingPhotos: PhotoEntry[] = (data.photos ?? []).map((url: string) => ({
        kind: "existing" as const,
        url,
      }));
      setPhotos(existingPhotos);
      setLoadingEdit(false);
    }
    loadListing();
  }, [editId, navigate]);

  // Auto-save text fields (create mode only)
  useEffect(() => {
    if (isEditMode) return;
    const draft: DraftData = { title, category, brand, condition, size, colors, description, price, priceFlexible, gender };
    const hasContent = title || category || brand || condition || size || colors.length || description || price;
    if (hasContent) localStorage.setItem(draftKey, JSON.stringify(draft));
  }, [isEditMode, draftKey, title, category, brand, condition, size, colors, description, price, priceFlexible, gender]);

  // Auto-save photos as data URLs (create mode only)
  // Skip the very first run to avoid deleting draft photos before user can restore them
  useEffect(() => {
    if (isEditMode) return;
    if (!photoEffectInitialized.current) { photoEffectInitialized.current = true; return; }
    const newPhotos = photos.filter(p => p.kind === "new") as { kind: "new"; file: File; preview: string }[];
    if (newPhotos.length === 0) { localStorage.removeItem(draftPhotosKey); return; }
    try {
      localStorage.setItem(draftPhotosKey, JSON.stringify(newPhotos.map(p => p.preview)));
    } catch { /* quota exceeded, skip */ }
  }, [isEditMode, draftPhotosKey, photos]);

  function restoreDraft() {
    const draft = loadDraft(draftKey);
    const savedPhotos = loadDraftPhotos(draftPhotosKey);
    if (!draft && savedPhotos.length === 0) return;
    if (draft) {
      setTitle(draft.title);
      setCategory(draft.category);
      setBrand(draft.brand);
      setCondition(draft.condition);
      setSize(draft.size);
      setColors(draft.colors);
      setDescription(draft.description);
      setPrice(draft.price);
      setPriceFlexible(draft.priceFlexible ?? null);
      setGender((draft.gender as ClothingGender) ?? "");
    }
    if (savedPhotos.length > 0) setPhotos(savedPhotos.map(dataUrlToPhotoEntry));
    setShowDraftBanner(false);
    setStep(savedPhotos.length > 0 ? 1 : 0);
    toast("Draft restored");
  }

  function discardDraft() {
    localStorage.removeItem(draftKey);
    localStorage.removeItem(draftPhotosKey);
    setShowDraftBanner(false);
  }

  function clearDraft() {
    localStorage.removeItem(draftKey);
    localStorage.removeItem(draftPhotosKey);
  }

  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif"];
  const MAX_FILE_SIZE_MB = 30;

  async function addPhotos(files: FileList | null) {
    if (!files) return;
    setProcessingPhotos(true);
    const allFiles = Array.from(files);
    // Validate MIME type and size before processing
    for (const file of allFiles) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast.error(`"${file.name}" is not a supported image type`);
        setProcessingPhotos(false);
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast.error(`"${file.name}" exceeds the ${MAX_FILE_SIZE_MB}MB size limit`);
        setProcessingPhotos(false);
        return;
      }
    }
    const newFiles = allFiles.slice(0, 8 - photos.length);
    const newEntries: PhotoEntry[] = await Promise.all(
      newFiles.map(async (file) => {
        const dataUrl = await new Promise<string>(resolve => {
          const reader = new FileReader();
          reader.onload = e => resolve(e.target!.result as string);
          reader.readAsDataURL(file);
        });
        const compressed = await compressToDataUrl(dataUrl);
        return { kind: "new" as const, file, preview: compressed };
      })
    );
    setPhotos(prev => [...prev, ...newEntries]);
    setProcessingPhotos(false);
  }

  function removePhoto(index: number) {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  }

  // Shared reorder logic
  function reorder(from: number, to: number) {
    if (from === to) return;
    setPhotos(prev => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  // Mouse drag handlers
  function handleDragStart(i: number) {
    dragIndexRef.current = i;
    dragOverIndexRef.current = i;
    setDragOverIndex(i);
  }

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    dragOverIndexRef.current = i;
    setDragOverIndex(i);
  }

  function handleDragEnd() {
    reorder(dragIndexRef.current!, dragOverIndexRef.current!);
    dragIndexRef.current = null;
    dragOverIndexRef.current = null;
    setDragOverIndex(null);
  }

  // Touch drag handlers
  function handleTouchStart(_e: React.TouchEvent, i: number) {
    dragIndexRef.current = i;
    setDragOverIndex(i);
  }

  function handleTouchMove(e: React.TouchEvent) {
    e.preventDefault();
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const cell = el?.closest("[data-photo-index]");
    if (cell) {
      const idx = parseInt(cell.getAttribute("data-photo-index")!);
      if (!isNaN(idx)) {
        dragOverIndexRef.current = idx;
        setDragOverIndex(idx);
      }
    }
  }

  function handleTouchEnd() {
    if (dragIndexRef.current !== null && dragOverIndexRef.current !== null) {
      reorder(dragIndexRef.current, dragOverIndexRef.current);
    }
    dragIndexRef.current = null;
    dragOverIndexRef.current = null;
    setDragOverIndex(null);
  }

  function toggleColor(color: string) {
    setColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  }

  // Clear validation error whenever the step changes
  useEffect(() => {
    setValidationError("");
  }, [step]);

  function validateStep0(): string {
    if (photos.length === 0) return t.validationMissingPhoto;
    return "";
  }

  function validateStep1(): string {
    const missing: string[] = [];
    if (!title.trim()) missing.push(t.titleField.replace(" *", ""));
    if (!category) missing.push(t.categoryField.replace(" *", ""));
    if (!condition) missing.push(t.conditionField.replace(" *", ""));
    if (!gender) missing.push(t.genderField);
    if (missing.length > 0) return `${t.validationPleaseFillin} ${missing.join(", ")}`;
    return "";
  }

  function validateStep2(): string {
    const missing: string[] = [];
    if (!price || parseFloat(price) <= 0) missing.push(t.priceField.replace(" *", ""));
    if (priceFlexible === null) missing.push(t.priceFlexibilityField);
    if (missing.length > 0) return `${t.validationPleaseFillin} ${missing.join(", ")}`;
    return "";
  }

  async function handleSubmit() {
    if (!user) return;
    setSubmitting(true);
    try {
      // Upload only new photos; reuse existing URLs
      const photoUrls: string[] = [];
      for (const photo of photos) {
        if (photo.kind === "existing") {
          photoUrls.push(photo.url);
        } else {
          // Upload the compressed preview (data URL → blob) instead of the original file
          const blob = dataUrlToBlob(photo.preview);
          const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
          const { error: uploadErr } = await supabase.storage
            .from("listing-photos")
            .upload(path, blob, { cacheControl: "3600", contentType: "image/jpeg" });
          if (uploadErr) throw uploadErr;
          const { data: { publicUrl } } = supabase.storage.from("listing-photos").getPublicUrl(path);
          photoUrls.push(publicUrl);
        }
      }

      const listingData = {
        title: title.trim(),
        description: description.trim() || "",
        category,
        brand: brand.trim() || null,
        condition,
        size_value: size.trim() || null,
        colors,
        price: parseFloat(price),
        currency: profile?.currency ?? "USD",
        photos: photoUrls,
        gender: gender || "unisex",
        price_flexible: priceFlexible ?? false,
      };

      if (isEditMode) {
        const { error } = await supabase
          .from("clothing_listings")
          .update(listingData)
          .eq("id", editId);
        if (error) throw error;
        toast.success(t.listingUpdated);
        navigate("/profile");
      } else {
        const { error } = await supabase.from("clothing_listings").insert({
          ...listingData,
          seller_id: user.id,
          location_lat: profile?.location_lat ?? null,
          location_lng: profile?.location_lng ?? null,
          status: "available",
        });
        if (error) throw error;
        clearDraft();
        toast.success(t.listingPublished);
        navigate("/profile");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  // Block suspended / banned users from creating listings
  const accountStatus = profile?.account_status;
  if (!isEditMode && (accountStatus === "suspended" || accountStatus === "banned")) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-bold">
          {accountStatus === "banned" ? "Account banned" : "Account suspended"}
        </p>
        <p className="text-sm text-muted-foreground">
          {accountStatus === "banned"
            ? "Your account has been permanently banned. You cannot create listings."
            : "Your account is suspended. You cannot create listings at this time."}
        </p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm font-semibold underline">Go back</button>
      </div>
    );
  }

  if (loadingEdit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-4 border-b border-border">
        <button onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
          {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
        </button>
        <div className="flex-1">
          <h1 className="font-bold text-lg">{isEditMode ? t.editListing : t.sellAnItem}</h1>
          <p className="text-xs text-muted-foreground">{STEPS[step]}</p>
        </div>
        <span className="text-xs text-muted-foreground font-medium">{step + 1}/{STEPS.length}</span>
      </div>

      {/* Progress */}
      <div className="flex gap-1 px-5 pt-3">
        {STEPS.map((_, i) => (
          <div key={i} className={cn("flex-1 h-1 rounded-full transition-all duration-500", i <= step ? "bg-primary" : "bg-muted")} />
        ))}
      </div>

      {/* Draft restore banner (create mode only) */}
      {showDraftBanner && !isEditMode && (
        <div className="mx-5 mt-3 flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/10 border border-primary/30">
          <RotateCcw className="w-4 h-4 text-primary shrink-0" />
          <p className="flex-1 text-sm font-medium text-primary">{t.hasSavedDraft}</p>
          <button onClick={discardDraft} className="text-xs text-muted-foreground hover:text-foreground transition-colors">{t.discard}</button>
          <button onClick={restoreDraft} className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">{t.resumeDraft}</button>
        </div>
      )}

      {/* Steps */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* Step 0: Photos */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="p-5 space-y-4">
              <div>
                <h2 className="text-xl font-bold">{t.addPhotos}</h2>
                <p className="text-muted-foreground text-sm mt-1">{t.photosHint}</p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {photos.map((p, i) => (
                  <div
                    key={i}
                    data-photo-index={i}
                    draggable
                    onDragStart={() => handleDragStart(i)}
                    onDragOver={e => handleDragOver(e, i)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={e => handleTouchStart(e, i)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{ touchAction: "none" }}
                    className={cn(
                      "relative aspect-square rounded-xl overflow-hidden bg-muted cursor-grab active:cursor-grabbing transition-opacity",
                      dragOverIndex === i && dragIndexRef.current !== i ? "opacity-50" : "opacity-100"
                    )}
                  >
                    <img src={getPreview(p)} alt="" className="w-full h-full object-cover pointer-events-none" />
                    {i === 0 && (
                      <span className="absolute top-1 left-1 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-bold">{t.coverLabel}</span>
                    )}
                    <button onClick={() => removePhoto(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </button>
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-white/60">
                      <GripVertical className="w-3 h-3" />
                    </div>
                  </div>
                ))}
                {photos.length < 8 && !processingPhotos && (
                  <>
                    <button onClick={() => cameraInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                      <Camera className="w-6 h-6" />
                      <span className="text-xs font-medium">{t.takePhoto}</span>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                      <span className="text-2xl">🖼️</span>
                      <span className="text-xs font-medium">{t.addPhoto}</span>
                    </button>
                  </>
                )}
                {processingPhotos && (
                  <div className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground">
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span className="text-xs font-medium">{t.loading}</span>
                  </div>
                )}
              </div>

              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                onChange={e => { addPhotos(e.target.files); e.target.value = ""; }} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={e => { addPhotos(e.target.files); e.target.value = ""; }} />

              {validationError && (
                <p className="text-destructive text-sm font-medium text-center">{validationError}</p>
              )}
              <Button size="xl" className="w-full mt-4" disabled={processingPhotos} onClick={() => {
                const err = validateStep0();
                if (err) { setValidationError(err); return; }
                setValidationError("");
                setStep(1);
              }}>
                {t.continue} <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
              {!isEditMode && (
                <Button variant="ghost" className="w-full" onClick={() => setStep(1)}>
                  {t.skipPhotosForNow}
                </Button>
              )}
            </motion.div>
          )}

          {/* Step 1: Details */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="p-5 space-y-5 pb-10">
              <h2 className="text-xl font-bold">{t.itemDetails}</h2>

              <div className="space-y-1.5">
                <Label>{t.titleField}</Label>
                <Input placeholder={t.titlePlaceholder} value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div className="space-y-1.5">
                <Label>{t.genderField} <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-3 gap-2">
                  {GENDERS.filter(g => g.value !== "all").map(g => (
                    <button key={g.value} onClick={() => setGender(g.value as ClothingGender)}
                      className={cn("p-3 rounded-2xl border-2 text-center transition-all",
                        gender === g.value ? "border-primary bg-primary/10" : "border-border hover:border-border/80")}>
                      <p className="font-bold text-sm">{({ women: t.genderWomens, men: t.genderMens, unisex: t.genderUnisex } as Record<string, string>)[g.value] ?? g.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t.categoryField}</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <Badge key={cat} variant={category === cat ? "pink" : "outline"}
                      className="cursor-pointer py-1.5 px-3" onClick={() => setCategory(cat)}>
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t.conditionField}</Label>
                <div className="space-y-2">
                  {CONDITIONS.map(c => (
                    <button key={c.value} onClick={() => setCondition(c.value)}
                      className={cn("w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                        condition === c.value ? "border-primary bg-primary/10" : "border-border hover:border-border/80")}>
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                        condition === c.value ? "border-primary" : "border-muted-foreground")}>
                        {condition === c.value && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{c.label}</p>
                        <p className="text-xs text-muted-foreground">{c.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <Label>{t.brandField}</Label>
                  <Input placeholder={t.brandPlaceholder} value={brand} onChange={e => setBrand(e.target.value)} />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label>{t.sizeField}</Label>
                  <Input placeholder={t.sizePlaceholder} value={size} onChange={e => setSize(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t.colorsField}</Label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_COLORS.map(c => (
                    <Badge key={c} variant={colors.includes(c) ? "pink" : "outline"}
                      className="cursor-pointer py-1 px-2.5" onClick={() => toggleColor(c)}>
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>{t.descriptionField}</Label>
                <textarea
                  placeholder={t.descriptionPlaceholder}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              {validationError && (
                <p className="text-destructive text-sm font-medium text-center">{validationError}</p>
              )}
              <Button size="xl" className="w-full" onClick={() => {
                const err = validateStep1();
                if (err) { setValidationError(err); return; }
                setValidationError("");
                setStep(2);
              }}>
                {t.continue} <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Price */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="p-5 space-y-5">
              <h2 className="text-xl font-bold">{t.setYourPrice}</h2>

              <div className="space-y-1.5">
                <Label>{t.priceFlexibilityField} <span className="text-destructive">*</span></Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPriceFlexible(false)}
                    className={cn(
                      "p-4 rounded-2xl border-2 text-center transition-all",
                      priceFlexible === false ? "border-primary bg-primary/10" : "border-border hover:border-border/80"
                    )}
                  >
                    <p className="font-bold text-sm">{t.priceFixed}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.priceFixedDesc}</p>
                  </button>
                  <button
                    onClick={() => setPriceFlexible(true)}
                    className={cn(
                      "p-4 rounded-2xl border-2 text-center transition-all",
                      priceFlexible === true ? "border-primary bg-primary/10" : "border-border hover:border-border/80"
                    )}
                  >
                    <p className="font-bold text-sm">{t.priceFlexibleOption}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.priceFlexibleDesc}</p>
                  </button>
                </div>
              </div>

              {(() => {
                const sym = getCurrencySymbol(profile?.currency ?? "USD");
                return (
                  <div className="space-y-1.5">
                    <Label>{t.priceField}</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">{sym}</span>
                      <Input type="number" min="0" step="0.01" placeholder="0.00"
                        value={price} onChange={e => setPrice(e.target.value)}
                        className={`${sym.length > 1 ? "pl-10" : "pl-7"} text-lg font-bold`} />
                    </div>
                  </div>
                );
              })()}

              {validationError && (
                <p className="text-destructive text-sm font-medium text-center">{validationError}</p>
              )}
              <Button size="xl" className="w-full" onClick={() => {
                const err = validateStep2();
                if (err) { setValidationError(err); return; }
                setValidationError("");
                setStep(3);
              }}>
                {t.previewListing} <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </motion.div>
          )}

          {/* Step 3: Preview + Publish */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
              className="p-5 space-y-5 pb-10">
              <h2 className="text-xl font-bold">{t.reviewListing}</h2>

              {/* Photo */}
              {photos[0] && (
                <div className="rounded-2xl overflow-hidden aspect-square bg-muted">
                  <img src={getPreview(photos[0])} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Details card */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-xl leading-tight">{title}</p>
                    {brand && <p className="text-muted-foreground text-sm mt-0.5">{brand}</p>}
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <p className="text-2xl font-black gradient-text">{formatPrice(parseFloat(price || "0"), profile?.currency ?? "USD")}</p>
                    {priceFlexible && <span className="text-xs text-muted-foreground">{t.priceFlexiblePreview}</span>}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {[category, condition && CONDITIONS.find(c => c.value === condition)?.label, size && `${t.sizeLabel} ${size}`].filter(Boolean).join(" · ")}
                </p>
                {colors.length > 0 && (
                  <p className="text-sm text-muted-foreground">{colors.join(", ")}</p>
                )}
                {description && (
                  <p className="text-sm leading-relaxed">{description}</p>
                )}
              </div>

              <Button size="xl" className="w-full" disabled={submitting} onClick={handleSubmit}>
                {submitting
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> {isEditMode ? t.saving : t.publishing}</>
                  : isEditMode ? t.saveChanges : t.publishListing
                }
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
