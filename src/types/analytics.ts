// Types for GOL360 API Analytics Response

export interface HeatMapData {
  team: string
  period: string
  screenshot: string
}

export interface HeatMapEntry {
  tournament_id: string
  match_id: string
  team: string
  data_type: 'heatMap'
  data: HeatMapData[]
  dataType: 'array'
  itemCount: number
  source_file: string
  source_page: string
  processing_version: string
  processor: string
  raw_data_sample: string
  processed_at: string
}

export interface HighlightVideo {
  team: string
  index: number
  tag: string
  timecode: string
  timeInSeconds: number
  videoUrl: string
  rawJson: string
}

export interface HighlightsEntry {
  tournament_id: string
  match_id: string
  team: string
  data_type: 'highlights'
  highlights: HighlightVideo[]
  dataType: 'array'
  itemCount: number
  source_file: string
  source_page: string
  processing_version: string
  processor: string
  processed_at: string
}

export interface PassNetworkData {
  players: Array<{
    playerId: string
    playerName: string
    position: { x: number; y: number }
  }>
  passes: Array<{
    from: string
    to: string
    count: number
  }>
}

export interface PassNetworkEntry {
  tournament_id: string
  match_id: string
  team: string
  data_type: 'passNetwork'
  data: PassNetworkData
  source_file: string
  source_page: string
  processing_version: string
  processor: string
  processed_at: string
}

export interface PlayerStatsData {
  playerName: string
  position: string
  minutesPlayed: number
  goals: number
  assists: number
  shots: number
  passes: number
  tackles: number
  fouls: number
}

export interface PlayerStatsEntry {
  tournament_id: string
  match_id: string
  team: string
  data_type: 'playerStats'
  data: PlayerStatsData[]
  dataType: 'array'
  itemCount: number
  source_file: string
  source_page: string
  processing_version: string
  processor: string
  processed_at: string
}

export interface AnalyticsResponse {
  tournament_id: string
  match_id: string
  teams: string[]
  data: {
    heatMap?: HeatMapEntry[]
    highlights?: HighlightsEntry[]
    passNetwork?: PassNetworkEntry[]
    playerStats?: PlayerStatsEntry[]
    [key: string]: unknown
  }
}
