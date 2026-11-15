import { useState, useEffect } from "react";
import api from "./services/api";
import "./App.css";

function AdminDashboard({ user, onLogout }) {
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [selectedNgo, setSelectedNgo] = useState(null);
   
    const loadAdminData = async () => {
        try {
            setLoading(true);
            setError("");

            const [statsResponse, usersResponse] = await Promise.all([
                api.get("auth/admin/stats/"),
                api.get("auth/admin/users/")
            ]);

            setStats(statsResponse.data);
            setUsers(usersResponse.data);
        } catch (err) {
            console.error("Admin dashboard error:", err);
            setError(
                err.response?.data?.detail ||
                err.response?.data?.error ||
                "Could not load admin information."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAdminData();
    }, []);

    const handleVerification = async (userId, verificationStatus) => {
        let rejectionReason = "";

        if (verificationStatus === "rejected") {
            rejectionReason = window.prompt(
                "Enter the reason for rejecting this NGO application:"
            );

            if (rejectionReason === null) return;

            rejectionReason = rejectionReason.trim();

            if (!rejectionReason) {
                setError("A rejection reason is required.");
                return;
            }
        }

        try {
            setError("");
            setActionMessage("");

            const response = await api.patch(
                `auth/admin/ngos/${userId}/verification/`,
                {
                    verification_status: verificationStatus,
                    rejection_reason: rejectionReason
                }
            );

            setActionMessage(response.data.message);

            setUsers((previousUsers) =>
                previousUsers.map((item) =>
                    item.id === userId
                        ? {
                            ...item,
                            verification_status: verificationStatus,
                            rejection_reason: rejectionReason
                        }
                        : item
                )
            );

            setSelectedNgo((previous) =>
                previous && previous.id === userId
                    ? {
                        ...previous,
                        verification_status: verificationStatus,
                        rejection_reason: rejectionReason
                    }
                    : previous
            );

            const statsResponse = await api.get("auth/admin/stats/");
            setStats(statsResponse.data);

        } catch (err) {
            console.error("NGO verification error:", err);
            setError(
                err.response?.data?.error ||
                err.response?.data?.detail ||
                "Could not update NGO verification."
            );
        }
    };

    const ngos = users.filter((item) => item.role === "ngo");

    return (
        <main className="dashboard admin-dashboard">
            <header className="dashboard-header">
                <div>
                    <h2>🌱 FoodBridge</h2>
                    <p>Administration Portal</p>
                </div>

                <div className="admin-header-right">
                    <span>{user.username}</span>
                    <span className="admin-role">ADMIN</span>
                    <button
                        className="admin-logout-button"
                        onClick={onLogout}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <div className="dashboard-content">

                <section className="welcome-banner">
                    <div>
                        <p>ADMINISTRATION WORKSPACE</p>
                        <h2>Welcome, {user.username}!</h2>
                        <p>
                            Review NGO applications and manage
                            FoodBridge registrations.
                        </p>
                    </div>
                    <div className="welcome-emoji">🤝</div>
                </section>

                {error && <div className="admin-error">{error}</div>}

                {actionMessage && (
                    <div className="admin-success">{actionMessage}</div>
                )}

                <section className="admin-stats">
                    <div className="admin-stat-card">
                        <h3>Total Users</h3>
                        <strong>{stats?.total_users ?? 0}</strong>
                    </div>

                    <div className="admin-stat-card">
                        <h3>Food Donors</h3>
                        <strong>{stats?.total_donors ?? 0}</strong>
                    </div>

                    <div className="admin-stat-card">
                        <h3>Registered NGOs</h3>
                        <strong>{stats?.total_ngos ?? 0}</strong>
                    </div>

                    <div className="admin-stat-card">
                        <h3>Pending Verifications</h3>
                        <strong>{stats?.pending_verifications ?? 0}</strong>
                    </div>
                </section>

                <section className="admin-section">
                    <div className="admin-section-heading">
                        <div>
                            <h2>NGO Verification Requests</h2>
                            <p>
                                Review organization details and
                                supporting documents before approval.
                            </p>
                        </div>

                        <button
                            className="admin-refresh-button"
                            onClick={loadAdminData}
                            disabled={loading}
                        >
                            {loading ? "Loading..." : "↻ Refresh"}
                        </button>
                    </div>

                    {loading ? (
                        <p>Loading NGO applications...</p>
                    ) : ngos.length === 0 ? (
                        <p>No NGO applications registered yet.</p>
                    ) : (
                        <div className="admin-table-wrapper">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Organization</th>
                                        <th>Email</th>
                                        <th>Phone</th>
                                        <th>Status</th>
                                        <th>Application</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {ngos.map((ngo) => (
                                        <tr key={ngo.id}>
                                            <td>{ngo.organization_name}</td>
                                            <td>{ngo.email}</td>
                                            <td>{ngo.phone || "—"}</td>
                                            <td>
                                                <span className={`verification-status ${ngo.verification_status}`}>
                                                    {ngo.verification_status}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    className="view-details-button"
                                                    onClick={() => setSelectedNgo(ngo)}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                            <td>
                                                {ngo.verification_status !== "verified" && (
                                                    <button
                                                        className="approve-button"
                                                        onClick={() =>
                                                            handleVerification(ngo.id, "verified")
                                                        }
                                                    >
                                                        Approve
                                                    </button>
                                                )}

                                                {ngo.verification_status !== "rejected" && (
                                                    <button
                                                        className="reject-button"
                                                        onClick={() =>
                                                            handleVerification(ngo.id, "rejected")
                                                        }
                                                    >
                                                        Reject
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>

                <section className="admin-section">
                    <h2>Administrator Profile</h2>
                    <p><strong>Username:</strong> {user.username}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Role:</strong> Administrator</p>
                </section>
            
            </div>

            {/* NGO DETAILS MODAL */}
            {selectedNgo && (
                <div
                    className="ngo-modal-overlay"
                    onClick={() => setSelectedNgo(null)}
                >
                    <div
                        className="ngo-details-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="ngo-modal-header">
                            <div>
                                <span className="modal-eyebrow">
                                    NGO APPLICATION
                                </span>
                                <h2>{selectedNgo.organization_name}</h2>
                                <span className={`verification-status ${selectedNgo.verification_status}`}>
                                    {selectedNgo.verification_status}
                                </span>
                            </div>

                            <button
                                className="modal-close-button"
                                onClick={() => setSelectedNgo(null)}
                            >
                                ×
                            </button>
                        </div>

                        <h3 className="modal-section-title">
                            Organization information
                        </h3>

                        <div className="ngo-detail-grid">
                            <div>
                                <span>Username</span>
                                <strong>{selectedNgo.username || "—"}</strong>
                            </div>

                            <div>
                                <span>Organization name</span>
                                <strong>{selectedNgo.organization_name || "—"}</strong>
                            </div>

                            <div>
                                <span>Email address</span>
                                <strong>{selectedNgo.email || "—"}</strong>
                            </div>

                            <div>
                                <span>Phone number</span>
                                <strong>{selectedNgo.phone || "—"}</strong>
                            </div>

                            <div>
                                <span>Registration number</span>
                                <strong>{selectedNgo.registration_number || "—"}</strong>
                            </div>

                            <div>
                                <span>Contact person</span>
                                <strong>{selectedNgo.contact_person || "—"}</strong>
                            </div>

                            <div className="detail-full-width">
                                <span>Organization address</span>
                                <strong>{selectedNgo.address || "—"}</strong>
                            </div>

                            <div className="detail-full-width">
                                <span>Organization description</span>
                                <p>{selectedNgo.description || "No description provided."}</p>
                            </div>
                        </div>

                        <h3 className="modal-section-title">
                            Registration certificate
                        </h3>

                        {selectedNgo.registration_certificate ? (
                            <a
                                className="certificate-link"
                                href={selectedNgo.registration_certificate}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                📄 View uploaded certificate
                            </a>
                        ) : (
                            <p className="certificate-missing">
                                No certificate uploaded.
                            </p>
                        )}

                        {selectedNgo.verification_status === "rejected" &&
                            selectedNgo.rejection_reason && (
                                <div className="rejection-reason-box">
                                    <strong>Previous rejection reason</strong>
                                    <p>{selectedNgo.rejection_reason}</p>
                                </div>
                            )}

                        <div className="ngo-modal-actions">
                            {selectedNgo.verification_status !== "verified" && (
                                <button
                                    className="approve-button"
                                    onClick={() =>
                                        handleVerification(selectedNgo.id, "verified")
                                    }
                                >
                                    Approve NGO
                                </button>
                            )}

                            {selectedNgo.verification_status !== "rejected" && (
                                <button
                                    className="reject-button"
                                    onClick={() =>
                                        handleVerification(selectedNgo.id, "rejected")
                                    }
                                >
                                    Reject NGO
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}


function App() {
    const [page, setPage] = useState("login");
    const [user, setUser] = useState(null);
    const [activeMenu, setActiveMenu] = useState("Overview");
    const [dashboardData, setDashboardData] = useState(null);
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [dashboardError, setDashboardError] = useState("");
    
    
const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "donor",
    organization_name: "",
    phone: "",
    registration_number: "",
    address: "",
    contact_person: "",
    description: "",
    registration_certificate: null
});


    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const [donations, setDonations] = useState([]);
    const [requests, setRequests] = useState([]);
    const [foodLoading, setFoodLoading] = useState(false);
    const [foodError, setFoodError] = useState("");
    const [foodMessage, setFoodMessage] = useState("");

const [foodForm, setFoodForm] = useState({
    food_name: "",
    description: "",
    quantity: "",
    unit: "kg",
    servings: "",
    prepared_at: "",
    expires_at: "",
    pickup_address: ""
});

const [requestMessages, setRequestMessages] = useState({});
// Search, filter and sort states for NGO food donations
const [searchTerm, setSearchTerm] = useState("");
const [sortOption, setSortOption] = useState("newest");
const [expiryFilter, setExpiryFilter] = useState("all");
const handleChange = (e) => {
    const { name, value, files, type } = e.target;

    setForm((previous) => ({
        ...previous,
        [name]: type === "file" ? files[0] : value
    }));
};


    const saveSession = (data) => {
        sessionStorage.setItem("access_token", data.tokens.access);
        sessionStorage.setItem("refresh_token", data.tokens.refresh);
        setUser(data.user);
    };

   
const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
        const formData = new FormData();

        formData.append("username", form.username);
        formData.append("email", form.email);
        formData.append("password", form.password);
        formData.append("role", form.role);
        formData.append("organization_name", form.organization_name);
        formData.append("phone", form.phone);

        if (form.role === "ngo") {
            formData.append("registration_number", form.registration_number);
            formData.append("address", form.address);
            formData.append("contact_person", form.contact_person);
            formData.append("description", form.description);

            if (form.registration_certificate) {
                formData.append(
                    "registration_certificate",
                    form.registration_certificate
                );
            }
        }

        const response = await api.post("auth/register/", formData);

        saveSession(response.data);
        setMessage("Account created successfully!");

    } catch (err) {
        console.error("Registration error:", err.response?.data || err);

        const data = err.response?.data;
        const firstError = data
            ? Object.values(data).flat()[0]
            : null;

        setError(
            typeof firstError === "string"
                ? firstError
                : "Registration failed. Please check your details."
        );
    } finally {
        setLoading(false);
    }
};


    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await api.post("auth/login/", {
                email: form.email,
                password: form.password
            });
            saveSession(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || "Invalid email or password.");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem("access_token");
        sessionStorage.removeItem("refresh_token");
        setUser(null);
        setPage("login");
        setActiveMenu("Overview");
        setError("");
        setMessage("");
    };

    const menuItems = [
        { name: "Overview", icon: "◫" },
        { name: "Food Donations", icon: "🍱" },
        { name: "Requests", icon: "⇄" },
        { name: "Pickups", icon: "🚚" },
        { name: "Impact Reports", icon: "▥" }
    ];

    const loadDashboardData = async () => {
    if (!user || user.role === "admin") return;

    // An NGO must be verified before accessing NGO donation features.
    if (
        user.role === "ngo" &&
        user.verification_status !== "verified"
    ) {
        setDashboardData(null);
        return;
    }

    try {
        setDashboardLoading(true);
        setDashboardError("");

        const endpoint =
            user.role === "donor"
                ? "donors/dashboard/"
                : "ngos/dashboard/";

        const response = await api.get(endpoint);
        setDashboardData(response.data);

    } catch (err) {
        console.error("Dashboard loading error:", err.response?.data || err);

        setDashboardError(
            err.response?.data?.detail ||
            "Unable to load dashboard statistics."
        );
    } finally {
        setDashboardLoading(false);
    }
};
const loadFoodData = async () => {
    if (!user || user.role === "admin") return;

    if (user.role === "ngo" && user.verification_status !== "verified") {
        return;
    }

    try {
        setFoodLoading(true);
        setFoodError("");

        if (user.role === "donor") {
            const [donationResponse, requestResponse] = await Promise.all([
                api.get("donors/donations/"),
                api.get("donors/requests/")
            ]);

            setDonations(
                Array.isArray(donationResponse.data)
                    ? donationResponse.data
                    : donationResponse.data.results || []
            );

            setRequests(
                Array.isArray(requestResponse.data)
                    ? requestResponse.data
                    : requestResponse.data.results || []
            );
        } else {
            const [donationResponse, requestResponse] = await Promise.all([
                api.get("ngos/donations/"),
                api.get("ngos/requests/")
            ]);

            setDonations(
                Array.isArray(donationResponse.data)
                    ? donationResponse.data
                    : donationResponse.data.results || []
            );

            setRequests(
                Array.isArray(requestResponse.data)
                    ? requestResponse.data
                    : requestResponse.data.results || []
            );
        }
    } catch (err) {
        console.error("Food data loading error:", err.response?.data || err);
        setFoodError(
            err.response?.data?.detail ||
            "Unable to load food information."
        );
    } finally {
        setFoodLoading(false);
    }
};
// ==========================================
// SEARCH, FILTER AND SORT FOOD DONATIONS
// ==========================================

const filteredDonations = donations
    // Search by food name
    .filter((item) =>
        (item.food_name || "")
            .toLowerCase()
            .includes(searchTerm.trim().toLowerCase())
    )

    // Filter donations expiring within 24 hours
    .filter((item) => {
        if (expiryFilter === "all") return true;

        const expiryTime = new Date(item.expires_at).getTime();
        const remainingTime = expiryTime - Date.now();

        return (
            remainingTime > 0 &&
            remainingTime <= 24 * 60 * 60 * 1000
        );
    })

    // Sort donations
    .sort((a, b) => {
        if (sortOption === "expiry") {
            return new Date(a.expires_at) - new Date(b.expires_at);
        }

        return new Date(b.created_at) - new Date(a.created_at);
    });
const handleFoodFormChange = (e) => {
    const { name, value } = e.target;

    setFoodForm((previous) => ({
        ...previous,
        [name]: value
    }));
};

const handleCreateDonation = async (e) => {
    e.preventDefault();
    setFoodError("");
    setFoodMessage("");

    try {
        const payload = {
            ...foodForm,
            quantity: Number(foodForm.quantity),
            servings: Number(foodForm.servings || 0),
            prepared_at: new Date(foodForm.prepared_at).toISOString(),
            expires_at: new Date(foodForm.expires_at).toISOString()
        };

        await api.post("donors/donations/", payload);

        setFoodMessage("Food donation added successfully!");

        setFoodForm({
            food_name: "",
            description: "",
            quantity: "",
            unit: "kg",
            servings: "",
            prepared_at: "",
            expires_at: "",
            pickup_address: ""
        });

        await loadFoodData();
        await loadDashboardData();
    } catch (err) {
        console.error("Donation creation error:", err.response?.data || err);

        const data = err.response?.data;
        const firstError = data
            ? Object.values(data).flat()[0]
            : null;

        setFoodError(
            typeof firstError === "string"
                ? firstError
                : "Could not create donation. Please check the details."
        );
    }
};

const handleRequestFood = async (donationId) => {
    setFoodError("");
    setFoodMessage("");

    try {
        await api.post("ngos/requests/", {
            donation: donationId,
            message: requestMessages[donationId] || ""
        });

        setFoodMessage("Your food request has been sent to the donor!");

        setRequestMessages((previous) => ({
            ...previous,
            [donationId]: ""
        }));

        await loadFoodData();
        await loadDashboardData();
    } catch (err) {
        console.error("Food request error:", err.response?.data || err);

        setFoodError(
            err.response?.data?.detail ||
            err.response?.data?.error ||
            "Could not send your request. This donation may already be requested."
        );
    }
};

const handleManageRequest = async (requestId, action) => {
    setFoodError("");
    setFoodMessage("");

    try {
        const response = await api.patch(
            `donors/requests/${requestId}/manage/`,
            { action }
        );

        setFoodMessage(
            response.data.message ||
            `Request ${action}ed successfully.`
        );

        await loadFoodData();
        await loadDashboardData();
    } catch (err) {
        console.error("Request management error:", err.response?.data || err);

        setFoodError(
            err.response?.data?.detail ||
            err.response?.data?.error ||
            "Could not update this request."
        );
    }
};

useEffect(() => {
    if (!user || user.role === "admin") return;

    loadDashboardData();

    const interval = setInterval(() => {
        loadDashboardData();
    }, 30000);

    return () => clearInterval(interval);
}, [user]);

useEffect(() => {
    if (!user || user.role === "admin") return;

    if (
        user.role === "ngo" &&
        user.verification_status !== "verified"
    ) {
        return;
    }

    loadFoodData();
}, [user, activeMenu]);
if (user) {
      if (user.role === "admin") {
    return (
      <AdminDashboard
        user={user}
        onLogout={handleLogout}
      />
    );
  }
    return (
        <main className="dashboard">
            <header className="dashboard-header">
                <div className="brand">
                    <span className="brand-icon">🍱</span>
                    <div>
                        <h2>FoodBridge</h2>
                        <p>Food rescue platform</p>
                    </div>
                </div>

                <div className="header-right">
                    <div className="user-avatar">
                        {user.organization_name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-info">
                        <strong>{user.organization_name}</strong>
                        <span>{user.role.toUpperCase()}</span>
                    </div>
                    <button className="logout-button" onClick={handleLogout}>

                        Logout ↗
                    </button>
                </div>
            </header>

            <div className="dashboard-content">
                <section className="welcome-banner">
                    <div>
                        <span className="welcome-label">YOUR FOOD RESCUE WORKSPACE</span>
                        <h1>Hello, {user.username}! 👋</h1>
                        <p>
                            Let's make a difference by connecting surplus food
                            with people who need it.
                        </p>
                    </div>
                    <div className="welcome-emoji">🥗</div>
                </section>
                <nav className="foodbridge-nav">
                {["Overview", "Food Donations", "Requests", "Pickups"].map((item) => (
                    <button
                        key={item}
                        className={activeMenu === item ? "active" : ""}
                        onClick={() => {
                            setActiveMenu(item);
                            setFoodError("");
                            setFoodMessage("");
                        }}
                    >
                        {item}
                    </button>
                ))}
            </nav>
                
{/* ==========================================
    SECTION 1: OVERVIEW DASHBOARD
    Displayed only when Overview is selected
========================================== */}

{activeMenu === "Overview" && (
    <>
        {/* Dashboard heading */}
        <section className="section-title">
            <div>
                <h2>Dashboard Overview</h2>
                <p>
                    Here's an overview of your FoodBridge activities.
                </p>
            </div>
        </section>

        {/* Show verification warning for unverified NGOs */}
        {user.role === "ngo" &&
            user.verification_status !== "verified" && (
                <div className="alert">
                    Your NGO account is awaiting verification.
                    You can access donation features after approval.
                    <br />
                    Current status: {user.verification_status}
                </div>
            )}

        {/* Display dashboard loading errors */}
        {dashboardError && (
            <div className="alert error">
                {dashboardError}
            </div>
        )}

        {/* ======================================
            DASHBOARD STATISTICS
            Different statistics for donor and NGO
        ====================================== */}

        <section className="stats-grid">

            {/* Donor statistics */}
            {user.role === "donor" ? (
                <>
                    <div className="stat-card purple-card">
                        <div className="stat-icon">🍱</div>
                        <p>Total Donations</p>
                        <h2>
                            {dashboardData?.donations?.total ?? 0}
                        </h2>
                        <span>Food donations created</span>
                    </div>

                    <div className="stat-card pink-card">
                        <div className="stat-icon">📋</div>
                        <p>Pending Requests</p>
                        <h2>
                            {dashboardData?.requests?.pending ?? 0}
                        </h2>
                        <span>Waiting for your response</span>
                    </div>

                    <div className="stat-card blue-card">
                        <div className="stat-icon">🚚</div>
                        <p>Completed Donations</p>
                        <h2>
                            {dashboardData?.donations?.completed ?? 0}
                        </h2>
                        <span>Successfully completed</span>
                    </div>

                    <div className="stat-card orange-card">
                        <div className="stat-icon">🌍</div>
                        <p>Meals Redistributed</p>
                        <h2>
                            {dashboardData?.meals_redistributed ?? 0}
                        </h2>
                        <span>Servings from completed donations</span>
                    </div>
                </>
            ) : user.role === "ngo" &&
                user.verification_status === "verified" ? (

                /* Verified NGO statistics */
                <>
                    <div className="stat-card purple-card">
                        <div className="stat-icon">🍱</div>
                        <p>Available Donations</p>
                        <h2>
                            {dashboardData?.available_donations ?? 0}
                        </h2>
                        <span>Food available to request</span>
                    </div>

                    <div className="stat-card pink-card">
                        <div className="stat-icon">📋</div>
                        <p>Pending Requests</p>
                        <h2>
                            {dashboardData?.requests?.pending ?? 0}
                        </h2>
                        <span>Awaiting donor response</span>
                    </div>

                    <div className="stat-card blue-card">
                        <div className="stat-icon">🤝</div>
                        <p>Accepted Requests</p>
                        <h2>
                            {dashboardData?.requests?.accepted ?? 0}
                        </h2>
                        <span>Requests accepted by donors</span>
                    </div>

                    <div className="stat-card orange-card">
                        <div className="stat-icon">🌍</div>
                        <p>Meals Received</p>
                        <h2>
                            {dashboardData?.meals_received ?? 0}
                        </h2>
                        <span>Servings from completed requests</span>
                    </div>
                </>
            ) : null}
        </section>
    </>
)}

        {activeMenu === "Food Donations" && (
    <section className="food-page">
        <h2>
            {user.role === "donor" ? "Add Food Donation" : "Available Food Donations"}
        </h2>

        <p className="card-description">
            {user.role === "donor"
                ? "Share surplus food with NGOs that need it."
                : "Explore available food and request donations for your organization."}
        </p>

        {foodError && <div className="alert error">{foodError}</div>}
        {foodMessage && <div className="alert success">{foodMessage}</div>}

        {user.role === "donor" ? (
            <>
                <form className="food-form content-card" onSubmit={handleCreateDonation}>
                    <h3>Food information</h3>

                    <div className="food-form-grid">
                        <div className="form-field">
                            <label>Food name</label>
                            <input
                                name="food_name"
                                value={foodForm.food_name}
                                onChange={handleFoodFormChange}
                                placeholder="Example: Vegetable rice"
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label>Quantity</label>
                            <input
                                type="number"
                                name="quantity"
                                min="0.01"
                                step="0.01"
                                value={foodForm.quantity}
                                onChange={handleFoodFormChange}
                                placeholder="Example: 10"
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label>Unit</label>
                            <select
                                name="unit"
                                value={foodForm.unit}
                                onChange={handleFoodFormChange}
                            >
                                <option value="kg">Kilograms (kg)</option>
                                <option value="litres">Litres</option>
                                <option value="packets">Packets</option>
                                <option value="boxes">Boxes</option>
                                <option value="plates">Plates</option>
                            </select>
                        </div>

                        <div className="form-field">
                            <label>Estimated servings</label>
                            <input
                                type="number"
                                name="servings"
                                min="0"
                                value={foodForm.servings}
                                onChange={handleFoodFormChange}
                                placeholder="Example: 25"
                            />
                        </div>

                        <div className="form-field full-width">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={foodForm.description}
                                onChange={handleFoodFormChange}
                                placeholder="Describe the food, packaging and storage conditions"
                                rows="3"
                            />
                        </div>

                        <div className="form-field">
                            <label>Prepared date and time</label>
                            <input
                                type="datetime-local"
                                name="prepared_at"
                                value={foodForm.prepared_at}
                                onChange={handleFoodFormChange}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label>Expiry date and time</label>
                            <input
                                type="datetime-local"
                                name="expires_at"
                                value={foodForm.expires_at}
                                onChange={handleFoodFormChange}
                                required
                            />
                        </div>

                        <div className="form-field full-width">
                            <label>Pickup address</label>
                            <textarea
                                name="pickup_address"
                                value={foodForm.pickup_address}
                                onChange={handleFoodFormChange}
                                placeholder="Enter the complete pickup address"
                                rows="2"
                                required
                            />
                        </div>
                    </div>

                    <button className="food-action-button" type="submit">
                        + Add Food Donation
                    </button>
                </form>

                <div className="content-card food-list-card">
                    <h3>Your Food Donations</h3>

                  {foodLoading ? (
                <p>Loading donations...</p>
            ) : donations.length === 0 ? (
                <p>You have not added any food donations yet.</p>
            ) : (
                <div className="food-card-grid">
                    {donations.map((item) => (
                        <article className="food-card" key={item.id}>
                            <div className="food-card-heading">
                                <h3>{item.food_name}</h3>
                                <span className={`food-status ${item.status}`}>
                                    {item.status}
                    </span>
                </div>

                <p>{item.description || "No description provided."}</p>

                <div className="food-details">
                    <span>
                        Quantity: <strong>{item.quantity} {item.unit}</strong>
                    </span>
                    <span>
                        Servings: <strong>{item.servings ?? 0}</strong>
                    </span>
                    <span>
                        Prepared: <strong>{new Date(item.prepared_at).toLocaleString()}</strong>
                    </span>
                    <span>
                        Expires: <strong>{new Date(item.expires_at).toLocaleString()}</strong>
                    </span>
                    <span>
                        Pickup: <strong>{item.pickup_address}</strong>
                    </span>
                </div>
            </article>
        ))}
    </div>
)}
</div> {/* Closes food-list-card */}
</>  
) : (

        <>   

         {/* NGO FOOD SEARCH, FILTER AND SORT */}

         <div className="food-filter-panel">

            {/* Search donations by food name */}
            <div className="form-field">
                <label>Search Food</label>
                <input
                    type="text"
                    placeholder="Search rice, vegetables, fruits..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Filter donations by expiry time */}
            <div className="form-field">
                <label>Filter by Expiry</label>
                <select
                    value={expiryFilter}
                    onChange={(e) => setExpiryFilter(e.target.value)}
                >
                    <option value="all">All Donations</option>
                    <option value="24hours">Expiring within 24 hours</option>
                </select>
            </div>

            {/* Sort donations */}
            <div className="form-field">
                <label>Sort Donations</label>
                <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                >
                    <option value="newest">Newest First</option>
                    <option value="expiry">Earliest Expiry First</option>
                </select>
            </div>

          </div>


            <div className="food-card-grid">
                {foodLoading ? (
                <p>Loading available food...</p>
                ) : filteredDonations.length === 0 ? (
                    <p>No matching food donations found.</p>
                ) : (
                    filteredDonations.map((item) => (
                        <article className="food-card" key={item.id}>
                            <div className="food-card-heading">
                                <h3>{item.food_name}</h3>
                                <span className="food-status available">Available</span>
                            </div>

                            <p>{item.description || "No description provided."}</p>

                            <div className="food-details">
                                <span>Donor: <strong>{item.donor_name || "Food donor"}</strong></span>
                                <span>Quantity: <strong>{item.quantity} {item.unit}</strong></span>
                                <span>Servings: <strong>{item.servings ?? 0}</strong></span>
                                <span>Prepared: <strong>{new Date(item.prepared_at).toLocaleString()}</strong></span>
                                <span>Expires: <strong>{new Date(item.expires_at).toLocaleString()}</strong></span>
                                <span>Pickup address: <strong>{item.pickup_address}</strong></span>
                            </div>

                            <label className="request-message-label">
                                Message to donor
                            </label>

                            <textarea
                                rows="2"
                                placeholder="Tell the donor why your NGO needs this food..."
                                value={requestMessages[item.id] || ""}
                                onChange={(e) =>
                                    setRequestMessages((previous) => ({
                                        ...previous,
                                        [item.id]: e.target.value
                                    }))
                                }
                            />

                            <button
                                className="food-action-button"
                                onClick={() => handleRequestFood(item.id)}
                            >
                                Request This Food
                            </button>
                        </article>
                 ))
                 )}
            </div> 

          </>
)}
      </section>
  )}
{activeMenu === "Requests" && (
    <section className="food-page">
        <h2>{user.role === "donor" ? "Incoming NGO Requests" : "My Food Requests"}</h2>

        <p className="card-description">
            {user.role === "donor"
                ? "Review requests received from NGOs and decide whether to accept them."
                : "Track the food donations your organization has requested."}
        </p>

        {foodError && <div className="alert error">{foodError}</div>}
        {foodMessage && <div className="alert success">{foodMessage}</div>}

        {foodLoading ? (
            <p>Loading requests...</p>
        ) : requests.length === 0 ? (
            <div className="content-card">
                <p>No food requests found yet.</p>
            </div>
        ) : (
            <div className="food-card-grid">
                {requests.map((request) => (
                    <article className="food-card" key={request.id}>
                        <div className="food-card-heading">
                            <h3>{request.food_name || "Food request"}</h3>
                            <span className={`food-status ${request.status}`}>
                                {request.status}
                            </span>
                        </div>

                        {user.role === "donor" ? (
                            <>
                                <div className="food-details">
                                    <span>NGO: <strong>{request.ngo_name || request.ngo_organization_name || "NGO"}</strong></span>
                                    <span>Email: <strong>{request.ngo_email || "—"}</strong></span>
                                    <span>Quantity: <strong>{request.quantity ?? "See donation details"} {request.unit || ""}</strong></span>
                                    <span>Pickup address: <strong>{request.pickup_address || "See donation details"}</strong></span>
                                </div>

                                <p className="request-message">
                                    <strong>NGO message:</strong>{" "}
                                    {request.message || "No message provided."}
                                </p>

                                {request.status === "pending" && (
                                    <div className="request-actions">
                                        <button
                                            className="food-action-button"
                                            onClick={() =>
                                                handleManageRequest(request.id, "accept")
                                            }
                                        >
                                            Accept Request
                                        </button>

                                        <button
                                            className="food-reject-button"
                                            onClick={() =>
                                                handleManageRequest(request.id, "reject")
                                            }
                                        >
                                            Reject Request
                                        </button>
                                    </div>
                                )}

                                {request.status === "accepted" && (
                                    <button
                                        className="food-action-button"
                                        onClick={() =>
                                            handleManageRequest(request.id, "complete")
                                        }
                                    >
                                        Mark Food as Picked Up
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="food-details">
                                    <span>Donor: <strong>{request.donor_name || "Food donor"}</strong></span>
                                    <span>Quantity: <strong>{request.quantity ?? "See donation details"} {request.unit || ""}</strong></span>
                                    <span>Pickup address: <strong>{request.pickup_address || "See donation details"}</strong></span>
                                </div>

                                <p className="request-message">
                                    <strong>Your message:</strong>{" "}
                                    {request.message || "No message provided."}
                                </p>

                                <p className="request-status-note">
                                    {request.status === "pending" &&
                                        "Waiting for the donor to respond."}
                                    {request.status === "accepted" &&
                                        "Your request has been accepted. Please coordinate the pickup with the donor."}
                                    {request.status === "rejected" &&
                                        "The donor did not accept this request."}
                                    {request.status === "completed" &&
                                        "This food request has been completed."}
                                </p>
                            </>
                        )}
                    </article>
                ))}
            </div>
        )}
    </section>
)}

    {activeMenu === "Overview" && (
                    <>

    {user.role === "donor" && (
    <section className="content-card dashboard-activity">
        <h3>Recent Donations</h3>
        <p className="card-description">
            Your latest food donation activity.
        </p>

        {dashboardLoading && !dashboardData ? (
            <p>Loading donations...</p>
        ) : dashboardData?.recent_donations?.length > 0 ? (
            dashboardData.recent_donations.map((donation) => (
                <div className="journey-item" key={donation.id}>
                    <span className="journey-icon">🍱</span>
                    <div>
                        <strong>{donation.food_name}</strong>
                        <p>
                            Quantity: {donation.quantity} {donation.unit}
                        </p>
                        <p>
                            Status: {donation.status}
                        </p>
                    </div>
                </div>
            ))
        ) : (
            <p>No donations have been created yet.</p>
        )}
    </section>
)}

{user.role === "ngo" &&
    user.verification_status === "verified" && (
        <section className="content-card dashboard-activity">
            <h3>Recent Requests</h3>
            <p className="card-description">
                Your latest food request activity.
            </p>

            {dashboardLoading && !dashboardData ? (
                <p>Loading requests...</p>
            ) : dashboardData?.recent_requests?.length > 0 ? (
                dashboardData.recent_requests.map((request) => (
                    <div className="journey-item" key={request.id}>
                        <span className="journey-icon">📋</span>
                        <div>
                            <strong>
                                {request.food_name || "Food request"}
                            </strong>
                            <p>
                                Donor: {request.donor_name || "—"}
                            </p>
                            <p>
                                Status: {request.status}
                            </p>
                        </div>
                    </div>
                ))
            ) : (
                <p>No food requests have been made yet.</p>
            )}
        </section>
    )}

                <section className="lower-grid">
                    <div className="content-card">
                        <h3>How FoodBridge Works</h3>
                        <p className="card-description">
                            A simple journey towards reducing food waste.
                        </p>

                        <div className="journey-item">
                            <span className="journey-icon">🍲</span>
                            <div>
                                <strong>Share surplus food</strong>
                                <p>Donors list their available surplus food.</p>
                            </div>
                        </div>

                        <div className="journey-item">
                            <span className="journey-icon">🤝</span>
                            <div>
                                <strong>Connect with NGOs</strong>
                                <p>NGOs find suitable food donations.</p>
                            </div>
                        </div>

                        <div className="journey-item">
                            <span className="journey-icon">🚚</span>
                            <div>
                                <strong>Arrange collection</strong>
                                <p>Coordinate and verify food pickups.</p>
                            </div>
                        </div>

                        <div className="journey-item">
                            <span className="journey-icon">💜</span>
                            <div>
                                <strong>Make an impact</strong>
                                <p>Track rescued food and meals redistributed.</p>
                            </div>
                        </div>
                    </div>

                    <div className="content-card organization-card">
                        <h3>Organization Profile</h3>
                        <p className="card-description">
                            Your account information.
                        </p>

                        <div className="organization-avatar">
                            {user.organization_name?.charAt(0).toUpperCase()}
                        </div>

                        <h3 className="org-name">{user.organization_name}</h3>
                        <span className="role-badge">{user.role}</span>

                        <div className="profile-details">
                            <div>
                                <span>Email Address</span>
                                <strong>{user.email}</strong>
                            </div>
                            <div>
                                <span>Phone Number</span>
                                <strong>{user.phone || "Not provided"}</strong>
                            </div>
                            <div>
                                <span>Verification Status</span>
                                <strong>
                                    {user.role === "ngo"
                                        ? user.verification_status
                                        : "Active"}
                                </strong>
                            </div>
                        </div>

                        {user.role === "ngo" &&
                            user.verification_status === "pending" && (
                                <p className="verification-note">
                                    Your NGO account is awaiting verification.
                                </p>
                            )}
                    </div>
                </section>

                <footer className="dashboard-footer">
                    FoodBridge © 2026 · Together, let's reduce food waste and fight hunger.
                </footer>
                </>
        )}
            </div>
        </main>
    );
}


    return (
        <main className="auth-page">
            <section className={`auth-card ${page === "register" ? "auth-card-register" : ""}`}>
                <div className="auth-logo">🍱</div>
                <h1>FoodBridge</h1>
                <p className="auth-subtitle">
                    Connecting surplus food with those who need it.
                </p>

                <div className="tabs">
                    <button
                        className={page === "login" ? "active" : ""}
                        onClick={() => {
                            setPage("login");
                            setError("");
                            setMessage("");
                        }}
                    >
                        Login
                    </button>
                    <button
                        className={page === "register" ? "active" : ""}
                        onClick={() => {
                            setPage("register");
                            setError("");
                            setMessage("");
                        }}
                    >
                        Register
                    </button>
                </div>

                {error && <div className="alert error">{error}</div>}
                {message && <div className="alert success">{message}</div>}

               
<form
    onSubmit={page === "login" ? handleLogin : handleRegister}
    className={page === "register" ? "register-form" : "login-form"}
>
    {page === "register" && (
        <>
            <h3 className="form-section-title">Account details</h3>

            <div className="form-grid">
                <div className="form-field">
                    <label>Username</label>
                    <input
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        placeholder="Choose a username"
                        required
                    />
                </div>

                <div className="form-field">
                    <label>Organization name</label>
                    <input
                        name="organization_name"
                        value={form.organization_name}
                        onChange={handleChange}
                        placeholder="Organization name"
                        required
                    />
                </div>

                <div className="form-field">
                    <label>Phone number</label>
                    <input
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="Enter phone number"
                    />
                </div>

                <div className="form-field">
                    <label>Register as</label>
                    <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                    >
                        <option value="donor">Food Donor</option>
                        <option value="ngo">NGO</option>
                    </select>
                </div>

                <div className="form-field">
                    <label>Email address</label>
                    <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                    />
                </div>

                <div className="form-field">
                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        placeholder="Create a password"
                        required
                    />
                </div>
            </div>

            {form.role === "ngo" && (
                <>
                    <h3 className="form-section-title ngo-form-title">
                        NGO verification details
                    </h3>

                    <div className="form-grid">
                        <div className="form-field">
                            <label>Registration number</label>
                            <input
                                name="registration_number"
                                value={form.registration_number}
                                onChange={handleChange}
                                placeholder="NGO registration number"
                                required
                            />
                        </div>

                        <div className="form-field">
                            <label>Contact person</label>
                            <input
                                name="contact_person"
                                value={form.contact_person}
                                onChange={handleChange}
                                placeholder="Full name"
                                required
                            />
                        </div>

                        <div className="form-field full-width">
                            <label>Organization address</label>
                            <textarea
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                                placeholder="Enter complete address"
                                rows="2"
                                required
                            />
                        </div>

                        <div className="form-field full-width">
                            <label>Organization description</label>
                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                placeholder="Briefly describe your NGO and its work"
                                rows="2"
                                required
                            />
                        </div>

                        <div className="form-field full-width">
                            <label>Registration certificate</label>
                            <input
                                type="file"
                                name="registration_certificate"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleChange}
                                required
                            />
                            <small className="file-help">
                                Upload your NGO registration certificate (PDF or image).
                            </small>
                        </div>
                    </div>
                </>
            )}
        </>
    )}

    {page === "login" && (
        <>
            <div className="form-field">
                <label>Email address</label>
                <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    required
                />
            </div>

            <div className="form-field">
                <label>Password</label>
                <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                />
            </div>
        </>
    )}

    <button
        type="submit"
        className="primary-button"
        disabled={loading}
    >
        {loading
            ? "Please wait..."
            : page === "login"
                ? "Login to FoodBridge"
                : "Create account"}
    </button>
</form>


                <p className="auth-footer">
                    🌍 Together, let's reduce food waste and fight hunger.
                </p>
            </section>
        </main>
    );
};

export default App;
