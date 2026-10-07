/* MES interface languages.
   The interface source text is Portuguese; this layer translates rendered text (text nodes, placeholders,
   labels, titles) into the visitor's language before it is painted. Default language: English.
   Dictionaries live in /i18n/<code>.json. Strings with {0}, {1} are patterns for dynamic values. */
(function(){
  'use strict';
  var LANGS=[['en','English'],['pt','Português'],['es','Español'],['fr','Français'],['it','Italiano'],['ru','Русский'],['uk','Українська'],['tr','Türkçe']];
  var LOCALES={en:'en-GB',pt:'pt-PT',es:'es-ES',fr:'fr-FR',it:'it-IT',ru:'ru-RU',uk:'uk-UA',tr:'tr-TR'};
  var KEY='mes_lang', SOURCE='pt', DEFAULT='en';
  function stored(){try{return window.localStorage.getItem(KEY)}catch(e){return null}}
  function valid(c){return LANGS.some(function(l){return l[0]===c})}
  var fromUrl=null;try{fromUrl=new URLSearchParams(location.search).get('lang')}catch(e){}
  var lang=valid(fromUrl)?fromUrl:valid(stored())?stored():DEFAULT;
  if(valid(fromUrl)){try{localStorage.setItem(KEY,fromUrl)}catch(e){}}
  var exact=Object.create(null), patterns=[], done=new WeakMap();
  window.MES_LANG=lang; window.MES_LOCALE=LOCALES[lang];
  document.documentElement.lang=lang;

  function esc(s){return s.replace(/[.*+?^$()|[\]\\]/g,'\\$&')}
  function load(dict){
    Object.keys(dict).forEach(function(k){
      var v=dict[k]; if(typeof v!=='string'||!v)return;
      if(/\{\d\}/.test(k)){
        var order=[], src='^'+esc(k).replace(/\\?\{(\d)\\?\}/g,function(_,i){order.push(+i);return '([\\s\\S]+?)'})+'$';
        patterns.push({re:new RegExp(src),order:order,out:v,len:k.length});
      } else exact[k]=v;
    });
    patterns.sort(function(a,b){return b.len-a.len});
  }
  function one(t){
    if(exact[t]!=null)return exact[t];
    for(var i=0;i<patterns.length;i++){var p=patterns[i],m=t.match(p.re);if(m){var vals={};p.order.forEach(function(n,j){var v=m[j+1];vals[n]=exact[v]!=null?exact[v]:v});return p.out.replace(/\{(\d)\}/g,function(_,n){return vals[n]!=null?vals[n]:''})}}
    var num=t.match(/^([\d][\d\/.,:×x+\-]*\s+)(\S[\s\S]*)$/);if(num&&exact[num[2]]!=null)return num[1]+exact[num[2]];
    var tail=t.match(/^(\S[\s\S]*?)(\s*#?\d+|\s+[A-H])$/);if(tail){var b=tail[1].trim(),h=tail[2].indexOf('#')>-1;if(h&&exact[b+' #']!=null)return exact[b+' #']+tail[2].replace(/^\s*#/,'');if(exact[b]!=null)return exact[b]+tail[2]}
    var lab=t.match(/^([^:]{2,40}:)\s+([\s\S]+)$/);if(lab&&exact[lab[1]]!=null)return exact[lab[1]]+' '+(exact[lab[2]]!=null?exact[lab[2]]:lab[2]);
    return null;
  }
  function tr(text){
    if(lang===SOURCE||!text)return text;
    var core=text.trim(); if(!core||!/[A-Za-zÀ-ÿ]/.test(core))return text;
    var lead=text.slice(0,text.indexOf(core.charAt(0))), trail=text.slice(text.lastIndexOf(core.charAt(core.length-1))+1);
    var r=one(core);
    if(r==null&&core.indexOf(' · ')>-1){var parts=core.split(' · '),changed=false;parts=parts.map(function(p){var x=one(p.trim());if(x!=null){changed=true;return x}return p});if(changed)r=parts.join(' · ')}
    if(r==null&&/[:.…]$/.test(core)){var base=core.replace(/\s*[:.…]+$/,''),end=core.slice(base.length),x=one(base);if(x!=null)r=x+end}
    return r==null?text:lead+r+trail;
  }
  window.MES_T=tr;
  var ATTRS=['placeholder','aria-label','title'];
  function translateNode(root){
    if(lang===SOURCE)return;
    if(root.nodeType===3){var o=root.nodeValue;if(done.get(root)===o)return;var n=tr(o);if(n!==o)root.nodeValue=n;done.set(root,root.nodeValue);return}
    if(root.nodeType!==1)return;
    if(root.closest&&root.closest('script,style,svg,[data-no-i18n],textarea'))return;
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,{acceptNode:function(n){if(n.nodeType===1){var tag=n.tagName;return tag==='SCRIPT'||tag==='STYLE'||tag==='svg'||tag==='TEXTAREA'||n.hasAttribute('data-no-i18n')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT}return NodeFilter.FILTER_ACCEPT}});
    var node=root;
    do{
      if(node.nodeType===3){var o2=node.nodeValue;if(done.get(node)!==o2){var n2=tr(o2);if(n2!==o2)node.nodeValue=n2;done.set(node,node.nodeValue)}}
      else ATTRS.forEach(function(a){var v=node.getAttribute(a);if(v&&node.getAttribute('data-i18n-'+a)!==v){var t=tr(v);if(t!==v)node.setAttribute(a,t);node.setAttribute('data-i18n-'+a,t)}});
    }while((node=walker.nextNode()));
  }
  function switcher(){
    var bar=document.querySelector('.top-actions'); if(!bar||bar.querySelector('#lang-switch'))return;
    var wrap=document.createElement('label'); wrap.className='lang-switch'; wrap.setAttribute('data-no-i18n','');
    wrap.innerHTML='<svg class="icon" aria-hidden="true" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20M2 12h20M12 2c3 3 4 6.5 4 10s-1 7-4 10M12 2c-3 3-4 6.5-4 10s1 7 4 10"/></svg><span class="lang-code">'+lang.toUpperCase()+'</span><svg class="icon caret" aria-hidden="true" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg>';
    var sel=document.createElement('select'); sel.id='lang-switch'; sel.setAttribute('aria-label','Language');
    LANGS.forEach(function(l){var o=document.createElement('option');o.value=l[0];o.textContent=l[1];if(l[0]===lang)o.selected=true;sel.appendChild(o)});
    sel.addEventListener('change',function(){try{localStorage.setItem(KEY,sel.value)}catch(e){}var u=new URL(location.href);u.searchParams.delete('lang');location.replace(u.toString())});
    wrap.appendChild(sel); bar.insertBefore(wrap,bar.firstChild.nextSibling);
  }
  function pass(){translateNode(document.body);switcher();if(lang!==SOURCE)document.title=tr(document.title)}
  var observer=new MutationObserver(function(list){
    list.forEach(function(m){
      if(m.type==='characterData')translateNode(m.target);
      else if(m.type==='attributes')translateNode(m.target);
      else m.addedNodes.forEach(translateNode);
    });
    switcher();
  });
  function start(){pass();observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:ATTRS})}
  window.MES_I18N={lang:lang,languages:LANGS,ready:(lang===SOURCE?Promise.resolve():fetch('/i18n/'+lang+'.json?v=1').then(function(r){return r.ok?r.json():{}}).then(load).catch(function(){})).then(start)};
})();
