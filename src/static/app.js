document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  
  // Filter and search elements
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const sortSelect = document.getElementById("sort-select");
  
  // Store all activities for filtering/sorting
  let allActivities = {};

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      allActivities = activities;

      // Initial display
      displayActivities(activities);
      populateActivitySelect(activities);
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
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        await fetchActivities();
        filterAndSortActivities(); // Reapply filters after refresh
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        await fetchActivities();
        filterAndSortActivities(); // Reapply filters after refresh
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Add event listeners for filters and search
  searchInput.addEventListener("input", filterAndSortActivities);
  categoryFilter.addEventListener("change", filterAndSortActivities);
  sortSelect.addEventListener("change", filterAndSortActivities);

  // Initialize app
  fetchActivities();
});
