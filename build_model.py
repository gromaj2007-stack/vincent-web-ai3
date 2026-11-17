import numpy as np, trimesh, math
from pathlib import Path
P=Path(__file__).parent; scene=trimesh.Scene()
C={'skin':[186,161,199,255],'hair':[101,22,170,255],'hairlight':[180,72,232,255],'hairdark':[75,20,117,255],'suit':[20,15,31,255],'lapel':[41,28,57,255],'shirt':[187,179,200,255],'metal':[31,24,45,255],'violet':[190,53,255,255],'iris':[128,22,234,255],'irislight':[208,76,255,255],'black':[19,9,32,255],'white':[205,200,217,255],'pink':[160,65,139,255],'glint':[240,179,255,255],'deep':[39,8,72,255],'silver':[150,132,180,255]}
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

# Original video-guided rebuild. Camera front = positive Z. Units arbitrary.
# Tailored silhouette using joined tapered elliptical mesh rings rather than shoulder spheres.
def loft(name,color,rings,n=48):
    vs=[];fs=[]
    for y,rx,rz,cz in rings:
        for j in range(n):
            t=2*math.pi*j/n;vs.append([rx*math.cos(t),y,cz+rz*math.sin(t)])
    for i in range(len(rings)-1):
        for j in range(n):
            a=i*n+j;b=i*n+(j+1)%n;c=(i+1)*n+j;d=(i+1)*n+(j+1)%n
            fs.extend([(a,c,b),(b,c,d)])
    mesh=trimesh.Trimesh(vertices=vs,faces=fs,process=False);mesh.fix_normals();add(mesh,color,name)
loft('Jacket_main_tailored','suit',[(-1.65,.49,.28,0),(-1.45,.60,.33,0),(-1.08,.57,.34,0),(-.63,.66,.35,0),(-.18,.80,.37,0),(.02,.68,.30,0),(.12,.35,.22,0)])
loft('White_shirt_panel','shirt',[(-1.43,.20,.015,.342),(-.9,.27,.018,.37),(-.38,.28,.024,.39),(.10,.17,.016,.35)])
for s in (-1,1):
    # sleeves and smooth tapered shoulders
    loft(f'Arm_{s}','suit',[(-1.40,.17,.20,0),(-.92,.19,.23,0),(-.35,.23,.25,0),(-.06,.26,.28,0)]) if False else None
    ball(f'Sleeve_{s}','suit',[s*.81,-.60,-.06],[.25,.66,.29],3)
    polygon(f'Lapel_{s}','lapel',[[s*.18,.02,.39],[s*.65,-.26,.38],[s*.38,-1.00,.43],[s*.20,-.47,.45]])
    polygon(f'Shirt_collar_{s}','white',[[s*.12,.08,.45],[s*.34,-.16,.46],[s*.13,-.32,.49]])
    tube(f'Violet_lapel_edge_{s}','violet',[[s*.65,-.26,.4],[s*.38,-1,.45],[s*.20,-.47,.47]],.009)
    tube(f'Sleeve_seam_{s}','lapel',[[s*.95,-.35,.14],[s*.98,-.76,.20],[s*.91,-1.18,.19]],.012)
ball('Black_tie_knot','black',[0,-.29,.51],[.11,.10,.045]);taper('Black_tie','black',[[0,-.34,.53],[0,-.63,.54],[0,-1.03,.49]],[.075,.095,.018]);ball('Jacket_button','metal',[0,-1.28,.36],[.05,.05,.02]);
ball('Cyber_neck','metal',[0,.27,-.015],[.205,.27,.21],3)
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

# More natural almond-shaped anime eyes and separate dark upper lashes.
for s in (-1,1):
    x=s*.41
    ball(f'Eye_dark_outline_{s}','black',[x,1.105,.649],[.348,.242,.047],4)
    ball(f'Eye_sclera_{s}','white',[x,1.100,.698],[.318,.213,.035],4)
    ball(f'Iris_violet_{s}','iris',[x,1.082,.733],[.176,.183,.027],4)
    ball(f'Iris_gradient_{s}','irislight',[x,1.029,.754],[.127,.128,.018],3)
    ball(f'Pupil_{s}','deep',[x,1.11,.769],[.083,.118,.018],3)
    ball(f'Heart_glint_{s}','glint',[x-s*.065,1.18,.783],[.035,.036,.012],2)
    tube(f'Upper_eyelid_{s}','black',[[x-s*.32,1.22,.705],[x-s*.12,1.32,.733],[x+s*.15,1.33,.72],[x+s*.34,1.21,.675]],.028)
    tube(f'Lower_eyelid_{s}','hairdark',[[x-s*.30,.96,.697],[x,.884,.747],[x+s*.28,.965,.681]],.012)
    for k in range(4):
        xx=x+s*(.19+k*.055)
        tube(f'Lash_{s}_{k}','black',[[xx,1.29-k*.014,.69],[xx+s*.12,1.41-k*.018,.63]],.015)
    tube(f'Eyebrow_{s}','hairdark',[[x-s*.23,1.50,.57],[x,1.55,.61],[x+s*.24,1.49,.56]],.024)
    tube(f'Cheek_neon_{s}','violet',[[s*.58,.67,.60],[s*.68,.63,.57],[s*.78,.67,.50]],.012)
    for k in range(4):
        ball(f'Freckle_{s}_{k}','pink',[s*(.54+k*.047),.62+(k%2)*.037,.603-k*.014],[.010,.009,.006],1)
