package com.alumnex.connect;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.Settings;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@CapacitorPlugin(name = "AppUpdate")
public class AppUpdatePlugin extends Plugin {

    private final ExecutorService executor = Executors.newSingleThreadExecutor();
    private static final String NOTIFICATION_CHANNEL_ID = "app_updates";

    @PluginMethod
    public void getAppInfo(PluginCall call) {
        try {
            Context context = getContext();
            PackageManager pm = context.getPackageManager();
            PackageInfo pInfo = pm.getPackageInfo(context.getPackageName(), 0);

            long versionCode;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                versionCode = pInfo.getLongVersionCode();
            } else {
                versionCode = pInfo.versionCode;
            }

            String versionName = pInfo.versionName != null ? pInfo.versionName : "1.0.0";
            boolean canInstall = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                canInstall = pm.canRequestPackageInstalls();
            }

            JSObject ret = new JSObject();
            ret.put("versionName", versionName);
            ret.put("versionCode", versionCode);
            ret.put("packageName", context.getPackageName());
            ret.put("canInstall", canInstall);
            ret.put("isNative", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Failed to retrieve package info: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void canRequestPackageInstalls(PluginCall call) {
        boolean canInstall = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            canInstall = getContext().getPackageManager().canRequestPackageInstalls();
        }
        JSObject ret = new JSObject();
        ret.put("canInstall", canInstall);
        call.resolve(ret);
    }

