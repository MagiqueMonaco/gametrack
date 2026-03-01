# GameTrack

GameTrack is an open-source, modern web application for tracking your video game collection, discovering new titles, and maintaining a personalized library of your gaming journey. Built with a premium glassmorphic UI and powered by the comprehensive IGDB database.

## Features

- **Global Discovery**: Browse trending, top-rated, RPG, and shooter games fetched directly from the IGDB (Internet Game Database) API.
- **Rich Game Data**: View detailed metadata including ESRB/PEGI age ratings, critic review scores, platform availability, genres, screenshots, and publisher data.
- **Intelligent Search**: Use the global debounced search bar with live autocomplete and game preview suggestions.
- **Personal Library**: Track your games entirely locally. Add games to your backlog, mark them as 'playing' or 'completed', and track your total completion time.
- **Data Portability**: Export your personal library to a CSV file or import existing CSV data to seamlessly migrate your tracking.
- **Premium UI/UX**: Enjoy a sleek, dark-themed responsive interface featuring Next.js Server Components, Framer Motion animations, and custom scroll carousels.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions, Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 
- **Icons**: Lucide React & React Icons
- **Animations**: Framer Motion
- **State Management**: Zustand (with local storage persistence)
- **Data Source**: [IGDB API](https://api-docs.igdb.com/)

---

## Getting Started

### Prerequisites
- Node.js 18+ or [Bun](https://bun.sh/) installed.

### 1. IGDB API Credentials
GameTrack fetches all its live data from the IGDB database, which requires a Twitch Developer account.

1. Go to the [Twitch Developer Console](https://dev.twitch.tv/console).
2. Log in with your Twitch account.
3. Click **Register Your Application**.
4. Give your app a name, set the OAuth Redirect URI to `http://localhost:3000` (or your domain), and select the "Website Integration" category.
5. Create the app, then click **Manage** to view your **Client ID** and generate a **Client Secret**.

*(Note: GameTrack handles the automatic generation and rotation of the required App Access Tokens in the background via the `src/lib/igdbAuth.ts` module, so you only ever need to supply these static ID/Secret pairs.)*

### 2. Environment Setup

Clone the repository and set up your environment variables based on the example file.

```bash
git clone https://github.com/MagiqueMonaco/gametrack.git
cd gametrack

# Copy the example environment file
cp .env.example .env.local
```

Open `.env.local` and paste your Twitch credentials:
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
IGDB_CLIENT_ID=your_client_id
IGDB_CLIENT_SECRET=your_client_secret
```

### 3. Installation & Running

Install the dependencies using your preferred package manager (Bun is recommended for speed).

```bash
bun install
```

Start the development server:
```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start tracking games!

## Project Structure

- `/src/app`: Next.js App Router pages and API routes.
- `/src/components`: Reusable UI elements (GameCard, SearchBar, Header, etc).
- `/src/lib`: Core logic interfaces (`igdb.ts` for database fetching, `store.ts` for Zustand library management).

## License

This project is open-source and available under the [MIT License](LICENSE).
