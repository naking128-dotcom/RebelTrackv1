'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import DeleteConfirm from '@/components/ui/DeleteConfirm'
import type { Department } from '@/types'

type Gender = 'mens' | 'womens' | 'coed'

interface SportDept {
  id: string
  name: string
  icon: string
  color: string
  photoKey: string
  genders: Gender[]
  subs: Record<Gender, string[]>
}

interface Props { departments: Department[] }

const PHOTOS: Record<string, string[]> = {
  football: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Ole_Miss_vs_Vanderbilt_2014_%2815270649245%29.jpg/1280px-Ole_Miss_vs_Vanderbilt_2014_%2815270649245%29.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Ole_Miss_vs_LSU_2014_%2815083834634%29.jpg/1280px-Ole_Miss_vs_LSU_2014_%2815083834634%29.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Ole_Miss_vs_Alabama_2014_%2815509338622%29.jpg/1280px-Ole_Miss_vs_Alabama_2014_%2815509338622%29.jpg',
  ],
  basketball_m: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Ole_Miss_vs_LSU_Basketball_2012_%286836262283%29.jpg/1280px-Ole_Miss_vs_LSU_Basketball_2012_%286836262283%29.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Ole_Miss_Rebels_vs_Alabama_Crimson_Tide_basketball_2013.jpg/1280px-Ole_Miss_Rebels_vs_Alabama_Crimson_Tide_basketball_2013.jpg',
  ],
  basketball_w: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Ole_Miss_vs_Tennessee_women%27s_basketball_2013.jpg/1280px-Ole_Miss_vs_Tennessee_women%27s_basketball_2013.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Ole_Miss_Rebels_vs_Georgia_Bulldogs_women%27s_basketball_2013.jpg/1280px-Ole_Miss_Rebels_vs_Georgia_Bulldogs_women%27s_basketball_2013.jpg',
  ],
  baseball: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Swayze_Field.jpg/1280px-Swayze_Field.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Ole_Miss_Baseball_vs_Georgia_2012.jpg/1280px-Ole_Miss_Baseball_vs_Georgia_2012.jpg',
  ],
  softball: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Ole_Miss_Softball_stadium.jpg/1280px-Ole_Miss_Softball_stadium.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Ole_Miss_Rebels_softball_2015.jpg/1280px-Ole_Miss_Rebels_softball_2015.jpg',
  ],
  soccer: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Ole_Miss_women%27s_soccer_2015.jpg/1280px-Ole_Miss_women%27s_soccer_2015.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Ole_Miss_vs_Auburn_soccer_2013.jpg/1280px-Ole_Miss_vs_Auburn_soccer_2013.jpg',
  ],
  volleyball: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Ole_Miss_volleyball_2014.jpg/1280px-Ole_Miss_volleyball_2014.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Ole_Miss_Rebels_volleyball.jpg/1280px-Ole_Miss_Rebels_volleyball.jpg',
  ],
  golf_m: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/College_golf_swing.jpg/1280px-College_golf_swing.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/College_golf_tournament.jpg/1280px-College_golf_tournament.jpg',
  ],
  golf_w: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Women_college_golf.jpg/1280px-Women_college_golf.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/SEC_golf_tournament.jpg/1280px-SEC_golf_tournament.jpg',
  ],
  track: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/NCAA_track_relay.jpg/1280px-NCAA_track_relay.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/College_track_sprint.jpg/1280px-College_track_sprint.jpg',
  ],
  rifle: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/NCAA_rifle_competition.jpg/1280px-NCAA_rifle_competition.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/College_rifle_team.jpg/1280px-College_rifle_team.jpg',
  ],
  admin: [
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Vaught-Hemingway_Stadium_field.jpg/1280px-Vaught-Hemingway_Stadium_field.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Ole_Miss_campus.jpg/1280px-Ole_Miss_campus.jpg',
  ],
}

