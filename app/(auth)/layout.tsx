import Image from "next/image"

function Logo({ className }: { className: string }) {
  return (
    <Image
      src="/images/mncpeople-logo-transparent.png"
      alt="MNC People by Manga Capital"
      width={877}
      height={689}
      priority
      className={className}
    />
  )
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Brand panel, only shown beside the form on large screens */}
      <aside className="hidden items-center justify-center border-r bg-sidebar p-10 lg:flex">
        <Logo className="h-auto w-64 xl:w-80 dark:invert" />
      </aside>

      <main className="flex flex-col items-center justify-center bg-background px-4 py-10">
        {/* Smaller screens stack the logo above the form instead */}
        <Logo className="mb-8 h-auto w-40 sm:w-48 lg:hidden dark:invert" />
        {children}
      </main>
    </div>
  )
}
