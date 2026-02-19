package com.snakeflow.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            // Try to allow media playback without a user gesture in the WebView used by Capacitor.
            // Use reflection to support different Capacitor versions / WebView wrappers.
            Object bridgeWebView = this.getBridge().getWebView();
            boolean configured = false;

            try {
                java.lang.reflect.Method mGetEngine = bridgeWebView.getClass().getMethod("getEngine");
                Object engine = mGetEngine.invoke(bridgeWebView);
                java.lang.reflect.Method mGetWebView = engine.getClass().getMethod("getWebView");
                android.webkit.WebView webView = (android.webkit.WebView) mGetWebView.invoke(engine);
                webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
                configured = true;
            } catch (Exception ignored) {}

            if (!configured) {
                try {
                    java.lang.reflect.Method mGetView = bridgeWebView.getClass().getMethod("getView");
                    android.webkit.WebView webView = (android.webkit.WebView) mGetView.invoke(bridgeWebView);
                    webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
                    configured = true;
                } catch (Exception ignored) {}
            }
        } catch (Exception ignored) {
            // If anything goes wrong, fail silently — app will still run.
        }
    }
}
