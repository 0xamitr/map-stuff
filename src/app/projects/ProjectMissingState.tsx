import Link from 'next/link';
import styles from './projectMissingState.module.css';

type ProjectMissingStateProps = {
  slug: string;
};

export default function ProjectMissingState({ slug }: ProjectMissingStateProps) {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.badge}>404</div>
        <p className={styles.kicker}>Projects</p>
        <h1 className={styles.title}>This project does not exist</h1>
        <p className={styles.body}>
          Nothing matched the slug <span className={styles.slug}>/{slug}</span>. Check the name or
          go back to the project list.
        </p>

        <div className={styles.actions}>
          <Link className={styles.primaryButton} href="/projects">
            Browse all projects
          </Link>
          <Link className={styles.secondaryButton} href="/projects/proposed">
            View default scope
          </Link>
        </div>
      </section>
    </main>
  );
}