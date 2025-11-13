// public/js/main.js

const searchForm = document.getElementById("emergency-search-form");
const searchBloodGroupSelect = document.getElementById("search-blood-group");
const searchResultsList = document.getElementById("search-results-list");

(async function checkLogin() {
  try {
    const response = await fetch("/api/auth/status");
    const data = await response.json();

    if (!data.loggedIn) {
      window.location.href = "/login.html";
      return; // Stop execution if not logged in
    }

    // User is logged in, now check their role
    console.log("Logged in as:", data.user.name, "Role:", data.user.role);

    // --- ROLE-BASED UI CONTROL ---
    const managementNavLink = document.getElementById("management-nav-link");
    if (data.user.role !== "Admin") {
      // If the user is NOT an admin, hide the management link
      if (managementNavLink) managementNavLink.style.display = "none";
    } else {
      // Otherwise, make sure it's visible
      if (managementNavLink) managementNavLink.style.display = "block";
    }
  } catch (error) {
    console.error("Auth check failed:", error);
    window.location.href = "/login.html";
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Element Selectors ---

  // For Donor Registration
  const bloodGroupSelect = document.getElementById("blood-group-select");
  const donorForm = document.getElementById("donor-form");
  const donorList = document.getElementById("donor-list");
  const donorFormMessage = document.getElementById("donor-form-message");

  // For Recording Donations (Blood Stock)
  const donorSelect = document.getElementById("donor-select");
  const stockForm = document.getElementById("stock-form");
  const stockList = document.getElementById("stock-list");
  const stockFormMessage = document.getElementById("stock-form-message");

  const recipientForm = document.getElementById("recipient-form");
  const recipientFormMessage = document.getElementById(
    "recipient-form-message"
  );

  const requestForm = document.getElementById("request-form");
  const recipientSelect = document.getElementById("recipient-select");
  const requestBloodGroupSelect = document.getElementById(
    "request-blood-group-select"
  );
  const requestList = document.getElementById("request-list");
  const requestFormMessage = document.getElementById("request-form-message");

  const navLinks = document.querySelectorAll(".nav-link");
  const pageContents = document.querySelectorAll(".page-content");
  const logoutBtn = document.getElementById("logout-btn");

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/home.html";
      } catch (error) {
        console.error("Logout failed", error);
      }
    });
  }
  // --- API Functions for Donors and Blood Groups ---

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault(); // Stop the link from reloading the page

      const targetId = link.dataset.target;

      // Hide all pages
      pageContents.forEach((page) => {
        page.classList.add("hidden");
      });

      // Show the target page
      document.getElementById(targetId).classList.remove("hidden");

      // Update active link style
      navLinks.forEach((navLink) => {
        navLink.classList.remove("active");
      });
      link.classList.add("active");
    });
  });

  // Fetches blood groups to populate the dropdown in the donor registration form
  const fetchBloodGroups = async () => {
    try {
      const response = await fetch("/api/blood-groups");
      const bloodGroups = await response.json();

      bloodGroupSelect.innerHTML =
        '<option value="">Select Blood Group</option>'; // Default option
      bloodGroups.forEach((group) => {
        const option = document.createElement("option");
        option.value = group.BloodGroupID;
        option.textContent = group.BloodType;
        bloodGroupSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching blood groups:", error);
      bloodGroupSelect.innerHTML =
        '<option value="">Error loading groups</option>';
    }
  };

  // Fetches all registered donors to display in the main table
  const fetchDonors = async () => {
    try {
      const response = await fetch("/api/donors");
      const donors = await response.json();

      donorList.innerHTML = ""; // Clear existing list

      if (donors.length === 0) {
        donorList.innerHTML = '<tr><td colspan="5">No donors found.</td></tr>';
        return;
      }

      donors.forEach((donor) => {
        const row = document.createElement("tr");
        // Format the date to be more readable, and show 'N/A' if null
        const lastDonation = donor.LastDonationDate
          ? new Date(donor.LastDonationDate).toLocaleDateString()
          : "N/A";
        row.innerHTML = `
                    <td>${donor.Name}</td>
                    <td>${donor.Contact}</td>
                    <td>${donor.Location}</td>
                    <td>${donor.BloodType}</td>
                    <td>${lastDonation}</td>
                `;
        donorList.appendChild(row);
      });
    } catch (error) {
      console.error("Error fetching donors:", error);
      donorList.innerHTML =
        '<tr><td colspan="5">Error loading donors.</td></tr>';
    }
  };

  // Handles the submission of the new donor registration form
  const handleDonorSubmit = async (event) => {
    event.preventDefault();

    const donorData = {
      name: document.getElementById("name").value,
      contact: document.getElementById("contact").value,
      location: document.getElementById("location").value,
      bloodGroupId: document.getElementById("blood-group-select").value,
      lastDonationDate: document.getElementById("last-donation").value,
    };

    try {
      const response = await fetch("/api/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donorData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Submission failed");
      }

      donorFormMessage.textContent = result.message;
      donorFormMessage.style.color = "green";
      donorForm.reset(); // Clear the form

      // Refresh both the donor table and the donor dropdown list
      fetchDonors();
      fetchDonorsForDropdown();
    } catch (error) {
      donorFormMessage.textContent = `Error: ${error.message}`;
      donorFormMessage.style.color = "red";
    }
  };

  // --- API Functions for Blood Stock ---

  // Fetches donors specifically for the "Record Donation" dropdown
  const fetchDonorsForDropdown = async () => {
    try {
      const response = await fetch("/api/donors");
      const donors = await response.json();

      donorSelect.innerHTML = '<option value="">Select a Donor</option>';
      donors.forEach((donor) => {
        const option = document.createElement("option");
        option.value = donor.DonorID;
        option.textContent = `${donor.Name} (${donor.BloodType})`;
        donorSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching donors for dropdown:", error);
      donorSelect.innerHTML = '<option value="">Error loading donors</option>';
    }
  };

  // Fetches the current blood stock inventory
  const fetchStock = async () => {
    try {
      const response = await fetch("/api/stock");
      const stock = await response.json();

      stockList.innerHTML = "";
      if (stock.length === 0) {
        stockList.innerHTML =
          '<tr><td colspan="4">No units available in stock.</td></tr>';
        return;
      }
      stock.forEach((unit) => {
        const row = document.createElement("tr");
        const collection = new Date(unit.CollectionDate).toLocaleDateString();
        const expiry = new Date(unit.ExpiryDate).toLocaleDateString();
        row.innerHTML = `
                    <td>${unit.DonorName}</td>
                    <td>${unit.BloodType}</td>
                    <td>${collection}</td>
                    <td>${expiry}</td>
                `;
        stockList.appendChild(row);
      });
    } catch (error) {
      console.error("Error fetching stock:", error);
      stockList.innerHTML =
        '<tr><td colspan="4">Error loading stock.</td></tr>';
    }
  };

  // Handles the submission of the "Record Donation" form
  const handleStockSubmit = async (event) => {
    event.preventDefault();
    const stockData = {
      donorId: document.getElementById("donor-select").value,
      collectionDate: document.getElementById("collection-date").value,
    };

    try {
      const response = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stockData),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message);

      stockFormMessage.textContent = result.message;
      stockFormMessage.style.color = "green";
      stockForm.reset();
      fetchStock(); // Refresh the stock list
    } catch (error) {
      stockFormMessage.textContent = `Error: ${error.message}`;
      stockFormMessage.style.color = "red";
    }
  };

  const handleRecipientSubmit = async (event) => {
    event.preventDefault();
    const recipientData = {
      name: document.getElementById("recipient-name").value,
      contact: document.getElementById("recipient-contact").value,
    };

    try {
      const response = await fetch("/api/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipientData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      recipientFormMessage.textContent = result.message;
      recipientFormMessage.style.color = "green";
      recipientForm.reset();
      // We'll need to refresh the recipient list for the upcoming request form
      fetchRecipientsForDropdown();
    } catch (error) {
      recipientFormMessage.textContent = `Error: ${error.message}`;
      recipientFormMessage.style.color = "red";
    }
  };

  const fetchRecipientsForDropdown = async () => {
    try {
      const response = await fetch("/api/recipients");
      const recipients = await response.json();
      recipientSelect.innerHTML =
        '<option value="">Select a Recipient</option>';
      recipients.forEach((r) => {
        const option = document.createElement("option");
        option.value = r.RecipientID;
        option.textContent = r.Name;
        recipientSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching recipients:", error);
    }
  };

  const fetchBloodGroupsForRequest = async () => {
    try {
      const response = await fetch("/api/blood-groups");
      const bloodGroups = await response.json();
      requestBloodGroupSelect.innerHTML =
        '<option value="">Select Blood Group</option>';
      bloodGroups.forEach((group) => {
        const option = document.createElement("option");
        option.value = group.BloodGroupID;
        option.textContent = group.BloodType;
        requestBloodGroupSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching blood groups:", error);
    }
  };

  const fetchRequests = async () => {
    try {
      const response = await fetch("/api/requests");
      const requests = await response.json();
      requestList.innerHTML = "";
      if (requests.length === 0) {
        requestList.innerHTML =
          '<tr><td colspan="4">No pending requests.</td></tr>';
        return;
      }
      requests.forEach((req) => {
        const row = document.createElement("tr");
        const reqDate = new Date(req.RequestDate).toLocaleString();
        row.innerHTML = `
                <td>${req.RecipientName}</td>
                <td>${req.BloodType}</td>
                <td>${reqDate}</td>
                <td><button class="fulfill-btn" data-id="${req.RequestID}">Fulfill</button></td>
            `;
        requestList.appendChild(row);
      });
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };

  const fetchBloodGroupsForSearch = async () => {
    try {
      const response = await fetch("/api/blood-groups");
      const bloodGroups = await response.json();
      searchBloodGroupSelect.innerHTML =
        '<option value="">Select Blood Group</option>';
      bloodGroups.forEach((group) => {
        const option = document.createElement("option");
        option.value = group.BloodGroupID;
        option.textContent = group.BloodType;
        searchBloodGroupSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching blood groups for search:", error);
    }
  };

  const handleEmergencySearch = async (event) => {
    event.preventDefault();
    const searchData = {
      bloodGroupId: document.getElementById("search-blood-group").value,
      location: document.getElementById("search-location").value,
    };

    try {
      const response = await fetch("/api/donors/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchData),
      });
      const results = await response.json();

      if (!response.ok) throw new Error(results.message || "Search failed");

      searchResultsList.innerHTML = ""; // Clear previous results
      if (results.length === 0) {
        searchResultsList.innerHTML =
          '<tr><td colspan="5">No matching donors found.</td></tr>';
        return;
      }

      results.forEach((donor) => {
        const row = document.createElement("tr");
        const lastDonation = donor.LastDonationDate
          ? new Date(donor.LastDonationDate).toLocaleDateString()
          : "N/A";
        row.innerHTML = `
                <td>${donor.Name}</td>
                <td>${donor.Contact}</td>
                <td>${donor.Location}</td>
                <td>${donor.BloodType}</td>
                <td>${lastDonation}</td>
            `;
        searchResultsList.appendChild(row);
      });
    } catch (error) {
      searchResultsList.innerHTML = `<tr><td colspan="5" style="color: red;">Error: ${error.message}</td></tr>`;
    }
  };

  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    const requestData = {
      recipientId: recipientSelect.value,
      bloodGroupId: requestBloodGroupSelect.value,
    };
    try {
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
      fetchRequests();
    } catch (error) {
      requestFormMessage.textContent = `Error: ${error.message}`;
      requestFormMessage.style.color = "red";
    }
  };

  const handleFulfillClick = async (event) => {
    if (!event.target.classList.contains("fulfill-btn")) return;
    const requestId = event.target.dataset.id;
    if (!confirm("Are you sure you want to fulfill this request from stock?"))
      return;

    try {
      const response = await fetch(`/api/requests/${requestId}/fulfill`, {
        method: "PUT",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      alert(result.message);
      fetchRequests(); // Refresh request list
      fetchStock(); // Refresh stock inventory
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  // --- Initial Setup and Event Listeners ---

  // Add event listeners to the forms
  donorForm.addEventListener("submit", handleDonorSubmit);
  stockForm.addEventListener("submit", handleStockSubmit);
  recipientForm.addEventListener("submit", handleRecipientSubmit);
  requestForm.addEventListener("submit", handleRequestSubmit);
  requestList.addEventListener("click", handleFulfillClick);
  searchForm.addEventListener("submit", handleEmergencySearch);

  // Call all the functions to fetch and display initial data when the page loads
  fetchBloodGroups();
  fetchDonors();
  fetchDonorsForDropdown();
  fetchStock();
  fetchRecipientsForDropdown();
  fetchBloodGroupsForRequest();
  fetchRequests();
  fetchBloodGroupsForSearch();
});
