// In main.js
document.addEventListener('DOMContentLoaded', () => {
    const navLinksContainer = document.querySelector('header nav ul');

    fetch('/api/user-status')
        .then(response => response.json())
        .then(data => {
            let navLinksHTML = `
                <li><a href="index.html">Home</a></li>
                <li><a href="notes.html">Notes</a></li>
                <li><a href="about.html">About</a></li>
            `;

            if (data.loggedIn) {
                // User is logged in
                navLinksHTML += `
                    <li><a href="upload.html">Upload Notes</a></li>
                    <li><a href="/logout">Logout</a></li>
                    <li class="nav-user">Welcome, ${data.name}!</li>
                `;
            } else {
                // User is not logged in
                navLinksHTML += `
                    <li><a href="login.html" class="login-btn">Login / Register</a></li>
                `;
            }
            navLinksContainer.innerHTML = navLinksHTML;
        });
});