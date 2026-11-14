# 3D Spacecraft & Planetary Asset Credits & Attributions

This project renders a multi-stage cosmic flight experience utilizing public-domain data and procedural shaders based on open planetary science telemetry.

## Planetary Textures & Elevation Models

1. **Earth (Low Earth Orbit - 420 km)**
   - **Day Albedo & Oceans**: NASA Visible Earth (Blue Marble: Next Generation), Goddard Space Flight Center.
   - **City Night Lights**: NASA Earth Observatory / NOAA National Geophysical Data Center (Black Marble Suite).
   - **Atmospheric Cloud Composites**: NASA Goddard Space Flight Center MODIS Global Cloud Mosaic.
   - **Public Domain**: Works produced by NASA and NOAA are in the public domain under US copyright law.

2. **The Moon (Lunar Flyby - 384,400 km)**
   - **Albedo & Maria Mosaic**: NASA / Goddard Space Flight Center / Lunar Reconnaissance Orbiter (LRO) Camera (LROC) Team / Arizona State University.
   - **Topography & Crater Relief**: LRO Lunar Orbiter Laser Altimeter (LOLA) global topography and Clementine UV/VIS albedo maps.
   - **Public Domain**: Data distributed via NASA Planetary Data System (PDS).

3. **Mars (Mangalyaan Encounter - 225M km)**
   - **Color Albedo & Basalt Regions**: NASA / USGS Astrogeology Science Center Viking Orbiter Global Color Mosaic & Mars Global Surveyor (MGS) Mars Orbiter Camera (MOC).
   - **Topography & Valles Marineris Relief**: NASA / JPL / Goddard Space Flight Center Mars Orbiter Laser Altimeter (MOLA) digital elevation model.
   - **Public Domain**: Distributed freely by the USGS and NASA Planetary Data System.

4. **Deep Space & Starfield**
   - **Milky Way & Interstellar Nebulae**: Procedurally synthesized via 4-octave Fractional Brownian Motion (fBm) GPU shaders calibrated to European Southern Observatory (ESO) and Gaia DR3 galactic plane coordinates.
   - **Stellar Point Distribution**: Synthetic pseudo-random spherical distribution calibrated to Harvard Revised Photometry (Yale Bright Star) stellar color indices.

## Aerospace Vehicle & Launch Complex

- **Launch Vehicle & Pad (Stage 00)**: Generic heavy-lift orbital launch vehicle featuring a central core liquid propellant stage with payload fairing, twin solid rocket strap-on boosters with structural load-bearing struts, and an industrial launch mount with flame trench, umbilical tower, and distant lightning masts. 100% procedural Three.js PBR geometry and custom canvas-generated PBR textures with zero corporate or national branding (no logos, no trademarks, no flags).
- **Planetary Spacecraft (Stages 02–05)**: Autonomous interplanetary science probe with dual articulated photovoltaic arrays, high-gain parabolic reflector dish, and multi-layer insulation (MLI) gold foil shielding.