    @PluginMethod
    public void openInstallPermissionSettings(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                JSObject ret = new JSObject();
                ret.put("opened", true);
                call.resolve(ret);
            } else {
                JSObject ret = new JSObject();
                ret.put("opened", false);
                call.resolve(ret);
            }
        } catch (Exception e) {
            call.reject("Could not open unknown app sources settings: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String urlStr = call.getString("url");
        String expectedSha256 = call.getString("sha256");
        String rawFileName = call.getString("fileName");
        String fileName = (rawFileName != null && !rawFileName.trim().isEmpty())
                ? rawFileName
                : "AlumnexConnect-update.apk";

        if (urlStr == null || urlStr.trim().isEmpty()) {
            call.reject("Download URL is required");
            return;
        }

        executor.execute(() -> {
            File targetFile = null;
            try {
                Context context = getContext();
                File downloadDir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (downloadDir == null) {
                    downloadDir = new File(context.getCacheDir(), "updates");
                }
                if (!downloadDir.exists()) {
                    downloadDir.mkdirs();
                }

                targetFile = new File(downloadDir, fileName);
                if (targetFile.exists()) {
                    targetFile.delete();
                }

                // Follow redirects manually to handle GitHub -> AWS S3 / CDN redirects
                URL currentUrl = new URL(urlStr);
                HttpURLConnection conn = null;
                int redirects = 0;
                while (redirects < 8) {
                    conn = (HttpURLConnection) currentUrl.openConnection();
                    conn.setInstanceFollowRedirects(true);
                    conn.setRequestProperty("User-Agent", "AlumnexConnect-Android/" + Build.VERSION.RELEASE);
                    conn.setConnectTimeout(25000);
                    conn.setReadTimeout(30000);
                    conn.connect();

                    int status = conn.getResponseCode();
                    if (status == HttpURLConnection.HTTP_MOVED_TEMP
                            || status == HttpURLConnection.HTTP_MOVED_PERM
                            || status == HttpURLConnection.HTTP_SEE_OTHER
                            || status == 307
                            || status == 308) {
                        String newUrl = conn.getHeaderField("Location");
                        currentUrl = new URL(newUrl);
                        redirects++;
                    } else if (status >= 200 && status < 300) {
                        break;
                    } else {
                        throw new Exception("HTTP download error: " + status + " (" + conn.getResponseMessage() + ")");
                    }
                }

                long totalBytes = conn.getContentLength();
                InputStream in = conn.getInputStream();
                FileOutputStream out = new FileOutputStream(targetFile);
                MessageDigest digest = MessageDigest.getInstance("SHA-256");

                byte[] buffer = new byte[8192];
                long bytesDownloaded = 0;
                int bytesRead;
                long lastProgressTime = 0;

                while ((bytesRead = in.read(buffer)) != -1) {
                    out.write(buffer, 0, bytesRead);
                    digest.update(buffer, 0, bytesRead);
                    bytesDownloaded += bytesRead;

                    long now = System.currentTimeMillis();
                    if (now - lastProgressTime > 150 || bytesDownloaded == totalBytes) {
                        lastProgressTime = now;
                        int percent = (totalBytes > 0)
                                ? (int) Math.min(100, (bytesDownloaded * 100) / totalBytes)
                                : 0;
                        JSObject progressObj = new JSObject();
                        progressObj.put("bytesDownloaded", bytesDownloaded);
                        progressObj.put("totalBytes", totalBytes);
                        progressObj.put("percent", percent);
                        notifyListeners("downloadProgress", progressObj);
                    }
                }

                out.flush();
                out.close();
                in.close();

                // Compute SHA-256
                byte[] hash = digest.digest();
                StringBuilder hexString = new StringBuilder();
                for (byte b : hash) {
                    String hex = Integer.toHexString(0xff & b);
                    if (hex.length() == 1) hexString.append('0');
                    hexString.append(hex);
                }
                String calculatedSha256 = hexString.toString();

                // Checksum verification
                if (expectedSha256 != null && !expectedSha256.trim().isEmpty()) {
                    String cleanedExpected = expectedSha256.trim().toLowerCase();
                    if (!calculatedSha256.equalsIgnoreCase(cleanedExpected)) {
                        targetFile.delete();
                        call.reject("Security check failed: APK SHA-256 checksum mismatch. Expected " + cleanedExpected + " but got " + calculatedSha256, "CHECKSUM_MISMATCH");
                        return;
                    }
                }

                // Trigger install or request permission
                boolean canInstall = true;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    canInstall = context.getPackageManager().canRequestPackageInstalls();
                }

                JSObject res = new JSObject();
                res.put("success", true);
                res.put("filePath", targetFile.getAbsolutePath());
                res.put("sha256", calculatedSha256);

                if (canInstall) {
                    launchPackageInstaller(targetFile);
                    res.put("status", "installer_launched");
                } else {
                    res.put("status", "permission_required");
                }
                call.resolve(res);

            } catch (Exception e) {
                if (targetFile != null && targetFile.exists()) {
                    targetFile.delete();
                }
                call.reject("Download failed: " + e.getMessage(), e);
            }
        });
    }

    @PluginMethod
    public void installExistingApk(PluginCall call) {
        String filePath = call.getString("filePath");
        if (filePath == null || filePath.trim().isEmpty()) {
            call.reject("Missing filePath");
            return;
        }

        File apkFile = new File(filePath);
        if (!apkFile.exists()) {
            call.reject("APK file does not exist at " + filePath);
            return;
        }

        try {
            boolean canInstall = true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                canInstall = getContext().getPackageManager().canRequestPackageInstalls();
            }

            if (!canInstall) {
                JSObject res = new JSObject();
                res.put("success", false);
                res.put("status", "permission_required");
                call.resolve(res);
                return;
            }

            launchPackageInstaller(apkFile);
            JSObject res = new JSObject();
            res.put("success", true);
            res.put("status", "installer_launched");
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Failed to launch package installer: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void showUpdateNotification(PluginCall call) {
        String title = call.getString("title", "Alumnex Connect Update");
        String body = call.getString("body", "A new version of Alumnex Connect is available.");

        try {
            Context context = getContext();
            NotificationManager notificationManager =
                    (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                        NOTIFICATION_CHANNEL_ID,
                        "App Updates",
                        NotificationManager.IMPORTANCE_DEFAULT
                );
                channel.setDescription("Notifications about new Alumnex Connect app updates");
                if (notificationManager != null) {
                    notificationManager.createNotificationChannel(channel);
                }
            }

            Intent launchIntent = new Intent(context, MainActivity.class);
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            launchIntent.putExtra("from_update_notification", true);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pendingIntent = PendingIntent.getActivity(context, 1001, launchIntent, flags);

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, NOTIFICATION_CHANNEL_ID)
                    .setSmallIcon(context.getApplicationInfo().icon)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                    .setContentIntent(pendingIntent)
                    .setAutoCancel(true);

            NotificationManagerCompat.from(context).notify(1001, builder.build());
            JSObject res = new JSObject();
            res.put("success", true);
            call.resolve(res);
        } catch (Exception e) {
            call.reject("Could not display notification: " + e.getMessage(), e);
        }
    }

    private void launchPackageInstaller(File apkFile) {
        Context context = getContext();
        String authority = context.getPackageName() + ".fileprovider";
        Uri apkUri = FileProvider.getUriForFile(context, authority, apkFile);

        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
    }
}
