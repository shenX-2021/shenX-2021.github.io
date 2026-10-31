const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const mysqlConfig = {
  waitForConnections: true,
  host: 'xxxxxxx',
  user: 'xxxxxxx',
  password: 'xxxxxxx',
}

const resourcePath = './resource'
async function bootstrap() {
  console.time('done')
  const dbList = fs.readdirSync(resourcePath);
  for (const db of dbList) {
    const folderPath = path.join(resourcePath, db)
    const fileList = fs.readdirSync(folderPath);
    for (const filename of fileList) {
      const filePath = path.join(folderPath, filename);
      const createSQL = fs.readFileSync(filePath).toString();
      const parsedPath = path.parse(filename)
      const table = parsedPath.name
      await handle(db, table, createSQL)
    }
  }

  console.timeEnd('done')
}

async function handle(db, table, createSQL) {
  const mysqlRoot = '/var/lib/mysql'
  const mysqlBakRoot = '/var/lib/mysql_bak'

  const conn = await mysql.createConnection({
    ...mysqlConfig,
    database: db,
  });

  try {
    const [res] = await conn.query(`select * from ${table} limit 1`);
    console.log(`${db}.${table}没有异常，无需处理！\n\n`)
    return;
  } catch(err) {
    console.error(`${db}.${table}无法查询，需要处理。${err.message}`)
  }

  {
    const frmFilePath = path.join(mysqlRoot, db, `${table}.frm`)
    const { stdout, stderr } = await execAsync(`rm -f ${frmFilePath}`);
    if (stdout || stderr) console.log(stdout, stderr)
  }
  {
    const ibdFilePath = path.join(mysqlRoot, db, `${table}.ibd`)
    const { stdout, stderr } = await execAsync(`rm -f ${ibdFilePath}`);
    if (stdout || stderr) console.log(stdout, stderr)
  }


  await conn.query(`DROP TABLE IF EXISTS ${table} `);
  await conn.query(createSQL);
  await conn.query(`ALTER TABLE ${table} DISCARD TABLESPACE`)

  {
    const ibdFilePath = path.join(mysqlRoot, db, `${table}.ibd`)
    const { stdout, stderr } = await execAsync(`rm -f ${ibdFilePath}`);
    if (stdout || stderr) console.log(stdout, stderr)
  }
  {
    const ibdFilePath = path.join(mysqlRoot, db, `${table}.ibd`)
    const ibdBakFilePath = path.join(mysqlBakRoot, db, `${table}.ibd`)
    const { stdout, stderr } = await execAsync(`cp ${ibdBakFilePath} ${ibdFilePath}`);
    if (stdout || stderr) console.log(stdout, stderr)
  }
  {
    const ibdFilePath = path.join(mysqlRoot, db, `${table}.ibd`)
    const { stdout, stderr } = await execAsync(`chown mysql:mysql ${ibdFilePath}`);
    if (stdout || stderr) console.log(stdout, stderr)
  }
  await conn.query(`ALTER TABLE ${table} IMPORT TABLESPACE`)
  try {
    const [results] = await conn.query(`select max(id) id from ${table}`)
    
    await conn.query(`ALTER TABLE ${table} AUTO_INCREMENT=${results[0] ? results[0].id + 1: 1}`)
  } catch(err) {
    console.error(`${db}.${table}没有自增id`, err.message)
  }


  try {
    await conn.query(`select * from ${table} limit 1`);
    console.log(`${db}.${table}处理成功！\n\n`)
    return;
  } catch(err) {
    console.log(`${db}.${table}处理失败。${err.message}\n\n`)
  }

  await conn.destroy()
}

bootstrap();