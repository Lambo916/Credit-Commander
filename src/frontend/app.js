/**
 * YourBizGuru Toolkit Template - Frontend JavaScript
 * Handles form submission, API calls, results display, and local storage
 */

class YBGToolkit {
    constructor() {
        this.maxResults = 5; // Store last 5 results per toolkit
        this.storageKey = 'ybg_toolkit_results'; // Will be prefixed with toolkit name
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadStoredResults();
    }

    bindEvents() {
        // Form submission
        const form = document.getElementById('toolkitForm');
        form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Clear history
        const clearBtn = document.getElementById('clearHistoryBtn');
        clearBtn.addEventListener('click', () => this.clearHistory());

        // Dynamic event delegation for copy/download buttons
        const resultsContainer = document.getElementById('resultsContainer');
        resultsContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('copy-btn')) {
                this.copyResult(e.target);
            } else if (e.target.classList.contains('download-btn')) {
                this.downloadResult(e.target);
            }
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const promptInput = document.getElementById('promptInput');
        const submitBtn = document.getElementById('submitBtn');
        const submitText = document.getElementById('submitText');
        const loadingText = document.getElementById('loadingText');
        
        const prompt = promptInput.value.trim();
        
        if (!prompt) {
            this.showError('Please enter a request before submitting.');
            return;
        }

        // Input length validation (max 2000 characters)
        if (prompt.length > 2000) {
            this.showError('Request is too long. Please limit to 2000 characters or less.');
            return;
        }

        // Show loading state
        this.setLoadingState(true);
        
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            // Add result to display and storage
            this.addResult(prompt, data.result);
            
            // Clear input
            promptInput.value = '';
            
        } catch (error) {
            console.error('Error generating result:', error);
            this.showError(error.message || 'Failed to generate result. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    setLoadingState(loading) {
        const submitBtn = document.getElementById('submitBtn');
        const submitText = document.getElementById('submitText');
        const loadingText = document.getElementById('loadingText');
        const promptInput = document.getElementById('promptInput');

        if (loading) {
            submitBtn.disabled = true;
            submitText.classList.add('hidden');
            loadingText.classList.remove('hidden');
            promptInput.disabled = true;
        } else {
            submitBtn.disabled = false;
            submitText.classList.remove('hidden');
            loadingText.classList.add('hidden');
            promptInput.disabled = false;
        }
    }

    addResult(prompt, result) {
        const timestamp = new Date();
        const resultData = {
            id: Date.now().toString(),
            prompt,
            result,
            timestamp: timestamp.toISOString(),
            displayTime: this.formatTimestamp(timestamp)
        };

        // Add to storage
        this.saveResult(resultData);

        // Add to display
        this.displayResult(resultData);

        // Hide "no results" message
        const noResults = document.getElementById('noResults');
        noResults.style.display = 'none';
    }

    displayResult(resultData) {
        const resultsContainer = document.getElementById('resultsContainer');
        const template = document.getElementById('resultTemplate');
        const resultElement = template.content.cloneNode(true);

        // Populate result data
        const timestampEl = resultElement.querySelector('.result-timestamp');
        const contentEl = resultElement.querySelector('.result-content');
        const copyBtn = resultElement.querySelector('.copy-btn');
        const downloadBtn = resultElement.querySelector('.download-btn');

        timestampEl.textContent = resultData.displayTime;
        contentEl.textContent = resultData.result;
        
        // Store data for copy/download actions
        copyBtn.dataset.resultId = resultData.id;
        downloadBtn.dataset.resultId = resultData.id;
        
        // Add to top of results (newest first)
        resultsContainer.insertBefore(resultElement, resultsContainer.firstChild);

        // Scroll to show new result
        resultsContainer.scrollTop = 0;
    }

    copyResult(button) {
        const resultId = button.dataset.resultId;
        const results = this.getStoredResults();
        const result = results.find(r => r.id === resultId);
        
        if (result) {
            navigator.clipboard.writeText(result.result).then(() => {
                this.showSuccess('Result copied to clipboard!');
                
                // Visual feedback
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = originalText;
                }, 2000);
            }).catch(err => {
                console.error('Copy failed:', err);
                this.showError('Failed to copy result');
            });
        }
    }

    downloadResult(button) {
        const resultId = button.dataset.resultId;
        const results = this.getStoredResults();
        const result = results.find(r => r.id === resultId);
        
        if (result) {
            const toolkitName = this.getToolkitName();
            const timestamp = new Date(result.timestamp).toISOString().split('T')[0];
            const filename = `${toolkitName}_result_${timestamp}_${resultId}.txt`;
            
            const content = `${toolkitName} Result\n` +
                          `Generated: ${result.displayTime}\n` +
                          `Request: ${result.prompt}\n\n` +
                          `Result:\n${result.result}\n\n` +
                          `---\nPowered by YourBizGuru.com`;
            
            this.downloadTextFile(content, filename);
            this.showSuccess('Result downloaded!');
        }
    }

    downloadTextFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    saveResult(resultData) {
        const results = this.getStoredResults();
        results.unshift(resultData); // Add to beginning
        
        // Keep only last N results
        if (results.length > this.maxResults) {
            results.splice(this.maxResults);
        }
        
        localStorage.setItem(this.getStorageKey(), JSON.stringify(results));
    }

    getStoredResults() {
        const stored = localStorage.getItem(this.getStorageKey());
        return stored ? JSON.parse(stored) : [];
    }

    loadStoredResults() {
        const results = this.getStoredResults();
        
        if (results.length === 0) {
            return;
        }

        // Hide "no results" message
        const noResults = document.getElementById('noResults');
        noResults.style.display = 'none';

        // Display results (newest first)
        results.forEach(result => {
            this.displayResult(result);
        });
    }

    clearHistory() {
        if (confirm('Are you sure you want to clear all results? This cannot be undone.')) {
            localStorage.removeItem(this.getStorageKey());
            
            // Clear display
            const resultsContainer = document.getElementById('resultsContainer');
            const resultItems = resultsContainer.querySelectorAll('.result-item');
            resultItems.forEach(item => item.remove());
            
            // Show "no results" message
            const noResults = document.getElementById('noResults');
            noResults.style.display = 'block';
            
            this.showSuccess('History cleared successfully!');
        }
    }

    getToolkitName() {
        // Extract toolkit name from page title (before " ·")
        const title = document.title;
        return title.split(' ·')[0] || 'YBG Toolkit';
    }

    getStorageKey() {
        const toolkitName = this.getToolkitName().toLowerCase().replace(/\s+/g, '_');
        return `${this.storageKey}_${toolkitName}`;
    }

    formatTimestamp(date) {
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Add toast styles if not already present
        if (!document.querySelector('.toast-styles')) {
            const styles = document.createElement('style');
            styles.className = 'toast-styles';
            styles.textContent = `
                .toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    border-radius: 8px;
                    font-family: var(--font-body, 'Open Sans', sans-serif);
                    font-size: 14px;
                    font-weight: 500;
                    z-index: 1000;
                    opacity: 0;
                    transform: translateX(100%);
                    transition: all 0.3s ease;
                }
                .toast.show {
                    opacity: 1;
                    transform: translateX(0);
                }
                .toast-success {
                    background: #4CAF50;
                    color: white;
                }
                .toast-error {
                    background: #F44336;
                    color: white;
                }
                .toast-info {
                    background: #2196F3;
                    color: white;
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Remove toast after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }
}

// Initialize the toolkit when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.ybgToolkit = new YBGToolkit();
});

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.ybgToolkit) {
        window.ybgToolkit.showError('An unexpected error occurred. Please try again.');
    }
});