
import { useState } from "react";
import { DOMParser } from "xmldom";
import { kml } from "@tmcw/togeojson";
import JSZip from "jszip";

export default function KMLUploader({ onUploadSuccess } = {}) {
    const [geojson, setGeojson] = useState(null);
    const [category, setCategory] = useState("high speed rail");
    const [status, setStatus] = useState("proposed");
    const [uploads, setUploads] = useState([]);

    const findKmlInKmz = async (arrayBuffer) => {
        const zip = await JSZip.loadAsync(arrayBuffer);
        const files = Object.keys(zip.files);
        for (const name of files) {
            if (name.toLowerCase().endsWith(".kml")) {
                return await zip.files[name].async("text");
            }
        }
        return null;
    };

    const uploadJsonWithProgress = (fileName, cleanedGeojson, category, status, onProgress) => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/upload-geojson");
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    onProgress(Math.round((e.loaded / e.total) * 100));
                } else {
                    onProgress(null);
                }
            };
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        resolve(JSON.parse(xhr.responseText));
                    } catch (err) {
                        resolve({ success: true });
                    }
                } else {
                    reject(xhr.responseText || `Status ${xhr.status}`);
                }
            };
            xhr.onerror = () => reject("Network error");
            xhr.send(JSON.stringify({ name: fileName, geojson: cleanedGeojson, category, status }));
        });
    };

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        for (const file of files) {
            const uploadId = `${file.name}-${Date.now()}`;
            setUploads((s) => [...s, { id: uploadId, name: file.name, progress: 0, status: "pending", error: null }]);

            try {
                // get KML text (convert KMZ if needed)
                let kmlText;
                if (file.name.toLowerCase().endsWith(".kmz")) {
                    const ab = await file.arrayBuffer();
                    kmlText = await findKmlInKmz(ab);
                    if (!kmlText) throw new Error("No KML found inside KMZ");
                } else {
                    kmlText = await file.text();
                }

                const parser = new DOMParser();
                const xml = parser.parseFromString(kmlText, "text/xml");

                const converted = kml(xml);
                const cleanedGeojson = {
                    ...converted,
                    features: converted.features
                        .filter((feature) => {
                            if (!feature.geometry) return false;
                            if (
                                feature.geometry.type !== "LineString" &&
                                feature.geometry.type !== "MultiLineString"
                            ) {
                                return false;
                            }
                            return true;
                        })
                        .map((feature) => ({
                            type: "Feature",
                            geometry: feature.geometry,
                            properties: {
                                name: feature.properties?.name || "",
                            },
                        })),
                };
                setGeojson(cleanedGeojson);

                // mark uploading
                setUploads((s) => s.map(u => u.id === uploadId ? { ...u, status: "uploading" } : u));

                // upload with progress
                await uploadJsonWithProgress(file.name, cleanedGeojson, category, status, (p) => {
                    setUploads((s) => s.map(u => u.id === uploadId ? { ...u, progress: p ?? u.progress } : u));
                });

                setUploads((s) => s.map(u => u.id === uploadId ? { ...u, progress: 100, status: "success" } : u));
                onUploadSuccess?.();
            } catch (err) {
                setUploads((s) => s.map(u => u.id === uploadId ? { ...u, status: "error", error: err?.toString() } : u));
            }
        }
    };

    return (
        <div className="p-4">
            <div className="mb-2">
                <label className="block mb-1">Project Type</label>
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="p-2 border rounded"
                    required
                >
                    <option value="high speed rail">High Speed Rail</option>
                    <option value="expressway">Expressway</option>
                    <option value="metros">Metros</option>
                </select>
            </div>

            <div className="mb-2">
                <label className="block mb-1">Status</label>
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="p-2 border rounded"
                    required
                >
                    <option value="u/c">U/C</option>
                    <option value="proposed">Proposed</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            <label className="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer inline-block mb-4">
                Upload KML / KMZ
                <input
                    type="file"
                    accept=".kml,.kmz"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                />
            </label>

            <div>
                {uploads.map((u) => (
                    <div key={u.id} className="mb-2">
                        <div className="flex justify-between text-sm">
                            <div>{u.name}</div>
                            <div>{u.status === "uploading" ? `${u.progress ?? 0}%` : u.status}</div>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded mt-1">
                            <div
                                style={{ width: `${u.progress ?? 0}%` }}
                                className={`h-2 bg-green-500 rounded ${u.status === "error" ? "bg-red-500" : ""}`}
                            />
                        </div>
                        {u.error && <div className="text-red-600 text-sm">{u.error}</div>}
                    </div>
                ))}
            </div>
        </div>
    );
}