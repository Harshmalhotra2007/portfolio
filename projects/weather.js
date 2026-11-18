// ==========================================
// Premium Weather Dashboard JavaScript Core
// ==========================================

// 1. API Configuration - Free Open-Meteo API integration (No API keys required!)
// Using Open-Meteo and Open-Meteo Geocoding API for zero-auth weather lookup

// 2. Select HTML Elements
const cityInput = document.getElementById("city-input");
const searchBtn = document.getElementById("search-btn");
const locationBtn = document.getElementById("location-btn");
const unitToggle = document.getElementById("unit-toggle");
const themeToggle = document.getElementById("theme-toggle");
const shareBtn = document.getElementById("share-btn");

const cityName = document.getElementById("city-name");
const currentDate = document.getElementById("current-date");
const weatherDescription = document.getElementById("weather-description");
const temperature = document.getElementById("temperature");
const weatherIconContainer = document.getElementById("weather-icon-container");

const feelsLike = document.getElementById("feels-like");
const tempMinMax = document.getElementById("temp-minmax");
const humidity = document.getElementById("humidity");
const windSpeed = document.getElementById("wind-speed");
const pressure = document.getElementById("pressure");
const visibility = document.getElementById("visibility");

const suggestionsDropdown = document.getElementById("suggestions-dropdown");
const historyTags = document.getElementById("history-tags");
const clearHistoryBtn = document.getElementById("clear-history-btn");

const errorMessageCard = document.getElementById("error-message");
const closeErrorBtn = document.getElementById("close-error-btn");

// Weather overlay container
const weatherOverlay = document.getElementById("weather-overlay");

// XSS prevention: HTML escape utility for user data
function escapeHTMLEncode(str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]+/g, function(c) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[c] || c;
  });
}

// Modal Overlay & Card selectors
const detailsModal = document.getElementById("details-modal");
const modalCloseBtn = document.getElementById("modal-close-btn");
const modalBody = document.getElementById("modal-body");

const humidityCard = document.getElementById("humidity-card");
const windCard = document.getElementById("wind-card");
const pressureCard = document.getElementById("pressure-card");
const aqiCard = document.getElementById("aqi-card");

// 3. Application State
let currentWeatherData = null;
let currentAqiData = null;
let currentForecastData = null;
let currentUnit = localStorage.getItem("weatherUnit") || "C";
let currentDarkTheme = localStorage.getItem("darkTheme") || "disabled";

// Read and migrate history strings to objects
let rawHistory = JSON.parse(localStorage.getItem("searchHistory")) || [
  "Navi Mumbai",
];
let searchHistory = rawHistory.map((item) => {
  if (typeof item === "string") {
    return { name: item, pinned: false };
  }
  return item;
});

// Pre-configured popular global cities for autocomplete
const popularCities = [
  "New York",
  "London",
  "Tokyo",
  "Paris",
  "Sydney",
  "Mumbai",
  "Delhi",
  "Navi Mumbai",
  "Dubai",
  "Singapore",
  "Berlin",
  "Toronto",
  "Chicago",
  "Los Angeles",
  "Rome",
];

// Highlighted index for suggestion key navigation
let activeSuggestionIndex = -1;

// 4. Initialize Application
window.addEventListener("DOMContentLoaded", () => {
  // Register service worker for caching Open-Meteo responses
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("sw.js")
      .then(() => console.log("Service Worker registered successfully"))
      .catch((err) =>
        console.error("Service Worker registration failed:", err),
      );
  }

  // Sync toggle states
  unitToggle.checked = currentUnit === "F";
  if (themeToggle) {
    themeToggle.checked = currentDarkTheme === "enabled";
    themeToggle.addEventListener("change", toggleDarkTheme);
  }
  applyDarkTheme();

  if (shareBtn) {
    shareBtn.addEventListener("click", shareWeatherUrl);
  }

  // Render search history tags
  renderHistoryTags();

  // Close buttons setup
  closeErrorBtn.addEventListener("click", hideError);
  document.getElementById("close-alert-btn").addEventListener("click", () => {
    document.getElementById("alert-banner").classList.add("hidden");
  });

  // Modal Close Listeners
  modalCloseBtn.addEventListener("click", closeModal);
  detailsModal.addEventListener("click", (e) => {
    if (e.target === detailsModal) {
      closeModal();
    }
  });

  // Modal Open Listeners
  humidityCard.addEventListener("click", () => openDetailModal("humidity"));
  windCard.addEventListener("click", () => openDetailModal("wind"));
  pressureCard.addEventListener("click", () => openDetailModal("pressure"));
  aqiCard.addEventListener("click", () => openDetailModal("aqi"));
  // Keyboard support for expand icons (WCAG 2.1.1/2.1.2)
  function addKeydown(card, type) {
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDetailModal(type);
      }
    });
  }
  addKeydown(humidityCard, "humidity");
  addKeydown(windCard, "wind");
  addKeydown(pressureCard, "pressure");
  addKeydown(aqiCard, "aqi");

  // Check for shared URL query parameters first, then fall back to geolocation or history
  const urlParams = new URLSearchParams(window.location.search);
  const urlCity = urlParams.get("city");

  if (urlCity) {
    checkWeather(urlCity);
  } else if (!localStorage.getItem("searchHistory") && navigator.geolocation) {
    cityName.textContent = "Detecting location...";
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        checkWeatherByCoords(lat, lon);
      },
      (_error) => {
        checkWeather("Navi Mumbai");
      },
      { timeout: 5000 },
    );
  } else {
    const initialCity =
      searchHistory.length > 0 ? searchHistory[0].name : "Navi Mumbai";
    checkWeather(initialCity);
  }

  // Initialize Lucide Icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
});

// 5. Autocomplete / Suggestions System

// Render suggestions list in UI
// Debounce utility
function debounce(func, delay = 250) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

