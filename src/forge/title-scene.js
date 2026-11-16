// Independent title artwork. No flattened promotional image is used.
export function titleScene(s, text, blend, armor) {
  const g = s.add.graphics();
  const rect = (x,y,w,h,c,a=1) => g.fillStyle(c,a).fillRect(x,y,w,h);
  const poly = (p,c,a=1) => g.fillStyle(c,a).fillPoints(p.map(([x,y])=>({x,y})),true);
  s.add.ellipse(112,326,92,13,0x080710,.65);
  s.add.sprite(112,326,`player_${armor}`,0).setOrigin(.5,1).setScale(3).play(`pl_${armor}_idle`);
  s.add.image(138,301,'w_sword').setScale(2.5).setRotation(-.5);
  s.add.image(532,321,'hub_anvil').setOrigin(.5,1).setScale(3);
  const forgeGlow=s.add.image(530,281,'vx_glow').setTint(0xffad63).setBlendMode(blend).setScale(2).setAlpha(.3);
  s.tweens.add({targets:forgeGlow,alpha:.12,duration:1900,yoyo:true,repeat:-1});
  for(let i=0;i<30;i++) rect(0,360-i*2,640,2,0x090b16,.65*(1-i/30));
  // Quiet central field for the live title and controls.
  for(let i=55;i>0;i--) g.fillStyle(0x100d25,.018).fillEllipse(320,190,180+i*5,130+i*4);
  g.lineStyle(1,0xb394df,.2).strokeCircle(320,105,67);
  g.lineStyle(1,0xc9a773,.35).strokeCircle(320,105,62);
  for(let i=0;i<12;i++) {
    const a=i*Math.PI/6;
    g.lineStyle(1,0xd6b687,.65).lineBetween(320+Math.cos(a)*64,105+Math.sin(a)*64,320+Math.cos(a)*68,105+Math.sin(a)*68);
  }
  s.add.image(320,49,'fr_emblem').setScale(.8);
  text(s,320,77,"REFORGE","title","#1c102a",{fontFamily:'Georgia, serif',fontSize:'58px',fontStyle:'bold',stroke:'#170d24',strokeThickness:7}).setOrigin(.5,0);
  text(s,320,74,"REFORGE","title","#f5d6a0",{fontFamily:'Georgia, serif',fontSize:'58px',fontStyle:'bold',stroke:'#8b543c',strokeThickness:1}).setOrigin(.5,0);
  text(s,320,139,"리포지 · 무한의 길","body","#e2c9ed",{letterSpacing:3}).setOrigin(.5,0);
  g.lineStyle(1,0xc69b68,.5).lineBetween(234,166,406,166);
  const glow=s.add.image(320,49,'vx_glow').setTint(0xcc91ff).setBlendMode(blend).setScale(.45).setAlpha(.3);
  s.tweens.add({targets:glow,alpha:.65,duration:2200,yoyo:true,repeat:-1});
  s.add.particles(0,0,'vx_px',{x:{min:100,max:540},y:355,speedY:{min:-14,max:-5},speedX:{min:-4,max:4},lifespan:8000,frequency:350,scale:{start:.6,end:0},alpha:{start:.5,end:0},tint:[0xd3a7ed,0xf2c589],blendMode:blend});
}

