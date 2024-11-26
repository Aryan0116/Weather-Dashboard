const API_KEY = '3cf0d8da6741c4db4c12ef790033c15f'; // Replace with your API key
const baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const weatherCard = document.getElementById('weather-card');
const cityNameEl = document.getElementById('city-name');
const tempValueEl = document.getElementById('temp-value');
const humidityEl = document.getElementById('humidity');
const windSpeedEl = document.getElementById('wind-speed');
const weatherDescriptionEl = document.getElementById('weather-description');
const weatherIconEl = document.getElementById('weather-icon');
const errorMessageEl = document.getElementById('error-message');
const addFavoriteBtn = document.getElementById('add-favorite-btn');
const favoritesContainer = document.getElementById('favorites-container');

// State
let favorites = JSON.parse(localStorage.getItem('weatherFavorites')) || [];

// Weather Icons Mapping
const weatherIcons = {
    'Clear': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'30\' fill=\'%23FFD700\'/%3E%3C/svg%3E")',
    'Clouds': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Cpath d=\'M70 40 C90 40, 90 70, 70 70 L30 70 C10 70, 10 40, 30 40 C35 25, 55 25, 70 40Z\' fill=\'%23A9A9A9\'/%3E%3C/svg%3E")',
    'Rain': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Cpath d=\'M70 40 C90 40, 90 70, 70 70 L30 70 C10 70, 10 40, 30 40 C35 25, 55 25, 70 40Z\' fill=\'%23A9A9A9\'/%3E%3Cpath d=\'M40 70 L30 90\' stroke=\'blue\' stroke-width=\'3\'/%3E%3Cpath d=\'M50 70 L40 90\' stroke=\'blue\' stroke-width=\'3\'/%3E%3Cpath d=\'M60 70 L50 90\' stroke=\'blue\' stroke-width=\'3\'/%3E%3C/svg%3E")',
    'Snow': 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Cpath d=\'M70 40 C90 40, 90 70, 70 70 L30 70 C10 70, 10 40, 30 40 C35 25, 55 25, 70 40Z\' fill=\'%23A9A9A9\'/%3E%3Cpath d=\'M50 70 L50 90\' stroke=\'white\' stroke-width=\'3\'/%3E%3C/svg%3E")'
};

// Utility Functions
function displayError(message) {
    errorMessageEl.textContent = message;
    errorMessageEl.classList.add('shake');
    setTimeout(() => errorMessageEl.classList.remove('shake'), 500);
}

function updateWeatherCard(data) {
    const { name, main, wind, weather } = data;
    const condition = weather[0].main;

    // Update Card
    cityNameEl.textContent = name;
    tempValueEl.textContent = Math.round(main.temp);
    humidityEl.textContent = `${main.humidity}%`;
    windSpeedEl.textContent = `${wind.speed} m/s`;
    weatherDescriptionEl.textContent = weather[0].description;

    // Update Weather Icon
    weatherIconEl.style.backgroundImage = weatherIcons[condition] || weatherIcons['Clear'];

    // Update Weather Card Background
    weatherCard.className = `weather-card show ${condition.toLowerCase()}`;
    weatherCard.classList.remove('hidden');
}

function addToFavorites() {
    const cityName = cityNameEl.textContent;
    if (cityName && !favorites.includes(cityName)) {
        favorites.push(cityName);
        localStorage.setItem('weatherFavorites', JSON.stringify(favorites));
        renderFavorites();
    }
}

