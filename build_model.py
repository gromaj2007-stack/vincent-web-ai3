import numpy as np, trimesh, math
from pathlib import Path
P=Path(__file__).parent; scene=trimesh.Scene()
C={'skin':[204,184,225,255],'hair':[127,42,211,255],'hairlight':[188,93,250,255],'hairdark':[75,20,117,255],'suit':[20,15,31,255],'lapel':[41,28,57,255],'shirt':[245,237,255,255],'metal':[31,24,45,255],'violet':[190,53,255,255],'iris':[128,22,234,255],'irislight':[208,76,255,255],'black':[19,9,32,255],'white':[255,251,255,255],'pink':[245,126,228,255],'glint':[240,179,255,255],'deep':[39,8,72,255],'silver':[150,132,180,255]}
def add(mesh, color, name):
 mesh.visual.vertex_colors=np.tile(C[color],(len(mesh.vertices),1));scene.add_geometry(mesh,geom_name=name)
def ball(name,c,pos,scale,sub=3):
 m=trimesh.creation.icosphere(subdivisions=sub,radius=1);m.apply_scale(scale);m.apply_translation(pos);add(m,c,name)
def tube(name,c,pts,r=.02,steps=7,sides=8):
 pts=np.array(pts,float); arr=[]
 for a,b in zip(pts[:-1],pts[1:]):
  for t in np.linspace(0,1,steps,endpoint=False):arr.append(a*(1-t)+b*t)
 arr.append(pts[-1]);arr=np.array(arr);vs=[];fs=[]
 for i,p in enumerate(arr):
  d=arr[min(len(arr)-1,i+1)]-arr[max(0,i-1)];d=d/(np.linalg.norm(d)+1e-9);v=np.cross(d,[0,0,1]);
  if np.linalg.norm(v)<.01:v=np.cross(d,[0,1,0])
  v/=np.linalg.norm(v);w=np.cross(d,v)
  for j in range(sides):
   th=2*np.pi*j/sides;vs.append(p+r*(v*np.cos(th)+w*np.sin(th)))
 for i in range(len(arr)-1):
  for j in range(sides):
   a=i*sides+j;b=i*sides+(j+1)%sides;cc=(i+1)*sides+j;d=(i+1)*sides+(j+1)%sides;fs.extend([(a,cc,b),(b,cc,d)])
 add(trimesh.Trimesh(vertices=vs,faces=fs,process=False),c,name)
def taper(name,c,pts,rads,sides=12):
 pts=np.array(pts,float);vs=[];fs=[]
 for i,p in enumerate(pts):
  d=pts[min(i+1,len(pts)-1)]-pts[max(0,i-1)];d=d/(np.linalg.norm(d)+1e-9);v=np.cross(d,[0,0,1]);
  if np.linalg.norm(v)<.01:v=np.cross(d,[0,1,0])
  v/=np.linalg.norm(v);w=np.cross(d,v)
  for j in range(sides):
   th=j*2*np.pi/sides;vs.append(p+rads[i]*(v*np.cos(th)+w*np.sin(th)*.74))
 for i in range(len(pts)-1):
  for j in range(sides):
   a=i*sides+j;b=i*sides+(j+1)%sides;cc=(i+1)*sides+j;d=(i+1)*sides+(j+1)%sides;fs.extend([(a,cc,b),(b,cc,d)])
 add(trimesh.Trimesh(vertices=vs,faces=fs,process=False),c,name)
def polygon(name,c,points):
 vs=np.array(points,float);fs=[(0,i,i+1) for i in range(1,len(vs)-1)];add(trimesh.Trimesh(vertices=vs,faces=fs,process=False),c,name)
# upper torso (camera front is +Z)
ball('01_tailored_jacket','suit',[0,-.64,0],[.81,.98,.43],4)
ball('02_shirt','shirt',[0,-.43,.39],[.43,.79,.12],3)
ball('03_neck','metal',[0,.28,0],[.22,.27,.23],3)
for s in (-1,1):
 ball(f'04_shoulder_{s}','suit',[s*.77,-.16,0],[.30,.40,.38],3)
 ball(f'05_arm_{s}','suit',[s*.88,-.66,.015],[.26,.58,.29],3)
 polygon(f'06_lapel_{s}','lapel',[[s*.16,.05,.54],[s*.56,-.22,.41],[s*.33,-.83,.52],[s*.18,-.38,.55]])
 polygon(f'07_collar_{s}','white',[[s*.13,.04,.53],[s*.34,-.17,.54],[s*.12,-.33,.57]])
 tube(f'08_piping_{s}','violet',[[s*.55,-.23,.43],[s*.33,-.84,.55],[s*.20,-.44,.57]],.013)
