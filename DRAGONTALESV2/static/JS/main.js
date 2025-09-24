// Hey, please don't mess with this unless you know what you're doing!
// Made with love from Calder Smith 2025-26

// --- Global Elements and Functions (Used on all pages) ---
let currentPage = 1;
let isLoading = false;
let searchTimeout = null;

// Loading state management
function showLoading() {
    const loader = document.querySelector('.loader');
    if (loader) loader.style.display = 'block';
    isLoading = true;
}

function hideLoading() {
    const loader = document.querySelector('.loader');
    if (loader) loader.style.display = 'none';
    isLoading = false;
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 2) {
                if (searchResults) searchResults.innerHTML = '';
                return;
            }
            
            searchTimeout = setTimeout(() => {
                performSearch(query);
            }, 300);
        });
        
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
        
        searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                if (searchResults) searchResults.innerHTML = '';
            }, 200);
        });
    }
}

function performSearch(query) {
    showLoading();
    fetch('DATA/articles.json')
        .then(response => response.json())
        .then(articles => {
            const filteredArticles = articles.filter(article => 
                article.title.toLowerCase().includes(query.toLowerCase()) ||
                article.summary.toLowerCase().includes(query.toLowerCase()) ||
                article.author.toLowerCase().includes(query.toLowerCase()) ||
                article.category.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 20);
            displaySearchResults(filteredArticles, query);
        })
        .catch(error => {
            console.error('Search error:', error);
        })
        .finally(() => {
            hideLoading();
        });
}

function displaySearchResults(articles, query) {
    const searchResults = document.getElementById('search-results');
    if (!searchResults) return;
    
    if (articles.length === 0) {
        searchResults.innerHTML = `<p class="text-gray-500 text-center py-4">No articles found for "${query}"</p>`;
        return;
    }
    
    searchResults.innerHTML = articles.map(article => createArticleCard(article)).join('');
    addCardClickListeners();
}

// Pagination functionality
function loadMoreArticles() {
    if (isLoading) return;
    
    currentPage++;
    showLoading();
    
    fetch(`/api/articles?page=${currentPage}&per_page=10`)
        .then(response => response.json())
        .then(data => {
            if (data.articles.length > 0) {
                const container = document.getElementById('news-section2');
                if (container) {
                    data.articles.forEach(article => {
                        container.insertAdjacentHTML('beforeend', createArticleCard(article));
                    });
                    addCardClickListeners();
                }
            } else {
                const loadMoreBtn = document.getElementById('load-more-btn');
                if (loadMoreBtn) loadMoreBtn.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error loading more articles:', error);
        })
        .finally(() => {
            hideLoading();
        });
}

//legacy code here
const modal = document.getElementById('message-modal');
const modalTitle = document.getElementById('modal-title');
const closeModalButton = document.getElementById('close-modal');
const modalDescription = document.getElementById('FULLDESC');

if (modal && closeModalButton) {
    closeModalButton.addEventListener('click', () => modal.classList.add('hidden'));
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.classList.add('hidden');
        }
    });
}

function showMessageModal(title, description) {
    if (modal && modalTitle && modalDescription) {
        modalTitle.textContent = title;
        modalDescription.textContent = description;
        modal.classList.remove('hidden');
    }
}