const FALLBACK: Record<string, string> = {
  football:     'linear-gradient(135deg,#CE1126,#7a0b16)',
  basketball_m: 'linear-gradient(135deg,#185FA5,#0a2d52)',
  basketball_w: 'linear-gradient(135deg,#D4537E,#7a1f3d)',
  baseball:     'linear-gradient(135deg,#0C447C,#041e38)',
  softball:     'linear-gradient(135deg,#D85A30,#7a2710)',
  soccer:       'linear-gradient(135deg,#854F0B,#3d2400)',
  volleyball:   'linear-gradient(135deg,#534AB7,#272060)',
  golf_m:       'linear-gradient(135deg,#3B6D11,#183000)',
  golf_w:       'linear-gradient(135deg,#3B6D11,#183000)',
  track:        'linear-gradient(135deg,#1D9E75,#094a34)',
  rifle:        'linear-gradient(135deg,#C8A96E,#5c4020)',
  admin:        'linear-gradient(135deg,#0A1628,#14213D)',
}

const GLABEL: Record<Gender,string> = { mens:"Men's", womens:"Women's", coed:"Co-ed" }
const GDOT:   Record<Gender,string> = { mens:'#185FA5', womens:'#D4537E', coed:'#3B6D11' }
const GPILL:  Record<Gender,{bg:string;color:string}> = {
  mens:  {bg:'#e6f1fb',color:'#0C447C'},
  womens:{bg:'#fbeaf0',color:'#72243E'},
  coed:  {bg:'#eaf3de',color:'#27500A'},
}
const PALETTE=['#CE1126','#185FA5','#3B6D11','#854F0B','#534AB7','#1D9E75','#D85A30','#C8A96E','#888780','#0C447C','#444441','#14213D']

