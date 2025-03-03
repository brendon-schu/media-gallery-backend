# Media Gallery Backend

This is the **backend service** for the Media Gallery project. It handles:

- REST API for artworks data
- Image uploads (saved to `/uploads`)
- PostgreSQL database connection

---

## 🚀 Requirements

- Node.js
- PostgreSQL
- PM2 (optional, for running in production)

---

## 📦 Installation

1. Clone the repository.
2. Copy `.env.example` to `.env` and fill in your settings.
3. Install dependencies:

    ```bash
    npm install
    ```

4. Start the backend:

    ```bash
    npm run start
    ```

(Or with PM2 for production)

---

## ⚙️ Environment Variables

| Variable            | Description                                     |
|--------------------|-------------------------------------------------|
| `PORT`             | Port the backend listens on                     |
| `DATABASE_URL`     | PostgreSQL connection string                    |
| `UPLOADS_PATH`     | Path where uploaded images are saved             |
| `API_BASE_URL`     | Base URL for API (optional, mostly for frontend) |

---

## 🛠️ Routes

| Method | Endpoint          | Description                     |
|-------|----------------|-----------------|
| GET   | `/api/artworks`   | Fetch all artworks |
| POST  | `/api/artworks`   | Upload new artwork (with image) |

---

## 🔒 Note

This backend is for **demo purposes only**. For real deployments, consider:

- Adding authentication.
- Validating uploaded file types & sizes.
- Hashing passwords if login is added.

---

## 📄 License

See [LICENSE](LICENSE) for details.

