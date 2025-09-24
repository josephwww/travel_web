let travelData = {};

// 旅行者管理
function loadTravelers() {
    const container = document.getElementById('travelers-list');
    if (!container || !travelData.travelInfo || !travelData.travelInfo.travelers) return;

    container.innerHTML = '';
    travelData.travelInfo.travelers.forEach((traveler, index) => {
        const travelerItem = document.createElement('div');
        travelerItem.className = 'traveler-item';
        travelerItem.innerHTML = `
            <div class="traveler-header">
                <h4>👤 ${traveler}</h4>
                <button class="remove-btn" onclick="removeTraveler(${index})">删除</button>
            </div>
            <div class="traveler-details">
                <div class="form-row">
                    <input type="text" value="${traveler}" class="traveler-input" data-index="${index}" placeholder="旅行者姓名">
                </div>
            </div>
        `;
        container.appendChild(travelerItem);
    });
}

function addTraveler() {
    const newTravelerInput = document.getElementById('new-traveler-name');
    const travelerName = newTravelerInput.value.trim();

    if (!travelerName) {
        showNotification('请输入旅行者姓名', 'error');
        return;
    }

    if (!travelData.travelInfo) {
        travelData.travelInfo = {};
    }
    if (!travelData.travelInfo.travelers) {
        travelData.travelInfo.travelers = [];
    }

    travelData.travelInfo.travelers.push(travelerName);
    loadTravelers();
    saveTravelData(travelData);

    newTravelerInput.value = '';
    showNotification('旅行者已添加', 'success');
}

function removeTraveler(index) {
    if (travelData.travelInfo && travelData.travelInfo.travelers && index >= 0 && index < travelData.travelInfo.travelers.length) {
        const travelerName = travelData.travelInfo.travelers[index];
        travelData.travelInfo.travelers.splice(index, 1);
        loadTravelers();
        saveTravelData(travelData);
        showNotification(`已删除旅行者: ${travelerName}`, 'info');
    }
}

function loadBasicInfo() {
    if (!travelData.travelInfo) return;

    const originInput = document.getElementById('travel-origin');
    const destinationInput = document.getElementById('travel-destination');
    const startDateInput = document.getElementById('travel-start-date');
    const endDateInput = document.getElementById('travel-end-date');

    if (originInput) originInput.value = travelData.travelInfo.origin || '';
    if (destinationInput) destinationInput.value = travelData.travelInfo.destination || '';
    if (startDateInput) startDateInput.value = travelData.travelInfo.startDate || '';
    if (endDateInput) endDateInput.value = travelData.travelInfo.endDate || '';

    loadTravelers();
}

function saveBasicInfo() {
    const origin = document.getElementById('travel-origin').value.trim();
    const destination = document.getElementById('travel-destination').value.trim();
    const startDate = document.getElementById('travel-start-date').value;
    const endDate = document.getElementById('travel-end-date').value;

    if (!travelData.travelInfo) {
        travelData.travelInfo = {};
    }

    travelData.travelInfo.origin = origin;
    travelData.travelInfo.destination = destination;
    travelData.travelInfo.startDate = startDate;
    travelData.travelInfo.endDate = endDate;

    saveTravelData(travelData);
    showNotification('基础信息已保存！', 'success');
}

// 旅行亮点管理
function addHighlight() {
    if (!travelData.highlights) travelData.highlights = [];
    travelData.highlights.push('🌟 新亮点');
    loadHighlights(travelData.highlights);
    saveTravelData(travelData);
}

function removeHighlight(index) {
    if (travelData.highlights && index >= 0 && index < travelData.highlights.length) {
        travelData.highlights.splice(index, 1);
        loadHighlights(travelData.highlights);
        saveTravelData(travelData);
    }
}


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