tube('Smile','black',[[-.16,.47,.66],[-.08,.435,.70],[0,.428,.714],[.08,.435,.70],[.16,.47,.66]],.011)
ball('Nose','skin',[0,.73,.70],[.045,.038,.015],2)
# Curved ribbon geometry with a non-circular, tapered cross-section.
def ribbon(name,color,control,widths,depth=.027,n=45):
    control=np.array(control,float);vs=[];fs=[]
    for i in range(n+1):
        t=i/n*(len(control)-1);j=min(int(t),len(control)-2);u=t-j
        a=control[max(0,j-1)];b=control[j];c=control[j+1];d=control[min(len(control)-1,j+2)]
        p=.5*((2*b)+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u)
        w=np.interp(i/n,np.linspace(0,1,len(widths)),widths)
        tangent=control[min(j+1,len(control)-1)]-control[max(0,j-1)]
        tangent/=np.linalg.norm(tangent)+1e-8
        lateral=np.cross(tangent,[0,0,1]);lateral/=np.linalg.norm(lateral)+1e-8
        norm=np.cross(tangent,lateral);norm/=np.linalg.norm(norm)+1e-8
        for a,b in [(-1,0),(0,1),(1,0),(0,-1)]:vs.append(p+a*lateral*w+b*norm*depth)
    for i in range(n):
        for k in range(4):
            a=4*i+k;b=4*i+(k+1)%4;c=4*(i+1)+k;d=4*(i+1)+(k+1)%4
            fs.extend(((a,c,b),(b,c,d)))
    m=trimesh.Trimesh(vertices=vs,faces=fs,process=False);m.fix_normals();add(m,color,name)
# Smooth hair cap, side swept layered fringe, twin tails following the video side view.
ball('Hair_crown','hair',[0,1.79,-.12],[1.00,.36,.72],4)
for k in range(17):
    x=-.89+k*.11;drop=.15 if 5<=k<=11 else .02
    ribbon(f'Swept_fringe_{k}','hairlight' if k%6==0 else ('hairdark' if k%7==0 else 'hair'),
       [[x,2.08,.28],[x+.065,1.95,.48],[x+.10,1.77,.64],[x+.10,1.50-drop,.68]],
       [.065,.088,.071,.002],.022)
for s in (-1,1):
    ball(f'Ponytail_root_{s}','hairdark',[s*1.02,1.81,-.26],[.24,.24,.26],3)
    for k in range(15):
        spread=(k-7)/7;shift=spread*.21
        ribbon(f'Twin_tail_swept_{s}_{k}', 'hairlight' if k%4==0 else ('hairdark' if k%6==0 else 'hair'),
           [[s*(1.03+shift*.4),1.88,-.25+shift],
            [s*(1.34+shift*.6),1.48,-.28+shift],
            [s*(1.48+shift*.8),.77,-.17+shift],
            [s*(1.58+shift),-.20,.04+shift],
            [s*(1.43+shift),-1.15,.09+shift],
            [s*(1.49+shift*.7),-2.12,.07+shift]],
           [.04,.11,.13,.12,.07,.001],.022)
    for k in range(4):
        d=k*.048
        ribbon(f'Face_framing_{s}_{k}','hairlight' if k==1 else 'hair',
           [[s*(.70+d),2.00,.31],[s*(.81+d),1.67,.53],[s*(.87+d),1.16,.58],[s*(.79+d),.62,.48]],
           [.062,.080,.051,.001],.018)
# Headphone structure: double arched band, ear cups, and neon heart motifs.
for z,r in [(-.27,.067),(-.17,.038)]:
    ang=np.linspace(.08*math.pi,.92*math.pi,48)
    tube(f'Headphone_band_{z}','metal' if r>.05 else 'silver',[[1.105*math.cos(a),1.81+1.03*math.sin(a),z] for a in ang],r,steps=2,sides=10)
for s in (-1,1):
    ball(f'Headphone_cushion_{s}','black',[s*1.07,1.14,-.07],[.18,.39,.34],3)
    ball(f'Headphone_shell_{s}','metal',[s*1.22,1.15,-.05],[.13,.36,.31],3)
    ball(f'Headphone_face_{s}','deep',[s*1.335,1.15,-.03],[.025,.285,.247],3)
    for rr in [.23,.28]:
        tube(f'Headphone_light_ring_{s}_{rr}','violet',[[s*1.357,1.15+rr*math.sin(t),-.03+rr*.86*math.cos(t)] for t in np.linspace(0,2*math.pi,64)],.012,steps=1,sides=6)
    heart=[]
    for t in np.linspace(0,2*math.pi,65):
        xx=16*np.sin(t)**3/18; yy=(13*np.cos(t)-5*np.cos(2*t)-2*np.cos(3*t)-np.cos(4*t))/18
        heart.append([s*1.366,1.15+yy*.15,-.03+xx*.15])
    tube(f'Headphone_heart_{s}','glint',heart,.015,steps=1,sides=7)
heart=[]
for t in np.linspace(0,2*math.pi,64):
    x=16*np.sin(t)**3/18;y=(13*np.cos(t)-5*np.cos(2*t)-2*np.cos(3*t)-np.cos(4*t))/18
    heart.append([.44+x*.105,-.36+y*.105,.47])
tube('Blazer_heart_pin','violet',heart,.013,steps=1)
tube('Neck_glow','violet',[[.215*math.cos(t),.31,.215*math.sin(t)] for t in np.linspace(0,2*math.pi,70)],.013,steps=1)
# Separate elements are named for future animation/rigging.
scene.export(str(P/'vivi_video_rebuild.glb'))
print('Geometries:',len(scene.geometry))