function renderFavorites() {
    favoritesContainer.innerHTML = '';
    favorites.forEach(city => {
        const cityElement = document.createElement('div');
        cityElement.classList.add('favorite-city');
        cityElement.innerHTML = `
            ${city}
            <span class="remove-favorite">✖</span>
        `;

        // Fetch weather when favorite city is clicked
        cityElement.addEventListener('click', () => {
            cityInput.value = city;
            fetchWeatherData(city);
        });

        // Remove favorite
        cityElement.querySelector('.remove-favorite').addEventListener('click', (e) => {
            e.stopPropagation();
            favorites = favorites.filter(f => f !== city);
            localStorage.setItem('weatherFavorites', JSON.stringify(favorites));
            renderFavorites();
        });

        favoritesContainer.appendChild(cityElement);
    });
}
// Geolocation Support Functions
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoordinates(latitude, longitude);
            },
            (error) => {
                handleGeolocationError(error);
            }
        );
    } else {
        displayError('Geolocation is not supported by this browser.');
    }
}

function fetchWeatherByCoordinates(lat, lon) {
    // Ensure loading overlay is shown before fetc

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                // Log detailed error information
                console.error('Network response status:', response.status);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Weather data received:', data);
            updateWeatherCard(data);
            fetchWeatherForecast(lat, lon);
            weatherCard.classList.remove('hidden');
            
            // Ensure loading overlay is hidden after successful fetch

        })
        .catch(error => {
            // Log the full error for debugging
            console.error('Fetch error:', error);
            
            // Display error message
            displayError('Could not fetch weather data for your location');
            
        });
}

// Ensure these functions are defined clearly

function handleGeolocationError(error) {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            displayError("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            displayError("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            displayError("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            displayError("An unknown error occurred.");
            break;
    }
}
function fetchWeatherForecast(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            displayForecast(data);
        })
        .catch(error => {
            displayError('Could not fetch weather forecast');
        });
}

function displayForecast(data) {
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = ''; // Clear previous forecast

    // Create a Set to track unique dates
    const uniqueDates = new Set();

    data.list.forEach((item) => {
        const date = new Date(item.dt * 1000);
        const formattedDate = date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
        });

        // Only add unique dates (5 days)
        if (!uniqueDates.has(formattedDate) && uniqueDates.size < 5) {
            uniqueDates.add(formattedDate);

            const forecastItem = document.createElement('div');
            forecastItem.classList.add('forecast-item');
            
            const temp = Math.round(item.main.temp);
            const condition = item.weather[0].main;
            const icon = weatherIcons[condition] || weatherIcons['Clear'];

            forecastItem.innerHTML = `
                <h4>${formattedDate}</h4>
                <div class="forecast-icon" style="background-image: ${icon}"></div>
                <p>${temp}°C</p>
                <p>${condition}</p>
            `;
            forecastContainer.appendChild(forecastItem);
        }
    });
}
// State for temperature unit
let isCelsius = true;

// Function to toggle temperature unit
function toggleTemperatureUnit() {
    isCelsius = !isCelsius;
    const tempValue = parseFloat(tempValueEl.textContent);
    const convertedTemp = isCelsius ? 
        Math.round((tempValue - 32) * 5 / 9) : 
        Math.round((tempValue * 9 / 5) + 32);
    
    tempValueEl.textContent = convertedTemp;
    // Update button text
    document.getElementById('unit-toggle-btn').textContent = isCelsius ? 'Switch to °F' : 'Switch to °C';
}

// Add this to your HTML to create the toggle button
const unitToggleBtn = document.createElement('button');
unitToggleBtn.textContent = 'Switch to °F';
unitToggleBtn.id = 'unit-toggle-btn';
unitToggleBtn.addEventListener('click', toggleTemperatureUnit);
document.querySelector('.search-container').appendChild(unitToggleBtn);

function fetchWeatherForecast(lat, lon) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            displayForecast(data);
        })
        .catch(error => {
            displayError('Could not fetch weather forecast');
        });
}

function displayForecast(data) {
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = ''; // Clear previous forecast

    data.list.forEach((item, index) => {
        if (index % 8 === 0) { // Get forecast for every 8 hours
            const forecastItem = document.createElement('div');
            forecastItem.classList.add('forecast-item');
            const date = new Date(item.dt * 1000).toLocaleDateString();
            const temp = Math.round(item.main.temp);
            const condition = item.weather[0].main;

            forecastItem.innerHTML = `
                <h4>${date}</h4>
                <p>${temp}°C</p>
                <p>${condition}</p>
            `;
            forecastContainer.appendChild(forecastItem);
        }
    });
}
// Loading Overlay Functions