async function saveTravelData(data) {
    try {
        const response = await fetch('/api/travel-data', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Data saved to server:', result.message);
        return true;
    } catch (error) {
        console.error('Error saving data to API:', error);
        return false;
    }
}

function showSection(sectionName, element) {
    const sections = document.querySelectorAll('.admin-section');
    const navBtns = document.querySelectorAll('.nav-btn');
    
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    navBtns.forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(sectionName).classList.add('active');
    if (element) {
        element.classList.add('active');
    }
}

// 交通信息管理函数
function loadTransportationsList() {
    const container = document.getElementById('transportation-list');
    if (!container || !travelData.transportations) return;

    container.innerHTML = '';

    Object.keys(travelData.transportations).forEach(key => {
        const transport = travelData.transportations[key];
        const transportItem = createTransportationItem(key, transport);
        container.appendChild(transportItem);
    });
}

function createTransportationItem(key, transport) {
    const item = document.createElement('div');
    item.className = 'transportation-item';

    // 查找相关的预算支出
    const relatedExpenses = findRelatedExpenses('transportation', key);
    const budgetInfo = relatedExpenses.length > 0 ?
        `<div class="budget-info">
            <strong>💰 相关支出:</strong>
            ${relatedExpenses.map(exp => `<span class="expense-tag">¥${exp.amount} (${exp.paidBy})</span>`).join('')}
         </div>` :
        `<div class="budget-info">
            <button class="link-btn" onclick="linkTransportToBudget('${key}')">+ 关联预算</button>
         </div>`;

    item.innerHTML = `
        <div class="transport-header">
            <h4>${getTransportIcon(transport.type)} ${key}</h4>
            <button class="remove-btn" onclick="removeTransportationItem('${key}')">删除</button>
        </div>
        <div class="transport-details">
            <div class="form-row">
                <select onchange="updateTransportType('${key}', this.value)">
                    <option value="flight" ${transport.type === 'flight' ? 'selected' : ''}>✈️ 航班</option>
                    <option value="train" ${transport.type === 'train' ? 'selected' : ''}>🚄 高铁/火车</option>
                    <option value="bus" ${transport.type === 'bus' ? 'selected' : ''}>🚌 汽车</option>
                    <option value="other" ${transport.type === 'other' ? 'selected' : ''}>🚗 其他</option>
                </select>
                <input type="text" value="${transport.number || ''}" placeholder="班次号"
                       title="输入班次号/车次号" onchange="updateTransportField('${key}', 'number', this.value)">
            </div>
            <div class="form-row">
                <input type="text" value="${transport.route || ''}" placeholder="路线"
                       title="输入出发地→目的地" onchange="updateTransportField('${key}', 'route', this.value)">
                <input type="text" value="${transport.date || ''}" placeholder="日期"
                       title="输入乘车日期" onchange="updateTransportField('${key}', 'date', this.value)">
            </div>
            <div class="form-row">
                <input type="text" value="${transport.departureTime || ''}" placeholder="出发时间"
                       title="输入出发时间 (如: 09:30)" onchange="updateTransportField('${key}', 'departureTime', this.value)">
                <input type="text" value="${transport.arrivalTime || ''}" placeholder="到达时间"
                       title="输入到达时间 (如: 11:20)" onchange="updateTransportField('${key}', 'arrivalTime', this.value)">
                <input type="text" value="${transport.duration || ''}" placeholder="时长"
                       title="输入行程时长 (如: 1小时50分钟)" onchange="updateTransportField('${key}', 'duration', this.value)">
            </div>
            <div class="form-row">
                <input type="text" value="${transport.description || ''}" placeholder="备注说明"
                       title="输入座位号、检票口等备注信息" onchange="updateTransportField('${key}', 'description', this.value)">
            </div>
            ${budgetInfo}
        </div>
    `;
    return item;
}

function getTransportIcon(type) {
    const icons = {
        flight: '✈️',
        train: '🚄',
        bus: '🚌',
        other: '🚗'
    };
    return icons[type] || '🚗';
}

function removeTransportationItem(key) {
    if (travelData.transportations && travelData.transportations[key]) {
        delete travelData.transportations[key];
        loadTransportationsList();
        saveTravelData(travelData);
        // 更新关联项目选项
        loadRelatedProjectOptions();
    }
}

function updateTransportType(key, type) {
    if (travelData.transportations && travelData.transportations[key]) {
        travelData.transportations[key].type = type;
        saveTravelData(travelData);
    }
}

function updateTransportField(key, field, value) {
    if (travelData.transportations && travelData.transportations[key]) {
        travelData.transportations[key][field] = value;
        saveTravelData(travelData);
    }
}

function addNewTransportation() {
    const type = document.getElementById('new-transport-type').value;
    const name = document.getElementById('new-transport-name').value || `新${getTransportIcon(type)}`;

    if (!travelData.transportations) {
        travelData.transportations = {};
    }

    const key = name.replace(/\s+/g, '_').toLowerCase();
    travelData.transportations[key] = {
        type: type,
        number: '',
        route: '',
        date: '',
        departureTime: '',
        arrivalTime: '',
        duration: '',
        description: ''
    };

    loadTransportationsList();
    saveTravelData(travelData);
    // 更新关联项目选项
    loadRelatedProjectOptions();

    // 清空输入框
    document.getElementById('new-transport-name').value = '';
}

function saveTransportations() {
    saveTravelData(travelData);
    // 更新关联项目选项
    loadRelatedProjectOptions();
    showNotification('交通信息已保存！', 'success');
}

// 住宿信息管理函数
function loadAccommodationsList() {
    const container = document.getElementById('accommodation-list');
    if (!container || !travelData.accommodations) return;

    container.innerHTML = '';

    Object.keys(travelData.accommodations).forEach(key => {
        const accommodation = travelData.accommodations[key];
        const accommodationItem = createAccommodationItem(key, accommodation);
        container.appendChild(accommodationItem);
    });
}

function createAccommodationItem(key, accommodation) {
    const item = document.createElement('div');
    item.className = 'accommodation-item';

    // 查找相关的预算支出
    const relatedExpenses = findRelatedExpenses('accommodation', key);
    const budgetInfo = relatedExpenses.length > 0 ?
        `<div class="budget-info">
            <strong>💰 相关支出:</strong>
            ${relatedExpenses.map(exp => `<span class="expense-tag">¥${exp.amount} (${exp.paidBy})</span>`).join('')}
         </div>` :
        `<div class="budget-info">
            <button class="link-btn" onclick="linkAccommodationToBudget('${key}')">+ 关联预算</button>
         </div>`;

    item.innerHTML = `
        <div class="accommodation-header">
            <h4>🏨 ${key}</h4>
            <button class="remove-btn" onclick="removeAccommodationItem('${key}')">删除</button>
        </div>
        <div class="accommodation-details">
            <div class="form-row">
                <input type="text" value="${accommodation.name || ''}" placeholder="住宿名称"
                       title="输入酒店/民宿名称" onchange="updateAccommodationField('${key}', 'name', this.value)">
                <input type="text" value="${accommodation.location || ''}" placeholder="住宿位置"
                       title="输入住宿所在区域/地标" onchange="updateAccommodationField('${key}', 'location', this.value)">
            </div>
            <div class="form-row">
                <input type="text" value="${accommodation.checkIn || ''}" placeholder="入住日期"
                       title="输入入住日期 (如: 10月3日)" onchange="updateAccommodationField('${key}', 'checkIn', this.value)">
                <input type="text" value="${accommodation.checkOut || ''}" placeholder="退房日期"
                       title="输入退房日期 (如: 10月4日)" onchange="updateAccommodationField('${key}', 'checkOut', this.value)">
            </div>
            <div class="form-row">
                <input type="text" value="${accommodation.contact || ''}" placeholder="联系方式"
                       title="输入酒店电话号码" onchange="updateAccommodationField('${key}', 'contact', this.value)">
                <input type="text" value="${accommodation.address || ''}" placeholder="详细地址"
                       title="输入完整街道地址" onchange="updateAccommodationField('${key}', 'address', this.value)">
            </div>
            <div class="form-row">
                <input type="text" value="${accommodation.description || ''}" placeholder="住宿描述"
                       title="输入房型、特色等描述信息" onchange="updateAccommodationField('${key}', 'description', this.value)">
            </div>
            ${budgetInfo}
        </div>
    `;
    return item;
}

function removeAccommodationItem(key) {
    if (travelData.accommodations && travelData.accommodations[key]) {
        delete travelData.accommodations[key];
        loadAccommodationsList();
        saveTravelData(travelData);
        // 更新关联项目选项
        loadRelatedProjectOptions();
    }
}

function updateAccommodationField(key, field, value) {
    if (travelData.accommodations && travelData.accommodations[key]) {
        travelData.accommodations[key][field] = value;
        saveTravelData(travelData);
    }
}

function addNewAccommodation() {
    const name = document.getElementById('new-accommodation-name').value || '新住宿';

    if (!travelData.accommodations) {
        travelData.accommodations = {};
    }

    const key = name.replace(/\s+/g, '_').toLowerCase();
    travelData.accommodations[key] = {
        name: name,
        location: '',
        checkIn: '',
        checkOut: '',
        contact: '',
        address: '',
        description: ''
    };

    loadAccommodationsList();
    saveTravelData(travelData);
    // 更新关联项目选项
    loadRelatedProjectOptions();

    // 清空输入框
    document.getElementById('new-accommodation-name').value = '';
}

function saveAccommodations() {
    saveTravelData(travelData);
    // 更新关联项目选项
    loadRelatedProjectOptions();
    showNotification('住宿信息已保存！', 'success');
}

function calculateDuration(depTime, arrTime) {
    const [depH, depM] = depTime.split(':').map(Number);
    const [arrH, arrM] = arrTime.split(':').map(Number);
    
    const depMinutes = depH * 60 + depM;
    const arrMinutes = arrH * 60 + arrM;
    
    let diffMinutes = arrMinutes - depMinutes;
    if (diffMinutes < 0) diffMinutes += 24 * 60;
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    return `${hours}小时${minutes}分钟`;
}

function loadItineraryList() {
    const container = document.getElementById('itinerary-list');
    if (!container || !travelData.itinerary) return;

    container.innerHTML = '';

    Object.keys(travelData.itinerary).forEach(dayKey => {
        const dayData = travelData.itinerary[dayKey];
        const dayEditor = createDayEditor(dayKey, dayData);
        container.appendChild(dayEditor);
    });
}

function createDayEditor(dayKey, dayData) {
    const dayEditor = document.createElement('div');
    dayEditor.className = 'day-editor';
    dayEditor.dataset.dayKey = dayKey;

    const activitiesHtml = dayData.activities.map((activity, index) => `
        <div class="activity-item">
            <input type="text" value="${activity}" class="activity-input"
                   title="编辑活动内容" placeholder="输入活动内容..."
                   data-activity-index="${index}">
            <button class="delete-btn" onclick="deleteActivity(this)" title="删除此活动">删除</button>
        </div>
    `).join('');

    dayEditor.innerHTML = `
        <div class="day-header">
            <h3>${dayData.date}</h3>
            <div class="location-editor">
                <label>地点:</label>
                <input type="text" value="${dayData.location}" class="location-input"
                       title="编辑当日地点" placeholder="输入地点..."
                       onchange="updateDayLocation('${dayKey}', this.value)">
            </div>
            <div class="weather-editor">
                <label>天气区域编码:</label>
                <input type="text" value="${dayData.weather_poi || ''}" class="weather-poi-input"
                       title="输入天气区域编码，多个用逗号分隔 (如: 500105,500236)"
                       placeholder="如: 500105,500236"
                       onchange="updateDayWeatherPoi('${dayKey}', this.value)">
                <small style="color: #666;">多个区域用逗号分隔，如: 440306(深圳),500105(重庆),500236(奉节)</small>
            </div>
        </div>
        <div class="activity-list">
            ${activitiesHtml}
        </div>
        <button class="add-btn" onclick="addActivity(this.parentElement)"
                title="为当日添加新活动">+ 添加活动</button>
    `;

    return dayEditor;
}

function saveItinerary() {
    saveItineraryAsync();
}

async function saveItineraryAsync() {
    const dayEditors = document.querySelectorAll('.day-editor');

    dayEditors.forEach(editor => {
        const dayKey = editor.dataset.dayKey;
        const activities = [];
        const activityInputs = editor.querySelectorAll('.activity-input');

        // 保存活动
        activityInputs.forEach(input => {
            if (input.value.trim()) {
                activities.push(input.value.trim());
            }
        });

        // 保存地点
        const locationInput = editor.querySelector('.location-input');

        if (travelData.itinerary && travelData.itinerary[dayKey]) {
            travelData.itinerary[dayKey].activities = activities;
            if (locationInput && locationInput.value.trim()) {
                travelData.itinerary[dayKey].location = locationInput.value.trim();
            }
        }
    });

    await saveTravelData(travelData);
    showNotification('行程安排已保存！', 'success');
}

// 更新单日地点
function updateDayLocation(dayKey, newLocation) {
    if (travelData.itinerary && travelData.itinerary[dayKey]) {
        travelData.itinerary[dayKey].location = newLocation.trim();
        saveTravelData(travelData);
        showNotification('地点已更新', 'info');
    }
}

// 更新天气区域编码
function updateDayWeatherPoi(dayKey, weatherPoi) {
    if (travelData.itinerary && travelData.itinerary[dayKey]) {
        travelData.itinerary[dayKey].weather_poi = weatherPoi.trim();
        saveTravelData(travelData);
        showNotification('天气区域编码已更新', 'info');
    }
}

function saveNotes() {
    saveNotesAsync();
}

async function saveNotesAsync() {
    const travelNotes = document.getElementById('travel-notes').value;
    const contacts = [];
    
    const contactItems = document.querySelectorAll('.contact-item');
    contactItems.forEach(item => {
        const name = item.querySelector('.contact-name').textContent;
        const phone = item.querySelector('.contact-phone').textContent;
        contacts.push({ name, phone });
    });
    
    travelData.notes = {
        travelReminders: travelNotes,
        emergencyContacts: contacts
    };
    
    await saveTravelData(travelData);
    showNotification('备注信息已保存！', 'success');
}

function addActivity(dayEditor) {
    const activityList = dayEditor.querySelector('.activity-list');
    const newActivityItem = document.createElement('div');
    newActivityItem.className = 'activity-item';

    const activityCount = activityList.children.length;

    newActivityItem.innerHTML = `
        <input type="text" placeholder="输入新活动..." class="activity-input"
               title="编辑活动内容" data-activity-index="${activityCount}">
        <button class="delete-btn" onclick="deleteActivity(this)" title="删除此活动">删除</button>
    `;

    activityList.appendChild(newActivityItem);
    newActivityItem.querySelector('.activity-input').focus();
}

function deleteActivity(button) {
    const activityItem = button.parentElement;
    activityItem.remove();
    showNotification('活动已删除', 'info');
}

function addContact() {
    const contactName = document.getElementById('contact-name').value.trim();
    const contactPhone = document.getElementById('contact-phone').value.trim();
    
    if (!contactName || !contactPhone) {
        showNotification('请填写联系人姓名和电话号码', 'error');
        return;
    }
    
    const contactList = document.getElementById('contact-list');
    const contactItem = document.createElement('div');
    contactItem.className = 'contact-item';
    
    contactItem.innerHTML = `
        <div>
            <span class="contact-name">${contactName}</span>: 
            <span class="contact-phone">${contactPhone}</span>
        </div>
        <button class="delete-btn" onclick="this.parentElement.remove()">删除</button>
    `;
    
    contactList.appendChild(contactItem);
    
    document.getElementById('contact-name').value = '';
    document.getElementById('contact-phone').value = '';
    
    showNotification('联系人已添加', 'success');
}

function exportPlan() {
    const flightData = localStorage.getItem('flightData');
    const itineraryData = localStorage.getItem('itineraryData');
    const notesData = localStorage.getItem('notesData');
    
    const exportData = {
        flights: flightData ? JSON.parse(flightData) : null,
        itinerary: itineraryData ? JSON.parse(itineraryData) : null,
        notes: notesData ? JSON.parse(notesData) : null,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = '重庆旅行计划_' + new Date().toISOString().split('T')[0] + '.json';
    link.click();
    
    showNotification('旅行计划已导出！', 'success');
}

function printPlan() {
    const printWindow = window.open('index.html', '_blank');

    // 等新窗口加载完成后再打印
    printWindow.addEventListener('load', () => {
        // 再等待 2 秒，让页面里的数据/异步渲染完成
        setTimeout(() => {
            printWindow.print();
        }, 2000);
    });

    // 可选：显示提示
    showNotification('正在准备打印...', 'info');
}

function resetPlan() {
    if (confirm('确定要重置所有计划内容吗？此操作无法撤销。')) {
        localStorage.removeItem('flightData');
        localStorage.removeItem('itineraryData');
        localStorage.removeItem('notesData');
        
        location.reload();
        showNotification('计划已重置', 'info');
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${getNotificationColor(type)};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        font-weight: 500;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function getNotificationColor(type) {
    switch(type) {
        case 'success': return '#28a745';
        case 'error': return '#dc3545';
        case 'info': return '#17a2b8';
        default: return '#6c757d';
    }
}

async function loadSavedData() {
    const data = await loadTravelData();
    if (!data) return;
    
    // 交通信息将通过 loadTransportationsList() 加载
    
    if (data.notes) {
        if (data.notes.travelReminders) {
            document.getElementById('travel-notes').value = data.notes.travelReminders;
        }
        
        if (data.notes.emergencyContacts) {
            const contactList = document.getElementById('contact-list');
            data.notes.emergencyContacts.forEach(contact => {
                const contactItem = document.createElement('div');
                contactItem.className = 'contact-item';
                contactItem.innerHTML = `
                    <div>
                        <span class="contact-name">${contact.name}</span>: 
                        <span class="contact-phone">${contact.phone}</span>
                    </div>
                    <button class="delete-btn" onclick="this.parentElement.remove()">删除</button>
                `;
                contactList.appendChild(contactItem);
            });
        }
    }
    
    if (data.itinerary) {
        loadItineraryList();
    }
}

// 旅行亮点管理 - 全局函数
function loadHighlights(highlights) {
    const container = document.getElementById('highlights-list');
    if (!container) return;

    container.innerHTML = '';
    highlights.forEach((highlight, index) => {
        const highlightItem = document.createElement('div');
        highlightItem.className = 'highlight-item';
        highlightItem.innerHTML = `
            <div class="highlight-header">
                <h4>🌟 亮点 ${index + 1}</h4>
                <button class="remove-btn" onclick="removeHighlight(${index})">删除</button>
            </div>
            <div class="highlight-details">
                <div class="form-row">
                    <input type="text" value="${highlight}" class="highlight-input" data-index="${index}" placeholder="输入旅行亮点...">
                </div>
            </div>
        `;
        container.appendChild(highlightItem);
    });
}


document.addEventListener('DOMContentLoaded', async function() {
    await loadSavedData();

    const data = await loadTravelData();
    if (data) {
        loadBasicInfo();
        loadHighlights(data.highlights || []);
        loadTransportationsList();
        loadAccommodationsList();
        loadItineraryList();
        loadChecklistData();
        // 初始化预算管理
        initializeBudgetManagement();
    }
    
    document.addEventListener('keypress', function(e) {
        if (e.target.classList.contains('activity-input') && e.key === 'Enter') {
            const dayEditor = e.target.closest('.day-editor');
            addActivity(dayEditor);
        }
    });

    // 监听亮点和交通信息输入框的更改
    document.addEventListener('input', function(e) {
        if (e.target.classList.contains('highlight-input')) {
            const index = parseInt(e.target.dataset.index);
            if (travelData.highlights && index >= 0 && index < travelData.highlights.length) {
                travelData.highlights[index] = e.target.value;
                saveTravelData(travelData);
            }
        } else if (e.target.classList.contains('traveler-input')) {
            const index = parseInt(e.target.dataset.index);
            if (travelData.travelInfo && travelData.travelInfo.travelers && index >= 0 && index < travelData.travelInfo.travelers.length) {
                travelData.travelInfo.travelers[index] = e.target.value;
                saveTravelData(travelData);
            }
        }
    });
    
    const contactPhone = document.getElementById('contact-phone');
    if (contactPhone) {
        contactPhone.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addContact();
            }
        });
    }

    const newTravelerInput = document.getElementById('new-traveler-name');
    if (newTravelerInput) {
        newTravelerInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTraveler();
            }
        });
    }

    // 预算管理初始化
    initializeBudgetManagement();
});

