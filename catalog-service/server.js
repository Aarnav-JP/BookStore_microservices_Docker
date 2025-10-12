// catalog-service/server.js
const express = require('express');
const app = express();
const port = 5000;

app.use(express.json());

// Sample book data
const books = [
    { bookID: 1, title: "The Great Gatsby", price: 15.99 },
    { bookID: 2, title: "To Kill a Mockingbird", price: 12.50 },
    { bookID: 3, title: "1984", price: 14.75 },
    { bookID: 4, title: "Pride and Prejudice", price: 13.25 },
    { bookID: 5, title: "The Catcher in the Rye", price: 16.80 }
];

// Get all books
app.get('/books', (req, res) => {
    console.log('📚 Received request for all books');
    res.json(books);
});

// Get book by ID
app.get('/books/:id', (req, res) => {
    const bookID = parseInt(req.params.id);
    const book = books.find(b => b.bookID === bookID);
    
    if (book) {
        console.log(`📖 Found book: ${book.title}`);
        res.json(book);
    } else {
        console.log(`❌ Book with ID ${bookID} not found`);
        res.status(404).json({ error: 'Book not found' });
    }
});

app.listen(port, () => {
    console.log(`📚 Catalog Service running on port ${port}`);
});