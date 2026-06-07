import nextDynamic from 'next/dynamic';
import dbConnect from '../../../lib/dbConnect';
import ProjectGroup from '../../../../../models/projectGroup';

export const dynamic = 'force-dynamic';

const MapContainer = nextDynamic(() => import('../../../mapcontainer'), { ssr: false });

export default async function ProjectStatusPage({ params }: { params: { slug: string; status: string } }) {
  await dbConnect();

  const group = await ProjectGroup.findOne({
    $or: [{ slug: params.slug }, { name: params.slug }],
  })
    .populate('projects')
    .lean();

  const allowedProjectIds = Array.isArray(group?.projects)
    ? group.projects
        .map((project: any) => project?._id || project?.id || project)
        .filter(Boolean)
        .map(String)
    : [];

  return <MapContainer allowedProjectIds={allowedProjectIds} routeBaseSlug={params.slug} />;
}