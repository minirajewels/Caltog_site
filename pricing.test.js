const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {eligible,normalizeCart,calculate,orderText}=require('./pricing');
const products=JSON.parse(fs.readFileSync(__dirname+'/products.json','utf8'));
const item=(code,price,stock='In Stock')=>({code,price,stock,category:'Beach Collection',ringOffer:false});
test('438 unique products and original PNG/JPG filenames',()=>{
 assert.equal(products.length,438); assert.equal(new Set(products.map(p=>p.code)).size,438);
 assert.equal(products.filter(p=>p.image.endsWith('.jpg')).length,2);
 assert.equal(products.find(p=>p.code==='AT - N100').image,'AT - N100.jpg');
 assert.equal(products.find(p=>p.code==='AT - E013').image,'AT - E013.jpg');
});
test('all ring SKUs qualify irrespective of flags and category',()=>{
 for(const p of products) assert.equal(eligible(p),p.code.startsWith('AT - R'));
 const x=calculate({'AT - R002':5},products);
 assert.equal(x.discount,698); assert.equal(x.merchandise,1047); assert.equal(x.shipping,0);
});
test('offer counts units and repeats across mixed price groups',()=>{
 const p=[item('AT - R1',100),item('AT - R2',200),item('AT - R3',300)];
 assert.equal(calculate({'AT - R1':3,'AT - R2':2},p).discount,200);
 assert.equal(calculate({'AT - R1':5,'AT - R2':5},p).discount,600);
 assert.equal(calculate({'AT - R1':5,'AT - R2':5,'AT - R3':5},p).discount,1200);
 assert.equal(calculate({'AT - R1':4},p).discount,0);
 assert.equal(calculate({'AT - R1':6},p).discount,200);
});
test('shipping uses discounted merchandise and precise 999 threshold',()=>{
 assert.equal(calculate({'AT - N1':1},[item('AT - N1',998)]).shipping,79);
 assert.equal(calculate({'AT - N1':1},[item('AT - N1',999)]).shipping,0);
 assert.equal(calculate({},products).shipping,0);
 const x=calculate({'AT - R1':5},[item('AT - R1',300)]);
 assert.equal(x.subtotal,1500); assert.equal(x.merchandise,900); assert.equal(x.shipping,79); assert.equal(x.total,979);
});
test('unknown, out-of-stock, malformed and unsafe quantities cannot enter orders',()=>{
 const p=[item('AT - R1',300),item('AT - R2',200,'Out of Stock')];
 for(const input of [null,[],{'AT - R1':-1},{'AT - R1':1.5},{'AT - R1':'5'},{'unknown':2},{'AT - R2':5},{'AT - R1':Number.MAX_SAFE_INTEGER}])
 assert.equal(Object.keys(normalizeCart(input,p)).length,0);
});
test('WhatsApp message and share encoding retain codes, quantities and totals',()=>{
 const cart={'AT - R002':5}; const restored=JSON.parse(atob(btoa(JSON.stringify(cart))));
 assert.deepEqual(restored,cart);
 const message=orderText(restored,products);
 assert.match(message,/AT - R002 × 5/);assert.match(message,/Ring offer: -₹698/);assert.match(message,/Total: ₹1,047/);
});
