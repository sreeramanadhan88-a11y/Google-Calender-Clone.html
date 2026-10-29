const API_BASE_URL = "http://127.0.0.1:8000/api";

// ---------- API Configuration ----------

function getAccessToken() {
    return sessionStorage.getItem("access_token");
}

async function apiRequest(endpoint, options = {}) {
    const token = getAccessToken();

    const headers = {
        "Content-Type": "application/json",
        ...options.headers
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        let message = "";
        try {
            message = await response.text();
        } catch (e) {
            message = response.statusText;
        }
        throw new Error(`API error (${response.status}): ${message}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

// ---------- HTML Elements ----------

const currentDateElement = document.getElementById("currentDate");
const calendarContainer = document.getElementById("calendarContainer");
const viewSelect = document.getElementById("viewSelect");

const todayBtn = document.getElementById("todayBtn");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

const calendarList = document.getElementById("calendarList");
const eventCalendar = document.getElementById("eventCalendar");

// Authentication elements
const authButtons = document.getElementById("authButtons");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const loginDialog = document.getElementById("loginDialog");
const loginForm = document.getElementById("loginForm");
const cancelLoginBtn = document.getElementById("cancelLoginBtn");
const loginMessage = document.getElementById("loginMessage");

// Profile elements
const profileContainer = document.getElementById("profileContainer");
const profileBtn = document.getElementById("profileBtn");
const profileMenu = document.getElementById("profileMenu");
const profileInitial = document.getElementById("profileInitial");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileLogoutBtn = document.getElementById("profileLogoutBtn");

// Registration elements
const registerBtn = document.getElementById("registerBtn");
const registerDialog = document.getElementById("registerDialog");
const registerForm = document.getElementById("registerForm");
const cancelRegisterBtn = document.getElementById("cancelRegisterBtn");
const showRegisterFromLogin = document.getElementById("showRegisterFromLogin");
const showLoginFromRegister = document.getElementById("showLoginFromRegister");
const registerMessage = document.getElementById("registerMessage");

// Event Dialog elements
const createEventBtn = document.getElementById("createEventBtn");
const eventDialog = document.getElementById("eventDialog");
const eventForm = document.getElementById("eventForm");
const cancelEventBtn = document.getElementById("cancelEventBtn");

// ---------- Calendar State ----------

let selectedDate = new Date();
let currentView = "month";
const today = new Date();
let events = [];

// ---------- Date Helpers ----------

function formatDate(date) {
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function getDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

// ---------- Event Rendering Helper ----------

function renderEventsForSelector(selector) {
    events.forEach(event => {
        const eventDate = new Date(event.start_time);

        if (Number.isNaN(eventDate.getTime())) {
            console.warn("Invalid event start_time:", event);
            return;
        }

        const dateKey = getDateKey(eventDate);

        const dayCell = calendarContainer.querySelector(
            `${selector}[data-date="${dateKey}"]`
        );

        if (dayCell) {
            const eventsContainer = dayCell.querySelector(".day-events");

            if (!eventsContainer) {
                return;
            }

            const eventElement = document.createElement("div");
            eventElement.className = "calendar-event";
            eventElement.textContent = event.title;

            eventsContainer.appendChild(eventElement);
        }
    });
}

// ---------- Calendar Rendering ----------

function renderCalendar() {
    currentView = viewSelect.value;

    if (currentView === "month") {
        renderMonthView();
    } else if (currentView === "week") {
        renderWeekView();
    } else if (currentView === "day") {
        renderDayView();
    } else {
        renderAgendaView();
    }
}

// ---------- Month View ----------

function renderMonthView() {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();

    currentDateElement.textContent =
        selectedDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric"
        });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let html = `
        <div class="month-grid">
            <div class="weekday">Sun</div>
            <div class="weekday">Mon</div>
            <div class="weekday">Tue</div>
            <div class="weekday">Wed</div>
            <div class="weekday">Thu</div>
            <div class="weekday">Fri</div>
            <div class="weekday">Sat</div>
    `;

    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = getDateKey(date) === getDateKey(today);

        html += `
            <div class="calendar-day ${isToday ? "today" : ""}"
                 data-date="${getDateKey(date)}">
                <span class="day-number">${day}</span>
                <div class="day-events"></div>
            </div>
        `;
    }

    html += `</div>`;
    calendarContainer.innerHTML = html;

    renderEventsForSelector(".calendar-day");
}

// ---------- Week View ----------

function renderWeekView() {
    const start = new Date(selectedDate);
    start.setDate(start.getDate() - start.getDay());

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    currentDateElement.textContent =
        `${formatDate(start)} – ${formatDate(end)}`;

    let html = `<div class="week-grid">`;

    for (let i = 0; i < 7; i++) {
        const date = new Date(start);
        date.setDate(start.getDate() + i);

        const isToday = getDateKey(date) === getDateKey(today);

        html += `
            <div class="week-day ${isToday ? "today" : ""}"
                 data-date="${getDateKey(date)}">
                <div class="weekday">
                    ${date.toLocaleDateString("en-US", {
                        weekday: "short"
                    })}
                </div>

                <div class="day-number">${date.getDate()}</div>
                <div class="day-events"></div>
            </div>
        `;
    }

    html += `</div>`;
    calendarContainer.innerHTML = html;

    renderEventsForSelector(".week-day");
}

// ---------- Day View ----------

function renderDayView() {
    currentDateElement.textContent = formatDate(selectedDate);

    const dateKey = getDateKey(selectedDate);

    calendarContainer.innerHTML = `
        <div class="single-day-view">
            <h3>${formatDate(selectedDate)}</h3>
            <div class="day-events" data-date="${dateKey}"></div>
        </div>
    `;

    const eventsContainer = calendarContainer.querySelector(".day-events");

    const matchingEvents = events.filter(event => {
        const eventDate = new Date(event.start_time);

        return (
            !Number.isNaN(eventDate.getTime()) &&
            getDateKey(eventDate) === dateKey
        );
    });

    if (matchingEvents.length === 0) {
        eventsContainer.textContent = "No events for this day.";
        return;
    }

    matchingEvents.forEach(event => {
        const eventElement = document.createElement("div");
        eventElement.className = "calendar-event";
        eventElement.textContent = event.title;

        eventsContainer.appendChild(eventElement);
    });
}

// ---------- Agenda View ----------

function renderAgendaView() {
    currentDateElement.textContent =
        `Agenda · ${formatDate(selectedDate)}`;

    calendarContainer.innerHTML = `
        <div class="agenda-view">
            <h3>Upcoming events</h3>
            <div class="agenda-events"></div>
        </div>
    `;

    const agendaContainer =
        calendarContainer.querySelector(".agenda-events");

    const upcomingEvents = events
        .filter(event => {
            const eventDate = new Date(event.start_time);

            return (
                !Number.isNaN(eventDate.getTime()) &&
                getDateKey(eventDate) >= getDateKey(selectedDate)
            );
        })
        .sort(
            (a, b) =>
                new Date(a.start_time) - new Date(b.start_time)
        );

    if (upcomingEvents.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "agenda-empty";
        emptyMessage.textContent = "No upcoming events.";
        agendaContainer.appendChild(emptyMessage);
        return;
    }

    upcomingEvents.forEach(event => {
        const eventElement = document.createElement("div");
        eventElement.className = "calendar-event";

        const eventDate = new Date(event.start_time);

        eventElement.textContent =
            `${formatDate(eventDate)} — ${event.title}`;

        agendaContainer.appendChild(eventElement);
    });
}

// ---------- Date Navigation ----------

function changePeriod(amount) {
    if (currentView === "month") {
        selectedDate.setMonth(selectedDate.getMonth() + amount);
    } else if (currentView === "week") {
        selectedDate.setDate(selectedDate.getDate() + amount * 7);
    } else {
        selectedDate.setDate(selectedDate.getDate() + amount);
    }

    renderCalendar();
}

prevBtn.addEventListener("click", () => changePeriod(-1));
nextBtn.addEventListener("click", () => changePeriod(1));
todayBtn.addEventListener("click", () => {
    selectedDate = new Date();
    renderCalendar();
});
viewSelect.addEventListener("change", () => renderCalendar());
menuBtn.addEventListener("click", () => sidebar.classList.toggle("sidebar-hidden"));

// ---------- Load User Calendars ----------

async function loadCalendars() {
    if (!calendarList) return;
    calendarList.textContent = "Loading calendars...";

    if (!getAccessToken()) {
        calendarList.textContent = "Please log in to view your calendars.";
        if (eventCalendar) {
            eventCalendar.innerHTML = '<option value="">Select a calendar</option>';
        }
        return;
    }

    try {
        const calendars = await apiRequest("/calendars/");

        calendarList.innerHTML = "";
        if (eventCalendar) {
            eventCalendar.innerHTML = '<option value="">Select a calendar</option>';
        }

        if (!Array.isArray(calendars) || calendars.length === 0) {
            calendarList.textContent = "No calendars found.";
            return;
        }

        let defaultCalendarId = null;

        calendars.forEach(calendar => {
            const item = document.createElement("div");
            item.className = "calendar-item";

            const name = document.createElement("span");
            name.textContent = calendar.name;

            if (calendar.is_default) {
                name.textContent += " (Default)";
                defaultCalendarId = calendar.id;
            }

            item.appendChild(name);
            calendarList.appendChild(item);

            if (eventCalendar) {
                const option = document.createElement("option");
                option.value = calendar.id;
                option.textContent = calendar.is_default
                    ? `${calendar.name} (Default)`
                    : calendar.name;

                eventCalendar.appendChild(option);
            }
        });

        if (eventCalendar && defaultCalendarId) {
            eventCalendar.value = String(defaultCalendarId);
        }
    } catch (error) {
        console.error("Failed to load calendars:", error);
        calendarList.textContent = "Could not load calendars. Check your login and server.";
        if (eventCalendar) {
            eventCalendar.innerHTML = '<option value="">Select a calendar</option>';
        }
    }
}

// ---------- Load User Events ----------

async function loadEvents() {
    if (!getAccessToken()) {
        events = [];
        renderCalendar();
        return;
    }

    try {
        const data = await apiRequest("/events/");
        events = Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Failed to load events:", error);
        events = [];
    }

    renderCalendar();
}

// ---------- Registration Dialog Handlers ----------

registerBtn.addEventListener("click", () => {
    registerMessage.textContent = "";
    registerDialog.showModal();
});

cancelRegisterBtn.addEventListener("click", () => {
    registerDialog.close();
});

showRegisterFromLogin.addEventListener("click", () => {
    loginDialog.close();
    registerMessage.textContent = "";
    registerDialog.showModal();
});

showLoginFromRegister.addEventListener("click", () => {
    registerDialog.close();
    loginMessage.textContent = "";
    loginDialog.showModal();
});

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("registerUsername").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    registerMessage.textContent = "";

    if (password !== confirmPassword) {
        registerMessage.textContent = "Passwords do not match.";
        return;
    }

    registerMessage.textContent = "Creating account...";

    try {
        const response = await fetch(`${API_BASE_URL}/accounts/register/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            const errors = Object.values(data).flat().join(" ");
            throw new Error(errors || "Registration failed.");
        }

        registerMessage.textContent = "Account created successfully! Please log in.";
        registerForm.reset();
        
        // Close register dialog and open login dialog smoothly
        setTimeout(() => {
            registerDialog.close();
            loginMessage.textContent = "Account created! Please log in with your credentials.";
            loginDialog.showModal();
        }, 1000);

    } catch (error) {
        registerMessage.textContent = error.message;
    }
});

