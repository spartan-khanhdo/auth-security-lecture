import { author } from "@/content/author";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function AuthorCard() {
  const initials = author.name
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("");

  return (
    <div className="flex items-center gap-4 rounded-lg border border-border p-4">
      <Avatar>
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium text-foreground">{author.name}</p>
        <p className="text-sm text-muted-foreground">{author.role}</p>
        <p className="text-sm text-muted-foreground">{author.bio}</p>
      </div>
    </div>
  );
}
