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
    category: ["spiritual", "cultural", "adventure", "heritage"], hidden: "boolean",
  },
  required: ["name", "price"],
  defaults: { destination: "", duration: "", image: "", description: "", highlights: [], itinerary: [], inclusions: [], category: "spiritual", hidden: false },
});

export const GET = route.GET;
export const POST = route.POST;
export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
