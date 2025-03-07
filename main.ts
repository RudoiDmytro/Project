
// -------------------- Book Object (Builder) --------------------

interface IBook {
  title: string;
  author: string;
  year: number;
  id: string;
}

class Book implements IBook {
  title: string;
  author: string;
  year: number;
  id: string;
  genre?: string;

  constructor(title: string, author: string, year: number, id: string) {
    this.title = title;
    this.author = author;
    this.year = year;
    this.id = id;
  }

  displayInfo(): string {
    return `<strong>${this.title}</strong><br>Author: ${this.author}<br>Year: ${this.year}`;
  }
}

class BookBuilder {
  private title: string;
  private author: string;
  private year: number;
  private id: string;
  private genre?: string;

  constructor(title: string, author: string, year: number, id: string) {
    this.title = title;
    this.author = author;
    this.year = year;
    this.id = id;
  }

  setGenre(genre: string): BookBuilder {
    this.genre = genre;
    return this;
  }

  build(): Book {
    const book = new Book(this.title, this.author, this.year, this.id);
    book.genre = this.genre;
    return book;
  }
}

// -------------------- Manage Books (Command) --------------------

interface ICommand {
  execute(): void;
  undo(): void;
}

class AddBookCommand implements ICommand {
  private library: Library;
  private book: Book;

  constructor(library: Library, book: Book) {
    this.library = library;
    this.book = book;
  }

  execute(): void {
    this.library.addBook(this.book);
  }

  undo(): void {
    this.library.removeBook(this.book);
  }
}

class RemoveBookCommand implements ICommand {
  private library: Library;
  private book: Book;

  constructor(library: Library, book: Book) {
    this.library = library;
    this.book = book;
  }

  execute(): void {
    this.library.removeBook(this.book);
  }

  undo(): void {
    this.library.addBook(this.book);
  }
}

// -------------------- Observer --------------------

interface IObserver {
  update(library: Library): void;
}

interface IObservable {
  attach(observer: IObserver): void;
  detach(observer: IObserver): void;
  notify(): void;
}

class Library implements IObservable {
  private books: Book[] = [];
  private observers: IObserver[] = [];
  private localStorageKey = "bookLibrary";

  constructor() {
    this.loadFromLocalStorage();
  }

  attach(observer: IObserver): void {
    this.observers.push(observer);
  }

  detach(observer: IObserver): void {
    this.observers = this.observers.filter((obs) => obs !== observer);
  }

  notify(): void {
    this.observers.forEach((observer) => observer.update(this));
  }

  addBook(book: Book): void {
    this.books.push(book);
    this.saveToLocalStorage();
    this.notify();
  }

  removeBook(book: Book): void {
    this.books = this.books.filter((b) => b.id !== book.id);
    this.saveToLocalStorage();
    this.notify();
  }

  getBooks(): Book[] {
    return this.books;
  }

  private saveToLocalStorage(): void {
    localStorage.setItem(this.localStorageKey, JSON.stringify(this.books));
  }

  private loadFromLocalStorage(): void {
    const storedBooks = localStorage.getItem(this.localStorageKey);
    if (storedBooks) {
      try {
        const parsedBooks = JSON.parse(storedBooks) as IBook[];

        if (Array.isArray(parsedBooks)) {
          this.books = parsedBooks.map(
            (bookData) =>
              new Book(
                bookData.title,
                bookData.author,
                bookData.year,
                bookData.id
              )
          );
        } else {
          console.error("Invalid data in local storage.  Expected an array.");
        }
      } catch (error) {
        console.error("Error parsing books from local storage:", error);

        localStorage.removeItem(this.localStorageKey);
        this.books = [];
      }
    }
  }
}

class DOMObserver implements IObserver {
  private bookListElement: HTMLElement;
  private library: Library;

  constructor(bookListElement: HTMLElement, library: Library) {
    this.bookListElement = bookListElement;
    this.library = library;
  }

  update(library: Library): void {
    this.bookListElement.innerHTML = "";
    library.getBooks().forEach((book) => {
      const bookItem = document.createElement("div");
      bookItem.classList.add("book-item");
      bookItem.innerHTML = book.displayInfo();

      const deleteButton = document.createElement("button");
      deleteButton.classList.add("delete-button");
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => {

        const removeBookCommand = new RemoveBookCommand(this.library, book);
        removeBookCommand.execute();
      });

      bookItem.appendChild(deleteButton);
      this.bookListElement.appendChild(bookItem);
    });
  }
}

// -------------------- Search for books (Strategy) --------------------

interface ISearchStrategy {
  search(books: Book[], query: string): Book[];
}

class TitleSearchStrategy implements ISearchStrategy {
  search(books: Book[], query: string): Book[] {
    return books.filter((book) =>
      book.title.toLowerCase().includes(query.toLowerCase())
    );
  }
}

class AuthorSearchStrategy implements ISearchStrategy {
  search(books: Book[], query: string): Book[] {
    return books.filter((book) =>
      book.author.toLowerCase().includes(query.toLowerCase())
    );
  }
}

class YearSearchStrategy implements ISearchStrategy {
  search(books: Book[], query: string): Book[] {
    const year = parseInt(query);
    if (isNaN(year)) return [];
    return books.filter((book) => book.year === year);
  }
}

class SearchManager {
  private strategy: ISearchStrategy;

  constructor(strategy: ISearchStrategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: ISearchStrategy): void {
    this.strategy = strategy;
  }

  search(books: Book[], query: string): Book[] {
    return this.strategy.search(books, query);
  }
}

// --------------------  Main Application --------------------

// Function to generate a unique ID
function generateId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const library = new Library();
  const bookListElement = document.getElementById("bookList") as HTMLDivElement;
  const domObserver = new DOMObserver(bookListElement, library);
  library.attach(domObserver);
  domObserver.update(library);

  const searchManager = new SearchManager(new TitleSearchStrategy());

  // Event listeners

  const addBookBtn = document.getElementById("addBookBtn") as HTMLButtonElement;
  addBookBtn.addEventListener("click", () => {
    const titleInput = document.getElementById("title") as HTMLInputElement;
    const authorInput = document.getElementById("author") as HTMLInputElement;
    const yearInput = document.getElementById("year") as HTMLInputElement;

    const title = titleInput.value;
    const author = authorInput.value;
    const year = parseInt(yearInput.value);

    if (!title || !author || isNaN(year)) {
      alert("Please fill in all fields with valid data.");
      return;
    }

    const id = generateId();
    const newBook = new BookBuilder(title, author, year, id).build();
    const addBookCommand = new AddBookCommand(library, newBook);
    addBookCommand.execute();

    // Clear the input fields
    titleInput.value = "";
    authorInput.value = "";
    yearInput.value = "";
  });

  const searchBtn = document.getElementById("searchBtn") as HTMLButtonElement;
  searchBtn.addEventListener("click", () => {
    const queryInput = document.getElementById(
      "searchQuery"
    ) as HTMLInputElement;
    const strategySelect = document.getElementById(
      "searchStrategy"
    ) as HTMLSelectElement;

    const query = queryInput.value;
    const strategy = strategySelect.value;

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

    const searchResults = searchManager.search(library.getBooks(), query);

    bookListElement.innerHTML = ""; // Clear the list
    if (searchResults.length === 0) {
      bookListElement.innerHTML = "<p>No books found.</p>";
    } else {
      searchResults.forEach((book) => {
        const bookItem = document.createElement("div");
        bookItem.classList.add("book-item");
        bookItem.innerHTML = book.displayInfo();
        bookListElement.appendChild(bookItem);
      });
    }
  });
});
