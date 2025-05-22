// Import CSS
import './styles/main.css';
import './styles/components.scss';

// Import utilities
import { formatMessage, addClickHandler } from './utils/helpers.js';

import  "./utils/enabler.js";

import  "./utils/gwd_webcomponents_v1_min.js";
import  "./utils/gwdgooglead_min.js";
import  "./utils/gwdimage_min.js";
import  "./utils/gwdpage_min.js";
import  "./utils/gwdpagedeck_min.js";



// Import images (these will be inlined as base64)
import logoImage from './assets/logo.png';

// Main application logic
class App {
    constructor() {
        this.init();
    }

    init() {
        console.log('App initialized');
        this.setupEventListeners();
        this.loadContent();
    }

    setupEventListeners() {
        const button = document.getElementById('clickBtn');
        if (button) {
            addClickHandler(button, this.handleButtonClick.bind(this));
        }
    }

    handleButtonClick() {
        const output = document.getElementById('output');
        if (output) {
            const message = formatMessage('Button clicked!', new Date());
            output.innerHTML = `<p class="success-message">${message}</p>`;
        }
    }

    loadContent() {
        // Set background image dynamically
        document.body.style.backgroundImage = `url(${backgroundImage})`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        
        // Update logo src if needed
        const logoEl = document.querySelector('.logo');
        if (logoEl) {
            logoEl.src = logoImage;
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});

// Export for potential external use
export default App;