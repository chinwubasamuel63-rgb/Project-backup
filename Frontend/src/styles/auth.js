import { COLORS } from "../data/colors";

export const authStyles = `
/* =========================
   ANIMATIONS
========================= */

@keyframes rotateClockwise {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes rotateCounterClockwise {
  from { transform: translate(-50%, -50%) rotate(360deg); }
  to { transform: translate(-50%, -50%) rotate(0deg); }
}

@keyframes pulseCore {
  0%,100%{
    transform:translate(-50%,-50%) scale(1);
  }
  50%{
    transform:translate(-50%,-50%) scale(1.08);
  }
}

@keyframes floatCard {
  0%,100%{
    transform:translateY(0px);
  }
  50%{
    transform:translateY(-14px);
  }
}

@keyframes gridMove {
  from{
    transform:
      perspective(1000px)
      rotateX(82deg)
      translateY(0);
  }

  to{
    transform:
      perspective(1000px)
      rotateX(82deg)
      translateY(60px);
  }
}

@keyframes glowPulse {
  0%,100%{
    opacity:.5;
  }
  50%{
    opacity:1;
  }
}

@keyframes nodePulse {
  0%,100%{
    transform:scale(1);
  }

  50%{
    transform:scale(1.15);
  }
}

/* =========================
   ROOT
========================= */

.auth-stage{
  min-height:100vh;
  overflow:hidden;
  position:relative;
  background:#020617;
}

/* =========================
   SCENE
========================= */

.auth-scene{
  position:relative;
  min-height:100vh;
  overflow:hidden;
}

/* =========================
   CYBER GRID
========================= */

.cyber-grid{
  position:absolute;
  left:-50%;
  right:-50%;
  bottom:-45%;

  height:100%;

  background-image:
    linear-gradient(
      rgba(255,255,255,.08) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(255,255,255,.08) 1px,
      transparent 1px
    );

  background-size:60px 60px;

  animation:gridMove 5s linear infinite;

  opacity:.25;
}

/* =========================
   GLOWS
========================= */

.scene-glow{
  position:absolute;
  border-radius:50%;
  filter:blur(140px);
}

.glow-left{
  width:500px;
  height:500px;

  left:-150px;
  top:120px;

  background:rgba(34,197,94,.18);
}

.glow-right{
  width:500px;
  height:500px;

  right:-150px;
  top:50px;

  background:rgba(168,85,247,.18);
}

/* =========================
   BRAND
========================= */

.devstream-brand{
  position:absolute;
  top:40px;
  left:50px;

  display:flex;
  align-items:center;
  gap:16px;

  z-index:50;
}

.brand-logo{
  width:56px;
  height:56px;

  display:grid;
  place-items:center;

  border-radius:16px;

  background:
    linear-gradient(
      135deg,
      ${COLORS.green},
      ${COLORS.purple}
    );

  color:white;
  font-weight:900;
}

.brand-title{
  color:white;
  font-size:20px;
  font-weight:900;
  letter-spacing:2px;
}

.brand-subtitle{
  color:${COLORS.muted};
  font-size:13px;
}

/* =========================
   NEXUS CORE
========================= */

.nexus-core-container{
  position:absolute;

  left:50%;
  top:45%;

  width:700px;
  height:700px;

  transform:translate(-50%,-50%);
}

/* rings */

.ring-1,
.ring-2,
.ring-3{
  position:absolute;

  left:50%;
  top:50%;

  border-radius:50%;

  border:1px solid rgba(255,255,255,.08);
}

.ring-1{
  width:350px;
  height:350px;
  animation:rotateClockwise 16s linear infinite;
}

.ring-2{
  width:450px;
  height:450px;
  animation:rotateCounterClockwise 22s linear infinite;
}

.ring-3{
  width:560px;
  height:560px;
  animation:rotateClockwise 30s linear infinite;
}

/* core */

.nexus-core{
  position:absolute;

  left:50%;
  top:50%;

  width:220px;
  height:220px;

  border-radius:50%;

  transform:translate(-50%,-50%);

  background:
    radial-gradient(
      circle at 30% 20%,
      white,
      ${COLORS.green} 15%,
      ${COLORS.purple} 55%,
      #020617
    );

  box-shadow:
    0 0 80px rgba(34,197,94,.35),
    0 0 160px rgba(168,85,247,.25);

  animation:pulseCore 4s ease-in-out infinite;
}

.nexus-inner-glow{
  position:absolute;
  inset:20px;

  border-radius:50%;

  background:
    radial-gradient(
      circle,
      rgba(255,255,255,.35),
      transparent
    );
}

.nexus-logo{
  position:absolute;

  inset:0;

  display:grid;
  place-items:center;

  color:white;
  font-size:72px;
  font-weight:900;
}

.auth-tabs{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;

  padding:6px;

  margin-bottom:20px;

  border-radius:16px;

  background:
    rgba(255,255,255,.04);

  border:
    1px solid rgba(255,255,255,.05);
}

.auth-tabs button{
  height:48px;

  border:none;

  border-radius:12px;

  cursor:pointer;

  font-size:14px;
  font-weight:700;

  color:#94a3b8;

  background:transparent;

  transition:.25s ease;
}

.auth-tabs button:hover{
  color:white;
}

.auth-tabs button.active{
  color:white;

  background:
    linear-gradient(
      135deg,
      rgba(34,197,94,.25),
      rgba(168,85,247,.25)
    );

  box-shadow:
    0 0 20px rgba(168,85,247,.25);
}

/* =========================
   ORBIT NODES
========================= */

.orbit-node{
  position:absolute;

  padding:12px 18px;

  border-radius:12px;

  color:white;
  font-size:12px;
  font-weight:800;

  backdrop-filter:blur(20px);

  background:rgba(15,23,42,.75);

  border:1px solid rgba(255,255,255,.08);

  animation:
    floatCard 5s ease-in-out infinite,
    nodePulse 4s ease-in-out infinite;
}

.node-projects{
  top:80px;
  left:280px;
}

.node-streams{
  top:220px;
  left:40px;
}

.node-messages{
  bottom:180px;
  left:20px;
}

.node-support{
  bottom:40px;
  left:290px;
}

.node-marketplace{
  right:30px;
  bottom:180px;
}

.node-hiring{
  top:220px;
  right:20px;
}

/* =========================
   ACTIVITY FEED
========================= */

.activity-feed{
  position:absolute;

  left:40px;
  bottom:40px;

  width:300px;

  padding:20px;

  border-radius:20px;

  background:rgba(15,23,42,.72);

  backdrop-filter:blur(20px);

  border:1px solid rgba(255,255,255,.08);
}

.feed-header{
  color:${COLORS.green};
  font-weight:800;
  margin-bottom:16px;
}

.feed-item{
  display:flex;
  align-items:center;
  gap:10px;

  color:white;

  margin-bottom:12px;
}

.feed-dot{
  width:8px;
  height:8px;

  border-radius:50%;

  background:${COLORS.green};
}

/* =========================
   STATS
========================= */

.stats-row{
  position:absolute;

  bottom:40px;
  left:50%;

  transform:translateX(-50%);

  display:flex;
  gap:20px;
}

.floating-stat-card{
  min-width:170px;

  padding:20px;

  border-radius:20px;

  background:rgba(15,23,42,.72);

  backdrop-filter:blur(20px);

  border:1px solid rgba(255,255,255,.08);

  animation:floatCard 5s ease-in-out infinite;
}

.stat-value{
  color:white;
  font-size:30px;
  font-weight:900;
}

.stat-title{
  margin-top:6px;

  color:${COLORS.muted};
  font-size:12px;
}

.nexus-auth-panel{
  position:absolute;

  right:60px;
  top:50%;

  transform:translateY(-50%);

  width:430px;

  padding:32px;

  border-radius:28px;

  z-index:100;

  backdrop-filter:blur(40px);

  background:
    rgba(8,15,30,.72);

  border:
    1px solid rgba(255,255,255,.08);

  box-shadow:
    0 30px 80px rgba(0,0,0,.45);
}

.panel-glow{
  position:absolute;

  inset:0;

  border-radius:inherit;

  background:
    linear-gradient(
      135deg,
      rgba(34,197,94,.08),
      rgba(168,85,247,.08)
    );

  pointer-events:none;
}

.nexus-auth-panel h2{
  color:white;
  margin-bottom:20px;
  font-size:34px;
}

.nexus-auth-panel label{
  display:flex;
  flex-direction:column;
  gap:8px;

  margin-bottom:16px;

  color:#94a3b8;
}

.nexus-auth-panel input{
  height:52px;

  border-radius:14px;

  border:
    1px solid rgba(255,255,255,.08);

  background:
    rgba(15,23,42,.85);

  color:white;

  padding:0 16px;
}

.nexus-auth-panel .auth-submit{
  width:100%;
  margin-top:12px;
}

.provider-row{
  display:flex;

  gap:12px;

  margin-top:18px;
}

.provider-btn{
  flex:1;

  height:52px;

  display:flex;
  align-items:center;
  justify-content:center;

  gap:10px;

  border-radius:14px;

  cursor:pointer;

  color:white;

  background:
    rgba(255,255,255,.04);

  border:
    1px solid rgba(255,255,255,.08);

  transition:.25s ease;
}

.provider-btn:hover{
  transform:translateY(-2px);

  border-color:
    rgba(168,85,247,.4);

  box-shadow:
    0 10px 25px rgba(168,85,247,.15);
}

.provider-btn svg{
  width:18px;
  height:18px;

  flex-shrink:0;
}

@media(max-width:1100px){

  .nexus-auth-panel{
    width:90%;
    max-width:500px;

    left:50%;
    right:auto;

    top:auto;

    bottom:40px;

    transform:translateX(-50%);
  }
}

/* =========================
   RESPONSIVE
========================= */

@media(max-width:1200px){

  .stats-row{
    display:none;
  }

  .activity-feed{
    display:none;
  }

  .nexus-core-container{
    transform:translate(-50%,-50%) scale(.8);
  }
}

@media(max-width:768px){

  .nexus-core-container{
    transform:translate(-50%,-50%) scale(.55);
  }

  .devstream-brand{
    left:20px;
    top:20px;
  }
}
`;

