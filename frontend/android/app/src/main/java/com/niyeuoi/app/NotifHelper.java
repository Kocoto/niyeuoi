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

import org.json.JSONArray;

import java.util.Set;

/**
 * Cầu nối cho tính năng tự đọc thông báo:
 * - isEnabled(): app đã được cấp Notification access chưa.
 * - openSettings(): mở màn cấp quyền của hệ thống.
 * - getPending(): lấy + xoá TOÀN BỘ hàng đợi thông báo giao dịch service bắt được.
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
        android.content.SharedPreferences sp = getContext()
                .getSharedPreferences(NotificationCaptureService.PREFS, Context.MODE_PRIVATE);
        String qStr = sp.getString(NotificationCaptureService.KEY_QUEUE, "[]");
        sp.edit().remove(NotificationCaptureService.KEY_QUEUE).apply();
        JSObject ret = new JSObject();
        try {
            ret.put("items", new JSONArray(qStr));
        } catch (Exception e) {
            ret.put("items", new JSONArray());
        }
        call.resolve(ret);
    }
}
