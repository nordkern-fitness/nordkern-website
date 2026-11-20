const path=require('node:path');
const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
 testDir:__dirname,
 testMatch:'**/*.member.cjs',
 timeout:60000,
 expect:{timeout:15000},
 workers:1,retries:0,
 fullyParallel:false,
 reporter:[['list']],
 outputDir:path.resolve(__dirname,'..','playwright-live-member-results'),
 use:{
  baseURL:'http://127.0.0.1:8765',
  browserName:'chromium',
  viewport:{width:1280,height:800},
  actionTimeout:18000,navigationTimeout:18000,
  screenshot:'off',trace:'off',video:'off',
  reducedMotion:'reduce',
 },
 webServer:{
  cwd:path.resolve(__dirname,'..'),
  command:'python3 -m http.server 8765 --bind 127.0.0.1',
  url:'http://127.0.0.1:8765/',
  reuseExistingServer:!process.env.CI,
 },
});
