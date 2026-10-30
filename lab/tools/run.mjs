// SQL runner on the practice database (PostgreSQL via PGlite). Loads the
// tables of every part, or of one part with --part N.
//   npm run sql                      -> interactive shell
//   npm run sql -- --part 3          -> only the tables of part 3
//   npm run sql -- path/to/file.sql  -> run a file
//   npm run sql -- -e "select 1"     -> run one command
import { readFileSync } from 'node:fs';
import readline from 'node:readline';
import { loadParts, newDatabase, formatTable, partFilter, allSetupFiles } from './common.mjs';
import { runScript } from './engine.mjs';

const { filter, rest: args } = partFilter(process.argv.slice(2));
const setup = allSetupFiles((await loadParts(filter)).filter(filter));
let db = await newDatabase(setup);

async function execute(sql) {
  try {
    const results = await runScript(db, sql);
    for (const r of results) {
      if (r.fields.length) console.log(formatTable(r));
      else if (r.affectedRows) console.log(`OK, ${r.affectedRows} row(s) affected`);
    }
    if (results.length && results.every(r => !r.fields.length && !r.affectedRows)) console.log('OK');
  } catch (e) {
    console.log('ERROR: ' + e.message);
  }
}

if (args[0] === '-e') {
  await execute(args.slice(1).join(' '));
} else if (args.length) {
  for (const file of args) {
    console.log(`-- ${file}`);
    await execute(readFileSync(file, 'utf8'));
  }
} else {
  console.log(`CS4420 SQL shell — PostgreSQL (PGlite). Đã nạp: ${setup.join(', ')}`);
  console.log('Kết thúc câu lệnh bằng ;   Lệnh: \\d (liệt kê bảng), \\d <bảng>, \\reset (nạp lại dữ liệu), \\q (thoát)\n');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: 'sql> ' });
  let buffer = '';
  rl.prompt();
  for await (const line of rl) {
    const cmd = line.trim();
    if (!buffer && cmd.startsWith('\\')) {
      if (cmd === '\\q') break;
      if (cmd === '\\reset') { db = await newDatabase(setup); console.log('Đã nạp lại database.'); }
      else if (cmd === '\\d') await execute(`select table_name, table_type from information_schema.tables where table_schema = 'public' order by table_name;`);
      else if (cmd.startsWith('\\d ')) await execute(`select column_name, data_type, is_nullable from information_schema.columns where table_name = '${cmd.slice(3).trim().replace(/'/g, "''")}' order by ordinal_position;`);
      else console.log('Lệnh không hợp lệ.');
      rl.prompt();
      continue;
    }
    buffer += line + '\n';
    const dollarQuotes = (buffer.match(/\$\$/g) || []).length;
    if (cmd.endsWith(';') && dollarQuotes % 2 === 0) {
      await execute(buffer);
      buffer = '';
      rl.setPrompt('sql> ');
    } else {
      rl.setPrompt('...> ');
    }
    rl.prompt();
  }
  rl.close();
}
await db.close();
