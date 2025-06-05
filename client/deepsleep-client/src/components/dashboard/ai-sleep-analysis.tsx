"use client"

import { useState, useEffect } from "react"
import {
  Brain,
  TrendingUp,
  Lightbulb,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Thermometer,
  RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  fetchInsights,
  fetchPrediction,
  fetchTrends,
  type SleepAnalysisRequest,
  type InsightsResponse,
  type PredictionResponse,
  type TrendsResponse,
} from "@/lib/sleep-analysis-api"

interface AnalysisData {
  humidity: number
  heartRate: number
  humidifierStatus: string
  speakerStatus: string
  volume: number
  sleepRecords: Array<{
    date: string
    averageHumidity: number
    averageHeartRate: number
    sleepQualityScore: number
  }>
}

interface AISleepAnalysisProps {
  analysisData: AnalysisData
}

export function AISleepAnalysis({ analysisData }: AISleepAnalysisProps) {
  const [insights, setInsights] = useState<InsightsResponse["data"]["insights"]>([])
  const [prediction, setPrediction] = useState<PredictionResponse["data"] | null>(null)
  const [trends, setTrends] = useState<TrendsResponse["data"] | null>(null)
  const [isLoading, setIsLoading] = useState<{ [key: string]: boolean }>({
    insights: false,
    prediction: false,
    trends: false,
  })
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<{ [key: string]: Date }>({})

  // API 요청 데이터 생성
  const createRequest = (): SleepAnalysisRequest => ({
    currentEnvironment: {
      humidity: analysisData.humidity,
      heartRate: analysisData.heartRate,
      humidifierStatus: analysisData.humidifierStatus,
      speakerStatus: analysisData.speakerStatus,
      volume: analysisData.volume,
    },
    sleepHistory: analysisData.sleepRecords.slice(0, 7), // 최근 7일
  })

  // 인사이트 가져오기
  const loadInsights = async (force = false) => {
    if (isLoading.insights && !force) return

    setIsLoading((prev) => ({ ...prev, insights: true }))
    setError(null)

    try {
      const response = await fetchInsights(createRequest())

      if (response.success) {
        setInsights(response.data.insights)
        setLastUpdated((prev) => ({ ...prev, insights: new Date(response.data.generatedAt) }))
      } else {
        setError(response.error || "인사이트를 가져오는데 실패했습니다")
      }
    } catch (err) {
      setError(`인사이트 로딩 중 오류: ${err instanceof Error ? err.message : "알 수 없는 오류"}`)
    } finally {
      setIsLoading((prev) => ({ ...prev, insights: false }))
    }
  }

  // 예측 가져오기
  const loadPrediction = async (force = false) => {
    if (isLoading.prediction && !force) return

    setIsLoading((prev) => ({ ...prev, prediction: true }))
    setError(null)

    try {
      const response = await fetchPrediction(createRequest())

      if (response.success) {
        setPrediction(response.data)
        setLastUpdated((prev) => ({ ...prev, prediction: new Date(response.data.generatedAt) }))
      } else {
        setError(response.error || "예측을 가져오는데 실패했습니다")
      }
    } catch (err) {
      setError(`예측 로딩 중 오류: ${err instanceof Error ? err.message : "알 수 없는 오류"}`)
    } finally {
      setIsLoading((prev) => ({ ...prev, prediction: false }))
    }
  }

  // 트렌드 가져오기
  const loadTrends = async (force = false) => {
    if (isLoading.trends && !force) return

    setIsLoading((prev) => ({ ...prev, trends: true }))
    setError(null)

    try {
      const response = await fetchTrends(createRequest())

      if (response.success) {
        setTrends(response.data)
        setLastUpdated((prev) => ({ ...prev, trends: new Date(response.data.generatedAt) }))
      } else {
        setError(response.error || "트렌드를 가져오는데 실패했습니다")
      }
    } catch (err) {
      setError(`트렌드 로딩 중 오류: ${err instanceof Error ? err.message : "알 수 없는 오류"}`)
    } finally {
      setIsLoading((prev) => ({ ...prev, trends: false }))
    }
  }

  // 초기 로드 및 데이터 변경 시 자동 분석
  useEffect(() => {
    loadInsights()
  }, [analysisData.humidity, analysisData.heartRate, analysisData.humidifierStatus, analysisData.speakerStatus])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "positive":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "suggestion":
        return <Lightbulb className="h-4 w-4 text-blue-500" />
      default:
        return <Brain className="h-4 w-4" />
    }
  }

  const getFactorIcon = (impact: string) => {
    switch (impact) {
      case "positive":
        return <TrendingUp className="h-3 w-3 text-green-500" />
      case "negative":
        return <AlertTriangle className="h-3 w-3 text-red-500" />
      default:
        return <Target className="h-3 w-3 text-gray-500" />
    }
  }

  const getInsightBorderColor = (type: string) => {
    switch (type) {
      case "positive":
        return "border-l-green-500"
      case "warning":
        return "border-l-yellow-500"
      case "suggestion":
        return "border-l-blue-500"
      default:
        return "border-l-purple-500"
    }
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case "declining":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Target className="h-4 w-4 text-gray-500" />
    }
  }

  const formatLastUpdated = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) return "방금 전"
    if (minutes < 60) return `${minutes}분 전`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}시간 전`
    return date.toLocaleDateString()
  }

  return (
    <Card className="border-purple-200 bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-purple-800 dark:text-gray-100 flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          AI 수면환경 분석
        </CardTitle>
        <CardDescription>AI가 실시간으로 분석한 수면 환경과 개선 제안사항</CardDescription>
      </CardHeader>

      <CardContent>
        {error && (
          <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="insights" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="insights">인사이트</TabsTrigger>
            <TabsTrigger value="prediction">수면 예측</TabsTrigger>
            <TabsTrigger value="trends">트렌드</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {lastUpdated.insights && `마지막 업데이트: ${formatLastUpdated(lastUpdated.insights)}`}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadInsights(true)}
                disabled={isLoading.insights}
                className="h-8"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isLoading.insights ? "animate-spin" : ""}`} />
                새로고침
              </Button>
            </div>

            {isLoading.insights ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-purple-600">
                  <Brain className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">AI가 환경을 분석하고 있습니다...</span>
                </div>
                <Progress value={66} className="w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                {insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-4 border-l-4 ${getInsightBorderColor(insight.type)} bg-white dark:bg-gray-800 rounded-r-lg shadow-sm`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">{getInsightIcon(insight.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100">{insight.title}</h4>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant={getPriorityBadgeVariant(insight.priority)} className="text-xs">
                              {insight.priority === "high" ? "높음" : insight.priority === "medium" ? "보통" : "낮음"}
                            </Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {insight.confidence}% 신뢰도
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {insights.length === 0 && !isLoading.insights && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">분석할 데이터가 충분하지 않습니다.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="prediction" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {lastUpdated.prediction && `마지막 업데이트: ${formatLastUpdated(lastUpdated.prediction)}`}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadPrediction(true)}
                disabled={isLoading.prediction}
                className="h-8"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isLoading.prediction ? "animate-spin" : ""}`} />
                새로고침
              </Button>
            </div>

            {isLoading.prediction ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-purple-600">
                  <Brain className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">수면 품질을 예측하고 있습니다...</span>
                </div>
                <Progress value={45} className="w-full" />
              </div>
            ) : prediction ? (
              <div className="space-y-4">
                <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                  <h3 className="text-2xl font-bold text-purple-800 dark:text-purple-300 mb-2">예상 수면 품질</h3>
                  <div className="text-4xl font-bold mb-2">
                    <span
                      className={
                        prediction.qualityScore >= 80
                          ? "text-green-500"
                          : prediction.qualityScore >= 60
                            ? "text-yellow-500"
                            : "text-red-500"
                      }
                    >
                      {prediction.qualityScore}
                    </span>
                    <span className="text-lg text-muted-foreground">/100</span>
                  </div>
                  <Progress value={prediction.qualityScore} className="w-full max-w-xs mx-auto mb-3" />
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{prediction.reasoning}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    영향 요인
                  </h4>
                  <div className="space-y-2">
                    {prediction.factors.map((factor, index) => (
                      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getFactorIcon(factor.impact)}
                            <span className="text-sm font-medium">{factor.name}</span>
                          </div>
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded ${
                              factor.impact === "positive"
                                ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                : factor.impact === "negative"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {factor.value}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{factor.explanation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Button onClick={() => loadPrediction()} disabled={isLoading.prediction}>
                  수면 품질 예측 시작
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {lastUpdated.trends && `마지막 업데이트: ${formatLastUpdated(lastUpdated.trends)}`}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadTrends(true)}
                disabled={isLoading.trends}
                className="h-8"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${isLoading.trends ? "animate-spin" : ""}`} />
                새로고침
              </Button>
            </div>

            {isLoading.trends ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-purple-600">
                  <Brain className="h-4 w-4 animate-pulse" />
                  <span className="text-sm">트렌드를 분석하고 있습니다...</span>
                </div>
                <Progress value={33} className="w-full" />
              </div>
            ) : trends ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">습도 트렌드</span>
                      </div>
                      {getTrendIcon(trends.humidityTrend.trend)}
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                      {trends.humidityTrend.current}%
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      주간 평균: {trends.humidityTrend.weeklyAverage}%
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{trends.humidityTrend.analysis}</p>
                  </Card>

                  <Card className="p-4 border-pink-200 dark:border-pink-800">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-pink-500" />
                        <span className="text-sm font-medium">심박수 트렌드</span>
                      </div>
                      {getTrendIcon(trends.heartRateTrend.trend)}
                    </div>
                    <div className="text-2xl font-bold text-pink-600 dark:text-pink-400 mb-1">
                      {trends.heartRateTrend.current} bpm
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      주간 평균: {trends.heartRateTrend.weeklyAverage} bpm
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{trends.heartRateTrend.analysis}</p>
                  </Card>
                </div>

                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <strong>주간 분석:</strong> {trends.weeklyAnalysis}
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="text-center py-8">
                <Button onClick={() => loadTrends()} disabled={isLoading.trends}>
                  트렌드 분석 시작
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
