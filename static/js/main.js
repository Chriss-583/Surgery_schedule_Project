// main.js - JavaScript functionality for Hospital Management System

document.addEventListener('DOMContentLoaded', function() {
    // Initialize application
    initApp();
    
    // Fetch initial data
    fetchDashboardData();
    loadNotifications();
    
    // Setup event listeners
    setupEventListeners();
});

// Initialize application
function initApp() {
    // Toggle sidebar
    document.getElementById('sidebarCollapse').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('active');
        document.getElementById('content').classList.toggle('active');
    });
    
    // Toggle notifications dropdown
    document.querySelector('.notifications-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        document.getElementById('notificationsDropdown').classList.toggle('show');
        document.querySelector('.user-dropdown-content').classList.remove('show');
    });
    
    // Toggle user dropdown
    document.querySelector('.user-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        document.querySelector('.user-dropdown-content').classList.toggle('show');
        document.getElementById('notificationsDropdown').classList.remove('show');
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function() {
        document.getElementById('notificationsDropdown').classList.remove('show');
        document.querySelector('.user-dropdown-content').classList.remove('show');
    });
    
    // Prevent dropdown closing when clicking inside
    document.getElementById('notificationsDropdown').addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    document.querySelector('.user-dropdown-content').addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    setupNavigation();
    
    // Modal handling
    setupModals();
    
    // Form submissions
    setupFormSubmissions();
    
    // Buttons and actions
    setupActionButtons();
}

// Setup navigation
function setupNavigation() {
    // Sidebar navigation
    const navLinks = {
        'nav-dashboard': 'dashboardContent',
        'nav-patients': 'patientsContent',
        'nav-surgeries': 'surgeriesContent',
        'nav-doctors': 'doctorsContent',
        'nav-operating-rooms': 'operatingRoomsContent',
        'nav-medical-supplies': 'medicalSuppliesContent',
        'nav-users': 'usersContent',
        'nav-reports': 'reportsContent',
        'nav-profile': 'profileContent',
        'nav-settings': 'settingsContent'
    };
    
    // Add click event to each nav link
    for (const [linkId, contentId] of Object.entries(navLinks)) {
        const link = document.getElementById(linkId);
        if (link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Hide all content sections
                document.querySelectorAll('.content-section').forEach(section => {
                    section.classList.remove('active');
                });
                
                // Show selected content section
                const contentSection = document.getElementById(contentId);
                if (contentSection) {
                    contentSection.classList.add('active');
                }
                
                // Update active state in sidebar
                document.querySelectorAll('#sidebar li').forEach(item => {
                    item.classList.remove('active');
                });
                
                // If it's a sidebar item, add active class
                if (linkId.startsWith('nav-')) {
                    const parentLi = link.closest('li');
                    if (parentLi) {
                        parentLi.classList.add('active');
                    }
                }
                
                // Load section data if needed
                loadSectionData(contentId);
            });
        }
    }
    
    // Add click events for other navigation actions
    document.getElementById('viewAllSurgeries').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('nav-surgeries').click();
    });
    
    document.getElementById('viewAllSupplies').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('nav-medical-supplies').click();
    });
}

// Setup modals
function setupModals() {
    // Show modal function
    window.showModal = function(modalId) {
        document.getElementById('modalOverlay').style.display = 'block';
        document.getElementById(modalId).style.display = 'block';
        document.body.style.overflow = 'hidden';
    };
    
    // Close modal function
    window.closeModal = function() {
        document.getElementById('modalOverlay').style.display = 'none';
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    };
    
    // Add event listeners to close buttons
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', closeModal);
    });
    
    // Close modal when clicking on overlay
    document.getElementById('modalOverlay').addEventListener('click', closeModal);
    
    // Prevent modal closing when clicking inside modal content
    document.querySelectorAll('.modal-content').forEach(content => {
        content.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    });
    
    // Open add patient modal
    document.getElementById('addPatientBtn').addEventListener('click', function() {
        document.getElementById('addPatientForm').reset();
        showModal('addPatientModal');
    });
    
    // Open schedule surgery modal
    document.getElementById('scheduleSurgeryBtn').addEventListener('click', function() {
        document.getElementById('scheduleSurgeryForm').reset();
        
        // Load dropdown options
        loadPatientOptions();
        loadDoctorOptions();
        loadOperatingRoomOptions();
        loadSupplyOptions();
        
        showModal('scheduleSurgeryModal');
    });
}

