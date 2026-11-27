import { useState } from "react";

import type { TourPackage } from "@/lib/types";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/app/packages/package-utils";
import PricingEditor, { fromPricingDraft, lowestDraftRate, toPricingDraft } from "./PricingEditor";

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
  const [exclusionsStr, setExclusionsStr] = useState(pkg?.exclusions?.join("\n") || "");
  const [startsFrom, setStartsFrom] = useState(pkg?.startsFrom || "");
  const [minTravelers, setMinTravelers] = useState(pkg?.minTravelers?.toString() || "");
  const [priceNote, setPriceNote] = useState(pkg?.priceNote || "");
  const [category, setCategory] = useState<TourPackage["category"]>(pkg?.category || "spiritual");
  const [hidden, setHidden] = useState(pkg?.hidden ?? false);
  const [pricing, setPricing] = useState(() => toPricingDraft(pkg?.pricing));
  const lowest = lowestDraftRate(pricing);

  return (
    // Native validation: required fields block Save and show the browser message; Enter saves.
    <form onSubmit={e => e.preventDefault()}>
      <h3 className="modal-title">{pkg ? "Edit Package" : "New Package"}</h3>
      <div className="adm-form">
        <label className="adm-fl"><span>Name *</span><input required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Varanasi Spiritual Tour" /></label>
        <label className="adm-fl"><span>Destination</span><input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Varanasi, UP" /></label>
        <label className="adm-fl"><span>Duration</span><input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 3 Days / 2 Nights" /></label>
        <div className="adm-fl">
          <label className="adm-fl"><span>Price (INR) *{lowest !== null ? " — shown as \"from\"" : ""}</span><input required type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 12999" /></label>
          {lowest !== null && String(lowest) !== price && (
            <button type="button" className="adm-inline-btn" onClick={() => setPrice(String(lowest))}>Use lowest pricing option (₹{lowest.toLocaleString("en-IN")})</button>
          )}
        </div>
        <label className="adm-fl"><span>Original Price (INR)</span><input type="number" value={originalPrice} onChange={e => setOriginalPrice(e.target.value)} placeholder="e.g. 15999 (for strikethrough)" /></label>
        <label className="adm-fl"><span>Price note</span><input value={priceNote} onChange={e => setPriceNote(e.target.value)} placeholder="e.g. Based on double sharing" /></label>
        <label className="adm-fl"><span>Starts from (city)</span><input value={startsFrom} onChange={e => setStartsFrom(e.target.value)} placeholder="e.g. Prayagraj" /></label>
        <label className="adm-fl"><span>Minimum travelers</span><input type="number" min={1} max={100} value={minTravelers} onChange={e => setMinTravelers(e.target.value)} placeholder="e.g. 4 (empty = no minimum)" /></label>
        <label className="adm-fl"><span>Image path/URL</span><input value={image} onChange={e => setImage(e.target.value)} /></label>
        <label className="adm-fl"><span>Category</span>
          <select value={category} onChange={e => setCategory(e.target.value as TourPackage["category"])}>
            {CATEGORY_ORDER.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </label>
        <div className="adm-check-cell">
          <label className="adm-check"><input type="checkbox" checked={hidden} onChange={e => setHidden(e.target.checked)} /> Hidden</label>
        </div>
        <label className="adm-fl full"><span>Description</span><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Package description..." /></label>
        <label className="adm-fl full"><span>Highlights (one per line)</span><textarea value={highlightsStr} onChange={e => setHighlightsStr(e.target.value)} placeholder={"Ganga Aarti darshan\nKashi Vishwanath Temple\nBoat ride at sunrise"} style={{ minHeight: 80 }} /></label>
        <label className="adm-fl full"><span>Itinerary (one day per line — separate the day&apos;s points with | and end with Overnight in &lt;place&gt;)</span><textarea value={itineraryStr} onChange={e => setItineraryStr(e.target.value)} placeholder={"Day 1: Prayagraj → Jaipur | Hotel check-in | Evening local market | Overnight in Jaipur\nDay 2: Jaipur sightseeing | Amber Fort | Hawa Mahal | Overnight in Jaipur\nDay 3: Departure | Drop at the railway station"} style={{ minHeight: 120 }} /></label>
        <label className="adm-fl full"><span>Inclusions (one per line)</span><textarea value={inclusionsStr} onChange={e => setInclusionsStr(e.target.value)} placeholder={"Hotel accommodation\nBreakfast & dinner\nAC transport\nGuide"} style={{ minHeight: 80 }} /></label>
        <div className="full adm-fl adm-pricing-field">
          <span className="adm-section-label">Pricing options
            <small>Hotel categories × group sizes from the brochure. Optional — leave empty for a single price.</small>
          </span>
          <PricingEditor value={pricing} onChange={setPricing} />
        </div>
        <label className="adm-fl full"><span>Not included (one per line)</span><textarea value={exclusionsStr} onChange={e => setExclusionsStr(e.target.value)} placeholder={"Train / flight tickets\nLunch & dinner\nPersonal expenses"} style={{ minHeight: 80 }} /></label>
      </div>
      <div className="adm-actions">
        <button type="submit" className="adm-btn primary" onClick={() => {
          if (!name.trim() || !price) return;
          onSave({
            name: name.trim(), destination, duration, price: Number(price),
            originalPrice: originalPrice ? Number(originalPrice) : undefined,
            image, description, category, hidden,
            highlights: highlightsStr.split("\n").map(s => s.trim()).filter(Boolean),
            itinerary: itineraryStr.split("\n").map(s => s.trim()).filter(Boolean),
            inclusions: inclusionsStr.split("\n").map(s => s.trim()).filter(Boolean),
            exclusions: exclusionsStr.split("\n").map(s => s.trim()).filter(Boolean),
            startsFrom: startsFrom.trim() || undefined,
            minTravelers: minTravelers ? Number(minTravelers) : undefined,
            priceNote: priceNote.trim() || undefined,
            pricing: fromPricingDraft(pricing),
          });
        }}>Save</button>
        <button type="button" className="adm-btn" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
