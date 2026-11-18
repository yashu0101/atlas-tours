import { getReviews, addReview, updateReview, deleteReview } from "@/lib/db";
import { crudRoute } from "@/lib/crud-route";
import { int, nullable } from "@/lib/api";
import { isPublicReview } from "@/lib/visibility";

const route = crudRoute({
  list: getReviews,
  add: addReview,
  update: updateReview,
  remove: deleteReview,
  isPublic: isPublicReview,
  fields: { name: "string", rating: int(1, 5), text: "text", city: "string", packageName: nullable("string"), active: "boolean" },
  required: ["name", "rating"],
  defaults: { text: "", city: "", active: true },
});

export const GET = route.GET;
export const POST = route.POST;
export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
