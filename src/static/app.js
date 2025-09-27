document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const messageDiv = document.getElementById("message");
  
  // Filter and search elements
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const sortSelect = document.getElementById("sort-select");
  
  // Store all activities for filtering/sorting
  let allActivities = {};
  // Auth-related elements
  const userIcon = document.getElementById("user-icon");
  const loginModal = document.getElementById("login-modal");
  const closeModal = document.getElementById("close-modal");
  const loginForm = document.getElementById("login-form");
  const loginMessage = document.getElementById("login-message");
  const userInfo = document.getElementById("user-info");
  const teacherName = document.getElementById("teacher-name");
  const logoutBtn = document.getElementById("logout-btn");
  
  // Authentication state
  let currentSession = localStorage.getItem('teacherSession');
  let isAuthenticated = false;

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      allActivities = activities;

      // Initial display
      displayActivities(activities);
      populateActivitySelect(activities);
      // Clear loading message
      activitiesList.innerHTML = "";
      // Clear select options
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons only for authenticated users
        // Create participants HTML with delete icons
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${
                        isAuthenticated ? 
                          `<button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button>` :
                          ''
                      }</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        // Create the registration form for this activity
        const registrationHTML = `
          <div class="activity-registration">
            <h5>Register for ${name}</h5>
            <form class="registration-form" data-activity="${name}">
              <div class="form-group">
                <label for="email-${name.replace(/\s+/g, '-').toLowerCase()}">Student Email:</label>
                <input type="email" id="email-${name.replace(/\s+/g, '-').toLowerCase()}" name="email" required placeholder="your-email@mergington.edu" />
              </div>
              <button type="submit">Register Student</button>
            </form>
          </div>
        `;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
          ${registrationHTML}
        `;

        activitiesList.appendChild(activityCard);
      });

      // Add event listeners to delete buttons (only if authenticated)
      if (isAuthenticated) {
        document.querySelectorAll(".delete-btn").forEach((button) => {
          button.addEventListener("click", handleUnregister);
        });
      }
      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      // Add event listeners to registration forms
      document.querySelectorAll(".registration-form").forEach((form) => {
        form.addEventListener("submit", handleRegistration);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Function to display activities
  function displayActivities(activities) {
    // Clear loading message
    activitiesList.innerHTML = "";

    // If no activities match the filters
    if (Object.keys(activities).length === 0) {
      activitiesList.innerHTML = "<p><em>No activities match your search criteria.</em></p>";
      return;
    }

    // Populate activities list
    Object.entries(activities).forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;

      // Create participants HTML with delete icons instead of bullet points
      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
            <h5>Participants:</h5>
            <ul class="participants-list">
              ${details.participants
                .map(
                  (email) =>
                    `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                )
                .join("")}
            </ul>
          </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p>${details.description}</p>
        <p><strong>Category:</strong> ${details.category}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;

      activitiesList.appendChild(activityCard);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
  }

  // Function to populate activity select dropdown
  function populateActivitySelect(activities) {
    // Clear existing options except the first one
    activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
    
    // Add option for each activity
    Object.keys(activities).forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });
  }

  // Function to filter and sort activities
  function filterAndSortActivities() {
    const searchTerm = searchInput.value.toLowerCase();
    const categoryFilter = document.getElementById("category-filter").value;
    const sortBy = sortSelect.value;

    // Filter activities
    let filteredActivities = {};
    
    Object.entries(allActivities).forEach(([name, details]) => {
      // Search filter
      const matchesSearch = searchTerm === "" || 
        name.toLowerCase().includes(searchTerm) || 
        details.description.toLowerCase().includes(searchTerm) ||
        details.schedule.toLowerCase().includes(searchTerm);
      
      // Category filter
      const matchesCategory = categoryFilter === "" || details.category === categoryFilter;
      
      if (matchesSearch && matchesCategory) {
        filteredActivities[name] = details;
      }
    });

    // Sort activities
    const sortedEntries = Object.entries(filteredActivities).sort(([nameA, detailsA], [nameB, detailsB]) => {
      switch (sortBy) {
        case "name":
          return nameA.localeCompare(nameB);
        case "schedule":
          // Simple sort by first day of week mentioned
          const scheduleA = detailsA.schedule.toLowerCase();
          const scheduleB = detailsB.schedule.toLowerCase();
          return scheduleA.localeCompare(scheduleB);
        case "availability":
          const spotsA = detailsA.max_participants - detailsA.participants.length;
          const spotsB = detailsB.max_participants - detailsB.participants.length;
          return spotsB - spotsA; // Sort by most available spots first
        default:
          return nameA.localeCompare(nameB);
      }
    });

    // Convert back to object
    const sortedActivities = Object.fromEntries(sortedEntries);
    
    // Display filtered and sorted activities
    displayActivities(sortedActivities);
  }

  // Handle unregister functionality
  // Handle unregister functionality (admin only)
  async function handleUnregister(event) {
    if (!isAuthenticated) {
      showMessage("Admin authentication required", "error");
      return;
    }

    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");
  // Handle registration functionality
  async function handleRegistration(event) {
    event.preventDefault();
    
    const form = event.target;
    const activity = form.getAttribute("data-activity");
    const email = form.querySelector('input[name="email"]').value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}&session_id=${encodeURIComponent(currentSession)}`,
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        form.reset();

        // Refresh activities list to show updated participants
        await fetchActivities();
        filterAndSortActivities(); // Reapply filters after refresh
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Helper function to show messages
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    // Hide message after 5 seconds
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Check authentication status
  async function checkAuthStatus() {
    if (!currentSession) {
      isAuthenticated = false;
      updateUIForAuthState();
      return;
    }

    try {
      const response = await fetch(`/auth/status?session_id=${encodeURIComponent(currentSession)}`);
      const result = await response.json();
      
      if (result.authenticated) {
        isAuthenticated = true;
        const teacherNameStored = localStorage.getItem('teacherName');
        if (teacherNameStored) {
          teacherName.textContent = teacherNameStored;
        }
      } else {
        isAuthenticated = false;
        localStorage.removeItem('teacherSession');
        localStorage.removeItem('teacherName');
        currentSession = null;
      }
    } catch (error) {
      isAuthenticated = false;
      console.error("Error checking auth status:", error);
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
    
    updateUIForAuthState();
  }

  // Update UI based on authentication state
  function updateUIForAuthState() {
    if (isAuthenticated) {
      userIcon.style.display = 'none';
      userInfo.classList.remove('hidden');
    } else {
      userIcon.style.display = 'block';
      userInfo.classList.add('hidden');
    }
    
    // Refresh activities to show/hide delete buttons
    fetchActivities();
  }

  // Handle login
  async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();

      if (response.ok) {
        currentSession = result.session_id;
        isAuthenticated = true;
        
        // Store session and teacher name
        localStorage.setItem('teacherSession', currentSession);
        localStorage.setItem('teacherName', result.teacher_name);
        
        teacherName.textContent = result.teacher_name;
        
        loginMessage.textContent = result.message;
        loginMessage.className = 'success';
        loginMessage.classList.remove('hidden');
        
        // Close modal after short delay
        setTimeout(() => {
          loginModal.classList.add('hidden');
          loginForm.reset();
          loginMessage.classList.add('hidden');
          updateUIForAuthState();
        }, 1000);
        
      } else {
        loginMessage.textContent = result.detail;
        loginMessage.className = 'error';
        loginMessage.classList.remove('hidden');
      }
    } catch (error) {
      loginMessage.textContent = 'Login failed. Please try again.';
      loginMessage.className = 'error';
      loginMessage.classList.remove('hidden');
      console.error('Login error:', error);
    }
  }

  // Handle logout
  async function handleLogout() {
    if (!currentSession) return;

    try {
      await fetch('/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: currentSession, password: "" }),
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of server response
      isAuthenticated = false;
      currentSession = null;
      localStorage.removeItem('teacherSession');
      localStorage.removeItem('teacherName');
      updateUIForAuthState();
      showMessage('Logged out successfully', 'success');
    }
  }
  // Handle form submission for signup
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;
  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();

        // Refresh activities list to show updated participants
        await fetchActivities();
        filterAndSortActivities(); // Reapply filters after refresh
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Utility function to show messages
  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    // Hide message after 5 seconds
    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  // Event listeners for authentication
  userIcon.addEventListener('click', () => {
    loginModal.classList.remove('hidden');
  });

  // Add event listeners for filters and search
  searchInput.addEventListener("input", filterAndSortActivities);
  categoryFilter.addEventListener("change", filterAndSortActivities);
  sortSelect.addEventListener("change", filterAndSortActivities);
  closeModal.addEventListener('click', () => {
    loginModal.classList.add('hidden');
    loginForm.reset();
    loginMessage.classList.add('hidden');
  });

  // Close modal when clicking outside
  loginModal.addEventListener('click', (event) => {
    if (event.target === loginModal) {
      loginModal.classList.add('hidden');
      loginForm.reset();
      loginMessage.classList.add('hidden');
    }
  });

  loginForm.addEventListener('submit', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);

  // Initialize app
  checkAuthStatus().then(() => {
    fetchActivities();
  });
});
