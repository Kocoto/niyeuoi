package com.niyeuoi.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /** Lưu text nhận từ share intent để ShareHelperPlugin và JS có thể đọc. */
    static String pendingShareText = null;

    private BroadcastReceiver notifReceiver;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShareHelperPlugin.class);
        registerPlugin(NotifHelper.class);
        super.onCreate(savedInstanceState);
        handleShareIntent(getIntent());
        registerNotifReceiver();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleShareIntent(intent);
    }

    @Override
    public void onDestroy() {
        if (notifReceiver != null) {
            try { unregisterReceiver(notifReceiver); } catch (Exception ignored) {}
            notifReceiver = null;
        }
        super.onDestroy();
    }

    private void handleShareIntent(Intent intent) {
        if (intent == null) return;
        if (!Intent.ACTION_SEND.equals(intent.getAction())) return;
        if (!"text/plain".equals(intent.getType())) return;

        String text = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (text == null || text.isEmpty()) return;

        pendingShareText = text;         // cold start: đọc qua ShareHelper.getPendingText()
        injectText(text);                // hot start: inject ngay nếu WebView sẵn sàng
    }

    /** Nhận thông báo giao dịch do NotificationCaptureService bắt được khi app đang mở. */
    private void registerNotifReceiver() {
        notifReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context ctx, Intent intent) {
                String text = intent.getStringExtra("text");
                if (text == null || text.isEmpty()) return;
                if (bridge != null && bridge.getWebView() != null) {
                    injectText(text);
                    // Đã xử lý live → xoá pending để không mở lại khi resume.
                    getSharedPreferences(NotificationCaptureService.PREFS, MODE_PRIVATE)
                            .edit().remove(NotificationCaptureService.KEY_PENDING).apply();
                }
                // Nếu WebView chưa sẵn sàng: giữ nguyên pending, JS sẽ drain lúc resume.
            }
        };
        IntentFilter filter = new IntentFilter(NotificationCaptureService.ACTION_CAPTURED);
        if (Build.VERSION.SDK_INT >= 33) {
            registerReceiver(notifReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(notifReceiver, filter);
        }
    }

    /** Đẩy text vào WebView qua event 'niyeuoi-share' (dùng chung luồng với share). */
    private void injectText(String text) {
        if (bridge == null || bridge.getWebView() == null) return;
        String json = org.json.JSONObject.quote(text);
        String script = "window.dispatchEvent(new CustomEvent('niyeuoi-share',{detail:{text:" + json + "}}));";
        bridge.getWebView().post(() ->
                bridge.getWebView().evaluateJavascript(script, null)
        );
    }
}
