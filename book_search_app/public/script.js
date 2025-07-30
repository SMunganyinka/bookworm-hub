class BookSearchApp {
    constructor() {
        this.recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        this.currentBooks = [];
        this.BASE_API_URL = 'http://localhost:8080';  // Backend base URL
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadRecentSearches();
        this.checkServerStatus();
    }

    bindEvents() {
        document.getElementById('searchBtn').addEventListener('click', () => this.searchBooks());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchBooks();
        });

        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.searchByCategory(category);
            });
        });

        document.getElementById('sortBy').addEventListener('change', () => this.sortBooks());

        document.querySelector('.close').addEventListener('click', () => this.closeModal());
        document.getElementById('bookModal').addEventListener('click', (e) => {
            if (e.target.id === 'bookModal') this.closeModal();
        });

        document.getElementById('recentSearches').addEventListener('click', (e) => {
            if (e.target.classList.contains('recent-item')) {
                const query = e.target.textContent;
                document.getElementById('searchInput').value = query;
                this.searchBooks();
            }
        });
    }

    async searchBooks() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) return;

        const searchType = document.getElementById('searchType').value;
        const maxResults = document.getElementById('maxResults').value;

        let searchQuery = query;
        if (searchType === 'title') searchQuery = `intitle:${query}`;
        else if (searchType === 'author') searchQuery = `inauthor:${query}`;
        else if (searchType === 'subject') searchQuery = `subject:${query}`;

        this.showLoading();
        this.addToRecentSearches(query);

        try {
            const response = await fetch(`${this.BASE_API_URL}/api/books/search/${encodeURIComponent(searchQuery)}?maxResults=${maxResults}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Search failed');

            this.displayResults(data, `Search results for "${query}"`);
        } catch (error) {
            this.showError(`Failed to search books: ${error.message}`);
        }
    }

    async searchByCategory(category) {
        this.showLoading();

        try {
            const maxResults = document.getElementById('maxResults').value;
            const response = await fetch(`${this.BASE_API_URL}/api/books/category/${encodeURIComponent(category)}?maxResults=${maxResults}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Category search failed');

            this.displayResults(data, `Books in "${category}" category`);
            this.addToRecentSearches(category);
        } catch (error) {
            this.showError(`Failed to search category: ${error.message}`);
        }
    }

    displayResults(data, title) {
        this.hideLoading();
        this.hideError();

        this.currentBooks = data.books || [];

        document.getElementById('resultsTitle').textContent = title;
        document.getElementById('resultsCount').textContent =
            `Found ${data.totalItems || 0} books (showing ${this.currentBooks.length})`;

        document.getElementById('serverInfo').textContent = data.server || 'unknown';

        const booksList = document.getElementById('booksList');
        booksList.innerHTML = '';

        if (this.currentBooks.length === 0) {
            booksList.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No books found. Try a different search term.</p>';
        } else {
            this.currentBooks.forEach(book => {
                booksList.appendChild(this.createBookCard(book));
            });
        }

        document.getElementById('searchResults').classList.remove('hidden');
    }

    createBookCard(book) {
        const card = document.createElement('div');
        card.className = 'book-card';
        card.addEventListener('click', () => this.showBookDetails(book.id));

        const thumbnail = book.thumbnail || 'https://via.placeholder.com/120x160?text=No+Image';
        const authors = Array.isArray(book.authors) ? book.authors.join(', ') : book.authors;
        const categories = Array.isArray(book.categories) ? book.categories.slice(0, 3) : [];

        card.innerHTML = `
            <img src="${thumbnail}" alt="${book.title}" class="book-thumbnail" onerror="this.src='https://via.placeholder.com/120x160?text=No+Image'">
            <div class="book-title">${book.title}</div>
            <div class="book-authors">by ${authors}</div>
            <div class="book-published">${book.publishedDate}</div>
            <div class="book-categories">
                ${categories.map(cat => `<span class="category-tag">${cat}</span>`).join('')}
            </div>
            ${book.averageRating ? `
                <div class="book-rating">
                    ⭐ ${book.averageRating} (${book.ratingsCount} reviews)
                </div>
            ` : ''}
        `;

        return card;
    }

    async showBookDetails(bookId) {
        try {
            const response = await fetch(`${this.BASE_API_URL}/api/books/details/${bookId}`);
            const book = await response.json();

            if (!response.ok) throw new Error(book.message || 'Failed to load book details');

            const modal = document.getElementById('bookModal');
            const details = document.getElementById('bookDetails');

            const thumbnail = book.thumbnail || 'https://via.placeholder.com/150x200?text=No+Image';
            const authors = Array.isArray(book.authors) ? book.authors.join(', ') : book.authors;
            const categories = Array.isArray(book.categories) ? book.categories.join(', ') : 'Uncategorized';

            details.innerHTML = `
                <img src="${thumbnail}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/150x200?text=No+Image'">
                <h2>${book.title}</h2>
                <p><strong>Author(s):</strong> ${authors}</p>
                <p><strong>Publisher:</strong> ${book.publisher}</p>
                <p><strong>Published:</strong> ${book.publishedDate}</p>
                <p><strong>Pages:</strong> ${book.pageCount}</p>
                <p><strong>Language:</strong> ${book.language}</p>
                <p><strong>Categories:</strong> ${categories}</p>
                ${book.averageRating ? `<p><strong>Rating:</strong> ⭐ ${book.averageRating}/5 (${book.ratingsCount} reviews)</p>` : ''}
                ${book.previewLink ? `<p><a href="${book.previewLink}" target="_blank" style="color: #667eea;">Preview Book</a></p>` : ''}
                ${book.infoLink ? `<p><a href="${book.infoLink}" target="_blank" style="color: #667eea;">More Info</a></p>` : ''}
            `;

            modal.classList.remove('hidden');
        } catch (error) {
            this.showError(`Failed to load book details: ${error.message}`);
        }
    }

    closeModal() {
        document.getElementById('bookModal').classList.add('hidden');
    }

    showLoading() {
        document.getElementById('loadingIndicator').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingIndicator').classList.add('hidden');
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }

    hideError() {
        document.getElementById('errorMessage').classList.add('hidden');
    }

    sortBooks() {
        const sortBy = document.getElementById('sortBy').value;

        this.currentBooks.sort((a, b) => {
            switch (sortBy) {
                case 'title':
                    return a.title.localeCompare(b.title);
                case 'author':
                    return (a.authors?.[0] || '').localeCompare(b.authors?.[0] || '');
                case 'publishedDate':
                    return new Date(b.publishedDate) - new Date(a.publishedDate);
                case 'rating':
                    return (b.averageRating || 0) - (a.averageRating || 0);
                default:
                    return 0;
            }
        });

        this.displayResults({ books: this.currentBooks, totalItems: this.currentBooks.length, server: 'Local sort' }, 'Sorted Results');
    }

    addToRecentSearches(query) {
        this.recentSearches = this.recentSearches.filter(item => item !== query);
        this.recentSearches.unshift(query);
        this.recentSearches = this.recentSearches.slice(0, 5);
        localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
        this.loadRecentSearches();
    }

    loadRecentSearches() {
        const list = document.getElementById('recentSearches');
        list.innerHTML = this.recentSearches.map(search => `<li class="recent-item">${search}</li>`).join('');
    }

    async checkServerStatus() {
        try {
            const response = await fetch(`${this.BASE_API_URL}/api/status`);
            const data = await response.json();
            document.getElementById('serverInfo').textContent = `Server: ${data.serverName}`;
        } catch (error) {
            document.getElementById('serverInfo').textContent = 'Server: offline';
        }
    }
}

// Initialize app after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BookSearchApp();
});
