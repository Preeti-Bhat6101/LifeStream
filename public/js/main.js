// public/js/main.js - FINAL CORRECTED VERSION

document.addEventListener("DOMContentLoaded", () => {
  const setupDashboardUI = async () => {
    try {
      const response = await fetch("/api/auth/status");
      const data = await response.json();

      if (!data.loggedIn) {
        window.location.href = "/login.html";
        return;
      }

      console.log("Logged in as:", data.user.name, "Role:", data.user.role);

      const managementNavLink = document.getElementById("management-nav-link");
      const adminDashboard = document.getElementById("admin-dashboard");
      const staffDashboard = document.getElementById("staff-dashboard");

      if (data.user.role === "Admin") {
        console.log("User is ADMIN. Hiding staff view, showing admin view.");
        if (managementNavLink) managementNavLink.style.display = "block";
        if (adminDashboard) adminDashboard.classList.remove("hidden");
        if (staffDashboard) staffDashboard.classList.add("hidden"); // THIS IS THE CRITICAL FIX

        // Fetch all admin-specific lists
        fetchStaffList();
        fetchRecipientUserList();
        fetchRecipientsForManagement();
        // Also needed for admin forms
      } else {
        // User is Staff
        console.log("User is STAFF. Hiding admin view, showing staff view.");
        if (managementNavLink) managementNavLink.style.display = "none";
        if (adminDashboard) adminDashboard.classList.add("hidden");
        if (staffDashboard) staffDashboard.classList.remove("hidden");
      }
      // Fetch all data needed for the Staff dashboard view
      fetchBloodGroups();
      fetchDonors();
      fetchDonorsForDropdown();
      fetchStock();
      fetchRecipientsForDropdown();
      fetchBloodGroupsForRequest();
      fetchRequests();
      fetchBloodGroupsForSearch();
      fetchHistory();
    } catch (error) {
      console.error("Auth check failed:", error);
      window.location.href = "/login.html";
    }
  };

  // --- Navigation Logic ---
  const navLinks = document.querySelectorAll(".nav-link");
  const pageContents = document.querySelectorAll(".page-content");
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = link.dataset.target;
      pageContents.forEach((page) => page.classList.add("hidden"));
      document.getElementById(targetId).classList.remove("hidden");
      navLinks.forEach((navLink) => navLink.classList.remove("active"));
      link.classList.add("active");
    });
  });

  // --- DOM Element Selectors ---
  const logoutBtn = document.getElementById("logout-btn");
  const bloodGroupSelect = document.getElementById("blood-group-select");
  const donorForm = document.getElementById("donor-form");
  const donorList = document.getElementById("donor-list");
  const donorFormMessage = document.getElementById("donor-form-message");
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
  const searchForm = document.getElementById("emergency-search-form");
  const searchBloodGroupSelect = document.getElementById("search-blood-group");
  const searchResultsList = document.getElementById("search-results-list");
  const staffList = document.getElementById("staff-list");
  const recipientUserList = document.getElementById("recipient-user-list");
  const recipientList = document.getElementById("recipient-list");
  const recipientUserForm = document.getElementById("recipient-user-form");
  const userRecipientSelect = document.getElementById("user-recipient-select");
  const recipientUserFormMessage = document.getElementById(
    "recipient-user-form-message"
  );
  const historyList = document.getElementById("history-list");
  const staffRegisterForm = document.getElementById("staff-register-form");
  const staffFormMessage = document.getElementById("staff-form-message");

  // --- Admin Functions ---
  const fetchStaffList = async () => {
    try {
      const res = await fetch("/api/staff");
      const staff = await res.json();
      if (!res.ok) throw new Error("Failed to fetch");
      staffList.innerHTML = "";
      staff.forEach((s) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${s.Name}</td><td>${s.Username}</td><td>${s.Role}</td>`;
        staffList.appendChild(row);
      });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecipientUserList = async () => {
    try {
      const res = await fetch("/api/recipient-users");
      const users = await res.json();
      if (!res.ok) throw new Error("Failed to fetch");
      recipientUserList.innerHTML = "";
      users.forEach((u) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${u.Name}</td><td>${u.Username}</td><td>${u.HospitalName}</td>`;
        recipientUserList.appendChild(row);
      });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecipientsForManagement = async () => {
    try {
      const res = await fetch("/api/recipients");
      const recipients = await res.json();
      if (!res.ok) throw new Error("Failed to fetch");
      recipientList.innerHTML = "";
      recipients.forEach((r) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${r.Name}</td><td>${r.Contact || "N/A"}</td>`;
        recipientList.appendChild(row);
      });
    } catch (e) {
      console.error(e);
    }
  };
  // const handleDeleteClick = async (event) => {
  //   if (!event.target.classList.contains("delete-btn")) return;
  //   const id = event.target.dataset.id;
  //   const type = event.target.dataset.type;
  //   if (
  //     !confirm(
  //       `Are you sure you want to delete this ${type}? This cannot be undone.`
  //     )
  //   )
  //     return;
  //   let url = "";
  //   switch (type) {
  //     case "staff":
  //       url = `/api/staff/${id}`;
  //       break;
  //     case "recipient-user":
  //       url = `/api/recipient-users/${id}`;
  //       break;
  //     case "recipient":
  //       url = `/api/recipients/${id}`;
  //       break;
  //     default:
  //       return;
  //   }
  //   try {
  //     const res = await fetch(url, { method: "DELETE" });
  //     const result = await res.json();
  //     if (!res.ok) throw new Error(result.message);
  //     alert(result.message);
  //     if (type === "staff") fetchStaffList();
  //     if (type === "recipient-user") fetchRecipientUserList();
  //     if (type === "recipient") {
  //       fetchRecipientsForManagement();
  //       fetchRecipientsForDropdown();
  //     }
  //   } catch (error) {
  //     alert(`Error: ${error.message}`);
  //   }
  // };
  const handleRecipientUserSubmit = async (event) => {
    event.preventDefault();
    const userData = {
      recipientId: document.getElementById("user-recipient-select").value,
      name: document.getElementById("recipient-user-name").value,
      username: document.getElementById("recipient-user-username").value,
      password: document.getElementById("recipient-user-password").value,
    };
    try {
      const response = await fetch("/api/auth/recipient/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      recipientUserFormMessage.textContent = result.message;
      recipientUserFormMessage.style.color = "green";
      recipientUserForm.reset();
      setTimeout(() => {
        recipientUserFormMessage.textContent = "";
      }, 3000);
      fetchRecipientUserList(); // Refresh the list
    } catch (error) {
      recipientUserFormMessage.textContent = `Error: ${error.message}`;
      recipientUserFormMessage.style.color = "red";
      setTimeout(() => {
        recipientUserFormMessage.textContent = "";
      }, 5000);
    }
  };

  // --- Staff and General Functions ---
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
  const fetchDonors = async () => {
    try {
      const response = await fetch("/api/donors");
      const donors = await response.json();
      donorList.innerHTML = "";
      if (donors.length === 0) {
        donorList.innerHTML = '<tr><td colspan="5">No donors found.</td></tr>';
        return;
      }
      donors.forEach((donor) => {
        const row = document.createElement("tr");
        const lastDonation = donor.LastDonationDate
          ? new Date(donor.LastDonationDate).toLocaleDateString()
          : "N/A";
        row.innerHTML = `<td>${donor.Name}</td><td>${donor.Contact}</td><td>${donor.Location}</td><td>${donor.BloodType}</td><td>${lastDonation}</td>`;
        donorList.appendChild(row);
      });
    } catch (error) {
      console.error("Error fetching donors:", error);
    }
  };
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
      if (!response.ok) throw new Error(result.message);
      donorFormMessage.textContent = result.message;
      donorFormMessage.style.color = "green";
      donorForm.reset();
      fetchDonors();
      fetchDonorsForDropdown();
      setTimeout(() => {
        donorFormMessage.textContent = "";
      }, 3000);
    } catch (error) {
      donorFormMessage.textContent = `Error: ${error.message}`;
      donorFormMessage.style.color = "red";
      setTimeout(() => {
        donorFormMessage.textContent = "";
      }, 5000);
    }
  };
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
    }
  };
  const fetchStock = async () => {
    try {
      const response = await fetch("/api/stock");
      const stock = await response.json();
      stockList.innerHTML = "";
      if (stock.length === 0) {
        stockList.innerHTML =
          '<tr><td colspan="5">No units available in stock.</td></tr>';
        return;
      }
      stock.forEach((unit) => {
        const row = document.createElement("tr");
        const collection = new Date(unit.CollectionDate).toLocaleDateString();
        const expiry = new Date(unit.ExpiryDate).toLocaleDateString();
        row.innerHTML = `<td>${unit.DonorName}</td><td>${unit.BloodType}</td><td>${unit.QuantityML}</td><td>${collection}</td><td>${expiry}</td>`;
        stockList.appendChild(row);
      });
    } catch (error) {
      console.error("Error fetching stock:", error);
    }
  };
  const handleStockSubmit = async (event) => {
    event.preventDefault();
    const stockData = {
      donorId: document.getElementById("donor-select").value,
      collectionDate: document.getElementById("collection-date").value,
      quantityML: document.getElementById("quantity-ml").value,
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
      fetchStock();
      setTimeout(() => {
        stockFormMessage.textContent = "";
      }, 3000);
    } catch (error) {
      stockFormMessage.textContent = `Error: ${error.message}`;
      stockFormMessage.style.color = "red";
      setTimeout(() => {
        stockFormMessage.textContent = "";
      }, 5000);
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
      fetchRecipientsForDropdown();
      fetchRecipientsForManagement();
      setTimeout(() => {
        recipientFormMessage.textContent = "";
      }, 3000);
    } catch (error) {
      recipientFormMessage.textContent = `Error: ${error.message}`;
      recipientFormMessage.style.color = "red";
      setTimeout(() => {
        recipientFormMessage.textContent = "";
      }, 5000);
    }
  };
  const fetchRecipientsForDropdown = async () => {
    try {
      const response = await fetch("/api/recipients");
      const recipients = await response.json();
      recipientSelect.innerHTML =
        '<option value="">Select a Recipient</option>';
      userRecipientSelect.innerHTML =
        '<option value="">Select a Recipient</option>';
      recipients.forEach((r) => {
        const option1 = document.createElement("option");
        option1.value = r.RecipientID;
        option1.textContent = r.Name;
        const option2 = option1.cloneNode(true);
        recipientSelect.appendChild(option1);
        userRecipientSelect.appendChild(option2);
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
          '<tr><td colspan="5">No pending requests.</td></tr>';
        return;
      }
      requests.forEach((req) => {
        const row = document.createElement("tr");
        const reqDate = new Date(req.RequestDate).toLocaleString();
        row.innerHTML = `<td>${req.RecipientName}</td><td>${req.BloodType}</td><td>${req.QuantityRequiredML}</td><td>${reqDate}</td><td><button class="fulfill-btn" data-id="${req.RequestID}">Fulfill</button></td>`;
        requestList.appendChild(row);
      });
    } catch (error) {
      console.error("Error fetching requests:", error);
    }
  };
  const handleRequestSubmit = async (event) => {
    event.preventDefault();
    const requestData = {
      recipientId: recipientSelect.value,
      bloodGroupId: requestBloodGroupSelect.value,
      quantityRequiredML: document.getElementById("request-quantity-ml").value,
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
      setTimeout(() => {
        requestFormMessage.textContent = "";
      }, 3000);
    } catch (error) {
      requestFormMessage.textContent = `Error: ${error.message}`;
      requestFormMessage.style.color = "red";
      setTimeout(() => {
        requestFormMessage.textContent = "";
      }, 5000);
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
      fetchRequests();
      fetchStock();
      fetchHistory();
    } catch (error) {
      alert(`Error: ${error.message}`);
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
      searchResultsList.innerHTML = "";
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
        row.innerHTML = `<td>${donor.Name}</td><td>${donor.Contact}</td><td>${donor.Location}</td><td>${donor.BloodType}</td><td>${lastDonation}</td>`;
        searchResultsList.appendChild(row);
      });
    } catch (error) {
      searchResultsList.innerHTML = `<tr><td colspan="5" style="color: red;">Error: ${error.message}</td></tr>`;
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/requests/history");
      const history = await response.json();
      if (!response.ok) throw new Error("Failed to fetch history");

      historyList.innerHTML = "";
      if (history.length === 0) {
        historyList.innerHTML =
          '<tr><td colspan="6">No request history found.</td></tr>';
        return;
      }

      history.forEach((req) => {
        const row = document.createElement("tr");
        const reqDate = new Date(req.RequestDate).toLocaleString();
        row.innerHTML = `
                <td>${req.RecipientName}</td>
                <td>${req.BloodType}</td>
                <td>${req.QuantityRequiredML}</td>
                <td>${reqDate}</td>
                <td>${req.Status}</td>
                <td>${req.FulfilledBy || "N/A"}</td>
            `;
        historyList.appendChild(row);
      });
    } catch (error) {
      console.error(error);
      if (historyList)
        historyList.innerHTML =
          '<tr><td colspan="6">Error loading history.</td></tr>';
    }
  };

  // In public/js/main.js

  // In public/js/main.js

  const handleStaffRegisterSubmit = async (event) => {
    event.preventDefault();
    const staffData = {
      name: document.getElementById("staff-name").value,
      username: document.getElementById("staff-username").value,
      password: document.getElementById("staff-password").value,
      role: document.getElementById("staff-role").value,
    };

    const staffFormMessage = document.getElementById("staff-form-message");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffData),
      });

      const result = await response.json();

      if (response.ok) {
        // --- Success Message Logic ---
        staffFormMessage.textContent = result.message;
        staffFormMessage.style.color = "green";
        setTimeout(() => {
          staffFormMessage.textContent = "";
        }, 3000); // Clear after 3 seconds

        document.getElementById("staff-register-form").reset();
        fetchStaffList(); // Refresh the staff list
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      // --- Error Message Logic ---
      staffFormMessage.textContent = `Error: ${error.message}`;
      staffFormMessage.style.color = "red";
      setTimeout(() => {
        staffFormMessage.textContent = "";
      }, 5000); // Clear after 5 seconds
    }
  };
  // --- Initial Setup and Event Listeners ---
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
  donorForm.addEventListener("submit", handleDonorSubmit);
  stockForm.addEventListener("submit", handleStockSubmit);
  recipientForm.addEventListener("submit", handleRecipientSubmit);
  recipientUserForm.addEventListener("submit", handleRecipientUserSubmit);
  requestForm.addEventListener("submit", handleRequestSubmit);
  requestList.addEventListener("click", handleFulfillClick);
  searchForm.addEventListener("submit", handleEmergencySearch);
  // staffList.addEventListener("click", handleDeleteClick);
  // recipientUserList.addEventListener("click", handleDeleteClick);
  // recipientList.addEventListener("click", handleDeleteClick);
  // Inside the "Initial Setup and Event Listeners" section

  if (staffRegisterForm)
    staffRegisterForm.addEventListener("submit", handleStaffRegisterSubmit);

  // Initial data fetch for Staff
  setupDashboardUI();
  // fetchBloodGroups();
  // fetchDonors();
  // fetchDonorsForDropdown();
  // fetchStock();
  // fetchRecipientsForDropdown();
  // fetchBloodGroupsForRequest();
  // fetchRequests();
  // fetchBloodGroupsForSearch();
});