ball('09_tie_knot','black',[0,-.25,.58],[.115,.115,.06]);taper('10_tie','black',[[0,-.31,.59],[0,-.56,.61],[0,-.84,.59]],[.085,.095,.02]);ball('11_jacket_button','metal',[0,-1.02,.46],[.055,.055,.03])
# face
# Custom continuous anime face mesh: broad forehead, full cheeks, tapered jaw, integrated chin.
def face_mesh():
    vertices=[]; faces=[]; nlat=65; nlon=112
    for i in range(nlat+1):
        phi=math.pi*i/nlat
        yy=math.cos(phi)
        for j in range(nlon):
            th=2*math.pi*j/nlon
            x=math.sin(phi)*math.cos(th)
            z=math.sin(phi)*math.sin(th)
            # Sculpted jawline narrows toward the chin while retaining full cheeks.
            jaw=1-.25*max(0,-yy)**1.7
            cheek=1+.075*math.exp(-((yy+.22)/.30)**2)
            xx=x*1.00*jaw*cheek
            y=1.05+yy*1.01
            zz=.025+z*(.67+.045*math.exp(-((yy+.30)/.3)**2))
            # Smoothly project front of the face at mouth and nose, no protruding triangles.
            if z>0:
                zz+=.038*math.exp(-(xx/.43)**2-((yy+.42)/.38)**2)
            vertices.append((xx,y,zz))
    for i in range(nlat):
        for j in range(nlon):
            a=i*nlon+j;b=i*nlon+(j+1)%nlon;c=(i+1)*nlon+j;d=(i+1)*nlon+(j+1)%nlon
            faces.extend(((a,c,b),(b,c,d)))
    mesh=trimesh.Trimesh(vertices=vertices,faces=faces,process=False)
    mesh.fix_normals()
    add(mesh,'skin','12_sculpted_single_piece_face')
face_mesh()
for s in (-1,1):
 x=s*.42
 ball(f'14_eyeliner_{s}','black',[x,1.10,.649],[.37,.41,.095],4)
 ball(f'15_eyewhite_{s}','white',[x,1.09,.718],[.333,.367,.075],4)
 ball(f'16_iris_outer_{s}','iris',[x,1.055,.785],[.24,.286,.04],4)
 ball(f'17_iris_inner_{s}','irislight',[x,1.005,.818],[.175,.198,.03],3)
 ball(f'18_pupil_{s}','black',[x,1.063,.838],[.116,.158,.025],3)
 ball(f'19_catchlight_{s}','white',[x-s*.085,1.185,.864],[.062,.071,.02],2)
 ball(f'20_cheek_{s}','pink',[s*.73,.66,.56],[.12,.035,.026],3)
 tube(f'21_brow_{s}','hairdark',[[x-s*.29,1.51,.60],[x,1.56,.66],[x+s*.26,1.49,.59]],.029)
 tube(f'22_upper_lash_{s}','black',[[x-s*.32,1.37,.73],[x,1.47,.79],[x+s*.30,1.38,.69]],.032)
 for j in range(3):
  xx=x+s*(.24+j*.045);tube(f'23_lash_{s}_{j}','black',[[xx,1.39-j*.022,.70],[xx+s*.11,1.48-j*.025,.64]],.014)
 tube(f'24_cheek_glow_{s}','violet',[[s*.65,.68,.64],[s*.80,.73,.56]],.014)
tube('25_smile','black',[[-.18,.47,.677],[-.09,.43,.728],[0,.42,.746],[.09,.43,.728],[.18,.47,.677]],.016)
ball('26_nose','skin',[0,.72,.73],[.07,.05,.025],2)
# hair cap and 3D bangs
ball('27_hair_cap','hair',[0,1.80,-.12],[1.02,.39,.73],4)
for i in range(13):
 x=-.89+i*.145; yend=1.42-(.18 if 4<=i<=8 else .06)
 taper(f'28_bang_{i}','hairlight' if i%4==0 else 'hair',[[x,2.05,.28],[x-.035,1.91,.53],[x-.065,1.71,.66],[x-.08,yend,.67]],[.125,.115,.077,.007])