// ---------- Authentication UI ----------

function updateAuthUI() {
    const isLoggedIn = Boolean(getAccessToken());

    authButtons.hidden = isLoggedIn;
    profileContainer.hidden = !isLoggedIn;
    logoutBtn.hidden = true;

    if (!isLoggedIn) {
        profileName.textContent = "User";
        profileEmail.textContent = "";
        profileInitial.textContent = "U";
        profileMenu.hidden = true;
        profileBtn.setAttribute("aria-expanded", "false");
    }
}

async function loadUserProfile() {
    if (!getAccessToken()) return;

    try {
        const user = await apiRequest("/accounts/me/");
        const username = user.username || user.name || "User";

        profileName.textContent = username;
        profileEmail.textContent = user.email || "";
        profileInitial.textContent = username.charAt(0).toUpperCase();
    } catch (error) {
        console.error("Failed to load user profile:", error);
        profileName.textContent = "User";
        profileEmail.textContent = "";
        profileInitial.textContent = "U";
    }
}

profileBtn.addEventListener("click", () => {
    const isOpening = profileMenu.hidden;
    profileMenu.hidden = !isOpening;
    profileBtn.setAttribute("aria-expanded", String(isOpening));
});

document.addEventListener("click", event => {
    if (!profileContainer.contains(event.target) && !profileMenu.hidden) {
        profileMenu.hidden = true;
        profileBtn.setAttribute("aria-expanded", "false");
    }
});

