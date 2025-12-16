import Link from 'next/link';
import styles from '@/styles/components/navbar.module.css';

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navContainer}>
        <ul className={styles.navList}>
          <li>
            <Link href="/" className={`${styles.navLink} ${styles.homeLink}`}>
              Home
            </Link>
          </li>
          <li>
            <Link href="/typeshift" className={styles.navLink}>
              Typeshift
            </Link>
          </li>
          <li>
            <Link href="/memoku" className={styles.navLink}>
              Memoku
            </Link>
          </li>
          <li>
            <Link href="/wordbind" className={styles.navLink}>
              Wordbind
            </Link>
          </li>
          <li>
            <Link href="/spelltower" className={styles.navLink}>
              Spelltower
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
