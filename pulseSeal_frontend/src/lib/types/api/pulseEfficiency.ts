interface PulseEfficiencyData {
  _id: string
  greenCount: number
  yellowCount: number
  redCount: number
  totalTasks: number
  approvedCount: number
  sealSubmissionRate: number
  attendanceAverage: number
  efficiency: number
  month: string
  year: number
}
 
interface LeaderboardData {
  monthYear: string
  leaderboard: Array<{
    userId: string
    userName: string
    efficiency: number
    attendanceAverage: number
    greenCount: number
    yellowCount: number
    redCount: number
    totalTasks: number
  }>
  topper: {
    userId: string
    userName: string
    efficiency: number
  }
}
 
interface PulseEfficiencyState {
  weeklyData: PulseEfficiencyData[]
  monthlyData: PulseEfficiencyData[]
  yearlyData: PulseEfficiencyData[]
  leaderboard: LeaderboardData[]
  loading: boolean
  error: string | null
}
 
const initialState: PulseEfficiencyState = {
  weeklyData: [],
  monthlyData: [],
  yearlyData: [],
  leaderboard: [],
  loading: false,
  error: null,
}
 