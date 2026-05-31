export interface Author {
  name: string;
  role: string;
  bio: string;
  avatarPath: string;
}

export const authors: Author[] = [
  {
    name: "Truc Le",
    role: "Security Engineer",
    bio: "Passionate about helping developers build safe, robust systems. Has led security initiatives across multiple product teams.",
    avatarPath: "/images/author.jpg",
  },
  {
    name: "Khanh Do",
    role: "Full-Stack Developer",
    bio: "Specialises in authentication systems, web security, and making complex topics feel approachable through interactive demos.",
    avatarPath: "",
  },
];

/** @deprecated use `authors[0]` — kept for backwards compat */
export const author: Author = authors[0];
