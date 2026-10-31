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
const searchInput = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const searchResults = document.getElementById("searchResults");

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
let activeCalendarId = null;

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

function formatDateInput(date) {
    return getDateKey(date);
}

function formatTimeInput(date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${hours}:${minutes}`;
}

// ---------- Event Rendering Helper ----------

function renderEventsForSelector(selector) {
    getFilteredEvents().forEach(event => {

        const eventDate = new Date(event.start_time);

        if (Number.isNaN(eventDate.getTime())) {
            console.warn("Invalid event start_time:", event);
            return;
        }

        const dateKey = getDateKey(eventDate);

        const dayCell = calendarContainer.querySelector(
            `${selector}[data-date="${dateKey}"]`
        );

        if (!dayCell) return;

        const eventsContainer = dayCell.querySelector(".day-events");

        if (!eventsContainer) return;

        const eventElement = document.createElement("div");

        eventElement.className = "calendar-event";
        eventElement.title = event.title || "Event scheduled";

        const eventTime = eventDate.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit"
        });

        eventElement.textContent = `${eventTime} - ${event.title}`;

        eventElement.setAttribute(
            "aria-label",
            event.title || "Event scheduled"
        );

        eventsContainer.appendChild(eventElement);
    });
}

function getFilteredEvents() {
    if (activeCalendarId === null) {
        return events;
    }

    return events.filter(
        event => String(event.calendar) === String(activeCalendarId)
    );
}

function searchEvents() {
    const searchText = searchInput.value.trim().toLowerCase();

    searchResults.innerHTML = "";
    searchResults.classList.add("hidden");

    if (!searchText) {
        renderCalendar();
        return;
    }

    const filteredEvents = getFilteredEvents().filter(event =>
        (event.title || "").toLowerCase().includes(searchText)
    );

    if (filteredEvents.length === 0) {
        searchResults.innerHTML = `
            <p class="text-sm text-muted p-3">
                No events found.
            </p>
        `;
    } else {
        filteredEvents.forEach(event => {
            const item = document.createElement("div");

            item.className = `
                p-3 mb-2 rounded-xl border border-border
                bg-surface hover:bg-surface-hover
                cursor-pointer transition-all
            `;

            const title = document.createElement("p");
            title.className = "font-semibold text-sm";
            title.textContent = event.title || "Untitled event";
            item.appendChild(title);

            item.addEventListener("click", () => {
                showEventDetails(event);
            });

            searchResults.appendChild(item);
        });
    }

    searchResults.classList.remove("hidden");
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

    // Events are intentionally not shown in the month grid.
    // They appear only in the week view.
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

    const matchingEvents = getFilteredEvents().filter(event => {
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

    const upcomingEvents = getFilteredEvents()
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

viewSelect.addEventListener("change", () => {
    const selectedView = viewSelect.value;

    window.location.href = `${selectedView}.html`;
});
menuBtn.addEventListener("click", () => sidebar.classList.toggle("sidebar-hidden"));

// ---------- Load User Calendars ----------

async function loadCalendars() {
    if (!calendarList) return;

    calendarList.textContent = "Loading calendars...";

    if (!getAccessToken()) {
        calendarList.textContent =
            "Please log in to view your calendars.";

        if (eventCalendar) {
            eventCalendar.innerHTML =
                '<option value="">Select a calendar</option>';
        }

        return;
    }

    try {
        const data = await apiRequest("/calendars/");

        // Support regular and paginated API responses
        const calendars = Array.isArray(data)
            ? data
            : (data.results || []);

        calendarList.replaceChildren();

        if (eventCalendar) {
            eventCalendar.innerHTML =
                '<option value="">Select a calendar</option>';
        }

        if (calendars.length === 0) {
            calendarList.textContent = "No calendars found.";
            return;
        }

        let defaultCalendarId = null;

        calendars.forEach((calendar) => {
            // Create the clickable sidebar item
            const item = document.createElement("div");
            item.className = "calendar-item";
            item.dataset.calendarId = String(calendar.id);
            item.style.display = "flex";
            item.style.alignItems = "center";
            item.style.gap = "10px";
            item.style.padding = "8px";
            item.style.borderRadius = "8px";
            item.style.cursor = "pointer";
            item.style.transition = "background-color 0.2s";

            item.setAttribute("role", "button");
            item.setAttribute("tabindex", "0");

            // Calendar color indicator
            const colorDot = document.createElement("span");
            colorDot.style.width = "12px";
            colorDot.style.height = "12px";
            colorDot.style.borderRadius = "50%";
            colorDot.style.backgroundColor =
                calendar.color || "#4285F4";
            colorDot.style.flexShrink = "0";

            // Calendar name
            const name = document.createElement("span");
            name.textContent = calendar.name;

            if (calendar.is_default) {
                defaultCalendarId = calendar.id;
            }

            item.append(colorDot, name);
            calendarList.appendChild(item);

            // Select or deselect this calendar
            function toggleCalendarFilter() {
                if (
                    String(activeCalendarId) ===
                    String(calendar.id)
                ) {
                    // Click again to show all calendars
                    activeCalendarId = null;
                } else {
                    activeCalendarId = calendar.id;
                }

                updateCalendarSelection();
                renderCalendar();
                renderUpcomingEvents();
            }

            item.addEventListener("click", toggleCalendarFilter);

            // Keyboard accessibility
            item.addEventListener("keydown", (event) => {
                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();
                    toggleCalendarFilter();
                }
            });

            // Add calendar to event form dropdown
            if (eventCalendar) {
                const option = document.createElement("option");

                option.value = calendar.id;
                option.textContent = calendar.name;
                eventCalendar.appendChild(option);
            }
        });

        // Keep the default calendar selected in the event form
        if (eventCalendar && defaultCalendarId !== null) {
            eventCalendar.value = String(defaultCalendarId);
        }

        updateCalendarSelection();

    } catch (error) {
        console.error("Failed to load calendars:", error);

        calendarList.textContent =
            "Could not load calendars. Check your login and server.";

        if (eventCalendar) {
            eventCalendar.innerHTML =
                '<option value="">Select a calendar</option>';
        }
    }
}

function updateCalendarSelection() {
    if (!calendarList) return;

    const items = calendarList.querySelectorAll(".calendar-item");

    items.forEach((item) => {
        const isSelected =
            activeCalendarId !== null &&
            item.dataset.calendarId === String(activeCalendarId);

        item.style.backgroundColor = isSelected
            ? "rgba(66, 133, 244, 0.15)"
            : "transparent";

        item.style.fontWeight = isSelected ? "600" : "400";
        item.setAttribute("aria-pressed", String(isSelected));
    });
}

// ---------- Load User Events ----------

async function loadEvents() {
    if (!getAccessToken()) {
        events = [];
        renderCalendar();
        renderUpcomingEvents();
        return;
    }

    try {
        const data = await apiRequest("/events/");

        events = Array.isArray(data)
            ? data
            : (data.results || []);

    } catch (error) {
        console.error("Failed to load events:", error);
        events = [];
    }

    renderCalendar();
    renderUpcomingEvents();
}

function renderUpcomingEvents() {
    const container = document.getElementById("upcomingEvents");

    if (!container) return;

    container.replaceChildren();

    // Reset notification count
    const countBadge = document.getElementById("upcomingCount");

    if (countBadge) {
        countBadge.textContent = "0";
    }

    // Ask the user to log in if there is no access token
    if (!getAccessToken()) {
        const message = document.createElement("p");
        message.className = "upcoming-empty";
        message.textContent = "Log in to see upcoming events.";
        container.appendChild(message);
        return;
    }

    const now = new Date();
    const next7Days = new Date(
        now.getTime() + 7 * 24 * 60 * 60 * 1000
    );

    // Find events starting within the next 7 days
    const upcomingEvents = getFilteredEvents()
        .filter(event => {
            const startTime = new Date(event.start_time);

            return (
                !Number.isNaN(startTime.getTime()) &&
                startTime > now &&
                startTime <= next7Days
            );
        })
        .sort(
            (a, b) =>
                new Date(a.start_time) - new Date(b.start_time)
        );

    if (upcomingEvents.length === 0) {
        const message = document.createElement("p");
        message.className = "upcoming-empty";
        message.textContent = "No upcoming events in the next 7 days.";
        container.appendChild(message);
        return;
    }

    // Update notification count
    if (countBadge) {
        countBadge.textContent = upcomingEvents.length;
    }

    upcomingEvents.forEach((event) => {
        const item = document.createElement("div");

        item.className = `
            group p-3 mb-2
            bg-surface
            border border-border
            border-l-4 border-l-primary
            rounded-xl
            shadow-sm
            hover:shadow-md
            hover:bg-surface-hover
            hover:-translate-y-0.5
            transition-all duration-200
            cursor-pointer
        `;

        const title = document.createElement("div");

        title.className = `
            text-sm font-semibold
            text-[var(--text)]
            mb-2
            break-words
            group-hover:text-primary
        `;

        title.textContent = event.title || "Untitled event";

        const time = document.createElement("div");

        time.className = `
            text-xs
            text-muted
            flex items-center gap-2
        `;

        const startTime = new Date(event.start_time);

        time.textContent = startTime.toLocaleString([], {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });

        item.append(title, time);

        // Make notification clickable
        item.setAttribute("role", "button");
        item.tabIndex = 0;

        item.addEventListener("click", () => {
            showEventDetails(event);
        });

        item.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                showEventDetails(event);
            }
        });

        container.appendChild(item);
    });
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
        await loadUserProfile();
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
    renderUpcomingEvents();
}

profileLogoutBtn.addEventListener("click", logoutUser);
logoutBtn.addEventListener("click", logoutUser);

/* ---------- Create Event Dialog & Form ---------- */

// Open the Create Event dialog
createEventBtn.addEventListener("click", () => {
    if (!getAccessToken()) {
        alert("Please log in before creating an event.");

        loginMessage.textContent = "";

        if (!loginDialog.open) {
            loginDialog.showModal();
        }

        return;
    }

    // Reset the form for a new event
    eventForm.reset();

    const eventIdInput = document.getElementById("eventId");
    if (eventIdInput) {
        eventIdInput.value = "";
    }

    // Set today's date and default start time
    const now = new Date();
    now.setMinutes(0, 0, 0);

    document.getElementById("eventDate").value = formatDateInput(now);

    const startInput = document.getElementById("eventStartTime");
    if (startInput) startInput.value = formatTimeInput(now);

    document.getElementById("eventDialogTitle").textContent = "Create Event";

    if (!eventDialog.open) {
        eventDialog.showModal();
    }
});

// Close the dialog
cancelEventBtn.addEventListener("click", () => {
    eventDialog.close();
});

// Save a new event
eventForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!getAccessToken()) {
        alert("Your session has expired. Please log in again.");
        return;
    }

    const title = document.getElementById("eventTitle").value.trim();
    const description = document.getElementById("eventDescription").value.trim();
    const date = document.getElementById("eventDate").value;
    const startTime = document.getElementById("eventStartTime").value;

    const eventType = document.getElementById("eventType").value;
    const calendarId = eventCalendar ? eventCalendar.value : "";

    // Validate required fields
    if (!title || !date || !startTime) {
        alert("Please fill in the title, date, and start time.");
        return;
    }

    // Convert the selected date and start time into a Date object
    const start = new Date(`${date}T${startTime}`);

    if (Number.isNaN(start.getTime())) {
        alert("Please enter a valid date and time.");
        return;
    }

    // Automatically set end time to one hour after start time
    const end = new Date(start.getTime() + 60 * 60 * 1000);

    const saveButton = document.getElementById("saveEventBtn");
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const eventData = {
            title: title,
            description: description,
            start_time: start.toISOString(),
            end_time: end.toISOString(),
            event_type: eventType
        };

        if (calendarId) {
            eventData.calendar = Number(calendarId);
        }

        await apiRequest("/events/", {
            method: "POST",
            body: JSON.stringify(eventData)
        });

        // Close only after the API successfully creates the event
        eventDialog.close();
        eventForm.reset();

        await loadEvents();

        alert("Event created successfully!");

    } catch (error) {
        console.error("Error creating event:", error);

        alert(`Could not save the event: ${error.message}`);

    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save";
    }
});

// ---------- Hide End Time Field ----------
// End time is set automatically (start + 1 hour), so the field is not needed.

(function hideEndTimeField() {
    const endInput = document.getElementById("eventEndTime");

    if (endInput) {
        endInput.required = false;
        endInput.disabled = true;
        endInput.hidden = true;
        endInput.style.display = "none";
    }

    const endLabel = document.querySelector('label[for="eventEndTime"]');

    if (endLabel) {
        endLabel.hidden = true;
        endLabel.style.display = "none";
    }
})();

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
    if (savedTheme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
    }
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

// ---------- Event Details ----------

let currentActiveEventId = null;

function showEventDetails(event) {
    const dialog = document.getElementById("eventDetailsDialog");

    if (!dialog) {
        console.error("Event details dialog not found in index.html");
        return;
    }

    currentActiveEventId = event.id;

    const start = new Date(event.start_time);

    document.getElementById("detailTitle").textContent =
        event.title || "Untitled event";

    document.getElementById("detailType").textContent =
        event.event_type || "Event";

    document.getElementById("detailDate").textContent =
        !Number.isNaN(start.getTime())
            ? start.toLocaleDateString([], {
                day: "numeric",
                month: "long",
                year: "numeric"
            })
            : "Date unavailable";

    document.getElementById("detailStart").textContent =
        !Number.isNaN(start.getTime())
            ? start.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            })
            : "Unavailable";

    document.getElementById("detailDescription").textContent =
        event.description || "No description provided.";

    if (!dialog.open) {
        dialog.showModal();
    }
}

const eventDetailsDialog = document.getElementById("eventDetailsDialog");

if (eventDetailsDialog) {
    // Close with the button (works even if the click lands on an icon inside it)
    eventDetailsDialog.addEventListener("click", (e) => {
        // Any button inside the dialog except Delete closes it,
        // so this works whatever ID the close button has in your HTML
        const clickedButton = e.target.closest("button");

        if (clickedButton && clickedButton.id !== "deleteEventBtn") {
            e.preventDefault();
            eventDetailsDialog.close();
            return;
        }

        // Clicking the dark backdrop outside the dialog also closes it
        if (e.target === eventDetailsDialog) {
            eventDetailsDialog.close();
        }
    });
}

// ---------- Delete Event Handler ----------

const deleteEventBtn = document.getElementById("deleteEventBtn");

if (deleteEventBtn) {
    deleteEventBtn.addEventListener("click", async () => {
        if (!currentActiveEventId) return;

        if (!confirm("Are you sure you want to delete this event?")) {
            return;
        }

        try {
            deleteEventBtn.disabled = true;
            deleteEventBtn.textContent = "Deleting...";

            await apiRequest(`/events/${currentActiveEventId}/`, {
                method: "DELETE"
            });

            eventDetailsDialog.close();
            await loadEvents();
            alert("Event deleted successfully!");

        } catch (error) {
            console.error("Failed to delete event:", error);
            alert(`Could not delete the event: ${error.message}`);
        } finally {
            deleteEventBtn.disabled = false;
            deleteEventBtn.textContent = "Delete";
            currentActiveEventId = null;
        }
    });
}