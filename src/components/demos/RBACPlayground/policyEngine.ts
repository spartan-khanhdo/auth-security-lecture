/**
 * Simple RBAC + ReBAC policy engine for RBACPlayground.
 *
 * RBAC mode: tuples of (user, relation, object).
 * Relations imply each other in order: owner > editor > viewer.
 * Querying "Can user X do action Y on object Z?" resolves the relation
 * through the implication chain.
 *
 * Design: keeps to ~80 lines as specified. No external parser library.
 */

export type Relation = "owner" | "editor" | "viewer";

export const RELATIONS: Relation[] = ["owner", "editor", "viewer"];

/**
 * Maps each relation to the set it implies (including itself).
 * "owner" implies all; "editor" implies editor+viewer; "viewer" implies only viewer.
 */
export const IMPLIES: Record<Relation, Relation[]> = {
  owner:  ["owner", "editor", "viewer"],
  editor: ["editor", "viewer"],
  viewer: ["viewer"],
};

export interface Tuple {
  user: string;
  relation: Relation;
  object: string;
}

export interface CheckResult {
  ok: boolean;
  via: Relation | null;
  directRelations: Relation[];
}

/**
 * Check if `user` has `relation` on `object` given the tuple set.
 * Resolves via the implication chain.
 */
export function rbacCheck(
  tuples: Tuple[],
  user: string,
  relation: Relation,
  object: string
): CheckResult {
  const direct = tuples
    .filter((t) => t.user === user && t.object === object)
    .map((t) => t.relation);

  for (const r of RELATIONS) {
    if (direct.includes(r) && IMPLIES[r].includes(relation)) {
      return { ok: true, via: r, directRelations: direct };
    }
  }
  return { ok: false, via: null, directRelations: direct };
}

export const DEFAULT_TUPLES: Tuple[] = [
  { user: "Kim",  relation: "owner",  object: "doc:roadmap" },
  { user: "Ben",  relation: "editor", object: "doc:roadmap" },
  { user: "Carl", relation: "editor", object: "doc:slides"  },
  { user: "Mei",  relation: "viewer", object: "doc:roadmap" },
];

export const USERS = ["Kim", "Ben", "Carl", "Mei"];
export const OBJECTS = ["doc:roadmap", "doc:slides"];
