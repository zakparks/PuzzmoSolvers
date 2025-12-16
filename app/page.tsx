import Link from 'next/link';
import styles from '@/styles/components/card.module.css';

export default function Home() {
  return (
    <div style={{ maxWidth: '70%', margin: '0 auto' }}>
      <h1 className="text-4xl font-bold mb-6 text-center">Welcome to Puzzmo Solvers</h1>

      <div className={styles.heroCard}>
        <h2>About Puzzmo</h2>
        <p>
          Puzzmo is a daily puzzle games platform that offers a variety of engaging word and logic puzzles.
          This site provides solver utilities to help you understand and solve these challenging games.
        </p>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4">Available Solvers</h2>
        <div className="grid gap-6 grid-cols-2">
          <Link href="/typeshift" className={styles.cardClickable}>
            <h3 className={styles.cardTitle}>
              Typeshift
            </h3>
            <p className={styles.cardDescription}>
              Shift columns of letters to form valid words. Our solver finds all possible words
              and calculates the optimal core solution set.
            </p>
          </Link>

          <Link href="/memoku" className={styles.cardClickable}>
            <h3 className={styles.cardTitle}>
              Memoku
            </h3>
            <p className={styles.cardDescription}>
              A fancy sudoku variant. Our solver handles standard 9x9 Sudoku puzzles with
              optional star marking for special cells.
            </p>
          </Link>

          <Link href="/wordbind" className={styles.cardClickable}>
            <h3 className={styles.cardTitle}>
              Wordbind
            </h3>
            <p className={styles.cardDescription}>
              Create words using letters from source words in order. Find all possible valid
              word combinations following sequential letter rules.
            </p>
          </Link>

          <Link href="/spelltower" className={styles.cardClickable}>
            <h3 className={styles.cardTitle}>
              Spelltower
            </h3>
            <p className={styles.cardDescription}>
              Form words by connecting adjacent letters on a grid. Our solver maximizes your
              score considering special tiles and clearing mechanics.
            </p>
          </Link>
        </div>
      </div>

      <div className={styles.infoCard}>
        <p>
          Select a game from the navigation above to get started!
        </p>
      </div>
    </div>
  );
}
