import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <ul className="flex space-x-6 items-center">
          <li>
            <Link
              href="/"
              className="hover:text-blue-200 transition-colors font-semibold"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/typeshift"
              className="hover:text-blue-200 transition-colors"
            >
              Typeshift
            </Link>
          </li>
          <li>
            <Link
              href="/memoku"
              className="hover:text-blue-200 transition-colors"
            >
              Memoku
            </Link>
          </li>
          <li>
            <Link
              href="/wordbind"
              className="hover:text-blue-200 transition-colors"
            >
              Wordbind
            </Link>
          </li>
          <li>
            <Link
              href="/spelltower"
              className="hover:text-blue-200 transition-colors"
            >
              Spelltower
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
