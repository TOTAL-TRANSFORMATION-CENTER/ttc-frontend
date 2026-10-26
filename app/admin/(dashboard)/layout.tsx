import AdminLayout from "@/components/admin/admin-layout";

export default function AdminRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
