# Genesis Verse — Static Assets & 3D Models Directory

Place static WebGL assets, environments, and 3D scenes here. Vite serves everything inside `/public` on the base root url (`/`).

### Folder Structures:
* `/public/models/` — Dedicated for `.glb`, `.gltf`, or `.babylon` models.
  * e.g., `/public/models/commander-antonio-coldstone-a.glb` will be reachable at standard hostname `/models/commander-antonio-coldstone-a.glb`.
* `/public/environments/` — Dedicated for skybox environmental textures (e.g., `ulmerMuenster.env`).

### Note on CORS & Local Serving:
Referencing assets locally bypassing Vercel proxies prevents remote 404 and CORS lockups completely.
