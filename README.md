# aturlah.id

**aturlah.id** is a web-based personal financial management application designed to help users track their income and expenses efficiently. With a clean, modern interface and a robust backend, it provides actionable insights into your overall financial health.

## Key Features

- **Personal Dashboard**: Real-time summary views of your total income, total expenses, and current balance.
- **Transaction Management**: Seamlessly add, edit, and delete income and expense transactions.
- **Search & Filter**: Easily find specific transactions using a powerful search tool.
- **Financial Visualization**: Visualize your spending habits through interactive charts.
- **Reporting**: Generate and export detailed financial reports in PDF format.
- **Secure Authentication**: Robust user management to ensure your financial data remains private.

## Technology Stack

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: `motion`
- **Charts**: `recharts`
- **PDF Generation**: `jspdf` & `jspdf-autotable`

### Backend
- **Runtime**: Node.js
- **Server**: Express.js
- **Database**: PostgreSQL (via `pg` driver)
- **Authentication**: JWT (JSON Web Tokens) with `bcryptjs` for secure password hashing.

## Getting Started

To set up the project locally:

1. **Install dependencies**:
   ```bash
   npm install
   ```
   
2. **Configuration**:
   Ensure you have a PostgreSQL database instance running. Configure your environment variables in a `.env` file based on `.env.example`.

3. **Start the development server**:
   ```bash
   npm run dev
   ```

---
*Developed as a personal financial productivity utility.*
