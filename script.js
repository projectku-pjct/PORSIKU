// ===== PENGATURAN ADMIN =====
const CONFIG={
  SHEET_URL:'https://script.google.com/macros/s/AKfycbwXnbrkRuuKORSflSPbDcrq1sEMJvpQM1FqbgzpymA60zmsRJeYy9faTzUIjRTB3gB1/exec', // URL Web App Google Apps Script (lihat code.gs)
  TOKEN:'PORSIKU1234',  // harus sama dengan TOKEN di code.gs
  WA:'6285134507500',   // WhatsApp tim Porsiku (+62 851-3450-7500)
  HARGA:0               // nominal konsultasi (rupiah), 0 = tidak ditampilkan
};
// Persentase zat gizi makro terhadap energi. Ganti di sini bila acuan dari tim sudah ada.
const PERSEN={p:15,l:25,kh:60};

const ALERGI=['Telur','Susu','Kacang','Seafood','Gluten','Kedelai'];
// Kelompok protein hewani; tag = alergi utama yang membuat kelompok ini perlu dihindari
const PROTEIN=[
 {nama:'Unggas & daging',contoh:'Ayam, bebek, daging sapi',kw:['ayam','bebek','daging','sapi','kambing'],tag:null},
 {nama:'Ikan & seafood',contoh:'Tongkol, kembung, udang, cumi',kw:['ikan','tongkol','kembung','udang','cumi','kerang','seafood'],tag:'seafood'},
 {nama:'Telur',contoh:'Telur ayam, telur puyuh',kw:['telur'],tag:'telur'},
 {nama:'Susu & olahannya',contoh:'Susu, keju, yoghurt',kw:['susu','keju','yogurt','yoghurt'],tag:'susu'}];

const AKT=[
 [1.1,'Sangat rendah','Sebagian besar waktu berbaring atau duduk; perawatan diri dasar, sangat sedikit berjalan.'],
 [1.2,'Sedenter','Bekerja/belajar sambil duduk, pakai komputer, membaca, menonton, berjalan singkat di rumah.'],
 [1.3,'Sedenter + sedikit bergerak','Mayoritas duduk, sesekali berdiri, berjalan mengambil barang, pindah jarak dekat.'],
 [1.4,'Aktivitas ringan','Belajar/bekerja sambil duduk, memasak, mencuci piring, merapikan kamar, berjalan singkat.'],
 [1.5,'Ringan menuju sedang','Pekerjaan rumah rutin, lebih sering berjalan, aktivitas fisik ringan durasi lebih panjang.'],
 [1.6,'Aktivitas sedang','Banyak berjalan, bersepeda santai, pekerjaan rumah cukup aktif, atau olahraga sedang rutin.'],
 [1.7,'Sedang menuju tinggi','Aktivitas fisik durasi panjang, banyak berjalan, pekerjaan yang menuntut gerak hampir seharian.'],
 [1.8,'Aktivitas tinggi','Pekerjaan lapangan aktif, banyak berjalan, mengangkat barang, atau latihan berat rutin.'],
 [1.9,'Sangat tinggi','Pekerjaan fisik berat + latihan intens, atau aktivitas fisik berdurasi panjang.']];
const TABEL={
 'Indikator harian':{head:['Faktor','Kategori','Rincian kegiatan sehari-hari'],rows:AKT.map(a=>[a[0].toFixed(1).replace('.',','),a[1],a[2]]),note:'Faktor ini yang dikalikan dengan BMR untuk total energi.'},
 'Kategori IMT':{head:['Kategori','IMT (kg/m²)','Keterangan'],rows:[['Sangat kurus','< 17,0','Kekurangan berat badan tingkat berat'],['Kurus','17,0 – 18,4','Kekurangan berat badan tingkat ringan'],['Normal','18,5 – 25,0','Berat badan normal'],['Gemuk','> 25,0 – 27,0','Kelebihan berat badan tingkat ringan'],['Obesitas','> 27,0','Kelebihan berat badan tingkat berat']],note:'Ambang batas mengikuti Kemenkes RI untuk dewasa. Usia di bawah 18 tahun dinilai dengan IMT menurut umur (Z-score).'},
 'Anak & dewasa':{head:['Aktivitas fisik','Anak L','Anak P','Dewasa L','Dewasa P'],rows:[['Ringan','1,00','1,00','1,00','1,00'],['Aktivitas rendah','1,13','1,16','1,11','1,12'],['Aktif','1,26','1,31','1,25','1,27'],['Sangat aktif','1,46','1,56','1,48','1,56']],note:'Tabel referensi. Kolom yang menyala sesuai kelompokmu.'},
 'Perempuan':{head:['Aktivitas','Jenis kegiatan','Faktor'],rows:[['Sangat ringan','100% waktu berdiri/duduk','1,30'],['Ringan','75% berdiri/duduk, 25% aktivitas lain','1,55'],['Sedang','60% berdiri/duduk, 40% aktivitas lain','1,70'],['Berat','40% berdiri/duduk, 60% aktivitas lain','2,00']],note:'Sumber: Almatsier S, 2011.'}};
