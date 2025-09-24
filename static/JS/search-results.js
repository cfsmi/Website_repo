// Search Results Page JavaScript
// Dragon Tales News - Search Results Management
// Where search dreams come to life (or die trying)

class SearchResultsManager {
    constructor() {
        // Setting up our search empire
        this.articles = []; // All the articles in existence
        this.filteredResults = []; // The chosen ones that match our search
        this.currentQuery = ''; // What the user is desperately looking for
        this.currentFilters = {
            category: '', // Filtering by category like a picky eater
            sort: 'relevance' // Default sorting because we're helpful like that
        };
        
        this.init(); // Time to initialize this masterpiece
    }

    init() {
        this.getSearchQuery();
        this.setupEventListeners();
        this.loadArticles();
    }

    getSearchQuery() {
        const urlParams = new URLSearchParams(window.location.search);
        this.currentQuery = urlParams.get('q') || '';
        
        if (this.currentQuery) {
            document.getElementById('search-input').value = this.currentQuery;
            document.getElementById('search-title').textContent = `Search Results for "${this.currentQuery}"`;
        }
    }

    setupEventListeners() {
        // Search input
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performNewSearch(e.target.value);
            }
        });

        // Filters
        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.currentFilters.category = e.target.value;
            this.applyFilters();
        });

        document.getElementById('sort-filter').addEventListener('change', (e) => {
            this.currentFilters.sort = e.target.value;
            this.applyFilters();
        });

        document.getElementById('clear-filters').addEventListener('click', () => {
            this.clearFilters();
        });
    }

    async loadArticles() {
        this.showLoading();
        
        try {
            const response = await fetch('/api/articles?per_page=1000');
            const data = await response.json();
            this.articles = data.articles || [];
            
            this.populateCategoryFilter();
            
            if (this.currentQuery) {
                this.performSearch();
            } else {
                this.hideLoading();
                this.showNoQuery();
            }
        } catch (error) {
            console.error('Failed to load articles:', error);
            this.hideLoading();
            this.showError();
        }
    }

    populateCategoryFilter() {
        const categories = [...new Set(this.articles.map(article => article.category).filter(Boolean))];
        const categoryFilter = document.getElementById('category-filter');
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    performNewSearch(query) {
        this.currentQuery = query.trim();
        if (this.currentQuery) {
            window.location.href = `search-results.html?q=${encodeURIComponent(this.currentQuery)}`;
        }
    }

    performSearch() {
        // The main event - actually searching for stuff
        if (!this.currentQuery) return; // No query? No service.

        const searchTerm = this.currentQuery.toLowerCase(); // Lowercase because we're not monsters
        
        // Filtering articles like we're panning for gold
        this.filteredResults = this.articles.filter(article => {
            const titleMatch = article.title?.toLowerCase().includes(searchTerm);
            const contentMatch = article.fullDescription?.toLowerCase().includes(searchTerm);
            const authorMatch = article.author?.toLowerCase().includes(searchTerm);
            const categoryMatch = article.category?.toLowerCase().includes(searchTerm);
            const summaryMatch = article.summary?.toLowerCase().includes(searchTerm);
            
            // If it matches anywhere, it's coming with us
            return titleMatch || contentMatch || authorMatch || categoryMatch || summaryMatch;
        });

        this.applyFilters(); // Now let's get fancy with filters
    }

    applyFilters() {
        let results = [...this.filteredResults];

        // Category filter
        if (this.currentFilters.category) {
            results = results.filter(article => article.category === this.currentFilters.category);
        }

        // Sort results
        results = this.sortResults(results);

        this.displayResults(results);
        this.hideLoading();
    }

    sortResults(results) {
        const searchTerm = this.currentQuery.toLowerCase();
        
        switch (this.currentFilters.sort) {
            case 'relevance':
                return results.sort((a, b) => {
                    const aTitle = a.title?.toLowerCase().includes(searchTerm);
                    const bTitle = b.title?.toLowerCase().includes(searchTerm);
                    
                    if (aTitle && !bTitle) return -1;
                    if (!aTitle && bTitle) return 1;
                    
                    return (b.views || 0) - (a.views || 0);
                });
            case 'date':
                return results.sort((a, b) => new Date(b.date) - new Date(a.date));

            case 'title':
                return results.sort((a, b) => a.title.localeCompare(b.title));
            default:
                return results;
        }
    }

    displayResults(results) {
        const container = document.getElementById('results-container');
        const noResults = document.getElementById('no-results');
        const subtitle = document.getElementById('search-subtitle');

        if (results.length === 0) {
            container.innerHTML = '';
            noResults.classList.remove('hidden');
            subtitle.textContent = `No results found for "${this.currentQuery}"`;
        } else {
            noResults.classList.add('hidden');
            subtitle.textContent = `${results.length} result${results.length !== 1 ? 's' : ''} found for "${this.currentQuery}"`;
            
            container.innerHTML = results.map(article => this.createResultCard(article)).join('');
        }
    }

    createResultCard(article) {
        const highlightedTitle = this.highlightText(article.title, this.currentQuery);
        const highlightedSummary = this.highlightText(article.summary, this.currentQuery);
        const articleUrl = `article.html?id=${encodeURIComponent(article.id)}`;
        
        return `
            <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                <div class="flex flex-col md:flex-row">
                    <div class="md:w-1/3">
                        <img src="${article.image}" 
                             alt="${article.title}"
                             class="w-full h-48 md:h-full object-cover"
                             onerror="this.src='https://placehold.co/400x300/cccccc/ffffff?text=No+Image'">
                    </div>
                    <div class="md:w-2/3 p-6">
                        <div class="flex items-center mb-2">
                            <span class="bg-[#A51C30] text-white px-3 py-1 rounded-full text-sm font-medium">
                                ${article.category}
                            </span>
                        </div>
                        
                        <h2 class="text-xl font-bold text-[#1E1E1E] mb-3 hover:text-[#A51C30] transition-colors">
                            <a href="${articleUrl}">${highlightedTitle}</a>
                        </h2>
                        
                        <p class="text-gray-600 mb-4 line-clamp-3">
                            ${highlightedSummary}
                        </p>
                        
                        <div class="flex items-center justify-between">
                            <div class="flex items-center text-sm text-gray-500">
                                <span>By ${article.author}</span>
                                <span class="mx-2">•</span>
                                <span>${this.formatDate(article.date)}</span>
                            </div>
                            
                            <a href="${articleUrl}" 
                               onclick="incrementViewCount('${article.id}')"
                               class="bg-[#A51C30] text-white px-4 py-2 rounded-lg hover:bg-[#8C1A2A] transition-colors text-sm font-medium">
                                Read More
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    highlightText(text, query) {
        if (!text || !query) return text;
        
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return text.replace(regex, '<span class="search-highlight">$1</span>');
    }

    formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    clearFilters() {
        document.getElementById('category-filter').value = '';
        document.getElementById('sort-filter').value = 'relevance';
        
        this.currentFilters = {
            category: '',
            sort: 'relevance'
        };
        
        this.applyFilters();
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('results-container').innerHTML = '';
        document.getElementById('no-results').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    showNoQuery() {
        document.getElementById('search-subtitle').textContent = 'Enter a search term to find articles';
        document.getElementById('no-results').classList.add('hidden');
    }

    showError() {
        document.getElementById('results-container').innerHTML = `
            <div class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <div class="text-red-600 text-4xl mb-4">⚠️</div>
                <h3 class="text-lg font-semibold text-red-800 mb-2">Error Loading Articles</h3>
                <p class="text-red-600">Please try again later or contact support if the problem persists.</p>
            </div>
        `;
    }
}

function incrementViewCount(articleId) {
    // Bumping up those view numbers because metrics matter
    fetch('/api/increment-view', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' // Speaking the server's language
        },
        body: JSON.stringify({ articleId: articleId })
    }).catch(error => {
        console.log('View count update failed:', error); // not sure how (spoiler: i messed up)
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SearchResultsManager();
});