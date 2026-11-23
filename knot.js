(() => {
  const button = document.querySelector(".knot-object");
  if (!button) return;
  const canvas = button.querySelector("canvas");
  const fallback = button.querySelector(".knot-fallback");
  const stage = document.getElementById("top");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const tau = 2 * Math.PI;

  // A closed trefoil with a circular cross section. The same mesh is reused at every angle.
  function knotMesh() {
    const rings = 180, sides = 32, vertices = [], indices = [];
    const point = t => [(1.87 + .8 * Math.cos(3*t)) * Math.cos(2*t),
      (1.87 + .8 * Math.cos(3*t)) * Math.sin(2*t), .94*Math.sin(3*t)];
    const unit = v => v.map(x => x / Math.hypot(...v));
    const cross = (a,b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
    for (let i = 0; i <= rings; i++) {
      const t = i * tau / rings, c = point(t), lo = point(t-.001), hi = point(t+.001);
      const tangent = unit(hi.map((n,k) => n-lo[k]));
      const n = unit(cross(tangent,[0,0,1])), b = cross(tangent,n);
      for (let j = 0; j <= sides; j++) {
        const phi = j*tau/sides;
        const normal = n.map((v,k) => v*Math.cos(phi)+b[k]*Math.sin(phi));
        vertices.push(...c.map((v,k) => v+.28*normal[k]), ...normal, i/rings, j/sides);
        if (i < rings && j < sides) {
          const at = i*(sides+1)+j, next = at+sides+1;
          indices.push(at,next,at+1,at+1,next,next+1);
        }
      }
    }
    return {vertices:new Float32Array(vertices),indices:new Uint16Array(indices)};
  }
  function renderer() {
    const gl = canvas.getContext("webgl",{alpha:true,antialias:true,premultipliedAlpha:false,powerPreference:"low-power"});
    if (!gl) return null;
    const vs = [
      "attribute vec3 pos;attribute vec3 normal;attribute vec2 tex;",
      "uniform vec3 angle;uniform vec2 aspect;varying vec3 N;varying vec2 uv;varying float depth;",
      "vec3 turn(vec3 v){vec3 c=cos(angle),s=sin(angle);",
      "v=vec3(c.y*v.x+s.y*v.z,v.y,-s.y*v.x+c.y*v.z);",
      "v=vec3(v.x,c.x*v.y-s.x*v.z,s.x*v.y+c.x*v.z);",
      "return vec3(c.z*v.x-s.z*v.y,s.z*v.x+c.z*v.y,v.z);}",
      "void main(){vec3 p=turn(pos);N=turn(normal);uv=tex;depth=p.z;",
      "gl_Position=vec4(.326*aspect*p.xy/(1.-.045*p.z),-.2*p.z,1.);}"
    ].join("\n");
    const fs = [
      "precision mediump float;varying vec3 N;varying vec2 uv;varying float depth;",
      "void main(){vec3 n=normalize(N),l=normalize(vec3(-.63,.91,.88)),v=vec3(0.,0.,1.);",
      "float key=max(0.,dot(n,l)),edge=pow(1.-max(n.z,0.),2.8);",
      "float roll=uv.y*5.-uv.x*59.;float twist=cos(6.2832*roll);",
      "float fibre=cos(6.2832*(uv.y*25.-uv.x*132.+.16*sin(6.2832*roll)));",
      "float groove=smoothstep(.05,.99,twist);",
      "vec3 flax=mix(vec3(.43,.064,.065),vec3(.72,.18,.13),.42+depth*.10);",
      "float light=.36+.8*key+.13*max(0.,dot(n,normalize(vec3(.8,-.2,.6))));",
      "vec3 col=flax*light*(.82+.18*groove+.025*fibre);",
      "col+=vec3(.46,.30,.25)*pow(max(0.,dot(n,normalize(l+v))),18.)*(.26+.74*groove);",
      "col+=vec3(.32,.12,.11)*edge*(.28+.72*key);gl_FragColor=vec4(col,1.);}"
    ].join("\n");
    const program = gl.createProgram();
    for (const [type,source] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader,source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) return null;
      gl.attachShader(program,shader); gl.deleteShader(shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) return null;
    gl.useProgram(program);
    const mesh = knotMesh();
    gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER,mesh.vertices,gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,mesh.indices,gl.STATIC_DRAW);
    for (const [name,size,offset] of [["pos",3,0],["normal",3,12],["tex",2,24]]) {
      const loc = gl.getAttribLocation(program,name);
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,size,gl.FLOAT,false,32,offset);
    }
    const angle = gl.getUniformLocation(program,"angle"), aspect = gl.getUniformLocation(program,"aspect");
    gl.enable(gl.DEPTH_TEST); gl.clearColor(0,0,0,0);
    return (pitch,yaw,roll,w,h) => {
      const pixelScale = Math.min(devicePixelRatio||1,1.5,1120/Math.max(w,h));
      const width=Math.max(1,Math.round(w*pixelScale)), height=Math.max(1,Math.round(h*pixelScale));
      if (width!==canvas.width||height!==canvas.height) {canvas.width=width;canvas.height=height}
      gl.viewport(0,0,width,height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      gl.uniform2f(aspect,Math.min(w,h)/w,Math.min(w,h)/h);gl.uniform3f(angle,pitch,yaw,roll);
      gl.drawElements(gl.TRIANGLES,mesh.indices.length,gl.UNSIGNED_SHORT,0);
    };
  }

  let draw, armed=false, attempted=false, visible=false, reveal=0, frame=0;
  let w=1,h=1,yaw=-.36,pitch=.22,goalYaw=yaw,goalPitch=pitch;
  function render() {
    frame=0;
    if (!visible || reveal<=0 || document.hidden) return;
    if (!attempted) {
      attempted=true;
      try { draw=renderer() } catch { draw=null }
      button.dataset.render=draw?"mesh":"poster";
    }
    const blend = reduced.matches ? 1 : .24;
    yaw+=(goalYaw-yaw)*blend; pitch+=(goalPitch-pitch)*blend;
    const turn=yaw;
    if (draw) draw(pitch,turn,-.32,w,h);
    else fallback.style.transform="rotate("+((turn+.36)*18)+"deg) scaleX("+(.88+.12*Math.cos(turn+.36))+")";
    if (Math.abs(goalYaw-yaw)+Math.abs(goalPitch-pitch)>.003) wake();
  }
  function wake(){if (armed && !frame && visible && reveal>0 && !document.hidden)frame=requestAnimationFrame(render)}
  function resize(){w=button.clientWidth||1;h=button.clientHeight||1;wake()}
  new ResizeObserver(resize).observe(button);
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;wake()}).observe(stage);
  window.addEventListener("film-progress",event=>{const wasVisible=reveal>0;reveal=event.detail.knotReveal;if(!wasVisible && reveal>0)wake()});
  reveal=stage.dataset.knotVisible==="true"?1:0;
  document.addEventListener("visibilitychange",wake);
  canvas.addEventListener("webglcontextlost",e=>{e.preventDefault();draw=null;button.dataset.render="poster";wake()});
  canvas.addEventListener("webglcontextrestored",()=>{attempted=false;wake()});

  // Scrolling uses a still rendered from this mesh. Initialise the renderer on interaction.
  button.dataset.render="poster";
  function arm(){armed=true;wake()}
  button.addEventListener("pointerenter",e=>{if(e.pointerType==="mouse" && reveal>.995)arm()});
  button.addEventListener("focus",arm);
  let gesture=null, suppressClick=false;
  button.addEventListener("pointerdown",e=>{
    if (!e.isPrimary || e.button!==0) return;
    arm();suppressClick=false;
    gesture={id:e.pointerId,x:e.clientX,y:e.clientY,pitch:goalPitch,yaw:goalYaw,dragging:false};
    button.setPointerCapture(e.pointerId);
  });
  button.addEventListener("pointermove",e=>{
    if (!gesture || gesture.id!==e.pointerId) return;
    const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;
    if (!gesture.dragging && Math.max(Math.abs(dx),Math.abs(dy))<5) return;
    gesture.dragging=true;
    goalYaw=gesture.yaw+dx*4.3/Math.max(180,w);
    goalPitch=gesture.pitch+dy*3/Math.max(180,h);
    wake();
  });
  function end(e){if (gesture&&gesture.id===e.pointerId){suppressClick=gesture.dragging;gesture=null}}
  button.addEventListener("pointerup",end);button.addEventListener("lostpointercapture",end);
  button.addEventListener("click",e=>{
    arm();if (!suppressClick || e.detail===0){goalYaw+=tau/5;wake()}
    suppressClick=false;
  });
  button.addEventListener("keydown",e=>{
    if (e.key!=="ArrowLeft" && e.key!=="ArrowRight") return;
    e.preventDefault();arm();goalYaw+=e.key==="ArrowLeft"?-.42:.42;wake();
  });
  resize();
})();
