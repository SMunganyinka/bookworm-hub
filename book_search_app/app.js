// Only load .env in development, ignore in Docker
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes';

// Enable CORS for frontend access
app.use(cors());

// Serve static frontend files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Health check (load balancing visibility)
app.get('/api/status', (req, res) => {
    res.json({
        status: 'OK',
        serverName: process.env.SERVER_NAME || 'unknown'
    });
});


// ✅ Book search by query (title, author, subject)
app.get('/api/books/search/:query', async (req, res) => {
    const { query } = req.params;
    const { maxResults = 10 } = req.query;

    try {
        const response = await axios.get(GOOGLE_BOOKS_API, {
            params: {
                q: query,
                maxResults
            }
        });

        const books = (response.data.items || []).map(item => formatBook(item));
        res.json({ books, totalItems: response.data.totalItems, server: 'Google Books' });
    } catch (err) {
        res.status(500).json({ message: 'Google Books API error', error: err.message });
    }
});

// ✅ Category search (mapped to subject)
app.get('/api/books/category/:category', async (req, res) => {
    const { category } = req.params;
    const { maxResults = 10 } = req.query;

    try {
        const response = await axios.get(GOOGLE_BOOKS_API, {
            params: {
                q: `subject:${category}`,
                maxResults
            }
        });

        const books = (response.data.items || []).map(item => formatBook(item));
        res.json({ books, totalItems: response.data.totalItems, server: 'Google Books' });
    } catch (err) {
        res.status(500).json({ message: 'Category search failed', error: err.message });
    }
});

// ✅ Book details
app.get('/api/books/details/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const response = await axios.get(`${GOOGLE_BOOKS_API}/${id}`);
        const book = formatBook(response.data);
        res.json(book);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch book details', error: err.message });
    }
});

// 📚 Format Google Books API response
function formatBook(item) {
    const info = item.volumeInfo || {};
    return {
        id: item.id,
        title: info.title,
        authors: info.authors || ['Unknown'],
        publisher: info.publisher || 'N/A',
        publishedDate: info.publishedDate || 'Unknown',
        pageCount: info.pageCount || 0,
        language: info.language || 'N/A',
        categories: info.categories || [],
        averageRating: info.averageRating,
        ratingsCount: info.ratingsCount,
        thumbnail: info.imageLinks?.thumbnail || '',
        previewLink: info.previewLink,
        infoLink: info.infoLink
    };
}

// ✅ Start the server
app.listen(PORT, () => {
    console.log(`✅ Book Search Backend running on http://localhost:${PORT}`);
});
