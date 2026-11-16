// Independent title artwork. No flattened promotional image is used.
export function titleScene(s, text, blend) {
  const g = s.add.graphics();
  const rect = (x,y,w,h,c,a=1) => g.fillStyle(c,a).fillRect(x,y,w,h);
  const poly = (p,c,a=1) => g.fillStyle(c,a).fillPoints(p.map(([x,y])=>({x,y})),true);
  for(let y=0;y<360;y++) {
    const t=y/360;
    rect(0,y,640,1,((15+t*26)<<16)|((10+t*13)<<8)|(35+t*37));
  }
  for(let i=0;i<85;i++) {
    const x=(i*137.31+Math.sin(i*7)*83+640)%640,y=(i*47.73+Math.cos(i*3)*59+220)%220;
    rect(x,y,i%7===0?2:1,1,0xe7d2ff,0.2+(i%5)*0.13);
  }
  for(let r=70;r>35;r--) g.fillStyle(0xbd9bff,0.005).fillCircle(521,79,r);
  g.fillStyle(0xffdfb1,1).fillCircle(521,79,35);
  g.fillStyle(0xd3a8b0,0.3).fillCircle(509,71,9).fillCircle(535,91,12).fillCircle(523,56,5);
  // Layered distant cliffs and castle silhouettes.
  for(let layer=0;layer<3;layer++) {
    const y=202+layer*37, pts=[[0,360],[0,y]];
    for(let x=0;x<=660;x+=30) pts.push([x,y+Math.sin(x*.031+layer*2)*20+Math.cos(x*.067)*9]);
    pts.push([640,360]);poly(pts,[0x403252,0x29233d,0x191a2b][layer]);
  }
  const tower=(x,y,w,h)=>{
    rect(x,y,w,h,0x17172c);poly([[x-4,y],[x+w/2,y-22],[x+w+4,y]],0x161326);
    rect(x+w/2-1,y+9,2,6,0xffcc87,.9);
    rect(x+w/2-1,y+24,2,5,0xe5a267,.65);
  };
  rect(470,146,113,54,0x1c1b31);
  tower(474,128,15,66);tower(498,103,18,91);tower(526,122,16,75);tower(553,140,14,60);
  rect(506,70,1,15,0x25203c);poly([[507,70],[524,74],[507,79]],0x9f526e);
  // Broken aqueduct frames the lower scene.
  rect(0,264,172,8,0x131524);rect(475,249,165,8,0x131524);
  for(let x=8;x<170;x+=34) rect(x,270,9,90,0x131524);
  for(let x=486;x<640;x+=35) rect(x,255,9,105,0x131524);
  for(let i=0;i<45;i++) rect(0,360-i*2,640,2,0x090b16,.8*(1-i/45));
  // Quiet central field for the live title and controls.
  for(let i=55;i>0;i--) g.fillStyle(0x100d25,.018).fillEllipse(320,190,180+i*5,130+i*4);
  g.lineStyle(1,0xb394df,.2).strokeCircle(320,105,67);
  g.lineStyle(1,0xc9a773,.35).strokeCircle(320,105,62);
  for(let i=0;i<12;i++) {
    const a=i*Math.PI/6;
    g.lineStyle(1,0xd6b687,.65).lineBetween(320+Math.cos(a)*64,105+Math.sin(a)*64,320+Math.cos(a)*68,105+Math.sin(a)*68);
  }
  poly([[317,44],[323,44],[323,119],[320,131],[317,119]],0xd4cbe8);
  rect(308,48,24,3,0xe9ba76);rect(318,31,4,16,0xb7875c);
  poly([[320,25],[324,30],[320,35],[316,30]],0xf9dc9d);
  text(s,320,77,"REFORGE","title","#1c102a",{fontFamily:'Georgia, serif',fontSize:'56px',fontStyle:'bold',stroke:'#170d24',strokeThickness:7}).setOrigin(.5,0);
  text(s,320,74,"REFORGE","title","#f5d6a0",{fontFamily:'Georgia, serif',fontSize:'56px',fontStyle:'bold',stroke:'#8b543c',strokeThickness:1}).setOrigin(.5,0);
  text(s,320,139,"리포지 · 무한의 길","body","#e2c9ed",{letterSpacing:3}).setOrigin(.5,0);
  g.lineStyle(1,0xc69b68,.5).lineBetween(234,166,406,166);
  const glow=s.add.image(320,49,'vx_glow').setTint(0xcc91ff).setBlendMode(blend).setScale(.45).setAlpha(.3);
  s.tweens.add({targets:glow,alpha:.65,duration:2200,yoyo:true,repeat:-1});
  s.add.particles(0,0,'vx_px',{x:{min:100,max:540},y:355,speedY:{min:-14,max:-5},speedX:{min:-4,max:4},lifespan:8000,frequency:350,scale:{start:.6,end:0},alpha:{start:.5,end:0},tint:[0xd3a7ed,0xf2c589],blendMode:blend});
}

