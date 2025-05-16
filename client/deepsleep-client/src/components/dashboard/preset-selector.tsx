"use client"

import { Cloud, NotebookIcon as Lotus, Moon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface Preset {
  id: string
  name: string
  icon: string
  description: string
  settings: {
    humidity: number
    humidifierStatus: string
    speakerStatus: string
    volume: number
    automationEnabled: boolean
    humidityThreshold: number
    heartRateThreshold: number
  }
}

interface PresetSelectorProps {
  presets: Preset[]
  onSelectPreset: (presetId: string) => void
}

export function PresetSelector({ presets, onSelectPreset }: PresetSelectorProps) {
  // 아이콘 렌더링 함수
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case "moon":
        return <Moon className="h-5 w-5" />
      case "cloud":
        return <Cloud className="h-5 w-5" />
      case "lotus":
        return <Lotus className="h-5 w-5" />
      default:
        return <Moon className="h-5 w-5" />
    }
  }

  return (
    <Card className="border-purple-200 bg-white/80 backdrop-blur-sm">
      <CardContent className="pt-6">
        <h3 className="text-lg font-medium text-purple-800 mb-4">수면 환경 프리셋</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {presets.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              className="flex items-center justify-start gap-3 h-auto py-3 px-4 border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-colors dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800"
              onClick={() => onSelectPreset(preset.id)}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                {renderIcon(preset.icon)}
              </div>
              <div className="text-left">
                <div className="font-medium text-purple-800">{preset.name}</div>
                <div className="text-xs text-purple-600">{preset.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
