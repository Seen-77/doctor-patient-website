// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {





    // Header scroll effect
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // Navigation scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            
            // Special handling for doctor login
            if (this.getAttribute('id') === 'doctorLoginLink') {
                document.querySelectorAll('section').forEach(section => {
                    section.style.display = 'none';
                });
                const doctorAuth = document.getElementById('doctorAuth');
                if (doctorAuth) {
                    doctorAuth.style.display = 'block';
                }
                return;
            }
            
            // For all other navigation
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                document.querySelectorAll('section').forEach(section => {
                    if (section.id === 'doctorAuth' || section.id === 'doctorConsole') {
                        section.style.display = 'none';
                    } else {
                        section.style.display = 'block';
                    }
                });
                targetSection.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Mobile navigation toggle
    const burgerMenu = document.getElementById('burgerMenu');
    const navLinks = document.getElementById('navLinks');
    if (burgerMenu && navLinks) {
        burgerMenu.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            burgerMenu.classList.toggle('active');
        });

        // Close nav when a link is clicked
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                navLinks.classList.remove('active');
                burgerMenu.classList.remove('active');
            });
        });
    }

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
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

    // Removed: Custom cursor
    // const cursor = document.querySelector('.cursor');
    // const cursorFollower = document.querySelector('.cursor-follower');
    // if (cursor && cursorFollower) { \n    //     document.addEventListener('mousemove', (e) => { ... });
    //     document.querySelectorAll('a, button, .cursor-pointer').forEach(el => { ... });
    // }\n
    // Expertise tabs functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });

    // Testimonial slider
    const testimonialSlider = document.querySelector('.testimonial-slider');
    if (testimonialSlider) {
        new Swiper(testimonialSlider, {
            slidesPerView: 1,
            spaceBetween: 30,
            loop: true,
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            autoplay: {
                delay: 5000,
                disableOnInteraction: false,
            },
            breakpoints: {
                768: {
                    slidesPerView: 2,
                },
                1024: {
                    slidesPerView: 3,
                },
            },
        });
    }

    // FAQ Accordion
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const currentContent = header.nextElementSibling;
            const currentIcon = header.querySelector('.accordion-icon');

            // Close other open items
            accordionHeaders.forEach(otherHeader => {
                if (otherHeader !== header && otherHeader.classList.contains('active')) {
                    otherHeader.classList.remove('active');
                    otherHeader.nextElementSibling.style.maxHeight = null;
                    otherHeader.querySelector('.accordion-icon').classList.remove('active');
                }
            });

            // Toggle current item
            header.classList.toggle('active');
            currentIcon.classList.toggle('active');

            if (currentContent.style.maxHeight) {
                currentContent.style.maxHeight = null;
            } else {
                currentContent.style.maxHeight = currentContent.scrollHeight + 'px';
            }
        });
    });

    // Removed: Stat counter animation
    // function initCounterUp() { ... }\n    // initCounterUp();\n
    // Back to top button
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.classList.add('show');
            } else {
                backToTop.classList.remove('show');
            }
        });

        backToTop.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    // Appointment form submission
    const appointmentForm = document.getElementById('appointmentForm');
    const appointmentFormResponse = document.getElementById('appointmentFormResponse');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formElements = e.target.elements;
            const submitBtn = appointmentForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;

            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            appointmentFormResponse.classList.remove('success', 'error');
            appointmentFormResponse.style.display = 'none';

            const formData = {
                fullName: formElements.fullName.value,
                email: formElements.email.value,
                phone: formElements.phone.value,
                date: formElements.date.value,
                time: formElements.time.value,
                message: formElements.message.value
            };

            try {
                const response = await fetch('http://localhost:3000/api/book-appointment', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                appointmentForm.reset();

                if (response.ok) {
                    appointmentFormResponse.classList.add('success');
                    appointmentFormResponse.innerHTML = `
                        <div class="icon-text">
                            <i class="fas fa-check-circle"></i>
                            <h3>Appointment Confirmed!</h3>
                            <p>${data.message}</p>
                        </div>
                    `;
                    appointmentFormResponse.style.display = 'block';
                } else {
                    appointmentFormResponse.classList.add('error');
                    appointmentFormResponse.innerHTML = `
                        <div class="icon-text">
                            <i class="fas fa-times-circle"></i>
                            <h3>Booking Failed!</h3>
                            <p>${data.message || 'Something went wrong.'}</p>
                        </div>
                    `;
                    appointmentFormResponse.style.display = 'block';
                }
            } catch (error) {
                console.error('Appointment booking error:', error);
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                appointmentFormResponse.classList.add('error');
                appointmentFormResponse.innerHTML = `
                    <div class="icon-text">
                        <i class="fas fa-times-circle"></i>
                        <h3>Booking Failed!</h3>
                        <p>Could not connect to the server. Please try again later.</p>
                    </div>
                `;
                appointmentFormResponse.style.display = 'block';
            }
        });
    }



    // Newsletter form submission
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            const submitBtn = newsletterForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Subscribing...';
            
            setTimeout(() => {
                emailInput.value = '';
                submitBtn.textContent = 'Subscribed!';
                
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }, 2000);
            }, 1500);
        });
    }

    // Preloader hide functionality
    window.addEventListener('load', () => {
        const preloader = document.querySelector('.preloader');
        if (preloader) {
            setTimeout(() => {
                preloader.classList.add('hide');
            }, 500); // Still keep a small delay to ensure everything loads
        }
    });
}); // End of DOMContentLoaded

