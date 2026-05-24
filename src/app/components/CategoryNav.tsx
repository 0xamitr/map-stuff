"use client"

import { usePathname } from 'next/navigation'
import styles from '../mapcontainer.module.css'

export default function CategoryNav() {
  const pathname = usePathname() || ''
  const isActive = (p: string) => pathname === p

  return (
    <nav className={styles.categoryNav}>
      <a className={isActive('/projects') ? styles.pillActive : ''} href="/projects">All</a>
      <a className={isActive('/expressway') ? styles.pillActive : ''} href="/expressway">Expressways</a>
      <a className={isActive('/high-speed-rail') ? styles.pillActive : ''} href="/high-speed-rail">HSR</a>
      <a className={isActive('/metros') ? styles.pillActive : ''} href="/metros">Metros</a>
    </nav>
  )
}