const INIT: SportDept[] = [
  {id:'football',      name:'Football',             icon:'🏈',color:'#CE1126',photoKey:'football',    genders:['mens'],  subs:{mens:['Offense','Defense','Special Teams','Strength & Conditioning','Recruiting','Film & Analytics','Equipment'],womens:[],coed:[]}},
  {id:'bball_m',       name:"Men's Basketball",     icon:'🏀',color:'#185FA5',photoKey:'basketball_m',genders:['mens'],  subs:{mens:['Scouting','Player Development','Video','Recruiting'],womens:[],coed:[]}},
  {id:'bball_w',       name:"Women's Basketball",   icon:'🏀',color:'#D4537E',photoKey:'basketball_w',genders:['womens'],subs:{mens:[],womens:['Scouting','Player Development','Video','Recruiting'],coed:[]}},
  {id:'golf_m',        name:"Men's Golf",            icon:'⛳',color:'#3B6D11',photoKey:'golf_m',      genders:['mens'],  subs:{mens:['Roster','Tournament Logistics'],womens:[],coed:[]}},
  {id:'golf_w',        name:"Women's Golf",          icon:'⛳',color:'#3B6D11',photoKey:'golf_w',      genders:['womens'],subs:{mens:[],womens:['Roster','Tournament Logistics'],coed:[]}},
  {id:'soccer',        name:'Soccer',                icon:'⚽',color:'#854F0B',photoKey:'soccer',      genders:['womens'],subs:{mens:[],womens:['Roster','Recruiting','Analytics'],coed:[]}},
  {id:'track_m',       name:"Men's Track & Field",   icon:'🏃',color:'#1D9E75',photoKey:'track',       genders:['mens'],  subs:{mens:['Sprints','Distance','Field Events','Recruiting'],womens:[],coed:[]}},
  {id:'track_w',       name:"Women's Track & Field", icon:'🏃',color:'#1D9E75',photoKey:'track',       genders:['womens'],subs:{mens:[],womens:['Sprints','Distance','Field Events','Recruiting'],coed:[]}},
  {id:'volleyball',    name:'Volleyball',             icon:'🏐',color:'#534AB7',photoKey:'volleyball',  genders:['womens'],subs:{mens:[],womens:['Roster','Recruiting'],coed:[]}},
  {id:'rifle',         name:'Rifle',                  icon:'🎯',color:'#C8A96E',photoKey:'rifle',       genders:['coed'],  subs:{mens:[],womens:[],coed:['Smallbore','Air Rifle','Recruiting']}},
  {id:'softball',      name:'Softball',               icon:'🥎',color:'#D85A30',photoKey:'softball',    genders:['womens'],subs:{mens:[],womens:['Pitching','Position Players','Equipment','Recruiting'],coed:[]}},
  {id:'baseball',      name:'Baseball',               icon:'⚾',color:'#0C447C',photoKey:'baseball',    genders:['mens'],  subs:{mens:['Pitching','Position Players','Analytics','Equipment','Recruiting'],womens:[],coed:[]}},
  {id:'compliance',    name:'Compliance',             icon:'⚖',color:'#444441',photoKey:'admin',       genders:['coed'],  subs:{mens:[],womens:[],coed:['NCAA Compliance','Eligibility','Recruiting Rules']}},
  {id:'business',      name:'Business Office',        icon:'💼',color:'#14213D',photoKey:'admin',       genders:['coed'],  subs:{mens:[],womens:[],coed:['Purchasing','Payroll','Accounts Payable','Budget & Finance']}},
  {id:'it',            name:'Information Technology', icon:'💻',color:'#888780',photoKey:'admin',       genders:['coed'],  subs:{mens:[],womens:[],coed:['Infrastructure','AV Support','Cybersecurity','Help Desk']}},
  {id:'marketing',     name:'Marketing',              icon:'📢',color:'#854F0B',photoKey:'admin',       genders:['coed'],  subs:{mens:[],womens:[],coed:['Digital Marketing','Promotions','Sponsorships','Ticket Sales']}},
  {id:'media',         name:'Media Relations',        icon:'📰',color:'#534AB7',photoKey:'admin',       genders:['coed'],  subs:{mens:[],womens:[],coed:['Communications','Photography','Statistics']}},
  {id:'productions',   name:'Productions',            icon:'🎬',color:'#1D9E75',photoKey:'admin',       genders:['coed'],  subs:{mens:[],womens:[],coed:['Video Production','Broadcast','Scoreboard Ops','Live Streaming']}},
  {id:'facilities',    name:'Facilities',             icon:'🏟',color:'#3B6D11',photoKey:'admin',       genders:['coed'],  subs:{mens:[],womens:[],coed:['Field Operations','Maintenance','Event Setup','Grounds']}},
  {id:'administrative',name:'Administrative',         icon:'📋',color:'#CE1126',photoKey:'admin',       genders:['coed'],  subs:{mens:[],womens:[],coed:['Executive Office','Human Resources','Event Management']}},
]

