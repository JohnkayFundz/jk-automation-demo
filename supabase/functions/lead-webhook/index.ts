import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

interface LeadRecord { id:string; full_name:string; email:string; phone?:string|null; service_requested:string; budget_range?:string|null }
interface WebhookPayload { type:"INSERT"; table:string; schema:string; record:LeadRecord; old_record:null }

const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const escapeHtml=(v:string|null|undefined)=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");

Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST") return new Response(JSON.stringify({error:"Method not allowed"}),{status:405,headers:{...corsHeaders,"Content-Type":"application/json"}});
 try{
  const payload=(await req.json()) as WebhookPayload; const lead=payload.record;
  if(!lead?.id||!lead.full_name||!lead.email||!lead.service_requested) return new Response(JSON.stringify({error:"Invalid lead payload"}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});
  const supabase=createClient(Deno.env.get("SUPABASE_URL")!,Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const scheduledFor=new Date(Date.now()+48*60*60*1000);
  const {error:queueError}=await supabase.schema("sandbox").from("followup_queue").insert({lead_id:lead.id,scheduled_for:scheduledFor.toISOString(),status:"pending",followup_type:"48hr_checkin"});
  if(queueError) return new Response(JSON.stringify({success:false,error:queueError.message}),{status:500,headers:{...corsHeaders,"Content-Type":"application/json"}});
  let emailSent=false; const resendApiKey=Deno.env.get("RESEND_API_KEY");
  if(resendApiKey){
   const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${resendApiKey}`,"Idempotency-Key":`lead-auto-reply-${lead.id}`},body:JSON.stringify({
    from:"JohnKay Automation <onboarding@resend.dev>",to:[lead.email],subject:`We received your request regarding ${lead.service_requested}`,
    html:`<div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:560px;margin:0 auto;padding:24px"><h2 style="color:#0066ff">Hi ${escapeHtml(lead.full_name)},</h2><p>Thank you for reaching out about <strong>${escapeHtml(lead.service_requested)}</strong>.</p><p>We've received your enquiry for the <strong>${escapeHtml(lead.budget_range)}</strong> package and will review the details shortly.</p><p>We'll be in touch soon with the next steps.</p><p>Best regards,<br><strong>JohnKay Systems</strong></p></div>`
   })});
   if(response.ok){emailSent=true;const {error}=await supabase.schema("sandbox").from("inbound_leads").update({auto_reply_sent:true}).eq("id",lead.id);if(error) console.error("[Lead Update Error]",error)}
   else console.error("[Resend API Error]",await response.text());
  } else console.warn("[Resend Warning] RESEND_API_KEY secret is not configured.");
  return new Response(JSON.stringify({success:true,emailSent,lead_id:lead.id}),{status:200,headers:{...corsHeaders,"Content-Type":"application/json"}});
 }catch(error){return new Response(JSON.stringify({success:false,error:error instanceof Error?error.message:"Unknown error"}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}})}
});