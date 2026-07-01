package com.niyeuoi.app;

import android.content.Intent;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /** Lưu text nhận từ share intent để ShareHelperPlugin và JS có thể đọc. */
    static String pendingShareText = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ShareHelperPlugin.class);
        super.onCreate(savedInstanceState);
        handleShareIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleShareIntent(intent);
    }

    private void handleShareIntent(Intent intent) {
        if (intent == null) return;
        if (!Intent.ACTION_SEND.equals(intent.getAction())) return;
        if (!"text/plain".equals(intent.getType())) return;

        String text = intent.getStringExtra(Intent.EXTRA_TEXT);
        if (text == null || text.isEmpty()) return;

        pendingShareText = text;

        // Nếu bridge/WebView đã sẵn sàng (app đang chạy nền) → inject ngay qua JS
        if (bridge != null && bridge.getWebView() != null) {
            String json = org.json.JSONObject.quote(text);
            String script = "window.dispatchEvent(new CustomEvent('niyeuoi-share',{detail:{text:" + json + "}}));";
            bridge.getWebView().post(() ->
                bridge.getWebView().evaluateJavascript(script, null)
            );
        }
        // Nếu app mới khởi động: pendingShareText được đọc qua ShareHelperPlugin.getPendingText()
    }
}
