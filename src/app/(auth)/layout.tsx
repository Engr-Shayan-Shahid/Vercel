import { Toaster } from "@/components/ui/sonner";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-deep-black px-4 py-12">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">CBAMVault</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">CBAM Compliance Platform</h1>
      </div>
      {children}
      <Toaster richColors closeButton position="top-right" />
    </div>
  );
}