const SLOT_U=[['Makan pagi',.25],['Makan siang',.30],['Makan malam',.25]],SLOT_S=[['Selingan pagi',.10],['Selingan sore',.10]];

const $=s=>document.querySelector(s);
const fmt=(n,d=1)=>(+n).toFixed(d).replace('.',',');
const rp=n=>'Rp '+Math.round(n).toLocaleString('id-ID');
let user=JSON.parse(localStorage.getItem('porsiku')||'null'),tab='Indikator harian',MENU=[];
if(user&&!user.lain)user.lain=[];

$('#acts').innerHTML=AKT.map((a,i)=>`<label><input type="radio" name="af" value="${a[0]}" ${i==1?'checked':''}><span><em>${a[0].toFixed(1)}</em><b>${a[1]}</b>${a[2]}</span></label>`).join('');
$('#alergi').innerHTML=ALERGI.concat('Lainnya').map(x=>`<label><input type="checkbox" name="alergi" value="${x.toLowerCase()}"><span>${x}</span></label>`).join('');
$('#alergi').onchange=()=>{const on=$('#alergi input[value=lainnya]').checked;$('#alergiLain').hidden=!on;if(!on)$('#alergiLain').value=''};
const FOTOS=Object.values(FOTO_MENU).map(f=>`<img src="${f}" alt="" loading="lazy">`);
const strip=FOTOS.concat(FOTOS,FOTOS,FOTOS).join('');
$('#m1').innerHTML=strip;$('#m2').innerHTML=strip;

