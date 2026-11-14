const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const p=await b.newPage({viewport:{width:390,height:844}});
 p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('file:///tmp/claude-0/h/index.html?theme=dark');await p.waitForTimeout(2600);
 await p.locator('.cl-nav-fab').click();await p.waitForTimeout(400);
 await p.locator('.cl-qp-links button',{hasText:'Live timer'}).click();await p.waitForTimeout(500);
 const s=n=>p.screenshot({path:`/tmp/claude-0/h/lt${n}.png`});
 await s(1);
 await p.locator('.cl-lt-big.go').click();await p.waitForTimeout(2300);await s(2);
 await p.locator('.cl-lt-big.fell').click();await p.waitForTimeout(1500);
 await p.locator('.cl-lt-fall button').nth(1).click();await s(3);
 await p.locator('.cl-lt-big.go').click();await p.waitForTimeout(1400);
 await p.locator('.cl-lt-big.top').click();await p.waitForTimeout(500);await s(4);
 await p.locator('.cl-lt-bar .cl-btn-primary').click();await p.waitForTimeout(900);
 await p.locator('.cl-dayrow').first().click();await p.waitForTimeout(600);await s(5);
 await b.close();
})();
