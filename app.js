// Configure marked.js to use highlight.js for code blocks
marked.setOptions({
    highlight: function(code, lang) {
        const language = highlight.getLanguage(lang) ? lang : 'plaintext';
        return highlight.highlight(code, { language }).value;
    }
});

// DOM Elements
const contentContainer = document.getElementById('markdown-container');
const navLinks = document.querySelectorAll('#nav-links a');
const pluginsPart2Btn = document.getElementById('plugins-part2-btn');
const menuToggle = document.getElementById('menu-toggle');
const sidebar = document.querySelector('.sidebar');
const navOverlay = document.querySelector('.nav-overlay');

// Function to fetch and render markdown
async function loadMarkdownFile(filename) {
    try {
        contentContainer.innerHTML = '<p>Loading...</p>';
        
        // Fetch the file from the docs folder
        const response = await fetch(`Docs/${filename}`);
        
        if (!response.ok) throw new Error('File not found');
        
        const markdownText = await response.text();
        
        // Convert to HTML and inject
        contentContainer.innerHTML = marked.parse(markdownText);
        
    } catch (error) {
        contentContainer.innerHTML = `<p style="color: #ff5555;">Error loading documentation: ${error.message}. Make sure the file exists in the docs folder.</p>`;
    }
}

// Handle Navigation Clicks
const pluginsActions = document.querySelector('.plugins-actions');

function updatePluginsButtonState(fileToLoad) {
    if (fileToLoad === 'Hermes_Plugins_Beginner_Guide.md') {
        pluginsActions?.classList.add('visible');
    } else {
        pluginsActions?.classList.remove('visible');
    }
}

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        // If it's the Part 2 button, don't treat it like a sidebar nav item
        if (e.target && e.target.id === 'plugins-part2-btn') return;
        
        // Update active class
        document.querySelector('.active')?.classList.remove('active');
        e.target.classList.add('active');
        
        const fileToLoad = e.target.getAttribute('data-file');
        updatePluginsButtonState(fileToLoad);
        loadMarkdownFile(fileToLoad);
        closeMobileMenu();
    });
});

// Plugins: Part 2 button
if (pluginsPart2Btn) {
    pluginsPart2Btn.addEventListener('click', (e) => {
        e.preventDefault();
        pluginsActions?.classList.add('visible');
        loadMarkdownFile('Hermes_Plugins_Guide.md');
    });
}

function closeMobileMenu() {
    sidebar?.classList.remove('open');
    navOverlay?.classList.remove('visible');
}

function openMobileMenu() {
    sidebar?.classList.add('open');
    navOverlay?.classList.add('visible');
}

menuToggle?.addEventListener('click', () => {
    if (sidebar?.classList.contains('open')) {
        closeMobileMenu();
    } else {
        openMobileMenu();
    }
});

navOverlay?.addEventListener('click', closeMobileMenu);

// Load the default home page on startup based on the active sidebar link.
const initialActiveLink = document.querySelector('#nav-links a.active');
const initialFile = initialActiveLink ? initialActiveLink.getAttribute('data-file') : 'Hermes_Complete_Command_Reference.md';
updatePluginsButtonState(initialFile);
loadMarkdownFile(initialFile);
