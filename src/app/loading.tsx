export default function Loading() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-blue-primary border-t-transparent rounded-full animate-spin" />
        <span className="font-syne font-black text-lg">
          <span className="text-white">FANT</span>
          <span className="gradient-text-ai">AI</span>
          <span className="text-white">D</span>
        </span>
      </div>
    </div>
  )
}
