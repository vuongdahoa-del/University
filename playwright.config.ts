import {existsSync} from 'node:fs';
import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests',timeout:60000,workers:1,reporter:[['list'],['json',{outputFile:'test-results/results.json'}]],use:{headless:true,viewport:{width:1440,height:1000},launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']}},webServer:{command:'npm run dev -- --port 5173',url:'http://127.0.0.1:5173',reuseExistingServer:!process.env.CI}});