function show(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$('#'+id).classList.add('active');scrollTo(0,0);$('#navBtn').textContent=user?'Dashboard':'Mulai'}
function startFlow(){if(user){render();show('dashboard')}else show('onboarding')}
$('#form').onsubmit=e=>{
  e.preventDefault();const f=new FormData(e.target);
  const lain=(f.get('alergiLain')||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  user={nama:f.get('nama'),jk:f.get('jk'),usia:+f.get('usia'),bb:+f.get('bb'),tb:+f.get('tb'),af:+f.get('af'),
    alergi:f.getAll('alergi').filter(a=>a!=='lainnya'),lain};
  localStorage.setItem('porsiku',JSON.stringify(user));render();show('dashboard');kirim({tipe:'pengguna',...ringkas()});
};

// ===== Perhitungan =====
function hitung(x){
  const imt=x.bb/Math.pow(x.tb/100,2);
  // Cut-off IMT dewasa menurut Kemenkes RI
  const kat=imt<17?'Sangat kurus':imt<18.5?'Kurus':imt<=25?'Normal':imt<=27?'Gemuk':'Obesitas';
  const bmr=x.jk==='L'?66+13.7*x.bb+5*x.tb-6.8*x.usia:655+9.6*x.bb+1.8*x.tb-4.7*x.usia; // Harris-Benedict
  const tee=bmr*x.af;
  return{imt,kat,bmr,tee,p:tee*PERSEN.p/100/4,l:tee*PERSEN.l/100/9,kh:tee*PERSEN.kh/100/4};
}
const makro=e=>[e,e*PERSEN.p/100/4,e*PERSEN.l/100/9,e*PERSEN.kh/100/4];

function render(){
  const h=hitung(user),akt=AKT.find(a=>a[0]===user.af);
  $('#halo').textContent=`Halo, ${user.nama}`;
  $('#ringkas').textContent=`${user.jk==='L'?'Laki-laki':'Perempuan'} · ${user.usia} th · ${user.bb} kg · ${user.tb} cm · ${akt[1]}`;
  $('#stats').innerHTML=`
   <div class="stat big"><span>Kebutuhan energi per hari</span><b>${Math.round(h.tee)} kkal</b><p class="small">BMR ${Math.round(h.bmr)} kkal × faktor aktivitas ${fmt(user.af)}</p></div>
   <div class="stat accent"><span>IMT</span><b>${fmt(h.imt)}</b><span>${h.kat}${user.usia<18?' · anak/remaja memakai IMT/U (Z-score)':''}</span></div>
   <div class="stat"><span>BMR Harris-Benedict</span><b>${Math.round(h.bmr)}</b><span>kkal/hari</span></div>
   <div class="stat"><span>Protein (${PERSEN.p}%)</span><b>${Math.round(h.p)} g</b></div>
   <div class="stat"><span>Lemak (${PERSEN.l}%)</span><b>${Math.round(h.l)} g</b></div>
   <div class="stat"><span>Karbohidrat (${PERSEN.kh}%)</span><b>${Math.round(h.kh)} g</b></div>`;
  renderTabel(h);renderProtein();renderResep(h);
}

function renderTabel(h=hitung(user)){
  $('#tabs').innerHTML=Object.keys(TABEL).map(k=>`<button class="${k===tab?'on':''}" onclick="tab='${k}';renderTabel()">${k}</button>`).join('');
  const t=TABEL[tab],af=fmt(user.af);
  const col=tab==='Anak & dewasa'?(user.usia<18?0:2)+(user.jk==='L'?1:2):-1;
  const on=(r,i)=>i===col||(tab==='Indikator harian'&&r[0]===af)||(tab==='Kategori IMT'&&r[0]===h.kat);
  $('#tabel').innerHTML='<tr>'+t.head.map((x,i)=>`<th class="${i===col?'hi':''}">${x}</th>`).join('')+'</tr>'+
   t.rows.map(r=>`<tr>${r.map((c,i)=>`<td class="${on(r,i)?'hi':''}">${c}</td>`).join('')}</tr>`).join('');
  $('#catatan').textContent=t.note;
}

// ===== Alergi: protein hewani yang aman =====
function renderProtein(){
  const box=$('#proteinBox'),ada=user.alergi.length||user.lain.length;
  box.hidden=!ada;if(!ada)return;
  const cards=PROTEIN.map(g=>{
    const bad=(g.tag&&user.alergi.includes(g.tag))||user.lain.some(t=>g.kw.some(k=>k.includes(t)||t.includes(k)));
    const susuNote=g.tag==='susu'&&bad?' Bahan susu di menu otomatis diganti air putih.':'';
    return `<div class="pg ${bad?'no':'ok'}"><b>${g.nama}</b><span class="tagx">${bad?'Hindari':'Aman dimakan'}</span><p class="small muted">${g.contoh}.${susuNote}</p></div>`}).join('');
  box.innerHTML=`<h3><i class="leaf"></i>Pilihan protein hewani untukmu</h3><p class="muted small">Berdasarkan alergi yang kamu isi. Menu di bawah sudah disaring sesuai ini.</p><div class="pgrid">${cards}</div>`;
}

// ===== Pemilihan menu & porsi =====
function lainCocok(r){return user.lain.some(t=>r.nama.toLowerCase().includes(t)||r.bahan.some(b=>b[0].toLowerCase().includes(t)))}
// susu diganti air putih bila alergi susu; total gizi dihitung ulang dari bahan
function siapkan(r){
  const gs=user.alergi.includes('susu');
  const bahan=r.bahan.map(b=>gs&&/^susu/i.test(b[0])?['Air putih (pengganti '+b[0].toLowerCase()+')',b[1],b[2],0,0,0,0]:b);
  return{...r,bahan,tot:[3,4,5,6].map(i=>bahan.reduce((s,b)=>s+b[i],0)),diganti:gs&&bahan.some((b,i)=>b!==r.bahan[i])};
}
function pilih(jenis,slots,h){
  const ok=RESEP.filter(r=>r.jenis===jenis).map(siapkan).filter(r=>
    !r.alergen.some(a=>user.alergi.includes(a)&&!(a==='susu'&&r.diganti))&&!lainCocok(r));
  const share=slots.reduce((s,x)=>s+x[1],0)/slots.length;
  const lk=['Kurus','Sangat kurus'].includes(h.kat),gm=['Gemuk','Obesitas'].includes(h.kat);
  return ok.map(r=>{
    let s=-Math.abs(Math.log(h.tee*share/r.tot[0]));
    const lp=r.tot[2]*9/r.tot[0];
    if(lk)s+=r.tot[0]/2000;
    if(gm)s-=lp;
    return[s,r];
  }).sort((a,b)=>b[0]-a[0]).slice(0,slots.length).map(x=>x[1]);
}

function kartu(r,slot,share,h,i){
  // porsi dikalikan agar energi persis sama dengan kebutuhan waktu makan tsb
  const target=h.tee*share,m=target/r.tot[0];
  const t=r.tot.map(v=>v*m),need=makro(target);
  const harga=Math.round(HARGA_MENU[r.id]*m/500)*500;
  MENU.push({slot,nama:r.nama,kkal:Math.round(target),harga});
  const rows=r.bahan.map(b=>`<tr><td>${b[0]}</td><td>${b[1]||'-'}</td><td>${fmt(b[2]*m)}</td><td>${fmt(b[3]*m)}</td><td>${fmt(b[4]*m)}</td><td>${fmt(b[5]*m)}</td><td>${fmt(b[6]*m)}</td></tr>`).join('');
  const foto=FOTO_MENU[r.id]?`<img src="${FOTO_MENU[r.id]}" alt="${r.nama}" loading="lazy">`:`<div class="ph"><span>${r.nama.charAt(0)}</span></div>`;
  return `<article class="recipe">${foto}
   <div class="rbody"><span class="slot">${slot}</span><h4>${r.nama}</h4>
   <p class="price">${rp(harga)}</p>
   <span class="badge">porsi ×${fmt(m,2)}</span><span class="badge">${Math.round(t[0])} kkal</span><span class="badge">P ${fmt(t[1])} g</span><span class="badge">L ${fmt(t[2])} g</span><span class="badge">KH ${fmt(t[3])} g</span>
   ${r.diganti?'<p class="small note">Bahan susu diganti air putih karena alergi susu.</p>':''}
   <details><summary>Lihat bahan & perhitungan gizi</summary><div class="table-wrap"><table>
   <tr><th>Bahan</th><th>URT ×1</th><th>Berat (g)</th><th>Energi</th><th>Prot</th><th>Lemak</th><th>KH</th></tr>${rows}
   <tr><th colspan="3">Total nilai gizi</th>${t.map(v=>`<th>${fmt(v)}</th>`).join('')}</tr>
   <tr><td colspan="3">Kebutuhan ${slot.toLowerCase()}</td>${need.map(v=>`<td>${fmt(v)}</td>`).join('')}</tr>
   <tr class="tkg"><td colspan="3">TKG (%)</td>${t.map((v,j)=>`<td>${Math.round(v/need[j]*100)}</td>`).join('')}</tr>
   </table></div><p class="small muted">URT menunjukkan ukuran porsi dasar; berat dan gizi sudah dikalikan ×${fmt(m,2)}.</p></details></div></article>`;
}

function renderResep(h){
  MENU=[];
  const U=pilih('utama',SLOT_U,h),S=pilih('selingan',SLOT_S,h);
  const html=U.map((r,i)=>kartu(r,SLOT_U[i][0],SLOT_U[i][1],h,i)).join('')+S.map((r,i)=>kartu(r,SLOT_S[i][0],SLOT_S[i][1],h,i+3)).join('');
  const total=MENU.reduce((s,x)=>s+x.harga,0);
  $('#resepInfo').textContent=`Porsi tiap menu sudah disesuaikan agar pas dengan kebutuhan ${Math.round(h.tee)} kkal kamu${MENU.length?`. Perkiraan total sehari ${rp(total)}`:''}. TKG = tingkat kecukupan gizi terhadap kebutuhan waktu makan itu.`;
  $('#resep').innerHTML=html||'<p class="muted">Belum ada menu yang aman dari alergimu.</p>';
}
if(user)render();

// ===== Simpan ke Google Sheets =====
function ringkas(){
  const h=hitung(user),a=AKT.find(x=>x[0]===user.af);
  return{nama:user.nama,jk:user.jk==='L'?'Laki-laki':'Perempuan',usia:user.usia,bb:user.bb,tb:user.tb,
    aktivitas:`${fmt(user.af)} – ${a[1]}`,alergi:user.alergi.concat(user.lain).join(', ')||'-',
    imt:+h.imt.toFixed(1),kategori:h.kat,bmr:Math.round(h.bmr),tee:Math.round(h.tee)};
}
function kirim(data){
  if(!CONFIG.SHEET_URL)return;
  fetch(CONFIG.SHEET_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify({token:CONFIG.TOKEN,...data})}).catch(()=>{});
}

