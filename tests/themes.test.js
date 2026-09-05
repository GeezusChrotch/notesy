const {test}=require('node:test');const assert=require('node:assert/strict');const Themes=require('../src/pkjs/themes');
test('Pome presets preserve colors and use supported fonts and sizes on both watches',()=>{
 for(const enhanced of [false,true])for(const preset of Themes.presets(enhanced)){
  const t=Themes.normalize({appearance:preset},enhanced),m=Themes.message({appearance:preset},enhanced);
  assert.equal(t.font,preset.font);assert.equal(t.size,preset.size);assert.equal(t.background,preset.background);
  assert.ok(m.THEME_BACKGROUND>=192&&m.THEME_BACKGROUND<=255);assert.ok(m.THEME_FONT>=(enhanced?5:0));
 }
 assert.equal(Themes.normalize({theme:1},true).font,'open-sans');
 assert.equal(Themes.normalize({appearance:{font:'bogus',size:99,background:'invalid'}},true).background,'#ffffff');
 assert.equal(Themes.message({appearance:Themes.presets(true)[0]},true).THEME_SELECTION_TEXT,255);
});
