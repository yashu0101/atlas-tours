import { getGallery, addGalleryImage, updateGalleryImage, deleteGalleryImage } from "@/lib/db";
import { crudRoute } from "@/lib/crud-route";
import { isPublicGalleryImage } from "@/lib/visibility";

const route = crudRoute({
  list: getGallery,
  add: addGalleryImage,
  update: updateGalleryImage,
  remove: deleteGalleryImage,
  isPublic: isPublicGalleryImage,
  fields: { src: "string", caption: "string", category: "string", active: "boolean" },
  required: ["src"],
  defaults: { caption: "", category: "", active: true },
});

export const GET = route.GET;
export const POST = route.POST;
export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