// ===== Konsultasi: pilih menu, bayar QRIS, unggah bukti, kirim ke WhatsApp =====
function openKonsul(){
  if(!user){alert('Isi datamu dulu ya, supaya tim Porsiku punya gambaran kondisimu.');show('onboarding');return}
  $('#harga').textContent=CONFIG.HARGA?'Nominal: '+rp(CONFIG.HARGA):'';
  $('#menuPilih').innerHTML=MENU.length?MENU.map((m,i)=>`<label class="consent"><input type="checkbox" value="${i}"><span><b>${m.slot}:</b> ${m.nama} (${m.kkal} kkal)</span></label>`).join(''):'<p class="small muted">Belum ada menu yang ditampilkan.</p>';
  $('#modal').hidden=false;
}
function closeKonsul(){$('#modal').hidden=true}
$('#bukti').onchange=e=>{
  const f=e.target.files[0],p=$('#prev');
  $('#waBtn').disabled=!f;
  if(f){p.src=URL.createObjectURL(f);p.hidden=false}else p.hidden=true;
};
$('#modal').onclick=e=>{if(e.target.id==='modal')closeKonsul()};
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeKonsul()});

// kecilkan foto bukti bayar supaya ringan dikirim (hasil: base64 JPEG tanpa awalan)
function kompres(file){return new Promise((ok,gagal)=>{
  const img=new Image();
  img.onload=()=>{const k=Math.min(1,1000/Math.max(img.width,img.height)),c=document.createElement('canvas');
    c.width=img.width*k;c.height=img.height*k;c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    ok(c.toDataURL('image/jpeg',.72).split(',')[1])};
  img.onerror=gagal;img.src=URL.createObjectURL(file);
})}

