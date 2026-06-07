import Link from 'next/link';
import { redirect } from 'next/navigation';
import dbConnect from '../../lib/dbConnect';
import '../../../../models/project';
import ProjectGroup from '../../../../models/projectGroup';
import ProjectMissingState from '../../projects/ProjectMissingState';
import styles from '../proposed.module.css';

export const dynamic = 'force-dynamic';

export default async function ProposedGroupPage({ params }: { params: { slug: string } }) {
  await dbConnect();

  const group = await ProjectGroup.findOne({
    $or: [{ slug: params.slug }, { name: params.slug }],
  })
    .populate('projects')
    .lean();

  if (!group) {
    return <ProjectMissingState slug={params.slug} />;
  }

  redirect('/projects');
}