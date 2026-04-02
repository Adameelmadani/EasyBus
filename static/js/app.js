// app.js - Authentication and General App Logic

document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signup-form");
    const loginForm = document.getElementById("login-form");

    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("username").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirm-password").value;

            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            try {
                const response = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });

                const data = await response.json();
                if (response.ok) {
                    alert("Account created successfully! Please login.");
                    window.location.href = './login.html';
                } else {
                    alert(data.error || "Signup failed");
                }
            } catch (error) {
                console.error("Signup error:", error);
                alert("An error occurred during signup.");
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            // Basic Auth header
            const credentials = btoa(`${email}:${password}`);

            try {
                const response = await fetch('/api/connect', {
                    method: 'GET',
                    headers: { 'Authorization': `Basic ${credentials}` }
                });

                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('token', data.token);
                    window.location.href = './work_page.html';
                } else {
                    alert(data.error || "Login failed");
                }
            } catch (error) {
                console.error("Login error:", error);
                alert("An error occurred during login.");
            }
        });
    }

    // Check if logged in on work_page
    if (window.location.pathname.includes('work_page.html')) {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = './login.html';
        }
    }
});
