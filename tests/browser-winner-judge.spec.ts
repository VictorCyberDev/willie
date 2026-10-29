import{test,expect}from'@playwright/test';

test('Judge Mode V2 demonstrates the winner-release loop while staying explicitly simulated',async({page})=>{
 await page.goto('/judge-v2');
 await expect(page.getByText('SIMULATED WINNER RELEASE',{exact:true})).toBeVisible();
 await expect(page.getByText('NOT LIVE TWITCH',{exact:false})).toBeVisible();
 await page.getByRole('button',{name:'Run chat contributions →'}).click();
 await expect(page.getByText('MUTATION VOTE',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Approve Ember Scar →'}).click();
 await expect(page.getByText('NEXT STOP VOTE',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Approve Victor as next stop →'}).click();
 await page.getByRole('button',{name:'Arm handoff →'}).click();
 await page.getByRole('button',{name:'Replay Twitch raid evidence →'}).click();
 await expect(page.getByText(/Custody still belongs to Maya/)).toBeVisible();
 const hold=page.getByRole('button',{name:'Hold to receive Willie for 750 milliseconds'});
 await hold.focus();await page.keyboard.down('Space');await page.waitForTimeout(810);await page.keyboard.up('Space');
 await expect(page.getByText('Nothing reset.',{exact:true})).toBeVisible();
 await expect(page.getByText('Ember Scar preserved',{exact:true})).toBeVisible();
 await expect(page.getByText('CHAPTER 01 — MAYA',{exact:true})).toBeVisible();
 await expect(page.getByText('SIMULATED JUDGE REPLAY',{exact:true})).toBeVisible();
 await expect(page.locator('pre')).toContainText('SIMULATED_JUDGE_REPLAY');
});
