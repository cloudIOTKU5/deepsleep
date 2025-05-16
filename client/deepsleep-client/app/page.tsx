"use client"

import "./globals.css"
import { toast, ToastContainer } from "react-toastify"
import { useState, useEffect } from "react"
import axios from "axios"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BedDouble, Settings } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { HumidityCard } from "@/components/dashboard/humidity-card"
import { HeartRateCard } from "@/components/dashboard/heart-rate-card"
import { VolumeControl } from "@/components/dashboard/volume-control"
import { EnhancedSleepRecords } from "@/components/dashboard/enhanced-sleep-records"
import { AutomationSettings } from "@/components/dashboard/automation-settings"
import { DashboardFooter } from "@/components/dashboard/dashboard-footer"
import { WelcomeBanner } from "@/components/dashboard/welcome-banner"
import { PresetSelector } from "@/components/dashboard/preset-selector"

// API URL
const API_BASE_URL = "/api"

// 프리셋 정의
const PRESETS = [
  {
    id: "deep-sleep",
    name: "깊은 수면",
    icon: "moon",
    description: "깊은 수면을 위한 최적의 환경",
    settings: {
      humidity: 50,
      humidifierStatus: "on",
      speakerStatus: "on",
      volume: 30,
      automationEnabled: true,
      humidityThreshold: 45,
      heartRateThreshold: 70,
    },
  },
  {
    id: "relaxation",
    name: "휴식 모드",
    icon: "cloud",
    description: "편안한 휴식을 위한 환경",
    settings: {
      humidity: 60,
      humidifierStatus: "on",
      speakerStatus: "on",
      volume: 40,
      automationEnabled: true,
      humidityThreshold: 55,
      heartRateThreshold: 75,
    },
  },
  {
    id: "meditation",
    name: "명상 모드",
    icon: "lotus",
    description: "명상과 마음 안정을 위한 환경",
    settings: {
      humidity: 55,
      humidifierStatus: "on",
      speakerStatus: "on",
      volume: 20,
      automationEnabled: true,
      humidityThreshold: 50,
      heartRateThreshold: 65,
    },
  },
]

// 더미 수면 기록 데이터 (실제로는 API에서 가져옴)
const DUMMY_SLEEP_RECORDS = [
  { date: "2023-05-01", averageHumidity: 45, averageHeartRate: 58, sleepQualityScore: 85 },
  { date: "2023-05-02", averageHumidity: 48, averageHeartRate: 62, sleepQualityScore: 78 },
  { date: "2023-05-03", averageHumidity: 52, averageHeartRate: 60, sleepQualityScore: 82 },
  { date: "2023-05-04", averageHumidity: 40, averageHeartRate: 65, sleepQualityScore: 65 },
  { date: "2023-05-05", averageHumidity: 38, averageHeartRate: 68, sleepQualityScore: 60 },
  { date: "2023-05-06", averageHumidity: 42, averageHeartRate: 63, sleepQualityScore: 72 },
  { date: "2023-05-07", averageHumidity: 50, averageHeartRate: 59, sleepQualityScore: 80 },
  { date: "2023-05-08", averageHumidity: 55, averageHeartRate: 56, sleepQualityScore: 88 },
  { date: "2023-05-09", averageHumidity: 53, averageHeartRate: 58, sleepQualityScore: 84 },
  { date: "2023-05-10", averageHumidity: 47, averageHeartRate: 61, sleepQualityScore: 76 },
  { date: "2023-05-11", averageHumidity: 43, averageHeartRate: 64, sleepQualityScore: 70 },
  { date: "2023-05-12", averageHumidity: 41, averageHeartRate: 66, sleepQualityScore: 68 },
  { date: "2023-05-13", averageHumidity: 39, averageHeartRate: 67, sleepQualityScore: 62 },
  { date: "2023-05-14", averageHumidity: 44, averageHeartRate: 63, sleepQualityScore: 74 },
  { date: "2023-05-15", averageHumidity: 49, averageHeartRate: 60, sleepQualityScore: 79 },
]

