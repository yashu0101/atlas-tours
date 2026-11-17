import { getPackages, addPackage, updatePackage, deletePackage } from "@/lib/db";
import { crudRoute } from "@/lib/crud-route";
import { isPublicPackage } from "@/lib/visibility";

const route = crudRoute({
  list: getPackages,
  add: addPackage,
  update: updatePackage,
  remove: deletePackage,
  isPublic: isPublicPackage,
  fields: {
    name: "string", destination: "string", duration: "string", price: "number", originalPrice: "number",
    image: "string", description: "text", highlights: "string[]", itinerary: "string[]", inclusions: "string[]",
    category: ["spiritual", "cultural", "adventure", "heritage"], hidden: "boolean",
  },
  required: ["name", "price"],
  defaults: { destination: "", duration: "", image: "", description: "", highlights: [], itinerary: [], inclusions: [], category: "spiritual", hidden: false },
});

export const GET = route.GET;
export const POST = route.POST;
export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
