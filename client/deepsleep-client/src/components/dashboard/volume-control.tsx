"use client"

import { Volume2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"

interface VolumeControlProps {
  volume: number
  onVolumeChange: (volume: number) => void
}

export function VolumeControl({ volume, onVolumeChange }: VolumeControlProps) {
  return (
    <Card className="border-purple-200 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
          <Volume2 className="h-5 w-5 text-purple-500" />
          스피커 볼륨
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Slider
            value={[volume]}
            min={0}
            max={100}
            step={1}
            onValueChange={(value) => onVolumeChange(value[0])}
            className="py-4 [&>[role=slider]]:bg-purple-600 [&>[role=slider]]:border-purple-600 [&>.range]:bg-purple-600 dark:[&>[role=slider]]:bg-purple-400 dark:[&>[role=slider]]:border-purple-400 dark:[&>.range]:bg-purple-400"
          />
          <div className="text-right text-sm text-purple-600">볼륨: {volume}%</div>
        </div>
      </CardContent>
    </Card>
  )
}
