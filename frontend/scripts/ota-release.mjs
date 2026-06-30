// Phát hành một bản web update qua OTA self-hosted.
//
// Cách dùng:
//   OTA_PUBLISH_SECRET=xxx node scripts/ota-release.mjs 1.0.1
//   (hoặc đặt OTA_PUBLISH_SECRET trong môi trường rồi: npm run ota:release -- 1.0.1)
//
// Việc nó làm: build web -> zip bằng @capgo/cli (sinh checksum chuẩn) ->
// upload zip lên backend /api/ota/bundles. App sẽ tự nhận bản mới ở lần mở kế tiếp.

import { execSync } from 'node:child_process';
import { readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const APP_ID = 'com.niyeuoi.app';
const BACKEND = process.env.OTA_BACKEND_URL || 'https://niyeuoi.onrender.com';
const SECRET = process.env.OTA_PUBLISH_SECRET;

const version = process.argv[2];
const skipBuild = process.argv.includes('--no-build');

function fail(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
  fail('Thiếu version hợp lệ. Ví dụ: node scripts/ota-release.mjs 1.0.1 (nhớ tăng số mỗi lần)');
}
if (!SECRET) {
  fail('Thiếu biến môi trường OTA_PUBLISH_SECRET (phải trùng giá trị đặt trên backend Render).');
}

const root = resolve(import.meta.dirname, '..');

try {
  if (!skipBuild) {
    console.log('🔨 Building web...');
    execSync('npm run build', { cwd: root, stdio: 'inherit' });
  }

  console.log(`🗜️  Zipping bundle v${version}...`);
  const out = execSync(
    `npx @capgo/cli bundle zip ${APP_ID} --path dist --bundle ${version} --json`,
    { cwd: root, encoding: 'utf8' },
  );
  // Lấy đoạn JSON cuối cùng trong output.
  const jsonStr = out.slice(out.indexOf('{'), out.lastIndexOf('}') + 1);
  const { filename, checksum } = JSON.parse(jsonStr);
  if (!filename || !checksum) fail('Không đọc được filename/checksum từ @capgo/cli.');

  const zipPath = resolve(root, filename);
  const zipBuffer = readFileSync(zipPath);

  console.log(`☁️  Uploading ${filename} (${(zipBuffer.length / 1024).toFixed(0)} KB) -> ${BACKEND} ...`);
  const form = new FormData();
  form.append('appId', APP_ID);
  form.append('version', version);
  form.append('checksum', checksum);
  form.append('bundle', new Blob([zipBuffer], { type: 'application/zip' }), filename);

  const res = await fetch(`${BACKEND}/api/ota/bundles`, {
    method: 'POST',
    headers: { 'x-ota-secret': SECRET },
    body: form,
  });

  const text = await res.text();
  rmSync(zipPath, { force: true }); // dọn file zip tạm

  if (!res.ok) fail(`Upload thất bại (${res.status}): ${text}`);

  console.log(`\n✅ Đã phát hành v${version}. Mở lại app trên điện thoại để nhận bản mới.\n`);
} catch (err) {
  fail(err.message || String(err));
}