export default function SleepDashboard() {
  // Current status states
  const [humidity, setHumidity] = useState<number>(0)
  const [heartRate, setHeartRate] = useState<number>(0)
  const [humidifierStatus, setHumidifierStatus] = useState<string>("off")
  const [speakerStatus, setSpeakerStatus] = useState<string>("off")
  const [volume, setVolume] = useState<number>(50)

  // Automation settings
  const [automationEnabled, setAutomationEnabled] = useState<boolean>(false)
  const [humidityThreshold, setHumidityThreshold] = useState<number>(40)
  const [heartRateThreshold, setHeartRateThreshold] = useState<number>(60)

  // Sleep records
  const [sleepRecords, setSleepRecords] = useState(DUMMY_SLEEP_RECORDS)
  //const [sleepRecords, setSleepRecords] = useState<Array<any>>(DUMMY_SLEEP_RECORDS)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalPages, setTotalPages] = useState<number>(Math.ceil(DUMMY_SLEEP_RECORDS.length / 5))

  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Fetch current status
  const fetchCurrentStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sleep/status`)
      const data = response.data

      setHumidity(data.humidity)
      setHeartRate(data.heartRate)
      setHumidifierStatus(data.humidifierStatus)
      setSpeakerStatus(data.speakerStatus)
      setVolume(data.volume)
    } catch (error) {
      console.error("Error fetching status:", error)
      // 에러 발생 시 더미 데이터로 대체
      setHumidity(45)
      setHeartRate(62)
      setHumidifierStatus("on")
      setSpeakerStatus("off")
      setVolume(30)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch sleep records
  const fetchSleepRecords = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sleep/records`)
      // Ensure we're setting an array, even if the API returns something else
      const records = Array.isArray(response.data) ? response.data : []
      setSleepRecords(records)
      setTotalPages(Math.ceil(records.length / 5))
    } catch (error) {
      console.error("Error fetching sleep records:", error)
      // 에러 발생 시 더미 데이터 사용
      setSleepRecords(DUMMY_SLEEP_RECORDS)
      setTotalPages(Math.ceil(DUMMY_SLEEP_RECORDS.length / 5))
    }
  }

  // Get paginated records
  const getPaginatedRecords = () => {
    const startIndex = (currentPage - 1) * 5
    const endIndex = startIndex + 5
    return sleepRecords.slice(startIndex, endIndex)
  }

  // Toggle humidifier
  const toggleHumidifier = async (value: boolean) => {
    try {
      const status = value ? "on" : "off"
      const response = await axios.post(`${API_BASE_URL}/device/humidifier`, {
        status,
      })

      if (response.data.success) {
        setHumidifierStatus(status)
      }
    } catch (error) {
      console.error("Error controlling humidifier:", error)
      // 에러 발생 시에도 UI 업데이트
      setHumidifierStatus(value ? "on" : "off")
    }
  }

  // Toggle speaker
  const toggleSpeaker = async (value: boolean) => {
    try {
      const status = value ? "on" : "off"
      const response = await axios.post(`${API_BASE_URL}/device/speaker`, {
        status,
        volume,
      })

      if (response.data.success) {
        setSpeakerStatus(status)
      }
    } catch (error) {
      toast.error("스피커 연결 상태를 확인해주세요.");
      console.error("Error controlling speaker:", error)
      // 에러 발생 시에도 UI 업데이트
      setSpeakerStatus(value ? "on" : "off")
    }
  }

  // Save automation settings
  const saveSettings = async () => {
    try {
      const settings = {
        enabled: automationEnabled,
        humidityThreshold,
        heartRateThreshold,
      }

      const response = await axios.post(`${API_BASE_URL}/settings/automation`, settings)

      if (response.data.success) {
        alert("설정이 저장되었습니다.")
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("설정이 저장되었습니다. (오프라인 모드)")
    }
  }

  // Apply preset
  const applyPreset = async (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId)
    if (!preset) return

    try {
      // Update local state
      setHumidifierStatus(preset.settings.humidifierStatus)
      setSpeakerStatus(preset.settings.speakerStatus)
      setVolume(preset.settings.volume)
      setAutomationEnabled(preset.settings.automationEnabled)
      setHumidityThreshold(preset.settings.humidityThreshold)
      setHeartRateThreshold(preset.settings.heartRateThreshold)

      // Update devices via API
      if (preset.settings.humidifierStatus !== humidifierStatus) {
        await axios.post(`${API_BASE_URL}/device/humidifier`, {
          status: preset.settings.humidifierStatus,
        })
      }

      if (preset.settings.speakerStatus !== speakerStatus || preset.settings.volume !== volume) {
        await axios.post(`${API_BASE_URL}/device/speaker`, {
          status: preset.settings.speakerStatus,
          volume: preset.settings.volume,
        })
      }

      // Save automation settings
      await axios.post(`${API_BASE_URL}/settings/automation`, {
        enabled: preset.settings.automationEnabled,
        humidityThreshold: preset.settings.humidityThreshold,
        heartRateThreshold: preset.settings.heartRateThreshold,
      })

      alert(`${preset.name} 프리셋이 적용되었습니다.`)
    } catch (error) {
      console.error("Error applying preset:", error)
      alert(`${preset.name} 프리셋이 적용되었습니다. (오프라인 모드)`)
    }
  }

  // Initialize data on component mount
  useEffect(() => {
    fetchCurrentStatus()
    fetchSleepRecords()

    // Update status every 10 seconds
    const intervalId = setInterval(() => {
      fetchCurrentStatus()
      fetchSleepRecords()
    }, 10000)

    // Cleanup interval on unmount
    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto p-4 max-w-6xl">
      <ToastContainer />

        <DashboardHeader />

        <div className="relative mb-12 overflow-hidden rounded-xl bg-white/20 dark:bg-gray-900/20 p-2 backdrop-blur-sm border border-neutral-200 border-purple-100 dark:border-gray-700 dark:border-neutral-800">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-purple-100 dark:bg-gray-800">
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
              >
                <BedDouble className="h-4 w-4 mr-2" />
                대시보드
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-purple-500 data-[state=active]:text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                설정
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="space-y-6">
              <WelcomeBanner />

              {/* Preset Selector */}
              <PresetSelector presets={PRESETS} onSelectPreset={applyPreset} />

              {/* Current Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <HumidityCard
                  humidity={humidity}
                  humidifierStatus={humidifierStatus}
                  onToggleHumidifier={toggleHumidifier}
                />

                <HeartRateCard heartRate={heartRate} speakerStatus={speakerStatus} onToggleSpeaker={toggleSpeaker} />
              </div>

              {/* Speaker Volume Control */}
              {speakerStatus === "on" && <VolumeControl volume={volume} onVolumeChange={setVolume} />}

              {/* Sleep Records - 향상된 버전 사용 */}
              <EnhancedSleepRecords allRecords={sleepRecords} />
            </TabsContent>

            <TabsContent value="settings">
              <AutomationSettings
                automationEnabled={automationEnabled}
                setAutomationEnabled={setAutomationEnabled}
                humidityThreshold={humidityThreshold}
                setHumidityThreshold={setHumidityThreshold}
                heartRateThreshold={heartRateThreshold}
                setHeartRateThreshold={setHeartRateThreshold}
                onSave={saveSettings}
              />
            </TabsContent>
          </Tabs>
        </div>

        <DashboardFooter />
      </div>
    </div>
  )
}
