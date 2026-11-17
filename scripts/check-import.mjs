import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {pool,query} from '../server/db.mjs';
if(!process.env.DB_NAME?.endsWith('_test'))throw Error('Test database required');
const rows=await query("SELECT id,title FROM content WHERE collection='services' ORDER BY sort_order LIMIT 1");const r=rows[0];
try{await query('UPDATE content SET title=? WHERE id=?',['Import preservation test',r.id]);await new Promise((resolve,reject)=>{const child=spawn(process.execPath,['node_modules/tsx/dist/cli.mjs','scripts/seed.ts'],{stdio:'inherit'});child.on('exit',code=>code?reject(Error('Seed failed')):resolve());});assert.equal((await query('SELECT title FROM content WHERE id=?',[r.id]))[0].title,'Import preservation test');console.log('Repeat import preserved an edited seed record.');}finally{await query('UPDATE content SET title=? WHERE id=?',[r.title,r.id]);await pool.end();}