// 预算管理功能
function initializeBudgetManagement() {
    if (travelData.budget) {
        loadBudgetData();
        renderExpensesList();
        updateBudgetCharts();
    }
}

function loadBudgetData() {
    const budget = travelData.budget;
    if (!budget) return;

    // 获取货币符号
    const currencySymbol = getCurrencySymbol(budget.currency || 'CNY');

    // 更新预算摘要卡片
    document.getElementById('total-budget-amount').textContent = `${currencySymbol}${budget.totalBudget}`;
    document.getElementById('planned-budget-amount').textContent = `${currencySymbol}${budget.summary.totalPlanned}`;
    document.getElementById('spent-budget-amount').textContent = `${currencySymbol}${budget.summary.totalSpent}`;
    document.getElementById('remaining-budget-amount').textContent = `${currencySymbol}${budget.summary.remaining}`;

    // 动态加载旅行者到付款人选择框
    loadPayerOptions();

    // 动态加载关联项目选项
    loadRelatedProjectOptions();
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

function loadPayerOptions() {
    if (travelData.travelInfo && travelData.travelInfo.travelers) {
        const payerSelect = document.getElementById('expense-payer');
        if (payerSelect) {
            payerSelect.innerHTML = '';
            travelData.travelInfo.travelers.forEach(traveler => {
                const option = document.createElement('option');
                option.value = traveler;
                option.textContent = traveler;
                payerSelect.appendChild(option);
            });
            // 添加 AA制 选项
            const aaOption = document.createElement('option');
            aaOption.value = 'AA制';
            aaOption.textContent = 'AA制';
            payerSelect.appendChild(aaOption);
        }
    }
}

function loadRelatedProjectOptions() {
    const relatedSelect = document.getElementById('expense-related');
    if (!relatedSelect) return;

    // 清空现有选项，保留"无关联"选项
    relatedSelect.innerHTML = '<option value="">无关联</option>';

    // 添加交通选项
    if (travelData.transportations && Object.keys(travelData.transportations).length > 0) {
        const transportGroup = document.createElement('optgroup');
        transportGroup.label = '交通';

        Object.keys(travelData.transportations).forEach(transportKey => {
            const option = document.createElement('option');
            option.value = transportKey;
            option.textContent = transportKey;
            transportGroup.appendChild(option);
        });

        relatedSelect.appendChild(transportGroup);
    }

    // 添加住宿选项
    if (travelData.accommodations && Object.keys(travelData.accommodations).length > 0) {
        const accommodationGroup = document.createElement('optgroup');
        accommodationGroup.label = '住宿';

        Object.keys(travelData.accommodations).forEach(accommodationKey => {
            const accommodation = travelData.accommodations[accommodationKey];
            const option = document.createElement('option');
            option.value = accommodationKey;
            option.textContent = accommodation.name || accommodationKey;
            accommodationGroup.appendChild(option);
        });

        relatedSelect.appendChild(accommodationGroup);
    }
}

function renderExpensesList() {
    const expenseList = document.getElementById('expense-list');
    if (!expenseList || !travelData.budget || !travelData.budget.expenses) return;

    expenseList.innerHTML = '';

    travelData.budget.expenses.forEach(expense => {
        const expenseItem = createExpenseItem(expense);
        expenseList.appendChild(expenseItem);
    });
}

function createExpenseItem(expense) {
    const item = document.createElement('div');
    item.className = `expense-item ${expense.status}`;
    item.dataset.expenseId = expense.id;

    const categoryInfo = getCategoryInfo(expense.category);

    item.innerHTML = `
        <div class="expense-header">
            <div class="expense-title">
                <span class="category-icon">${categoryInfo.icon}</span>
                <h4>${expense.title}</h4>
                <span class="expense-status ${expense.status}">${expense.status === 'planned' ? '计划中' : '已完成'}</span>
            </div>
            <div class="expense-amount">${getCurrencySymbol(travelData.budget?.currency || 'CNY')}${expense.amount}</div>
            <div class="expense-actions">
                <button class="edit-btn" type="button">编辑</button>
                <button class="delete-btn" type="button">删除</button>
                ${expense.status === 'planned' ? `<button class="complete-btn" type="button">标记完成</button>` : ''}
            </div>
        </div>
        <div class="expense-details">
            <div class="expense-info">
                <span><strong>类别:</strong> ${categoryInfo.name}</span>
                <span><strong>付款人:</strong> ${expense.paidBy}</span>
                <span><strong>日期:</strong> ${expense.date}</span>
                ${expense.relatedId ? `<span><strong>关联:</strong> ${expense.relatedId}</span>` : ''}
            </div>
            ${expense.description ? `<div class="expense-description">${expense.description}</div>` : ''}
        </div>
    `;

    // 手动绑定事件，避免inline onclick问题
    const editBtn = item.querySelector('.edit-btn');
    const deleteBtn = item.querySelector('.delete-btn');
    const completeBtn = item.querySelector('.complete-btn');

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            console.log('点击编辑按钮:', expense.id);
            editExpense(expense.id);
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            console.log('点击删除按钮:', expense.id);
            deleteExpense(expense.id);
        });
    }

    if (completeBtn) {
        completeBtn.addEventListener('click', () => {
            console.log('点击完成按钮:', expense.id);
            markExpenseComplete(expense.id);
        });
    }

    return item;
}

