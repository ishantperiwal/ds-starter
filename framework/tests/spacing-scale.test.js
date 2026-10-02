const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../spacing-inspector.js'),'utf8');
const helper=source.slice(source.indexOf('    function spacingScale('),source.indexOf('    function render('));
const scale=vm.runInNewContext(helper+';spacingScale');
const style=node=>({transform:node.transform||'none'});
test('spacing combines ancestor scaling without changing CSS measurements',()=>{const parent={transform:'matrix(0.5, 0, 0, 0.75, 0, 0)'};const child={parentElement:parent,transform:'matrix(2, 0, 0, 2, 0, 0)'};const result=scale(child,style);assert.equal(result.x,1);assert.equal(result.y,1.5);assert.equal(24*scale({parentElement:parent},style).y,18);});
test('rotated and skewed spacing remain explicitly unsupported',()=>{assert.equal(scale({transform:'matrix(1, 0.2, 0, 1, 0, 0)'},style),null);assert.equal(scale({transform:'matrix3d(1)'},style),null);});
