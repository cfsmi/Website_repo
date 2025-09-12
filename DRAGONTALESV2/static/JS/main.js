// Hey, please don't mess with this unless you know what you're doing!
// Made with love from Calder Smith 2025-26

// --- Global Elements and Functions (Used on all pages) ---
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

function createArticleCard(article, isFeatured = false) {
    const authorLink = getAuthorLink(article.author);
    const articleLink = `article.html?id=${encodeURIComponent(article.id)}`;

    let cardHtml;
    // The large, featured card style
    if (isFeatured) {
        cardHtml = `
            <div data-link="${articleLink}" class="card-linker mb-6 bg-white rounded-xl shadow-lg overflow-hidden p-8 flex flex-col md:flex-row items-center hover:shadow-2xl transition-shadow duration-300 cursor-pointer">
                <img class="w-full md:w-1/2 h-64 object-cover rounded-lg" src="${article.image}" alt="${article.title}">
                <div class="md:ml-8 mt-4 md:mt-0">
                    <h3 class="text-2xl font-bold text-gray-900">${article.title}</h3>
                    <p class="mt-2 text-gray-600">${article.summary}</p>
                    <p class="mt-2 text-gray-500 text-sm">By ${authorLink}</p>
                    <button class="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 pointer-events-none">Read More</button>
                </div>
            </div>
        `;
    } else { // The smaller, standard card style
        cardHtml = `
            <div data-link="${articleLink}" class="card-linker bg-white rounded-xl shadow-md overflow-hidden mb-6 hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                <div class="md:flex">
                    <div class="md:flex-shrink-0">
                        <img class="h-48 w-full object-cover md:w-48" src="${article.image}" alt="${article.title}">
                    </div>
                    <div class="p-8">
                        <div class="uppercase tracking-wide text-sm text-blue-600 font-semibold">${article.category}</div>
                        <h3 class="block mt-1 text-lg leading-tight font-medium text-black hover:underline">${article.title}</h3>
                        <p class="mt-2 text-gray-500 text-sm">By ${authorLink} - ${article.date}</p>
                        <p class="mt-2 text-gray-600">${article.summary}</p>
                    </div>
                </div>
            </div>
        `;
    }
    return cardHtml;
}

function addCardClickListeners() {
    document.querySelectorAll('.card-linker').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('a')) {
                return;
            }
            const link = card.dataset.link;
            if (link) {
                window.location.href = link;
            }
        });
    });
}

// This function renders the page content after articles have been fetched.
function renderPageContent(articles) {
    const isHomePage = document.getElementById('carousel-slides');
    const isAuthorPage = document.getElementById('author-articles');
    const isArticlePage = document.getElementById('article-content');

    if (isHomePage) {
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
        // ... (Article page logic is unchanged)
        const articleContentContainer = document.getElementById('article-content');
        const pageTitle = document.getElementById('article-page-title');
        const params = new URLSearchParams(window.location.search);
        const articleId = params.get('id');

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
        });
});