async function fetchAirQualityData(lat, lon) {
    try {
        const aqiUrl = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
        
        const response = await fetch(aqiUrl);
        const data = await response.json();

        if (data.list && data.list.length > 0) {
            const airQualityData = data.list[0];
            updateAirQualityDisplay(airQualityData);
        }
    } catch (error) {
        console.error('Air Quality Data Fetch Error:', error);
        resetAirQualityDisplay();
    }
}

// Function to update Air Quality Display
function updateAirQualityDisplay(airQualityData) {
    // AQI Categories
    const aqiCategories = {
        1: { 
            text: 'Good', 
            color: '#00E400',
            description: 'Air quality is satisfactory, and air pollution poses little or no risk.'
        },
        2: { 
            text: 'Fair', 
            color: '#FFFF00',
            description: 'Air quality is acceptable. However, there may be a risk for some people.'
        },
        3: { 
            text: 'Moderate', 
            color: '#FF7E00',
            description: 'Air quality is acceptable, but some pollutants may be of concern.'
        },
        4: { 
            text: 'Poor', 
            color: '#FF0000',
            description: 'Everyone may begin to experience health effects.'
        },
        5: { 
            text: 'Very Poor', 
            color: '#8F3F97',
            description: 'Health warnings of emergency conditions.'
        }
    };

    // Get AQI and Components
    const aqi = airQualityData.main.aqi;
    const components = airQualityData.components;

    // Select Display Elements
    const aqiValueElement = document.getElementById('aqi-value');
    const aqiCategoryElement = document.getElementById('aqi-category');
    const aqiDescriptionElement = document.getElementById('aqi-description');
    
    // Pollutant Elements
    const pm25Element = document.getElementById('pm25-value');
    const pm10Element = document.getElementById('pm10-value');
    const coElement = document.getElementById('co-value');
    const no2Element = document.getElementById('no2-value');
    const o3Element = document.getElementById('o3-value');

    // Update AQI Display
    const category = aqiCategories[aqi] || { 
        text: 'Unknown', 
        color: '#CCCCCC',
        description: 'Unable to determine air quality.'
    };

    // Set AQI Values
    aqiValueElement.textContent = aqi;
    aqiValueElement.style.color = category.color;
    aqiCategoryElement.textContent = category.text;
    aqiDescriptionElement.textContent = category.description;

    // Update Pollutant Values
    pm25Element.textContent = `PM2.5: ${components.pm2_5.toFixed(2)} µg/m³`;
    pm10Element.textContent = `PM10: ${components.pm10.toFixed(2)} µg/m³`;
    coElement.textContent = `CO: ${components.co.toFixed(2)} µg/m³`;
    no2Element.textContent = `NO2: ${components.no2.toFixed(2)} µg/m³`;
    o3Element.textContent = `O3: ${components.o3.toFixed(2)} µg/m³`;
}

// Function to reset Air Quality Display
function resetAirQualityDisplay() {
    const elements = [
        'aqi-value', 
        'aqi-category', 
        'aqi-description',
        'pm25-value', 
        'pm10-value', 
        'co-value',
        'no2-value',
        'o3-value'
    ];

    elements.forEach(elementId => {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = 'N/A';
        }
    });
}
// Add this to your page load or initialization
window.addEventListener('DOMContentLoaded', () => {
    // Add a Geolocate button to your HTML
    const geolocateBtn = document.createElement('button');
    geolocateBtn.textContent = 'Use My Location';
    geolocateBtn.id = 'geolocate-btn';
    geolocateBtn.addEventListener('click', getUserLocation);
    
    // Append the button next to your search input
    cityInput.parentNode.insertBefore(geolocateBtn, cityInput.nextSibling);
});
// Dark Mode Functionality
const themeToggleBtn = document.getElementById('theme-toggle');

