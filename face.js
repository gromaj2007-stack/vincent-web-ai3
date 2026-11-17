// Vivi 5.3: reversible facial reconstruction, independent of the original Meshy mesh.
// Coordinates calibrated against the actual GLB bounds and head-height samples.
export function makeFace(THREE){
 const group=new THREE.Group();group.name='Vivi_face_reconstruction_6_3';
 const material=(color,roughness=.65)=>new THREE.MeshStandardMaterial({color,roughness,side:THREE.DoubleSide});
 const skin=material('#e9bed3'), shadow=material('#c88fae'), white=material('#f9f1ff',.28);
 const iris=material('#9140d8',.22),irisOuter=material('#3d155f',.24),pupil=material('#1b0d29',.18);
 const lash=material('#2c163d'),lip=material('#9f557d'),lidSkin=material('#e9bed3'),shine=new THREE.MeshBasicMaterial({color:'#ffffff'});
 function ell(name,x,y,z,w,h,d,mat){const m=new THREE.Mesh(new THREE.SphereGeometry(1,32,20),mat);m.name=name;m.position.set(x,y,z);m.scale.set(w,h,d);group.add(m);return m;}
 function curve(name,points,r,mat){const path=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(path,32,r,6,false),mat);mesh.name=name;group.add(mesh);return mesh;}
 // A soft-edged facial patch instead of an obvious flattened sphere. Its edge fades
 // into the original head. Keep depthWrite off to avoid transparent-edge artifacts.
 function softPatch(name,cx,cy,cz,rx,ry,bulge){
  const segments=64,rings=18,positions=[],alphas=[],indices=[];
  for(let j=0;j<=rings;j++){
   const r=j/rings;
   for(let i=0;i<=segments;i++){
    const a=2*Math.PI*i/segments;
    const x=cx+rx*r*Math.cos(a), y=cy+ry*r*Math.sin(a);
    const z=cz+bulge*(1-r*r);
    positions.push(x,y,z);
    // Fade only at the edge; center is fully opaque.
    alphas.push(1-THREE.MathUtils.smoothstep(r,.79,1));
   }
  }
  for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){
   const a=j*(segments+1)+i,b=a+segments+1;
   indices.push(a,b,a+1,b,b+1,a+1);
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geo.setAttribute('fade',new THREE.Float32BufferAttribute(alphas,1));
  geo.setIndex(indices);geo.computeVertexNormals();
  const mat=new THREE.ShaderMaterial({
   uniforms:{baseColor:{value:new THREE.Color('#e9bed3')}},
   vertexShader:`attribute float fade; varying float vFade; varying vec3 vNormal; void main(){vFade=fade;vNormal=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
   fragmentShader:`uniform vec3 baseColor; varying float vFade; varying vec3 vNormal; void main(){float light=.80+.20*max(dot(normalize(vNormal),normalize(vec3(.35,.6,1.))),0.);gl_FragColor=vec4(baseColor*light,vFade);}`,
   transparent:true,depthWrite:false,side:THREE.DoubleSide
  });
  const mesh=new THREE.Mesh(geo,mat);mesh.name=name;mesh.renderOrder=2;group.add(mesh);return mesh;
 }
 softPatch('face_soft_restoration',0,.653,.224,.149,.139,.018);
 softPatch('chin_blend',0,.555,.219,.079,.043,.008);
 for(const side of [-1,1]){
  const x=side*.070;
  ell('eye_sclera_'+side,x,.690,.239,.047,.029,.007,white);
  ell('iris_outer_'+side,x,.690,.246,.024,.027,.004,irisOuter);
  ell('violet_iris_'+side,x,.690,.249,.020,.024,.004,iris);
  ell('pupil_'+side,x,.690,.254,.010,.017,.003,pupil);
  ell('eye_glint_'+side,x-side*.007,.701,.258,.006,.007,.002,shine);
  // A skin-toned lid sits in front of the eye; blinking is a lid movement, not a shrinking eyeball.
  const lid=ell('animated_lid_'+side,x,.724,.263,.050,.001,.004,lidSkin);lid.userData.closedY=.692;lid.userData.openY=.724;lid.userData.closedHeight=.028;lid.userData.openHeight=.001;
  const lower=ell('lower_blink_lid_'+side,x,.661,.263,.049,.001,.004,lidSkin);lower.userData.openY=.661;lower.userData.closedY=.686;lower.userData.openHeight=.001;lower.userData.closedHeight=.013;
  curve('upper_eyelid_'+side,[[x-side*.048,.695,.243],[x-side*.023,.720,.246],[x+side*.017,.719,.245],[x+side*.047,.694,.241]],.0034,lash);
  curve('lower_eyelid_'+side,[[x-side*.044,.682,.242],[x,.663,.244],[x+side*.043,.682,.241]],.0017,shadow);
  curve('eyebrow_'+side,[[x-side*.038,.745,.232],[x,.755,.234],[x+side*.036,.744,.229]],.0025,lash);
  ell('cheek_blush_'+side,side*.105,.631,.235,.025,.009,.002,shadow);
 }
 ell('nose_soft_tip',0,.628,.244,.009,.009,.006,skin);
 const smile=curve('mouth_smile',[[-.029,.595,.235],[0,.588,.241],[.029,.595,.235]],.0025,lip);
 const openMouth=ell('mouth_speaking',0,.588,.243,.020,.002,.002,lip);openMouth.visible=false;
 const mouthHighlight=ell('mouth_inner_highlight',0,.584,.246,.010,.002,.001,shadow);mouthHighlight.visible=false;
 const expressions=['neutral','happy','curious','surprised'];
 let expression='neutral',talkAmount=0;
 const brows=group.children.filter(o=>o.name.startsWith('eyebrow_'));
 const cheeks=group.children.filter(o=>o.name.startsWith('cheek_blush_'));
 const browRest=brows.map(o=>o.position.y);
 const mouthBase={x:openMouth.scale.x,y:openMouth.scale.y};
 const lidTargets=group.children.filter(o=>o.name.startsWith('animated_lid_')||o.name.startsWith('lower_blink_lid_'));
 function updateExpression(){
  const happy=expression==='happy',curious=expression==='curious',surprised=expression==='surprised';
  const talking=talkAmount>.05;
  smile.visible=!talking&&!surprised;
  smile.position.y=happy?.004:curious?-.002:0;
  smile.scale.x=happy?1.24:curious?.9:1;
  smile.scale.y=happy?1.20:1;
  openMouth.visible=talking||surprised;
  openMouth.scale.x=surprised&&!talking?.012:happy?.024:mouthBase.x;
  openMouth.scale.y=talking?(.002+talkAmount*.013):(surprised?.015:mouthBase.y);
  mouthHighlight.visible=talking&&talkAmount>.40;
  mouthHighlight.scale.y=.002+talkAmount*.004;
  brows.forEach((b,i)=>{b.position.y=browRest[i]+(surprised?.012:curious?.006:happy?-.002:0);b.rotation.z=curious?(i===0?.13:-.06):0;});
  cheeks.forEach(c=>{c.visible=happy;c.scale.y=happy?.012:.009;});
 }
 group.userData.setExpression=(name)=>{expression=expressions.includes(name)?name:'neutral';updateExpression();};
 group.userData.expressions=expressions;
 // Editable feature layers: preserve original GLB, allow independent fit.
 group.userData.features={eyes:group.children.filter(o=>/eye_|iris_|pupil_|eyelid_|eyebrow_|glint_|blink_lid_/.test(o.name)),mouth:group.children.filter(o=>/mouth_|nose_/.test(o.name)),skin:group.children.filter(o=>/restoration|chin_blend|cheek_blush/.test(o.name))};
 // Eye elements are animated without touching the original mesh.
 group.userData.blinkTargets=group.children.filter(o=>/animated_lid_|lower_blink_lid_/.test(o.name)).map(o=>({mesh:o,openY:o.userData.openY,closedY:o.userData.closedY,openHeight:o.userData.openHeight,closedHeight:o.userData.closedHeight}));
 group.userData.eyeSize=1;
 group.userData.setEyeSize=(value)=>{const v=Math.max(.75,Math.min(1.3,value));group.userData.eyeSize=v;for(const o of group.userData.features.eyes){if(/eye_sclera_|iris_outer_|violet_iris_|pupil_|eye_glint_/.test(o.name)){if(!o.userData.baseScale)o.userData.baseScale=o.scale.clone();o.scale.x=o.userData.baseScale.x*v;o.scale.y=o.userData.baseScale.y*v;}}group.userData.setBlink(group.userData.blinkAmount||0);};
 group.userData.setBlink=(amount)=>{const a=Math.max(0,Math.min(1,amount));group.userData.blinkAmount=a;for(const t of group.userData.blinkTargets){const v=group.userData.eyeSize;t.mesh.position.y=t.openY+(t.closedY-t.openY)*a;t.mesh.scale.y=(t.openHeight+(t.closedHeight-t.openHeight)*a)*v;t.mesh.scale.x=(t.mesh.name.startsWith('lower_')?.049:.050)*v;t.mesh.visible=a>.02;}};
 // Gaze movement stays subtle to keep the iris within the eye shape.
 const gazeParts=group.children.filter(o=>/iris_outer_|violet_iris_|pupil_|eye_glint_/.test(o.name));
 for(const o of gazeParts)o.userData.restPosition=o.position.clone();
 group.userData.setGaze=(x,y)=>{for(const o of gazeParts){o.position.x=o.userData.restPosition.x+Math.max(-1,Math.min(1,x))*.008;o.position.y=o.userData.restPosition.y+Math.max(-1,Math.min(1,y))*.004;}};
 group.userData.setSpeaking=(amount)=>{talkAmount=Math.max(0,Math.min(1,amount));updateExpression();};
 // Snapshot-ready diagnostics: expose exact positions without changing the source GLB.
 group.userData.getFaceDiagnostics=()=>({name:group.name,position:group.position.toArray(),scale:group.scale.x,eyeSize:group.userData.eyeSize,features:group.children.length});
 updateExpression();
 group.userData.setBlink(0);
 return group;
}
