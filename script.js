

document.addEventListener('DOMContentLoaded', function() {

    // --- 1. ELEMENT SELECTORS ---
    // General UI Elements
    const header = document.getElementById('header');
    const burgerMenu = document.getElementById('burgerMenu');
    const navLinks = document.getElementById('navLinks');
    const themeToggle = document.getElementById('themeToggle');
    const backToTop = document.getElementById('backToTop');

    // Authentication & Navigation Elements
    const authModal = document.getElementById('authModal');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const closeBtn = document.querySelector('.close-btn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegister = document.getElementById('showRegister');
    const showLogin = document.getElementById('showLogin');
    const loginFormContainer = document.getElementById('loginFormContainer');
    const registerFormContainer = document.getElementById('registerFormContainer');
    const loginResponse = document.getElementById('loginResponse');
    const registerResponse = document.getElementById('registerResponse');
    const authLinks = document.getElementById('authLinks');
    const userInfo = document.getElementById('userInfo');
    const welcomeMessage = document.getElementById('welcomeMessage');
    const logoutBtn = document.getElementById('logoutBtn');
    const myAppointmentsBtn = document.getElementById('myAppointmentsBtn'); // NEW: "My Appointments" button

    // "My Appointments" Modal Elements
    const myAppointmentsModal = document.getElementById('myAppointmentsModal');
    const appointmentsDisplay = document.getElementById('appointmentsDisplay');

    // Forms
    const appointmentForm = document.getElementById('appointmentForm');
    const appointmentFormResponse = document.getElementById('appointmentFormResponse');
    const newsletterForm = document.getElementById('newsletterForm');



 // NEW FEATURE: Restrict Appointment Booking to Present/Future
    function setMinAppointmentDate() {
        const dateInput = document.getElementById('date');
        if (!dateInput) return;
        
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        
        dateInput.setAttribute('min', `${yyyy}-${mm}-${dd}`);
    }

    // Call the function on page load to set the minimum date
    setMinAppointmentDate(); 



    // --- 2. GENERAL UI LOGIC ---

    if (header) {
        window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 50));
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (['loginBtn', 'registerBtn', 'showLogin', 'showRegister', 'logoutBtn', 'myAppointmentsBtn'].includes(this.id)) return;
            e.preventDefault();
            const targetElement = document.querySelector(this.getAttribute('href'));
            if (targetElement) targetElement.scrollIntoView({ behavior: 'smooth' });
        });
    });

    if (burgerMenu && navLinks) {
        burgerMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            burgerMenu.classList.toggle('active');
        });
    }

    if (themeToggle) {
        const currentTheme = localStorage.getItem('theme');
        if (currentTheme) {
            document.documentElement.setAttribute('data-theme', currentTheme);
        }
        themeToggle.addEventListener('click', () => {
            let theme = document.documentElement.getAttribute('data-theme');
            if (theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            }
        });
    }

    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = document.getElementById(button.dataset.tab);
            document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            if (targetTab) targetTab.classList.add('active');
        });
    });
    
    if (backToTop) {
        window.addEventListener('scroll', () => backToTop.classList.toggle('show', window.scrollY > 300));
        backToTop.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }


    // --- 3. PATIENT AUTHENTICATION LOGIC ---
    const showResponse = (element, message, isSuccess) => {
        if (!element) return;
        element.textContent = message;
        element.className = 'form-response';
        element.classList.add(isSuccess ? 'success' : 'error');
        element.style.display = 'block';
    };

    const openModal = (modal) => modal && (modal.style.display = 'block');
    const closeModal = (modal) => modal && (modal.style.display = 'none');
    
    if (loginBtn) loginBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(authModal); showLoginForm(); });
    if (registerBtn) registerBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(authModal); showRegisterForm(); });
    
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(authModal);
            closeModal(myAppointmentsModal);
        });
    });
    window.addEventListener('click', (e) => {
        if (e.target == authModal) closeModal(authModal);
        if (e.target == myAppointmentsModal) closeModal(myAppointmentsModal);
    });

    const showRegisterForm = () => {
        if (loginFormContainer) loginFormContainer.style.display = 'none';
        if (registerFormContainer) registerFormContainer.style.display = 'block';
    };
    const showLoginForm = () => {
        if (registerFormContainer) registerFormContainer.style.display = 'none';
        if (loginFormContainer) loginFormContainer.style.display = 'block';
    };

    if (showRegister) showRegister.addEventListener('click', (e) => { e.preventDefault(); showRegisterForm(); });
    if (showLogin) showLogin.addEventListener('click', (e) => { e.preventDefault(); showLoginForm(); });

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const phone = document.getElementById('registerPhone').value;
            const password = document.getElementById('registerPassword').value;

            if (!email && !phone) {
                showResponse(registerResponse, 'Please provide an email or a phone number.', false);
                return;
            }
            const payload = { fullName, password };
            if (email) payload.email = email;
            if (phone) payload.phone = phone;

            try {
                const res = await fetch('/api/patients/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                if (res.ok) {
                    showResponse(registerResponse, data.message, true);
                    registerForm.reset();
                } else {
                    showResponse(registerResponse, data.message, false);
                }
            } catch (err) {
                showResponse(registerResponse, 'Could not connect to the server.', false);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const loginIdentifier = document.getElementById('loginIdentifier').value;
            const password = document.getElementById('loginPassword').value;
            try {
                const res = await fetch('/api/patients/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ loginIdentifier, password })
                });
                const data = await res.json();
                if (res.ok) {
                    localStorage.setItem('token', data.token);
                    showResponse(loginResponse, 'Login successful!', true);
                    setTimeout(() => {
                        loginForm.reset();
                        loginResponse.style.display = 'none';
                        closeModal(authModal);
                        checkLoginStatus();
                    }, 1000);
                } else {
                    showResponse(loginResponse, data.message, false);
                }
            } catch (err) {
                showResponse(loginResponse, 'Could not connect to the server.', false);
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            checkLoginStatus();
        });
    }

    const checkLoginStatus = () => {
        const token = localStorage.getItem('token');
        if (token) {
            if (authLinks) authLinks.style.display = 'none';
            if (userInfo) userInfo.style.display = 'flex';
            if (welcomeMessage) welcomeMessage.textContent = 'Welcome!';
        } else {
            if (authLinks) authLinks.style.display = 'flex';
            if (userInfo) userInfo.style.display = 'none';
        }
    };


    // --- 4. "MY APPOINTMENTS" FEATURE ---

    async function fetchMyAppointments() {
        const token = localStorage.getItem('token');
        if (!token) {
            appointmentsDisplay.innerHTML = '<p class="form-response error">You must be logged in to see your appointments.</p>';
            return;
        }

        appointmentsDisplay.innerHTML = '<p>Loading your appointments...</p>';

        try {
            const response = await fetch('/api/patients/my-appointments', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const appointments = await response.json();

            if (response.ok) {
                if (appointments.length === 0) {
                    appointmentsDisplay.innerHTML = '<p>You have no appointments scheduled.</p>';
                } else {
                    appointmentsDisplay.innerHTML = '';
                    appointments.forEach(appt => {
                        const apptDiv = document.createElement('div');
                        apptDiv.className = 'patient-appointment-item';
                        const apptDate = new Date(appt.date).toLocaleDateString();
                        const doctorNotesHTML = appt.doctor_notes ? `<p class="notes"><strong>Doctor's Note:</strong> ${appt.doctor_notes}</p>` : '';
                        const descriptionButtonHTML = appt.medical_description
                            ? `<button class="btn-action view-note" data-description="${encodeURIComponent(appt.medical_description)}">View Medical Note</button>`
                            : '';


                        apptDiv.innerHTML = `
                            <p><strong>Date:</strong> ${apptDate} at ${appt.time}</p>
                            <p><strong>Status:</strong> <span class="status-badge ${appt.status.toLowerCase()}">${appt.status}</span></p>
                            ${doctorNotesHTML}
                            ${descriptionButtonHTML} 
                        `;
                        appointmentsDisplay.appendChild(apptDiv);
                    });
                }
            } else {
                appointmentsDisplay.innerHTML = '<p class="form-response error">Failed to load appointments.</p>';
            }
        } catch (error) {
            appointmentsDisplay.innerHTML = '<p class="form-response error">Error connecting to the server.</p>';
        }
    }

    if (myAppointmentsBtn) {
        myAppointmentsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal(myAppointmentsModal);
            fetchMyAppointments();
        });
    }

 appointmentsDisplay.addEventListener('click', (e) => {
    // This part handles the "View Medical Note" button click
    if (e.target.classList.contains('view-note')) {
        const description = decodeURIComponent(e.target.dataset.description);
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <title>Medical Note</title>
                <style>
                    /* Basic page setup */
                    body {
                        margin: 0;
                        font-family: sans-serif;
                    }
                    /* Container to hold your template image and the text on top */
                    .note-container {
                        position: relative;
                        width: 8.5in; /* Standard paper width */
                        height: 11in; /* Standard paper height */
                        margin: auto; /* Center on screen */
                    }
                    /* Your template image, which acts as the base layer */
                    .note-background {
                        width: 100%;
                        height: 100%;
                        position: absolute;
                        top: 0;
                        left: 0;
                    }
                    /* Styling for the text that goes on TOP of your image */
                    .doctor-description, .doctor-signature {
                        position: absolute;
                        white-space: pre-wrap; /* Allows text to wrap and respects line breaks */
                        font-size: 12pt;
                        line-height: 1.6;
                        color: #1a1a1a; /* Dark text for readability */
                    }
                    /* --- YOU NEED TO ADJUST THESE VALUES --- */
                    .doctor-description {
                        top: 350px;     /* Pixels from the top of the page */
                        left: 100px;    /* Pixels from the left of the page */
                        width: 600px;   /* The width of the text box */
                        height: 400px;  /* The height of the text box */
                    }
                    .doctor-signature {
                        position: absolute;
                        bottom: 110px;  /* Pixels from the BOTTOM of the page */
                        right: 80px;   /* Pixels from the RIGHT of the page */
                        width: 150px;   /* Width of your signature image */
                    }
                          .note-footer { position: absolute; bottom: 110px; right: 80px; width: 200px; text-align: center; }
                    .note-footer img { width: 150px; }
                    .note-footer p { 
                        margin: 5px 0 0 0; 
                        font-weight: bold;}

                </style>
            </head>
            <body>
                <div class="note-container">
                    <img src="/asstes/medical-note-background.png" alt="Medical Note" class="note-background">

                    <div class="doctor-description">
                        ${description}
                    </div>
                    <p>Dr. Anugonda Srinivasa Chari</p>
                    <img src="/asstes/doctore-signature.png" alt="Doctor's Signature" class="doctor-signature">
                </div>
                <script>
                    // Automatically trigger the print dialog
                    window.onload = () => {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
});

    // --- 5. SECURED APPOINTMENT & OTHER FORMS ---
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('token');
            if (!token) {
                showResponse(appointmentFormResponse, 'You must be logged in to book an appointment.', false);
                setTimeout(() => openModal(authModal), 1500);
                return;
            }
            const submitBtn = appointmentForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            const formData = {
                date: e.target.elements.date.value,
                time: e.target.elements.time.value,
                message: e.target.elements.message.value
            };
            try {
                const res = await fetch('/api/book-appointment', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(formData)
                });
                const data = await res.json();
                if (res.ok) {
                    showResponse(appointmentFormResponse, data.message, true);
                    appointmentForm.reset();
                } else if (res.status === 401) {
                    showResponse(appointmentFormResponse, 'Your session expired. Please log in again.', false);
                    localStorage.removeItem('token');
                    checkLoginStatus();
                    setTimeout(() => openModal(authModal), 2000);
                } else {
                    showResponse(appointmentFormResponse, data.message, false);
                }
            } catch (err) {
                showResponse(appointmentFormResponse, 'Could not connect to server.', false);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // ... (newsletter logic is unchanged)
        });
    }
    

    // --- 6. INITIALIZE PAGE ---
    window.addEventListener('load', () => {
        const preloader = document.querySelector('.preloader');
        if (preloader) {
            setTimeout(() => preloader.classList.add('hide'), 500);
        }
    });

    checkLoginStatus();
});