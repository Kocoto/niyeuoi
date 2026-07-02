package com.niyeuoi.app;

import android.app.Notification;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import java.util.regex.Pattern;

/**
 * Tự đọc thông báo hệ thống, lọc lấy thông báo GIAO DỊCH ngân hàng/ví
 * (có token tiền tệ + số nhóm hàng nghìn) rồi đẩy sang app.
 *
 * Chỉ giữ lại thông báo khớp mẫu tiền — các thông báo khác bị bỏ qua ngay,
 * không lưu, để hạn chế đụng chạm dữ liệu riêng tư.
 *
 * Cần người dùng cấp "Notification access" trong Cài đặt (special access).
 */
public class NotificationCaptureService extends NotificationListenerService {

    static final String PREFS = "niyeuoi_notif";
    static final String KEY_PENDING = "pending";
    static final String ACTION_CAPTURED = "com.niyeuoi.app.NOTIF_CAPTURED";

    private static final Pattern CUR = Pattern.compile("(?i)(vnd|vnđ|đ)");
    private static final Pattern AMT = Pattern.compile("[+\\-]?\\s?\\d{1,3}([.,]\\d{3})+");

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;
        String pkg = sbn.getPackageName();
        if (pkg != null && pkg.startsWith("com.niyeuoi")) return; // bỏ qua chính app

        Notification n = sbn.getNotification();
        if (n == null || n.extras == null) return;
        Bundle ex = n.extras;

        StringBuilder sb = new StringBuilder();
        CharSequence title = ex.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence text = ex.getCharSequence(Notification.EXTRA_TEXT);
        CharSequence big = ex.getCharSequence(Notification.EXTRA_BIG_TEXT);
        if (title != null) sb.append(title).append(". ");
        if (big != null) sb.append(big);
        else if (text != null) sb.append(text);

        String content = sb.toString().trim();
        if (content.isEmpty()) return;
        if (!CUR.matcher(content).find() || !AMT.matcher(content).find()) return;

        // Lưu bản mới nhất để app đọc khi mở (kể cả lúc app đang đóng).
        getSharedPreferences(PREFS, MODE_PRIVATE)
                .edit().putString(KEY_PENDING, content).apply();

        // Nếu app đang mở → MainActivity nhận broadcast và hiển thị ngay.
        Intent bc = new Intent(ACTION_CAPTURED);
        bc.setPackage(getPackageName());
        bc.putExtra("text", content);
        sendBroadcast(bc);
    }
}
