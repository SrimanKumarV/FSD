import React, { useState, useEffect } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { motion } from "framer-motion";
import { MapPin, Users, Building, Globe } from "lucide-react";
import { api } from '../utils/api';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

// Mock data (since backend doesn't have a specific map endpoint yet)
const markers = [
  { markerOffset: -15, name: "San Francisco, USA", coordinates: [-122.4194, 37.7749], alumniCount: 150 },
  { markerOffset: -15, name: "New York, USA", coordinates: [-74.006, 40.7128], alumniCount: 85 },
  { markerOffset: -15, name: "London, UK", coordinates: [-0.1276, 51.5072], alumniCount: 42 },
  { markerOffset: 15, name: "Berlin, Germany", coordinates: [13.405, 52.52], alumniCount: 12 },
  { markerOffset: 15, name: "Bengaluru, India", coordinates: [77.5946, 12.9716], alumniCount: 320 },
  { markerOffset: 15, name: "Chennai, India", coordinates: [80.2707, 13.0827], alumniCount: 450 },
  { markerOffset: -15, name: "Singapore", coordinates: [103.8198, 1.3521], alumniCount: 20 },
  { markerOffset: 15, name: "Tokyo, Japan", coordinates: [139.6917, 35.6895], alumniCount: 8 },
];

const colorScale = scaleLinear()
  .domain([0, 500])
  .range(["#e0e7ff", "#4338ca"]);

const AlumniMap = () => {
  const [content, setContent] = useState("");
  const [activeMarker, setActiveMarker] = useState(null);

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2.5rem] overflow-hidden relative shadow-2xl border border-white/10"
        style={{ background: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)' }}
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Globe className="w-5 h-5 text-indigo-400" />
            </div>
            <span className="text-sm font-bold tracking-widest text-indigo-400 uppercase">Global Reach</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Alumni <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">World Map</span>
          </h1>
          <p className="text-slate-400 max-w-2xl text-lg">
            Discover where our alumni are making an impact across the globe. Connect with fellow graduates in your city or anywhere you plan to move.
          </p>
        </div>
      </motion.div>

      {/* Map Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 p-6 md:p-10 relative overflow-hidden"
      >
        <div className="absolute top-4 left-4 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {content ? content : "Hover over a location to see details"}
          </p>
        </div>
        
        <div className="w-full h-[500px] md:h-[600px] bg-slate-50 dark:bg-slate-800/50 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 120 }}
            className="w-full h-full"
          >
            <ZoomableGroup center={[0, 20]} zoom={1}>
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#e2e8f0"
                      stroke="#cbd5e1"
                      strokeWidth={0.5}
                      style={{
                        default: { fill: "#334155", stroke: "#1e293b", outline: "none" },
                        hover: { fill: "#475569", outline: "none" },
                        pressed: { fill: "#1e293b", outline: "none" },
                      }}
                      className="dark:fill-slate-800 dark:stroke-slate-700 transition-colors"
                    />
                  ))
                }
              </Geographies>

              {markers.map(({ name, coordinates, markerOffset, alumniCount }) => (
                <Marker key={name} coordinates={coordinates}>
                  <circle 
                    r={Math.max(4, alumniCount / 20)} 
                    fill="#6366f1" 
                    stroke="#fff" 
                    strokeWidth={2}
                    className="cursor-pointer hover:fill-indigo-400 transition-colors"
                    onMouseEnter={() => {
                      setContent(`${name}: ${alumniCount} Alumni`);
                      setActiveMarker(name);
                    }}
                    onMouseLeave={() => {
                      setContent("");
                      setActiveMarker(null);
                    }}
                  />
                  <text
                    textAnchor="middle"
                    y={markerOffset}
                    style={{ fontFamily: "Inter, system-ui, sans-serif", fill: activeMarker === name ? "#818cf8" : "#94a3b8", fontSize: "10px", fontWeight: "600" }}
                    className="pointer-events-none drop-shadow-md"
                  >
                    {name}
                  </text>
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl border border-slate-200 dark:border-slate-800"
        >
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mb-6 text-indigo-500">
            <Globe className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-500 mb-2">Countries Reached</p>
          <h3 className="text-4xl font-black text-slate-900 dark:text-white">12+</h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl border border-slate-200 dark:border-slate-800"
        >
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mb-6 text-emerald-500">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-500 mb-2">Total Global Alumni</p>
          <h3 className="text-4xl font-black text-slate-900 dark:text-white">1,080+</h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl border border-slate-200 dark:border-slate-800"
        >
          <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900/30 rounded-2xl flex items-center justify-center mb-6 text-cyan-500">
            <Building className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-slate-500 mb-2">Global Tech Hubs</p>
          <h3 className="text-4xl font-black text-slate-900 dark:text-white">8</h3>
        </motion.div>
      </div>
    </div>
  );
};

export default AlumniMap;
