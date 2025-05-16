import { Droplet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

interface HumidityCardProps {
  humidity: number
  humidifierStatus: string
  onToggleHumidifier: (value: boolean) => void
}

export function HumidityCard({ humidity, humidifierStatus, onToggleHumidifier }: HumidityCardProps) {
  return (
    <Card className="border-purple-200 bg-white/80 backdrop-blur-sm overflow-hidden">
      <div className="absolute top-0 right-0 h-24 w-24 bg-purple-100 dark:bg-purple-900/30 rounded-full -mr-12 -mt-12 opacity-50"></div>
      <CardHeader className="pb-2 relative">
        <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
          <Droplet className="h-5 w-5 text-blue-500" />
          현재 습도
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-5xl font-bold text-blue-600 dark:text-blue-400">{humidity}%</span>
            <p className="text-sm text-blue-500 mt-1">최적 수면 습도: 40-60%</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-500 mr-2 dark:text-neutral-400">가습기</span>
              <Badge
                variant={humidifierStatus === "on" ? "default" : "outline"}
                className={humidifierStatus === "on" ? "bg-green-500 dark:bg-green-600" : ""}
              >
                {humidifierStatus === "on" ? "켜짐" : "꺼짐"}
              </Badge>
            </div>
            <Switch
              checked={humidifierStatus === "on"}
              onCheckedChange={onToggleHumidifier}
              className="data-[state=checked]:bg-purple-600 dark:data-[state=checked]:bg-purple-400"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
