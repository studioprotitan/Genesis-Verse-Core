/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

// Initialize Gemini Client Lazily
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  // Increase payload limit to allow Base64 image transfers
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Image Synthesis API Endpoint for Holographic Cognitive Engine
  app.post('/api/synthesize-image', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        console.warn('GEMINI_API_KEY missing from environment.');
        return res.status(500).json({ error: 'Config error' });
      }
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'Missing image data' });
      }

      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

      const imagePart = {
        inlineData: {
          mimeType: mimeType || 'image/png',
          data: cleanBase64,
        },
      };

      const textPart = {
        text: `Perform a tactical sci-fi scan and quantum analysis on this image within the context of the Genesis Verse (Gateway Universe). Act as the Holographic Cognitive Engine. Generate details on analyzed coordinates, signature density, hazardous anomalies, and a tactical assessment report. Sound industrial, cybernetic, and highly authoritative.
        
        Produce a single valid JSON object representing the synthesis output with the following schema:
        - classification: A distinct sci-fi category or object designation (e.g., ANOMALOUS CHASSIS PATTERN, CRYPTOGRAPHIC WAR COVEN INTEGRITY, COGNITIVE INTERCEPTOR NETWORK, NEURAL SIGHT MATRIX, SIREN RESONATOR CORE)
        - signatureDensity: A percentage representing threat/signature strength (e.g., "89.42%")
        - harmonicFrequency: A specific electromagnetic coordinate (e.g., "432.19 Hz", "1098.5 MHz")
        - threatAssessment: A rating ("MINIMAL", "MODERATE", "SEVERE", "CRITICAL", or "MAXIMUM")
        - synthesisReport: A highly technical description of the target, exactly 2 to 3 sentences maximum, referencing core lore elements.
        - tacticalDirectives: A short array of 2 or 3 imperative commands (e.g., ["Deploy thermal companion drone", "Force manual yaw lock on thrusters", "Tether auxiliary ABEX fuel cells"])`,
      };

      try {
        const response = await getAi().models.generateContent({
          model: 'gemini-3.5-flash',
          contents: { parts: [imagePart, textPart] },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                classification: { type: Type.STRING },
                signatureDensity: { type: Type.STRING },
                harmonicFrequency: { type: Type.STRING },
                threatAssessment: { type: Type.STRING },
                synthesisReport: { type: Type.STRING },
                tacticalDirectives: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                }
              },
              required: ['classification', 'signatureDensity', 'harmonicFrequency', 'threatAssessment', 'synthesisReport', 'tacticalDirectives']
            }
          }
        });

        const text = response.text;
        if (!text) {
          throw new Error('Empty response text');
        }
        return res.json(JSON.parse(text.trim()));
      } catch (geminiError) {
        console.warn('Gemini image synthesis failed, activating grid fallback sequence:', geminiError);
        
        // Dynamic cyber fallback generator
        const classifications = [
          'COGNITIVE INTERCEPTOR NETWORK',
          'SIREN RESONATOR CORE',
          'NEURAL SIGHT MATRIX',
          'ANOMALOUS CHASSIS PATTERN',
          'CRYPTOGRAPHIC WAR COVEN INTEGRITY'
        ];
        const assessments = ['MODERATE', 'SEVERE', 'CRITICAL', 'MAXIMUM'];
        const reports = [
          'Scanned visual telemetry reveals structural nanite clusters pulsing at unsafe threshold rates. Internal cooling lines are experiencing auxiliary feedback, suggesting a rogue command core override.',
          'Anomalous hull signatures match high-intensity interceptor variants deployed during the peripheral grid conflicts. Active power cells are venting heavy electromagnetic particles along the main flight path.',
          'Optical sensor arrays show localized quantum-level distortion field. Real-time proximity indexes are unstable, indicating an active phase-shifting core that can disrupt pilot sightlines.',
          'The identified chassis indicates high-contrast plating configured for stealth-grade data harvesting operations. Real-time telemetry signals are scrambled, but physical containment loops remain intact.'
        ];
        const directives = [
          ['Calibrate forward defensive shielding', 'Initialize local spectrum diagnostics', 'Isolate cognitive emission nodes'],
          ['Deploy thermal decoy probes', 'Target terminal fuel cell arrays', 'Maintain telemetry feedback loops'],
          ['Execute quick lateral maneuvering', 'Trigger visual dampening systems', 'Synchronize orbital tracking feeds'],
          ['Initiate tactical weapon overload', 'Disrupt autonomous guidance streams', 'Engage peripheral drive locks']
        ];

        const rClass = classifications[Math.floor(Math.random() * classifications.length)];
        const rDensity = (75 + Math.random() * 20).toFixed(2) + '%';
        const rFreq = (300 + Math.random() * 800).toFixed(2) + ' MHz';
        const rAssess = assessments[Math.floor(Math.random() * assessments.length)];
        const rReport = reports[Math.floor(Math.random() * reports.length)];
        const rDirectives = directives[Math.floor(Math.random() * directives.length)];

        return res.json({
          classification: rClass,
          signatureDensity: rDensity,
          harmonicFrequency: rFreq,
          threatAssessment: rAssess,
          synthesisReport: rReport,
          tacticalDirectives: rDirectives
        });
      }
    } catch (err) {
      console.error('Core image synthesis endpoint exception:', err);
      res.status(500).json({ error: 'FAILED TO SYNTHESIZE IMAGE TELEMETRY' });
    }
  });

  // Mission Briefing API Endpoint
  app.get('/api/briefing', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        console.warn('GEMINI_API_KEY missing from environment.');
        return res.status(500).json({ error: 'Config error' });
      }

      try {
        const response = await getAi().models.generateContent({
          model: 'gemini-3.5-flash',
          contents: 'Generate a highly immersive, futuristic sci-fi pilot squad briefing for an upcoming laser tag or vector grid match. Make it dynamic and varied.',
          config: {
            systemInstruction: 'You are the central core AI of the Genesis Verse (a cyberspace-themed pilot training matrix). You generate unique, high-intensity mission objectives for high-contrast virtual reality training. Produce a single valid JSON object representing the tactical mission specifications.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { 
                  type: Type.STRING,
                  description: 'A striking sci-fi tactical operation name (e.g., Containment Sweep, Neural Salvage)' 
                },
                codename: { 
                  type: Type.STRING, 
                  description: 'Operational codename formatted in uppercase (e.g., OPERATION TITAN RIFT, CODE: ECLIPSE)' 
                },
                description: { 
                  type: Type.STRING, 
                  description: 'A highly thematic, intense cybernetic mission breakdown (exactly 2 sentences maximum).' 
                },
                objectives: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Exactly 3 tactical requirements representing challenging grid exercises (e.g., Target 5 autonomous drone cores, Maintain tags over 60% accuracy, Scan defensive grids)'
                },
                threatLevel: { 
                  type: Type.STRING, 
                  description: 'Evaluated system threat rating: "MODERATE", "SEVERE", "CRITICAL", or "MAXIMUM"' 
                }
              },
              required: ['title', 'codename', 'description', 'objectives', 'threatLevel']
            }
          }
        });

        const text = response.text;
        if (!text) {
          throw new Error('Empty response text');
        }
        const data = JSON.parse(text.trim());
        return res.json(data);
      } catch (geminiError) {
        console.warn('Gemini generate briefing failed, activating premium server-side fallback sequence:', geminiError);

        // Predefined matrix of premium high-contrast dynamic briefings
        const fallbackBriefings = [
          {
            title: "GRID COGNITION PURGE",
            codename: "OPERATION COBALT REAVER",
            description: "Sector 0x9B has experienced a malicious telemetry overflow from sub-grid constructs. Pilots must dispatch immediately to synchronize neural relays before system-wide integrity cascades.",
            objectives: [
              "Secure any 5 active sub-grid drone cores",
              "Calibrate cognitive telemetry weapon sensors",
              "Evade severe proximity threat envelopes"
            ],
            threatLevel: "SEVERE"
          },
          {
            title: "NEURAL MATRIX SALVAGE",
            codename: "OPERATION CHROME VALKYRIE",
            description: "Rogue interceptors have isolated localized memory arrays within the central gateway grid. Stabilize active server cores by tagging the anomalies before they corrupt current sector protocols.",
            objectives: [
              "Pacify 5 corrupted telemetry matrices",
              "Identify and isolate the cognitive anomaly pattern",
              "Conduct precision tags with high accuracy levels"
            ],
            threatLevel: "CRITICAL"
          },
          {
            title: "ROGUE SWARM INTERCEPT",
            codename: "OPERATION ECLIPSE SPECTRE",
            description: "High-density drone units are clustering along the outer perimeter of the Training Matrix. Execute a rapid kinetic suppression pass to neutralize rogue hosts and prevent perimeter deterioration.",
            objectives: [
              "Neutralize 5 rogue swarm targets in combat",
              "Maintain over 55% tactical sync accuracy",
              "Analyze electromagnetic signature density streams"
            ],
            threatLevel: "MAXIMUM"
          },
          {
            title: "QUANTUM RIFT PRESERVATION",
            codename: "OPERATION SATELLITE SIREN",
            description: "Unstable vacuum portals have ruptured across coordinate stream 71-Y. Safeguard current training vectors by suppressing drone proxies and conducting localized field sweeps.",
            objectives: [
              "Tag 5 hostile network constructs",
              "Retrieve high-contrast quantum telemetry data",
              "Verify shield integrity inside hazardous anomalies"
            ],
            threatLevel: "MODERATE"
          },
          {
            title: "CONGRUENT INTENSITY OVERDRIVE",
            codename: "OPERATION SYNAPSE SHATTER",
            description: "A synthetic feedback loop from training drones is threatening the pilot core system. Cleanse the localized threat buffer before the feedback cascade reaches our mainframe.",
            objectives: [
              "Decimate 5 rogue neural drones",
              "Trigger manual system calibration sequences",
              "Minimize exposure to high signature patterns"
            ],
            threatLevel: "CRITICAL"
          }
        ];

        // Pick a random briefing option to ensure diversity
        const chosenBriefing = fallbackBriefings[Math.floor(Math.random() * fallbackBriefings.length)];
        return res.json(chosenBriefing);
      }
    } catch (err) {
      console.error('Core briefing endpoint exception:', err);
      res.status(500).json({ error: 'Failed to generate briefing content' });
    }
  });

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  // Global Game State
  const MAX_PLAYERS = 60;
  let playerCounter = 1;
  const players: Record<string, { id: string, name: string, position: [number, number, number], rotation: number, state: 'active' | 'disabled', disabledUntil: number, score: number, color: string }> = {};

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinGame', () => {
      if (Object.keys(players).length >= MAX_PLAYERS) {
        socket.emit('gameError', 'Server is full (60/60 players)');
        return;
      }
      
      // Assign random color
      const colors = ['#ff0055', '#00ff00', '#ffff00', '#ff00ff', '#00ffff'];
      const color = colors[Object.keys(players).length % colors.length];
      
      const playerName = `Player ${playerCounter++}`;

      players[socket.id] = {
        id: socket.id,
        name: playerName,
        position: [0, 2, 0],
        rotation: 0,
        state: 'active',
        disabledUntil: 0,
        score: 0,
        color
      };

      // Send initial state
      socket.emit('gameJoined', players);
      // Broadcast to others
      socket.broadcast.emit('playerJoined', players[socket.id]);
    });

    socket.on('updatePosition', (data: { position: [number, number, number], rotation: number }) => {
      if (players[socket.id]) {
        players[socket.id].position = data.position;
        players[socket.id].rotation = data.rotation;
        socket.broadcast.emit('playerMoved', { id: socket.id, ...data });
      }
    });

    socket.on('shoot', (data: { start: [number, number, number], end: [number, number, number], color: string }) => {
      socket.broadcast.emit('playerShot', { id: socket.id, ...data });
    });

    socket.on('playerPing', (data: { position: [number, number, number], color: string }) => {
      if (players[socket.id]) {
        socket.broadcast.emit('playerPinged', {
          id: socket.id,
          name: players[socket.id].name,
          position: data.position,
          color: data.color
        });
      }
    });

    socket.on('hitPlayer', (targetId: string) => {
      if (players[targetId] && players[socket.id]) {
        const now = Date.now();
        // Allow hit if active OR if disabled period has expired
        if (players[targetId].state === 'active' || now > players[targetId].disabledUntil) {
          players[targetId].state = 'disabled';
          players[targetId].disabledUntil = now + 3000;
          players[socket.id].score += 100;
          
          io.emit('playerHit', {
            targetId,
            shooterId: socket.id,
            targetDisabledUntil: players[targetId].disabledUntil,
            shooterScore: players[socket.id].score
          });
        }
      }
    });

    socket.on('disconnect', () => {
      if (players[socket.id]) {
        delete players[socket.id];
        io.emit('playerLeft', socket.id);
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();