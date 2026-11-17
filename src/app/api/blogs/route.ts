import { getBlogs, addBlog, updateBlog, deleteBlog } from "@/lib/db";
import { crudRoute } from "@/lib/crud-route";
import { isPublicBlog } from "@/lib/visibility";

const route = crudRoute({
  list: getBlogs,
  add: addBlog,
  update: updateBlog,
  remove: deleteBlog,
  isPublic: isPublicBlog,
  fields: { title: "string", excerpt: "text", content: "text", image: "image", category: "string", author: "string", active: "boolean" },
  required: ["title"],
  defaults: { excerpt: "", content: "", image: "", category: "", author: "", active: true },
});

export const GET = route.GET;
export const POST = route.POST;
export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
