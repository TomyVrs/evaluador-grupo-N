export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  const key=process.env.OPENROUTER_API_KEY;
  if(!key){res.statusCode=503;return res.end(JSON.stringify({ok:false,error:'missing key'}));}
  const base={
    model:'openai/gpt-oss-120b:free',
    instructions:'Respondé brevemente.',
    input:[{role:'user',content:'Respondé exactamente OK'}],
    reasoning:{effort:'high'},
    tools:[{type:'function',name:'noop',description:'No usar salvo necesidad',parameters:{type:'object',properties:{},additionalProperties:false},strict:true}],
    tool_choice:'auto',
    text:{format:{type:'json_schema',name:'probe',strict:true,schema:{type:'object',properties:{ok:{type:'string'}},required:['ok'],additionalProperties:false}}},
    max_output_tokens:100,
    provider:{require_parameters:true}
  };
  const variants=[
    ['full',base],
    ['no_provider',(()=>{const x=structuredClone(base);delete x.provider;return x})()],
    ['no_text',(()=>{const x=structuredClone(base);delete x.text;return x})()],
    ['minimal',{model:'openai/gpt-oss-120b:free',input:'Respondé exactamente OK',max_output_tokens:20}]
  ];
  const out=[];
  for(const [name,body] of variants){
    const r=await fetch('https://openrouter.ai/api/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','HTTP-Referer':'https://evaluador-v5-web.vercel.app','X-Title':'Agente Evaluador V5 UCEMA'},body:JSON.stringify(body)});
    let data;try{data=await r.json()}catch{data={raw:await r.text().catch(()=> '')}};
    out.push({name,status:r.status,ok:r.ok,error:data?.error||null,id:data?.id||null,model:data?.model||null});
    if(r.ok)break;
  }
  res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify({results:out}));
}