loginBtn.addEventListener("click", () => {
    loginMessage.textContent = "";
    loginDialog.showModal();
});

cancelLoginBtn.addEventListener("click", () => {
    loginDialog.close();
});

// ---------- Login ----------

loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    loginMessage.textContent = "Logging in...";

    try {
        const response = await fetch(`${API_BASE_URL}/token/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            throw new Error("Invalid username or password.");
        }

        const tokens = await response.json();
        sessionStorage.setItem("access_token", tokens.access);

        if (tokens.refresh) {
            sessionStorage.setItem("refresh_token", tokens.refresh);
        }

        loginDialog.close();
        loginForm.reset();

        updateAuthUI();
        await loadUserProfile(); // Populates profile name & initial immediately
        await loadCalendars();
        await loadEvents();

        loginMessage.textContent = "";
    } catch (error) {
        loginMessage.textContent = error.message;
    }
});

// ---------- Logout ----------

async function logoutUser() {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");

    events = [];
    updateAuthUI();
    await loadCalendars();
    renderCalendar();
}

profileLogoutBtn.addEventListener("click", logoutUser);
logoutBtn.addEventListener("click", logoutUser);

// ---------- Create Event Dialog & Form ----------

createEventBtn.addEventListener("click", () => {
    if (!getAccessToken()) {
        alert("Please log in before creating an event.");
        loginMessage.textContent = "";
        loginDialog.showModal();
        return;
    }

    eventForm.reset();

    const start = new Date();
    start.setMinutes(0, 0, 0);

    const end = new Date(start);
    end.setHours(end.getHours() + 1);

    const toLocalDateTime = (date) => {
        const offset = date.getTimezoneOffset();
        return new Date(date.getTime() - offset * 60000)
            .toISOString()
            .slice(0, 16);
    };

    document.getElementById("eventStart").value = toLocalDateTime(start);
    document.getElementById("eventEnd").value = toLocalDateTime(end);

    eventDialog.showModal();
});

cancelEventBtn.addEventListener("click", () => {
    eventDialog.close();
});

eventForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = document.getElementById("eventTitle").value.trim();
    const description = document.getElementById("eventDescription").value.trim();
    const startTime = document.getElementById("eventStart").value;
    const endTime = document.getElementById("eventEnd").value;
    const calendarId = eventCalendar.value;

    if (!title || !startTime || !endTime || !calendarId) {
        alert("Please fill in the title, start time, end time, and calendar.");
        return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
        alert("End time must be after start time.");
        return;
    }

    try {
        await apiRequest("/events/", {
            method: "POST",
            body: JSON.stringify({
                title: title,
                description: description,
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                calendar: Number(calendarId)
            })
        });

        eventDialog.close();
        eventForm.reset();
        await loadEvents();
        alert("Event created successfully!");
    } catch (error) {
        console.error("Error creating event:", error);
        alert(`Something went wrong while saving the event: ${error.message}`);
    }
});

// ---------- Initial Setup ----------

updateAuthUI();
if (getAccessToken()) {
    loadUserProfile();
}
renderCalendar();
loadCalendars();
loadEvents();

// ---------- Dark Theme Toggle ----------

const themeToggleBtn = document.getElementById("themeToggleBtn");

// Check for saved user preference on load
const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
    document.documentElement.setAttribute("data-theme", savedTheme);
    if (themeToggleBtn) {
        themeToggleBtn.textContent = savedTheme === "dark" ? "☀️" : "🌙";
    }
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
        const currentTheme = document.documentElement.getAttribute("data-theme");
        const newTheme = currentTheme === "dark" ? "light" : "dark";

        if (newTheme === "dark") {
            document.documentElement.setAttribute("data-theme", "dark");
            localStorage.setItem("theme", "dark");
            themeToggleBtn.textContent = "☀️";
        } else {
            document.documentElement.removeAttribute("data-theme");
            localStorage.setItem("theme", "light");
            themeToggleBtn.textContent = "🌙";
        }
    });
}