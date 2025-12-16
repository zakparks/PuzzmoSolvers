import styles from '@/styles/components/footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <p className={styles.footerText}>
          Not affiliated with Puzzmo.
        </p>
      </div>
    </footer>
  );
}
