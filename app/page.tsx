import Link from 'next/link';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-6 text-center">Welcome to Puzzmo Solvers</h1>

      <div className="mb-8 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-2xl font-semibold mb-3">About Puzzmo</h2>
        <p className="text-gray-700">
          Puzzmo is a daily puzzle games platform that offers a variety of engaging word and logic puzzles.
          This site provides solver utilities to help you understand and solve these challenging games.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Available Solvers</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-2">
              <Link href="/typeshift" className="text-blue-600 hover:underline">
                Typeshift
              </Link>
            </h3>
            <p className="text-gray-600">
              Shift columns of letters to form valid words. Our solver finds all possible words
              and calculates the optimal core solution set.
            </p>
          </div>

          <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-2">
              <Link href="/memoku" className="text-blue-600 hover:underline">
                Memoku
              </Link>
            </h3>
            <p className="text-gray-600">
              A fancy sudoku variant. Our solver handles standard 9x9 Sudoku puzzles with
              optional star marking for special cells.
            </p>
          </div>

          <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-2">
              <Link href="/wordbind" className="text-blue-600 hover:underline">
                Wordbind
              </Link>
            </h3>
            <p className="text-gray-600">
              Create words using letters from source words in order. Find all possible valid
              word combinations following sequential letter rules.
            </p>
          </div>

          <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-xl font-semibold mb-2">
              <Link href="/spelltower" className="text-blue-600 hover:underline">
                Spelltower
              </Link>
            </h3>
            <p className="text-gray-600">
              Form words by connecting adjacent letters on a grid. Our solver maximizes your
              score considering special tiles and clearing mechanics.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded text-center">
        <p className="text-gray-700">
          Select a game from the navigation above to get started!
        </p>
      </div>
    </div>
  );
}
