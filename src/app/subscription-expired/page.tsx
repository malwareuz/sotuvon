import Link from "next/link";

export default function SubscriptionExpiredPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">Obuna tugagan</h1>
        <p className="text-muted-foreground">
          Sizning obunangiz muddati tugagan. Davom etish uchun obunani
          yangilang.
        </p>
        <Link
          href="/settings"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Sozlamalarga o&apos;tish
        </Link>
      </div>
    </div>
  );
}