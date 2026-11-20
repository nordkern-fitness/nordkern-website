const path=require('node:path');
const {defineConfig,devices}=require('@playwright/test');

module.exports=defineConfig({
 testDir:__dirname,
 testMatch:'**/*.public.cjs',
 timeout:45000,
 expect:{timeout:12000},
 fullyParallel:false,
 workers:1,
 retries:0,
 reporter:[['list'],['html',{open:'never',
   outputFolder:path.resolve(__dirname,'..','playwright-live-public-report')}]],
 outputDir:path.resolve(__dirname,'..','playwright-live-public-results'),
 use:{
   baseURL:'http://127.0.0.1:8765',
   actionTimeout:15000,navigationTimeout:15000,
   reducedMotion:'reduce',
   // No screenshots or traces of live responses.
   screenshot:'off',trace:'off',video:'off',
 },
 projects:[
   {name:'chromium-live-dev',use:{browserName:'chromium',viewport:{width:1280,height:800}}},
   {name:'firefox-live-dev',use:{browserName:'firefox',viewport:{width:1280,height:800}}},
   {name:'webkit-live-dev',use:{browserName:'webkit',viewport:{width:390,height:844},
     deviceScaleFactor:1}},
 ],
 webServer:{
   cwd:path.resolve(__dirname,'..'),
   command:'python3 -m http.server 8765 --bind 127.0.0.1',
   url:'http://127.0.0.1:8765/',
   reuseExistingServer:!process.env.CI,
   timeout:15000,
 },
});
