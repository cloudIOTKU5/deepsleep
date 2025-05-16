import { Heart } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

interface HeartRateCardProps {
  heartRate: number
  speakerStatus: string
  onToggleSpeaker: (value: boolean) => void
}

export function HeartRateCard({ heartRate, speakerStatus, onToggleSpeaker }: HeartRateCardProps) {
  return (
    <Card className="border-purple-200 bg-white/80 backdrop-blur-sm overflow-hidden">
      <div className="absolute top-0 right-0 h-24 w-24 bg-pink-100 dark:bg-pink-900/30 rounded-full -mr-12 -mt-12 opacity-50"></div>
      <CardHeader className="pb-2 relative">
        <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
          <Heart className="h-5 w-5 text-pink-500" />
          현재 심박수
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-5xl font-bold text-pink-600 dark:text-pink-400">{heartRate}</span>
            <span className="text-xl ml-1 text-pink-600 dark:text-pink-400">bpm</span>
            <p className="text-sm text-pink-500 mt-1">수면 중 정상 심박수: 40-60 bpm</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 mr-2 dark:text-neutral-400">스피커</span>
              <Badge
                variant={speakerStatus === "on" ? "default" : "outline"}
                className={speakerStatus === "on" ? "bg-green-500 dark:bg-green-600" : ""}
              >
                {speakerStatus === "on" ? "켜짐" : "꺼짐"}
              </Badge>
            </div>
            <Switch
              checked={speakerStatus === "on"}
              onCheckedChange={onToggleSpeaker}
              className="data-[state=checked]:bg-purple-600 dark:data-[state=checked]:bg-purple-400"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
