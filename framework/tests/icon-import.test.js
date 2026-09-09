const test=require('node:test'),assert=require('node:assert/strict');
const {validateSVG}=require('../icon-import');
const wrap=s=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">'+s+'</svg>';
test('icon import accepts normalized vector artwork and rejects active content',()=>{
 assert(validateSVG(wrap('<svg viewBox="0 0 100 100" width="24" height="24"><path d="M0 0L10 10" fill="none"/></svg>')));
 for(const s of ['<script>alert(1)</script>','<path onload="alert(1)"/>','<image href="https://example.com"/>','<path fill="url(https://example.com)"/>','<g><path/></svg>'])assert.throws(()=>validateSVG(wrap(s)));
 assert.throws(()=>validateSVG('<svg viewBox="0 0 100 100"></svg>'));
});
