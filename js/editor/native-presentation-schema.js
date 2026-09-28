/** Formulaires natifs de présentation et de livre : semantics locales H5P.
 * Les paramètres restent natifs : aucun reclassement de la géométrie ou des sous-IDs.
 */
import {markdownToHtml} from '../core/utils.js';
import {sanitizeSync} from '../export/sanitizer.js';
import {currentLang, t} from '../core/translation.js';
const cache = new Map();
let schema;
const schemas = new Map();
export const getNativeVideoSchema = () => schemas.get('H5P.InteractiveVideo 1.28');
export const getNativeBookSchema = () => schemas.get('H5P.InteractiveBook 1.15');
export const getNativePresentationSchema = () => schema;
const merge = (base, translated) => {
    if (Array.isArray(base)) return base.map((v,i)=>merge(v,translated?.[i]));
    if (base && typeof base==='object') return Object.fromEntries(Object.entries({...base,...translated}).map(([k,v])=>[k, k in base ? merge(base[k],translated?.[k]) : v]));
    return translated === undefined ? base : translated;
};
export async function prepareNativePresentationSchema(baseURL, rootLibrary = 'H5P.CoursePresentation 1.27') {
    const locale=({jp:'ja',zh:'zh-cn'})[currentLang]||currentLang;
    const key=baseURL+'|'+locale+'|'+rootLibrary;
    if(cache.has(key)){const found=await cache.get(key);schemas.set(rootLibrary,found);if(rootLibrary==='H5P.CoursePresentation 1.27')schema=found;return found;}
    const loaded=new Map();
    const load=async library=>{
        if(!/^H5P\.[A-Za-z0-9]+ \d+\.\d+$/.test(library))return null;
        if(!loaded.has(library))loaded.set(library,(async()=>{
            const folder=baseURL+library.replace(' ','-')+'/';
            const response=await fetch(folder+'semantics.json');if(!response.ok)return null;
            const fields=await response.json();let translated;
            if(locale!=='en'){try{const r=await fetch(folder+'language/'+locale+'.json');if(r.ok)translated=(await r.json()).semantics;}catch{/* Traduction absente : conserver les libellés anglais des semantics. */}}
            return merge(fields,translated);
        })());
        return loaded.get(library);
    };
    const fieldsFor=async(fields,stack)=>{
        const result={};
        for(const f of fields||[]){
            if(f.name==='ct')continue;
            const friendly={slides:t('editor_cp_slide'),elements:t('editor_element'),action:t('editor_ih_block'),globalBackgroundSelector:t('editor_cp_global_bg'),slideBackgroundSelector:t('editor_cp_slide_color')};
            const label=friendly[f.name]||f.label||({x:'X (%)',y:'Y (%)',width:t('editor_hq_width'),height:t('editor_hq_height')})[f.name]||f.name;
            const common={label,required:f.optional!==true && f.default===undefined && !['group','list'].includes(f.type)};
            if(f.default!==undefined)common.default=f.default;
            let field;
            switch(f.type){
                case 'text':field={...common,type:f.tags?'richtext':'text',...(f.tags?{renderType:'html'}:{}),...(f.maxLength?{maxLength:f.maxLength}:{})};break;
                case 'number':field={...common,type:'number',min:f.min,max:f.max,step:f.decimals===0?1:0.01};break;
                case 'boolean':field={...common,type:'checkbox'};break;
                case 'select':field={...common,type:'select',options:[...(f.optional&&f.default===undefined?[{value:'',label:t('editor_livre_numbering_none')}]:[]),...(f.options||[])]};break;
                // H5P.Video autorise l'absence de poster malgré l'absence de optional dans ses semantics.
                case 'image':field={...common,type:'image',required:f.name==='poster'?false:common.required};break;
                case 'file':if(f.name!=='track')continue;field={...common,type:'vtt',required:false,validate:value=>!value||!!value.path||t('editor_media_error_format')};break;
                case 'audio':case 'video':field={...common,type:f.type,nativeSources:true};break;
                case 'group':{
                    const children=await fieldsFor(f.fields,stack);
                    field=f.fields?.length===1 ? {...children[f.fields[0].name],label} : {...common,type:'object',collapsible:true,schema:children};break;
                }
                case 'list':{
                    const child=f.field;
                    const transparent = child.type==='group' && child.fields?.length===1 && child.fields[0].type==='library';
                    const inner=transparent ? (await fieldsFor(child.fields,stack))[child.fields[0].name].schema : await fieldsFor(child.type==='group'?child.fields:[{...child,name:'_value'}],stack);
                    if(transparent && f.name==='chapters')inner.metadata={type:'object',label:t('editor_title'),schema:{title:{type:'text',label:t('editor_ib_chapter_title'),required:true}}};
                    if(child.type!=='group'&&inner._value)inner._value.isArrayValue=true;
                    field={...common,type:'array',nested:true,itemLabel:f.entity||child.label||label,addLabel:f.label||label,itemSchema:inner,minItems:f.min,maxItems:f.max,itemsExpanded:false};break;
                }
                case 'library':{
                    const variants={};const options=f.optional ? [{value:'',label:t('editor_livre_numbering_none')}] : [];
                    for(const lib of f.options||[]){
                        if(stack.includes(lib))continue;
                        const semantics=await load(lib);if(!semantics)continue;
                        variants[lib]=await fieldsFor(semantics,[...stack,lib]);options.push({value:lib,label:lib.replace(/^H5P\./,'')});
                    }
                    field={...common,type:'object',collapsible:true,schema:{
                        library:{type:'select',label:t('editor_ih_block_type'),options},
                        metadata:{type:'object',collapsible:true,label:t('editor_title'),schema:{title:{type:'text',label:t('editor_title')}}},
                        params:{type:'dynamicObject',label:t('editor_ih_content'),selector:'library',resetOnSelectorChange:true,schemas:variants}
                    }};break;
                }
                default:continue; // Champs techniques non pris en charge conservés dans le JSON.
            }
            if(f.name==='adaptivity' && stack.at(-1)==='H5P.InteractiveVideo 1.28')for(const action of ['correct','wrong'])for(const child of Object.values(field.schema[action].schema))child.required=false;
            if(f.name==='duration' && stack.at(-1)==='H5P.InteractiveVideo 1.28')field.validate=value=>!value||Number(value.from)>=0&&Number(value.to)>=Number(value.from);
            if(f.name==='columns' && stack.at(-1)==='H5P.Row 1.3')field.validate=columns=>{
                if(!Array.isArray(columns))return true;const fixed=columns.filter(c=>c.width!==''&&c.width!=null),total=fixed.reduce((n,c)=>n+Number(c.width),0),auto=columns.length-fixed.length;
                return (auto ? total+10*auto<=100 : Math.abs(total-100)<0.001)||t('editor_ib_width_error');
            };
            if(f.name==='overallFeedback' && f.type==='group')field={type:'feedbackRanges',label};
            result[f.name]=field;
        }
        return result;
    };
    const pending=(async()=>{
        const fields=await load(rootLibrary);
        if(!fields)throw Error('CoursePresentation semantics unavailable');
        const all=await fieldsFor(fields,[rootLibrary]);
        if(rootLibrary==='H5P.InteractiveVideo 1.28'){
            const iv=all.interactiveVideo.schema,assets=iv.assets.schema;
            assets.interactions.nested=false;assets.interactions.dynamicTitleField='label';
            assets.interactions.itemSchema.duration.validate=value=>!value||Number(value.from)>=0&&Number(value.to)>=Number(value.from);
            return {sections:[
                {id:'general',label:t('editor_section_general'),icon:'fa-film',fields:{title:{type:'text',label:t('editor_title')},'interactiveVideo.video':iv.video}},
                {id:'interactions',label:t('editor_iv_section_interactions'),icon:'fa-list',countField:'interactiveVideo.assets.interactions',fields:{'interactiveVideo.assets.interactions':assets.interactions}},
                {id:'options',label:t('editor_options'),icon:'fa-cog',fields:{'interactiveVideo.assets.bookmarks':assets.bookmarks,'interactiveVideo.assets.endscreens':assets.endscreens,'interactiveVideo.summary':iv.summary,override:all.override}},
                {id:'labels',label:t('editor_quiz_labels'),icon:'fa-language',fields:{l10n:all.l10n}}
            ]};
        }
        if(rootLibrary==='H5P.InteractiveBook 1.15'){
            all.chapters.nested=false;all.chapters.dynamicTitleField='metadata.title';
            const {chapters,showCoverPage,bookCover,behaviour,...labels}=all;
            return {sections:[
                {id:'general',label:t('editor_section_general'),icon:'fa-book',fields:{title:{type:'text',label:t('editor_title')},showCoverPage,bookCover}},
                {id:'chapters',label:t('editor_ib_section_chapters'),icon:'fa-book-open',countField:'chapters',fields:{chapters}},
                {id:'options',label:t('editor_options'),icon:'fa-cog',fields:{behaviour}},
                {id:'labels',label:t('editor_quiz_labels'),icon:'fa-language',fields:labels}
            ]};
        }
        const pres=all.presentation.schema;
        pres.slides.nested=false;pres.slides.dynamicTitleField='keywords.0.main';
        const options={...pres};delete options.slides;
        const flatten=Object.fromEntries(Object.entries(options).map(([k,v])=>['presentation.'+k,v]));
        return {sections:[
            {id:'slides',label:t('editor_cp_section_slides'),icon:'fa-layer-group',countField:'presentation.slides',fields:{'presentation.slides':pres.slides}},
            {id:'options',label:t('editor_options'),icon:'fa-cog',fields:{title:{type:'text',label:t('editor_title')},...flatten,override:all.override}},
            {id:'labels',label:t('editor_quiz_labels'),icon:'fa-language',fields:{l10n:all.l10n}}
        ]};
    })();
    cache.set(key,pending);const result=await pending;schemas.set(rootLibrary,result);if(rootLibrary==='H5P.CoursePresentation 1.27')schema=result;return result;
}

