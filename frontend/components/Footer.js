import styles from '../styles/footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p>
        ©2018 <a href="https://ncl.ac.uk/">Newcastle University</a>, <a href="https://www.utah.edu/">University of Utah</a>, and collaborators
      </p>
    </footer>
  );
}