# headphone arch
ang=np.linspace(math.pi*.07,math.pi*.93,25)
tube('29_headphone_band','metal',[[1.11*np.cos(a),1.82+1.03*np.sin(a),-.20] for a in ang],.086)
for s in (-1,1):
 ball(f'30_earpad_{s}','metal',[s*1.075,1.12,-.015],[.18,.40,.37],3)
 ball(f'31_earpiece_{s}','black',[s*1.22,1.13,.01],[.09,.34,.31],3)
 ball(f'32_earglow_{s}','violet',[s*1.297,1.13,.04],[.025,.26,.25],3)
 # hearts on sides, visible from the front at angle
 heart=[]
 for t in np.linspace(0,2*np.pi,50):
  xx=16*np.sin(t)**3/18;yy=(13*np.cos(t)-5*np.cos(2*t)-2*np.cos(3*t)-np.cos(4*t))/18
  heart.append([s*1.326,1.14+yy*.12,.06+xx*.12])
 tube(f'33_headphone_heart_{s}','white',heart,.013,steps=1)
 # multiple swept hair ribbons/locks down both sides
 for k in range(14):
  offset=(k-6.5)*.052
  pts=[];rads=[]
  for i,t in enumerate(np.linspace(0,1,24)):
   x=s*(.95+.34*np.sin(t*2.5)+.16*t+offset*.35)
   y=1.82-3.85*t
   z=-.22+offset+.14*np.sin(t*4+k*.3)
   pts.append([x,y,z]);rads.append((.075 if k%3 else .09)*(1-t**5)+.002)
  taper(f'34_ponytail_{s}_{k}','hairlight' if k%4==0 else ('hairdark' if k%5==0 else 'hair'),pts,rads,8)
 ball(f'35_hair_tie_{s}','hairdark',[s*.98,1.79,-.22],[.22,.25,.23],3)
# heart brooch on jacket
heart=[]
for t in np.linspace(0,2*np.pi,55):
 x=16*np.sin(t)**3/18;y=(13*np.cos(t)-5*np.cos(2*t)-2*np.cos(3*t)-np.cos(4*t))/18
 heart.append([.45+x*.115,-.38+y*.115,.53])
