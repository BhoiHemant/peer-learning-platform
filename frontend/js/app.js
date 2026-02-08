/* ===================================
   Peer Learning Platform - JavaScript
   Backend API: http://localhost:5000
   =================================== */

// Global Variables
const API_BASE_URL = 'http://localhost:5001/api';
let currentUser = null;

// ===================================
  // Utility Functions
   //=================================== */

// Show loading spinner
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.remove('hidden');
    }
}

// Hide loading spinner
function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('hidden');
    }
}

// Show message
function showMessage(message, type = 'success') {
    const messageElement = document.getElementById('message');
    if (messageElement) {
        messageElement.textContent = message;
        messageElement.className = `message ${type}`;
        messageElement.classList.remove('hidden');
        
        // Hide message after 5 seconds
        setTimeout(() => {
            messageElement.classList.add('hidden');
        }, 5000);
    }
}

// Clear error messages
function clearErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.textContent = '';
    });
}

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('token') !== null;
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Update UI with current user
function updateUserUI() {
    const user = getCurrentUser();
    const userNameElements = document.querySelectorAll('#userName');
    
    userNameElements.forEach(element => {
        element.textContent = user ? user.name : 'User';
    });
}

// ===================================
   // Authentication Functions
  // =================================== */

// Login function
async function login(email, password) {
    try {
        showLoading('loadingSpinner');
        clearErrors();
        
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showMessage('Login successful! Redirecting to dashboard...', 'success');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            showMessage(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        hideLoading('loadingSpinner');
    }
}

// Signup function
async function signup(name, email, password) {
    try {
        showLoading('loadingSpinner');
        clearErrors();
        
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Account created successfully! Please login.', 'success');
            
            // Redirect to login page
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showMessage(data.message || 'Signup failed', 'error');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        hideLoading('loadingSpinner');
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// ===================================
   /*Notes Functions*/
   /*=================================== */

// Load notes from backend
async function loadNotes() {
    showLoading('loadingNotes');
    
    try {
        const data = await safeAPICall(`${API_BASE_URL}/notes`);
        displayNotes(data);
    } catch (error) {
        console.error('Load notes error:', error);
    } finally {
        hideLoading('loadingNotes');
    }
}

// Display notes in the grid
function displayNotes(notes) {
    const notesList = document.getElementById('notesList');
    const noNotes = document.getElementById('noNotes');
    
    if (notes.length === 0) {
        notesList.innerHTML = '';
        noNotes.classList.remove('hidden');
        return;
    }
    
    noNotes.classList.add('hidden');
    
    notesList.innerHTML = notes.map(note => {
        return `
            <div class="note-card">
            <h3>${note.title}</h3>
            <p class="note-subject">${note.subject}</p>
            <p class="note-description">${note.description || 'No description available'}</p>
            <div class="note-meta">
                <span class="note-author">By: ${note.author}</span>
                <span class="note-date">${new Date(note.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="note-actions">
                <button onclick="downloadNote('${note._id}')" class="btn btn-small btn-primary">Download</button>
                <button onclick="viewNoteDetails('${note._id}')" class="btn btn-small btn-secondary">View Details</button>
            </div>
        </div>`;
    }).join('');
}

// Upload note function
async function uploadNote(formData) {
    try {
        const data = await safeAPICall(`${API_BASE_URL}/notes`, {
            method: 'POST',
            body: formData
        });
        
        if (data) {
            showMessage('Note uploaded successfully!', 'success');
            hideUploadForm();
            loadNotes(); // Reload notes list
        }
    } catch (error) {
        console.error('Upload note error:', error);
        showMessage(error.message || 'Upload failed', 'error');
    }
}

// ===================================
  //  Playlists Functions
  // =================================== */

// Load playlists from backend
async function loadPlaylists() {
    showLoading('loadingPlaylists');
    
    try {
        const data = await safeAPICall(`${API_BASE_URL}/playlists`);
        displayPlaylists(data);
    } catch (error) {
        console.error('Load playlists error:', error);
    } finally {
        hideLoading('loadingPlaylists');
    }
}

// Display playlists in the grid
function displayPlaylists(playlists) {
    const playlistsList = document.getElementById('playlistsList');
    const noPlaylists = document.getElementById('noPlaylists');
    
    if (playlists.length === 0) {
        playlistsList.innerHTML = '';
        noPlaylists.classList.remove('hidden');
        return;
    }
    
    noPlaylists.classList.add('hidden');
    
    playlistsList.innerHTML = playlists.map(playlist => {
        return `
        <div class="playlist-card">
            <div class="playlist-thumbnail">
                <img src="${playlist.thumbnail || 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg'}" alt="Playlist thumbnail">
                <div class="playlist-duration">${playlist.videos || 0} videos</div>
            </div>
            <div class="playlist-info">
                <h3>${playlist.title}</h3>
                <p class="playlist-category">${playlist.category}</p>
                <p class="playlist-description">${playlist.description || 'No description available'}</p>
                <div class="playlist-meta">
                    <span class="playlist-views">${playlist.views || 0} views</span>
                    <span class="playlist-rating">⭐ ${playlist.rating || 0}</span>
                </div>
                <div class="playlist-actions">
                    <a href="${playlist.url}" target="_blank" class="btn btn-small btn-primary">Watch on YouTube</a>
                    <button onclick="savePlaylist('${playlist._id}')" class="btn btn-small btn-secondary">Save</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ===================================
   //Doubts Functions
  // =================================== */

// Load doubts from backend
async function loadDoubts() {
    showLoading('loadingDoubts');
    
    try {
        const data = await safeAPICall(`${API_BASE_URL}/doubts`);
        displayDoubts(data.data || []);
    } catch (error) {
        console.error('Load doubts error:', error);
        // Show empty state on error
        const doubtsList = document.getElementById('doubtsList');
        const noDoubts = document.getElementById('noDoubts');
        if (doubtsList && noDoubts) {
            doubtsList.innerHTML = '';
            noDoubts.classList.remove('hidden');
        }
    } finally {
        hideLoading('loadingDoubts');
    }
}

// Display doubts in the list
function displayDoubts(doubts) {
    const doubtsList = document.getElementById('doubtsList');
    const noDoubts = document.getElementById('noDoubts');
    
    if (!doubtsList || !noDoubts) return;
    
    if (doubts.length === 0) {
        doubtsList.innerHTML = '';
        noDoubts.classList.remove('hidden');
        return;
    }
    
    noDoubts.classList.add('hidden');
    
    doubtsList.innerHTML = doubts.map(doubt => {
        const author = doubt.author || { name: 'Anonymous' };
        return `
        <div class="doubt-card" onclick="viewDoubt('${doubt._id}')">
            <div class="doubt-header">
                <h3>${doubt.title}</h3>
                <div class="doubt-meta">
                    <span class="doubt-category">${doubt.category}</span>
                    <span class="doubt-status ${doubt.isAnswered ? 'answered' : ''}">${doubt.isAnswered ? '✓ Answered' : 'Open'}</span>
                </div>
            </div>
            <div class="doubt-content">
                <p>${doubt.details}</p>
                <div class="doubt-tags">
                    ${(doubt.tags || []).map(tag => `<span class="tag">#${tag}</span>`).join('')}
                </div>
            </div>
            <div class="doubt-footer">
                <div class="doubt-info">
                    <span>Asked by: ${author.name}</span>
                    <span>${timeAgo(new Date(doubt.createdAt))}</span>
                </div>
                <div class="doubt-stats">
                    <span>👁 ${doubt.views || 0}</span>
                    <span>💬 ${doubt.answerCount || doubt.answers?.length || 0}</span>
                    <span>👍 ${doubt.voteScore || doubt.upvotes?.length || 0}</span>
                </div>
            </div>
        </div>`;
    }).join('');
}

// Post question function
async function postQuestion(questionData) {
    try {
        const data = await safeAPICall(`${API_BASE_URL}/doubts`, {
            method: 'POST',
            body: JSON.stringify(questionData)
        });
        
        if (data) {
            showMessage('Question posted successfully!', 'success');
            document.getElementById('questionForm').reset();
            loadDoubts(); // Reload doubts list
        }
    } catch (error) {
        console.error('Post question error:', error);
        showMessage(error.message || 'Failed to post question', 'error');
    }
}

// ===================================
 //  Profile Functions
   // =================================== */

// Load user profile
async function loadProfile() {
    try {
        const user = getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        // Update profile UI
        document.getElementById('profileName').textContent = user.name;
        document.getElementById('profileEmail').textContent = user.email;
        document.getElementById('profileBio').textContent = user.bio || 'No bio available';
        
        // Load user stats
        const data = await safeAPICall(`${API_BASE_URL}/users/stats`);
        updateStats(data);
    } catch (error) {
        console.error('Load profile error:', error);
    }
}

// Update statistics display
function updateStats(stats) {
    const elements = {
        notesUploaded: document.getElementById('notesUploaded'),
        playlistsShared: document.getElementById('playlistsShared'),
        doubtsAnswered: document.getElementById('doubtsAnswered'),
        reputation: document.getElementById('reputation')
    };
    
    Object.keys(elements).forEach(key => {
        if (elements[key] && stats[key] !== undefined) {
            elements[key].textContent = stats[key];
        }
    });
}

// ===================================
 //  UI Helper Functions
  // =================================== */

// Show/hide upload form
function showUploadForm() {
    document.getElementById('uploadForm').classList.remove('hidden');
}

function hideUploadForm() {
    document.getElementById('uploadForm').classList.add('hidden');
}

// Show/hide add playlist form
function showAddPlaylistForm() {
    document.getElementById('addPlaylistForm').classList.remove('hidden');
}

function hideAddPlaylistForm() {
    document.getElementById('addPlaylistForm').classList.add('hidden');
}

// Tab switching
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked button
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// Modal functions
function editProfile() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('editName').value = user.name;
        document.getElementById('editEmail').value = user.email;
        document.getElementById('editBio').value = user.bio || '';
        document.getElementById('editProfileModal').classList.remove('hidden');
    }
}

function closeEditModal() {
    document.getElementById('editProfileModal').classList.add('hidden');
}

function changeAvatar() {
    // TODO: Implement avatar upload
    showMessage('Avatar upload coming soon!', 'success');
}

// Time ago function
function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' years ago';
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' months ago';
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' days ago';
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' hours ago';
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' minutes ago';
    
    return 'just now';
}

// ===================================
//  Navigation & Page Connection
//  =================================== */

// Check if user is logged in and redirect if needed
function checkAuthAndRedirect() {
    const currentPage = window.location.pathname.split('/').pop();
    const publicPages = ['index.html', 'login.html', 'signup.html'];
    const isPublicPage = publicPages.includes(currentPage);
    
    // If user is not logged in and trying to access protected page
    if (!isLoggedIn() && !isPublicPage) {
        window.location.href = 'login.html';
        return false;
    }
    
    // If user is logged in and trying to access auth pages
    if (isLoggedIn() && isPublicPage) {
        window.location.href = 'dashboard.html';
        return false;
    }
    
    return true;
}

// Enhanced navigation with active state
function updateNavigation() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        // Check if this link matches current page
        const href = link.getAttribute('href');
        if (href === currentPage || href.includes(currentPage)) {
            link.classList.add('active');
        }
    });
}

// Smooth page transition
function navigateToPage(page) {
    // Add loading state
    document.body.style.opacity = '0.5';
    
    setTimeout(() => {
        window.location.href = page;
    }, 200);
}

// Check if element exists before manipulating
function safeElementQuery(selector) {
    return document.querySelector(selector);
}

// Enhanced error handling for API calls
async function safeAPICall(url, options = {}) {
    try {
        const token = localStorage.getItem('token');
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        };
        
        const response = await fetch(url, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        showMessage(error.message || 'Network error. Please try again.', 'error');
        throw error;
    }
}

// ===================================
//  Event Listeners
//  =================================== */

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and redirect if needed
    if (!checkAuthAndRedirect()) {
        return; // Stop execution if redirected
    }
    
    // Update user UI on all pages
    updateUserUI();
    
    // Update navigation active state
    updateNavigation();
    
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            login(email, password);
        });
    }
    
    // Signup form handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            signup(name, email, password);
        });
    }
    
    // Note upload form handler
    const noteUploadForm = document.getElementById('noteUploadForm');
    if (noteUploadForm) {
        noteUploadForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData();
            formData.append('title', document.getElementById('noteTitle').value);
            formData.append('subject', document.getElementById('noteSubject').value);
            formData.append('description', document.getElementById('noteDescription').value);
            formData.append('file', document.getElementById('noteFile').files[0]);
            
            uploadNote(formData);
        });
    }
    
    // Question form handler
    const questionForm = document.getElementById('questionForm');
    if (questionForm) {
        questionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const questionData = {
                title: document.getElementById('questionTitle').value,
                category: document.getElementById('questionCategory').value,
                details: document.getElementById('questionDetails').value,
                tags: document.getElementById('questionTags').value
            };
            
            postQuestion(questionData);
        });
    }
    
    // Edit profile form handler
    const editProfileForm = document.getElementById('editProfileForm');
    if (editProfileForm) {
        editProfileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // TODO: Implement profile update
            showMessage('Profile update coming soon!', 'success');
            closeEditModal();
        });
    }
    
    // Load data based on current page
    const currentPath = window.location.pathname;
    
    // Only load data if navigation exists (protected pages)
    if (document.querySelector('.navbar')) {
        if (currentPath.includes('notes.html')) {
            loadNotes();
        } else if (currentPath.includes('playlists.html')) {
            loadPlaylists();
        } else if (currentPath.includes('doubts.html')) {
            loadDoubts();
        } else if (currentPath.includes('doubt-details.html')) {
            // Handled by page-specific script
        } else if (currentPath.includes('profile.html')) {
            loadProfile();
        } else if (currentPath.includes('dashboard.html')) {
            loadDashboardData();
        }
    }
});

// Search functions (placeholder implementations)
function searchNotes() {
    const searchTerm = document.getElementById('searchInput').value;
    console.log('Searching notes:', searchTerm);
    // TODO: Implement search functionality
}

function searchPlaylists() {
    const searchTerm = document.getElementById('searchInput').value;
    console.log('Searching playlists:', searchTerm);
    // TODO: Implement search functionality
}

function searchDoubts() {
    const searchTerm = document.getElementById('searchInput').value;
    const category = document.getElementById('categoryFilter').value;
    
    let url = `${API_BASE_URL}/doubts?`;
    const params = [];
    
    if (searchTerm) params.push(`search=${encodeURIComponent(searchTerm)}`);
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    
    url += params.join('&');
    
    showLoading('loadingDoubts');
    
    safeAPICall(url)
        .then(data => {
            displayDoubts(data.data || []);
        })
        .catch(error => {
            console.error('Search doubts error:', error);
        })
        .finally(() => {
            hideLoading('loadingDoubts');
        });
}

// Filter functions (placeholder implementations)
function filterNotes() {
    const subject = document.getElementById('subjectFilter').value;
    console.log('Filtering notes by subject:', subject);
    // TODO: Implement filter functionality
}

function filterPlaylists() {
    const category = document.getElementById('categoryFilter').value;
    console.log('Filtering playlists by category:', category);
    // TODO: Implement filter functionality
}

function filterDoubts() {
    searchDoubts(); // Reuse search function with category filter
}

// View doubt details
function viewDoubt(doubtId) {
    // Store current scroll position
    sessionStorage.setItem('scrollPosition', window.scrollY);
    // Navigate to doubt details page (we'll create this)
    window.location.href = `doubt-details.html?id=${doubtId}`;
}

// Load doubt details
async function loadDoubtDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const doubtId = urlParams.get('id');
    
    if (!doubtId) {
        showMessage('Doubt ID not found', 'error');
        return;
    }
    
    showLoading('loadingDoubt');
    
    try {
        const data = await safeAPICall(`${API_BASE_URL}/doubts/${doubtId}`);
        displayDoubtDetails(data.data);
    } catch (error) {
        console.error('Load doubt details error:', error);
        showMessage('Failed to load doubt details', 'error');
    } finally {
        hideLoading('loadingDoubt');
    }
}

// Display doubt details
function displayDoubtDetails(doubt) {
    const container = document.getElementById('doubtDetails');
    if (!container) return;
    
    const author = doubt.author || { name: 'Anonymous' };
    
    container.innerHTML = `
        <div class="doubt-detail-card">
            <div class="doubt-header">
                <h1>${doubt.title}</h1>
                <div class="doubt-meta">
                    <span class="doubt-category">${doubt.category}</span>
                    <span class="doubt-status ${doubt.isAnswered ? 'answered' : ''}">${doubt.isAnswered ? '✓ Answered' : 'Open'}</span>
                </div>
            </div>
            
            <div class="doubt-content">
                <p>${doubt.details}</p>
                <div class="doubt-tags">
                    ${(doubt.tags || []).map(tag => `<span class="tag">#${tag}</span>`).join('')}
                </div>
            </div>
            
            <div class="doubt-actions">
                <button onclick="voteOnDoubt('${doubt._id}', 'upvote')" class="btn btn-secondary">
                    👍 Upvote (${doubt.upvotes?.length || 0})
                </button>
                <button onclick="voteOnDoubt('${doubt._id}', 'downvote')" class="btn btn-secondary">
                    👎 Downvote (${doubt.downvotes?.length || 0})
                </button>
            </div>
            
            <div class="doubt-footer">
                <div class="doubt-info">
                    <span>Asked by: ${author.name}</span>
                    <span>${timeAgo(new Date(doubt.createdAt))}</span>
                </div>
                <div class="doubt-stats">
                    <span>👁 ${doubt.views || 0} views</span>
                    <span>💬 ${doubt.answers?.length || 0} answers</span>
                </div>
            </div>
        </div>
        
        <div class="answers-section">
            <h2>Answers (${doubt.answers?.length || 0})</h2>
            
            <div class="answer-form">
                <h3>Your Answer</h3>
                <textarea id="answerContent" placeholder="Write your answer..." rows="4"></textarea>
                <button onclick="postAnswer('${doubt._id}')" class="btn btn-primary">Post Answer</button>
            </div>
            
            <div id="answersList" class="answers-list">
                ${displayAnswers(doubt.answers || [])}
            </div>
        </div>
    `;
}

// Display answers
function displayAnswers(answers) {
    if (answers.length === 0) {
        return '<p class="no-answers">No answers yet. Be the first to answer!</p>';
    }
    
    return answers.map(answer => {
        const author = answer.author || { name: 'Anonymous' };
        return `
        <div class="answer-card">
            <div class="answer-content">
                <p>${answer.content}</p>
            </div>
            <div class="answer-actions">
                <button onclick="voteOnAnswer('${answer._id}', 'upvote')" class="btn btn-small btn-secondary">
                    👍 ${answer.upvotes?.length || 0}
                </button>
                <button onclick="voteOnAnswer('${answer._id}', 'downvote')" class="btn btn-small btn-secondary">
                    👎 ${answer.downvotes?.length || 0}
                </button>
            </div>
            <div class="answer-footer">
                <div class="answer-info">
                    <span>Answered by: ${author.name}</span>
                    <span>${timeAgo(new Date(answer.createdAt))}</span>
                </div>
            </div>
        </div>`;
    }).join('');
}

// Vote on doubt
async function voteOnDoubt(doubtId, voteType) {
    if (!isLoggedIn()) {
        showMessage('Please login to vote', 'error');
        return;
    }
    
    try {
        const data = await safeAPICall(`${API_BASE_URL}/doubts/${doubtId}/vote`, {
            method: 'POST',
            body: JSON.stringify({ voteType })
        });
        
        if (data) {
            displayDoubtDetails(data.data);
            showMessage('Vote recorded!', 'success');
        }
    } catch (error) {
        console.error('Vote error:', error);
    }
}

// Post answer
async function postAnswer(doubtId) {
    if (!isLoggedIn()) {
        showMessage('Please login to post an answer', 'error');
        return;
    }
    
    const content = document.getElementById('answerContent').value.trim();
    if (!content) {
        showMessage('Please write an answer', 'error');
        return;
    }
    
    try {
        const data = await safeAPICall(`${API_BASE_URL}/doubts/${doubtId}/answers`, {
            method: 'POST',
            body: JSON.stringify({ content })
        });
        
        if (data) {
            document.getElementById('answerContent').value = '';
            displayDoubtDetails(data.data);
            showMessage('Answer posted successfully!', 'success');
        }
    } catch (error) {
        console.error('Post answer error:', error);
    }
}

// Load dashboard data
async function loadDashboardData() {
    try {
        const data = await safeAPICall(`${API_BASE_URL}/users/dashboard`);
        updateDashboardUI(data);
    } catch (error) {
        console.error('Load dashboard error:', error);
    }
}

// Update dashboard UI
function updateDashboardUI(data) {
    // Update stats
    const statsElements = {
        notesCount: document.getElementById('notesCount'),
        doubtsCount: document.getElementById('doubtsCount'),
        playlistsCount: document.getElementById('playlistsCount'),
        answersCount: document.getElementById('answersCount')
    };
    
    Object.keys(statsElements).forEach(key => {
        if (statsElements[key] && data.stats[key] !== undefined) {
            statsElements[key].textContent = data.stats[key];
        }
    });
    
    // Update activity list
    if (data.activity && data.activity.length > 0) {
        const activityList = document.getElementById('activityList');
        activityList.innerHTML = data.activity.map(item => {
            return `
            <div class="activity-item">
                <span class="activity-icon">${getActivityIcon(item.type)}</span>
                <div class="activity-content">
                    <p class="activity-text">${item.description}</p>
                    <span class="activity-time">${timeAgo(new Date(item.createdAt))}</span>
                </div>
            </div>`;
        }).join('');
    }
}

// Get activity icon
function getActivityIcon(type) {
    const icons = {
        'note': '📚',
        'playlist': '🎥',
        'doubt': '💬',
        'answer': '✅'
    };
    return icons[type] || '📝';
}

// Placeholder functions for note actions
function downloadNote(noteId) {
    console.log('Downloading note:', noteId);
    // TODO: Implement download functionality
    showMessage('Download functionality coming soon!', 'success');
}

function viewNoteDetails(noteId) {
    console.log('Viewing note details:', noteId);
    // TODO: Implement view details functionality
    showMessage('Note details coming soon!', 'success');
}

function savePlaylist(playlistId) {
    console.log('Saving playlist:', playlistId);
    // TODO: Implement save functionality
    showMessage('Save functionality coming soon!', 'success');
}