// --- NEW: Doctor Login & Console Logic --- Add after the existing code
const doctorLoginLink = document.getElementById('doctorLoginLink');
const doctorAuthSection = document.getElementById('doctorAuth');
const doctorConsoleSection = document.getElementById('doctorConsole');
const doctorLoginForm = document.getElementById('doctorLoginForm');
const doctorLoginResponse = document.getElementById('doctorLoginResponse');
const appointmentsList = document.getElementById('appointmentsList');
const logoutBtn = document.getElementById('logoutBtn');

let isAuthenticated = false; // Simple flag for demo

// Function to show/hide sections
function showSection(sectionId) {
    // For doctor-related sections, hide all other sections
    if (sectionId === 'doctorAuth' || sectionId === 'doctorConsole') {
        document.querySelectorAll('section').forEach(section => {
            section.style.display = 'none';
        });
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.style.display = 'block';
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
    } else {
        // For regular sections, hide only doctor-related sections
        document.querySelectorAll('section').forEach(section => {
            if (section.id === 'doctorAuth' || section.id === 'doctorConsole') {
                section.style.display = 'none';
            } else {
                section.style.display = 'block';
            }
        });
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Initially hide login/console and show home
showSection('hero');

// Handle Doctor Login Link Click
if (doctorLoginLink) {
    doctorLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (isAuthenticated) {
            showSection('doctorConsole'); // If already logged in, go to console
            fetchAppointments();
        } else {
            showSection('doctorAuth'); // Show login form
        }
    });
}

// Doctor Login Form Submission
if (doctorLoginForm) {
    doctorLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('doctorUsername').value;
        const password = document.getElementById('doctorPassword').value;

        doctorLoginResponse.style.display = 'none'; // Hide previous messages
        doctorLoginResponse.classList.remove('success', 'error');

        try {
            const response = await fetch('http://localhost:3000/api/doctor-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                isAuthenticated = true; // Set flag
                doctorLoginResponse.classList.add('success');
                doctorLoginResponse.textContent = data.message;
                doctorLoginResponse.style.display = 'block';
                doctorLoginForm.reset();
                
                setTimeout(() => {
                    showSection('doctorConsole');
                    fetchAppointments(); // Load appointments after login
                }, 1000);

            } else {
                doctorLoginResponse.classList.add('error');
                doctorLoginResponse.textContent = data.message;
                doctorLoginResponse.style.display = 'block';
            }
        } catch (error) {
            console.error('Login error:', error);
            doctorLoginResponse.classList.add('error');
            doctorLoginResponse.textContent = 'Failed to connect to server. Please try again.';
            doctorLoginResponse.style.display = 'block';
        }
    });
}

// Fetch and Display Appointments
async function fetchAppointments() {
    if (!appointmentsList) return;
    appointmentsList.innerHTML = '<p class="loading-appointments">Loading appointments...</p>';

    try {
        const response = await fetch('http://localhost:3000/api/appointments');
        const appointments = await response.json();

        if (response.ok) {
            if (appointments.length === 0) {
                appointmentsList.innerHTML = '<p>No appointments booked yet.</p>';
            } else {
                appointmentsList.innerHTML = ''; // Clear loading message
                appointments.forEach(appt => {
                    const apptDiv = document.createElement('div');
                    apptDiv.classList.add('appointment-item');
                    apptDiv.innerHTML = `
                        <h3>Appointment for ${appt.fullName}</h3>
                        <p><strong>Email:</strong> ${appt.email}</p>
                        <p><strong>Phone:</strong> ${appt.phone || 'N/A'}</p>
                        <p><strong>Date:</strong> ${appt.date}</p>
                        <p><strong>Time:</strong> ${appt.time}</p>
                        <p><strong>Reason:</strong> ${appt.message || 'N/A'}</p>
                        <p><strong>Status:</strong> <span class="appointment-status ${appt.status.toLowerCase()}">${appt.status}</span></p>
                        <button class="btn btn-secondary btn-sm" onclick="alert('Implement confirmation logic for ${appt.id}')">Confirm</button>
                        <button class="btn btn-error btn-sm" onclick="alert('Implement cancellation logic for ${appt.id}')">Cancel</button>
                    `;
                    appointmentsList.appendChild(apptDiv);
                });
            }
        } else {
            appointmentsList.innerHTML = '<p class="error">Failed to load appointments.</p>';
        }
    } catch (error) {
        console.error('Fetch appointments error:', error);
        appointmentsList.innerHTML = '<p class="error">Error connecting to server. Please try again.</p>';
    }
}

// Logout functionality
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        isAuthenticated = false; // Clear authentication status
        showSection('hero'); // Go back to home page
        // In a real app, clear any stored tokens
        doctorLoginResponse.classList.remove('success', 'error'); // Clear messages
        doctorLoginResponse.style.display = 'none';
    });
}