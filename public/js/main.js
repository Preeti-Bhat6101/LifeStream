// public/js/main.js - FINAL, CORRECTED AND TESTED VERSION

document.addEventListener("DOMContentLoaded", () => {
  const getElement = (id) => document.getElementById(id);

  const setupUIForRole = async () => {
    try {
      const response = await fetch("/api/auth/status");
      const data = await response.json();
      if (!data.loggedIn) {
        window.location.href = "/login.html";
        return;
      }
      const user = data.user;
      console.log(`Setting up UI for role: ${user.role}`);

      const staffAdminLinks = document.querySelectorAll(".staff-admin-link");
      const adminLink = getElement("management-nav-link");
      const staffDashboard = getElement("staff-dashboard");
      const adminDashboard = getElement("admin-dashboard");
      const recipientDashboard = getElement("recipient-dashboard");

      staffAdminLinks.forEach((link) => (link.style.display = "none"));
      if (adminLink) adminLink.style.display = "none";
      if (staffDashboard) staffDashboard.classList.add("hidden");
      if (adminDashboard) adminDashboard.classList.add("hidden");
      if (recipientDashboard) recipientDashboard.classList.add("hidden");

      if (user.role === "Admin") {
        staffAdminLinks.forEach((link) => (link.style.display = "block"));
        if (adminLink) adminLink.style.display = "block";
        if (adminDashboard) adminDashboard.classList.remove("hidden");
        fetchAllAdminData();
        fetchAllCommonData();
      } else if (user.role === "Staff") {
        staffAdminLinks.forEach((link) => (link.style.display = "block"));
        if (staffDashboard) staffDashboard.classList.remove("hidden");
        fetchAllCommonData();
      } else if (user.role === "Recipient") {
        if (recipientDashboard) recipientDashboard.classList.remove("hidden");
        fetchRecipientData();
      }
    } catch (error) {
      console.error("Failed to setup UI:", error);
      window.location.href = "/login.html";
    }
  };

  const fetchAllAdminData = () => {
    fetchUserList();
    // fetchRecipientsForManagement();
  };
  const fetchAllCommonData = () => {
    fetchBloodGroups();
    fetchDonors();
    fetchDonorsForDropdown();
    fetchStock();
    fetchRequests();
    fetchHistory();
    fetchBloodGroupsForSearch();
    fetchRecipientsForDropdown();
  };
  const fetchRecipientData = () => {
    fetchBloodGroupsForRecipient();
    fetchRecipientHistory();
  };

  const showMessage = (element, message, isSuccess) => {
    if (!element) return;
    element.textContent = message;
    element.style.color = isSuccess ? "green" : "red";
    setTimeout(
      () => {
        element.textContent = "";
      },
      isSuccess ? 3000 : 5000
    );
  };

  const fetchUserList = async () => {
    try {
      const res = await fetch("/api/users");
      const users = await res.json();
      getElement("management-recipient-list").innerHTML = "";
      users.forEach((u) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${u.Name}</td><td>${u.Username}</td><td>${
          u.Role
        }</td><td>${u.HospitalName || "N/A"}</td>`;
        getElement("management-recipient-list").appendChild(row);
      });
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRecipientsForManagement = async () => {
    try {
      const res = await fetch("/api/recipients");
      const recipients = await res.json();
      getElement("management-recipient-list").innerHTML = "";
      recipients.forEach((r) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${r.Name}</td><td>${r.Contact || "N/A"}</td>`;
        getElement("management-recipient-list").appendChild(row);
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    const userData = {
      name: getElement("user-name").value,
      username: getElement("user-username").value,
      password: getElement("user-password").value,
      role: getElement("user-role").value,
      recipientId: getElement("assign-recipient").value,
    };
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      showMessage(getElement("create-user-message"), result.message, true);
      getElement("create-user-form").reset();
      fetchUserList();
    } catch (e) {
      showMessage(getElement("create-user-message"), e.message, false);
    }
  };

  const fetchBloodGroups = async () => {
    try {
      const res = await fetch("/api/blood-groups");
      const groups = await res.json();
      getElement("blood-group-select").innerHTML =
        '<option value="">Select</option>';
      groups.forEach((g) => {
        const opt = document.createElement("option");
        opt.value = g.BloodGroupID;
        opt.textContent = g.BloodType;
        getElement("blood-group-select").appendChild(opt.cloneNode(true));
      });
    } catch (e) {
      console.error(e);
    }
  };
  const fetchDonors = async () => {
    try {
      const res = await fetch("/api/donors");
      const donors = await res.json();
      getElement("donor-list").innerHTML = "";
      donors.forEach((d) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${d.Name}</td><td>${d.Contact}</td><td>${
          d.Location
        }</td><td>${d.BloodType}</td><td>${
          d.LastDonationDate
            ? new Date(d.LastDonationDate).toLocaleDateString()
            : "N/A"
        }</td>`;
        getElement("donor-list").appendChild(row);
      });
    } catch (e) {
      console.error(e);
    }
  };
  const handleDonorSubmit = async (event) => {
    event.preventDefault();
    const donorData = {
      name: getElement("name").value,
      contact: getElement("contact").value,
      location: getElement("location").value,
      bloodGroupId: getElement("blood-group-select").value,
      lastDonationDate: getElement("last-donation").value,
    };
    try {
      const res = await fetch("/api/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(donorData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      showMessage(getElement("donor-form-message"), result.message, true);
      getElement("donor-form").reset();
      fetchDonors();
      fetchDonorsForDropdown();
    } catch (e) {
      showMessage(getElement("donor-form-message"), e.message, false);
    }
  };
  const fetchDonorsForDropdown = async () => {
    try {
      const res = await fetch("/api/donors");
      const donors = await res.json();
      getElement("donor-select").innerHTML = '<option value="">Select</option>';
      donors.forEach((d) => {
        const opt = document.createElement("option");
        opt.value = d.DonorID;
        opt.textContent = `${d.Name} (${d.BloodType})`;
        getElement("donor-select").appendChild(opt);
      });
    } catch (e) {
      console.error(e);
    }
  };
  const fetchStock = async () => {
    try {
      const res = await fetch("/api/stock");
      const stock = await res.json();
      getElement("stock-list").innerHTML = "";
      stock.forEach((s) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${s.DonorName}</td><td>${s.BloodType}</td><td>${
          s.QuantityML
        }</td><td>${new Date(
          s.CollectionDate
        ).toLocaleDateString()}</td><td>${new Date(
          s.ExpiryDate
        ).toLocaleDateString()}</td>`;
        getElement("stock-list").appendChild(row);
      });
    } catch (e) {
      console.error(e);
    }
  };
  const handleStockSubmit = async (event) => {
    event.preventDefault();
    const stockData = {
      donorId: getElement("donor-select").value,
      collectionDate: getElement("collection-date").value,
      quantityML: getElement("quantity-ml").value,
    };
    try {
      const res = await fetch("/api/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stockData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      showMessage(getElement("stock-form-message"), result.message, true);
      getElement("stock-form").reset();
      fetchStock();
    } catch (e) {
      showMessage(getElement("stock-form-message"), e.message, false);
    }
  };
  const fetchRecipientsForDropdown = async () => {
    try {
      const res = await fetch("/api/recipients");
      const recipients = await res.json();
      const assignSelect = getElement("assign-recipient");
      if (assignSelect) {
        assignSelect.innerHTML = '<option value="">Select Hospital</option>';
        recipients.forEach((r) => {
          const opt = document.createElement("option");
          opt.value = r.RecipientID;
          opt.textContent = r.Name;
          assignSelect.appendChild(opt);
        });
      }
    } catch (e) {
      console.error(e);
    }
  };
  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/requests");
      const reqs = await res.json();
      getElement("request-list").innerHTML = "";
      reqs.forEach((r) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${r.RecipientName}</td><td>${
          r.BloodType
        }</td><td>${r.QuantityRequiredML}</td><td>${new Date(
          r.RequestDate
        ).toLocaleString()}</td><td><button class="fulfill-btn" data-id="${
          r.RequestID
        }">Fulfill</button></td>`;
        getElement("request-list").appendChild(row);
      });
    } catch (e) {
      console.error(e);
    }
  };
  const handleFulfillClick = async (event) => {
    if (!event.target.classList.contains("fulfill-btn")) return;
    const id = event.target.dataset.id;
    if (!confirm("Fulfill this request?")) return;
    try {
      const res = await fetch(`/api/requests/${id}/fulfill`, { method: "PUT" });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      alert(result.message);
      fetchRequests();
      fetchStock();
      fetchHistory();
    } catch (e) {
      alert(`Error: ${e.message}`);
    }
  };
  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/requests/history");
      const history = await res.json();
      getElement("history-list").innerHTML = "";
      history.forEach((h) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${h.RecipientName}</td><td>${
          h.BloodType
        }</td><td>${h.QuantityRequiredML}</td><td>${new Date(
          h.RequestDate
        ).toLocaleString()}</td><td>${h.Status}</td><td>${
          h.FulfilledBy || "N/A"
        }</td>`;
        getElement("history-list").appendChild(row);
      });
    } catch (e) {
      console.error(e);
    }
  };
  const fetchBloodGroupsForSearch = async () => {
    try {
      const res = await fetch("/api/blood-groups");
      const groups = await res.json();
      getElement("search-blood-group").innerHTML =
        '<option value="">Select</option>';
      groups.forEach((g) => {
        const opt = document.createElement("option");
        opt.value = g.BloodGroupID;
        opt.textContent = g.BloodType;
        getElement("search-blood-group").appendChild(opt);
      });
    } catch (e) {
      console.error(e);
    }
  };
  const handleEmergencySearch = async (event) => {
    event.preventDefault();
    const searchData = {
      bloodGroupId: getElement("search-blood-group").value,
      location: getElement("search-location").value,
    };
    try {
      const res = await fetch("/api/donors/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchData),
      });
      const results = await res.json();
      if (!res.ok) throw new Error("Search failed");
      getElement("search-results-list").innerHTML = "";
      if (results.length === 0) {
        getElement("search-results-list").innerHTML =
          '<tr><td colspan="5">No matching donors.</td></tr>';
        return;
      }
      results.forEach((d) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${d.Name}</td><td>${d.Contact}</td><td>${
          d.Location
        }</td><td>${d.BloodType}</td><td>${
          d.LastDonationDate
            ? new Date(d.LastDonationDate).toLocaleDateString()
            : "N/A"
        }</td>`;
        getElement("search-results-list").appendChild(row);
      });
    } catch (e) {
      getElement(
        "search-results-list"
      ).innerHTML = `<tr><td colspan="5" style="color:red;">Error: ${e.message}</td></tr>`;
    }
  };
  const fetchBloodGroupsForRecipient = async () => {
    try {
      const res = await fetch("/api/blood-groups");
      const groups = await res.json();
      getElement("recipient-blood-group-select").innerHTML =
        '<option value="">Select</option>';
      groups.forEach((g) => {
        const opt = document.createElement("option");
        opt.value = g.BloodGroupID;
        opt.textContent = g.BloodType;
        getElement("recipient-blood-group-select").appendChild(opt);
      });
    } catch (e) {
      console.error(e);
    }
  };
  const fetchRecipientHistory = async () => {
    try {
      const res = await fetch("/api/requests/my-requests");
      const reqs = await res.json();
      getElement("recipient-history-list").innerHTML = "";
      reqs.forEach((r) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${r.BloodType}</td><td>${
          r.QuantityRequiredML
        }</td><td>${new Date(r.RequestDate).toLocaleString()}</td><td>${
          r.Status
        }</td>`;
        getElement("recipient-history-list").appendChild(row);
      });
    } catch (e) {
      console.error(e);
    }
  };
  const handleRecipientRequestSubmit = async (event) => {
    event.preventDefault();
    const reqData = {
      bloodGroupId: getElement("recipient-blood-group-select").value,
      quantityRequiredML: getElement("recipient-quantity-ml").value,
    };
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      showMessage(
        getElement("recipient-request-message"),
        result.message,
        true
      );
      getElement("recipient-request-form").reset();
      fetchRecipientHistory();
    } catch (e) {
      showMessage(getElement("recipient-request-message"), e.message, false);
    }
  };
  const onboardRecipientForm = document.getElementById(
    "onboard-recipient-form"
  );
  const onboardRecipientMessage = document.getElementById(
    "onboard-recipient-message"
  );

  const handleOnboardRecipient = async (event) => {
    event.preventDefault();
    const onboardData = {
      hospitalName: document.getElementById("hospital-name").value,
      hospitalContact: document.getElementById("hospital-contact").value,
      employeeName: document.getElementById("recipient-user-name").value,
      username: document.getElementById("recipient-username").value,
      password: document.getElementById("recipient-password").value,
    };

    try {
      const response = await fetch("/api/recipients/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(onboardData),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      showMessage(onboardRecipientMessage, result.message, true);
      onboardRecipientForm.reset();

      fetchUserList();
      fetchRecipientsForManagement();
    } catch (error) {
      showMessage(onboardRecipientMessage, error.message, false);
    }
  };

  const navLinks = document.querySelectorAll(".nav-link");
  const pageContents = document.querySelectorAll(".page-content");
  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const targetId = link.dataset.target;
      pageContents.forEach((page) => page.classList.add("hidden"));
      getElement(targetId).classList.remove("hidden");
      navLinks.forEach((navLink) => navLink.classList.remove("active"));
      link.classList.add("active");
    });
  });
  getElement("logout-btn")?.addEventListener("click", async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/home.html";
    } catch (e) {
      console.error(e);
    }
  });
  getElement("create-user-form")?.addEventListener("submit", handleCreateUser);
  getElement("create-recipient-form")?.addEventListener(
    "submit",
    handleCreateRecipient
  );
  getElement("donor-form")?.addEventListener("submit", handleDonorSubmit);
  getElement("stock-form")?.addEventListener("submit", handleStockSubmit);
  getElement("request-list")?.addEventListener("click", handleFulfillClick);
  getElement("emergency-search-form")?.addEventListener(
    "submit",
    handleEmergencySearch
  );
  getElement("recipient-request-form")?.addEventListener(
    "submit",
    handleRecipientRequestSubmit
  );
  getElement("user-role")?.addEventListener("change", (e) => {
    if (e.target.value === "Recipient") {
      getElement("recipient-assignment-div").classList.remove("hidden");
    } else {
      getElement("recipient-assignment-div").classList.add("hidden");
    }
  });
  getElement("onboard-recipient-form")?.addEventListener(
    "submit",
    handleOnboardRecipient
  );

  setupUIForRole();
});
