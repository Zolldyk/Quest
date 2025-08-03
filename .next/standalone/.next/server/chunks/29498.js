"use strict";exports.id=29498,exports.ids=[29498],exports.modules={29498:(a,b,c)=>{function d(a,b={}){let{qrSize:c=280,showCloseButton:f=!0,closeButtonText:g="\xd7",theme:h="light",container:i=document.body,onCancel:j}=b,k=document.createElement("div");k.style.cssText=`
    position: fixed;
    inset: 0;
    background-color: ${"dark"===h?"rgba(0, 0, 0, 0.8)":"rgba(0, 0, 0, 0.5)"};
    backdrop-filter: blur(10px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 300ms ease-out;
  `,b.overlayStyles&&Object.assign(k.style,b.overlayStyles);let l=document.createElement("div");if(l.style.cssText=`
    background: ${"dark"===h?"#1f1f1f":"#ffffff"};
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    max-width: 90vw;
    max-height: 90vh;
    position: relative;
    animation: scaleIn 300ms ease-out;
  `,b.modalStyles&&Object.assign(l.style,b.modalStyles),f){let a=document.createElement("button");a.textContent=g,a.style.cssText=`
      position: absolute;
      top: 16px;
      right: 16px;
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: ${"dark"===h?"#ffffff":"#000000"};
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      transition: background-color 0.2s;
    `,a.addEventListener("mouseenter",()=>{a.style.backgroundColor="dark"===h?"rgba(255, 255, 255, 0.1)":"rgba(0, 0, 0, 0.1)"}),a.addEventListener("mouseleave",()=>{a.style.backgroundColor="transparent"}),a.addEventListener("click",()=>{t(!0)}),l.appendChild(a)}let m=document.createElement("div");m.style.cssText=`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  `;let n=document.createElement("h3");n.textContent="Scan to Connect",n.style.cssText=`
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: ${"dark"===h?"#ffffff":"#000000"};
    text-align: center;
  `;let o=document.createElement("canvas");o.width=c,o.height=c,o.style.cssText=`
    border: 1px solid ${"dark"===h?"#333333":"#e5e5e5"};
    border-radius: 12px;
  `,e(a,o,c).catch(console.error);let p=document.createElement("button");p.textContent="Copy URI",p.style.cssText=`
    background: ${"dark"===h?"#333333":"#f5f5f5"};
    border: 1px solid ${"dark"===h?"#444444":"#e5e5e5"};
    color: ${"dark"===h?"#ffffff":"#000000"};
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.2s;
  `,p.addEventListener("click",async()=>{try{await navigator.clipboard.writeText(a);let b=p.textContent;p.textContent="Copied!",setTimeout(()=>{p.textContent=b},2e3)}catch(a){console.error("Failed to copy URI:",a)}}),m.appendChild(n),m.appendChild(o),m.appendChild(p),l.appendChild(m),k.appendChild(l);let q=document.createElement("style");q.textContent=`
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    @keyframes scaleIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes scaleOut {
      from { transform: scale(1); opacity: 1; }
      to { transform: scale(0.9); opacity: 0; }
    }
  `,document.head.appendChild(q);let r=a=>{"Escape"===a.key&&t(!0)},s=a=>{a.target===k&&t(!0)};function t(a=!1){document.removeEventListener("keydown",r),k.removeEventListener("click",s),a&&j&&j(),k.style.animation="fadeOut 200ms ease-in",l.style.animation="scaleOut 200ms ease-in";let b=()=>{k.parentNode&&k.parentNode.removeChild(k),q.parentNode&&q.parentNode.removeChild(q)};k.addEventListener("animationend",b,{once:!0}),setTimeout(b,250)}return document.addEventListener("keydown",r),k.addEventListener("click",s),i.appendChild(k),{destroy:()=>t(!1),hide:function(){k.style.display="none"},show:function(){k.style.display="flex"}}}async function e(a,b,d){if(!b.getContext("2d"))return;let{toCanvas:e}=await c.e(24365).then(c.t.bind(c,24365,19));await e(b,a,{width:d,margin:2,color:{dark:"#000000",light:"#ffffff"}})}c.d(b,{createQROverlay:()=>d})}};