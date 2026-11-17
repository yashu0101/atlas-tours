import { getGallery, addGalleryImage, updateGalleryImage, deleteGalleryImage } from "@/lib/db";
import { crudRoute } from "@/lib/crud-route";

const route = crudRoute({
  list: getGallery,
  add: addGalleryImage,
  update: updateGalleryImage,
  remove: deleteGalleryImage,
  isPublic: (g) => g.active !== false,
  fields: { src: "string", caption: "string", category: "string", active: "boolean" },
  required: ["src"],
  defaults: { caption: "", category: "", active: true },
});

export const GET = route.GET;
export const POST = route.POST;
export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
