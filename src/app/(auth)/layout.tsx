
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50 p-4 sm:p-6 md:p-8">
      {children}
    </div>
  );
}
