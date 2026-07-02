package com.niyeuoi.app;

import android.app.Notification;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.text.TextUtils;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Tự đọc thông báo hệ thống, lọc lấy thông báo GIAO DỊCH ngân hàng/ví
 * (có token tiền tệ + số nhóm hàng nghìn) rồi đẩy sang app.
 *
 * Chỉ giữ lại thông báo khớp mẫu tiền — các thông báo khác bị bỏ qua ngay,
 * không lưu, để hạn chế đụng chạm dữ liệu riêng tư.
 *
 * Chạy NGẦM do hệ thống bind (không cần app mở). Cần cấp "Notification access".
 *
 * - Q1 (nhiều thông báo): xếp vào HÀNG ĐỢI `queue` (không ghi đè), app drain lần lượt.
 * - Q2 (trùng SMS + push cùng 1 giao dịch): "vân tay" = tập các số tiền trong tin
 *   (số tiền GD + số dư SD) → trùng trong 10 phút thì bỏ ngay tại gốc.
 */
public class NotificationCaptureService extends NotificationListenerService {

    static final String PREFS = "niyeuoi_notif";
    static final String KEY_QUEUE = "queue";     // JSONArray<String> — hàng đợi chờ app đọc
    static final String KEY_RECENT = "recent";   // JSONArray<{fp,ts}> — chống trùng
    static final String ACTION_CAPTURED = "com.niyeuoi.app.NOTIF_CAPTURED";

    private static final long DEDUP_WINDOW_MS = 10 * 60 * 1000L;
    private static final int MAX_QUEUE = 30;

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

        SharedPreferences sp = getSharedPreferences(PREFS, MODE_PRIVATE);
        long now = System.currentTimeMillis();

        // Q2: chống trùng theo vân tay (tập số tiền) trong cửa sổ thời gian.
        if (isRecentDuplicate(sp, fingerprint(content), now)) return;

        // Q1: nối vào hàng đợi (không ghi đè).
        appendToQueue(sp, content);

        // Nếu app đang mở → MainActivity nhận broadcast và drain ngay (không cần text).
        Intent bc = new Intent(ACTION_CAPTURED);
        bc.setPackage(getPackageName());
        sendBroadcast(bc);
    }

    /** Vân tay = tập (đã sắp xếp) các số nhóm hàng nghìn, bỏ dấu phân cách. */
    private String fingerprint(String content) {
        TreeSet<String> nums = new TreeSet<>();
        Matcher m = AMT.matcher(content);
        while (m.find()) {
            String digits = m.group().replaceAll("\\D", "");
            if (!digits.isEmpty()) nums.add(digits);
        }
        return TextUtils.join("|", nums);
    }

    /** Trả về true nếu vân tay đã gặp trong cửa sổ; đồng thời cập nhật danh sách (purge cũ). */
    private boolean isRecentDuplicate(SharedPreferences sp, String fp, long now) {
        boolean dup = false;
        JSONArray kept = new JSONArray();
        try {
            JSONArray arr = new JSONArray(sp.getString(KEY_RECENT, "[]"));
            for (int i = 0; i < arr.length(); i++) {
                JSONObject o = arr.getJSONObject(i);
                if (now - o.optLong("ts", 0) > DEDUP_WINDOW_MS) continue; // bỏ mục quá cũ
                if (o.optString("fp", "").equals(fp)) dup = true;
                kept.put(o);
            }
        } catch (Exception ignored) {}
        if (!dup && !fp.isEmpty()) {
            try { kept.put(new JSONObject().put("fp", fp).put("ts", now)); } catch (Exception ignored) {}
        }
        sp.edit().putString(KEY_RECENT, kept.toString()).apply();
        return dup;
    }

    private void appendToQueue(SharedPreferences sp, String content) {
        JSONArray q;
        try { q = new JSONArray(sp.getString(KEY_QUEUE, "[]")); } catch (Exception e) { q = new JSONArray(); }
        q.put(content);
        // Giới hạn kích thước, giữ MAX_QUEUE mục mới nhất.
        while (q.length() > MAX_QUEUE) q.remove(0);
        sp.edit().putString(KEY_QUEUE, q.toString()).apply();
    }
}