// Setup form submissions
function setupFormSubmissions() {
    // Add patient form
    document.getElementById('addPatientForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('patientName').value,
            gender: document.getElementById('patientGender').value,
            dob: document.getElementById('patientDob').value || null,
            blood_type: document.getElementById('patientBloodType').value || null,
            contact_number: document.getElementById('patientContact').value,
            email: document.getElementById('patientEmail').value || null,
            address: document.getElementById('patientAddress').value || null,
            medical_history: document.getElementById('patientMedicalHistory').value || null,
            allergies: document.getElementById('patientAllergies').value || null
        };
        
        fetch('/api/patients', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.id) {
                closeModal();
                showToast('Patient added successfully');
                
                // Reload patients data
                loadPatients();
                
                // Update dashboard counts
                fetchDashboardData();
            } else {
                showToast('Error: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred. Please try again.', 'error');
        });
    });
    
    // Schedule surgery form
    document.getElementById('scheduleSurgeryForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get selected supplies
        const suppliesNeeded = [];
        document.querySelectorAll('.supply-select').forEach(select => {
            if (select.value) {
                suppliesNeeded.push({
                    id: parseInt(select.value),
                    name: select.options[select.selectedIndex].text,
                    quantity: parseInt(select.closest('.supply-item').querySelector('.supply-quantity').value)
                });
            }
        });
        
        const formData = {
            patient_id: parseInt(document.getElementById('surgeryPatient').value),
            doctor_id: parseInt(document.getElementById('surgeryDoctor').value),
            operating_room_id: parseInt(document.getElementById('surgeryRoom').value),
            surgery_type: document.getElementById('surgeryType').value,
            scheduled_date: document.getElementById('surgeryDate').value,
            start_time: document.getElementById('surgeryStartTime').value,
            end_time: document.getElementById('surgeryEndTime').value,
            notes: document.getElementById('surgeryNotes').value || null,
            supplies_needed: suppliesNeeded
        };
        
        fetch('/api/surgeries', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.id) {
                closeModal();
                showToast('Surgery scheduled successfully');
                
                // Reload surgeries data
                loadSurgeries();
                
                // Update dashboard data
                fetchDashboardData();
            } else {
                showToast('Error: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('An error occurred. Please try again.', 'error');
        });
    });
}

// Setup action buttons
function setupActionButtons() {
    // Mark all notifications as read
    document.getElementById('markAllRead').addEventListener('click', function(e) {
        e.preventDefault();
        
        const unreadNotifications = document.querySelectorAll('.notification-item.unread');
        const promises = [];
        
        unreadNotifications.forEach(notification => {
            const notificationId = notification.dataset.id;
            
            promises.push(
                fetch(`/api/notifications/${notificationId}/read`, {
                    method: 'PUT'
                })
            );
        });
        
        Promise.all(promises)
            .then(() => {
                // Reload notifications
                loadNotifications();
                showToast('All notifications marked as read');
            })
            .catch(error => {
                console.error('Error:', error);
                showToast('An error occurred. Please try again.', 'error');
            });
    });
    
    // Add supply in surgery form
    document.getElementById('addSupplyBtn').addEventListener('click', function() {
        addSupplyItem();
    });
    
    // Clear surgery filters
    document.getElementById('clearSurgeryFilters').addEventListener('click', function() {
        document.getElementById('surgeryStatusFilter').value = 'all';
        document.getElementById('surgeryDateFilter').value = '';
        document.getElementById('surgerySearch').value = '';
        
        // Reload surgeries with no filters
        loadSurgeries();
    });
    
    // Surgery status filter
    document.getElementById('surgeryStatusFilter').addEventListener('change', function() {
        loadSurgeries();
    });
    
    // Surgery date filter
    document.getElementById('surgeryDateFilter').addEventListener('change', function() {
        loadSurgeries();
    });
    
    // Search functionality
    document.getElementById('patientSearch').addEventListener('input', debounce(function() {
        loadPatients();
    }, 300));
    
    document.getElementById('surgerySearch').addEventListener('input', debounce(function() {
        loadSurgeries();
    }, 300));
}

