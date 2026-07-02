package com.niyeuoi.app;

import android.content.Context;
import android.content.Intent;
import android.provider.Settings;

import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Set;

/**
 * Cầu nối cho tính năng tự đọc thông báo:
 * - isEnabled(): app đã được cấp Notification access chưa.
 * - openSettings(): mở màn cấp quyền của hệ thống.
 * - getPending(): lấy + xoá thông báo giao dịch mới nhất mà service bắt được.
 */
@CapacitorPlugin(name = "NotifHelper")
public class NotifHelper extends Plugin {

    @PluginMethod
    public void isEnabled(PluginCall call) {
        Set<String> pkgs = NotificationManagerCompat.getEnabledListenerPackages(getContext());
        JSObject ret = new JSObject();
        ret.put("enabled", pkgs.contains(getContext().getPackageName()));
        call.resolve(ret);
    }

    @PluginMethod
    public void openSettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    @PluginMethod
    public void getPending(PluginCall call) {
        String text = getContext()
                .getSharedPreferences(NotificationCaptureService.PREFS, Context.MODE_PRIVATE)
                .getString(NotificationCaptureService.KEY_PENDING, null);
        getContext()
                .getSharedPreferences(NotificationCaptureService.PREFS, Context.MODE_PRIVATE)
                .edit().remove(NotificationCaptureService.KEY_PENDING).apply();
        JSObject ret = new JSObject();
        ret.put("text", text != null ? text : "");
        call.resolve(ret);
    }
}
