import type { MessageKey } from "@/lib/i18n";

/**
 * "Our Team" section (Team.tsx). Fixed in code, not admin-editable.
 * `name` is optional: names are still to come from the client (see PROJECT_AUDIT.md N-12);
 * while unset the role is the heading. `width`/`height` are the real image size, so each
 * photo is shown uncropped in its own aspect ratio.
 */
export type TeamMember = {
  id: string;
  name?: string;
  role: MessageKey;
  /** Organisation line under the heading (e.g. the partner hotel). */
  org?: MessageKey;
  /** Show the org as the Hotel Ganga Imperial logo badge, linking to the hotel website. */
  hotelLogo?: boolean;
  description: MessageKey;
  alt: MessageKey;
  image: string;
  width: number;
  height: number;
};

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "founder",
    name: "Ashfaque Ahmed",
    role: "team.founderRole",
    org: "team.founderOrg",
    description: "team.founderDesc",
    alt: "team.founderAlt",
    image: "/images/team/founder.jpg",
    width: 866,
    height: 1148,
  },
  {
    id: "general-manager",
    name: "Dinesh Singh Rathore",
    role: "team.gmRole",
    org: "team.gmOrg",
    hotelLogo: true,
    description: "team.gmDesc",
    alt: "team.gmAlt",
    image: "/images/team/general-manager.jpg",
    width: 960,
    height: 1280,
  },
];