tube('36_jacket_heart','violet',heart,.015,steps=1)
# Detail pass: individual hair fibres, subtle iris rings, eyelids, decorative suit stitching
for side in (-1,1):
 x=side*.42
 # concentric purple iris accents, sparkle and heart-shaped catchlights
 for rad in (.205,.167):
  points=[[x+rad*math.cos(t),1.06+rad*1.15*math.sin(t),.846] for t in np.linspace(0,2*math.pi,46)]
  tube(f'detail_iris_ring_{side}_{rad}','glint' if rad<.2 else 'deep',points,.009,steps=1,sides=6)
 for j in range(12):
  t=j*math.pi*2/12
  tube(f'detail_iris_ray_{side}_{j}','glint',[[x+.17*math.cos(t),1.06+.19*math.sin(t),.846],[x+.195*math.cos(t),1.06+.225*math.sin(t),.846]],.004,steps=1,sides=5)
 # upper and lower eyeliner curves, eye corner
 tube(f'detail_lower_lid_{side}','hairdark',[[x-side*.29,.89,.756],[x,.79,.80],[x+side*.27,.90,.735]],.013,sides=7)
 tube(f'detail_eye_corner_{side}','black',[[x+side*.26,1.37,.73],[x+side*.40,1.42,.62]],.025,sides=7)
 # eyebrow highlight
 tube(f'detail_brow_glint_{side}','hairlight',[[x-side*.23,1.57,.64],[x,1.60,.68],[x+side*.18,1.55,.63]],.011,sides=7)
 # soft lower blush streaks
 for j in range(3):
  tube(f'detail_blush_{side}_{j}','pink',[[side*(.65+j*.045),.64-j*.027,.607],[side*(.72+j*.045),.65-j*.027,.568]],.008,sides=6)
 # earpiece concentric neon border
 for r in (.205,.24,.285):
  pts=[[side*1.315,1.13+r*math.sin(t),.04+r*.88*math.cos(t)] for t in np.linspace(0,2*math.pi,72)]
  tube(f'detail_earring_{side}_{r}','violet' if r!=.24 else 'silver',pts,.009,steps=1,sides=7)
 # headphone band visible metallic trim
 tube(f'detail_headphone_arm_{side}','silver',[[side*1.10,1.78,-.20],[side*1.16,1.60,-.18],[side*1.18,1.43,-.12]],.025,sides=8)
 # Ponytail micro-strands, following the larger ribbon curvature with offsets
 for k in range(24):
  offset=(k-11.5)*.029
  pts=[]
  for t in np.linspace(.03,.96,22):
   xh=side*(.96+.34*np.sin(t*2.5)+.16*t+offset*.35)
   yh=1.82-3.85*t
   zh=-.20+offset+.14*np.sin(t*4+k*.21)+.065
   pts.append([xh,yh,zh])
  tube(f'detail_hair_fibre_{side}_{k}','glint' if k%6==0 else ('hairlight' if k%2 else 'hairdark'),pts,.007 if k%6 else .011,steps=2,sides=5)
 # side framing face locks
 for k in range(4):
  ox=k*.055
  taper(f'detail_face_lock_{side}_{k}','hairlight' if k==1 else 'hair',[[side*(.79+ox),1.97,.31],[side*(.93+ox),1.58,.51],[side*(.90+ox),1.10,.57],[side*(.84+ox),.62,.45]],[.065,.075,.045,.003],12)
 # blazer seams, shoulder line and piping
 tube(f'detail_jacket_shoulder_{side}','silver',[[side*.48,.12,.20],[side*.74,.11,.22],[side*.95,-.12,.13]],.008,sides=6)
 tube(f'detail_sleeve_seam_{side}','lapel',[[side*.97,-.28,.22],[side*1.01,-.70,.25],[side*.98,-1.08,.18]],.012,sides=6)
 tube(f'detail_jacket_edge_{side}','violet',[[side*.18,.02,.57],[side*.56,-.22,.44],[side*.35,-.84,.56]],.009,sides=6)
 # Shirt collar stitching
 tube(f'detail_collar_stitch_{side}','silver',[[side*.14,.01,.558],[side*.31,-.16,.557],[side*.14,-.30,.588]],.006,sides=6)
# Bang strands layered over the main hair mass
for i in range(20):
 xx=-.87+i*.092
 pts=[[xx,2.09,.30],[xx-.03,1.97,.51],[xx-.065,1.78,.665],[xx-.085,1.48-(.11 if 7<=i<=13 else 0),.693]]
 tube(f'detail_bang_fibre_{i}','glint' if i%5==0 else 'hairlight',pts,.008 if i%5 else .013,steps=4,sides=6)
# Heart badge rim, button reflections, tie stitching
ball('detail_jacket_button_glint','silver',[-.014,-.998,.491],[.018,.019,.012],2)
tube('detail_tie_stitch','lapel',[[0,-.34,.655],[0,-.54,.668],[0,-.77,.638]],.006,sides=6)
# Neck luminous trim, metallic seams
for r in (.215,.235):
 tube(f'detail_neck_ring_{r}','violet',[[r*math.cos(t),.33,r*math.sin(t)] for t in np.linspace(0,2*math.pi,65)],.013,steps=1,sides=7)
# Smile corner highlights
for side in (-1,1):
 tube(f'detail_smile_corner_{side}','pink',[[side*.15,.465,.68],[side*.20,.475,.661]],.009,sides=6)

# Rebuilt 3D layered hair: curved flattened tapered meshes, each with volume and smooth shading.
def hair_ribbon(name, color, control, widths, thickness=.035, n=64):
    control=np.asarray(control,dtype=float)
    pts=[]; rs=[]
    for i in range(n+1):
        t=i/n*(len(control)-1); a=min(int(t),len(control)-2); u=t-a
        p0=control[max(0,a-1)];p1=control[a];p2=control[a+1];p3=control[min(len(control)-1,a+2)]
        p=.5*((2*p1)+(-p0+p2)*u+(2*p0-5*p1+4*p2-p3)*u*u+(-p0+3*p1-3*p2+p3)*u*u*u)
        pts.append(p);rs.append(np.interp(i/n,np.linspace(0,1,len(widths)),widths))
    verts=[];faces=[]
    for i,p in enumerate(pts):
        tangent=np.asarray(pts[min(n,i+1)])-np.asarray(pts[max(0,i-1)]);tangent/=np.linalg.norm(tangent)+1e-9
        sideways=np.cross(tangent,[0,0,1]); sideways/=np.linalg.norm(sideways)+1e-9
        depth=np.cross(tangent,sideways);depth/=np.linalg.norm(depth)+1e-9
        for u,v in [(-1,0),(0,1),(1,0),(0,-1)]:
            verts.append(p+sideways*u*rs[i]+depth*v*thickness)
    for i in range(n):
        for k in range(4):
            a=i*4+k;b=i*4+(k+1)%4;c=(i+1)*4+k;d=(i+1)*4+(k+1)%4
            faces.extend(((a,c,b),(b,c,d)))
    mesh=trimesh.Trimesh(vertices=verts,faces=faces,process=False);mesh.fix_normals();add(mesh,color,name)
