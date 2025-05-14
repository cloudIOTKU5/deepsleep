import { Moon, Zap } from "lucide-react"

export function WelcomeBanner() {
  return (
    <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-purple-800 mb-2">좋은 밤 되세요!</h2>
          <p className="text-purple-600">최적의 수면 환경을 위한 설정을 확인하세요.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center">
            <Moon className="h-8 w-8 text-purple-700 mb-1" />
            <span className="text-sm text-purple-700 font-medium">편안한 수면</span>
          </div>
          <div className="flex flex-col items-center">
            <Zap className="h-8 w-8 text-yellow-500 mb-1" />
            <span className="text-sm text-purple-700 font-medium">활기찬 아침</span>
          </div>
        </div>
      </div>
    </div>
  )
}
