import { getFAQs, addFAQ, updateFAQ, deleteFAQ } from "@/lib/db";
import { crudRoute } from "@/lib/crud-route";
import { nullable } from "@/lib/api";
import { isPublicFAQ } from "@/lib/visibility";

const route = crudRoute({
  list: getFAQs,
  add: addFAQ,
  update: updateFAQ,
  remove: deleteFAQ,
  isPublic: isPublicFAQ,
  fields: { question: "text", questionHi: nullable("text"), answer: "text", answerHi: nullable("text"), active: "boolean", order: "number" },
  required: ["question", "answer"],
  defaults: { active: true, order: 0 },
});

export const GET = route.GET;
export const POST = route.POST;
export const PATCH = route.PATCH;
export const DELETE = route.DELETE;
