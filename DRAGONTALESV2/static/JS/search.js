// Enhanced Search Functionality for Dragon Tales News
// Made with love from Calder Smith 2025-26
// Now with 50% more searching and 100% more functionality

class SearchManager {
    constructor() {
        // Gathering our search tools like a digital detective
        this.searchInput = document.getElementById('search-input');
        this.searchResults = document.getElementById('search-results');
        this.searchTimeout = null; // Because we don't want to spam the server
        this.currentQuery = ''; // What the user is actually looking for
        this.articles = []; // Our treasure trove of content
        this.isSearchActive = false; // Are we currently in search mode?
        
        this.init(); // Let's get this party started
    }

    init() {
        if (!this.searchInput) return;
        
        this.setupEventListeners();
        this.loadArticles();
    }

    setupEventListeners() {
        // Real-time search as user types
        this.searchInput.addEventListener('input', (e) => {
            this.handleSearchInput(e.target.value);
        });

        // Handle search focus/blur
        this.searchInput.addEventListener('focus', () => {
            if (this.currentQuery.length >= 2) {
                this.showSearchResults();
            }
        });

        // Hide results when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideSearchResults();
            }
        });

        // Handle keyboard navigation
        this.searchInput.addEventListener('keydown', (e) => {
            this.handleKeyNavigation(e);
        });
    }

    async loadArticles() {
        try {
            const response = await fetch('/api/articles?per_page=1000');
            const data = await response.json();
            this.articles = data.articles || [];
        } catch (error) {
            console.error('Failed to load articles for search:', error);
        }
    }

    handleSearchInput(query) {
        clearTimeout(this.searchTimeout);
        this.currentQuery = query.trim();

        if (this.currentQuery.length < 2) {
            this.hideSearchResults();
            return;
        }

        this.searchTimeout = setTimeout(() => {
            this.performSearch(this.currentQuery);
        }, 300);
    }

    performSearch(query) {
        // Time to actually do some searching - the moment of truth
        const results = this.searchArticles(query);
        this.displayResults(results, query);
        this.showSearchResults(); // Ta-da! Here are your results
    }

    searchArticles(query) {
        // The actual search magic happens here
        const searchTerm = query.toLowerCase(); // Because case sensitivity is for nerds
        
        return this.articles.filter(article => {
            // Checking every possible place the search term could be hiding
            const titleMatch = article.title?.toLowerCase().includes(searchTerm);
            const contentMatch = article.fullDescription?.toLowerCase().includes(searchTerm);
            const authorMatch = article.author?.toLowerCase().includes(searchTerm);
            const categoryMatch = article.category?.toLowerCase().includes(searchTerm);
            const summaryMatch = article.summary?.toLowerCase().includes(searchTerm);
            
            // If it matches anywhere, it's a winner
            return titleMatch || contentMatch || authorMatch || categoryMatch || summaryMatch;
        }).sort((a, b) => {
            // Sorting results like a librarian with OCD
            const aTitle = a.title?.toLowerCase().includes(searchTerm);
            const bTitle = b.title?.toLowerCase().includes(searchTerm);
            
            // Title matches get VIP treatment
            if (aTitle && !bTitle) return -1;
            if (!aTitle && bTitle) return 1;
            
            // Then sort by popularity (views)
            return (b.views || 0) - (a.views || 0);
        });
    }

    displayResults(results, query) {
        if (!this.searchResults) return;

        if (results.length === 0) {
            this.searchResults.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    <p>No articles found for "${query}"</p>
                    <p class="text-sm mt-1">Try different keywords or check spelling</p>
                </div>
            `;
            return;
        }

        const resultsHTML = results.slice(0, 8).map(article => 
            this.createSearchResultItem(article, query)
        ).join('');

        this.searchResults.innerHTML = `
            <div class="p-2">
                <div class="text-xs text-gray-500 px-2 py-1 border-b">
                    ${results.length} result${results.length !== 1 ? 's' : ''} found
                </div>
                ${resultsHTML}
                ${results.length > 8 ? `
                    <div class="px-2 py-2 text-center">
                        <button onclick="searchManager.showAllResults('${query}')" 
                                class="text-blue-600 hover:text-blue-800 text-sm">
                            View all ${results.length} results
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    createSearchResultItem(article, query) {
        const highlightedTitle = this.highlightText(article.title, query);
        const highlightedSummary = this.highlightText(article.summary, query);
        const articleUrl = `article.html?id=${encodeURIComponent(article.id)}`;
        
        return `
            <div class="search-result-item p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                 onclick="incrementViewCount('${article.id}'); window.location.href='${articleUrl}'">
                <div class="flex items-start space-x-3">
                    <img src="${article.image}" 
                         alt="${article.title}"
                         class="w-12 h-12 object-cover rounded flex-shrink-0"
                         onerror="this.src='https://placehold.co/48x48/cccccc/ffffff?text=?'">
                    <div class="flex-1 min-w-0">
                        <h4 class="text-sm font-medium text-gray-900 truncate">
                            ${highlightedTitle}
                        </h4>
                        <p class="text-xs text-gray-600 mt-1 line-clamp-2">
                            ${highlightedSummary}
                        </p>
                        <div class="flex items-center mt-1 text-xs text-gray-500">
                            <span>${article.author}</span>
                            <span class="mx-1">•</span>
                            <span>${article.category}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    highlightText(text, query) {
        if (!text || !query) return text;
        
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    }

    showSearchResults() {
        if (this.searchResults) {
            this.searchResults.classList.remove('hidden');
            this.isSearchActive = true;
        }
    }

    hideSearchResults() {
        if (this.searchResults) {
            this.searchResults.classList.add('hidden');
            this.isSearchActive = false;
        }
    }

    handleKeyNavigation(e) {
        if (!this.isSearchActive) return;

        const items = this.searchResults.querySelectorAll('.search-result-item');
        const currentActive = this.searchResults.querySelector('.search-result-item.active');
        let activeIndex = currentActive ? Array.from(items).indexOf(currentActive) : -1;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                activeIndex = Math.min(activeIndex + 1, items.length - 1);
                this.setActiveItem(items, activeIndex);
                break;
            case 'ArrowUp':
                e.preventDefault();
                activeIndex = Math.max(activeIndex - 1, 0);
                this.setActiveItem(items, activeIndex);
                break;
            case 'Enter':
                e.preventDefault();
                if (currentActive) {
                    currentActive.click();
                }
                break;
            case 'Escape':
                this.hideSearchResults();
                this.searchInput.blur();
                break;
        }
    }

    setActiveItem(items, index) {
        items.forEach(item => item.classList.remove('active', 'bg-blue-50'));
        if (items[index]) {
            items[index].classList.add('active', 'bg-blue-50');
        }
    }

    showAllResults(query) {
        // Redirect to a search results page or expand current results
        window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
    }

    clearSearch() {
        // Wiping the slate clean
        this.searchInput.value = '';
        this.currentQuery = '';
        this.hideSearchResults();
    }
}

function incrementViewCount(articleId) {
    // Telling the server someone actually read this article
    fetch('/api/increment-view', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' // Because we're fancy
        },
        body: JSON.stringify({ articleId: articleId })
    }).catch(error => {
        console.log('View count update failed:', error); // Oh well, we tried
    });
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.searchManager = new SearchManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SearchManager;
}