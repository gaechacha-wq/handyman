export default function Home() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <main className="flex flex-col items-center justify-center text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight text-black dark:text-zinc-50 sm:text-7xl">
          Work In Progress
        </h1>
        <p className="text-xl leading-8 text-zinc-600 dark:text-zinc-400 max-w-lg">
          The best is yet to come.
        </p>
        <div className="mt-10 flex justify-center">
            <div className="w-24 h-1 bg-black/10 dark:bg-white/10 rounded-full animate-pulse"></div>
        </div>
      </main>
    </div>
  );
}
