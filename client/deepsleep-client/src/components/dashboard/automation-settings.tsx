"use client"

import { useState } from "react"
import { Droplet, Heart, Settings } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

interface AutomationSettingsProps {
  automationEnabled: boolean
  setAutomationEnabled: (enabled: boolean) => void
  humidityThreshold: number
  setHumidityThreshold: (threshold: number) => void
  heartRateThreshold: number
  setHeartRateThreshold: (threshold: number) => void
  humidifierSerial: string
  setHumidifierSerial: (serial: string) => void
  speakerSerial: string
  setSpeakerSerial: (serial: string) => void
  onSave: () => void
  onSaveSerials: () => void
}

export function AutomationSettings({
  automationEnabled,
  setAutomationEnabled,
  humidityThreshold,
  setHumidityThreshold,
  heartRateThreshold,
  setHeartRateThreshold,
  humidifierSerial,
  setHumidifierSerial,
  speakerSerial,
  setSpeakerSerial,
  onSave,
  onSaveSerials,
}: AutomationSettingsProps) {
  return (
    <Card className="border-purple-200 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Settings className="h-5 w-5 text-purple-600" />
          자동화 설정
        </CardTitle>
        <CardDescription>장치가 자동으로 활성화되는 조건을 설정하세요</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 자동화 활성화 토글 */}
        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
          <div>
            <h3 className="font-medium text-purple-800">자동화 활성화</h3>
            <p className="text-sm text-purple-600">임계값에 따라 장치를 자동으로 제어합니다</p>
          </div>
          <Switch
            checked={automationEnabled}
            onCheckedChange={setAutomationEnabled}
            className="data-[state=checked]:bg-purple-600 dark:data-[state=checked]:bg-purple-400"
          />
        </div>

        {/* 습도 및 심박수 임계값 슬라이더 */}
        <div className="space-y-6">
          {/* 습도 임계값 섹션 */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between mb-2">
              <label htmlFor="humidity-threshold" className="text-sm font-medium text-blue-800">
                습도 임계값
              </label>
              <span className="text-sm font-bold text-blue-700">{humidityThreshold}%</span>
            </div>
            <Slider
              id="humidity-threshold"
              value={[humidityThreshold]}
              min={20}
              max={80}
              step={1}
              onValueChange={(value) => setHumidityThreshold(value[0])}
              className="py-4 [&>[role=slider]]:bg-blue-600 [&>[role=slider]]:border-blue-600 [&>.range]:bg-blue-600 dark:[&>[role=slider]]:bg-blue-400 dark:[&>[role=slider]]:border-blue-400 dark:[&>.range]:bg-blue-400"
            />
            <div className="flex justify-between text-xs text-blue-600 mt-1">
              <span>건조 (20%)</span>
              <span>쾌적 (40-60%)</span>
              <span>습함 (80%)</span>
            </div>
            <p className="text-xs text-blue-700 mt-3 flex items-center">
              <Droplet className="h-3 w-3 mr-1" />
              습도가 이 수준 아래로 떨어지면 가습기가 켜집니다
            </p>
          </div>

          {/* 심박수 임계값 섹션 */}
          <div className="p-4 bg-pink-50 rounded-lg">
            <div className="flex justify-between mb-2">
              <label htmlFor="heartrate-threshold" className="text-sm font-medium text-pink-800">
                심박수 임계값
              </label>
              <span className="text-sm font-bold text-pink-700">{heartRateThreshold} bpm</span>
            </div>
            <Slider
              id="heartrate-threshold"
              value={[heartRateThreshold]}
              min={40}
              max={100}
              step={1}
              onValueChange={(value) => setHeartRateThreshold(value[0])}
              className="py-4 [&>[role=slider]]:bg-pink-600 [&>[role=slider]]:border-pink-600 [&>.range]:bg-pink-600 dark:[&>[role=slider]]:bg-pink-400 dark:[&>[role=slider]]:border-pink-400 dark:[&>.range]:bg-pink-400"
            />
            <div className="flex justify-between text-xs text-pink-600 mt-1">
              <span>깊은 수면 (40bpm)</span>
              <span>얕은 수면 (60-80bpm)</span>
              <span>각성 (100bpm)</span>
            </div>
            <p className="text-xs text-pink-700 mt-3 flex items-center">
              <Heart className="h-3 w-3 mr-1" />
              심박수가 이 수준을 초과하면 스피커가 활성화됩니다
            </p>
          </div>
        </div>

        {/* 시리얼 번호 입력 섹션 */}
        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <label htmlFor="humidifier-serial" className="block text-sm font-medium text-green-800 mb-1">
              가습기 시리얼 번호
            </label>
            <input
              id="humidifier-serial"
              type="text"
              value={humidifierSerial}
              onChange={(e) => setHumidifierSerial(e.target.value)}
              placeholder="예: HG123456789"
              className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <label htmlFor="speaker-serial" className="block text-sm font-medium text-green-800 mb-1">
              스피커 시리얼 번호
            </label>
            <input
              id="speaker-serial"
              type="text"
              value={speakerSerial}
              onChange={(e) => setSpeakerSerial(e.target.value)}
              placeholder="예: SP987654321"
              className="w-full px-3 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={onSaveSerials}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              시리얼 저장
            </Button>
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-purple-50/50 flex justify-end">
        <Button
          onClick={onSave}
          className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white"
        >
          설정 저장
        </Button>
      </CardFooter>
    </Card>
  )
}