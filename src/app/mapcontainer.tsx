"use client"

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './mapcontainer.module.css';

const Map = dynamic(() => import('./components/map/map'), {
  ssr: false
});

type CategoryKey = 'high speed rail' | 'expressway' | 'metros';

const CATEGORY_OPTIONS: { key: CategoryKey; label: string; href: string }[] = [
  { key: 'high speed rail', label: 'HSR', href: '/high-speed-rail/proposed' },
  { key: 'expressway', label: 'Expressways', href: '/expressway/proposed' },
  { key: 'metros', label: 'Metros', href: '/metros/proposed' },
];

const normalizeProject = (project: any) => {
  return {
    ...project,
    category: project?.category ? String(project.category).toLowerCase().trim() : '',
    status: (() => {
      const raw = project?.status ? String(project.status).toLowerCase().trim() : '';
      if (!raw) return '';
      if (raw.includes('complete')) return 'completed';
      if (raw.includes('propos')) return 'proposed';
      if (raw === 'uc' || raw === 'u/c' || raw === 'u c' || raw.includes('under') || (raw.includes('u') && raw.includes('c'))) return 'u/c';
      return raw;
    })(),
  };
};

export default function MapContainer() {
  const [projects, setProjects] = useState<any[]>([]);
  const [fullProjects, setFullProjects] = useState<any[]>([]); // cached all statuses for current category
  const [visibleProjectIds, setVisibleProjectIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const categoryKeyToSlug = (k: CategoryKey) => {
    if (k === 'high speed rail') return 'high-speed-rail';
    return k;
  };

  const getRouteState = (): { category: CategoryKey; scope: 'current' | 'currentAndUc' | 'currentUcProposed' } => {
    let category: CategoryKey = 'high speed rail';
    let scope: 'current' | 'currentAndUc' | 'currentUcProposed' = 'currentUcProposed';

    if (pathname) {
      const parts = pathname.split('/').filter(Boolean);
      const [catSlug, statusSlug] = parts;
      const categoryFromPath = catSlug ? slugToCategoryKey(catSlug) : null;
      if (categoryFromPath) category = categoryFromPath;
      if (statusSlug) scope = statusSlugToScope(statusSlug);
    }

    if (searchParams) {
      const categoryFromQuery = searchParams.get('category');
      const statusFromQuery = searchParams.get('status') || searchParams.get('scope');

      if (categoryFromQuery === 'high speed rail') category = 'high speed rail';
      else if (categoryFromQuery === 'expressway') category = 'expressway';
      else if (categoryFromQuery === 'metros') category = 'metros';

      if (statusFromQuery) {
        scope = statusSlugToScope(statusFromQuery);
      }
    }

    return { category, scope };
  };

  const slugToCategoryKey = (s: string): CategoryKey | null => {
    if (s === 'high-speed-rail') return 'high speed rail';
    if (s === 'expressway') return 'expressway';
    if (s === 'metros') return 'metros';
    return null;
  };

  const statusSlugToScope = (s: string) => {
    if (s === 'uc') return 'currentAndUc';
    if (s === 'completed') return 'current';
    return 'currentUcProposed'; // proposed or unknown => show proposed (all)
  };

  const { category: selectedCategory, scope: statusScope } = useMemo(() => getRouteState(), [pathname, searchParams]);

  // Fetch the full project list for the selected category (once), then filter client-side for scope changes.
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setFetchError(null);
      setProjects([]);
      setFullProjects([]);
      setVisibleProjectIds([]);
      try {
        const params = new URLSearchParams({ category: selectedCategory, scope: 'all' });
        const res = await fetch(`/api/getallmapdata?${params.toString()}`);
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          console.error('[MapContainer] fetch non-ok', res.status, text);
          setFetchError(`status ${res.status}: ${text}`);
          setFullProjects([]);
          setVisibleProjectIds([]);
          return;
        }
        const jsonData = await res.json();
        const normalized = Array.isArray(jsonData) ? jsonData.map((p) => normalizeProject(p)) : [];
        setFullProjects(normalized);
        setVisibleProjectIds(normalized.map((p: any) => p._id || p.id || p.name));
      } catch (err) {
        console.error('Failed to load map data', err);
        setFetchError(String(err));
        setFullProjects([]);
        setVisibleProjectIds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory]);

  // When fullProjects or statusScope changes, compute the filtered projects shown.
  useEffect(() => {
    const applyScopeFilter = () => {
      if (!fullProjects || !fullProjects.length) {
        setProjects([]);
        setVisibleProjectIds([]);
        return;
      }

      // Filter taking into account missing/empty statuses.
      const filtered = fullProjects.filter((p) => {
        const s = p.status || '';
        if (statusScope === 'current') return s === 'completed';
        if (statusScope === 'currentAndUc') return s === 'completed' || s === 'u/c';
        // proposed (currentUcProposed) should include proposed, u/c, completed AND missing/empty statuses
        return s === 'completed' || s === 'u/c' || s === 'proposed' || s === '' || s == null;
      });
      setProjects(filtered);
      const ids = filtered.map((p: any) => p._id || p.id || p.name);
      setVisibleProjectIds(ids);
    };

    applyScopeFilter();
  }, [fullProjects, statusScope]);

  useEffect(() => {
    if (!pathname) return;
    const parts = pathname.split('/').filter(Boolean);
    const [catSlug, statusSlug] = parts;
    let cat = catSlug ? slugToCategoryKey(catSlug) : null;
    let scope = statusSlug ? statusSlugToScope(statusSlug) : 'currentUcProposed';

    // If rewrite routed to /projects?category=...&status=..., pathname may be /projects.
    // Fall back to searchParams when pathname doesn't include expected category/status.
    if (!cat) {
      const catFromQuery = searchParams?.get('category');
      const statusFromQuery = searchParams?.get('status') || searchParams?.get('scope');
      if (catFromQuery) {
        // catFromQuery might be 'high speed rail' etc.
        // Map from category string to key
        if (catFromQuery === 'high speed rail') cat = 'high speed rail';
        else if (catFromQuery === 'expressway') cat = 'expressway';
        else if (catFromQuery === 'metros') cat = 'metros';
      }
      if (statusFromQuery) {
        scope = statusSlug ? scope : statusSlugToScope(statusFromQuery);
      }
    }
    // if path is only category (no status), redirect to /category/proposed
    if (catSlug && !statusSlug) {
      const target = `/${catSlug}/proposed`;
      if (pathname !== target) router.replace(target);
    }
  }, [pathname, searchParams, router]);

  const visibleProjects = useMemo(() => projects, [projects]);
  const displayedProjects = loading ? [] : visibleProjects;

  const filteredMapData = useMemo(() => {
    if (loading) return [];
    if (!visibleProjectIds || !visibleProjectIds.length) return [];
    return visibleProjects.filter((p) => visibleProjectIds.includes(p._id || p.id || p.name));
  }, [loading, visibleProjects, visibleProjectIds]);

  

  return (
    <div className={styles.shell}>
      <section className={styles.controlPanel}>
        <div className={styles.panelHeader}>
          <p className={styles.kicker}>Map Controls</p>
          <h1 className={styles.title}>National Infra Atlas</h1>
          <p className={styles.subtitle}>
            Filter by infrastructure type and rollout stage.
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Project Type</h2>
          <div className={styles.pillRow}>
            {CATEGORY_OPTIONS.map((option) => {
              const active = selectedCategory === option.key;
              return (
                <Link
                  key={option.key}
                  href={option.href}
                  className={`${styles.pill} ${active ? styles.pillActive : ''}`}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Rollout Scope</h2>
          <div className={styles.segmented}>
            {[
              { slug: 'completed', label: 'Completed', scope: 'current' },
              { slug: 'uc', label: 'Completed + U/C', scope: 'currentAndUc' },
              { slug: 'proposed', label: 'Completed + U/C + Proposed', scope: 'currentUcProposed' },
            ].map((opt) => {
              const catSlug = categoryKeyToSlug(selectedCategory);
              const href = `/${catSlug}/${opt.slug}`;
              const active = statusScope === (opt.scope as any);
              return (
                <Link
                  key={opt.slug}
                  href={href}
                  className={`${styles.segment} ${active ? styles.segmentActive : ''}`}
                >
                  {opt.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className={styles.statsRow}>
          <span className={styles.statChip}>Visible projects: {displayedProjects.length}</span>
          <span className={styles.statChip}>
            Selected type: {CATEGORY_OPTIONS.find((x) => x.key === selectedCategory)?.label}
          </span>
        </div>

        <div className={styles.projectListPanel}>
          <h3 className={styles.projectListTitle}>Projects</h3>
          {loading && <div className={styles.projectListNote}>Loading…</div>}
          {!loading && !displayedProjects.length && (
            <div className={styles.projectListNote}>No projects</div>
          )}
          <ul className={styles.projectList}>
            {displayedProjects.map((p) => {
              const id = p._id || p.id || p.name;
              const checked = visibleProjectIds.includes(id);
              return (
                <li key={id} className={styles.projectItem}>
                  <label>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        setVisibleProjectIds((prev) =>
                          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                        );
                      }}
                    />
                    <span className={styles.projectLabel}>{p.name || 'Untitled'}</span>
                    <span className={styles.projectMeta}>{p.status || ''}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <div className={styles.mapWrap}>
        <Map mapdata={filteredMapData} />

        {!loading && !visibleProjects.length && (
          <div className={styles.emptyOverlay}>No projects match the selected filters.</div>
        )}

        {loading && (
          <div
            className={styles.loadingOverlay}
            style={{
              background: 'rgba(255,255,255,0.35)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 99999,
              pointerEvents: 'auto',
            }}
          >
            <div className={styles.loadingCard}>Loading map data...</div>
          </div>
        )}
      </div>
    </div>
  );
}