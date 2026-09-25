from pathlib import Path

root = Path(__file__).resolve().parent.parent
app = root / "app"
launcher = app / "src/main/java/com/jumpipgo/meso/LauncherActivity.java"
manifest = app / "src/main/AndroidManifest.xml"
gradle = app / "build.gradle"

source = '''package com.jumpipgo.meso;

import android.content.ComponentName;
import android.content.Intent;
import android.content.ServiceConnection;
import android.content.pm.ActivityInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import androidx.browser.customtabs.CustomTabsCallback;
import androidx.browser.customtabs.CustomTabsClient;
import androidx.browser.customtabs.CustomTabsServiceConnection;
import androidx.browser.customtabs.CustomTabsSession;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

public class LauncherActivity extends com.google.androidbrowserhelper.trusted.LauncherActivity {
    private static final Uri SOURCE_ORIGIN = Uri.parse("https://jumpipgo.github.io");
    private static final Uri TARGET_ORIGIN = Uri.parse("https://jumpipgo.github.io");

    private CustomTabsClient customTabsClient;
    private CustomTabsSession customTabsSession;
    private boolean serviceBound;
    private boolean channelRequested;
    private boolean relationshipValidated;

    private final CustomTabsCallback callback = new CustomTabsCallback() {
        @Override
        public void onRelationshipValidationResult(int relation, Uri origin, boolean result, Bundle extras) {
            relationshipValidated = result;
        }

        @Override
        public void onNavigationEvent(int navigationEvent, Bundle extras) {
            if (navigationEvent == NAVIGATION_FINISHED && relationshipValidated && !channelRequested) {
                channelRequested = true;
                customTabsSession.requestPostMessageChannel(
                    SOURCE_ORIGIN,
                    TARGET_ORIGIN,
                    Bundle.EMPTY
                );
            }
        }

        @Override
        public void onMessageChannelReady(Bundle extras) {
            customTabsSession.postMessage("meso-ui-ready", null);
        }

        @Override
        public void onPostMessage(String message, Bundle extras) {
            if ("system-ui:hide".equals(message)) {
                setStatusBarVisible(false);
            } else if ("system-ui:show".equals(message)) {
                setStatusBarVisible(true);
            }
        }
    };

    private final ServiceConnection serviceConnection = new CustomTabsServiceConnection() {
        @Override
        public void onCustomTabsServiceConnected(ComponentName name, CustomTabsClient client) {
            customTabsClient = client;
            serviceBound = true;
            customTabsClient.warmup(0L);
            customTabsSession = customTabsClient.newSession(callback);
        }

        @Override
        public void onServiceDisconnected(ComponentName name) {
            customTabsClient = null;
            customTabsSession = null;
            serviceBound = false;
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.BLACK);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            getWindow().setNavigationBarContrastEnforced(false);
        }

        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.O) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_USER_PORTRAIT);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        }
    }

    @Override
    protected void onStart() {
        super.onStart();
        if (serviceBound) return;
        String packageName = CustomTabsClient.getPackageName(this, null);
        if (packageName != null) {
            CustomTabsClient.bindCustomTabsService(this, packageName, serviceConnection);
        }
    }

    @Override
    protected void onStop() {
        if (serviceBound) {
            unbindService(serviceConnection);
            serviceBound = false;
        }
        customTabsClient = null;
        customTabsSession = null;
        channelRequested = false;
        relationshipValidated = false;
        super.onStop();
    }

    private void setStatusBarVisible(boolean visible) {
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(
            getWindow(),
            getWindow().getDecorView()
        );
        controller.setSystemBarsBehavior(
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        );
        if (visible) {
            controller.show(WindowInsetsCompat.Type.statusBars());
        } else {
            controller.hide(WindowInsetsCompat.Type.statusBars());
        }
    }
}
'''

launcher.write_text(source)

manifest_text = manifest.read_text()
service = '        <service android:name="androidx.browser.customtabs.PostMessageService" android:exported="true" />\n'
if service not in manifest_text:
    manifest_text = manifest_text.replace("    </application>", service + "    </application>")
manifest.write_text(manifest_text)

gradle_text = gradle.read_text()
dependency = "        implementation 'androidx.browser:browser:1.8.0'\n"
if dependency not in gradle_text:
    gradle_text = gradle_text.replace(
        "        implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.6.2'",
        "        implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.6.2'\n" + dependency.rstrip("\n"),
    )
gradle.write_text(gradle_text)
