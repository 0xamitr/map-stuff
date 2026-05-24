import dynamic from 'next/dynamic'

const MapContainer = dynamic(() => import('../mapcontainer'), { ssr: false })

export default function Page() {
  return <MapContainer />
}