function getCategoryInfo(categoryId) {
    const category = travelData.budget.categories.find(cat => cat.id === categoryId);
    return category || { name: '其他', icon: '💰', color: '#95a5a6' };
}

function showAddExpenseForm() {
    document.getElementById('add-expense-form').style.display = 'block';
    // 设置默认日期为今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('expense-date').value = today;
}

function hideAddExpenseForm() {
    document.getElementById('add-expense-form').style.display = 'none';
    clearExpenseForm();
    resetFormToAddMode();
}

function clearExpenseForm() {
    document.getElementById('expense-title').value = '';
    document.getElementById('expense-amount').value = '';
    document.getElementById('expense-category').value = 'transportation';
    document.getElementById('expense-payer').value = travelData.travelInfo && travelData.travelInfo.travelers ? travelData.travelInfo.travelers[0] : '';
    document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];
    document.getElementById('expense-description').value = '';
    document.getElementById('expense-related').value = '';
}

function resetFormToAddMode() {
    const saveBtn = document.querySelector('#add-expense-form .save-btn');
    if (saveBtn) {
        saveBtn.textContent = '保存支出';
        saveBtn.onclick = saveExpense;
        saveBtn.removeAttribute('data-editing-id');
    }
}

function saveExpense() {
    const title = document.getElementById('expense-title').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const paidBy = document.getElementById('expense-payer').value;
    const date = document.getElementById('expense-date').value;
    const description = document.getElementById('expense-description').value.trim();
    const relatedId = document.getElementById('expense-related').value;

    // 验证必填字段
    if (!title || !amount || amount <= 0) {
        showNotification('请填写支出标题和有效金额', 'error');
        return;
    }

    // 创建新的支出记录
    const expenseId = 'exp_' + Date.now();
    const newExpense = {
        id: expenseId,
        title: title,
        amount: amount,
        category: category,
        relatedId: relatedId || null,
        paidBy: paidBy,
        date: date,
        description: description,
        status: 'planned'
    };

    // 添加到预算数据
    if (!travelData.budget) {
        travelData.budget = { expenses: [] };
    }
    if (!travelData.budget.expenses) {
        travelData.budget.expenses = [];
    }

    travelData.budget.expenses.push(newExpense);

    // 更新预算统计
    updateBudgetSummary();

    // 保存数据并刷新显示
    saveTravelData(travelData);
    renderExpensesList();
    updateBudgetCharts();
    hideAddExpenseForm();

    showNotification('支出已添加', 'success');
}