// Fetch dashboard data
function fetchDashboardData() {
    // Fetch patient count
    fetch('/api/patients')
        .then(response => response.json())
        .then(data => {
            document.getElementById('totalPatients').textContent = data.length;
        })
        .catch(error => {console.error('Error fetching patients:', error);
            showToast('Failed to load patient data', 'error');
        });
    
    // Fetch surgery count
    fetch('/api/surgeries')
        .then(response => response.json())
        .then(data => {
            document.getElementById('totalSurgeries').textContent = data.length;
            
            // Count upcoming surgeries
            const upcomingSurgeries = data.filter(surgery => 
                new Date(surgery.scheduled_date) >= new Date() && 
                surgery.status !== 'completed' && 
                surgery.status !== 'cancelled'
            );
            
            document.getElementById('upcomingSurgeries').textContent = upcomingSurgeries.length;
            
            // Display upcoming surgeries in dashboard
            displayUpcomingSurgeries(upcomingSurgeries.slice(0, 5));
        })
        .catch(error => {
            console.error('Error fetching surgeries:', error);
            showToast('Failed to load surgery data', 'error');
        });
        
    // Fetch medical supplies data
    fetch('/api/medical-supplies')
        .then(response => response.json())
        .then(data => {
            // Count low stock items
            const lowStockItems = data.filter(item => item.quantity <= item.min_stock_level);
            document.getElementById('lowStockSupplies').textContent = lowStockItems.length;
            
            // Display low stock items in dashboard
            displayLowStockItems(lowStockItems.slice(0, 5));
        })
        .catch(error => {
            console.error('Error fetching supplies:', error);
            showToast('Failed to load supply data', 'error');
        });
}

// Load notifications
function loadNotifications() {
    fetch('/api/notifications')
        .then(response => response.json())
        .then(data => {
            const notificationsContainer = document.getElementById('notificationsList');
            notificationsContainer.innerHTML = '';
            
            // Count unread notifications
            const unreadCount = data.filter(notification => !notification.read).length;
            document.getElementById('unreadNotificationsCount').textContent = unreadCount > 0 ? unreadCount : '';
            
            if (data.length === 0) {
                notificationsContainer.innerHTML = '<div class="no-notifications">No notifications</div>';
                return;
            }
            
            // Display notifications
            data.forEach(notification => {
                const element = document.createElement('div');
                element.className = `notification-item ${notification.read ? 'read' : 'unread'}`;
                element.dataset.id = notification.id;
                
                element.innerHTML = `
                    <div class="notification-icon">
                        <i class="fas ${getNotificationIcon(notification.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <div class="notification-message">${notification.message}</div>
                        <div class="notification-time">${formatTimeAgo(new Date(notification.created_at))}</div>
                    </div>
                    <div class="notification-actions">
                        <button class="mark-read-btn" onclick="markNotificationRead(${notification.id})">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                `;
                
                notificationsContainer.appendChild(element);
            });
        })
        .catch(error => {
            console.error('Error loading notifications:', error);
        });
}

// Mark notification as read
window.markNotificationRead = function(notificationId) {
    fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Reload notifications
            loadNotifications();
        }
    })
    .catch(error => {
        console.error('Error marking notification as read:', error);
    });
};

// Get notification icon based on type
function getNotificationIcon(type) {
    switch (type) {
        case 'surgery':
            return 'fa-calendar-alt';
        case 'patient':
            return 'fa-user';
        case 'supply':
            return 'fa-box-open';
        case 'alert':
            return 'fa-exclamation-circle';
        default:
            return 'fa-bell';
    }
}

// Format time ago
function formatTimeAgo(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
}

// Load section data
function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'patientsContent':
            loadPatients();
            break;
        case 'surgeriesContent':
            loadSurgeries();
            break;
        case 'doctorsContent':
            loadDoctors();
            break;
        case 'operatingRoomsContent':
            loadOperatingRooms();
            break;
        case 'medicalSuppliesContent':
            loadMedicalSupplies();
            break;
        case 'usersContent':
            loadUsers();
            break;
        case 'reportsContent':
            loadReports();
            break;
        case 'profileContent':
            loadProfileData();
            break;
    }
}

