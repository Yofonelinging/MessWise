/**
 * WeatherService — fetches weather data for prediction modifiers.
 *
 * Uses OpenWeatherMap free tier.  Falls back to a neutral forecast
 * if no API key is configured so the rest of the pipeline still works.
 */

const OWM_BASE = "https://api.openweathermap.org/data/2.5/weather";

/**
 * @param {string} city  – city name, e.g. "Hyderabad"
 * @returns {{ temperature: number, condition: string, isRainy: boolean }}
 */
export async function fetchWeather(city = "Hyderabad") {
    const apiKey = process.env.OWM_API_KEY;

    // If no key configured, return neutral values so prediction still runs
    if (!apiKey) {
        return { temperature: 30, condition: "clear", isRainy: false };
    }

    try {
        const res = await fetch(`${OWM_BASE}?q=${city}&units=metric&appid=${apiKey}`);
        const data = await res.json();

        const main = data.weather?.[0]?.main?.toLowerCase() || "clear";
        const isRainy = ["rain", "drizzle", "thunderstorm"].includes(main);
        const temperature = Math.round(data.main?.temp ?? 30);

        return { temperature, condition: main, isRainy };
    } catch {
        return { temperature: 30, condition: "clear", isRainy: false };
    }
}

// ── In-memory daily cache ──────────────────────────────────
let _cache = { date: null, data: null };

export async function getWeatherCached(city) {
    const today = new Date().toISOString().split("T")[0];
    if (_cache.date === today && _cache.data) return _cache.data;

    const data = await fetchWeather(city);
    _cache = { date: today, data };
    return data;
}
