// Supabase credentials provided by user
const SUPABASE_URL = 'https://sgypqfqlpbsvzpndoofx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNneXBxZnFscGJzdnpwbmRvb2Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMzA4NjAsImV4cCI6MjA3MTgwNjg2MH0.DepBq3-C3W9vJDAyBnwBv9rAwnC2LkEtAT_7dqFVADI';

// Initialize the Supabase client
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginForm = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorMessage.textContent = ''; // Clear previous errors

    const email = event.target.email.value;
    const password = event.target.password.value;

    if (!email || !password) {
        errorMessage.textContent = 'Please enter both email and password.';
        return;
    }

    // Show loading state
    const submitButton = loginForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Signing In...';

    const { error } = await _supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        errorMessage.textContent = error.message;
        console.error('Login failed:', error);
        submitButton.disabled = false;
        submitButton.textContent = 'Sign In';
    } else {
        // Redirect to the admin dashboard on successful login
        window.location.href = '/admin/index.html';
    }
});