// Function to apply theme
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-mode');
        localStorage.setItem('preferred-theme', 'dark');
        themeToggleBtn.innerHTML = '<span class="theme-icon">🌞</span>'; // Sun icon for dark mode
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('preferred-theme', 'light');
        themeToggleBtn.innerHTML = '<span class="theme-icon">🌙</span>'; // Moon icon for light mode
    }
}

// Theme Toggle Function
function toggleTheme() {
    if (document.body.classList.contains('dark-mode')) {
        applyTheme('light');
    } else {
        applyTheme('dark');
    }
}

// Initialize Theme on Page Load
function initializeTheme() {
    const savedTheme = localStorage.getItem('preferred-theme');
    
    // Check system preference if no saved theme
    if (!savedTheme) {
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(prefersDarkMode ? 'dark' : 'light');
    } else {
        applyTheme(savedTheme);
    }
}

// Event Listeners
themeToggleBtn.addEventListener('click', toggleTheme);

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addListener((e) => {
    applyTheme(e.matches ? 'dark' : 'light');
});

// Initialize theme when the page loads
window.addEventListener('DOMContentLoaded', initializeTheme);
async function fetchWeatherData(city) {
    try {

        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
        if (!response.ok) {
            throw new Error('City not found');
        }

        const data = await response.json();
        if (data.coord) {
            // Fetch Air Quality Data after getting weather data
            fetchAirQualityData(data.coord.lat, data.coord.lon);
        }
        updateWeatherCard(data);
        fetchWeatherForecast(data.coord.lat, data.coord.lon); // Add this line
        errorMessageEl.textContent = '';
    } catch (error) {
        displayError(error.message);
        weatherCard.classList.add('hidden');
        resetAirQualityDisplay();
    }
}
// Improved Theme Detection and Accessibility
function enhanceThemeDetection() {
    // Detect color scheme preference
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    // Update theme when system preference changes
    prefersDarkScheme.addListener((e) => {
        applyTheme(e.matches ? 'dark' : 'light');
    });

    // Accessibility improvements
    themeToggleBtn.setAttribute('aria-pressed', document.body.classList.contains('dark-mode'));
    themeToggleBtn.setAttribute('aria-label', 
        document.body.classList.contains('dark-mode') 
        ? 'Switch to Light Mode' 
        : 'Switch to Dark Mode'
    );
}
// Optional: Add subtle animations
function addMicroInteractions() {
    const elements = document.querySelectorAll('.weather-card, .forecast-item');
    
    elements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            el.style.transform = 'scale(1.02)';
            el.style.boxShadow = '0 6px 12px rgba(0,0,0,0.1)';
        });
        
        el.addEventListener('mouseleave', () => {
            el.style.transform = 'scale(1)';
            el.style.boxShadow = 'none';
        });
    });
}

// Initialize micro-interactions
document.addEventListener('DOMContentLoaded', addMicroInteractions);
// Optional: Add visual feedback for theme toggle
function enhanceThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // Add ripple effect
    themeToggleBtn.addEventListener('click', (e) => {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        themeToggleBtn.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 300);
    });
}

// Call this in your initialization
enhanceThemeToggle();
// Event Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        fetchWeatherData(city);
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) {
            fetchWeatherData(city);
        }
    }
});
function checkNetworkStatus() {
    if (!navigator.onLine) {
        displayError('No internet connection. Please check your network.');
    }
}

// Add network status listeners
window.addEventListener('online', () => {
    errorMessageEl.textContent = '';
});

window.addEventListener('offline', checkNetworkStatus);
addFavoriteBtn.addEventListener('click', () => {
    addToFavorites();
});

window.addEventListener('DOMContentLoaded', () => {
    renderFavorites();
});