async function kirimWA(){
  const btn=$('#waBtn'),file=$('#bukti').files[0];
  if(!file)return;
  btn.disabled=true;btn.textContent='Mengirim...';
  const w=window.open('','_blank'); // dibuka dulu agar tidak diblokir browser
  let bukti='';try{bukti=await kompres(file)}catch(e){}
  const r=ringkas(),k=$('#keluhan').value.trim()||'-',kode='PSK-'+Date.now().toString(36).toUpperCase().slice(-6);
  const dipilih=[...document.querySelectorAll('#menuPilih input:checked')].map(c=>MENU[+c.value]);
  const menuTxt=dipilih.length?dipilih.map(m=>`- ${m.slot}: ${m.nama} (${m.kkal} kkal, ${rp(m.harga)})`).join('\n'):'-';
  const pesan=`Halo tim Porsiku,
Saya ingin konsultasi. Kode konsultasi: ${kode}

Nama: ${r.nama}
Jenis kelamin: ${r.jk}
Usia: ${r.usia} tahun
BB / TB: ${r.bb} kg / ${r.tb} cm
IMT: ${r.imt} (${r.kategori})
Kebutuhan energi: ${r.tee} kkal/hari (BMR ${r.bmr} kkal, faktor ${r.aktivitas})
Alergi: ${r.alergi}

Menu yang ingin dibahas:
${menuTxt}

Keluhan/pertanyaan: ${k}

Saya sudah membayar via QRIS dan bukti bayar sudah saya unggah di website (kode ${kode}).`;
  kirim({tipe:'konsultasi',kode,...r,menu:dipilih.map(m=>`${m.slot}: ${m.nama}`).join(' | ')||'-',keluhan:k,bukti});
  const url=`https://wa.me/${CONFIG.WA}?text=${encodeURIComponent(pesan)}`;
  if(w)w.location=url;else location.href=url;
  btn.textContent='Kirim ke WhatsApp tim Porsiku';closeKonsul();
}
