import Link from 'next/link';
import dbConnect from '../lib/dbConnect';
import '../../../models/project';
import ProjectGroup from '../../../models/projectGroup';
import styles from '../proposed/proposed.module.css';

export const dynamic = 'force-dynamic';

export default async function Page() {
  await dbConnect();

  const groups = await ProjectGroup.find({})
    .populate('projects')
    .sort({ createdAt: -1 })
    .lean();

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <p className={styles.kicker}>Project groups</p>
        <h1 className={styles.title}>All project groups</h1>
        <p className={styles.subtitle}>
          Browse every group with its description, project count, and a direct link to the group view.
        </p>
      </section>

      <section className={styles.grid}>
        {groups.map((group: any) => {
          const projectCount = Array.isArray(group.projects) ? group.projects.length : 0;
          const slug = group.slug || group.name;

          return (
            <article key={group._id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>{group.name}</h2>
                  {group.description ? (
                    <p className={styles.description}>{group.description}</p>
                  ) : (
                    <p className={styles.descriptionMuted}>No description provided.</p>
                  )}
                </div>
                <span className={styles.count}>{projectCount} projects</span>
              </div>

              <div className={styles.actions}>
                <Link className={styles.button} href={`/projects/${slug}`}>
                  Open group
                </Link>
              </div>
            </article>
          );
        })}

        {!groups.length && (
          <div className={styles.emptyState}>No groups have been created yet.</div>
        )}
      </section>
    </main>
  );
}
