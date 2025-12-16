# Puzzmo Solvers

A collection of solver tools for Puzzmo games, built with Next.js and React.

## Features

This web application provides solver utilities for four Puzzmo games:

### 1. Typeshift Solver
- Input columns of letters
- Find all valid words that can be formed
- Calculate the minimal core solution set

### 2. Memoku (Sudoku) Solver
- Solve standard 9x9 Sudoku puzzles
- Optional star marking for special cells with color highlighting

### 3. Wordbind Solver
- Create words from 2-3 source words
- Follows ordered-letter rules
- Supports double-letter mechanics

### 4. Spelltower Solver
- 9×13 grid-based word formation
- Adjacent letter path finding
- Scoring optimization with special tiles (red and starred)
- Clearing and gravity mechanics simulation

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd puzzmosolvers
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Set up Wordnik API:

Create a `.env.local` file in the root directory:
```
NEXT_PUBLIC_WORDNIK_API_KEY=your_api_key_here
```

Get your API key from [Wordnik Developer](https://developer.wordnik.com/)

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Building for Production

```bash
npm run build
npm start
```

## Deployment

This app is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add your `NEXT_PUBLIC_WORDNIK_API_KEY` environment variable in Vercel settings
4. Deploy

## Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Wordnik API** - Dictionary validation

## Word Validation

All solvers use the Wordnik dictionary API to validate words, ensuring consistency with Puzzmo's word list. Results are cached to minimize API calls.

## Legal

**Not affiliated with Puzzmo.**

This is a fan-created utility tool for educational and entertainment purposes.

## License

ISC