function showSuggestions(query) {
  const cleanQuery = query.toLowerCase().trim();
  suggestionsDropdown.innerHTML = "";
  activeSuggestionIndex = -1;

  if (cleanQuery === "") {
    if (searchHistory.length === 0) {
      suggestionsDropdown.classList.add("hidden");
      return;
    }

    searchHistory.forEach((item) => {
      const div = createSuggestionItem(item.name, "history");
      suggestionsDropdown.appendChild(div);
    });
  } else {
    const allMatches = new Set();

    // Check history matches first
    searchHistory.forEach((item) => {
      if (item.name.toLowerCase().includes(cleanQuery)) {
        allMatches.add(item.name);
      }
    });

    // Check popular cities matches
    popularCities.forEach((city) => {
      if (city.toLowerCase().includes(cleanQuery)) {
        allMatches.add(city);
      }
    });

    if (allMatches.size === 0) {
      suggestionsDropdown.classList.add("hidden");
      return;
    }

    allMatches.forEach((city) => {
      const isHist = searchHistory.some(
        (h) => h.name.toLowerCase() === city.toLowerCase(),
      );
      const type = isHist ? "history" : "map-pin";
      const div = createSuggestionItem(city, type);
      suggestionsDropdown.appendChild(div);
    });
  }

  suggestionsDropdown.classList.remove("hidden");
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

// Create a single autocomplete item node
function createSuggestionItem(city, iconType) {
  const div = document.createElement("div");
  div.className = "suggestion-item";
  const sanitizedCity = escapeHTMLEncode(city);
  div.innerHTML = `
    <i data-lucide="${iconType}" class="suggestion-icon"></i>
    <span>${sanitizedCity}</span>
  `;

  // Use mousedown instead of click to prevent input blur from firing first
  div.addEventListener("mousedown", (e) => {
    e.preventDefault();
    cityInput.value = sanitizedCity;
    suggestionsDropdown.classList.add("hidden");
    checkWeather(sanitizedCity);
  });

  return div;
}

// Keyboard Navigation for Suggestions List
cityInput.addEventListener("keydown", (e) => {
  const items = suggestionsDropdown.querySelectorAll(".suggestion-item");
  if (suggestionsDropdown.classList.contains("hidden") || items.length === 0) {
    return;
  }

  if (e.key === "ArrowDown") {
    e.preventDefault();
    activeSuggestionIndex = (activeSuggestionIndex + 1) % items.length;
    updateActiveSuggestion(items);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    activeSuggestionIndex =
      (activeSuggestionIndex - 1 + items.length) % items.length;
    updateActiveSuggestion(items);
  } else if (e.key === "Enter") {
    if (activeSuggestionIndex >= 0 && activeSuggestionIndex < items.length) {
      e.preventDefault();
      const selectedCity =
        items[activeSuggestionIndex].querySelector("span").textContent;
      cityInput.value = selectedCity;
      suggestionsDropdown.classList.add("hidden");
      checkWeather(selectedCity);
    }
  } else if (e.key === "Escape") {
    suggestionsDropdown.classList.add("hidden");
  }
});

// Update visual active styling for arrow keys navigation
function updateActiveSuggestion(items) {
  items.forEach((item, index) => {
    if (index === activeSuggestionIndex) {
      item.classList.add("active");
      item.scrollIntoView({ block: "nearest" });
    } else {
      item.classList.remove("active");
    }
  });
}

// Suggestion event listeners
cityInput.addEventListener(
  "input",
  debounce((e) => showSuggestions(e.target.value), 250),
);
cityInput.addEventListener("focus", (e) => showSuggestions(e.target.value));
cityInput.addEventListener("blur", () => {
  setTimeout(() => {
    suggestionsDropdown.classList.add("hidden");
  }, 180);
});

// 6. Search History (LocalStorage) Management

function saveSearch(city) {
  if (!city) return;
  const formattedCity = city.trim();

  // Find if it was already pinned
  const existingIndex = searchHistory.findIndex(
    (item) => item.name.toLowerCase() === formattedCity.toLowerCase(),
  );
  let wasPinned = false;
  if (existingIndex !== -1) {
    wasPinned = searchHistory[existingIndex].pinned;
    searchHistory.splice(existingIndex, 1);
  }

  // Add to front of history list
  searchHistory.unshift({ name: formattedCity, pinned: wasPinned });

  if (searchHistory.length > 8) {
    searchHistory.pop();
  }

  localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
  renderHistoryTags();
}

function renderHistoryTags() {
  historyTags.innerHTML = "";

  if (searchHistory.length === 0) {
    clearHistoryBtn.classList.add("hidden");
    return;
  }

  clearHistoryBtn.classList.remove("hidden");

  // Sort history: pinned items first
  const sortedHistory = [...searchHistory].sort(
    (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0),
  );

  sortedHistory.forEach((item) => {
    const tag = document.createElement("span");
    tag.className = "history-tag";
    const sanitizedName = escapeHTMLEncode(item.name);
    const actionLabel = item.pinned ? "Unpin location" : "Pin location";
    tag.innerHTML = `
      <span class="tag-name">${sanitizedName}</span>
      <button class="pin-tag-btn ${item.pinned ? "pinned" : ""}" title="${actionLabel}">
        <i data-lucide="pin"></i>
      </button>
    `;

    tag.querySelector(".tag-name").addEventListener("click", () => {
      cityInput.value = sanitizedName;
      checkWeather(sanitizedName);
    });

    tag.querySelector(".pin-tag-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      togglePinCity(item.name);
    });

    historyTags.appendChild(tag);
  });

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

function togglePinCity(cityNameStr) {
  const idx = searchHistory.findIndex(
    (item) => item.name.toLowerCase() === cityNameStr.toLowerCase(),
  );
  if (idx !== -1) {
    searchHistory[idx].pinned = !searchHistory[idx].pinned;
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
    renderHistoryTags();
  }
}

clearHistoryBtn.addEventListener("click", () => {
  searchHistory = [];
  localStorage.removeItem("searchHistory");
  renderHistoryTags();
});

// 7. Weather Fetching Service with Subqueries

// Helper to translate Open-Meteo weather code to OpenWeatherMap schema
function translateWmoCode(code, isDay) {
  const suffix = isDay ? "d" : "n";
  const mapping = {
    0: {
      id: 800,
      main: "Clear",
      description: "clear sky",
      icon: `01${suffix}`,
    },
    1: {
      id: 801,
      main: "Clear",
      description: "mainly clear",
      icon: `01${suffix}`,
    },
    2: {
      id: 802,
      main: "Clouds",
      description: "partly cloudy",
      icon: `02${suffix}`,
    },
    3: { id: 803, main: "Clouds", description: "cloudy", icon: `03${suffix}` },
    4: {
      id: 804,
      main: "Clouds",
      description: "overcast",
      icon: `04${suffix}`,
    },
    45: { id: 741, main: "Fog", description: "fog", icon: `50${suffix}` },
    48: {
      id: 741,
      main: "Fog",
      description: "depositing rime fog",
      icon: `50${suffix}`,
    },
    51: {
      id: 300,
      main: "Drizzle",
      description: "light drizzle",
      icon: `09${suffix}`,
    },
    53: {
      id: 301,
      main: "Drizzle",
      description: "moderate drizzle",
      icon: `09${suffix}`,
    },
    55: {
      id: 302,
      main: "Drizzle",
      description: "dense drizzle",
      icon: `09${suffix}`,
    },
    56: {
      id: 311,
      main: "Drizzle",
      description: "light freezing drizzle",
      icon: `09${suffix}`,
    },
    57: {
      id: 312,
      main: "Drizzle",
      description: "dense freezing drizzle",
      icon: `09${suffix}`,
    },
    61: {
      id: 500,
      main: "Rain",
      description: "slight rain",
      icon: `10${suffix}`,
    },
    63: {
      id: 501,
      main: "Rain",
      description: "moderate rain",
      icon: `10${suffix}`,
    },
    65: {
      id: 502,
      main: "Rain",
      description: "heavy rain",
      icon: `10${suffix}`,
    },
    66: {
      id: 511,
      main: "Rain",
      description: "light freezing rain",
      icon: `13${suffix}`,
    },
    67: {
      id: 511,
      main: "Rain",
      description: "heavy freezing rain",
      icon: `13${suffix}`,
    },
    71: {
      id: 600,
      main: "Snow",
      description: "slight snow fall",
      icon: `13${suffix}`,
    },
    73: {
      id: 601,
      main: "Snow",
      description: "moderate snow fall",
      icon: `13${suffix}`,
    },
    75: {
      id: 602,
      main: "Snow",
      description: "heavy snow fall",
      icon: `13${suffix}`,
    },
    77: {
      id: 611,
      main: "Snow",
      description: "snow grains",
      icon: `13${suffix}`,
    },
    80: {
      id: 520,
      main: "Rain",
      description: "slight rain showers",
      icon: `09${suffix}`,
    },
    81: {
      id: 521,
      main: "Rain",
      description: "moderate rain showers",
      icon: `09${suffix}`,
    },
    82: {
      id: 522,
      main: "Rain",
      description: "violent rain showers",
      icon: `09${suffix}`,
    },
    85: {
      id: 620,
      main: "Snow",
      description: "slight snow showers",
      icon: `13${suffix}`,
    },
    86: {
      id: 621,
      main: "Snow",
      description: "heavy snow showers",
      icon: `13${suffix}`,
    },
    95: {
      id: 200,
      main: "Thunderstorm",
      description: "thunderstorm",
      icon: `11${suffix}`,
    },
    96: {
      id: 201,
      main: "Thunderstorm",
      description: "thunderstorm with slight hail",
      icon: `11${suffix}`,
    },
    99: {
      id: 202,
      main: "Thunderstorm",
      description: "thunderstorm with heavy hail",
      icon: `11${suffix}`,
    },
  };
  return (
    mapping[code] || {
      id: 803,
      main: "Clouds",
      description: "cloudy",
      icon: `03${suffix}`,
    }
  );
}

async function checkWeather(city) {
  hideError();
  startSkeletonLoading();
  try {
    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`;
    const geoResponse = await fetch(geocodeUrl);
    if (!geoResponse.ok) {
      showError();
      return;
    }
    const geoData = await geoResponse.json();
    if (!geoData.results || geoData.results.length === 0) {
      showError("Location not found. Please check spelling.");
      return;
    }
    const location = geoData.results[0];
    await fetchWeatherDataFromOpenMeteo(
      location.latitude,
      location.longitude,
      location.name,
      location.country_code,
    );
  } catch (error) {
    console.error("Geocoding failed:", error);
    showError("Connection error. Please try again.");
  }
}

async function checkWeatherByCoords(lat, lon) {
  hideError();
  startSkeletonLoading();
  try {
    await fetchWeatherDataFromOpenMeteo(lat, lon, "Current Location", "LOC");
  } catch (error) {
    console.error("Fetch by coords failed:", error);
    showError("Connection error. Please try again.");
  }
}

async function fetchWeatherDataFromOpenMeteo(
  lat,
  lon,
  cityNameResolved,
  countryCodeResolved,
) {
  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,weather_code,is_day&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min,moon_phase&timezone=auto`;
    const response = await fetch(weatherUrl);
    if (!response.ok) {
      showError();
      return;
    }

    const rawData = await response.json();
    const translatedWeather = translateWmoCode(
      rawData.current.weather_code,
      rawData.current.is_day === 1,
    );

    const sunriseEpoch =
      Math.floor(Date.parse(rawData.daily.sunrise[0]) / 1000) || 0;
    const sunsetEpoch =
      Math.floor(Date.parse(rawData.daily.sunset[0]) / 1000) || 0;

    currentWeatherData = {
      name: cityNameResolved,
      coord: { lat, lon },
      sys: {
        country: countryCodeResolved || "IN",
        sunrise: sunriseEpoch,
        sunset: sunsetEpoch,
      },
      main: {
        temp: rawData.current.temperature_2m,
        feels_like: rawData.current.apparent_temperature,
        temp_min: rawData.daily.temperature_2m_min[0],
        temp_max: rawData.daily.temperature_2m_max[0],
        humidity: rawData.current.relative_humidity_2m,
        pressure: Math.round(rawData.current.pressure_msl),
      },
      wind: {
        speed: rawData.current.wind_speed_10m / 3.6, // convert km/h to m/s
        deg: rawData.current.wind_direction_10m,
        gust: rawData.current.wind_gusts_10m / 3.6,
      },
      weather: [translatedWeather],
      visibility: 10000,
      timezone: rawData.utc_offset_seconds || 19800,
      moon_phase: rawData.daily.moon_phase || [],
    };

    saveSearch(cityNameResolved);

    await Promise.all([
      fetchAqiData(lat, lon),
      fetchForecastData(lat, lon),
    ]).catch((err) => {
      console.error("Subquery parallel fetch failed:", err);
    });

    renderWeather();

    if (!detailsModal.classList.contains("hidden")) {
      refreshModalContent();
    }
  } catch (error) {
    console.error("Error fetching weather:", error);
    showError("Network connection error. Please try again.");
  }
}

// Fetch Air Quality Index Data
async function fetchAqiData(lat, lon) {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const current = data.current;

      let aqiLevel = 1;
      if (current.us_aqi > 200) aqiLevel = 5;
      else if (current.us_aqi > 150) aqiLevel = 4;
      else if (current.us_aqi > 100) aqiLevel = 3;
      else if (current.us_aqi > 50) aqiLevel = 2;

      currentAqiData = {
        list: [
          {
            main: { aqi: aqiLevel },
            components: {
              pm2_5: current.pm2_5 || 0,
              pm10: current.pm10 || 0,
              no2: current.nitrogen_dioxide || 0,
              o3: current.ozone || 0,
              co: current.carbon_monoxide || 0,
              so2: current.sulphur_dioxide || 0,
            },
          },
        ],
      };
    } else {
      currentAqiData = null;
    }
  } catch (error) {
    console.error("AQI fetch failed:", error);
    currentAqiData = null;
  }
}

