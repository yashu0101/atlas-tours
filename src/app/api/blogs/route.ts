import { getBlogs, addBlog, updateBlog, deleteBlog } from "@/lib/db";
import { crudRoute } from "@/lib/crud-route";

const route = crudRoute({
  list: getBlogs,
  add: addBlog,
  update: updateBlog,
  remove: deleteBlog,
  isPublic: (b) => b.active !== false,
  fields: { title: "string", excerpt: "text", content: "text", image: "string", category: "string", author: "string", active: "boolean" },
  required: ["title"],
  defaults: { excerpt: "", content: "", image: "", category: "", author: "", active: true },
});

export const GET = route.GET;
export const POST = route.POST;
export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
