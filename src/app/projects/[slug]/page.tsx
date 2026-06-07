import nextDynamic from 'next/dynamic';
import { redirect } from 'next/navigation';
import dbConnect from '../../lib/dbConnect';
import '../../../../models/project';
import ProjectGroup from '../../../../models/projectGroup';

export const dynamic = 'force-dynamic';

const RESERVED_STATUS_SLUGS = new Set(['completed', 'uc', 'proposed']);
const MapContainer = nextDynamic(() => import('../../mapcontainer'), { ssr: false });

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  if (RESERVED_STATUS_SLUGS.has(params.slug)) {
    redirect('/projects');
  }

  await dbConnect();

  const group = await ProjectGroup.findOne({
    $or: [{ slug: params.slug }, { name: params.slug }],
  })
    .populate('projects')
    .lean();

  if (!group) {
    redirect('/projects');
  }

  redirect(`/projects/${params.slug}/proposed`);
}