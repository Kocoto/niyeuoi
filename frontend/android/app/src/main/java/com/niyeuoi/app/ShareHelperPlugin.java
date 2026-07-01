package com.niyeuoi.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Plugin nội bộ: JS gọi getPendingText() để lấy nội dung vừa được chia sẻ vào app.
 * Được đăng ký trong MainActivity, không cần npm package ngoài.
 */
@CapacitorPlugin(name = "ShareHelper")
public class ShareHelperPlugin extends Plugin {

    @PluginMethod
    public void getPendingText(PluginCall call) {
        String text = MainActivity.pendingShareText;
        MainActivity.pendingShareText = null;          // xoá sau khi đọc
        JSObject ret = new JSObject();
        ret.put("text", text != null ? text : "");
        call.resolve(ret);
    }
}