// Fetch Forecast Data
async function fetchForecastData(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,apparent_temperature,precipitation_probability,precipitation,uv_index,pressure_msl,shortwave_radiation,weather_code&timezone=auto`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const hourly = data.hourly;

      const listMapped = [];
      for (let i = 0; i < 48; i += 3) {
        if (hourly.time[i] && hourly.temperature_2m[i] !== undefined) {
          listMapped.push({
            dt: Math.floor(Date.parse(hourly.time[i]) / 1000),
            main: {
              temp: hourly.temperature_2m[i],
            },
            precipitation_probability: hourly.precipitation_probability
              ? hourly.precipitation_probability[i] || 0
              : 0,
            precipitation: hourly.precipitation
              ? hourly.precipitation[i] || 0
              : 0,
            uv_index: hourly.uv_index ? hourly.uv_index[i] || 0 : 0,
            weather_code: hourly.weather_code ? hourly.weather_code[i] || 0 : 0,
          });
        }
      }

      currentForecastData = {
        list: listMapped,
        hourly: hourly,
      };
    } else {
      currentForecastData = null;
    }
  } catch (error) {
    console.error("Forecast fetch failed:", error);
    currentForecastData = null;
  }
}

// 8. Render Dynamic Weather Dashboard

function renderWeather() {
  if (!currentWeatherData) return;
  const data = currentWeatherData;

  // Render Text Stats
  cityName.textContent = `${data.name}, ${data.sys.country}`;
  currentDate.textContent = formatDate();
  weatherDescription.textContent = data.weather[0].description;

  const isCelsius = currentUnit === "C";
  const tempUnitStr = isCelsius ? "C" : "F";
  const windKmh = data.wind.speed * 3.6;
  const rh = data.main.humidity;
  const tempC = data.main.temp;

  const windChill = calculateWindChill(tempC, windKmh);
  const heatIndex = calculateHeatIndex(tempC, rh);
  const tipLineEl = document.getElementById("weather-tip-line");

  if (tipLineEl) {
    if (windChill !== null) {
      const dispWindChill = isCelsius
        ? Math.round(windChill)
        : Math.round((windChill * 9) / 5 + 32);
      tipLineEl.innerHTML = `<i data-lucide="info" class="icon-sm"></i> Wind chill feels like ${dispWindChill}°${tempUnitStr}`;
      tipLineEl.classList.remove("hidden");
    } else if (heatIndex !== null) {
      const dispHeatIndex = isCelsius
        ? Math.round(heatIndex)
        : Math.round((heatIndex * 9) / 5 + 32);
      tipLineEl.innerHTML = `<i data-lucide="info" class="icon-sm"></i> Heat index feels like ${dispHeatIndex}°${tempUnitStr}`;
      tipLineEl.classList.remove("hidden");
    } else {
      tipLineEl.innerHTML = "";
      tipLineEl.classList.add("hidden");
    }
  }

  // Temperature Unit Values Calculations
  const tempCelsius = data.main.temp;
  const feelsLikeCelsius = data.main.feels_like;
  const minCelsius = data.main.temp_min;
  const maxCelsius = data.main.temp_max;

  // Apply Unit Conversions
  const dispTemp = isCelsius
    ? Math.round(tempCelsius)
    : Math.round((tempCelsius * 9) / 5 + 32);
  const dispFeels = isCelsius
    ? Math.round(feelsLikeCelsius)
    : Math.round((feelsLikeCelsius * 9) / 5 + 32);
  const dispMin = isCelsius
    ? Math.round(minCelsius)
    : Math.round((minCelsius * 9) / 5 + 32);
  const dispMax = isCelsius
    ? Math.round(maxCelsius)
    : Math.round((maxCelsius * 9) / 5 + 32);

  temperature.textContent = dispTemp;
  feelsLike.textContent = `${dispFeels}°`;
  tempMinMax.textContent = `${dispMin}° / ${dispMax}°`;

  // Day-/night-temperature difference bar
  const tempDiff = maxCelsius - minCelsius;
  const swingBar = document.getElementById("temp-swing-bar");
  const swingValue = document.getElementById("temp-swing-value");
  if (swingBar && swingValue) {
    const dispDiff = isCelsius
      ? Math.round(tempDiff)
      : Math.round((tempDiff * 9) / 5);
    swingValue.textContent = `Swing: ${dispDiff}°`;

    const isLarge = tempDiff >= 8;
    if (isLarge) {
      swingBar.classList.add("swing-large");
    } else {
      swingBar.classList.remove("swing-large");
    }
    const pct = Math.max(10, Math.min(100, Math.round((tempDiff / 15) * 100)));
    swingBar.style.width = `${pct}%`;
  }

  // Calculate Fire Danger Index
  const speedMps = data.wind.speed;
  const fireDangerVal = (tempC * (100 - rh) * speedMps) / 1000;
  let fireLevel = "Low";
  let fireColor = "#2ecc71";
  let firePct = 20;

  if (fireDangerVal >= 2.5) {
    fireLevel = "High";
    fireColor = "#e74c3c";
    firePct = 100;
  } else if (fireDangerVal >= 1.0) {
    fireLevel = "Medium";
    fireColor = "#e67e22";
    firePct = 60;
  }

  const fireLabel = document.getElementById("fire-risk-label");
  const fireBarFill = document.getElementById("fire-risk-bar-fill");
  if (fireLabel && fireBarFill) {
    fireLabel.textContent = `Fire Danger: ${fireLevel}`;
    fireBarFill.style.width = `${firePct}%`;
    fireBarFill.style.backgroundColor = fireColor;
  }

  // Accessibility: ARIA screen reader alert updates
  const srAlert = document.getElementById("sr-weather-alert");
  if (srAlert) {
    srAlert.textContent = `Weather updated for ${data.name}, ${data.sys.country}. Temperature is ${dispTemp} degrees. Conditions are ${data.weather[0].description}. Relative humidity is ${data.main.humidity} percent. Wind speed is ${Math.round(windKmh)} kilometers per hour. Fire danger index is ${fireLevel}.`;
  }

  // Standard non-temperature metrics
  humidity.textContent = `${data.main.humidity}%`;
  pressure.textContent = `${data.main.pressure} hPa`;

  // Wind Speed formatting (m/s to km/h or mph)
  if (isCelsius) {
    const speedKmh = Math.round(data.wind.speed * 3.6);
    windSpeed.textContent = `${speedKmh} km/h`;
  } else {
    const speedMph = Math.round(data.wind.speed * 2.237);
    windSpeed.textContent = `${speedMph} mph`;
  }

  // Visibility formatting (meters to km or miles)
  const visibilityVal = data.visibility || 10000;
  if (isCelsius) {
    const visibilityKm = (visibilityVal / 1000).toFixed(1);
    visibility.textContent = `${visibilityKm} km`;
  } else {
    const visibilityMi = (visibilityVal / 1609.34).toFixed(1);
    visibility.textContent = `${visibilityMi} mi`;
  }

  // Update Dynamic Icons based on weather conditions code and day/night status
  const iconCode = data.weather[0].icon;
  const weatherId = data.weather[0].id;
  const iconName = getWeatherIconName(weatherId, iconCode);

  weatherIconContainer.innerHTML = `<i data-lucide="${iconName}" class="main-weather-icon animate-float"></i>`;

  // Update Background gradient theme on body
  updateTheme(weatherId, iconCode);

  // Set up live overlay particle animations
  setWeatherOverlay(weatherId, iconCode);

  // Check and display Severe Weather Alerts
  renderSevereAlerts();

  // Render Air Quality Index
  renderAqi();

  // Render Hourly SVG Forecast Chart (deferred until window load if not completed)
  if (document.readyState === "complete") {
    renderForecastChart();
  } else {
    window.addEventListener("load", () => renderForecastChart(), {
      once: true,
    });
  }

  // Render Sunrise Sunset Progress Arc
  renderSunriseSunset();

  // Re-run Lucide parser to draw inline SVGs
  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  stopSkeletonLoading();
}

// Helper: Get Lucide Icon Key from OpenWeather ID
function getWeatherIconName(id, iconCode) {
  const isNight = iconCode.endsWith("n");

  if (id >= 200 && id < 300) return "cloud-lightning";
  if (id >= 300 && id < 400) return "cloud-drizzle";
  if (id >= 500 && id < 600) return "cloud-rain";
  if (id >= 600 && id < 700) return "snowflake";
  if (id >= 700 && id < 800) return "cloud-fog";
  if (id === 800) return isNight ? "moon" : "sun";
  if (id === 801 || id === 802) return isNight ? "cloud-moon" : "cloud-sun";
  return "cloud";
}

// Helper: Apply Body Background Theme Classes
function updateTheme(id, iconCode) {
  const isNight = iconCode.endsWith("n");
  let themeClass = "theme-clear-day";

  if (id >= 200 && id < 300) {
    themeClass = "theme-thunderstorm";
  } else if (id >= 300 && id < 600) {
    themeClass = "theme-rain";
  } else if (id >= 600 && id < 700) {
    themeClass = "theme-snow";
  } else if (id >= 700 && id < 800) {
    themeClass = "theme-mist";
  } else if (id === 800) {
    themeClass = isNight ? "theme-clear-night" : "theme-clear-day";
  } else if (id > 800) {
    themeClass = "theme-clouds";
  }

  document.body.className = "";
  document.body.classList.add(themeClass);
}

// 9. Live Weather Overlay particle generators
function setWeatherOverlay(id, iconCode) {
  weatherOverlay.innerHTML = "";
  const isNight = iconCode.endsWith("n");

  if (id >= 200 && id < 300) {
    generateLightningEffect();
    generateRaindrops(35);
  } else if (id >= 300 && id < 600) {
    generateRaindrops(45);
  } else if (id >= 600 && id < 700) {
    generateSnowflakes(35);
  } else if (id >= 700 && id < 800) {
    generateCloudDrifts(4);
  } else if (id === 800) {
    if (!isNight) {
      generateSunFlare();
    }
  } else if (id > 800) {
    generateCloudDrifts(6);
  }
}

// Generating falling animated raindrops
function generateRaindrops(count) {
  for (let i = 0; i < count; i++) {
    const drop = document.createElement("div");
    drop.className = "raindrop";
    drop.style.left = Math.random() * 100 + "vw";
    drop.style.animationDuration = Math.random() * 0.5 + 0.7 + "s";
    drop.style.animationDelay = Math.random() * 2 + "s";
    drop.style.opacity = Math.random() * 0.4 + 0.2;
    weatherOverlay.appendChild(drop);
  }
}

// Generating falling snowflake nodes
function generateSnowflakes(count) {
  for (let i = 0; i < count; i++) {
    const flake = document.createElement("div");
    flake.className = "snowflake-element";
    const size = Math.random() * 4 + 2;
    flake.style.width = size + "px";
    flake.style.height = size + "px";
    flake.style.left = Math.random() * 100 + "vw";
    flake.style.animationDuration = Math.random() * 3 + 4 + "s";
    flake.style.animationDelay = Math.random() * 5 + "s";
    flake.style.opacity = Math.random() * 0.5 + 0.4;
    weatherOverlay.appendChild(flake);
  }
}

// Generating cloud shapes
function generateCloudDrifts(count) {
  for (let i = 0; i < count; i++) {
    const cloud = document.createElement("div");
    cloud.className = "cloud-drift";
    const width = Math.random() * 180 + 100;
    const height = width * 0.6;
    cloud.style.width = width + "px";
    cloud.style.height = height + "px";
    cloud.style.top = Math.random() * 35 + "%";
    cloud.style.animationDuration = Math.random() * 40 + 45 + "s";
    cloud.style.animationDelay = -(Math.random() * 40) + "s";
    cloud.style.opacity = Math.random() * 0.05 + 0.03;
    weatherOverlay.appendChild(cloud);
  }
}

// Generating lightning flash
function generateLightningEffect() {
  const flash = document.createElement("div");
  flash.className = "storm-lightning";
  weatherOverlay.appendChild(flash);
}

// Generating sun radial glow
function generateSunFlare() {
  const sunGlow = document.createElement("div");
  sunGlow.className = "sun-ray-glow";
  weatherOverlay.appendChild(sunGlow);
}

// 10. Advanced Widget Renderers

// A. Air Quality Index (AQI) Rendering
function renderAqi() {
  const aqiBadge = document.getElementById("aqi-badge");
  const aqiIndicatorDot = document.getElementById("aqi-indicator-dot");
  const aqiRecommendation = document.getElementById("aqi-recommendation");

  if (
    !currentAqiData ||
    !currentAqiData.list ||
    currentAqiData.list.length === 0
  ) {
    return;
  }

  const aqiVal = currentAqiData.list[0].main.aqi; // 1 to 5

  aqiBadge.className = "aqi-badge";
  aqiBadge.classList.add(`level-${aqiVal}`);

  let label = "Good";
  let desc = "Excellent air quality. Great day for outdoor activities.";
  let pct = 10;

  switch (aqiVal) {
    case 1:
      label = "Good";
      desc = "Excellent air quality. Great day for outdoor activities.";
      pct = 10;
      break;
    case 2:
      label = "Fair";
      desc = "Very good air quality. Minor sensitivities for some individuals.";
      pct = 32.5;
      break;
    case 3:
      label = "Moderate";
      desc =
        "Acceptable air quality. Consider reducing heavy outdoor exertion if sensitive.";
      pct = 55;
      break;
    case 4:
      label = "Poor";
      desc =
        "Poor air quality. Sensitive groups should limit prolonged outdoor exposure.";
      pct = 77.5;
      break;
    case 5:
      label = "Very Poor";
      desc =
        "Hazardous air quality. Everyone should avoid outdoor activities and close windows.";
      pct = 90;
      break;
  }

  aqiBadge.textContent = label;
  aqiRecommendation.textContent = desc;
  aqiIndicatorDot.style.left = `${pct}%`;
}

function renderForecastChart() {
  const forecastAreaPath = document.getElementById("forecast-area-path");
  const forecastLinePath = document.getElementById("forecast-line-path");
  const forecastUvPath = document.getElementById("forecast-uv-path");
  const forecastPrecipPath = document.getElementById("forecast-precip-path");
  const forecastPointsGroup = document.getElementById("forecast-points-group");

  if (
    !currentForecastData ||
    !currentForecastData.list ||
    currentForecastData.list.length === 0
  ) {
    return;
  }

  const isCelsius = currentUnit === "C";
  const points = currentForecastData.list.slice(0, 16);

  const temps = points.map((item) => {
    const c = item.main.temp;
    return isCelsius ? c : (c * 9) / 5 + 32;
  });

  const minTemp = Math.min(...temps);
  const maxTemp = Math.max(...temps);
  const tempRange = maxTemp === minTemp ? 2 : maxTemp - minTemp;

  const width = 440;
  const height = 100;
  const paddingLeft = 30;
  const paddingTop = 30;

  const coords = points.map((item, index) => {
    const x = paddingLeft + index * (width / (points.length - 1));
    const t = temps[index];
    const y = paddingTop + (height - ((t - minTemp) / tempRange) * height);
    const offset = currentWeatherData.timezone;
    const timeStr = formatForecastTime(item.dt, offset);

    return { x, y, temp: Math.round(t), timeStr };
  });

  // Plot UV index (0 to 10 scale)
  const uvs = points.map((item) => item.uv_index || 0);
  const uvCoords = points.map((item, index) => {
    const x = paddingLeft + index * (width / (points.length - 1));
    const uvVal = uvs[index];
    const y = paddingTop + (height - (Math.min(10, uvVal) / 10) * height);
    return { x, y, uv: uvVal };
  });

  let dLine = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    dLine += ` L ${coords[i].x} ${coords[i].y}`;
  }

  let dArea = `M ${coords[0].x} ${coords[0].y}`;
  for (let i = 1; i < coords.length; i++) {
    dArea += ` L ${coords[i].x} ${coords[i].y}`;
  }
  dArea += ` L ${coords[coords.length - 1].x} 130 L ${coords[0].x} 130 Z`;

  let dUvLine = `M ${uvCoords[0].x} ${uvCoords[0].y}`;
  for (let i = 1; i < uvCoords.length; i++) {
    dUvLine += ` L ${uvCoords[i].x} ${uvCoords[i].y}`;
  }

  forecastLinePath.setAttribute("d", dLine);
  forecastAreaPath.setAttribute("d", dArea);
  if (forecastUvPath) {
    forecastUvPath.setAttribute("d", dUvLine);
  }

  // Render low-opacity precipitation area overlay when raining/drizzling
  const rainCodes = [
    51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
  ];
  const isRaining = points.some(
    (item) =>
      rainCodes.includes(item.weather_code) ||
      (item.precipitation && item.precipitation > 0),
  );

  if (forecastPrecipPath) {
    if (isRaining) {
      const precips = points.map((item) => item.precipitation || 0);
      const maxPrecip = Math.max(...precips, 2.0);

      let dPrecip = `M ${coords[0].x} 130`;
      coords.forEach((pt, index) => {
        const pVal = precips[index];
        const y = paddingTop + (height - (pVal / maxPrecip) * height);
        dPrecip += ` L ${pt.x} ${y}`;
      });
      dPrecip += ` L ${coords[coords.length - 1].x} 130 Z`;
      forecastPrecipPath.setAttribute("d", dPrecip);
    } else {
      forecastPrecipPath.setAttribute("d", "");
    }
  }

  let html = "";
  coords.forEach((pt, index) => {
    const prob = points[index].precipitation_probability || 0;
    const amt = points[index].precipitation || 0;
    const uvVal = uvCoords[index].uv;
    const uvY = uvCoords[index].y;

    // Draw Temp Points
    html += `<circle cx="${pt.x}" cy="${pt.y}" r="4" fill="var(--text-primary)" stroke="var(--accent-color)" stroke-width="2" />`;

    // Show labels on alternate points to prevent visual overlap
    if (index % 2 === 0 || points.length <= 8) {
      html += `<text x="${pt.x}" y="${pt.y - 10}" text-anchor="middle" fill="var(--text-primary)" font-size="11" font-weight="700">${pt.temp}°</text>`;

      // Render Precipitation Info
      let precipText = "";
      if (prob > 0 || amt > 0) {
        precipText = `🌧️${prob}%` + (amt > 0 ? ` (${amt.toFixed(1)}mm)` : "");
        html += `<text x="${pt.x}" y="${pt.y + 15}" text-anchor="middle" fill="#3498db" font-size="8.5" font-weight="700">${precipText}</text>`;
      }

      // Draw UV Labels
      if (uvVal > 0) {
        html += `<text x="${pt.x}" y="${uvY - 8}" text-anchor="middle" fill="#e67e22" font-size="8.5" font-weight="700">UV ${uvVal.toFixed(1)}</text>`;
      }

      html += `<text x="${pt.x}" y="150" text-anchor="middle" fill="var(--text-secondary)" font-size="10" font-weight="500">${pt.timeStr}</text>`;
    }

    // Draw UV point
    html += `<circle cx="${pt.x}" cy="${uvY}" r="3" fill="var(--text-primary)" stroke="#e67e22" stroke-width="1.5" />`;
  });

  forecastPointsGroup.innerHTML = html;
}

// C. Sunrise Sunset progress arc plotter
function renderSunriseSunset() {
  const sunElapsedPath = document.getElementById("sun-elapsed-path");
  const sunNode = document.getElementById("sun-node");
  const sunNodeGroup = document.getElementById("sun-node-group");
  const sunriseTimeLabel = document.getElementById("sunrise-time");
  const sunsetTimeLabel = document.getElementById("sunset-time");
  const sunStatusLabel = document.getElementById("sun-status-label");

  if (!currentWeatherData) return;
  const data = currentWeatherData;

  const sunrise = data.sys.sunrise;
  const sunset = data.sys.sunset;
  const offset = data.timezone;

  sunriseTimeLabel.textContent = formatLocalTime(sunrise, offset);
  sunsetTimeLabel.textContent = formatLocalTime(sunset, offset);

  const current = Math.floor(Date.now() / 1000);

  const X_c = 120;
  const Y_c = 110;
  const R = 100;

  let pct = 0;
  let isDay = false;

  if (current >= sunrise && current <= sunset) {
    isDay = true;
    pct = (current - sunrise) / (sunset - sunrise);
  } else if (current > sunset) {
    isDay = false;
    pct = 1.0;
  } else {
    isDay = false;
    pct = 0.0;
  }

  const theta = Math.PI - pct * Math.PI;
  const X_s = X_c + R * Math.cos(theta);
  const Y_s = Y_c - R * Math.sin(theta);

  sunNode.setAttribute("cx", X_s);
  sunNode.setAttribute("cy", Y_s);

  const glowRing = sunNodeGroup.querySelector(".animate-ping-sun");
  if (glowRing) {
    glowRing.setAttribute("cx", X_s);
    glowRing.setAttribute("cy", Y_s);
  }

  if (pct === 0) {
    sunElapsedPath.setAttribute("d", "");
  } else {
    sunElapsedPath.setAttribute("d", `M 20,110 A 100,100 0 0,1 ${X_s},${Y_s}`);
  }

  if (isDay) {
    const secondsLeft = sunset - current;
    const hrs = Math.floor(secondsLeft / 3600);
    const mins = Math.floor((secondsLeft % 3600) / 60);
    sunStatusLabel.textContent = `Sunset in ${hrs}h ${mins}m`;
  } else {
    const nextSunrise = current > sunset ? sunrise + 86400 : sunrise;
    const secondsToSunrise = nextSunrise - current;
    const hrs = Math.floor(secondsToSunrise / 3600);
    const mins = Math.floor((secondsToSunrise % 3600) / 60);
    sunStatusLabel.textContent = `Sunrise in ${hrs}h ${mins}m`;
  }

  // --- Daylight Portion & Illuminance Calculations ---
  const daylightDurationPercentLabel = document.getElementById(
    "daylight-duration-percent",
  );
  const sunIlluminanceValLabel = document.getElementById("sun-illuminance-val");

  if (daylightDurationPercentLabel && sunIlluminanceValLabel) {
    const daylightDurationSeconds = sunset - sunrise;
    const daylightPct = Math.round((daylightDurationSeconds / 86400) * 100);
    daylightDurationPercentLabel.textContent = `${daylightPct}%`;

    let illuminanceLux = 0;
    if (
      isDay &&
      currentForecastData &&
      currentForecastData.hourly &&
      currentForecastData.hourly.shortwave_radiation
    ) {
      const hourlyTimes = currentForecastData.hourly.time;
      const hourlyRadiation = currentForecastData.hourly.shortwave_radiation;

      const nowMs = Date.now();
      let closestIndex = 0;
      let minTimeDiff = Infinity;
      for (let i = 0; i < hourlyTimes.length; i++) {
        const itemTimeMs = Date.parse(hourlyTimes[i]);
        const diff = Math.abs(itemTimeMs - nowMs);
        if (diff < minTimeDiff) {
          minTimeDiff = diff;
          closestIndex = i;
        }
      }

      const currentRad = hourlyRadiation[closestIndex] || 0;
      illuminanceLux = Math.round(currentRad * 120);
    }
    sunIlluminanceValLabel.textContent = `${illuminanceLux.toLocaleString()} lux`;
  }

  // --- Moon Phase Calculations ---
  const moonPhaseNameEl = document.getElementById("moon-phase-name");
  const nextMoonPhaseEl = document.getElementById("next-moon-phase");
  const moonPhaseIconEl = document.getElementById("moon-phase-icon");

  if (
    data.moon_phase &&
    data.moon_phase.length > 0 &&
    moonPhaseNameEl &&
    nextMoonPhaseEl
  ) {
    const todayPhase = data.moon_phase[0]; // value from 0.0 to 1.0

    // Determine today's phase name and icon
    let phaseName = "New Moon";
    let iconName = "moon";

    if (todayPhase < 0.02 || todayPhase > 0.98) {
      phaseName = "New Moon";
      iconName = "moon";
    } else if (todayPhase >= 0.02 && todayPhase < 0.23) {
      phaseName = "Waxing Crescent";
      iconName = "moon";
    } else if (todayPhase >= 0.23 && todayPhase <= 0.27) {
      phaseName = "First Quarter";
      iconName = "moon";
    } else if (todayPhase > 0.27 && todayPhase < 0.48) {
      phaseName = "Waxing Gibbous";
      iconName = "moon";
    } else if (todayPhase >= 0.48 && todayPhase <= 0.52) {
      phaseName = "Full Moon";
      iconName = "moon-star";
    } else if (todayPhase > 0.52 && todayPhase < 0.73) {
      phaseName = "Waning Gibbous";
      iconName = "moon";
    } else if (todayPhase >= 0.73 && todayPhase <= 0.77) {
      phaseName = "Last Quarter";
      iconName = "moon";
    } else {
      phaseName = "Waning Crescent";
      iconName = "moon";
    }

    moonPhaseNameEl.textContent = phaseName;
    if (moonPhaseIconEl) {
      moonPhaseIconEl.setAttribute("data-lucide", iconName);
    }

    // Find next primary target phase
    const targets = [
      { name: "New Moon", val: 0.0 },
      { name: "First Quarter", val: 0.25 },
      { name: "Full Moon", val: 0.5 },
      { name: "Last Quarter", val: 0.75 },
      { name: "New Moon", val: 1.0 },
    ];

    let nextTarget = targets[0];
    if (todayPhase < 0.25) nextTarget = targets[1];
    else if (todayPhase < 0.5) nextTarget = targets[2];
    else if (todayPhase < 0.75) nextTarget = targets[3];
    else nextTarget = targets[4];

    let targetDayIndex = 1;
    let minDiff = Infinity;
    for (let i = 1; i < data.moon_phase.length; i++) {
      let diff = Math.abs(data.moon_phase[i] - nextTarget.val);
      if (nextTarget.val === 1.0) {
        diff = Math.min(diff, Math.abs(data.moon_phase[i] - 0.0));
      }
      if (diff < minDiff) {
        minDiff = diff;
        targetDayIndex = i;
      }
    }

    const daysWord =
      targetDayIndex === 1 ? "tomorrow" : `in ${targetDayIndex} days`;
    nextMoonPhaseEl.textContent = `${nextTarget.name} ${daysWord}`;
  }
}

// D. Severe weather alerts checker
function renderSevereAlerts() {
  const data = currentWeatherData;
  const alertBanner = document.getElementById("alert-banner");
  const alertText = document.getElementById("alert-text");

  if (!data) return;

  let alerts = [];

  const windKmh = data.wind.speed * 3.6;
  if (windKmh > 50) {
    alerts.push(
      `Extreme Wind Alert: Gusts reaching ${Math.round(windKmh)} km/h.`,
    );
  }

  const tempC = data.main.temp;
  if (tempC > 40) {
    alerts.push(
      `Extreme Heat Warning: Temperatures hitting ${Math.round(tempC)}°C.`,
    );
  } else if (tempC < -5) {
    alerts.push(
      `Extreme Cold Warning: Temperatures drop to ${Math.round(tempC)}°C.`,
    );
  }

  // Daily forecast min/max extremes check (thresholds > 38°C or < 2°C)
  if (
    currentForecastData &&
    currentForecastData.hourly &&
    currentForecastData.hourly.temperature_2m
  ) {
    const todayTemps = currentForecastData.hourly.temperature_2m.slice(0, 24);
    if (todayTemps.length > 0) {
      const todayMax = Math.max(...todayTemps);
      const todayMin = Math.min(...todayTemps);

      if (todayMax > 38) {
        alerts.push(
          `Extreme High Temperature Alert: Expected high of ${Math.round(todayMax)}°C today.`,
        );
      }
      if (todayMin < 2) {
        alerts.push(
          `Extreme Low Temperature Alert: Expected low of ${Math.round(todayMin)}°C today.`,
        );
      }
    }
  }

  const id = data.weather[0].id;
  if (id >= 200 && id < 300) {
    alerts.push(
      `Severe Storm Advisory: Heavy lighting flashes & high precipitation.`,
    );
  } else if (id === 781) {
    alerts.push(`Tornado Warning: Critical hazard. Seek shelter immediately.`);
  }

  if (alerts.length > 0) {
    alertText.textContent = alerts.join(" | ");
    alertBanner.classList.remove("hidden");
  } else {
    alertBanner.classList.add("hidden");
  }
}

// 11. Helper Time Formatters

function formatLocalTime(utcSeconds, timezoneOffset) {
  const date = new Date((utcSeconds + timezoneOffset) * 1000);
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? "0" + minutes : minutes;
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

function formatForecastTime(dt, timezoneOffset) {
  const date = new Date((dt + timezoneOffset) * 1000);
  const hours = date.getUTCHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  return `${formattedHours} ${ampm}`;
}

function formatDate() {
  const options = { weekday: "long", month: "long", day: "numeric" };
  const today = new Date();
  return today.toLocaleDateString("en-US", options);
}

// Wind Chill Calculation (Temp <= 10C and Wind >= 4.8 km/h)
function calculateWindChill(tempC, windKmh) {
  if (tempC > 10 || windKmh < 4.8) return null;
  return (
    13.12 +
    0.6215 * tempC -
    11.37 * Math.pow(windKmh, 0.16) +
    0.3965 * tempC * Math.pow(windKmh, 0.16)
  );
}

// Heat Index Calculation (Temp >= 27C)
function calculateHeatIndex(tempC, rh) {
  if (tempC < 27) return null;
  const T = (tempC * 9) / 5 + 32;
  let hi = 0.5 * (T + 61.0 + (T - 68.0) * 1.2 + rh * 0.094);
  if (hi >= 80) {
    const c1 = -42.379,
      c2 = 2.04901523,
      c3 = 10.14333127,
      c4 = -0.22475541;
    const c5 = -0.00683783,
      c6 = -0.05481717,
      c7 = 0.00122874,
      c8 = 0.00085282,
      c9 = -0.00000199;
    hi =
      c1 +
      c2 * T +
      c3 * rh +
      c4 * T * rh +
      c5 * T * T +
      c6 * rh * rh +
      c7 * T * T * rh +
      c8 * T * rh * rh +
      c9 * T * T * rh * rh;
  }
  return ((hi - 32) * 5) / 9; // return Celsius
}

// Skeleton Helpers
function startSkeletonLoading() {
  const skeletons = document.querySelectorAll(".skeleton");
  skeletons.forEach((el) => el.classList.remove("loaded"));
}

function stopSkeletonLoading() {
  const skeletons = document.querySelectorAll(".skeleton");
  skeletons.forEach((el) => el.classList.add("loaded"));
}

// Dark Mode Preference
function toggleDarkTheme(e) {
  currentDarkTheme = e.target.checked ? "enabled" : "disabled";
  localStorage.setItem("darkTheme", currentDarkTheme);
  applyDarkTheme();
}

function applyDarkTheme() {
  const isDark = currentDarkTheme === "enabled";
  if (isDark) {
    document.documentElement.style.setProperty(
      "--card-bg",
      "rgba(15, 23, 42, 0.45)",
    );
    document.documentElement.style.setProperty(
      "--card-border",
      "rgba(255, 255, 255, 0.08)",
    );
    document.documentElement.style.setProperty(
      "--card-hover-bg",
      "rgba(15, 23, 42, 0.6)",
    );
  } else {
    document.documentElement.style.removeProperty("--card-bg");
    document.documentElement.style.removeProperty("--card-border");
    document.documentElement.style.removeProperty("--card-hover-bg");
  }
}

// Share Action
function shareWeatherUrl() {
  if (!currentWeatherData) return;
  const shareUrl = `${window.location.origin}${window.location.pathname}?city=${encodeURIComponent(currentWeatherData.name)}`;

  if (navigator.share) {
    navigator
      .share({
        title: `Weather in ${currentWeatherData.name}`,
        text: `Check out the current weather in ${currentWeatherData.name}: ${Math.round(currentWeatherData.main.temp)}°C, ${currentWeatherData.weather[0].description}`,
        url: shareUrl,
      })
      .catch((err) => console.error("Error sharing:", err));
  } else {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        showShareToast();
      })
      .catch((_err) => {
        alert(`Copy this URL to share: ${shareUrl}`);
      });
  }
}

function showShareToast() {
  let toast = document.querySelector(".toast-notification");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.innerHTML = `
      <i data-lucide="check" class="toast-icon"></i>
      <span>Link copied to clipboard!</span>
    `;
    document.body.appendChild(toast);
    if (typeof lucide !== "undefined") {
      lucide.createIcons();
    }
  }

  toast.offsetHeight; // force reflow
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

// 12. Error Notifications Panel

function showError(customText) {
  stopSkeletonLoading();
  errorMessageCard.classList.remove("hidden");
  if (customText) {
    errorMessageCard.querySelector("p").textContent = customText;
  } else {
    errorMessageCard.querySelector("p").textContent =
      "Please check the spelling and try again.";
  }
}

function hideError() {
  errorMessageCard.classList.add("hidden");
}

// 13. Interactive Detail Popups Modal System

let activeModalType = null;

function openDetailModal(type) {
  if (!currentWeatherData) return;
  activeModalType = type;
  refreshModalContent();
  detailsModal.classList.remove("hidden");
}

function closeModal() {
  detailsModal.classList.add("hidden");
  activeModalType = null;
}

// Redraws the modal inner HTML based on state variables (called on open or unit toggling)
function refreshModalContent() {
  if (!activeModalType || !currentWeatherData) return;

  let content = "";
  switch (activeModalType) {
    case "humidity":
      content = generateHumidityModalContent();
      break;
    case "wind":
      content = generateWindModalContent();
      break;
    case "pressure":
      content = generatePressureModalContent();
      break;
    case "aqi":
      content = generateAqiModalContent();
      break;
  }

  modalBody.innerHTML = content;

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }
}

// A. Humidity popup deep-dive markup
function generateHumidityModalContent() {
  const tempC = currentWeatherData.main.temp;
  const hum = currentWeatherData.main.humidity;

  // Calculate Dew Point using Magnus-Tetens
  const a = 17.27;
  const b = 237.7;
  const alpha = (a * tempC) / (b + tempC) + Math.log(hum / 100);
  const dewPointC = (b * alpha) / (a - alpha);

  // Apply units conversion
  const isCelsius = currentUnit === "C";
  const dispDewPoint = isCelsius
    ? Math.round(dewPointC)
    : Math.round((dewPointC * 9) / 5 + 32);
  const unitStr = isCelsius ? "°C" : "°F";

  // Comfort rating based on dew point comfort limits
  let comfortLabel = "Pleasant";
  let comfortClass = "";
  if (dewPointC < 10) {
    comfortLabel = "Dry & Fresh";
  } else if (dewPointC < 16) {
    comfortLabel = "Comfortable / Pleasant";
  } else if (dewPointC < 21) {
    comfortLabel = "Sticky / Humid";
    comfortClass = "comfort-sticky";
  } else {
    comfortLabel = "Oppressive / Uncomfortable";
    comfortClass = "comfort-oppressive";
  }

  // Absolute moisture approximation (grams of water vapor per m3 of air)
  const absoluteHum =
    (6.112 * Math.exp((17.67 * tempC) / (243.5 + tempC)) * hum * 2.1674) /
    (273.15 + tempC);

  // Apparent temperature ranges calculation
  let minApparent = currentWeatherData.main.feels_like;
  let maxApparent = currentWeatherData.main.feels_like;

  if (
    currentForecastData &&
    currentForecastData.hourly &&
    currentForecastData.hourly.apparent_temperature
  ) {
    const hourlyApp = currentForecastData.hourly.apparent_temperature;
    const todayHourlyApp = hourlyApp.slice(0, 24);
    minApparent = Math.min(...todayHourlyApp);
    maxApparent = Math.max(...todayHourlyApp);
  }

  const dispMinApp = isCelsius
    ? Math.round(minApparent)
    : Math.round((minApparent * 9) / 5 + 32);
  const dispMaxApp = isCelsius
    ? Math.round(maxApparent)
    : Math.round((maxApparent * 9) / 5 + 32);
  const dispCurrentApp = isCelsius
    ? Math.round(currentWeatherData.main.feels_like)
    : Math.round((currentWeatherData.main.feels_like * 9) / 5 + 32);

  return `
    <div class="modal-title">
      <i data-lucide="droplets" class="color-humidity"></i>
      <span>Humidity & Apparent Temperature</span>
    </div>
    <div class="humidity-details-wrapper">
      <div class="humidity-metrics-grid">
        <div class="humidity-subcard">
          <span class="humidity-subval">${hum}%</span>
          <span class="humidity-sublabel">Relative Humidity</span>
        </div>
        <div class="humidity-subcard">
          <span class="humidity-subval">${dispDewPoint}${unitStr}</span>
          <span class="humidity-sublabel">Dew Point</span>
        </div>
        <div class="humidity-subcard">
          <span class="humidity-subval">${dispCurrentApp}${unitStr}</span>
          <span class="humidity-sublabel">Current Feels-Like</span>
        </div>
        <div class="humidity-subcard">
          <span class="humidity-subval">${dispMinApp}${unitStr} / ${dispMaxApp}${unitStr}</span>
          <span class="humidity-sublabel">Min / Max Feels-Like</span>
        </div>
        <div class="humidity-subcard humidity-subcard-span">
          <span class="humidity-subval">${absoluteHum.toFixed(2)} g/m³</span>
          <span class="humidity-sublabel">Absolute Moisture Level</span>
        </div>
      </div>
      <div class="humidity-comfort-banner ${comfortClass}">
        Comfort Level: ${comfortLabel}
      </div>
    </div>
  `;
}

// B. Wind Speed popup compass markup
function generateWindModalContent() {
  const speed = currentWeatherData.wind.speed; // m/s
  const deg = currentWeatherData.wind.deg || 0;
  const isCelsius = currentUnit === "C";

  // Speed conversions
  const speedVal = isCelsius
    ? Math.round(speed * 3.6)
    : Math.round(speed * 2.237);
  const speedUnit = isCelsius ? "km/h" : "mph";

  // Wind Gusts
  let gustValStr = "N/A";
  if (currentWeatherData.wind.gust) {
    const gustSpeed = currentWeatherData.wind.gust;
    const gustVal = isCelsius
      ? Math.round(gustSpeed * 3.6)
      : Math.round(gustSpeed * 2.237);
    gustValStr = `${gustVal} ${speedUnit}`;
  } else {
    const estGust = isCelsius
      ? Math.round(speed * 3.6 * 1.35)
      : Math.round(speed * 2.237 * 1.35);
    gustValStr = `~${estGust} ${speedUnit} (Est)`;
  }

  // Wind Cardinal Directions
  const directions = [
    "North (N)",
    "North-East (NE)",
    "East (E)",
    "South-East (SE)",
    "South (S)",
    "South-West (SW)",
    "West (W)",
    "North-West (NW)",
  ];
  const dirIndex = Math.round(deg / 45) % 8;
  const dirName = directions[dirIndex];

  // Beaufort Scale computation
  const speedKmh = speed * 3.6;
  let force = 0;
  let forceDesc = "Calm";
  if (speedKmh < 1) {
    force = 0;
    forceDesc = "Calm";
  } else if (speedKmh < 6) {
    force = 1;
    forceDesc = "Light Air";
  } else if (speedKmh < 12) {
    force = 2;
    forceDesc = "Light Breeze";
  } else if (speedKmh < 20) {
    force = 3;
    forceDesc = "Gentle Breeze";
  } else if (speedKmh < 29) {
    force = 4;
    forceDesc = "Moderate Breeze";
  } else if (speedKmh < 39) {
    force = 5;
    forceDesc = "Fresh Breeze";
  } else if (speedKmh < 50) {
    force = 6;
    forceDesc = "Strong Breeze";
  } else if (speedKmh < 62) {
    force = 7;
    forceDesc = "Near Gale";
  } else if (speedKmh < 75) {
    force = 8;
    forceDesc = "Gale";
  } else if (speedKmh < 89) {
    force = 9;
    forceDesc = "Strong Gale";
  } else if (speedKmh < 103) {
    force = 10;
    forceDesc = "Storm";
  } else if (speedKmh < 118) {
    force = 11;
    forceDesc = "Violent Storm";
  } else {
    force = 12;
    forceDesc = "Hurricane";
  }

  return `
    <div class="modal-title">
      <i data-lucide="wind" class="color-wind"></i>
      <span>Wind & Compass Analysis</span>
    </div>
    <div class="compass-wrapper">
      <!-- Compass Visual representation -->
      <svg width="110" height="110" viewBox="0 0 100 100" class="compass-svg">
        <circle cx="50" cy="50" r="44" fill="none" stroke="var(--card-border)" stroke-width="2.5"/>
        <text x="50" y="14" text-anchor="middle" font-size="10" font-weight="800" fill="var(--text-primary)">N</text>
        <text x="88" y="53" text-anchor="middle" font-size="10" font-weight="800" fill="var(--text-primary)">E</text>
        <text x="50" y="93" text-anchor="middle" font-size="10" font-weight="800" fill="var(--text-primary)">S</text>
        <text x="12" y="53" text-anchor="middle" font-size="10" font-weight="800" fill="var(--text-primary)">W</text>
        
        <!-- Needle pointing rotated by wind degree -->
        <polygon points="50,16 45,50 50,45 55,50" fill="#e74c3c" transform="rotate(${deg}, 50, 50)" />
        <polygon points="50,84 45,50 50,45 55,50" fill="var(--text-secondary)" transform="rotate(${deg}, 50, 50)" />
        <circle cx="50" cy="50" r="4" fill="var(--text-primary)" />
      </svg>
      
      <span class="compass-direction-text">${dirName} (${deg}°)</span>
      
      <div class="compass-details-row">
        <div class="compass-detail-item">
          <span class="compass-detail-val">${speedVal} ${speedUnit}</span>
          <span class="compass-detail-label">Speed</span>
        </div>
        <div class="compass-detail-item">
          <span class="compass-detail-val">${gustValStr}</span>
          <span class="compass-detail-label">Gusts</span>
        </div>
        <div class="compass-detail-item">
          <span class="compass-detail-val">Force ${force}</span>
          <span class="compass-detail-label">${forceDesc}</span>
        </div>
      </div>
    </div>
  `;
}

// C. Barometric Pressure speedometer gauge markup
function generatePressureModalContent() {
  const press = currentWeatherData.main.pressure;

  // Gauge tilt angle calculation (clamped between 950 and 1050 hPa)
  let angle = ((press - 950) / 100) * 180 - 90;
  angle = Math.max(-90, Math.min(90, angle));

  let desc =
    "Normal Atmospheric Pressure. Weather is likely stable and fair with moderate winds.";
  if (press < 1009) {
    desc =
      "Low Pressure System. Usually associated with rising warm air, cloud formation, precipitation, or stormy weather.";
  } else if (press > 1022) {
    desc =
      "High Pressure System. Clear skies, cool dry air, and calm weather conditions dominate this atmospheric state.";
  }

  let pressures = [press, press, press]; // default fallback
  let trendText = "Stable";
  let trendIcon = "arrow-right";
  let sparklineHtml = "";

  if (
    currentForecastData &&
    currentForecastData.hourly &&
    currentForecastData.hourly.pressure_msl
  ) {
    const hourlyTimes = currentForecastData.hourly.time;
    const hourlyPressures = currentForecastData.hourly.pressure_msl;

    // Find closest index matching current time
    const nowMs = Date.now();
    let closestIndex = 0;
    let minTimeDiff = Infinity;

    for (let i = 0; i < hourlyTimes.length; i++) {
      const itemTimeMs = Date.parse(hourlyTimes[i]);
      const diff = Math.abs(itemTimeMs - nowMs);
      if (diff < minTimeDiff) {
        minTimeDiff = diff;
        closestIndex = i;
      }
    }

    // Use last 8 hourly readings chronological leading up to current hour (or as many as available)
    const count = 8;
    const startIndex = Math.max(0, closestIndex - (count - 1));
    const sliceEnd = closestIndex + 1;
    const lastPressures = hourlyPressures.slice(startIndex, sliceEnd);

    const pCurrent = Math.round(hourlyPressures[closestIndex]) || press;
    const pStart = Math.round(hourlyPressures[startIndex]) || press;

    pressures = lastPressures.map((v) => Math.round(v));

    // Compute trend text and icon
    const diffTotal = pCurrent - pStart;
    if (diffTotal > 1) {
      trendText = "Rising";
      trendIcon = "trending-up";
    } else if (diffTotal < -1) {
      trendText = "Falling";
      trendIcon = "trending-down";
    } else {
      trendText = "Stable";
      trendIcon = "arrow-right";
    }

    // Compute sparkline points inside a 100x30 SVG box.
    const minP = Math.min(...pressures);
    const maxP = Math.max(...pressures);
    const pRange = maxP === minP ? 2 : maxP - minP;

    const mapY = (val) => 25 - ((val - minP) / pRange) * 20;

    let dPath = "";
    let pointsHtml = "";
    pressures.forEach((p, idx) => {
      const x = 5 + idx * (90 / (pressures.length - 1));
      const y = mapY(p);
      if (idx === 0) {
        dPath += `M ${x},${y}`;
      } else {
        dPath += ` L ${x},${y}`;
      }
      pointsHtml += `<circle cx="${x}" cy="${y}" r="2" fill="currentColor" />`;
    });

    let sparklineStroke = "#2ecc71"; // green for stable
    if (trendText === "Falling")
      sparklineStroke = "#e74c3c"; // red for falling
    else if (trendText === "Rising") sparklineStroke = "#3498db"; // blue for rising

    sparklineHtml = `
      <div class="pressure-sparkline-container">
        <span class="label">${pressures.length}-Hour Pressure Trend</span>
        <svg width="100" height="30" class="pressure-sparkline pressure-sparkline-colored pressure-sparkline-${trendText.toLowerCase()}" viewBox="0 0 100 30">
          <path d="${dPath}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          ${pointsHtml}
        </svg>
        <div class="pressure-trend-label">
          <i data-lucide="${trendIcon}" class="trend-icon trend-icon-colored trend-icon-${trendText.toLowerCase()}"></i>
          <span>${trendText} (${pressures[0]} → ${pressures[pressures.length - 1]} hPa over last ${pressures.length}h)</span>
        </div>
      </div>
    `;
  }

  return `
    <div class="modal-title">
      <i data-lucide="gauge" class="color-pressure"></i>
      <span>Barometer & Atmosphere</span>
    </div>
    <div class="barometer-wrapper">
      <!-- Speedometer dial representation -->
      <svg width="140" height="80" viewBox="0 0 140 80" class="barometer-svg">
        <path d="M 20,70 A 50,50 0 0,1 120,70" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="8" stroke-linecap="round"/>
        <!-- Colors segments: low blue, normal green, high orange -->
        <path d="M 20,70 A 50,50 0 0,1 55,23" fill="none" stroke="#2980b9" stroke-width="8"/>
        <path d="M 55,23 A 50,50 0 0,1 85,23" fill="none" stroke="#2ecc71" stroke-width="8"/>
        <path d="M 85,23 A 50,50 0 0,1 120,70" fill="none" stroke="#e67e22" stroke-width="8"/>
        
        <!-- Rotating needle indicator -->
        <path d="M 70,70 L 70,25" stroke="#e74c3c" stroke-width="3" stroke-linecap="round" transform="rotate(${angle}, 70, 70)" />
        <circle cx="70" cy="70" r="5" fill="var(--text-primary)" />
      </svg>
      
      <div class="barometer-trend-card">
        <span class="barometer-trend-val">${press} hPa</span>
        <p class="barometer-trend-desc">${desc}</p>
      </div>
    </div>
    ${sparklineHtml}
  `;
}

// D. AQI Pollutants breakdown list
function generateAqiModalContent() {
  if (
    !currentAqiData ||
    !currentAqiData.list ||
    currentAqiData.list.length === 0
  ) {
    return "<p>No AQI breakdown details available.</p>";
  }

  const comp = currentAqiData.list[0].components;

  return `
    <div class="modal-title">
      <i data-lucide="activity" class="color-aqi"></i>
      <span>Air Pollutants Analysis</span>
    </div>
    <div class="pollutant-breakdown-wrapper">
      ${createPollutantRow("PM2.5", comp.pm2_5, "µg/m³")}
      ${createPollutantRow("PM10", comp.pm10, "µg/m³")}
      ${createPollutantRow("NO₂", comp.no2, "µg/m³")}
      ${createPollutantRow("O₃", comp.o3, "µg/m³")}
      ${createPollutantRow("CO", comp.co, "µg/m³")}
      ${createPollutantRow("SO₂", comp.so2, "µg/m³")}
    </div>
  `;
}

// Creates an individual chemical pollutant progress bar row
function createPollutantRow(label, val, unit) {
  let keyName = "pm2_5";
  if (label === "PM2.5") keyName = "pm2_5";
  else if (label === "PM10") keyName = "pm10";
  else if (label === "NO₂") keyName = "no2";
  else if (label === "O₃") keyName = "o3";
  else if (label === "CO") keyName = "co";
  else if (label === "SO₂") keyName = "so2";

  const style = getPollutantStyle(keyName, val);
  return `
    <div class="pollutant-row">
      <span class="pollutant-name">${label}</span>
      <div class="pollutant-bar-wrapper">
        <div class="pollutant-progress-track">
          <div class="pollutant-progress-fill ${style.color} pollutant-progress-fill-colored" data-width="${style.pct}"></div>
        </div>
      </div>
      <span class="pollutant-value">${val.toFixed(1)} ${unit}</span>
    </div>
  `;
}

// Compute progress percentage & colors for specific gases
function getPollutantStyle(name, val) {
  let max = 100;
  let color = "bar-good";
  if (name === "pm2_5") {
    max = 75;
    color = val < 10 ? "bar-good" : val < 25 ? "bar-moderate" : "bar-poor";
  } else if (name === "pm10") {
    max = 150;
    color = val < 20 ? "bar-good" : val < 50 ? "bar-moderate" : "bar-poor";
  } else if (name === "no2") {
    max = 150;
    color = val < 40 ? "bar-good" : val < 90 ? "bar-moderate" : "bar-poor";
  } else if (name === "o3") {
    max = 150;
    color = val < 50 ? "bar-good" : val < 100 ? "bar-moderate" : "bar-poor";
  } else if (name === "co") {
    max = 10000;
    color = val < 4000 ? "bar-good" : val < 9000 ? "bar-moderate" : "bar-poor";
  } else if (name === "so2") {
    max = 200;
    color = val < 20 ? "bar-good" : val < 80 ? "bar-moderate" : "bar-poor";
  }
  const pct = Math.min(100, Math.round((val / max) * 100));
  return { pct, color };
}

// 14. Search Trigger Listeners

searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city !== "") {
    checkWeather(city);
    suggestionsDropdown.classList.add("hidden");
  }
});

cityInput.addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    const city = cityInput.value.trim();
    if (city !== "") {
      checkWeather(city);
      suggestionsDropdown.classList.add("hidden");
    }
  }
});

// 15. Geolocation Integration

locationBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by your browser.");
    return;
  }

  locationBtn.classList.add("loading-geo");

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      checkWeatherByCoords(lat, lon).finally(() => {
        locationBtn.classList.remove("loading-geo");
      });
    },
    (error) => {
      locationBtn.classList.remove("loading-geo");
      let errorMsg = "Unable to retrieve your location.";
      if (error.code === error.PERMISSION_DENIED) {
        errorMsg = "Location access denied. Please search manually.";
      }
      showError(errorMsg);
    },
    { enableHighAccuracy: true, timeout: 6000 },
  );
});

// 16. Unit Toggle Switch Event Listener

unitToggle.addEventListener("change", (e) => {
  currentUnit = e.target.checked ? "F" : "C";
  localStorage.setItem("weatherUnit", currentUnit);
  updateUnitLabels();
  renderWeather();
});

function updateUnitLabels() {
  const labels = document.querySelectorAll(".unit-label");
  labels[0].style.opacity = currentUnit === "C" ? "1" : "0.4";
  labels[1].style.opacity = currentUnit === "F" ? "1" : "0.4";
}
updateUnitLabels();

// 17. Arrow Key Navigation between History Cities
document.addEventListener("keydown", (e) => {
  if (document.activeElement === cityInput) return;
  if (detailsModal && !detailsModal.classList.contains("hidden")) return;
  if (searchHistory.length <= 1) return;

  const currentCityName = currentWeatherData ? currentWeatherData.name : "";
  const currentIndex = searchHistory.findIndex(
    (item) => item.name.toLowerCase() === currentCityName.toLowerCase(),
  );

  if (currentIndex === -1) return;

  let newIndex = currentIndex;
  if (e.key === "ArrowRight") {
    newIndex = (currentIndex + 1) % searchHistory.length;
  } else if (e.key === "ArrowLeft") {
    newIndex = (currentIndex - 1 + searchHistory.length) % searchHistory.length;
  } else {
    return;
  }

  const newCity = searchHistory[newIndex].name;
  cityInput.value = newCity;
  checkWeather(newCity);
});
