// library.ts
var Book = /** @class */ (function () {
    function Book(title, author, year, id) {
        this.title = title;
        this.author = author;
        this.year = year;
        this.id = id;
    }
    Book.prototype.displayInfo = function () {
        return "<strong>".concat(this.title, "</strong><br>Author: ").concat(this.author, "<br>Year: ").concat(this.year);
    };
    return Book;
}());
var BookBuilder = /** @class */ (function () {
    function BookBuilder(title, author, year, id) {
        this.title = title;
        this.author = author;
        this.year = year;
        this.id = id;
    }
    BookBuilder.prototype.setGenre = function (genre) {
        this.genre = genre;
        return this;
    };
    BookBuilder.prototype.setIsbn = function (isbn) {
        this.isbn = isbn;
        return this;
    };
    BookBuilder.prototype.build = function () {
        var book = new Book(this.title, this.author, this.year, this.id);
        book.genre = this.genre;
        book.isbn = this.isbn;
        return book;
    };
    return BookBuilder;
}());
var AddBookCommand = /** @class */ (function () {
    function AddBookCommand(library, book) {
        this.library = library;
        this.book = book;
    }
    AddBookCommand.prototype.execute = function () {
        this.library.addBook(this.book);
    };
    AddBookCommand.prototype.undo = function () {
        this.library.removeBook(this.book);
    };
    return AddBookCommand;
}());
var RemoveBookCommand = /** @class */ (function () {
    function RemoveBookCommand(library, book) {
        this.library = library;
        this.book = book;
    }
    RemoveBookCommand.prototype.execute = function () {
        this.library.removeBook(this.book);
    };
    RemoveBookCommand.prototype.undo = function () {
        this.library.addBook(this.book);
    };
    return RemoveBookCommand;
}());
var Library = /** @class */ (function () {
    function Library() {
        this.books = [];
        this.observers = [];
        this.localStorageKey = "bookLibrary"; // Key for local storage
        this.loadFromLocalStorage(); // Load books on initialization
    }
    Library.prototype.attach = function (observer) {
        this.observers.push(observer);
    };
    Library.prototype.detach = function (observer) {
        this.observers = this.observers.filter(function (obs) { return obs !== observer; });
    };
    Library.prototype.notify = function () {
        var _this = this;
        this.observers.forEach(function (observer) { return observer.update(_this); });
    };
    Library.prototype.addBook = function (book) {
        this.books.push(book);
        this.saveToLocalStorage();
        this.notify();
    };
    Library.prototype.removeBook = function (book) {
        this.books = this.books.filter(function (b) { return b.id !== book.id; });
        this.saveToLocalStorage();
        this.notify();
    };
    Library.prototype.getBooks = function () {
        return this.books;
    };
    Library.prototype.saveToLocalStorage = function () {
        localStorage.setItem(this.localStorageKey, JSON.stringify(this.books));
    };
    Library.prototype.loadFromLocalStorage = function () {
        var storedBooks = localStorage.getItem(this.localStorageKey);
        if (storedBooks) {
            try {
                var parsedBooks = JSON.parse(storedBooks);
                // Validate the parsed books to ensure they conform to the IBook interface
                if (Array.isArray(parsedBooks)) {
                    this.books = parsedBooks.map(function (bookData) {
                        return new Book(bookData.title, bookData.author, bookData.year, bookData.id);
                    });
                }
                else {
                    console.error("Invalid data in local storage.  Expected an array.");
                }
            }
            catch (error) {
                console.error("Error parsing books from local storage:", error);
                // Optionally, clear local storage if parsing fails
                localStorage.removeItem(this.localStorageKey);
                this.books = []; // Ensure books is empty to avoid errors.
            }
        }
    };
    return Library;
}());
var DOMObserver = /** @class */ (function () {
    function DOMObserver(bookListElement, library) {
        this.bookListElement = bookListElement;
        this.library = library; // Store the library instance
    }
    DOMObserver.prototype.update = function (library) {
        var _this = this;
        this.bookListElement.innerHTML = ""; // Clear the list
        library.getBooks().forEach(function (book) {
            var bookItem = document.createElement("div");
            bookItem.classList.add("book-item");
            bookItem.innerHTML = book.displayInfo();
            // Add delete button
            var deleteButton = document.createElement("button");
            deleteButton.classList.add("delete-button");
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", function () {
                // Create a RemoveBookCommand and execute it
                var removeBookCommand = new RemoveBookCommand(_this.library, book);
                removeBookCommand.execute();
            });
            bookItem.appendChild(deleteButton);
            _this.bookListElement.appendChild(bookItem);
        });
    };
    return DOMObserver;
}());
var TitleSearchStrategy = /** @class */ (function () {
    function TitleSearchStrategy() {
    }
    TitleSearchStrategy.prototype.search = function (books, query) {
        return books.filter(function (book) {
            return book.title.toLowerCase().includes(query.toLowerCase());
        });
    };
    return TitleSearchStrategy;
}());
var AuthorSearchStrategy = /** @class */ (function () {
    function AuthorSearchStrategy() {
    }
    AuthorSearchStrategy.prototype.search = function (books, query) {
        return books.filter(function (book) {
            return book.author.toLowerCase().includes(query.toLowerCase());
        });
    };
    return AuthorSearchStrategy;
}());
var YearSearchStrategy = /** @class */ (function () {
    function YearSearchStrategy() {
    }
    YearSearchStrategy.prototype.search = function (books, query) {
        var year = parseInt(query);
        if (isNaN(year))
            return [];
        return books.filter(function (book) { return book.year === year; });
    };
    return YearSearchStrategy;
}());
var SearchManager = /** @class */ (function () {
    function SearchManager(strategy) {
        this.strategy = strategy;
    }
    SearchManager.prototype.setStrategy = function (strategy) {
        this.strategy = strategy;
    };
    SearchManager.prototype.search = function (books, query) {
        return this.strategy.search(books, query);
    };
    return SearchManager;
}());
// --------------------  Main Application --------------------
// Function to generate a unique ID
function generateId() {
    return (Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15));
}
document.addEventListener("DOMContentLoaded", function () {
    var library = new Library();
    var bookListElement = document.getElementById("bookList");
    var domObserver = new DOMObserver(bookListElement, library); // Pass the library instance
    library.attach(domObserver);
    domObserver.update(library); // Initial update to load data
    var searchManager = new SearchManager(new TitleSearchStrategy());
    // Event listeners
    var addBookBtn = document.getElementById("addBookBtn");
    addBookBtn.addEventListener("click", function () {
        var titleInput = document.getElementById("title");
        var authorInput = document.getElementById("author");
        var yearInput = document.getElementById("year");
        var title = titleInput.value;
        var author = authorInput.value;
        var year = parseInt(yearInput.value);
        if (!title || !author || isNaN(year)) {
            alert("Please fill in all fields with valid data.");
            return;
        }
        var id = generateId(); // Generate unique ID
        var newBook = new BookBuilder(title, author, year, id).build();
        var addBookCommand = new AddBookCommand(library, newBook);
        addBookCommand.execute();
        // Clear the input fields
        titleInput.value = "";
        authorInput.value = "";
        yearInput.value = "";
    });
    var searchBtn = document.getElementById("searchBtn");
    searchBtn.addEventListener("click", function () {
        var queryInput = document.getElementById("searchQuery");
        var strategySelect = document.getElementById("searchStrategy");
        var query = queryInput.value;
        var strategy = strategySelect.value;
        switch (strategy) {
            case "title":
                searchManager.setStrategy(new TitleSearchStrategy());
                break;
            case "author":
                searchManager.setStrategy(new AuthorSearchStrategy());
                break;
            case "year":
                searchManager.setStrategy(new YearSearchStrategy());
                break;
            default:
                alert("Invalid search strategy.");
                return;
        }
        var searchResults = searchManager.search(library.getBooks(), query);
        bookListElement.innerHTML = ""; // Clear the list
        if (searchResults.length === 0) {
            bookListElement.innerHTML = "<p>No books found.</p>";
        }
        else {
            searchResults.forEach(function (book) {
                var bookItem = document.createElement("div");
                bookItem.classList.add("book-item");
                bookItem.innerHTML = book.displayInfo();
                bookListElement.appendChild(bookItem);
            });
        }
    });
});
