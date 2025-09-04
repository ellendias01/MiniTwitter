
INTEGRAÇÕES & GUIAS
===================

1) Firebase Performance Monitoring (Android)
--------------------------------------------
- Add dependency in module build.gradle:
  implementation 'com.google.firebase:firebase-perf-ktx:20.3.2'

- Initialize (usually automatic when you add google-services plugin). Example of custom trace:
```kotlin
import com.google.firebase.perf.FirebasePerformance
import com.google.firebase.perf.metrics.Trace

val trace: Trace = FirebasePerformance.getInstance().newTrace("open_home_trace")
trace.start()
// ... code to measure ...
trace.putMetric("items_rendered", itemsCount.toLong())
trace.stop()
```

2) JankStats and AndroidX Tracing (Android)
-------------------------------------------
- Add dependency:
  implementation "androidx.tracing:tracing:1.1.0"
  implementation "androidx.tracing:tracing-perfetto:1.1.0" // optional

- JankStats example (API 24+):
```kotlin
val jankStats = JankStats.createAndTrack(window, object: JankStats.OnJankListener {
    override fun onJank(timing: Long, frames: Long, jankType: Int) {
        // send jank info to your backend
        sendMetric(mapOf("type" to "jank", "frames" to frames, "timing" to timing))
    }
})
```

- AndroidX Tracing for UI:
```kotlin
androidx.tracing.Trace.beginSection("compose_render")
// code
androidx.tracing.Trace.endSection()
```

3) Firebase Test Lab
--------------------
- Use Firebase console > Test Lab to upload APK and run tests on real devices.
- From CLI, use gcloud:
  gcloud firebase test android run --type instrumentation --app app-debug.apk --test app-debug-androidTest.apk

4) Simular Teste A/B (envio de dados para API)
----------------------------------------------
- On client (Android or Web), decide variant A/B (randomize per user and store locally).
- Include variant when sending metrics:
  POST /metrics
  { "type":"page_view", "page":"/home", "renderTimeMs":200, "userId":"u123", "variant":"B" }

- On backend, when receiving metrics you can group by `variant` field to compare metrics between A and B.

5) Examples: Frontend web snippet to send metrics (JS)
----------------------------------------------------
```js
function sendMetric(payload){
  fetch('http://YOUR_BACKEND:4000/metrics', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
}

// page render
sendMetric({type:'page_view', page:location.pathname, renderTimeMs:performance.now(), userId:'u1', variant:'A'});

// button click
document.getElementById('likeBtn').addEventListener('click', () => {
  sendMetric({type:'click', elementId:'likeBtn', page:location.pathname, userId:'u1'});
});
```

6) Simulating A/B at scale
--------------------------
- Use a script to replay synthetic events with variant=A and variant=B and compare metrics.
- Example (bash):
```
for i in {1..500}; do
  curl -s -X POST http://localhost:4000/metrics -H "Content-Type: application/json"     -d "{"type":"page_view","page":"/home","renderTimeMs":$((RANDOM%500)) ,"userId":"sim$i","variant":"A"}"
done
```

Notes & Next steps
- Add authentication (Firebase Auth) so metrics can be linked to users securely.
- Add batching on client to avoid spamming backend (buffer metrics and flush periodically).
- For heavy pages: define them by route names or by heuristic (renderTimeMs > threshold) — send type: 'load' with loadTimeMs to backend.