function deleteExpense(expenseId) {
    if (!confirm('确定要删除这个支出记录吗？')) return;

    if (travelData.budget && travelData.budget.expenses) {
        const index = travelData.budget.expenses.findIndex(exp => exp.id === expenseId);
        if (index !== -1) {
            travelData.budget.expenses.splice(index, 1);
            updateBudgetSummary();
            saveTravelData(travelData);
            renderExpensesList();
            updateBudgetCharts();
            showNotification('支出已删除', 'info');
        }
    }
}

function markExpenseComplete(expenseId) {
    if (travelData.budget && travelData.budget.expenses) {
        const expense = travelData.budget.expenses.find(exp => exp.id === expenseId);
        if (expense) {
            expense.status = 'completed';
            updateBudgetSummary();
            saveTravelData(travelData);
            renderExpensesList();
            updateBudgetCharts();
            showNotification('支出已标记为完成', 'success');
        }
    }
}

function filterExpenses() {
    const categoryFilter = document.getElementById('filter-category').value;
    const statusFilter = document.getElementById('filter-status').value;

    const expenseItems = document.querySelectorAll('.expense-item');

    expenseItems.forEach(item => {
        const expenseId = item.dataset.expenseId;
        const expense = travelData.budget.expenses.find(exp => exp.id === expenseId);

        let show = true;

        if (categoryFilter && expense.category !== categoryFilter) {
            show = false;
        }

        if (statusFilter && expense.status !== statusFilter) {
            show = false;
        }

        item.style.display = show ? 'block' : 'none';
    });
}

