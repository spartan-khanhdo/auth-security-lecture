export interface Author {
  name: string;
  role: string;
  bio: string;
  avatarPath: string;
}

export const authors: Author[] = [
  {
    name: "Truc Le",
    role: "Software Engineer",
    bio: "Passionate about helping developers build safe, robust systems. Has led security initiatives across multiple product teams.",
    avatarPath: "https://ca.slack-edge.com/T040BTH4L1E-U082Y1BBCPL-b9e95f7bc170-512",
  },
  {
    name: "Khanh Do",
    role: "Software Engineer",
    bio: "Specialises in authentication systems, web security, and making complex topics feel approachable through interactive demos.",
    avatarPath: "https://ca.slack-edge.com/T040BTH4L1E-U08PD9J308Y-0c40683242c5-512",
  },
];

/** @deprecated use `authors[0]` — kept for backwards compat */
export const author: Author = authors[0];
