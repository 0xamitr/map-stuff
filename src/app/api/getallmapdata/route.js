import {NextResponse} from 'next/server';
import dbConnect from "../../lib/dbConnect";
import Project from "../../../../models/project";

const withTimeout = (promise, ms) =>
    Promise.race([
        promise,
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
        ),
    ]);

export async function GET(request) {
    try{
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const scope = searchParams.get('scope') || 'currentUcProposed';

        const allowedCategories = ['high speed rail', 'expressway', 'metros'];
        const filter = {};

        if (scope === 'all') {
            // no status filtering
        } else if (scope === 'current') {
            filter.status = 'completed';
        } else if (scope === 'currentAndUc') {
            filter.status = { $in: ['completed', 'u/c'] };
        } else {
            filter.$or = [
                { status: { $in: ['completed', 'u/c', 'proposed'] } },
                { status: { $exists: false } },
                { status: null },
                { status: '' },
            ];
        }

        if (category && allowedCategories.includes(category)) {
            filter.category = category;
        }

        console.debug('[getallmapdata] category=', category, 'scope=', scope, 'filter=', JSON.stringify(filter));

        await withTimeout(dbConnect(), 5000);
        const projects = await Project.find(filter).sort({ uploadedAt: -1 }).lean();
        console.debug('[getallmapdata] returned projects=', projects.length);
        return NextResponse.json(projects);
        
    }
    catch(error){
        console.error(error);
        return NextResponse.json({error: 'Failed to fetch map data'}, {status: 500});
    }
}