function updateBudgetSummary() {
    if (!travelData.budget || !travelData.budget.expenses) return;

    const expenses = travelData.budget.expenses;
    let totalPlanned = 0;
    let totalSpent = 0;
    const byCategory = {};
    const byTraveler = {};

    // 初始化分类统计
    travelData.budget.categories.forEach(cat => {
        byCategory[cat.id] = 0;
    });

    // 初始化旅行者统计
    if (travelData.travelInfo && travelData.travelInfo.travelers) {
        travelData.travelInfo.travelers.forEach(traveler => {
            byTraveler[traveler] = 0;
        });
    }
    byTraveler['AA制'] = 0;

    // 计算统计
    expenses.forEach(expense => {
        if (expense.status === 'completed') {
            totalSpent += expense.amount;
        }
        totalPlanned += expense.amount;

        byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
        byTraveler[expense.paidBy] = (byTraveler[expense.paidBy] || 0) + expense.amount;
    });

    const remaining = (travelData.budget.totalBudget || 0) - totalPlanned;

    // 更新预算汇总
    travelData.budget.summary = {
        totalSpent: totalSpent,
        totalPlanned: totalPlanned,
        remaining: remaining,
        byCategory: byCategory,
        byTraveler: byTraveler
    };

    // 更新显示
    loadBudgetData();
}

function updateBudgetCharts() {
    if (!travelData.budget || !travelData.budget.summary) return;

    updateCategoryChart();
    updatePayerChart();
}

function updateCategoryChart() {
    const chartContainer = document.getElementById('category-chart');
    if (!chartContainer) return;

    chartContainer.innerHTML = '';

    const byCategory = travelData.budget.summary.byCategory;
    const total = Object.values(byCategory).reduce((sum, amount) => sum + amount, 0);

    if (total === 0) {
        chartContainer.innerHTML = '<p>暂无支出数据</p>';
        return;
    }

    Object.entries(byCategory).forEach(([categoryId, amount]) => {
        if (amount > 0) {
            const categoryInfo = getCategoryInfo(categoryId);
            const percentage = (amount / total * 100).toFixed(1);

            const chartItem = document.createElement('div');
            chartItem.className = 'chart-item';
            chartItem.innerHTML = `
                <div class="chart-bar">
                    <div class="bar-fill" style="width: ${percentage}%; background-color: ${categoryInfo.color}"></div>
                </div>
                <div class="chart-label">
                    <span>${categoryInfo.icon} ${categoryInfo.name}</span>
                    <span>${getCurrencySymbol(travelData.budget?.currency || 'CNY')}${amount} (${percentage}%)</span>
                </div>
            `;

            chartContainer.appendChild(chartItem);
        }
    });
}

function updatePayerChart() {
    const chartContainer = document.getElementById('payer-chart');
    if (!chartContainer) return;

    chartContainer.innerHTML = '';

    const byTraveler = travelData.budget.summary.byTraveler;
    const total = Object.values(byTraveler).reduce((sum, amount) => sum + amount, 0);

    if (total === 0) {
        chartContainer.innerHTML = '<p>暂无支出数据</p>';
        return;
    }

    Object.entries(byTraveler).forEach(([traveler, amount]) => {
        if (amount > 0) {
            const percentage = (amount / total * 100).toFixed(1);

            const chartItem = document.createElement('div');
            chartItem.className = 'chart-item';
            chartItem.innerHTML = `
                <div class="chart-bar">
                    <div class="bar-fill" style="width: ${percentage}%; background-color: #3498db"></div>
                </div>
                <div class="chart-label">
                    <span>👤 ${traveler}</span>
                    <span>${getCurrencySymbol(travelData.budget?.currency || 'CNY')}${amount} (${percentage}%)</span>
                </div>
            `;

            chartContainer.appendChild(chartItem);
        }
    });
}

function saveBudget() {
    updateBudgetSummary();
    saveTravelData(travelData);
    showNotification('预算信息已保存！', 'success');
}

// 总预算编辑模态框功能
function showEditTotalBudgetModal() {
    const modal = document.getElementById('total-budget-modal');
    const overlay = document.getElementById('modal-overlay');
    const budgetInput = document.getElementById('modal-total-budget');
    const currencySelect = document.getElementById('modal-budget-currency');

    if (!modal || !overlay || !budgetInput || !currencySelect) return;

    // 填充当前值
    if (travelData.budget) {
        budgetInput.value = travelData.budget.totalBudget || 0;
        currencySelect.value = travelData.budget.currency || 'CNY';
    }

    // 显示模态框
    modal.style.display = 'flex';
    overlay.style.display = 'block';

    // 添加货币选择变化监听
    const updateCurrencyLabel = () => {
        const label = document.getElementById('budget-amount-label');
        if (label) {
            const symbol = getCurrencySymbol(currencySelect.value);
            label.textContent = `总预算金额（${symbol}）:`;
        }
    };

    currencySelect.addEventListener('change', updateCurrencyLabel);
    updateCurrencyLabel(); // 初始设置

    // 聚焦到输入框
    setTimeout(() => {
        budgetInput.focus();
        budgetInput.select();
    }, 100);

    // 添加键盘事件监听
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            saveTotalBudget();
        } else if (e.key === 'Escape') {
            hideEditTotalBudgetModal();
        }
    };

    document.addEventListener('keydown', handleKeyPress);
    modal._keyHandler = handleKeyPress; // 保存引用以便后续清理
}