/** Convertir uniquement les champs HTML retouchés ; laisser les autres feuilles intactes. */
export function serializeNativePresentation(data, original, selectedSchema = schema) {
    const copy=JSON.parse(JSON.stringify(data));
    const convert=(object,previous,fields)=>{
        if(!object||typeof object!=='object')return;
        for(const [name,f] of Object.entries(fields||{})){
            const parts=name.split('.');let parent=object,oldParent=previous;
            for(const part of parts.slice(0,-1)){parent=parent?.[part];oldParent=oldParent?.[part];}
            if(!parent)continue;const key=parts.at(-1),v=parent[key],old=oldParent?.[key];
            if(v==null && !f.required){delete parent[key];continue;}
            if(old===undefined && (v==='' || (f.type==='object' && v?.library==='' && Object.keys(v).length===1))){delete parent[key];continue;}
            if(f.type==='richtext' && typeof v==='string' && v!==old)parent[key]=sanitizeSync(markdownToHtml(v));
            if(f.type==='object')convert(v,old,f.schema);
            if(f.type==='dynamicObject'){
                const selected=parent[f.selector],matched=f.schemas[selected]||Object.entries(f.schemas).find(([k])=>k.split(' ')[0]===String(selected).split(' ')[0])?.[1];
                convert(v,old,matched);
            }
            if(f.type==='array' && Array.isArray(v))v.forEach((item,i)=>{
                if(f.itemSchema._value){const wrap={_value:item};convert(wrap,{_value:old?.[i]},f.itemSchema);v[i]=wrap._value;}
                else convert(item,old?.[i],f.itemSchema);
            });
        }
        if(object.library && object.params && (!object.subContentId || (previous?.library && previous.library!==object.library)))object.subContentId=crypto.randomUUID();
    };
    for(const section of selectedSchema?.sections||[])convert(copy,original,section.fields);
    return copy;
}

export const prepareNativeBookSchema = baseURL => prepareNativePresentationSchema(baseURL, 'H5P.InteractiveBook 1.15');
export const serializeNativeBook = (data, original) => serializeNativePresentation(data, original, getNativeBookSchema());

export const prepareNativeVideoSchema = baseURL => prepareNativePresentationSchema(baseURL, 'H5P.InteractiveVideo 1.28');
export const serializeNativeVideo = (data, original) => serializeNativePresentation(data, original, getNativeVideoSchema());
