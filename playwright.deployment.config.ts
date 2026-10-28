import {defineConfig} from '@playwright/test';
if(!process.env.WILLIE_DEPLOYMENT_URL)throw new Error('WILLIE_DEPLOYMENT_URL required');
export default defineConfig({testDir:'tests',outputDir:'deployment-test-results',testMatch:['browser.spec.ts','browser-brand.spec.ts'],use:{baseURL:process.env.WILLIE_DEPLOYMENT_URL,trace:'retain-on-failure'},reporter:'list'});
