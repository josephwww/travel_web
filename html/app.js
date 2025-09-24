let travelData = {};

async function loadTravelData() {
    try {
        const response = await fetch('/api/travel-data', {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        travelData = await response.json();
        return travelData;
    } catch (error) {
        console.error('Error loading travel data from API:', error);
        return null;
    }
}

function renderTravelPlan(data) {
    if (!data) return;

    updateHeader(data.travelInfo);
    renderTimeline(data.itinerary, data.transportations, data.accommodations);
    renderSummary(data.highlights || [], data.travelInfo, data.budget);
}

function updateHeader(travelInfo) {
    const headerTitle = document.getElementById('travel-title');
    const headerSubtitle = document.getElementById('travel-subtitle');

    if (headerTitle) {
        headerTitle.textContent = `🧳 ${travelInfo.destination}旅行计划`;
    }

    if (headerSubtitle) {
        const travelersText = travelInfo.travelers && travelInfo.travelers.length > 0
            ? ` | 👥 ${travelInfo.travelers.join('、')}`
            : '';
        headerSubtitle.textContent = `${travelInfo.origin} → ${travelInfo.destination} | ${travelInfo.startDate.replace('2024-', '')} - ${travelInfo.endDate.replace('2024-', '')}${travelersText}`;
    }
}

function renderTimeline(itinerary, transportations, accommodations) {
    const timeline = document.querySelector('.timeline');
    if (!timeline) return;

    timeline.innerHTML = '';

    Object.keys(itinerary).forEach(dayKey => {
        const day = itinerary[dayKey];
        const dayCard = createDayCard(day, transportations, accommodations, dayKey);
        timeline.appendChild(dayCard);
    });
}

function createDayCard(day, transportations, accommodations, dayKey) {
    const dayCard = document.createElement('div');
    dayCard.className = `day-card ${day.type}`;

    let transportInfo = '';

    if (transportations) {
        // 根据日期匹配相关交通信息
        const relevantTransports = findRelevantTransports(transportations, day);

        if (relevantTransports.length > 0) {
            transportInfo = relevantTransports.map(transport => {
                const icon = getTransportTypeIcon(transport.type);
                const typeText = getTransportTypeText(transport.type);

                return `
                    <div class="transport-info ${transport.type}">
                        <div class="transport-number">${icon} ${transport.number}</div>
                        <div class="time">${transport.departureTime} ${transport.route.split(' → ')[0]} → ${transport.arrivalTime} ${transport.route.split(' → ')[1]}</div>
                        <div class="duration">${typeText}时间: ${transport.duration}</div>
                        ${transport.description ? `<div class="description">${transport.description}</div>` : ''}
                    </div>
                `;
            }).join('');
        }
    }

    // 天气按钮（用于头部区域）
    let weatherButton = '';
    if (day.weather_poi) {
        weatherButton = `<button class="weather-toggle-btn compact" onclick="toggleWeatherForDay('${dayKey}')">
            <span class="weather-icon">🌤️</span>
            <span class="weather-text">天气</span>
        </button>`;
    }

    // 天气信息容器（用于内容区域）
    let weatherInfo = '';
    if (day.weather_poi) {
        weatherInfo = `<div class="weather-info weather-hidden" id="weather-${dayKey}" data-poi="${day.weather_poi}" style="display: none;">
        </div>`;
    }

    let accommodationInfo = '';

    if (accommodations) {
        // 根据日期匹配相关住宿信息
        const relevantAccommodations = findRelevantAccommodations(accommodations, day);

        if (relevantAccommodations.length > 0) {
            accommodationInfo = relevantAccommodations.map(accommodation => {
                return `
                    <div class="accommodation-info hotel">
                        <div class="accommodation-name">🏨 ${accommodation.name}</div>
                        <div class="accommodation-detail">📍 ${accommodation.location} | 📅 ${accommodation.checkIn} - ${accommodation.checkOut}</div>
                        <div class="accommodation-contact">📞 ${accommodation.contact} <a href="tel:${accommodation.contact}">联系酒店</a></div>
                        <div class="accommodation-address">📍 <span onclick="openAmap('${accommodation.address}')" style="color: #007bff; text-decoration: underline; cursor: pointer;">${accommodation.address}</span> </div>
                        ${accommodation.description ? `<div class="accommodation-description">${accommodation.description}</div>` : ''}
                    </div>
                `;
            }).join('');
        }
    }

    const activities = day.activities.map(activity =>
        `<div class="activity">${activity}</div>`
    ).join('');

    dayCard.innerHTML = `
        <div class="day-header-section">
            <div class="date-location">
                <div class="date">${day.date}</div>
                <div class="location">${day.location}</div>
            </div>
            ${weatherButton}
        </div>
        ${weatherInfo}
        ${transportInfo}
        <div class="activities">
            ${activities}
        </div>
        ${accommodationInfo}
    `;

    return dayCard;
}

// 辅助函数
function findRelevantTransports(transportations, day) {
    const relevantTransports = [];

    Object.values(transportations).forEach(transport => {
        if (transport.date && day.date) {
            // 改进的日期匹配 - 提取完整的日期模式进行匹配
            const dayDateMatch = day.date.match(/(\d+月\d+日)/);
            const transportDateMatch = transport.date.match(/(\d+月\d+日)/);

            if (dayDateMatch && transportDateMatch && dayDateMatch[1] === transportDateMatch[1]) {
                relevantTransports.push(transport);
            }
        }
    });

    return relevantTransports;
}

function findRelevantAccommodations(accommodations, day) {
    const relevantAccommodations = [];

    Object.values(accommodations).forEach(accommodation => {
        if (accommodation.checkIn && day.date) {
            // 仅匹配入住日期
            const dayDateMatch = day.date.match(/(\d+月\d+日)/);
            const checkInMatch = accommodation.checkIn.match(/(\d+月\d+日)/);

            if (dayDateMatch && checkInMatch && dayDateMatch[1] === checkInMatch[1]) {
                relevantAccommodations.push(accommodation);
            }
        }
    });

    return relevantAccommodations;
}

function getTransportTypeIcon(type) {
    const icons = {
        flight: '✈️',
        train: '🚄',
        bus: '🚌',
        other: '🚗'
    };
    return icons[type] || '🚗';
}

function getTransportTypeText(type) {
    const texts = {
        flight: '飞行',
        train: '乘车',
        bus: '车程',
        other: '行程'
    };
    return texts[type] || '行程';
}

function getCurrencySymbol(currency) {
    const symbols = {
        'CNY': '¥',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥'
    };
    return symbols[currency] || '¥';
}

function renderSummary(highlights, travelInfo, budget) {
    const summaryContainer = document.getElementById('travel-summary');
    if (!summaryContainer) return;

    const highlightsList = highlights.map(item => `<li>${item}</li>`).join('');

    let travelersSection = '';
    if (travelInfo && travelInfo.travelers && travelInfo.travelers.length > 0) {
        const travelersList = travelInfo.travelers.map(traveler => `<li>👤 ${traveler}</li>`).join('');
        travelersSection = `
            <div class="summary-item">
                <h3>👥 旅行伙伴</h3>
                <ul>${travelersList}</ul>
            </div>
        `;
    }

    let budgetSection = '';
    if (budget && budget.summary) {
        const remaining = budget.summary.remaining;
        const remainingColor = remaining >= 0 ? '#27ae60' : '#e74c3c';

        budgetSection = `
            <div class="summary-item budget-summary-main">
                <h3>💰 旅行预算</h3>
                <div class="budget-overview">
                    <div class="budget-stat">
                        <span class="budget-label">总预算:</span>
                        <span class="budget-value">${getCurrencySymbol(budget.currency)}${budget.totalBudget}</span>
                    </div>
                    <div class="budget-stat">
                        <span class="budget-label">已计划:</span>
                        <span class="budget-value">${getCurrencySymbol(budget.currency)}${budget.summary.totalPlanned}</span>
                    </div>
                    <div class="budget-stat">
                        <span class="budget-label">剩余:</span>
                        <span class="budget-value" style="color: ${remainingColor}">${getCurrencySymbol(budget.currency)}${remaining}</span>
                    </div>
                </div>
                <div class="budget-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(budget.summary.totalPlanned / budget.totalBudget * 100)}%"></div>
                    </div>
                    <div class="progress-text">${((budget.summary.totalPlanned / budget.totalBudget) * 100).toFixed(1)}% 已规划</div>
                </div>
            </div>
        `;
    }

    // 添加必备清单部分
    let checklistSection = '';
    if (travelData.checklist && travelData.checklist.items && travelData.checklist.items.length > 0) {
        checklistSection = renderChecklistSection(travelData.checklist, travelInfo);
    }

    // 添加旅行提醒部分
    let remindersSection = '';
    if (travelData.notes && travelData.notes.travelReminders) {
        remindersSection = `
            <div class="summary-item reminders-section">
                <h3>📝 旅行提醒</h3>
                <div class="travel-reminders">${travelData.notes.travelReminders.replace(/\n/g, '<br>')}</div>
            </div>
        `;
    }

    summaryContainer.innerHTML = `
        <div class="summary-item">
            <h3>🌟 旅行亮点</h3>
            <ul>${highlightsList}</ul>
        </div>
        ${travelersSection}
        ${budgetSection}
        ${checklistSection}
        ${remindersSection}
    `;
}

function renderChecklistSection(checklist, travelInfo) {
    const items = checklist.items || [];
    const travelers = travelInfo.travelers || [];

    if (items.length === 0) return '';

    // 计算整体完成度
    const totalItems = items.length * travelers.length;
    const completedItems = items.reduce((total, item) => {
        return total + Object.keys(item.confirmations || {}).length;
    }, 0);
    const overallProgress = totalItems > 0 ? (completedItems / totalItems * 100).toFixed(1) : 0;

    // 按类别分组
    const categories = checklist.categories || [];
    const itemsByCategory = {};

    categories.forEach(category => {
        itemsByCategory[category.id] = items.filter(item => item.category === category.id);
    });

    const categoryList = categories.map(category => {
        const categoryItems = itemsByCategory[category.id] || [];
        if (categoryItems.length === 0) return '';

        const itemsList = categoryItems.map(item => {
            const confirmedCount = Object.keys(item.confirmations || {}).length;
            const totalCount = travelers.length;
            const itemProgress = totalCount > 0 ? (confirmedCount / totalCount * 100).toFixed(0) : 0;

            const progressClass = confirmedCount === totalCount ? 'completed' :
                                 confirmedCount > 0 ? 'partial' : 'pending';

            return `
                <div class="checklist-item-summary ${progressClass}">
                    <div class="item-info">
                        <span class="item-icon">${category.icon}</span>
                        <span class="item-name">${item.name}</span>
                        ${item.required ? '<span class="required-badge">必需</span>' : ''}
                    </div>
                    <div class="item-progress">
                        <div class="progress-circle ${progressClass}">
                            ${itemProgress}%
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="category-group">
                <h4>${category.icon} ${category.name}</h4>
                <div class="category-items">
                    ${itemsList}
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="summary-item checklist-summary">
            <h3>📋 必备清单</h3>
            <div class="checklist-overview">
                <div class="overall-progress">
                    <div class="progress-info">
                        <span class="progress-label">整体完成度</span>
                        <span class="progress-value">${overallProgress}%</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${overallProgress}%"></div>
                        </div>
                    </div>
                    <div class="progress-stats">
                        已确认: ${completedItems}/${totalItems} 项
                    </div>
                </div>
                <div class="traveler-confirmations">
                    ${travelers.map(traveler => {
                        const confirmedByTraveler = items.filter(item =>
                            item.confirmations && item.confirmations[traveler]
                        ).length;
                        const travelerProgress = items.length > 0 ? (confirmedByTraveler / items.length * 100).toFixed(0) : 0;

                        return `
                            <div class="traveler-confirm-status">
                                <span class="traveler-name">👤 ${traveler}</span>
                                <span class="confirm-progress">${confirmedByTraveler}/${items.length}</span>
                                <div class="mini-progress">
                                    <div class="mini-progress-fill" style="width: ${travelerProgress}%"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <div class="checklist-categories">
                ${categoryList}
            </div>
        </div>
    `;
}

async function saveTravelData(data) {
    try {
        const response = await fetch('save-data.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            console.log('Data saved successfully');
            return true;
        } else {
            console.error('Failed to save data');
            return false;
        }
    } catch (error) {
        console.error('Error saving data:', error);
        localStorage.setItem('travelData', JSON.stringify(data));
        console.log('Data saved to localStorage as fallback');
        return false;
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // 清理过期的天气缓存
    cleanExpiredWeatherCache();

    const data = await loadTravelData();
    if (data) {
        renderTravelPlan(data);
    }

});

// 切换单个天气卡片的显示
function toggleWeatherForDay(dayKey) {
    const container = document.getElementById(`weather-${dayKey}`);
    const poi = container.dataset.poi;

    if (!container || !poi) return;

    if (container.style.display === 'none') {
        // 显示天气信息
        container.style.display = 'block';
        container.classList.remove('weather-hidden');
        container.innerHTML = '<div class="weather-loading">🌤️ 获取天气信息中...</div>';
        loadWeatherInfo(poi, dayKey);

        // 添加隐藏按钮
        setTimeout(() => {
            const weatherContainer = document.getElementById(`weather-${dayKey}`);
            if (weatherContainer && !weatherContainer.querySelector('.weather-hide-btn')) {
                const hideBtn = document.createElement('button');
                hideBtn.className = 'weather-hide-btn';
                hideBtn.onclick = () => hideWeatherForDay(dayKey);
                hideBtn.innerHTML = '✕';
                hideBtn.title = '隐藏天气';
                weatherContainer.appendChild(hideBtn);
            }
        }, 1000);
    }
}

// 隐藏单个天气卡片
function hideWeatherForDay(dayKey) {
    const container = document.getElementById(`weather-${dayKey}`);

    if (!container) return;

    container.style.display = 'none';
    container.classList.add('weather-hidden');
    container.innerHTML = '';
}

// 简单的通知函数（如果没有现成的）
function showNotification(message, type = 'info') {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'info' ? '#3498db' : '#27ae60'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 14px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;

    document.body.appendChild(notification);

    // 显示动画
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);

    // 自动隐藏
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 2000);
}

window.travelDataAPI = {
    load: loadTravelData,
    save: saveTravelData,
    get: () => travelData
};

const tripDate = new Date(2025, 9, 3);

function updateCountdown() {
const now = new Date();
// 计算剩余天数
const diff = tripDate - now;
const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
const el = document.getElementById('countdown');

if (days > 0) {
    el.textContent = `还有 ${days} 天就要出发了，祝我们旅途愉快`;
} else if (days === 0) {
    el.textContent = '今天出发，祝旅途愉快！';
} else {
    el.textContent = '行程已经开始或结束啦，回忆愉快！';
}
}

// 初始显示
updateCountdown();
// 每天更新一次（可选）
setInterval(updateCountdown, 1000 * 60 * 60);

/**
 * 调用高德地图 App 打开指定地址
 * @param {string} address 需要导航/查看的文字地址
 */
function openAmap(address) {
    if (!address || typeof address !== 'string') {
      return;
    }

    const ua = navigator.userAgent.toLowerCase();
    const encoded = encodeURIComponent(address);
    const fallbackUrl = 'https://mobile.amap.com/'; // 未安装时的兜底

    let scheme = '';

    if (/iphone|ipad|ipod/.test(ua)) {
      // iOS
      scheme = `iosamap://poi?sourceApplication=myH5&name=${encoded}`;
    } else if (/android/.test(ua)) {
      // Android
      scheme = `androidamap://poi?sourceApplication=myH5&keywords=${encoded}`;
    } else {
      // 桌面端或其他设备，直接打开高德地图网页版
      window.open(`https://ditu.amap.com/search?query=${encoded}`, '_blank');
      return;
    }

    // 尝试打开 App
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = scheme;
    document.body.appendChild(iframe);

    // 如果 App 未安装，2秒后跳转到网页版
    setTimeout(() => {
      document.body.removeChild(iframe);
      window.open(fallbackUrl, '_blank');
    }, 2000);
  }

// 天气API请求队列管理（QPS限制为3）
class WeatherApiQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.requestInterval = 350; // 约350ms间隔，确保QPS不超过3
    }

    async add(cityCode) {
        return new Promise((resolve, reject) => {
            this.queue.push({ cityCode, resolve, reject });
            this.process();
        });
    }

    async process() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            const { cityCode, resolve, reject } = this.queue.shift();

            try {
                const result = await this.fetchWeatherForCityInternal(cityCode);
                resolve(result);
            } catch (error) {
                reject(error);
            }

            // 等待间隔时间，确保不超过QPS限制
            if (this.queue.length > 0) {
                await new Promise(resolve => setTimeout(resolve, this.requestInterval));
            }
        }

        this.processing = false;
    }

    async fetchWeatherForCityInternal(cityCode) {
        // 首先尝试从缓存获取数据
        const cachedData = this.getWeatherFromCache(cityCode);
        if (cachedData) {
            console.log(`从缓存获取天气信息: ${cityCode}`);
            return cachedData;
        }

        const apiKey = 'ba99afc54b54649007b7377ef293ed2b';
        const apiUrl = `https://restapi.amap.com/v3/weather/weatherInfo?city=${cityCode}&key=${apiKey}&extensions=all`;

        try {
            console.log(`从API获取天气信息: ${cityCode}`);
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (data.status === '1' && data.forecasts && data.forecasts.length > 0) {
                const forecastData = data.forecasts[0];
                // 保存到缓存
                this.saveWeatherToCache(cityCode, forecastData);
                return forecastData;
            } else {
                console.error('天气API返回错误:', data);
                return null;
            }
        } catch (error) {
            console.error('获取天气信息失败:', error);
            return null;
        }
    }

    // 从缓存获取天气数据
    getWeatherFromCache(cityCode) {
        try {
            const cacheKey = `weather_${cityCode}`;
            const cachedItem = localStorage.getItem(cacheKey);

            if (!cachedItem) {
                return null;
            }

            const { data, timestamp } = JSON.parse(cachedItem);
            const now = new Date().getTime();
            const cacheExpiry = 60 * 60 * 1000; // 1小时 = 60分钟 * 60秒 * 1000毫秒

            // 检查是否过期
            if (now - timestamp > cacheExpiry) {
                localStorage.removeItem(cacheKey);
                return null;
            }

            return data;
        } catch (error) {
            console.error('读取天气缓存失败:', error);
            return null;
        }
    }

    // 保存天气数据到缓存
    saveWeatherToCache(cityCode, weatherData) {
        try {
            const cacheKey = `weather_${cityCode}`;
            const cacheItem = {
                data: weatherData,
                timestamp: new Date().getTime()
            };

            localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
            console.log(`天气数据已缓存: ${cityCode}, 有效期1小时`);
        } catch (error) {
            console.error('保存天气缓存失败:', error);
        }
    }
}

// 创建全局天气API队列实例
const weatherApiQueue = new WeatherApiQueue();

// 清理过期的天气缓存
function cleanExpiredWeatherCache() {
    try {
        const keys = Object.keys(localStorage);
        const weatherKeys = keys.filter(key => key.startsWith('weather_'));
        const now = new Date().getTime();
        const cacheExpiry = 60 * 60 * 1000; // 1小时

        weatherKeys.forEach(key => {
            try {
                const cachedItem = localStorage.getItem(key);
                if (cachedItem) {
                    const { timestamp } = JSON.parse(cachedItem);
                    console.log(`当前时间戳: ${now}`);
                    if (now - timestamp > cacheExpiry) {
                        localStorage.removeItem(key);
                        console.log(`清理过期天气缓存: ${key}`);
                    }
                }
            } catch (error) {
                // 如果解析失败，直接删除
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.error('清理天气缓存失败:', error);
    }
}

// 天气信息相关函数
async function loadWeatherInfo(weatherPoiString, dayKey) {
    if (!weatherPoiString) {
        return;
    }

    const pois = weatherPoiString.split(',').map(poi => poi.trim()).filter(poi => poi);
    const weatherContainer = document.getElementById(`weather-${dayKey}`);

    if (!weatherContainer || pois.length === 0) {
        return;
    }

    try {
        // 使用队列管理API调用，避免超过QPS限制
        const weatherPromises = pois.map(poi => weatherApiQueue.add(poi));
        const weatherResults = await Promise.all(weatherPromises);

        const weatherHtml = weatherResults.map((weather, index) => {
            if (weather) {
                return formatWeatherDisplay(weather);
            } else {
                return `<div class="weather-error">无法获取 ${pois[index]} 的天气信息</div>`;
            }
        }).join('');

        weatherContainer.innerHTML = weatherHtml;
    } catch (error) {
        console.error('获取天气信息失败:', error);
        weatherContainer.innerHTML = '<div class="weather-error">🌧️ 天气信息获取失败</div>';
    }
}


function formatWeatherDisplay(weather) {
    const weatherIcons = {
        '晴': '☀️',
        '多云': '⛅',
        '阴': '☁️',
        '小雨': '🌦️',
        '中雨': '🌧️',
        '大雨': '⛈️',
        '雷阵雨': '⛈️',
        '暴雨': '🌊',
        '雪': '❄️',
        '雾': '🌫️',
        '霾': '😷'
    };

    // 如果是预报数据（包含casts数组）
    if (weather.casts && weather.casts.length > 0) {
        const city = weather.city || weather.province;
        const reportTime = weather.reporttime;

        // 只显示前3天的预报
        const forecastDays = weather.casts.slice(0, 3);

        const forecastHtml = forecastDays.map((cast, index) => {
            const dayWeatherIcon = weatherIcons[cast.dayweather] || '🌤️';
            const nightWeatherIcon = weatherIcons[cast.nightweather] || '🌤️';
            const dayLabel = index === 0 ? '今日' : index === 1 ? '明日' : `${cast.date.slice(-5)}`;
            const weekDay = ['一', '二', '三', '四', '五', '六', '日'][cast.week - 1];

            return `
                <div class="forecast-day">
                    <div class="forecast-date">
                        <span class="day-label">${dayLabel}</span>
                        <span class="week-day">周${weekDay}</span>
                    </div>
                    <div class="forecast-weather">
                        <div class="day-weather">
                            <span class="weather-period">白天</span>
                            <span class="weather-icon">${dayWeatherIcon}</span>
                            <span class="weather-desc">${cast.dayweather}</span>
                            <span class="weather-temp">${cast.daytemp}°C</span>
                        </div>
                        <div class="night-weather">
                            <span class="weather-period">夜晚</span>
                            <span class="weather-icon">${nightWeatherIcon}</span>
                            <span class="weather-desc">${cast.nightweather}</span>
                            <span class="weather-temp">${cast.nighttemp}°C</span>
                        </div>
                    </div>
                    <div class="forecast-wind">
                        <span>💨 ${cast.daywind} ${getWindIcon(cast.daypower)}${cast.daypower}</span>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="weather-forecast">
                <div class="weather-location">${city}</div>
                <div class="forecast-container">
                    ${forecastHtml}
                </div>
                <div class="weather-time">更新时间: ${reportTime}</div>
            </div>
        `;
    }
    // 兼容旧的实时天气数据格式
    else {
        const weatherIcon = weatherIcons[weather.weather] || '🌤️';
        const windIcon = getWindIcon(weather.windpower);

        return `
            <div class="weather-item">
                <div class="weather-location">${weather.city}</div>
                <div class="weather-main">
                    <span class="weather-icon">${weatherIcon}</span>
                    <span class="weather-desc">${weather.weather}</span>
                    <span class="weather-temp">${weather.temperature}°C</span>
                </div>
                <div class="weather-details">
                    <span>💨 ${weather.winddirection} ${windIcon}${weather.windpower}</span>
                    <span>💧 湿度${weather.humidity}%</span>
                </div>
                <div class="weather-time">更新时间: ${weather.reporttime}</div>
            </div>
        `;
    }
}

function getWindIcon(windpower) {
    if (windpower.includes('≤3') || windpower === '1-2' || windpower === '0') {
        return '🍃';
    } else if (windpower.includes('4-5') || windpower.includes('6-7')) {
        return '💨';
    } else {
        return '🌪️';
    }
}