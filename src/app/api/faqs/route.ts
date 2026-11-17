import { getFAQs, addFAQ, updateFAQ, deleteFAQ } from "@/lib/db";
import { crudRoute } from "@/lib/crud-route";

const route = crudRoute({
  list: getFAQs,
  add: addFAQ,
  update: updateFAQ,
  remove: deleteFAQ,
  isPublic: (f) => f.active !== false,
  fields: { question: "text", questionHi: "text", answer: "text", answerHi: "text", active: "boolean", order: "number" },
  required: ["question", "answer"],
  defaults: { active: true, order: 0 },
});

export const GET = route.GET;
export const POST = route.POST;
export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