function hideEditTotalBudgetModal() {
    const modal = document.getElementById('total-budget-modal');
    const overlay = document.getElementById('modal-overlay');

    if (modal && overlay) {
        modal.style.display = 'none';
        overlay.style.display = 'none';

        // 清理键盘事件监听
        if (modal._keyHandler) {
            document.removeEventListener('keydown', modal._keyHandler);
            delete modal._keyHandler;
        }
    }
}

function saveTotalBudget() {
    const budgetInput = document.getElementById('modal-total-budget');
    const currencySelect = document.getElementById('modal-budget-currency');

    if (!budgetInput || !currencySelect) return;

    const newBudget = parseFloat(budgetInput.value);
    const newCurrency = currencySelect.value;

    // 验证输入
    if (isNaN(newBudget) || newBudget < 0) {
        showNotification('请输入有效的预算金额', 'error');
        budgetInput.focus();
        return;
    }

    // 初始化预算数据结构（如果不存在）
    if (!travelData.budget) {
        travelData.budget = {
            totalBudget: 0,
            currency: 'CNY',
            expenses: [],
            categories: [
                {"id": "transportation", "name": "交通", "icon": "🚄", "color": "#3498db"},
                {"id": "accommodation", "name": "住宿", "icon": "🏨", "color": "#e74c3c"},
                {"id": "food", "name": "餐饮", "icon": "🍽️", "color": "#f39c12"},
                {"id": "attractions", "name": "景点", "icon": "🎫", "color": "#9b59b6"},
                {"id": "visa", "name": "签证", "icon": "📝", "color": "#1abc9c"},
                {"id": "shopping", "name": "购物", "icon": "🛍️", "color": "#e67e22"},
                {"id": "miscellaneous", "name": "其他", "icon": "💰", "color": "#95a5a6"}
            ],
            summary: {
                totalSpent: 0,
                totalPlanned: 0,
                remaining: 0,
                byCategory: {},
                byTraveler: {}
            }
        };
    }

    // 更新预算数据
    const oldBudget = travelData.budget.totalBudget;
    travelData.budget.totalBudget = newBudget;
    travelData.budget.currency = newCurrency;

    // 重新计算预算统计
    updateBudgetSummary();

    // 保存数据
    saveTravelData(travelData);

    // 刷新显示
    loadBudgetData();
    updateBudgetCharts();

    // 隐藏模态框
    hideEditTotalBudgetModal();

    // 显示成功消息
    const changeAmount = newBudget - oldBudget;
    let message = '总预算已更新！';
    if (changeAmount > 0) {
        message += ` (增加了¥${changeAmount})`;
    } else if (changeAmount < 0) {
        message += ` (减少了¥${Math.abs(changeAmount)})`;
    }

    showNotification(message, 'success');
}

// 预算集成相关辅助函数
function findRelatedExpenses(category, relatedId) {
    if (!travelData.budget || !travelData.budget.expenses) return [];

    return travelData.budget.expenses.filter(expense =>
        expense.category === category && expense.relatedId === relatedId
    );
}

function linkTransportToBudget(transportKey) {
    // 显示关联预算的快速表单
    const title = `${transportKey}费用`;
    showQuickExpenseForm(title, 'transportation', transportKey);
}

function linkAccommodationToBudget(accommodationKey) {
    // 显示关联预算的快速表单
    const accommodationName = travelData.accommodations[accommodationKey].name || accommodationKey;
    showQuickExpenseForm(accommodationName, 'accommodation', accommodationKey);
}

function showQuickExpenseForm(title, category, relatedId) {
    // 切换到预算管理页面
    showSection('budget', document.querySelector('[onclick="showSection(\'budget\', this)"]'));

    // 显示添加支出表单
    showAddExpenseForm();

    // 预填表单信息
    document.getElementById('expense-title').value = title;
    document.getElementById('expense-category').value = category;
    document.getElementById('expense-related').value = relatedId;

    // 滚动到表单位置
    setTimeout(() => {
        document.getElementById('add-expense-form').scrollIntoView({ behavior: 'smooth' });
    }, 300);
}

// 添加编辑支出功能
function editExpense(expenseId) {
    console.log('编辑支出:', expenseId); // 调试日志

    if (!travelData.budget || !travelData.budget.expenses) {
        showNotification('预算数据未加载', 'error');
        return;
    }

    const expense = travelData.budget.expenses.find(exp => exp.id === expenseId);
    if (!expense) {
        showNotification('找不到指定的支出记录', 'error');
        return;
    }

    // 显示编辑表单
    showAddExpenseForm();

    // 等待表单显示完成后再填充数据
    setTimeout(() => {
        // 填充现有数据
        const titleField = document.getElementById('expense-title');
        const amountField = document.getElementById('expense-amount');
        const categoryField = document.getElementById('expense-category');
        const payerField = document.getElementById('expense-payer');
        const dateField = document.getElementById('expense-date');
        const descriptionField = document.getElementById('expense-description');
        const relatedField = document.getElementById('expense-related');

        if (titleField) titleField.value = expense.title;
        if (amountField) amountField.value = expense.amount;
        if (categoryField) categoryField.value = expense.category;
        if (payerField) payerField.value = expense.paidBy;
        if (dateField) dateField.value = expense.date;
        if (descriptionField) descriptionField.value = expense.description || '';
        if (relatedField) relatedField.value = expense.relatedId || '';

        // 更改保存按钮为更新按钮
        const saveBtn = document.querySelector('#add-expense-form .save-btn');
        if (saveBtn) {
            saveBtn.textContent = '更新支出';
            saveBtn.onclick = () => updateExpense(expenseId);

            // 存储当前编辑的支出ID，便于取消时恢复
            saveBtn.setAttribute('data-editing-id', expenseId);
        }

        showNotification('支出数据已加载到表单中', 'info');
    }, 100);
}

function updateExpense(expenseId) {
    const title = document.getElementById('expense-title').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const paidBy = document.getElementById('expense-payer').value;
    const date = document.getElementById('expense-date').value;
    const description = document.getElementById('expense-description').value.trim();
    const relatedId = document.getElementById('expense-related').value;

    // 验证必填字段
    if (!title || !amount || amount <= 0) {
        showNotification('请填写支出标题和有效金额', 'error');
        return;
    }

    // 更新支出记录
    const expense = travelData.budget.expenses.find(exp => exp.id === expenseId);
    if (expense) {
        expense.title = title;
        expense.amount = amount;
        expense.category = category;
        expense.paidBy = paidBy;
        expense.date = date;
        expense.description = description;
        expense.relatedId = relatedId || null;

        // 更新预算统计
        updateBudgetSummary();

        // 保存数据并刷新显示
        saveTravelData(travelData);
        renderExpensesList();
        updateBudgetCharts();
        hideAddExpenseForm();

        // 重置保存按钮
        resetFormToAddMode();

        showNotification('支出已更新', 'success');
    }
}