# Large structured outer ponytail ribbons with individual layered tips.
for side in (-1,1):
    for k in range(9):
        a=(k-4)/4
        hair_ribbon(f'remodel_pigtail_ribbon_{side}_{k}', 'hairlight' if k%4==0 else ('hairdark' if k%5==0 else 'hair'),
          [[side*(.94+a*.14),1.87,-.21+a*.13],
           [side*(1.25+a*.17),1.48,-.18+a*.14],
           [side*(1.39+a*.21),.61,-.12+a*.19],
           [side*(1.43+a*.25),-.43,.04+a*.23],
           [side*(1.27+a*.27),-1.48,.11+a*.23],
           [side*(1.35+a*.20),-2.10,.08+a*.16]],
          [.055,.12,.14,.105,.07,.001],.025)
    for k in range(4):
        a=k*.055
        hair_ribbon(f'remodel_face_framing_{side}_{k}','hairlight' if k==1 else 'hair',
          [[side*(.68+a),2.01,.33],[side*(.83+a),1.78,.57],
           [side*(.91+a),1.33,.63],[side*(.88+a),.82,.58],[side*(.82+a),.48,.46]],
          [.075,.09,.075,.045,.001],.018)
for k in range(13):
    x=-.83+k*.14
    hair_ribbon(f'remodel_bang_{k}','hairlight' if k%5==0 else 'hair',
      [[x,2.13,.23],[x-.015,2.01,.49],[x-.035,1.80,.68],[x-.06,1.52-(.17 if 4<=k<=8 else .02),.69]],
      [.085,.12,.095,.001],.023)
# Tailored blouse panel and sculpted lapel edge accents.
for side in (-1,1):
    tube(f'remodel_cheek_circuit_{side}','glint',[[side*.59,.69,.60],[side*.68,.65,.58],[side*.77,.69,.53]],.008,sides=8)
    tube(f'remodel_eyelid_crease_{side}','hairdark',[[side*.16,1.51,.64],[side*.42,1.56,.67],[side*.72,1.47,.58]],.012,sides=8)


# Atelier 3.4: reference-driven finer layered geometry. Geometry remains fully 3D.
# Fine swept strands follow the sculpted large hair ribbons instead of adding disconnected spheres.
for side in (-1,1):
    for layer in range(3):
        for k in range(22):
            a=(k-10.5)/11
            zoff=(layer-1)*.055
            control=[
                [side*(.97+a*.16),1.84,-.19+a*.15+zoff],
                [side*(1.27+a*.20),1.47,-.17+a*.18+zoff],
                [side*(1.40+a*.24),.60,-.09+a*.22+zoff],
                [side*(1.42+a*.27),-.46,.07+a*.24+zoff],
                [side*(1.28+a*.28),-1.45,.12+a*.25+zoff],
                [side*(1.34+a*.23),-2.10,.10+a*.19+zoff]]
            hair_ribbon(f'atelier_swept_strand_{side}_{layer}_{k}',
                'glint' if k%13==0 else ('hairlight' if (k+layer)%4==0 else 'hair'),
                control,[.006,.019,.022,.015,.009,.001],.006,n=38)
    # Extra swept hair strands around the temple, designed to leave the eyes visible.
    for k in range(9):
        t=k/8
        hair_ribbon(f'atelier_temporal_lock_{side}_{k}',
            'hairlight' if k%3==0 else 'hair',
            [[side*(.74+t*.19),2.01,.32],
             [side*(.84+t*.16),1.74,.52],
             [side*(.87+t*.13),1.33,.57],
             [side*(.86+t*.10),.85,.51],
             [side*(.79+t*.09),.43,.41]],
            [.018,.026,.019,.012,.001],.008,n=32)
    # More delicate glowing circuitry, cheek accents and iris sparkle.
    tube(f'atelier_cheek_arc_{side}','glint',
        [[side*.60,.67,.628],[side*.67,.63,.607],[side*.77,.66,.548]],.008,sides=8)
    x=side*.42
    for j in range(4):
        phi=j*math.pi/2+.25
        ball(f'atelier_eye_sparkle_{side}_{j}','white',
             [x+.14*math.cos(phi),1.06+.17*math.sin(phi),.872],[.012,.016,.006],2)
    # Sculpted luminous headphone edge, with multiple nested contours.
    for rr in (.16,.19,.22):
        tube(f'atelier_headset_contour_{side}_{rr}','glint',
            [[side*1.34,1.13+rr*math.sin(t),.04+rr*.85*math.cos(t)]
             for t in np.linspace(0,2*math.pi,72)],.006,steps=1,sides=6)