export default function DepartmentsClient({ departments: _ }: Props) {
  const [depts,        setDepts]        = useState<SportDept[]>(INIT)
  const [activeId,     setActiveId]     = useState('football')
  const [photoIdx,     setPhotoIdx]     = useState(0)
  const [search,       setSearch]       = useState('')
  const [deleteCtx,    setDeleteCtx]    = useState<null|{type:'dept'|'sub';deptId:string;gender?:Gender;subIdx?:number;label:string}>(null)
  const [subModal,     setSubModal]     = useState<null|{deptId:string;gender:Gender;editIdx?:number;editName?:string}>(null)
  const [showAddDept,  setShowAddDept]  = useState(false)
  const [newDept,      setNewDept]      = useState({name:'',icon:'',hasMens:true,hasWomens:false,isCoed:false,color:'#CE1126'})

  const heroRef  = useRef<HTMLDivElement>(null)
  const imgRef   = useRef<HTMLImageElement>(null)
  const timerRef = useRef<NodeJS.Timeout|null>(null)

  const active = depts.find(d=>d.id===activeId)!
  const photos = (active ? PHOTOS[active.photoKey] : []) || []

  const loadPhoto = useCallback((idx:number) => {
    if(!imgRef.current||!heroRef.current) return
    if(!photos.length){heroRef.current.style.background=FALLBACK[active?.photoKey]||FALLBACK.admin;return}
    imgRef.current.src = photos[idx%photos.length]
    imgRef.current.style.opacity='0'
    imgRef.current.onload  = ()=>{ if(imgRef.current) imgRef.current.style.opacity='1' }
    imgRef.current.onerror = ()=>{ if(heroRef.current) heroRef.current.style.background=FALLBACK[active?.photoKey]||FALLBACK.admin }
  },[photos,active])

  useEffect(()=>{
    setPhotoIdx(0); loadPhoto(0)
    timerRef.current && clearInterval(timerRef.current)
    timerRef.current=setInterval(()=>setPhotoIdx(p=>{ const n=(p+1)%Math.max(photos.length,1); loadPhoto(n); return n }),5000)
    return ()=>{ timerRef.current && clearInterval(timerRef.current) }
  },[activeId])

  function switchTab(id:string){ setActiveId(id); setSearch('') }

  async function execDelete(){
    if(!deleteCtx) return
    if(deleteCtx.type==='dept'){
      await fetch('/api/departments',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:deleteCtx.deptId})})
      const rem = depts.filter(d=>d.id!==deleteCtx.deptId)
      setDepts(rem)
      if(rem.length) setActiveId(rem[0].id)
      toast.success('Department deleted')
    } else {
      setDepts(prev=>prev.map(d=>{
        if(d.id!==deleteCtx.deptId) return d
        const s={...d.subs}; s[deleteCtx.gender!]=s[deleteCtx.gender!].filter((_:string,i:number)=>i!==deleteCtx.subIdx)
        return {...d,subs:s}
      }))
      toast.success('Sub-department deleted')
    }
  }

  function saveSub(name:string, gender:Gender){
    if(!name.trim()){toast.error('Name required');return}
    setDepts(prev=>prev.map(d=>{
      if(d.id!==subModal!.deptId) return d
      const s={...d.subs}; if(!s[gender]) s[gender]=[]
      if(subModal!.editIdx!==undefined) s[gender][subModal!.editIdx]=name
      else s[gender]=[...s[gender],name]
      const g=d.genders.includes(gender)?d.genders:[...d.genders,gender] as Gender[]
      return {...d,subs:s,genders:g}
    }))
    setSubModal(null)
    toast.success(subModal!.editIdx!==undefined?'Updated':`"${name}" added`)
  }

  function addDept(){
    if(!newDept.name.trim()){toast.error('Name required');return}
    const g:Gender[]=[...(newDept.hasMens?['mens' as Gender]:[]),...(newDept.hasWomens?['womens' as Gender]:[]),...((newDept.isCoed||(!newDept.hasMens&&!newDept.hasWomens))?['coed' as Gender]:[])]
    const nd:SportDept={id:'c_'+Date.now(),name:newDept.name.trim(),icon:newDept.icon||'📁',color:newDept.color,photoKey:'admin',genders:g,subs:{mens:[],womens:[],coed:[]}}
    setDepts(p=>[...p,nd]); setActiveId(nd.id); setShowAddDept(false)
    setNewDept({name:'',icon:'',hasMens:true,hasWomens:false,isCoed:false,color:'#CE1126'})
    toast.success(`"${nd.name}" added`)
  }

  if(!active) return null

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Hero */}
      <div ref={heroRef} className="relative flex-shrink-0" style={{height:200,background:FALLBACK[active.photoKey]||FALLBACK.admin}}>
        <img ref={imgRef} alt="" className="absolute inset-0 w-full h-full object-cover" style={{transition:'opacity .6s'}} />
        <div className="absolute inset-0" style={{background:'linear-gradient(to bottom,rgba(10,22,40,.28) 0%,rgba(10,22,40,.8) 100%)'}} />
        <div className="absolute inset-0 flex flex-col justify-end px-5 pb-4">
          <div className="text-xl font-bold text-white" style={{textShadow:'0 1px 6px rgba(0,0,0,.6)'}}>
            {active.icon} {active.name}
          </div>
          <div className="text-xs text-white/65 mt-1">Ole Miss Rebels</div>
          {photos.length>1 && (
            <div className="flex gap-1.5 mt-2">
              {photos.map((_,i)=>(
                <button key={i} onClick={()=>{setPhotoIdx(i);loadPhoto(i)}}
                  className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{background:i===photoIdx?'#fff':'rgba(255,255,255,.35)'}} />
              ))}
            </div>
          )}
        </div>
        {photos.length>1 && (
          <div className="absolute top-3 right-4 flex gap-2">
            {['←','→'].map((arrow,di)=>(
              <button key={arrow} className="btn btn-sm text-white"
                style={{background:'rgba(255,255,255,.15)',borderColor:'rgba(255,255,255,.25)'}}
                onClick={()=>{const n=(photoIdx+(di?1:-1)+photos.length)%photos.length;setPhotoIdx(n);loadPhoto(n)}}>
                {arrow}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto flex-shrink-0 scrollbar-none" style={{background:'#0A1628'}}>
        {depts.map(d=>(
          <button key={d.id} onClick={()=>switchTab(d.id)}
            className="px-3 py-2.5 text-xs font-medium whitespace-nowrap flex items-center gap-1.5 flex-shrink-0 border-b-2 transition-colors"
            style={{color:activeId===d.id?'#fff':'rgba(255,255,255,.48)',borderColor:activeId===d.id?'#CE1126':'transparent'}}>
            <span style={{fontSize:12}}>{d.icon}</span>{d.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <input className="form-input !py-1.5 flex-1 min-w-32 max-w-xs text-xs" placeholder="Search sub-departments..." value={search} onChange={e=>setSearch(e.target.value)} />
          <div className="flex gap-2 ml-auto">
            <button className="btn btn-sm" style={{color:'#dc2626',borderColor:'rgba(220,38,38,.3)'}}
              onClick={()=>setDeleteCtx({type:'dept',deptId:active.id,label:`"${active.name}"`})}>
              Delete dept
            </button>
            <button className="btn btn-sm btn-primary" onClick={()=>setShowAddDept(true)}>+ Add Department</button>
          </div>
        </div>

        {active.genders.map(gender=>{
          const pill=GPILL[gender]
          const subs=(active.subs[gender]||[]).filter(s=>!search||s.toLowerCase().includes(search.toLowerCase()))
          return (
            <div key={gender} className="panel mb-4">
              <div className="panel-header justify-between" style={{background:'var(--color-background-secondary)'}}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{background:pill.bg,color:pill.color}}>{GLABEL[gender]}</span>
                  <span className="text-xs text-gray-400">{(active.subs[gender]||[]).length} sub-depts</span>
                </div>
                <button className="btn btn-sm text-xs" style={{color:'#CE1126',borderColor:'rgba(206,17,38,.3)'}}
                  onClick={()=>setSubModal({deptId:active.id,gender})}>+ Add</button>
              </div>
              <div className="p-3">
                {subs.length===0 && <div className="py-4 text-xs text-gray-400 text-center italic">{search?'No matches':'No sub-departments yet'}</div>}
                {(active.subs[gender]||[]).map((sub,idx)=>{
                  if(search&&!sub.toLowerCase().includes(search.toLowerCase())) return null
                  return (
                    <div key={idx} className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors group">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{background:GDOT[gender]}} />
                      <span className="text-sm text-gray-800 flex-1">{sub}</span>
                      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="btn btn-sm text-xs" onClick={()=>setSubModal({deptId:active.id,gender,editIdx:idx,editName:sub})}>Edit</button>
                        <button className="btn btn-sm text-xs" style={{color:'#dc2626',borderColor:'rgba(220,38,38,.3)'}}
                          onClick={()=>setDeleteCtx({type:'sub',deptId:active.id,gender,subIdx:idx,label:`"${sub}"`})}>Delete</button>
                      </div>
                    </div>
                  )
                })}
                <button className="flex items-center gap-2 w-full mt-2 px-2 py-2 rounded-lg text-xs font-medium"
                  style={{color:'#CE1126',border:'1px dashed rgba(206,17,38,.3)'}}
                  onClick={()=>setSubModal({deptId:active.id,gender})}>
                  + Add sub-department to {GLABEL[gender]}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {deleteCtx&&<DeleteConfirm
        title={deleteCtx.type==='dept'?'Delete department?':'Delete sub-department?'}
        message={deleteCtx.type==='dept'?`${deleteCtx.label} and all sub-departments will be permanently removed.`:`${deleteCtx.label} will be permanently removed.`}
        onConfirm={execDelete} onClose={()=>setDeleteCtx(null)} />}

      {subModal&&<SubModal deptName={active.name} genders={active.genders} default_={subModal.gender}
        editName={subModal.editName} onClose={()=>setSubModal(null)} onSave={saveSub} />}

      {showAddDept&&<AddModal form={newDept} onChange={setNewDept} onClose={()=>setShowAddDept(false)} onSave={addDept} />}
    </div>
  )
}

function SubModal({deptName,genders,default_,editName,onClose,onSave}:{deptName:string;genders:Gender[];default_:Gender;editName?:string;onClose:()=>void;onSave:(n:string,g:Gender)=>void}){
  const [name,setName]=useState(editName||'')
  const [g,setG]=useState<Gender>(default_)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.42)'}}>
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-medium">{editName?'Edit':'Add'} Sub-Department — {deptName}</h2>
          <button className="btn btn-ghost p-1 text-base" onClick={onClose}>✕</button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="form-label">Name <span className="text-red-500">*</span></label>
            <input className="form-input" value={name} onChange={e=>setName(e.target.value)} autoFocus placeholder="e.g. Recruiting, Analytics..." /></div>
          <div><label className="form-label">Division</label>
            <select className="form-input" value={g} onChange={e=>setG(e.target.value as Gender)}>
              {genders.map(x=><option key={x} value={x}>{GLABEL[x]}</option>)}
              {!genders.includes('coed')&&<option value="coed">Co-ed</option>}
            </select></div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={()=>onSave(name.trim(),g)}>{editName?'Save Changes':'Add Sub-Department'}</button>
        </div>
      </div>
    </div>
  )
}

function AddModal({form,onChange,onClose,onSave}:{form:any;onChange:(v:any)=>void;onClose:()=>void;onSave:()=>void}){
  return(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:'rgba(0,0,0,0.42)'}}>
      <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-medium">Add Sport / Department</h2>
          <button className="btn btn-ghost p-1 text-base" onClick={onClose}>✕</button>
        </div>
        <div className="p-5 space-y-3">
          <div><label className="form-label">Name <span className="text-red-500">*</span></label>
            <input className="form-input" value={form.name} onChange={e=>onChange((p:any)=>({...p,name:e.target.value}))} autoFocus placeholder="e.g. Swimming..." /></div>
          <div><label className="form-label">Icon</label>
            <input className="form-input" style={{width:60}} value={form.icon} onChange={e=>onChange((p:any)=>({...p,icon:e.target.value}))} maxLength={2} placeholder="🏊" /></div>
          <div><label className="form-label">Programs</label>
            <div className="flex gap-4 mt-1">
              {([['hasMens',"Men's"],['hasWomens',"Women's"],['isCoed','Admin/Co-ed']] as const).map(([k,l])=>(
                <label key={k} className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input type="checkbox" className="accent-red-600" checked={form[k]} onChange={e=>onChange((p:any)=>({...p,[k]:e.target.checked}))} />{l}
                </label>
              ))}
            </div></div>
          <div><label className="form-label">Color</label>
            <div className="flex gap-1.5 flex-wrap mt-1">
              {PALETTE.map(c=>(
                <button key={c} onClick={()=>onChange((p:any)=>({...p,color:c}))}
                  className="w-5 h-5 rounded-full transition-all"
                  style={{background:c,outline:form.color===c?`2px solid ${c}`:'none',outlineOffset:2}} />
              ))}
            </div></div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={onSave}>Add Department</button>
        </div>
      </div>
    </div>
  )
}