// ============ 必备清单管理功能 ============

function loadChecklistData() {
    if (travelData.checklist) {
        loadChecklistCategories(travelData.checklist.categories || []);
        loadChecklistItems(travelData.checklist.items || []);
        loadConfirmationOverview();
    }
}

function loadChecklistCategories(categories) {
    const tabsContainer = document.getElementById('checklist-categories-tabs');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = '';

    // 添加"全部"选项
    const allTab = document.createElement('button');
    allTab.className = 'category-tab active';
    allTab.textContent = '📋 全部';
    allTab.onclick = () => filterChecklistByCategory('all', allTab);
    tabsContainer.appendChild(allTab);

    // 添加各类别选项
    categories.forEach(category => {
        const tab = document.createElement('button');
        tab.className = 'category-tab';
        tab.textContent = `${category.icon} ${category.name}`;
        tab.onclick = () => filterChecklistByCategory(category.id, tab);
        tabsContainer.appendChild(tab);
    });
}

function loadChecklistItems(items) {
    const container = document.getElementById('checklist-items-list');
    if (!container) return;

    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = '<div class="empty-checklist">暂无清单项目，点击下方添加</div>';
        return;
    }

    items.forEach(item => {
        const itemElement = createChecklistItemElement(item);
        container.appendChild(itemElement);
    });
}

function createChecklistItemElement(item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = `checklist-item ${item.category}`;
    itemDiv.dataset.itemId = item.id;
    itemDiv.dataset.category = item.category;

    const category = travelData.checklist.categories.find(c => c.id === item.category);
    const categoryIcon = category ? category.icon : '📦';
    const requiredBadge = item.required ? '<span class="required-badge">必需</span>' : '<span class="optional-badge">可选</span>';

    // 计算确认状态
    const totalTravelers = travelData.travelInfo.travelers.length;
    const confirmedCount = Object.keys(item.confirmations || {}).length;
    const confirmationStatus = `${confirmedCount}/${totalTravelers}人已确认`;

    itemDiv.innerHTML = `
        <div class="checklist-item-header">
            <div class="item-info">
                <span class="category-icon">${categoryIcon}</span>
                <span class="item-name">${item.name}</span>
                ${requiredBadge}
            </div>
            <div class="item-actions">
                <button class="edit-btn" onclick="editChecklistItem('${item.id}')">编辑</button>
                <button class="remove-btn" onclick="removeChecklistItem('${item.id}')">删除</button>
            </div>
        </div>
        <div class="checklist-item-details">
            <div class="item-description">${item.description || '暂无描述'}</div>
            <div class="confirmation-status">${confirmationStatus}</div>
            <div class="confirmation-buttons">
                ${travelData.travelInfo.travelers.map(traveler => {
                    const isConfirmed = item.confirmations && item.confirmations[traveler];
                    return `<button class="confirm-btn ${isConfirmed ? 'confirmed' : ''}"
                                  onclick="toggleConfirmation('${item.id}', '${traveler}')">
                              ${isConfirmed ? '✅' : '⭕'} ${traveler}
                          </button>`;
                }).join('')}
            </div>
        </div>
    `;

    return itemDiv;
}

function filterChecklistByCategory(categoryId, activeTab) {
    // 更新选中状态
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    activeTab.classList.add('active');

    // 过滤显示项目
    const items = document.querySelectorAll('.checklist-item');
    items.forEach(item => {
        if (categoryId === 'all' || item.dataset.category === categoryId) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function addChecklistItem() {
    const category = document.getElementById('new-item-category').value;
    const name = document.getElementById('new-item-name').value.trim();
    const description = document.getElementById('new-item-description').value.trim();
    const required = document.getElementById('new-item-required').checked;

    if (!name) {
        showNotification('请输入项目名称', 'error');
        return;
    }

    const newItem = {
        id: `item_${Date.now()}`,
        category: category,
        name: name,
        description: description,
        required: required,
        confirmations: {}
    };

    if (!travelData.checklist) {
        travelData.checklist = { items: [], categories: [] };
    }

    if (!travelData.checklist.items) {
        travelData.checklist.items = [];
    }

    travelData.checklist.items.push(newItem);

    // 重新加载列表
    loadChecklistItems(travelData.checklist.items);

    // 清空表单
    document.getElementById('new-item-name').value = '';
    document.getElementById('new-item-description').value = '';
    document.getElementById('new-item-required').checked = true;

    showNotification('项目已添加', 'success');
}

function toggleConfirmation(itemId, travelerName) {
    const item = travelData.checklist.items.find(i => i.id === itemId);
    if (!item) return;

    if (!item.confirmations) {
        item.confirmations = {};
    }

    if (item.confirmations[travelerName]) {
        delete item.confirmations[travelerName];
    } else {
        item.confirmations[travelerName] = new Date().toISOString();
    }

    // 重新加载列表以更新状态
    loadChecklistItems(travelData.checklist.items);
    loadConfirmationOverview();

    showNotification(`已更新 ${travelerName} 的确认状态`, 'info');
}

function removeChecklistItem(itemId) {
    if (confirm('确定要删除这个项目吗？')) {
        travelData.checklist.items = travelData.checklist.items.filter(item => item.id !== itemId);
        loadChecklistItems(travelData.checklist.items);
        loadConfirmationOverview();
        showNotification('项目已删除', 'success');
    }
}

function loadConfirmationOverview() {
    const container = document.getElementById('confirmation-overview');
    if (!container || !travelData.checklist || !travelData.checklist.items) return;

    const travelers = travelData.travelInfo.travelers;
    const items = travelData.checklist.items;

    container.innerHTML = travelers.map(traveler => {
        const confirmedItems = items.filter(item =>
            item.confirmations && item.confirmations[traveler]
        ).length;
        const totalItems = items.length;
        const progress = totalItems > 0 ? (confirmedItems / totalItems * 100).toFixed(1) : 0;

        return `
            <div class="traveler-progress">
                <div class="traveler-name">👤 ${traveler}</div>
                <div class="progress-info">
                    <span class="progress-text">${confirmedItems}/${totalItems} 项已确认</span>
                    <div class="progress-bar-container">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress}%"></div>
                        </div>
                        <span class="progress-percent">${progress}%</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function saveChecklist() {
    saveTravelData(travelData);
    showNotification('必备清单已保存', 'success');
}