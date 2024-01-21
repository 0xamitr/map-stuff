"use client"
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./DynamicMap'), {
  ssr: false
});

const Map = (props: any) => {
  return (
    <div style={{height: "60vh", width: "60%"}}>
      <DynamicMap {...props} />
    </div>
  )
}

export default Map;