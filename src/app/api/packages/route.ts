import { getPackages, addPackage, updatePackage, deletePackage } from "@/lib/db";
import { crudRoute } from "@/lib/crud-route";
import { int, nullable } from "@/lib/api";

// B-13: INR, stored in an INTEGER column.
const MAX_PRICE = 10_000_000;
import { isPublicPackage } from "@/lib/visibility";

const route = crudRoute({
  list: getPackages,
  add: addPackage,
  update: updatePackage,
  remove: deletePackage,
  isPublic: isPublicPackage,
  fields: {
    name: "string", destination: "string", duration: "string", price: int(0, MAX_PRICE), originalPrice: nullable(int(0, MAX_PRICE)),
    image: "image", description: "text", highlights: "string[]", itinerary: "string[]", inclusions: "string[]",
    // N-18. Itinerary lines may carry " | "-separated points (see parseItineraryDay).
    exclusions: "string[]", startsFrom: nullable("string"), minTravelers: nullable(int(1, 100)), priceNote: nullable("string"),
    category: ["spiritual", "cultural", "adventure", "heritage", "pilgrimage", "international", "honeymoon"], hidden: "boolean",
  },
  required: ["name", "price"],
  defaults: { destination: "", duration: "", image: "", description: "", highlights: [], itinerary: [], inclusions: [], exclusions: [], category: "spiritual", hidden: false },
});

export const GET = route.GET;
export const POST = route.POST;
export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
