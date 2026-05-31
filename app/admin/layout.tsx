import { createSupabaseServerClient } from "@/lib/supabase-server";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ToastProvider } from "@/components/ui/toast";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If user is authenticated, show sidebar + content.
  // If not authenticated, just render children (the login page fills the screen).
  // Middleware handles redirects — we don't call redirect() here.
  if (!user) {
    return <ToastProvider>{children}</ToastProvider>;
  }

  return (
    <ToastProvider>
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <AdminSidebar />
        <main
          style={{
            flex: 1,
            minWidth: 0,
            background: "var(--bg)",
            padding: "32px",
            overflowY: "auto",
          }}
        >
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