# Individual curved highlight filaments in the bangs.
for k in range(36):
    x=-.84+k*.048
    control=[[x,2.12,.28],[x-.02,1.99,.52],[x-.04,1.81,.69],
             [x-.07,1.54-(.14 if 12<=k<=24 else .01),.704]]
    hair_ribbon(f'atelier_bang_sheen_{k}',
        'glint' if k%8==0 else 'hairlight',control,[.005,.010,.008,.001],.004,n=24)
# Small metallic jacket and tie highlights.
for side in (-1,1):
    tube(f'atelier_lapel_edge_{side}','glint',
         [[side*.20,-.02,.565],[side*.54,-.23,.458],[side*.34,-.80,.566]],.005,sides=7)
    tube(f'atelier_collar_edge_{side}','silver',
         [[side*.14,.01,.564],[side*.31,-.16,.563],[side*.14,-.29,.59]],.004,sides=7)


# Atelier 3.5: mesh-level material variation and sculpted eye accents.
# Vertex colours allow soft skin blush and strand-wise specular-looking colour variation
# without scattering additional primitive meshes on the face.
for name, mesh in scene.geometry.items():
    if 'sculpted_single_piece_face' in name:
        v=mesh.vertices
        base=np.array([221.,199.,232.]); rgb=np.tile(base,(len(v),1))
        for side in (-1,1):
            blush=np.exp(-((v[:,0]-side*.68)/.23)**2-((v[:,1]-.64)/.19)**2)
            rgb += blush[:,None]*np.array([24.,-45.,11.])[None,:]
        # Slightly warmer lower-face gradient, brighter forehead, soft cheek shading.
        rgb+=np.clip((v[:,1]-.45)/1.6,0,1)[:,None]*np.array([5.,6.,9.])[None,:]
        mesh.visual.vertex_colors=np.c_[np.uint8(np.clip(rgb,0,255)),np.full(len(v),255,dtype=np.uint8)]
    elif any(k in name for k in ['pigtail_ribbon','atelier_swept_strand','remodel_bang','atelier_bang_sheen']):
        v=mesh.vertices
        t=np.clip((v[:,1]+2.15)/4.4,0,1)
        base=np.array(mesh.visual.vertex_colors[0,:3],float)
        # Gentle lilac highlights following hair curvature and root-to-tip tonal change.
        sheen=(.55+.45*np.sin(v[:,0]*11+v[:,2]*7))*np.clip(t+.12,0,1)
        rgb=np.clip(base[None,:]*(.75+.17*t[:,None])+sheen[:,None]*np.array([28.,14.,39.]),0,255)
        mesh.visual.vertex_colors=np.c_[rgb.astype(np.uint8),np.full(len(v),255,dtype=np.uint8)]

