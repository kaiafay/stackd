import ThemeInit from "@/components/dashboard/ThemeInit";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeInit />
      {children}
    </>
  );
}
