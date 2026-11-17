import { useState } from "react";

import type { TourPackage } from "@/lib/types";

export default function PackageForm({ pkg, onSave, onCancel }: { pkg?: TourPackage; onSave: (p: Omit<TourPackage, "id" | "createdAt">) => void; onCancel: () => void }) {
  const [name, setName] = useState(pkg?.name || "");
  const [destination, setDestination] = useState(pkg?.destination || "");
  const [duration, setDuration] = useState(pkg?.duration || "");
  const [price, setPrice] = useState(pkg?.price?.toString() || "");
  const [originalPrice, setOriginalPrice] = useState(pkg?.originalPrice?.toString() || "");
  const [image, setImage] = useState(pkg?.image || "/images/package.jpg");
  const [description, setDescription] = useState(pkg?.description || "");
  const [highlightsStr, setHighlightsStr] = useState(pkg?.highlights?.join("\n") || "");
  const [itineraryStr, setItineraryStr] = useState(pkg?.itinerary?.join("\n") || "");
  const [inclusionsStr, setInclusionsStr] = useState(pkg?.inclusions?.join("\n") || "");
  const [category, setCategory] = useState<TourPackage["category"]>(pkg?.category || "spiritual");
  const [hidden, setHidden] = useState(pkg?.hidden ?? false);

  return (
    <div>
      <h3 style={{ margin: "0 0 16px", fontWeight: 600, color: "#E67E22" }}>{pkg ? "Edit Package" : "New Package"}</h3>
      <div className="adm-form">
        <div><label>Name *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Varanasi Spiritual Tour" /></div>
        <div><label>Destination</label><input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Varanasi, UP" /></div>
        <div><label>Duration</label><input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 3 Days / 2 Nights" /></div>
        <div><label>Price (INR) *</label><input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 12999" /></div>
        <div><label>Original Price (INR)</label><input type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} placeholder="e.g. 15999 (for strikethrough)" /></div>
        <div><label>Image path/URL</label><input value={image} onChange={e => setImage(e.target.value)} /></div>
        <div>
          <label>Category</label>
          <select value={category} onChange={e => setCategory(e.target.value as TourPackage["category"])}>
            <option value="spiritual">Spiritual</option>
            <option value="cultural">Cultural</option>
            <option value="adventure">Adventure</option>
            <option value="heritage">Heritage</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 20 }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="checkbox" checked={hidden} onChange={e => setHidden(e.target.checked)} /> Hidden</label>
        </div>
        <div className="full"><label>Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Package description..." /></div>
        <div className="full"><label>Highlights (one per line)</label><textarea value={highlightsStr} onChange={e => setHighlightsStr(e.target.value)} placeholder={"Ganga Aarti darshan\nKashi Vishwanath Temple\nBoat ride at sunrise"} style={{ minHeight: 80 }} /></div>
        <div className="full"><label>Itinerary (one per line)</label><textarea value={itineraryStr} onChange={e => setItineraryStr(e.target.value)} placeholder={"Day 1: Arrival & evening aarti\nDay 2: Temple tour & boat ride\nDay 3: Departure"} style={{ minHeight: 80 }} /></div>
        <div className="full"><label>Inclusions (one per line)</label><textarea value={inclusionsStr} onChange={e => setInclusionsStr(e.target.value)} placeholder={"Hotel accommodation\nBreakfast & dinner\nAC transport\nGuide"} style={{ minHeight: 80 }} /></div>
      </div>
      <div className="adm-actions">
        <button className="adm-btn primary" onClick={() => {
          if (!name.trim() || !price) return;
          onSave({
            name: name.trim(), destination, duration, price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : undefined,
            image, description, category, hidden,
            highlights: highlightsStr.split("\n").map(s => s.trim()).filter(Boolean),
            itinerary: itineraryStr.split("\n").map(s => s.trim()).filter(Boolean),
            inclusions: inclusionsStr.split("\n").map(s => s.trim()).filter(Boolean),
          });
        }}>Save</button>
        <button className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}
