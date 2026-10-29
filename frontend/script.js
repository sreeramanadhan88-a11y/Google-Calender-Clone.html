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

// Open Event Dialog when Create button is clicked
createEventBtn.addEventListener("click", () => {
    if (!getAccessToken()) {
        alert("Please log in before creating an item.");
        return;
    }

    eventForm.reset();

    const eventIdInput = document.getElementById("eventId");
    if (eventIdInput) {
        eventIdInput.value = "";
    }

    const eventDate = document.getElementById("eventDate");
    if (eventDate) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        eventDate.value = `${year}-${month}-${day}`;
    }

    document.getElementById("eventDialogTitle").textContent = "Create Event";

    if (!eventDialog.open) {
        eventDialog.showModal();
    }
});

// Close Event Dialog when Cancel is clicked
cancelEventBtn.addEventListener("click", () => {
    eventDialog.close();
});

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
    // events.forEach(event => {
    //     const eventDate = new Date(event.start_time);

    //     if (Number.isNaN(eventDate.getTime())) {
    //         console.warn("Invalid event start_time:", event);
    //         return;
    //     }

    //     const dateKey = getDateKey(eventDate);

    //     const dayCell = calendarContainer.querySelector(
    //         `${selector}[data-date="${dateKey}"]`
    //     );

    //     if (dayCell) {
    //         const eventsContainer = dayCell.querySelector(".day-events");

    //         if (!eventsContainer) {
    //             return;
    //         }

    //         // Show a small event indicator without the event name
    //         const eventElement = document.createElement("div");
    //         eventElement.className = "calendar-event";
    //         eventElement.setAttribute("aria-label", "Event scheduled");
    //         eventElement.title = "Event scheduled";

    //         eventsContainer.appendChild(eventElement);
    //     }
    // });

    return;
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
            eventCalendar.innerHTML =
                '<option value="">Select a calendar</option>';
        }

        return;
    }

    try {
        const data = await apiRequest("/calendars/");

        // Support both regular and paginated API responses
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
            // Display calendar in the sidebar
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

            // Add calendar to the event form dropdown
            if (eventCalendar) {
                const option = document.createElement("option");

                option.value = calendar.id;
                option.textContent = calendar.is_default
                    ? `${calendar.name} (Default)`
                    : calendar.name;

                eventCalendar.appendChild(option);
            }
        });

        // Automatically select the default calendar
        if (eventCalendar && defaultCalendarId !== null) {
            eventCalendar.value = String(defaultCalendarId);
        }

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
    const upcomingEvents = events
        .filter((event) => {
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
        item.className = "upcoming-event-item";

        const title = document.createElement("div");
        title.className = "upcoming-event-title";
        title.textContent = event.title || "Untitled event";

        const time = document.createElement("div");
        time.className = "upcoming-event-time";

        const startTime = new Date(event.start_time);

        time.textContent = startTime.toLocaleString([], {
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit"
        });

        item.append(title, time);

        // Make the notification clickable
        item.style.cursor = "pointer";
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

    document.getElementById("eventId").value = "";

    // Set today's date and default start/end times
    const now = new Date();
    now.setMinutes(0, 0, 0);

    const end = new Date(now);
    end.setHours(end.getHours() + 1);

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const formatTime = (date) => {
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        return `${hours}:${minutes}`;
    };

    document.getElementById("eventDate").value = formatDate(now);
    document.getElementById("eventStartTime").value = formatTime(now);
    document.getElementById("eventEndTime").value = formatTime(end);

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
    const endTime = document.getElementById("eventEndTime").value;
    const eventType = document.getElementById("eventType").value;

    // Validate required fields
    if (!title || !date || !startTime || !endTime) {
        alert("Please fill in the title, date, start time, and end time.");
        return;
    }

    // Convert the selected date and times into JavaScript Date objects
    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        alert("Please enter a valid date and time.");
        return;
    }

    if (end <= start) {
        alert("End time must be later than start time.");
        return;
    }

    const saveButton = document.getElementById("saveEventBtn");
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const eventData = {
            title: title,
            description: description,
            start_time: start.toISOString(),
            end_time: end.toISOString()
        };

        /*
         * Your previous API payload included a calendar ID.
         * Add the calendar field back if your Django API requires it.
         *
         * Example:
         * eventData.calendar = Number(eventCalendar.value);
         *
         * Send event_type only after confirming that your Django
         * serializer accepts this field.
         */

        const response = await apiRequest("/events/", {
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

        alert(
            `Could not save the event: ${error.message}`
        );

    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save";
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


let currentActiveEventId = null; // Ensure this is declared globally

function showEventDetails(event) {
    const dialog = document.getElementById("eventDetailsDialog");

    if (!dialog) {
        console.error("Event details dialog not found in index.html");
        return;
    }

    currentActiveEventId = event.id;

    const start = new Date(event.start_time);
    const end = new Date(event.end_time);

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

    document.getElementById("detailEnd").textContent =
        !Number.isNaN(end.getTime())
            ? end.toLocaleTimeString([], {
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

const closeDetailsButton = document.getElementById("closeEventDetailsBtn");
const eventDetailsDialog = document.getElementById("eventDetailsDialog");

if (closeDetailsButton && eventDetailsDialog) {
    closeDetailsButton.addEventListener("click", function () {
        eventDetailsDialog.close();
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


