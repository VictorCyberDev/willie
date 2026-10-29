const path=window.location.pathname;
if(path==='/judge-v2') void import('./winner-judge');
else if(path==='/'||path==='/winner'||path==='/stage'||path.startsWith('/willie/')) void import('./winner-main');
else void import('./main');
