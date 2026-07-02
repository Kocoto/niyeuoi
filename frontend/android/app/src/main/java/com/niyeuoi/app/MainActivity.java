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

    /**
     * Khi app đang mở và service bắt được giao dịch mới → đánh thức WebView để
     * drain hàng đợi ngay (không truyền text; JS gọi NotifHelper.getPending()).
     */
    private void registerNotifReceiver() {
        notifReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context ctx, Intent intent) {
                injectEvent("niyeuoi-notif");
                // Nếu WebView chưa sẵn sàng: bỏ qua; JS sẽ drain lúc cold-start/resume.
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

    /** Bắn một CustomEvent (không kèm dữ liệu) vào WebView. */
    private void injectEvent(String eventName) {
        if (bridge == null || bridge.getWebView() == null) return;
        String script = "window.dispatchEvent(new CustomEvent('" + eventName + "'));";
        bridge.getWebView().post(() ->
                bridge.getWebView().evaluateJavascript(script, null)
        );
    }
}
