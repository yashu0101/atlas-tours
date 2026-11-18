import { getOffers, addOffer, updateOffer, deleteOffer } from "@/lib/db";
import { crudRoute } from "@/lib/crud-route";
import { int, nullable } from "@/lib/api";
import { isPublicOffer } from "@/lib/visibility";

const route = crudRoute({
  list: getOffers,
  add: addOffer,
  update: updateOffer,
  remove: deleteOffer,
  isPublic: isPublicOffer,
  fields: { title: "string", description: "text", discount: int(0, 100), code: nullable("string"), validFrom: "string", validTo: "string", active: "boolean" },
  required: ["title"],
  defaults: { description: "", discount: 0, validFrom: "", validTo: "", active: true },
});

export const GET = route.GET;
export const POST = route.POST;
export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
