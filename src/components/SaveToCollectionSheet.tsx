import { useState, useEffect } from "react";
import { Loader2, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Collection {
  id: string;
  name: string;
}

interface SaveToCollectionSheetProps {
  open: boolean;
  listing: { id: string; title: string } | null;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}

export function SaveToCollectionSheet({ open, listing, userId, onClose, onSaved }: SaveToCollectionSheetProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    // Fetch all collections the user belongs to (owned + invited)
    supabase
      .from("wishlist_members")
      .select("wishlist_id")
      .eq("user_id", userId)
      .then(async ({ data: memberRows }) => {
        const wishlistIds = (memberRows ?? []).map((r: { wishlist_id: string }) => r.wishlist_id);
        if (!wishlistIds.length) { setCollections([]); setSelectedId(null); setLoading(false); return; }
        const { data } = await supabase
          .from("wishlists")
          .select("id, name")
          .in("id", wishlistIds)
          .order("created_at", { ascending: true });
        const cols = data ?? [];
        setCollections(cols);
        const saved = cols.find(c => c.name === "Saved");
        setSelectedId(saved?.id ?? cols[0]?.id ?? null);
        setLoading(false);
      });
  }, [open, userId]);

  async function handleSave() {
    if (!listing) return;
    setSaving(true);

    let targetId = selectedId;

    if (!targetId) {
      const { data, error } = await supabase
        .from("wishlists")
        .insert({ name: "Saved", user_id: userId, created_by_user_id: userId })
        .select("id")
        .single();
      if (error || !data) {
        toast.error("Couldn't create collection");
        setSaving(false);
        return;
      }
      targetId = data.id;
    }

    const { error } = await supabase.from("wishlist_items").upsert(
      { wishlist_id: targetId, listing_id: listing.id, added_by_user_id: userId, user_id: userId },
      { onConflict: "user_id,listing_id" }
    );

    if (error) {
      toast.error("Couldn't save item");
    } else {
      const colName = collections.find(c => c.id === targetId)?.name ?? "Saved";
      toast.success(`Saved to "${colName}"!`, { description: listing.title });
      onSaved();
      handleClose();
    }
    setSaving(false);
  }

  async function createCollection() {
    if (!newName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase
      .from("wishlists")
      .insert({ name: newName.trim(), user_id: userId, created_by_user_id: userId })
      .select("id")
      .single();
    if (error) {
      toast.error("Failed to create collection");
    } else {
      const newCol = { id: data.id, name: newName.trim() };
      setCollections(prev => [...prev, newCol]);
      setSelectedId(data.id);
      setNewName("");
      setShowNew(false);
    }
    setCreating(false);
  }

  function handleClose() {
    onClose();
    setShowNew(false);
    setNewName("");
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && handleClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Save to collection</DialogTitle>
          {listing && <p className="text-sm text-muted-foreground truncate mt-0.5">{listing.title}</p>}
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {collections.map(col => (
              <button key={col.id} onClick={() => setSelectedId(col.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  selectedId === col.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:border-primary/30"
                }`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                  selectedId === col.id ? "border-primary bg-primary" : "border-muted-foreground"
                }`}>
                  {selectedId === col.id && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className="font-medium text-sm">{col.name}</span>
              </button>
            ))}

            {showNew ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Collection name…"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createCollection()}
                  autoFocus
                  className="flex-1 h-9 text-sm"
                />
                <Button size="sm" onClick={createCollection} disabled={!newName.trim() || creating} className="h-9">
                  {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowNew(false); setNewName(""); }} className="h-9 px-2">
                  Cancel
                </Button>
              </div>
            ) : (
              <button onClick={() => setShowNew(true)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-all text-left">
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">New collection</span>
              </button>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Button variant="outline" className="flex-1" onClick={handleClose}>Cancel</Button>
          <Button className="flex-1" disabled={saving || loading} onClick={handleSave}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