function getAuthorLink(authorName) {
    const encodedAuthor = encodeURIComponent(authorName);
    return `<a href="author.html?author=${encodedAuthor}" class="text-sm text-blue-600 hover:underline cursor-pointer">${authorName}</a>`;
}
function createartimage (art) {
    let imagehtml;
    imagehtml = `
     <div class="artwork-card">
        
        <img
            src="${art.url}" 
            alt="Student Artwork" 
            onerror="this.onerror=null;this.src='https://placehold.co/600x800/cccccc/ffffff?text=Image+Not+Found';"
        >

        <div class="info-overlay">
            <div class="info-text">
                <h3>${art.title}</h3>
                <p class="artist-name">By ${art.creator}</p>
            </div>
        </div>

    </div>
    `
    return imagehtml;
}
function createArticleCard(article, isFeatured = false) {
    const authorLink = getAuthorLink(article.author);
    const articleLink = `article.html?id=${encodeURIComponent(article.id)}`;
    const views = article.views || 0;

    let cardHtml;
    // The large, featured card style
    if (isFeatured) {
        cardHtml = `
            <div data-link="${articleLink}" class="card-linker mb-6 bg-white rounded-xl shadow-lg overflow-hidden p-4 sm:p-8 flex flex-col md:flex-row items-center hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105">
                <img class="w-full md:w-1/2 h-48 sm:h-64 object-cover rounded-lg" src="${article.image}" alt="${article.title}" onerror="this.src='https://placehold.co/600x400/cccccc/ffffff?text=Image+Not+Found'">
                <div class="md:ml-8 mt-4 md:mt-0 w-full">
                    <h3 class="text-xl sm:text-2xl font-bold text-gray-900">${article.title}</h3>
                    <p class="mt-2 text-gray-600 text-sm sm:text-base">${article.summary}</p>
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2">
                        <p class="text-gray-500 text-sm">By ${authorLink}</p>
                    </div>
                    <button class="inline-block mt-4 px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 pointer-events-none text-sm sm:text-base">Read More</button>
                </div>
            </div>
        `;
    } else { // The smaller, standard card style
        cardHtml = `
            <div data-link="${articleLink}" class="card-linker bg-white rounded-xl shadow-md overflow-hidden mb-6 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 min-w-96">
                <div class="flex flex-col sm:flex-row">
                    <div class="flex-shrink-0">
                        <img class="h-48 w-full object-cover sm:w-48" src="${article.image}" alt="${article.title}" onerror="this.src='https://placehold.co/400x300/cccccc/ffffff?text=Image+Not+Found'">
                    </div>
                    <div class="p-4 sm:p-8 flex-1">
                        <div class="uppercase tracking-wide text-xs sm:text-sm text-blue-600 font-semibold">${article.category}</div>
                        <h3 class="block mt-1 text-base sm:text-lg leading-tight font-medium text-black hover:underline">${article.title}</h3>
                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2">
                            <p class="text-gray-500 text-xs sm:text-sm">By ${authorLink} - ${article.date}</p>
                        </div>
                        <p class="mt-2 text-gray-600 text-sm sm:text-base">${article.summary}</p>
                    </div>
                </div>
            </div>
        `;
    }
    return cardHtml;
}