// Load patients data
function loadPatients() {
    const searchTerm = document.getElementById('patientSearch').value.trim();
    let url = '/api/patients';
    
    if (searchTerm) {
        url += `?search=${encodeURIComponent(searchTerm)}`;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const patientsTable = document.getElementById('patientsTable').querySelector('tbody');
            patientsTable.innerHTML = '';
            
            if (data.length === 0) {
                patientsTable.innerHTML = `<tr><td colspan="6" class="no-data">No patients found</td></tr>`;
                return;
            }
            
            data.forEach(patient => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${patient.id}</td>
                    <td>${patient.name}</td>
                    <td>${patient.gender || '-'}</td>
                    <td>${patient.dob ? formatDate(new Date(patient.dob)) : '-'}</td>
                    <td>${patient.contact_number || '-'}</td>
                    <td>
                        <button class="action-btn view-btn" onclick="viewPatient(${patient.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" onclick="editPatient(${patient.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                    </td>
                `;
                
                patientsTable.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading patients:', error);
            showToast('Failed to load patient data', 'error');
        });
}

// Load surgeries data
function loadSurgeries() {
    const searchTerm = document.getElementById('surgerySearch').value.trim();
    const statusFilter = document.getElementById('surgeryStatusFilter').value;
    const dateFilter = document.getElementById('surgeryDateFilter').value;
    
    let url = '/api/surgeries?';
    
    if (searchTerm) {
        url += `search=${encodeURIComponent(searchTerm)}&`;
    }
    
    if (statusFilter && statusFilter !== 'all') {
        url += `status=${encodeURIComponent(statusFilter)}&`;
    }
    
    if (dateFilter) {
        url += `date=${encodeURIComponent(dateFilter)}`;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const surgeriesTable = document.getElementById('surgeriesTable').querySelector('tbody');
            surgeriesTable.innerHTML = '';
            
            if (data.length === 0) {
                surgeriesTable.innerHTML = `<tr><td colspan="7" class="no-data">No surgeries found</td></tr>`;
                return;
            }
            
            data.forEach(surgery => {
                const row = document.createElement('tr');
                row.className = getStatusClass(surgery.status);
                
                row.innerHTML = `
                    <td>${surgery.id}</td>
                    <td>${surgery.patient_name}</td>
                    <td>${surgery.doctor_name}</td>
                    <td>${surgery.surgery_type}</td>
                    <td>${formatDate(new Date(surgery.scheduled_date))}</td>
                    <td>
                        <span class="status-badge ${surgery.status}">${formatStatus(surgery.status)}</span>
                    </td>
                    <td>
                        <button class="action-btn view-btn" onclick="viewSurgery(${surgery.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" onclick="editSurgery(${surgery.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn status-btn" onclick="updateSurgeryStatus(${surgery.id})">
                            <i class="fas fa-clock"></i>
                        </button>
                    </td>
                `;
                
                surgeriesTable.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error loading surgeries:', error);
            showToast('Failed to load surgery data', 'error');
        });
}

// Display upcoming surgeries in dashboard
function displayUpcomingSurgeries(surgeries) {
    const container = document.getElementById('upcomingSurgeriesList');
    container.innerHTML = '';
    
    if (surgeries.length === 0) {
        container.innerHTML = '<div class="no-data">No upcoming surgeries</div>';
        return;
    }
    
    surgeries.forEach(surgery => {
        const element = document.createElement('div');
        element.className = 'surgery-item';
        
        const surgeryDate = new Date(surgery.scheduled_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let dateLabel = '';
        if (surgeryDate.toDateString() === today.toDateString()) {
            dateLabel = 'Today';
        } else if (surgeryDate.toDateString() === new Date(today.setDate(today.getDate() + 1)).toDateString()) {
            dateLabel = 'Tomorrow';
        } else {
            dateLabel = formatDate(surgeryDate);
        }
        
        element.innerHTML = `
            <div class="surgery-details">
                <h4>${surgery.surgery_type}</h4>
                <p><i class="fas fa-user"></i> ${surgery.patient_name}</p>
                <p><i class="fas fa-user-md"></i> Dr. ${surgery.doctor_name}</p>
                <p><i class="fas fa-calendar-day"></i> ${dateLabel}</p>
                <p><i class="fas fa-clock"></i> ${surgery.start_time} - ${surgery.end_time}</p>
            </div>
            <div class="surgery-actions">
                <button class="btn btn-sm" onclick="viewSurgery(${surgery.id})">Details</button>
            </div>
        `;
        
        container.appendChild(element);
    });
}

// Display low stock items
function displayLowStockItems(items) {
    const container = document.getElementById('lowStockItemsList');
    container.innerHTML = '';
    
    if (items.length === 0) {
        container.innerHTML = '<div class="no-data">No low stock items</div>';
        return;
    }
    
    items.forEach(item => {
        const element = document.createElement('div');
        element.className = 'supply-item';
        
        // Calculate stock percentage
        const stockPercentage = Math.round((item.quantity / item.max_stock_level) * 100);
        
        element.innerHTML = `
            <div class="supply-details">
                <h4>${item.name}</h4>
                <p><i class="fas fa-box"></i> Current Stock: ${item.quantity} ${item.unit}</p>
                <div class="stock-bar">
                    <div class="stock-level" style="width: ${stockPercentage}%;"></div>
                </div>
                <p class="stock-status">
                    <i class="fas fa-exclamation-triangle"></i> Below minimum stock level (${item.min_stock_level} ${item.unit})
                </p>
            </div>
            <div class="supply-actions">
                <button class="btn btn-sm" onclick="restockSupply(${item.id})">Restock</button>
            </div>
        `;
        
        container.appendChild(element);
    });
}

// Add supply item in surgery form
function addSupplyItem() {
    const suppliesContainer = document.getElementById('surgerySupliesContainer');
    const supplyIndex = document.querySelectorAll('.supply-item').length;
    
    const supplyItem = document.createElement('div');
    supplyItem.className = 'supply-item';
    supplyItem.innerHTML = `
        <div class="form-row">
            <div class="form-group col-md-8">
                <select class="form-control supply-select" id="supply${supplyIndex}" required>
                    <option value="">Select Medical Supply</option>
                </select>
            </div>
            <div class="form-group col-md-3">
                <input type="number" class="form-control supply-quantity" id="quantity${supplyIndex}" placeholder="Qty" min="1" required>
            </div>
            <div class="form-group col-md-1">
                <button type="button" class="btn btn-danger remove-supply" onclick="removeSupplyItem(this)">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    suppliesContainer.appendChild(supplyItem);
    
    // Load supply options for the new select
    loadSupplyOptionsForSelect(document.getElementById(`supply${supplyIndex}`));
}

// Remove supply item from surgery form
window.removeSupplyItem = function(button) {
    const supplyItem = button.closest('.supply-item');
    supplyItem.remove();
};

// Load patient options for surgery form
function loadPatientOptions() {
    fetch('/api/patients')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('surgeryPatient');
            select.innerHTML = '<option value="">Select Patient</option>';
            
            data.forEach(patient => {
                const option = document.createElement('option');
                option.value = patient.id;
                option.textContent = patient.name;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading patient options:', error);
        });
}

// Load doctor options for surgery form
function loadDoctorOptions() {
    fetch('/api/doctors')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('surgeryDoctor');
            select.innerHTML = '<option value="">Select Doctor</option>';
            
            data.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.id;
                option.textContent = `Dr. ${doctor.name} (${doctor.specialty})`;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading doctor options:', error);
        });
}

