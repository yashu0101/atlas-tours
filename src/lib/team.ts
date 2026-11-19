import type { MessageKey } from "@/lib/i18n";
import { MD_NAME, TEAM_PHONES } from "@/lib/config";

/**
 * "Our Team" section (Team.tsx). Fixed in code, not admin-editable.
 * `name` is optional: names are still to come from the client (see PROJECT_AUDIT.md N-12);
 * while unset the role is the heading. `width`/`height` are the real image size, so each
 * photo is shown uncropped in its own aspect ratio. A member without `photo` gets an
 * initials placeholder in the photo slot until a photo is supplied.
 */
export type TeamPhoto = {
  alt: MessageKey;
  image: string;
  width: number;
  height: number;
};

export type TeamMember = {
  id: string;
  name?: string;
  role: MessageKey;
  /** Organisation line under the heading (e.g. the partner hotel). */
  org?: MessageKey;
  /** Show the org as the Hotel Ganga Imperial logo badge, linking to the hotel website. */
  hotelLogo?: boolean;
  description: MessageKey;
  photo?: TeamPhoto;
  /** Direct number (E.164, from TEAM_PHONES in config.ts), shown as a call link. */
  phone?: string;
};

/** Initials for the no-photo placeholder: first letters of the first and last words. */
export function teamInitials(name: string): string {
  const words = name.replace(/^(mr|mrs|ms|dr)\.?\s+/i, "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "founder",
    name: "Mr. Ashfaque Ahmed",
    role: "team.founderRole",
    org: "team.founderOrg",
    description: "team.founderDesc",
    phone: TEAM_PHONES.founder,
    photo: { alt: "team.founderAlt", image: "/images/team/founder.jpg", width: 866, height: 1148 },
  },
  {
    id: "general-manager",
    name: "Mr. Dinesh Singh Rathore",
    role: "team.gmRole",
    org: "team.gmOrg",
    hotelLogo: true,
    description: "team.gmDesc",
    phone: TEAM_PHONES.generalManager,
    photo: { alt: "team.gmAlt", image: "/images/team/general-manager.jpg", width: 960, height: 1280 },
  },
  {
    id: "managing-director",
    name: MD_NAME, // set in config.ts (also used by the header and Showcase)
    role: "team.mdRole",
    org: "team.mdOrg",
    description: "team.mdDesc",
    phone: TEAM_PHONES.managingDirector,
    // No photo yet: Team.tsx shows an initials placeholder.
  },
];