function addCardClickListeners() {
    // Making cards clickable because apparently everything needs to be clickable now
    document.querySelectorAll('.card-linker').forEach(card => {
        card.addEventListener('click', (e) => {
            // Don't interfere if they clicked an actual link
            if (e.target.closest('a')) {
                return; // Not our problem
            }
            const link = card.dataset.link;
            if (link) {
                // Extracting the article ID like we're doing surgery
                const articleId = new URLSearchParams(link.split('?')[1]).get('id');
                if (articleId) {
                    incrementViewCount(articleId); // Cha-ching! Another view
                }
                window.location.href = link; // Off you go!
            }
        });
    });
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
function renderartwork(art) {
    const artpage = document.getElementById('artwork-section')
    if (artpage) {
        art.forEach (singleart => {
            artpage.insertAdjacentHTML("beforeend", createartimage(singleart))
        })
    }
}
// This function renders the page content after articles have been fetched.
function renderPageContent(articles) {
    const isHomePage = document.getElementById('carousel-slides');
    const isAuthorPage = document.getElementById('author-articles');
    const isArticlePage = document.getElementById('article-content');

    if (isHomePage) {
        const element = document.getElementById('news-section');
        element.style.visibility = 'visible';
        hideLoading();
        // This code runs on the main index.html page
        const carouselSlides = document.getElementById('carousel-slides');

        // Image Carousel Logic
        if (carouselSlides) {
            const prevButton = document.getElementById('carousel-prev');
            const nextButton = document.getElementById('carousel-next');
            const slides = carouselSlides.children;
            const totalSlides = slides.length;
            let currentIndex = 0;
            
            function updateCarousel() {
                const offset = -currentIndex * 100;
                carouselSlides.style.transform = `translateX(${offset}%)`;
            }
            
            if (nextButton) nextButton.addEventListener('click', () => {
                currentIndex = (currentIndex + 1) % totalSlides;
                updateCarousel();
            });
            
            if (prevButton) prevButton.addEventListener('click', () => {
                currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
                updateCarousel();
            });
            
            setInterval(() => {
                if (nextButton) nextButton.click();
            }, 5000);
        }
        const featuredArticleSection = document.getElementById('featured-article-section');
        const newsContainer = document.getElementById('news-section2');

        const featuredArticles = articles.filter(article => article.featured);
        if (featuredArticles.length == 0) {
            const articleheader = document.getElementById("featuredarticleheader");
            articleheader.remove();
        }

        if (featuredArticleSection && featuredArticles.length > 0) {
            featuredArticleSection.innerHTML = ''; // Clear the section first
            featuredArticles.forEach(article => {
                featuredArticleSection.insertAdjacentHTML('beforeend', createArticleCard(article, true));
            });
        }

        

        if (newsContainer) {
            const nonFeaturedArticles = articles.filter(article => !article.featured);
            const articlesByCategory = nonFeaturedArticles.reduce((acc, article) => {
                if (!acc[article.category]) acc[article.category] = [];
                acc[article.category].push(article);
                return acc;
            }, {});
            
            newsContainer.innerHTML = '';
            for (const category in articlesByCategory) {
                if (articlesByCategory.hasOwnProperty(category)) {
                    const categorySection = document.createElement('section');
                    categorySection.className = 'my-8';
                    const categoryHeading = document.createElement('h2');
                    categoryHeading.className = 'text-3xl font-bold text-gray-800 mb-6';
                    categoryHeading.textContent = category;
                    categorySection.appendChild(categoryHeading);
                    
                    const articlesGrid = document.createElement('div');
                    articlesGrid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';
                    articlesByCategory[category].forEach(article => {
                        articlesGrid.insertAdjacentHTML('beforeend', createArticleCard(article));
                    });
                    
                    categorySection.appendChild(articlesGrid);
                    newsContainer.appendChild(categorySection);
                }
            }
        }
    } else if (isAuthorPage) {
        const authorTitle = document.getElementById('author-title');
        const authorArticlesContainer = document.getElementById('author-articles');
        const params = new URLSearchParams(window.location.search);
        const authorName = params.get('author');
        document.title = "Articles by " + authorName
        if (authorName) {
            authorTitle.textContent = `Articles by ${decodeURIComponent(authorName)}`;
            const authorArticles = articles.filter(article => article.author === decodeURIComponent(authorName));
            
            if (authorArticles.length > 0) {
                authorArticlesContainer.innerHTML = '';
                authorArticles.forEach(article => {
                    authorArticlesContainer.insertAdjacentHTML('beforeend', createArticleCard(article));
                });
            } else {
                authorArticlesContainer.innerHTML = '<p class="text-gray-500">No articles found for this author.</p>';
            }
        } else {
            authorTitle.textContent = 'Author Not Found';
        }
    } else if (isArticlePage) {
        const articleContentContainer = document.getElementById('article-content');
        const pageTitle = document.getElementById('article-page-title');
        const params = new URLSearchParams(window.location.search);
        const articleId = params.get('id');
        document.title = pageTitle
        if (articleId) {
            const article = articles.find(a => a.id === decodeURIComponent(articleId));
            if (article) {
                pageTitle.textContent = `${article.title} - Dragon Tail News`;
                const authorLinkHTML = getAuthorLink(article.author);
                articleContentContainer.innerHTML = `
                    <h1 class="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-4">${article.title}</h1>
                    <p class="text-lg text-gray-600 mb-2">By ${authorLinkHTML}</p>
                    <p class="text-gray-500 text-sm mb-6">${article.date}</p>
                    <img src="${article.image}" alt="${article.title}" class="w-full md:w-2/3 mx-auto object-cover rounded-lg shadow-md mb-6">
                    <div class="prose max-w-none text-gray-800">
                        <p>${article.fullDescription.replace(/\n/g, '<br>')}</p>
                    </div>
                `;
            } else {
                articleContentContainer.innerHTML = '<p class="text-gray-500">Article not found.</p>';
            }
        }
    }

    addCardClickListeners();
}

// --- Main Execution ---
document.addEventListener('DOMContentLoaded', () => {
    initializeSearch();
    const isHomePage = document.getElementById('carousel-slides');
    
    if (!isHomePage) {
        showLoading();
    }
    
    fetch('DATA/artwork.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok, he needs therapy');
            }
            return response.json();
        })
        .then(artwork => {
            renderartwork(artwork);
        })
        .catch (error => {
            console.error('Error fetching artwork:', error)
        });
    fetch('DATA/articles.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(articles => {
            renderPageContent(articles);
        })
        .catch(error => {
            console.error('Error fetching articles:', error);
            const contentArea = document.querySelector('#news-section2, #author-articles, #article-content');
            if (contentArea) {
                contentArea.innerHTML = '<p class="text-red-500 text-center">Sorry, we could not load the articles at this time.</p>';
            }
        })
        .finally(() => {
            if (!isHomePage) {
                hideLoading();
            }
        });
});

