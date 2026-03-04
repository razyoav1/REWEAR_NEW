import { Search as SearchIcon, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function Search() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-bold tracking-tight mb-4">Search</h1>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Brand, item, keyword…" className="pl-9" />
          </div>
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 px-5 pb-5 overflow-x-auto">
        {["All", "Tops", "Bottoms", "Dresses", "Shoes", "Accessories", "Kids"].map((cat, i) => (
          <Badge key={cat} variant={i === 0 ? "pink" : "outline"} className="whitespace-nowrap cursor-pointer py-1.5 px-3">
            {cat}
          </Badge>
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 gap-3 px-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="aspect-[3/4] rounded-2xl" />
            <Skeleton className="h-4 w-3/4 rounded-lg" />
            <Skeleton className="h-4 w-1/2 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