// Load operating room options for surgery form
function loadOperatingRoomOptions() {
    fetch('/api/operating-rooms')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('surgeryRoom');
            select.innerHTML = '<option value="">Select Operating Room</option>';
            
            data.forEach(room => {
                const option = document.createElement('option');
                option.value = room.id;
                option.textContent = `${room.name} (${room.floor})`;
                select.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading operating room options:', error);
        });
}

// Load supply options
function loadSupplyOptions() {
    document.querySelectorAll('.supply-select').forEach(select => {
        loadSupplyOptionsForSelect(select);
    });
}

// Load supply options for specific select
function loadSupplyOptionsForSelect(select) {
    fetch('/api/medical-supplies')
        .then(response => response.json())
        .then(data => {
            select.innerHTML = '<option value="">Select Medical Supply</option>';
            
            data.forEach(supply => {
                if (supply.quantity > 0) {
                    const option = document.createElement('option');
                    option.value = supply.id;
                    option.textContent = `${supply.name} (${supply.quantity} ${supply.unit} available)`;
                    select.appendChild(option);
                }
            });
        })
        .catch(error => {
            console.error('Error loading supply options:', error);
        });
}

// Format status text
function formatStatus(status) {
    switch (status) {
        case 'scheduled':
            return 'Scheduled';
        case 'in_progress':
            return 'In Progress';
        case 'completed':
            return 'Completed';
        case 'cancelled':
            return 'Cancelled';
        case 'postponed':
            return 'Postponed';
        default:
            return status.charAt(0).toUpperCase() + status.slice(1);
    }
}

