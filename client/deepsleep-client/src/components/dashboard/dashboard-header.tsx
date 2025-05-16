import { CloudMoon, Stars } from "lucide-react"

export function DashboardHeader() {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="flex items-center gap-3 mb-2">
        <CloudMoon className="h-10 w-10 text-purple-500" />
        <Stars className="h-6 w-6 text-purple-400" />
      </div>
      <h1 className="text-4xl font-bold text-center text-purple-800 mb-2">수면 환경 컨트롤</h1>
      <p className="text-purple-600 text-center max-w-md">편안한 수면을 위한 최적의 환경을 만들어보세요</p>
    </div>
  )
}
