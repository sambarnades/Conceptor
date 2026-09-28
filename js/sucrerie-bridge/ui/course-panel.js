/** Le même dépôt que pour une activité, ouvert depuis la livraison du parcours. */
import { SUCRERIE_BRIDGE } from '../config.js';
import { loadTranslations, t } from '../i18n/index.js';
import { runSucrerieFlow } from './deposit-flow.js';
import { setupModalAccessibility } from '../../core/utils.js';

export async function openCourseDeposit({ blob, title, courseText, onExit }) {
    if (!SUCRERIE_BRIDGE.enabled) return;
    const translations=await loadTranslations();
    const overlay=document.createElement('div');overlay.className='preview-modal-overlay sucrerie-bridge-course';
    const modal=document.createElement('div');modal.className='preview-modal';
    modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','sucrerie-course-title');
    const header=document.createElement('div');header.className='preview-modal__header';
    const label=document.createElement('h2');label.id='sucrerie-course-title';label.className='preview-modal__title';label.textContent=title;
    const close=document.createElement('button');close.type='button';close.className='preview-modal__close';
    close.setAttribute('aria-label',t('sucrerie_bridge_course_close',translations));close.textContent='×';
    const content=document.createElement('div');content.className='preview-modal__content';
    header.append(label,close);modal.append(header,content);overlay.append(modal);
    let closed=false,cleanup=()=>{};
    const previousOverflow=document.body.style.overflow;
    const notification={ id:crypto.randomUUID(),type:'mbz',isCourse:true,title,blob,courseText };
    function finish() {
        if(closed)return;closed=true;observer.disconnect();cleanup();overlay.remove();document.body.style.overflow=previousOverflow;onExit?.();
    }
    const observer=new MutationObserver(async()=>{
        const pack=await loadTranslations();if(!closed){
            modal._sucrerieBridgeFlow?.refreshTranslations(pack);
            close.setAttribute('aria-label',t('sucrerie_bridge_course_close',pack));
        }
    });
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
    runSucrerieFlow({modal,notification,translations,onExit:finish});
    close.addEventListener('click',()=>{modal._sucrerieBridgeFlow?.exit();finish();});
    overlay.addEventListener('click',event=>{if(event.target===overlay)close.click();});
    document.body.append(overlay);document.body.style.overflow='hidden';
    cleanup=setupModalAccessibility(modal,{focusSelector:'input[type="email"]',onClose:()=>{
        if(!document.querySelector('[data-sucrerie-bridge-confirm]'))close.click();
    }});
}