// Get status class for row styling
function getStatusClass(status) {
    switch (status) {
        case 'scheduled':
            return 'status-scheduled';
        case 'in_progress':
            return 'status-in-progress';
        case 'completed':
            return 'status-completed';
        case 'cancelled':
            return 'status-cancelled';
        case 'postponed':
            return 'status-postponed';
        default:
            return '';
    }
}

// Format date
function formatDate(date) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <div class="toast-close">
            <i class="fas fa-times"></i>
        </div>
    `;
    
    document.getElementById('toastContainer').appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 5000);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toast.remove();
        }, 300);
    });
}

// Debounce function for search inputs
function debounce(func, delay) {
    let timeoutId;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(context, args);
        }, delay);
    };
}

// View patient details
window.viewPatient = function(patientId) {
    fetch(`/api/patients/${patientId}`)
        .then(response => response.json())
        .then(patient => {
            document.getElementById('viewPatientName').textContent = patient.name;
            document.getElementById('viewPatientGender').textContent = patient.gender || 'Not specified';
            document.getElementById('viewPatientDob').textContent = patient.dob ? formatDate(new Date(patient.dob)) : 'Not specified';
            document.getElementById('viewPatientBloodType').textContent = patient.blood_type || 'Not specified';
            document.getElementById('viewPatientContact').textContent = patient.contact_number || 'Not specified';
            document.getElementById('viewPatientEmail').textContent = patient.email || 'Not specified';
            document.getElementById('viewPatientAddress').textContent = patient.address || 'Not specified';
            document.getElementById('viewPatientMedicalHistory').textContent = patient.medical_history || 'No medical history';
            document.getElementById('viewPatientAllergies').textContent = patient.allergies || 'No known allergies';
            
            // Load patient's surgeries
            loadPatientSurgeries(patientId);
            
            showModal('viewPatientModal');
        })
        .catch(error => {
            console.error('Error loading patient details:', error);
            showToast('Failed to load patient details', 'error');
        });
};

// Load patient's surgeries
function loadPatientSurgeries(patientId) {
    fetch(`/api/patients/${patientId}/surgeries`)
        .then(response => response.json())
        .then(surgeries => {
            const surgeriesContainer = document.getElementById('patientSurgeriesList');
            surgeriesContainer.innerHTML = '';
            
            if (surgeries.length === 0) {
                surgeriesContainer.innerHTML = '<div class="no-data">No surgeries found</div>';
                return;
            }
            
            surgeries.forEach(surgery => {
                const element = document.createElement('div');
                element.className = `surgery-item ${getStatusClass(surgery.status)}`;
                
                element.innerHTML = `
                    <div class="surgery-details">
                        <h4>${surgery.surgery_type}</h4>
                        <p><i class="fas fa-user-md"></i> Dr. ${surgery.doctor_name}</p>
                        <p><i class="fas fa-calendar-day"></i> ${formatDate(new Date(surgery.scheduled_date))}</p>
                        <p><i class="fas fa-clock"></i> ${surgery.start_time} - ${surgery.end_time}</p>
                        <p><i class="fas fa-info-circle"></i> Status: 
                            <span class="status-badge ${surgery.status}">${formatStatus(surgery.status)}</span>
                        </p>
                    </div>
                    <div class="surgery-actions">
                        <button class="btn btn-sm" onclick="viewSurgery(${surgery.id})">Details</button>
                    </div>
                `;
                
                surgeriesContainer.appendChild(element);
            });
        })
        .catch(error => {
            console.error('Error loading patient surgeries:', error);
            document.getElementById('patientSurgeriesList').innerHTML = 
                '<div class="error-message">Failed to load surgeries</div>';
        });
}

// View surgery details
window.viewSurgery = function(surgeryId) {
    fetch(`/api/surgeries/${surgeryId}`)
        .then(response => response.json())
        .then(surgery => {
            document.getElementById('viewSurgeryId').textContent = surgery.id;
            document.getElementById('viewSurgeryType').textContent = surgery.surgery_type;
            document.getElementById('viewSurgeryPatient').textContent = surgery.patient_name;
            document.getElementById('viewSurgeryDoctor').textContent = `Dr. ${surgery.doctor_name}`;
            document.getElementById('viewSurgeryRoom').textContent = surgery.operating_room_name;
            document.getElementById('viewSurgeryDate').textContent = formatDate(new Date(surgery.scheduled_date));
            document.getElementById('viewSurgeryTime').textContent = `${surgery.start_time} - ${surgery.end_time}`;
            document.getElementById('viewSurgeryStatus').textContent = formatStatus(surgery.status);
            document.getElementById('viewSurgeryStatus').className = `status-badge ${surgery.status}`;
            document.getElementById('viewSurgeryNotes').textContent = surgery.notes || 'No notes';
            
            // Display supplies needed
            const suppliesContainer = document.getElementById('viewSurgerySupplies');
            suppliesContainer.innerHTML = '';
            
            if (surgery.supplies && surgery.supplies.length > 0) {
                const suppliesList = document.createElement('ul');
                suppliesList.className = 'supplies-list';
                
                surgery.supplies.forEach(supply => {
                    const item = document.createElement('li');
                    item.textContent = `${supply.name} - ${supply.quantity} ${supply.unit}`;
                    suppliesList.appendChild(item);
                });
                
                suppliesContainer.appendChild(suppliesList);
            } else {
                suppliesContainer.textContent = 'No supplies specified';
            }
            
            showModal('viewSurgeryModal');
        })
        .catch(error => {
            console.error('Error loading surgery details:', error);
            showToast('Failed to load surgery details', 'error');
        });
};

// Update surgery status
window.updateSurgeryStatus = function(surgeryId) {
    fetch(`/api/surgeries/${surgeryId}`)
        .then(response => response.json())
        .then(surgery => {
            document.getElementById('updateStatusId').value = surgeryId;
            document.getElementById('currentStatusDisplay').textContent = formatStatus(surgery.status);
            document.getElementById('currentStatusDisplay').className = `status-badge ${surgery.status}`;
            
            // Set the current status in the select
            document.getElementById('newSurgeryStatus').value = surgery.status;
            
            showModal('updateStatusModal');
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Failed to load surgery details', 'error');
        });
};

// Submit status update
document.getElementById('updateStatusForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const surgeryId = document.getElementById('updateStatusId').value;
    const newStatus = document.getElementById('newSurgeryStatus').value;
    const statusNotes = document.getElementById('statusNotes').value;
    
    fetch(`/api/surgeries/${surgeryId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            status: newStatus,
            notes: statusNotes
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeModal();
            showToast('Surgery status updated successfully');
            
            // Reload surgeries
            loadSurgeries();
            
            // Reload dashboard data if on dashboard
            if (document.getElementById('dashboardContent').classList.contains('active')) {
                fetchDashboardData();
            }
        } else {
            showToast('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('An error occurred. Please try again.', 'error');
    });
});

