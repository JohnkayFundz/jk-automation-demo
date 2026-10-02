import React,{useState} from 'react';
interface LeadFormData{full_name:string;email:string;phone:string;service_requested:string;budget_range:string}
interface LeadIntakeWidgetProps{supabaseUrl:string;supabaseAnonKey:string;onSuccess?:()=>void}
export const LeadIntakeWidget:React.FC<LeadIntakeWidgetProps>=({supabaseUrl,supabaseAnonKey,onSuccess})=>{
 const [formData,setFormData]=useState<LeadFormData>({full_name:'',email:'',phone:'',service_requested:'Growth Automation Engine',budget_range:'₦100,000 - ₦150,000'});
 const [status,setStatus]=useState<'idle'|'submitting'|'success'|'error'>('idle'); const [errorMessage,setErrorMessage]=useState('');
 const handleChange=(e:React.ChangeEvent<HTMLInputElement|HTMLSelectElement>)=>setFormData(p=>({...p,[e.target.name]:e.target.value}));
 const handleSubmit=async(e:React.FormEvent)=>{e.preventDefault();setStatus('submitting');setErrorMessage('');
  if(!formData.full_name.trim()||!formData.email.trim()){setStatus('error');setErrorMessage('Please provide both your name and a valid email address.');return}
  if(!supabaseUrl||!supabaseAnonKey){setStatus('error');setErrorMessage('Demo configuration is missing.');return}
  try{const response=await fetch(supabaseUrl+'/rest/v1/inbound_leads',{method:'POST',headers:{'Content-Type':'application/json',apikey:supabaseAnonKey,Authorization:'Bearer '+supabaseAnonKey,'Accept-Profile':'sandbox','Content-Profile':'sandbox',Prefer:'return=minimal'},body:JSON.stringify(formData)});
   if(!response.ok){const errorData=await response.json().catch(()=>({}));throw new Error(errorData.message||'Submission failed. Please check your details.')}
   setStatus('success');setFormData({full_name:'',email:'',phone:'',service_requested:'Growth Automation Engine',budget_range:'₦100,000 - ₦150,000'});onSuccess?.();
  }catch(err){setStatus('error');setErrorMessage(err instanceof Error?err.message:'An unexpected network error occurred.')}
 };
 return <div className="card"><div className="card-head"><h2>Request a System Quote</h2><p>Automate lead intake, instant replies, owner notifications, and follow-ups.</p></div>
 {status==='success'?<div className="success">✅ Thank you! Your request has been received. We’ll be in touch shortly.</div>:<form onSubmit={handleSubmit}>
 <label>Full Name *<input name="full_name" required value={formData.full_name} onChange={handleChange} placeholder="e.g. Amaka Obi"/></label>
 <label>Email Address *<input type="email" name="email" required value={formData.email} onChange={handleChange} placeholder="amaka@example.com"/></label>
 <label>Phone Number<input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+2348012345678"/></label>
 <label>Service Package<select name="service_requested" value={formData.service_requested} onChange={handleChange}><option value="Starter Lead Automation">Starter Lead Automation (₦50k–₦75k)</option><option value="Growth Automation Engine">Growth Automation Engine (₦100k–₦150k)</option><option value="Mobile Conversion Upgrade">Mobile Conversion Upgrade (₦150k–₦200k)</option></select></label>
 <label>Target Budget<select name="budget_range" value={formData.budget_range} onChange={handleChange}><option>₦50,000 - ₦75,000</option><option>₦100,000 - ₦150,000</option><option>₦150,000 - ₦200,000</option></select></label>
 {status==='error'&&<div className="error">⚠ {errorMessage}</div>}<button disabled={status==='submitting'}>{status==='submitting'?'Submitting...':'Submit Request'}</button></form>}</div>};
