const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const frontendDir = path.resolve(__dirname, '../frontend');
const mobileWwwDir = path.resolve(__dirname, 'www');

console.log('--- Alumnex Connect Mobile Sync ---');

try {
  // Step 1: Build the frontend
  console.log(`\n1. Building frontend project located at: ${frontendDir}`);
  console.log('   This may take a minute...');
  // Force CI=false to prevent warnings from throwing errors in standard CRA
  execSync('npm run build', { cwd: frontendDir, stdio: 'inherit', env: { ...process.env, CI: 'false' } });

  // Step 2: Clean up the old mobile www directory
  console.log(`\n2. Cleaning old www directory in mobile app...`);
  if (fs.existsSync(mobileWwwDir)) {
    fs.rmSync(mobileWwwDir, { recursive: true, force: true });
  }

  // Step 3: Copy the new build to the mobile www directory
  const frontendBuildDir = path.join(frontendDir, 'build');
  console.log(`\n3. Copying ${frontendBuildDir} -> ${mobileWwwDir}`);
  fs.cpSync(frontendBuildDir, mobileWwwDir, { recursive: true });

  // Step 4: Sync Capacitor
  console.log(`\n4. Syncing Capacitor with Android native project...`);
  execSync('npx cap sync', { cwd: __dirname, stdio: 'inherit' });

  console.log('\n✅ Success! The mobile app is fully synchronized with the latest website build.');
  console.log('Next steps: Open "android" folder in Android Studio to build your APK/AAB.');

} catch (error) {
  console.error('\n❌ Build/Sync Failed:', error.message);
  process.exit(1);
}
