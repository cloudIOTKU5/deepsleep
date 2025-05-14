"use client"

import { useState, useEffect } from "react"
import { Moon, Stars, ChevronLeft, ChevronRight, Search, Calendar, ArrowUpDown, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SleepRecord {
  date: string
  averageHumidity: number
  averageHeartRate: number
  sleepQualityScore: number
}

interface EnhancedSleepRecordsProps {
  allRecords: SleepRecord[]
}

export function EnhancedSleepRecords({ allRecords }: EnhancedSleepRecordsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [dateFilter, setDateFilter] = useState("all")
  const [sortBy, setSortBy] = useState("date-desc")
  const [qualityFilter, setQualityFilter] = useState("all")
  const [viewMode, setViewMode] = useState("table")
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [filteredRecords, setFilteredRecords] = useState<SleepRecord[]>(allRecords)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const recordsPerPage = 5

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...allRecords]
    const activeFiltersList: string[] = []

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.date.toLowerCase().includes(searchTerm.toLowerCase())
      )
      activeFiltersList.push(`검색: ${searchTerm}`)
    }

    // Date filter
    if (dateFilter !== "all") {
      const today = new Date()
      const filterDate = new Date()
      
      switch(dateFilter) {
        case "today":
          // Today's date
          activeFiltersList.push("오늘")
          filtered = filtered.filter(record => {
            const recordDate = new Date(record.date)
            return recordDate.toDateString() === today.toDateString()
          })
          break
        case "week":
          // Last 7 days
          filterDate.setDate(today.getDate() - 7)
          activeFiltersList.push("최근 7일")
          filtered = filtered.filter(record => {
            const recordDate = new Date(record.date)
            return recordDate >= filterDate
          })
          break
        case "month":
          // Last 30 days
          filterDate.setDate(today.getDate() - 30)
          activeFiltersList.push("최근 30일")
          filtered = filtered.filter(record => {
            const recordDate = new Date(record.date)
            return recordDate >= filterDate
          })
          break
      }
    }

    // Quality filter
    if (qualityFilter !== "all") {
      switch(qualityFilter) {
        case "high":
          filtered = filtered.filter(record => record.sleepQualityScore >= 80)
          activeFiltersList.push("높은 품질 (80+)")
          break
        case "medium":
          filtered = filtered.filter(record => 
            record.sleepQualityScore >= 60 && record.sleepQualityScore < 80
          )
          activeFiltersList.push("중간 품질 (60-79)")
          break
        case "low":
          filtered = filtered.filter(record => record.sleepQualityScore < 60)
          activeFiltersList.push("낮은 품질 (<60)")
          break
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      switch(sortBy) {
        case "date-asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case "date-desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime()
        case "quality-asc":
          return a.sleepQualityScore - b.sleepQualityScore
        case "quality-desc":
          return b.sleepQualityScore - a.sleepQualityScore
        case "humidity-asc":
          return a.averageHumidity - b.averageHumidity
        case "humidity-desc":
          return b.averageHumidity - a.averageHumidity
        case "heartrate-asc":
          return a.averageHeartRate - b.averageHeartRate
        case "heartrate-desc":
          return b.averageHeartRate - a.averageHeartRate
        default:
          return 0
      }
    })

    // Update active filters
    setActiveFilters(activeFiltersList)
    
    // Update filtered records
    setFilteredRecords(filtered)
    
    // Update total pages
    setTotalPages(Math.ceil(filtered.length / recordsPerPage))
    
    // Reset to page 1 if current page is out of bounds
    if (currentPage > Math.ceil(filtered.length / recordsPerPage)) {
      setCurrentPage(1)
    }
  }, [searchTerm, dateFilter, sortBy, qualityFilter, allRecords, currentPage])

  // Get paginated records
  const getPaginatedRecords = () => {
    const startIndex = (currentPage - 1) * recordsPerPage
    const endIndex = startIndex + recordsPerPage
    // console.log("slice Records:", filteredRecords.slice(startIndex, endIndex))
    return filteredRecords.slice(startIndex, endIndex)
  }

  // Get quality color
  const getQualityColor = (score: number) => {
    if (score >= 80) return "text-green-500 dark:text-green-400"
    if (score >= 60) return "text-yellow-500 dark:text-yellow-400"
    return "text-red-500 dark:text-red-400"
  }

  // Get quality badge
  const getQualityBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-500 dark:bg-green-600">좋음</Badge>
    if (score >= 60) return <Badge className="bg-yellow-500 dark:bg-yellow-600">보통</Badge>
    return <Badge className="bg-red-500 dark:bg-red-600">나쁨</Badge>
  }

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("")
    setDateFilter("all")
    setSortBy("date-desc")
    setQualityFilter("all")
    setCurrentPage(1)
  }

  // Clear a specific filter
  const clearFilter = (filter: string) => {
    if (filter.startsWith("검색:")) {
      setSearchTerm("")
    } else if (filter === "오늘" || filter === "최근 7일" || filter === "최근 30일") {
      setDateFilter("all")
    } else if (filter.includes("품질")) {
      setQualityFilter("all")
    }
  }

  return (
    <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
      <Card className="border-purple-200 bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 dark:border-gray-700">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-purple-800 dark:text-gray-100 flex items-center gap-2">
                <Moon className="h-5 w-5 text-purple-600 dark:text-purple-400" /> 수면 기록
              </CardTitle>
              <CardDescription>최근 수면 품질 데이터</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="table">테이블</TabsTrigger>
                <TabsTrigger value="cards">카드</TabsTrigger>
              </TabsList>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              <Input
                placeholder="날짜로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-white dark:bg-gray-800"
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[130px] bg-white dark:bg-gray-800">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="날짜 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 날짜</SelectItem>
                  <SelectItem value="today">오늘</SelectItem>
                  <SelectItem value="week">최근 7일</SelectItem>
                  <SelectItem value="month">최근 30일</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={qualityFilter} onValueChange={setQualityFilter}>
                <SelectTrigger className="w-[130px] bg-white dark:bg-gray-800">
                  <Stars className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="품질 필터" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 품질</SelectItem>
                  <SelectItem value="high">높은 품질 (80+)</SelectItem>
                  <SelectItem value="medium">중간 품질 (60-79)</SelectItem>
                  <SelectItem value="low">낮은 품질 (60-)</SelectItem>
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="bg-white dark:bg-gray-800">
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    정렬
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="end">
                  <div className="p-2">
                    <div className="font-medium mb-1">정렬 기준</div>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date-desc">날짜 (최신순)</SelectItem>
                        <SelectItem value="date-asc">날짜 (오래된순)</SelectItem>
                        <SelectItem value="quality-desc">품질 (높은순)</SelectItem>
                        <SelectItem value="quality-asc">품질 (낮은순)</SelectItem>
                        <SelectItem value="humidity-desc">습도 (높은순)</SelectItem>
                        <SelectItem value="humidity-asc">습도 (낮은순)</SelectItem>
                        <SelectItem value="heartrate-desc">심박수 (높은순)</SelectItem>
                        <SelectItem value="heartrate-asc">심박수 (낮은순)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-neutral-500 dark:text-neutral-400">활성 필터:</span>
              {activeFilters.map((filter, index) => (
                <Badge 
                  key={index} 
                  variant="secondary"
                  className="flex items-center gap-1 bg-purple-100 text-purple-800 dark:bg-gray-700 dark:text-gray-200"
                >
                  {filter}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => clearFilter(filter)}
                  />
                </Badge>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters}
                className="h-7 text-xs"
              >
                모두 지우기
              </Button>
            </div>
          )}
          
          {/* Table View */}
          <TabsContent value="table" className="m-0">
            <div className="rounded-lg overflow-hidden border border-neutral-200 border-purple-100 dark:border-gray-700 dark:border-neutral-800">
              <Table>
                <TableHeader className="bg-purple-50 dark:bg-gray-800">
                  <TableRow>
                    <TableHead className="text-purple-800 dark:text-gray-200">날짜</TableHead>
                    <TableHead className="text-purple-800 dark:text-gray-200">평균 습도</TableHead>
                    <TableHead className="text-purple-800 dark:text-gray-200">평균 심박수</TableHead>
                    <TableHead className="text-purple-800 dark:text-gray-200">수면 품질</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getPaginatedRecords().length > 0 ? (
                    getPaginatedRecords().map((record, index) => (
                      <TableRow key={index} className={index % 2 === 0 ? "bg-purple-50/50 dark:bg-gray-800/50" : ""}>
                        <TableCell className="font-medium">{record.date}</TableCell>
                        <TableCell>{record.averageHumidity}%</TableCell>
                        <TableCell>{record.averageHeartRate} bpm</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={getQualityColor(record.sleepQualityScore)}>
                              {record.sleepQualityScore}
                            </span>
                            {getQualityBadge(record.sleepQualityScore)}
                            {record.sleepQualityScore >= 80 && <Stars className="h-4 w-4 text-yellow-500" />}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-purple-600 dark:text-purple-400">
                        {activeFilters.length > 0 ? "필터에 맞는 기록이 없습니다" : "수면 기록이 없습니다"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          {/* Card View */}
          <TabsContent value="cards" className="m-0">
            {getPaginatedRecords().length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getPaginatedRecords().map((record, index) => (
                  <Card key={index} className="border-purple-100 dark:border-gray-700">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{record.date}</CardTitle>
                        {getQualityBadge(record.sleepQualityScore)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-500 dark:text-neutral-400">수면 품질:</span>
                          <div className="flex items-center gap-1">
                            <span className={`font-bold ${getQualityColor(record.sleepQualityScore)}`}>
                              {record.sleepQualityScore}
                            </span>
                            {record.sleepQualityScore >= 80 && <Stars className="h-3 w-3 text-yellow-500" />}
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-500 dark:text-neutral-400">평균 습도:</span>
                          <span className="font-medium">{record.averageHumidity}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-neutral-500 dark:text-neutral-400">평균 심박수:</span>
                          <span className="font-medium">{record.averageHeartRate} bpm</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-purple-600 dark:text-purple-400">
                {activeFilters.length > 0 ? "필터에 맞는 기록이 없습니다" : "수면 기록이 없습니다"}
              </div>
            )}
          </TabsContent>
        </CardContent>
        
        <CardFooter className="flex justify-between items-center border-t border-purple-100 dark:border-gray-700 bg-purple-50/50 dark:bg-gray-800/50 px-6 py-3">
          <div className="text-sm text-purple-600 dark:text-purple-400">
            {totalPages > 0 ? `페이지 ${currentPage} / ${totalPages}` : "데이터 없음"}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-8 w-8 p-0 border-purple-200 dark:border-gray-700"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">이전 페이지</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-8 w-8 p-0 border-purple-200 dark:border-gray-700"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">다음 페이지</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </Tabs>
  )
}