# Multi-layer sculpted lids and subtle highlight arcs around the eyes.
for side in (-1,1):
    x=side*.42
    for lid in range(3):
        lift=lid*.022
        pts=[[x-side*.31,1.34+lift,.758],
             [x-side*.16,1.435+lift,.805],
             [x,1.465+lift,.815],
             [x+side*.17,1.43+lift,.788],
             [x+side*.30,1.36+lift,.735]]
        tube(f'35_sculpted_upper_lid_{side}_{lid}',
             'black' if lid==0 else ('hairdark' if lid==1 else 'hair'),pts,
             .015 if lid==0 else .009,steps=4,sides=8)
    # Individual oval catchlights and a stylized heart-shaped highlight.
    heart=[]
    for t in np.linspace(0,2*np.pi,46):
        hx=16*np.sin(t)**3/18
        hy=(13*np.cos(t)-5*np.cos(2*t)-2*np.cos(3*t)-np.cos(4*t))/18
        heart.append([x-side*.095+hx*.033,1.17+hy*.034,.881])
    tube(f'35_eye_heart_reflection_{side}','white',heart,.006,steps=1,sides=7)
    # Upper lashes fanning outward rather than uniform vertical spikes.
    for k in range(5):
        u=k/4
        xx=x+side*(.17+.15*u)
        tube(f'35_fanned_lash_{side}_{k}','black',
             [[xx,1.42-.035*u,.766-.07*u],
              [xx+side*(.045+.045*u),1.49+.04*u,.737-.085*u]],
             .011-.004*u,steps=4,sides=7)

# Curved surface strands around the temples and above the ears.
for side in (-1,1):
    for k in range(8):
        q=k/7
        hair_ribbon(f'35_sculpted_temple_{side}_{k}',
            'hairlight' if k in (1,5) else ('hairdark' if k==7 else 'hair'),
            [[side*(.78+.11*q),2.04,.28-.04*q],
             [side*(.93+.12*q),1.75,.46-.02*q],
             [side*(1.01+.10*q),1.25,.51-.03*q],
             [side*(.98+.11*q),.69,.43-.04*q],
             [side*(.89+.12*q),.25,.32-.05*q]],
            [.024,.055,.051,.034,.001],.018,n=48)
# Additional jacket fabric edge folds, dimensional cuff lines, and glowing trim.
for side in (-1,1):
    for k in range(3):
        tube(f'35_jacket_fabric_fold_{side}_{k}','lapel',
             [[side*(.57+.065*k),-.28,.37],
              [side*(.65+.065*k),-.55,.39],
              [side*(.59+.065*k),-.92,.39]],.008,steps=4,sides=7)
    tube(f'35_sleeve_cuff_{side}','violet',
         [[side*.83,-1.13,.18],[side*.94,-1.14,.28],[side*1.04,-1.12,.19]],
         .009,steps=4,sides=7)
# Atelier 3.6: sculpted, asymmetric strand layers with finely varied lilac tones.
for side in (-1,1):
    for k in range(26):
        q=k/25
        # Separate fine strand ribbons following the flowing twin-tail silhouette.
        x0=side*(1.16+.15*q)
        z0=-.05+.27*q
        wave=.075*math.sin(q*13)
        hair_ribbon(f'36_twin_tail_microstrand_{side}_{k}',
          'glint' if k%9==0 else ('hairlight' if k%4==0 else 'hair'),
          [[x0,1.55,z0],[x0+side*(.15+wave),1.08,z0+.08],
           [x0+side*(.23+wave),.42,z0+.12],
           [x0+side*(.15-wave),-.38,z0+.08],
           [x0+side*(.28+wave),-1.20,z0+.05],
           [x0+side*(.33+wave),-1.75,z0]],
          [.012,.021,.018,.016,.010,.0007],.006,n=55)
    # Glowing decorative seams on the headset and jacket.
    for k in range(3):
        tube(f'36_headphone_filigree_{side}_{k}','violet',
          [[side*1.307,1.03+k*.10,-.17],[side*1.32,1.06+k*.10,.03],
           [side*1.309,1.03+k*.10,.21]],.0035,steps=3,sides=6)
# Delicate lower-lid glints, iris rays and cheek contour gradients.
for side in (-1,1):
    x=side*.42
    for k in range(16):
        a=2*math.pi*k/16
        xx=x+.158*math.cos(a); yy=1.065+.195*math.sin(a)
        tube(f'36_iris_radial_{side}_{k}', 'irislight' if k%3 else 'glint',
            [[xx,yy,.847],[x+.198*math.cos(a),1.065+.235*math.sin(a),.833]],
            .003,steps=2,sides=6)
    tube(f'36_lower_lid_{side}','pink',
      [[x-side*.25,.84,.739],[x,.77,.786],[x+side*.24,.86,.722]],
      .008,steps=6,sides=8)
scene.export(P/'vivi.glb')
print('Exported',P/'vivi.glb', 'meshes',len(scene.geometry))
