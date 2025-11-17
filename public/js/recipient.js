// public/js/recipient.js

// --- 1. Check Login Status Immediately ---
(async function checkRecipientLogin() {
  try {
    const response = await fetch("/api/auth/status");
    const data = await response.json();

    // IMPORTANT: Check if logged in AND if the role is 'Recipient'
    if (!data.loggedIn || data.user.role !== "Recipient") {
      window.location.href = "/recipient-login.html";
      return;
    }

    // Personalize the welcome message
    const welcomeMessage = document.getElementById("welcome-message");
    if (welcomeMessage) {
      welcomeMessage.textContent = `Welcome, ${data.user.name}!`;
    }
  } catch (error) {
    console.error("Auth check failed:", error);
    window.location.href = "/recipient-login.html";
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const requestForm = document.getElementById("recipient-request-form");
  const bloodGroupSelect = document.getElementById(
    "request-blood-group-select"
  );
  const quantityInput = document.getElementById("request-quantity-ml");
  const requestFormMessage = document.getElementById("request-form-message");
  const requestHistoryList = document.getElementById("request-history-list");
  const logoutBtn = document.getElementById("logout-btn");

  // --- API Functions ---
  const fetchBloodGroups = async () => {
    try {
      const response = await fetch("/api/blood-groups");
      const bloodGroups = await response.json();
      bloodGroupSelect.innerHTML =
        '<option value="">Select Blood Group</option>';
      bloodGroups.forEach((group) => {
        const option = document.createElement("option");
        option.value = group.BloodGroupID;
        option.textContent = group.BloodType;
        bloodGroupSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching blood groups:", error);
    }
  };

  const fetchRequestHistory = async () => {
    try {
      // Fetch from the new, secure endpoint
      const response = await fetch("/api/requests/my-requests");
      const requests = await response.json();

      requestHistoryList.innerHTML = "";
      if (requests.length === 0) {
        requestHistoryList.innerHTML =
          '<tr><td colspan="4">You have no request history.</td></tr>';
        return;
      }

      requests.forEach((req) => {
        const row = document.createElement("tr");
        const reqDate = new Date(req.RequestDate).toLocaleString();
        row.innerHTML = `
                    <td>${req.BloodType}</td>
                    <td>${req.QuantityRequiredML}</td>
                    <td>${reqDate}</td>
                    <td>${req.Status}</td>
                `;
        requestHistoryList.appendChild(row);
      });
    } catch (error) {
      console.error("Error fetching request history:", error);
    }
  };

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    const requestData = {
      bloodGroupId: bloodGroupSelect.value,
      quantityRequiredML: quantityInput.value,
    };
    try {
      // The backend automatically knows who the recipient is from the session
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      requestFormMessage.textContent = result.message;
      requestFormMessage.style.color = "green";
      requestForm.reset();
      setTimeout(() => {
        requestFormMessage.textContent = "";
      }, 3000);

      // Refresh the history to show the new request
      fetchRequestHistory();
    } catch (error) {
      requestFormMessage.textContent = `Error: ${error.message}`;
      requestFormMessage.style.color = "red";
      setTimeout(() => {
        requestFormMessage.textContent = "";
      }, 5000);
    }
  };

  // --- Event Listeners and Initial Calls ---
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
        // Redirect to the recipient login page on logout
        window.location.href = "/recipient-login.html";
      } catch (error) {
        console.error("Logout failed", error);
      }
    });
  }

  requestForm.addEventListener("submit", handleRequestSubmit);

  // Fetch initial data when the page loads
  fetchBloodGroups();
  fetchRequestHistory();
});