// Restock supply
window.restockSupply = function(supplyId) {
    fetch(`/api/medical-supplies/${supplyId}`)
        .then(response => response.json())
        .then(supply => {
            document.getElementById('restockSupplyId').value = supplyId;
            document.getElementById('restockSupplyName').textContent = supply.name;
            document.getElementById('currentStock').textContent = `${supply.quantity} ${supply.unit}`;
            document.getElementById('minStockLevel').textContent = `${supply.min_stock_level} ${supply.unit}`;
            document.getElementById('maxStockLevel').textContent = `${supply.max_stock_level} ${supply.unit}`;
            
            // Reset form
            document.getElementById('restockAmount').value = '';
            
            showModal('restockSupplyModal');
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Failed to load supply details', 'error');
        });
};

// Submit restock form
document.getElementById('restockSupplyForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const supplyId = document.getElementById('restockSupplyId').value;
    const amount = parseInt(document.getElementById('restockAmount').value);
    
    fetch(`/api/medical-supplies/${supplyId}/restock`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            amount: amount
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeModal();
            showToast('Supply restocked successfully');
            
            // Reload supplies if on supplies page
            if (document.getElementById('medicalSuppliesContent').classList.contains('active')) {
                loadMedicalSupplies();
            }
            
            // Reload dashboard data if on dashboard
            if (document.getElementById('dashboardContent').classList.contains('active')) {
                fetchDashboardData();
            }
        } else {
            showToast('Error: ' + data.message, 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('An error occurred. Please try again.', 'error');
    });
});