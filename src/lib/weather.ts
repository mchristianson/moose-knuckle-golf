export interface WeatherData {
  tempF: number
  cloudCoverPct: number
  rainChancePct: number
}

export async function getWeatherForRound(roundDate: string): Promise<WeatherData | null> {
  const lat = process.env.WEATHER_LAT
  const lng = process.env.WEATHER_LNG
  if (!lat || !lng) return null

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${lat}&longitude=${lng}` +
      `&daily=temperature_2m_max,precipitation_probability_max,cloud_cover_mean` +
      `&temperature_unit=fahrenheit` +
      `&forecast_days=16` +
      `&timezone=auto`

    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null

    const json = await res.json()
    const dates: string[] = json.daily?.time ?? []
    const idx = dates.indexOf(roundDate)
    if (idx === -1) return null

    return {
      tempF: Math.round(json.daily.temperature_2m_max[idx]),
      cloudCoverPct: Math.round(json.daily.cloud_cover_mean[idx]),
      rainChancePct: Math.round(json.daily.precipitation_probability_max[idx]),
    }
  } catch {
    return null
  }
}
