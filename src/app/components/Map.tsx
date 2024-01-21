"use client"
import dynamic from 'next/dynamic';

const DynamicMap = dynamic(() => import('./DynamicMap'), {
  ssr: false
});

const Map = (props: any) => {
  return (
    <div style={{height: "80vh", width: "100%"}}>
      <DynamicMap {...props} />
    </div>
  )
}

export default Map;