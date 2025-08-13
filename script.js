const API_KEY = "c7bd721ae4984a5992971941251308"; // Replace with your WeatherAPI.com key

document.getElementById("searchBtn").addEventListener("click", () => {
    let city = document.getElementById("cityInput").value.trim();
    if (city) getWeather(city);
});

// Allow Enter key to search
document.getElementById("cityInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        let city = e.target.value.trim();
        if (city) getWeather(city);
    }
});

async function getWeather(city) {
    try {
        let res = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${city}&hours=7&aqi=no&alerts=no`);
        let data = await res.json();

        if (data.error) {
            alert("City not found!");
            return;
        }

        displayCurrentWeather(data.location.name, data.current, data.current.is_day);
        displayForecast(data.forecast.forecastday[0].hour);
        displayPrecautions(data.current.temp_c, data.current.humidity, data.current.condition.text);
        changeBackground(data.current.condition.text, data.current.is_day);

    } catch (error) {
        console.error(error);
        alert("Error fetching weather data. Please try again.");
    }
}

function getWeatherCategory(condition, isDay) {
    const text = (condition || "").toLowerCase();
    if (!isDay) return "night";
    if (text.includes("rain") || text.includes("drizzle") || text.includes("shower")) return "rainy";
    if (text.includes("snow") || text.includes("sleet") || text.includes("blizzard")) return "snow";
    if (text.includes("cloud")) return "cloudy";
    if (text.includes("sun") || text.includes("clear")) return "sunny";
    return "sunny";
}

function displayCurrentWeather(city, current, isDay) {
    document.getElementById("cityName").innerText = city;
    document.getElementById("temperature").innerText = `${current.temp_c} °C`;
    document.getElementById("condition").innerText = current.condition.text;
    document.getElementById("humidity").innerText = `Humidity: ${current.humidity}%`;
    document.getElementById("weatherIcon").innerHTML = `<img src="https:${current.condition.icon}" alt="icon">`;

    const category = getWeatherCategory(current.condition.text, isDay);
    const badge = document.getElementById("weatherType");
    if (badge) {
        const label = category.charAt(0).toUpperCase() + category.slice(1);
        badge.textContent = label;
        badge.className = `weather-type-badge ${category}`;
    }
}

function displayForecast(hourData) {
    let container = document.getElementById("forecastContainer");
    container.innerHTML = "";

    let now = new Date().getHours();
    let forecastHours = hourData.filter(h => {
        let hHour = new Date(h.time).getHours();
        return hHour >= now && hHour <= now + 6;
    });

    forecastHours.forEach(hour => {
        let time = new Date(hour.time).getHours();
        container.innerHTML += `
            <div class="forecast-item">
                <p>${time}:00</p>
                <img src="https:${hour.condition.icon}">
                <p>${hour.temp_c}°C</p>
                <p>${hour.humidity}%</p>
            </div>
        `;
    });
}

function displayPrecautions(temp, humidity, condition) {
    let precautionText = "";
    let className = "";

    let lowerCond = condition.toLowerCase();
    if (lowerCond.includes("rain")) {
        precautionText = "Carry an umbrella and wear waterproof shoes.";
        className = "rain";
    } else if (temp > 35) {
        precautionText = "Stay hydrated and avoid direct sunlight.";
        className = "heat";
    } else if (temp < 5) {
        precautionText = "Wear warm clothing and protect against frostbite.";
        className = "cold";
    } else if (humidity > 80) {
        precautionText = "Avoid strenuous outdoor activity due to high humidity.";
        className = "rain";
    } else {
        precautionText = "Weather looks good. Enjoy your day!";
        className = "cold";
    }

    let card = document.getElementById("precautionCard");
    card.innerText = precautionText;
    card.className = `precaution-card ${className}`;
}

function changeBackground(condition, isDay) {
    let body = document.body;
    condition = condition.toLowerCase();

    body.className = ""; // Reset

    if (!isDay) {
        if (condition.includes("rain")) {
            body.classList.add("night-bg");
            setParticlesMode("rain");
        } else if (condition.includes("snow")) {
            body.classList.add("night-bg");
            setParticlesMode("snow");
        } else if (condition.includes("cloud")) {
            body.classList.add("night-bg");
            setParticlesMode("off");
        } else if (condition.includes("sun") || condition.includes("clear")) {
            body.classList.add("night-bg");
            setParticlesMode("off");
        } else {
            body.classList.add("night-bg");
            setParticlesMode("off");
        }
        return;
    }

    if (condition.includes("sun") || condition.includes("clear")) {
        body.classList.add("sunny-bg");
        setParticlesMode("off");
    } else if (condition.includes("rain")) {
        body.classList.add("rainy-bg");
        setParticlesMode("rain");
    } else if (condition.includes("snow")) {
        body.classList.add("snow-bg");
        setParticlesMode("snow");
    } else if (condition.includes("cloud")) {
        body.classList.add("cloudy-bg");
        setParticlesMode("off");
    } else {
        body.classList.add("sunny-bg");
        setParticlesMode("off");
    }
}

// =====================
//Particle Engine (Rain/Snow)
// =====================
const fx = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,
  particles: [],
  mode: "off", // "off" | "rain" | "snow"
  running: false,
  rafId: null,
};

function initFXCanvas() {
  if (fx.canvas) return;
  fx.canvas = document.getElementById("fxCanvas");
  fx.ctx = fx.canvas.getContext("2d");
  onResizeFX();
  window.addEventListener("resize", onResizeFX);
}

function onResizeFX() {
  if (!fx.canvas) return;
  // Scale for device pixel ratio
  const dpr = window.devicePixelRatio || 1;
  fx.width = fx.canvas.clientWidth;
  fx.height = fx.canvas.clientHeight;
  fx.canvas.width = Math.floor(fx.width * dpr);
  fx.canvas.height = Math.floor(fx.height * dpr);
  fx.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function setParticlesMode(mode) {
  initFXCanvas();
  if (mode === fx.mode) return;

  fx.mode = mode;
  fx.particles = [];

  if (fx.mode === "off") {
    stopFX();
    clearFX();
    return;
  }

  // Spawn particles based on mode & screen size
  const densityBase = fx.mode === "rain" ? 0.35 : 0.15; // tweak density
  const count = Math.floor((fx.width * fx.height) / (10000 / densityBase));

  for (let i = 0; i < count; i++) {
    fx.particles.push(createParticle(fx.mode));
  }

  if (!fx.running) startFX();
}

function createParticle(mode) {
  if (mode === "rain") {
    // raindrop
    return {
      x: Math.random() * fx.width,
      y: Math.random() * fx.height,
      // angle-ish fall for nice parallax
      vx: 2 + Math.random() * 1.5,
      vy: 10 + Math.random() * 8,
      len: 10 + Math.random() * 14,
      opacity: 0.3 + Math.random() * 0.5,
    };
  } else { // snow
    return {
      x: Math.random() * fx.width,
      y: Math.random() * fx.height,
      vx: (Math.random() - 0.5) * 0.8,
      vy: 0.7 + Math.random() * 0.9,
      r: 1.2 + Math.random() * 2.2,
      drift: Math.random() * Math.PI * 2, // for gentle sway
      opacity: 0.6 + Math.random() * 0.4,
    };
  }
}

function startFX() {
  fx.running = true;
  loopFX();
}

function stopFX() {
  fx.running = false;
  if (fx.rafId) cancelAnimationFrame(fx.rafId);
  fx.rafId = null;
}

function clearFX() {
  if (!fx.ctx) return;
  fx.ctx.clearRect(0, 0, fx.width, fx.height);
}

function loopFX() {
  if (!fx.running) return;
  fx.rafId = requestAnimationFrame(loopFX);
  drawFX();
}

function drawFX() {
  const ctx = fx.ctx;
  if (!ctx) return;
  ctx.clearRect(0, 0, fx.width, fx.height);

  if (fx.mode === "rain") {
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    for (let p of fx.particles) {
      // draw
      ctx.globalAlpha = p.opacity;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 1.2, p.y - p.len);
      ctx.stroke();

      // update
      p.x += p.vx;
      p.y += p.vy;

      // recycle
      if (p.y > fx.height + 20 || p.x > fx.width + 20) {
        p.x = Math.random() * fx.width - 20;
        p.y = -20;
      }
    }
    ctx.globalAlpha = 1;
  } else if (fx.mode === "snow") {
    for (let p of fx.particles) {
      ctx.beginPath();
      ctx.globalAlpha = p.opacity;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();

      // gentle sway
      p.drift += 0.01;
      p.x += p.vx + Math.cos(p.drift) * 0.2;
      p.y += p.vy;

      if (p.y > fx.height + 5) {
        p.y = -5;
        p.x = Math.random() * fx.width;
      }
      if (p.x < -5) p.x = fx.width + 5;
      if (p.x > fx.width + 5) p.x = -5;
    }
    ctx.globalAlpha = 1;
  }
}
