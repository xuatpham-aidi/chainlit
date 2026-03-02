# Chainlit WebSocket (Socket.IO) API — Flutter Integration Guide

This document describes the full Socket.IO event contract exposed by the Chainlit backend server.  
Flutter developers should use a Socket.IO-compatible client (e.g. [`socket_io_client`](https://pub.dev/packages/socket_io_client)) with **Engine.IO v4 / Socket.IO v4** transport.

---

## 0. Authentication — Azure AD (Mobile PKCE Flow)

Mobile apps **cannot** use the browser-redirect OAuth flow (`GET /auth/oauth/azure-ad`).  
Use the native PKCE flow instead:

```
Flutter (MSAL)  ──►  Azure AD  ──►  Azure access_token
                                              │
                            POST /auth/oauth/azure-ad/mobile
                            {"access_token": "<azure-token>"}
                                              │
                                    Server validates against
                                    https://graph.microsoft.com/v1.0/me
                                              │
                                  {"success": true,
                                   "jwt_access_token": "<chainlit-jwt>"}
                                              │
                              Store chainlit-jwt  ──►  use in Cookie header
                                                        when connecting WebSocket
```

### Required Azure App Registration settings for mobile

In the Azure Portal → App Registration → Authentication:
- Add a **Mobile and desktop applications** platform
- Add a redirect URI: `msauth://<your.bundle.id>/callback`  
  or a custom scheme like `myapp://auth`
- Enable **Allow public client flows** (required for PKCE — no client secret on device)
- Scopes needed: `https://graph.microsoft.com/User.Read offline_access`

### pubspec.yaml dependencies

```yaml
dependencies:
  msal_flutter: ^1.x         # Azure AD PKCE auth
  socket_io_client: ^2.x     # WebSocket
  flutter_secure_storage: ^9.x  # Store the JWT securely
```

### Step 1 — Acquire Azure AD token via MSAL

```dart
import 'package:msal_flutter/msal_flutter.dart';

class AzureAuthService {
  late PublicClientApplication _pca;

  Future<void> init() async {
    _pca = await PublicClientApplication.createPublicClientApplication(
      'YOUR_AZURE_AD_CLIENT_ID',   // OAUTH_AZURE_AD_CLIENT_ID on the server
      authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID',
    );
  }

  Future<String> acquireToken() async {
    final result = await _pca.acquireToken(
      scopes: ['https://graph.microsoft.com/User.Read'],
    );
    return result.accessToken;  // Azure AD access token
  }

  Future<String> acquireTokenSilent() async {
    final result = await _pca.acquireTokenSilent(
      scopes: ['https://graph.microsoft.com/User.Read'],
    );
    return result.accessToken;
  }
}
```

### Step 2 — Exchange for a Chainlit JWT

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

const _storage = FlutterSecureStorage();
const _chainlitBase = 'https://<your-chainlit-host>';

Future<String> loginWithAzureToken(String azureAccessToken) async {
  final response = await http.post(
    Uri.parse('$_chainlitBase/auth/oauth/azure-ad/mobile'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'access_token': azureAccessToken}),
  );

  if (response.statusCode != 200) {
    throw Exception('Token exchange failed: ${response.body}');
  }

  final data = jsonDecode(response.body) as Map<String, dynamic>;
  final chainlitJwt = data['access_token'] as String;

  // Persist securely
  await _storage.write(key: 'chainlit_jwt', value: chainlitJwt);
  return chainlitJwt;
}
```

### Step 3 — Connect WebSocket with the Chainlit JWT

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

IO.Socket connectSocket(String chainlitJwt) {
  return IO.io(
    _chainlitBase,
    IO.OptionBuilder()
      .setTransports(['websocket'])
      .setExtraHeaders({
        // Must be sent as a browser-style Cookie header
        'Cookie': 'access_token=$chainlitJwt',
      })
      .setAuth({
        'sessionId': yourPersistedUuidV4,  // persistent — reuse across reconnects
        'clientType': 'app',
        'chatProfile': null,
        'threadId': null,
      })
      .disableAutoConnect()
      .build(),
  )..connect();
}
```

### Step 4 — Full login + connect sequence

```dart
Future<IO.Socket> signInAndConnect() async {
  final authService = AzureAuthService();
  await authService.init();

  // Try silent first, fall back to interactive
  String azureToken;
  try {
    azureToken = await authService.acquireTokenSilent();
  } catch (_) {
    azureToken = await authService.acquireToken();
  }

  final chainlitJwt = await loginWithAzureToken(azureToken);
  final socket = connectSocket(chainlitJwt);

  socket.onConnect((_) => socket.emit('connection_successful'));
  socket.onConnectError((e) => print('Auth failed: $e'));

  return socket;
}
```

### Token expiry & refresh

The Chainlit JWT has a finite lifetime (`user_session_timeout` on the server).  
When the WebSocket is refused with `"authentication failed"`, re-run the flow:

```dart
socket.onConnectError((error) async {
  if (error.toString().contains('authentication failed')) {
    // Azure AD token may also have expired — re-acquire silently
    final newAzureToken = await authService.acquireTokenSilent();
    final newJwt = await loginWithAzureToken(newAzureToken);
    await _storage.write(key: 'chainlit_jwt', value: newJwt);
    socket.io.options['extraHeaders'] = {'Cookie': 'access_token=$newJwt'};
    socket.connect();
  }
});
```

---

## 1. Connection Setup

### 1.1 Transport & URL

```
wss://<host>/ws/socket.io/
```

Use `websocket` transport only. Polling fallback is supported but not recommended on mobile.

```dart
// pubspec.yaml dependency: socket_io_client: ^2.x
import 'package:socket_io_client/socket_io_client.dart' as IO;

final socket = IO.io(
  'https://<host>',
  IO.OptionBuilder()
    .setTransports(['websocket'])
    .disableAutoConnect()
    .build(),
);
socket.connect();
```

### 1.2 Authentication Payload (sent on `connect`)

The Socket.IO `auth` object must be sent during the handshake.  
This corresponds to the `WebSocketSessionAuth` TypedDict on the server.

| Field          | Type              | Required | Description |
|----------------|-------------------|----------|-------------|
| `sessionId`    | `string` (UUID v4)| ✅        | Unique client-generated session identifier. Re-use the same ID on reconnect to restore the session. |
| `clientType`   | `"app"` \| `"copilot"` \| `"teams"` | ✅ | Mobile should use `"app"`. |
| `userEnv`      | `string` (JSON)   | ❌        | JSON-serialized key-value map of user-provided env vars, if the server requires them. |
| `chatProfile`  | `string` (URL-encoded) | ❌    | Name of the selected chat profile. |
| `threadId`     | `string`          | ❌        | If provided, the server will attempt to resume this existing thread. |

**Authentication** is cookie-based. Send the `access_token` cookie with the HTTP upgrade request. If authentication fails, the server emits `ConnectionRefusedError`.

```dart
socket = IO.io(
  'https://<host>',
  IO.OptionBuilder()
    .setTransports(['websocket'])
    .setAuth({
      'sessionId': yourUuidV4,
      'clientType': 'app',
      'chatProfile': null,
      'threadId': null,
    })
    .setExtraHeaders({'Cookie': 'access_token=$token'})
    .disableAutoConnect()
    .build(),
);
```

---

## 2. Connection Lifecycle

```
Client                          Server
  |-------- connect (auth) ------->|   Socket.IO handshake + auth check
  |<------- true (accepted) -------|   connection accepted
  |                                |
  |---- connection_successful ---->|   client signals it is ready to receive
  |<------- task_end --------------|   server clears any pending state
  |<------- first_interaction ---->|   (if thread was just created)
  |            OR                  |
  |<------- resume_thread -------->|   (if threadId was supplied and valid)
```

### `connection_successful` (Client → Server)

Send immediately after the `connect` callback fires. No payload.  
This triggers `on_chat_start` (new session) or `on_chat_resume` (resumed thread) on the server.

```dart
socket.onConnect((_) {
  socket.emit('connection_successful');
});
```

---

## 3. Events: Client → Server

### 3.1 `client_message` — Send a Chat Message

```jsonc
// Payload: MessagePayload
{
  "message": {
    "id": "<uuid-v4>",          // MUST be a valid UUID v4
    "threadId": "<thread-id>",
    "type": "user_message",
    "output": "Hello, world!",  // the actual text content
    "name": "User",
    "createdAt": "2026-02-27T10:00:00Z"
    // ... other StepDict fields
  },
  "fileReferences": [           // optional — list of file IDs uploaded beforehand
    { "id": "<file-id>" }
  ]
}
```

```dart
socket.emit('client_message', {
  'message': {
    'id': Uuid().v4(),
    'threadId': currentThreadId,
    'type': 'user_message',
    'output': userText,
    'name': 'User',
    'createdAt': DateTime.now().toUtc().toIso8601String(),
  },
  'fileReferences': null,
});
```

### 3.2 `edit_message` — Edit an Existing Message

Replace the content of a previously sent message. The server re-runs `on_message` with the updated content.

```jsonc
// Payload: MessagePayload (same structure as client_message)
{
  "message": {
    "id": "<existing-message-uuid>",
    "output": "Corrected text",
    ...
  },
  "fileReferences": null
}
```

### 3.3 `stop` — Stop the Current Task

Cancel the running AI task. No payload. The server sends back a "Task manually stopped." message.

```dart
socket.emit('stop');
```

### 3.4 `clear_session` — Mark Session for Clearing on Disconnect

Instructs the server to immediately destroy the session upon disconnect rather than keeping it alive for `session_timeout` seconds. No payload.

```dart
socket.emit('clear_session');
```

### 3.5 `message_favorite` — Toggle Favorite on a Message

```jsonc
{
  "message": { "id": "<message-uuid>", ... }
}
```

The server toggles the `favorite` flag in message metadata and emits `set_favorites` back.

### 3.6 `fetch_favorites` — Fetch All Favorites

No payload. Server responds with `set_favorites`.

```dart
socket.emit('fetch_favorites');
```

### 3.7 `chat_settings_change` — Update Chat Settings

```jsonc
// Payload: Dict<String, Any>
{
  "key1": "value1",
  "key2": true
}
```

### 3.8 `window_message` — Send Custom Data to the Server

Arbitrary JSON passed directly to the `on_window_message` callback.

```dart
socket.emit('window_message', {'type': 'custom_event', 'data': {}});
```

### 3.9 Audio Events

| Event         | Direction       | Payload | Description |
|---------------|-----------------|---------|-------------|
| `audio_start` | Client → Server | none    | Begin an audio session. Server responds with `audio_connection` |
| `audio_chunk` | Client → Server | `InputAudioChunkPayload` (see below) | One chunk of recorded audio |
| `audio_end`   | Client → Server | none    | Signal end of audio input. Triggers `on_audio_end` |

**`InputAudioChunkPayload`:**

```jsonc
{
  "isStart": false,          // true on the very first chunk
  "mimeType": "audio/webm",  // MIME type of the audio stream
  "elapsedTime": 1.23,       // seconds since recording started
  "data": "<binary bytes>"   // raw audio bytes
}
```

---

## 4. Events: Server → Client

Listen for these events on the Flutter side to update the UI.

### 4.1 Task Lifecycle

| Event        | Payload | Meaning |
|--------------|---------|---------|
| `task_start` | `{}`    | AI is processing — show a loading indicator |
| `task_end`   | `{}`    | AI is done — hide loading indicator |

```dart
socket.on('task_start', (_) => setState(() => isLoading = true));
socket.on('task_end',   (_) => setState(() => isLoading = false));
```

### 4.2 Messages / Steps

| Event            | Payload    | Meaning |
|------------------|------------|---------|
| `new_message`    | `StepDict` | A new message/step from the assistant |
| `update_message` | `StepDict` | Update an existing message in place |
| `delete_message` | `StepDict` | Remove a message |
| `stream_start`   | `StepDict` | Streaming response begins — initialise a message bubble |
| `stream_token`   | `StreamTokenPayload` | Append a token to the streaming bubble |

**`StreamTokenPayload`:**
```jsonc
{
  "id": "<step-id>",       // identifies which message to append to
  "token": "Hello",        // the text fragment
  "isSequence": false,     // if true, replace the full content instead of appending
  "isInput": false         // true when echoing user input
}
```

**Minimal `StepDict` fields relevant to Flutter:**
```jsonc
{
  "id": "<uuid>",
  "threadId": "<uuid>",
  "parentId": "<uuid or null>",
  "type": "assistant_message",  // "user_message" | "assistant_message" | "tool" | "run" | ...
  "name": "Assistant",
  "output": "The answer is 42.",
  "createdAt": "2026-02-27T10:00:05Z",
  "metadata": {}
}
```

```dart
socket.on('new_message', (data) {
  final step = Map<String, dynamic>.from(data);
  addMessageToChat(step);
});

socket.on('stream_start', (data) {
  final step = Map<String, dynamic>.from(data);
  addStreamingBubble(step['id']);
});

socket.on('stream_token', (data) {
  final d = Map<String, dynamic>.from(data);
  appendToken(d['id'] as String, d['token'] as String, d['isSequence'] as bool);
});

socket.on('update_message', (data) => updateMessage(Map<String, dynamic>.from(data)));
socket.on('delete_message', (data) => removeMessage(Map<String, dynamic>.from(data)));
```

### 4.3 Thread / Session Events

| Event                | Payload             | Meaning |
|----------------------|---------------------|---------|
| `first_interaction`  | `FirstInteractionPayload` | Thread was created / first message sent |
| `resume_thread`      | `ThreadDict`        | Full thread history on session resume |
| `resume_thread_error`| `string`            | Resume failed (e.g. thread not found) |

**`FirstInteractionPayload`:**
```jsonc
{
  "interaction": "message",   // or "resume" | "audio"
  "thread_id": "<uuid>"
}
```

**`ThreadDict`** contains the full thread including all historical steps — use it to populate the chat history on resume.

```dart
socket.on('first_interaction', (data) {
  currentThreadId = data['thread_id'];
});

socket.on('resume_thread', (data) {
  final thread = Map<String, dynamic>.from(data);
  final steps = List<Map>.from(thread['steps'] ?? []);
  populateChatHistory(steps);
});

socket.on('resume_thread_error', (error) {
  showError('Could not resume thread: $error');
});
```

### 4.4 Interactive Prompts (`ask`)

The server may pause and wait for a structured response using `ask`. This is a **bidirectional `emit_call`** — the client must reply with a matching event.

```
Server ----( ask )----> Client
Client ---- response --> Server (via socket.io ack)
```

The `ask` payload:
```jsonc
{
  "msg": { /* StepDict — the question/prompt */ },
  "spec": {
    "type": "text",      // "text" | "file" | "action" | "element"
    "timeout": 60,       // seconds before ask_timeout
    "step_id": "<uuid>"
  }
}
```

Respond by calling the ack callback (the third argument in socket.io):

```dart
socket.on('ask', (data) {
  // data[0] = payload, data[1] = ack function
  final payload = data[0];
  final ack = data[1];

  if (payload['spec']['type'] == 'text') {
    showReplyPrompt(payload['msg'], onSubmit: (replyText) {
      ack({
        'id': Uuid().v4(),
        'output': replyText,
        'type': 'user_message',
        ...
      });
    });
  }
});

socket.on('ask_timeout', (_) => dismissReplyPrompt());
socket.on('clear_ask',   (_) => dismissReplyPrompt());
```

### 4.5 Client Functions (`call_fn`)

The server can invoke a named function on the client and await the result.

```jsonc
// call_fn payload
{
  "name": "my_function",
  "args": { "key": "value" }
}
```

Respond via the ack callback:

```dart
socket.on('call_fn', (data) {
  final payload = data[0];
  final ack = data[1];
  final result = handleClientFunction(payload['name'], payload['args']);
  ack(result);  // { "result": ... } or any JSON
});

socket.on('call_fn_timeout',  (_) => {});
socket.on('clear_call_fn',    (_) => {});
```

### 4.6 Elements (Files, Images)

```dart
socket.on('element', (data) {
  final element = Map<String, dynamic>.from(data);
  // element['type']  → "image" | "file" | "video" | "audio" | "text" | "pdf" | ...
  // element['url']   → download URL
  // element['name']  → display name
  // element['forId'] → parent message id
  attachElementToMessage(element['forId'], element);
});
```

### 4.7 Audio (Server → Client)

| Event             | Payload               | Meaning |
|-------------------|-----------------------|---------|
| `audio_connection`| `"on"` \| `"off"`     | Whether server accepted the audio session |
| `audio_chunk`     | `OutputAudioChunk`    | Audio data from the assistant to play |
| `audio_interrupt` | `{}`                  | Stop playback immediately |

**`OutputAudioChunk`:**
```jsonc
{
  "track": "default",
  "mimeType": "audio/mpeg",
  "data": "<binary bytes>"
}
```

### 4.8 UI Helpers

| Event          | Payload                        | Action |
|----------------|--------------------------------|--------|
| `toast`        | `{ "message": str, "type": "info"\|"success"\|"warning"\|"error" }` | Show a snackbar/toast |
| `set_commands` | `List<CommandDict>`            | Update available slash-commands |
| `set_modes`    | `List<ModeDict>`               | Update available chat modes |
| `set_favorites`| `List<StepDict>`               | Update favorites list |
| `token_usage`  | `int`                          | Token count consumed |
| `window_message`| arbitrary JSON                | Custom data from `cl.send_window_message()` |

---

## 5. Complete Flutter Event Registration Example

```dart
void _registerSocketEvents(IO.Socket socket) {
  // lifecycle
  socket.on('task_start',  (_) => setLoading(true));
  socket.on('task_end',    (_) => setLoading(false));

  // thread
  socket.on('first_interaction', (d) => onFirstInteraction(d));
  socket.on('resume_thread',     (d) => onResumeThread(d));
  socket.on('resume_thread_error', (e) => onResumeError(e));

  // messages
  socket.on('new_message',    (d) => onNewMessage(d));
  socket.on('update_message', (d) => onUpdateMessage(d));
  socket.on('delete_message', (d) => onDeleteMessage(d));
  socket.on('stream_start',   (d) => onStreamStart(d));
  socket.on('stream_token',   (d) => onStreamToken(d));

  // elements
  socket.on('element', (d) => onElement(d));

  // interactive
  socket.on('ask',            (d) => onAsk(d));
  socket.on('ask_timeout',    (_) => onAskTimeout());
  socket.on('clear_ask',      (_) => dismissAsk());
  socket.on('call_fn',        (d) => onCallFn(d));
  socket.on('call_fn_timeout',(_) => {});
  socket.on('clear_call_fn',  (_) => {});

  // audio
  socket.on('audio_connection', (s) => onAudioConnection(s));
  socket.on('audio_chunk',      (d) => onAudioChunk(d));
  socket.on('audio_interrupt',  (_) => stopAudioPlayback());

  // ui helpers
  socket.on('toast',         (d) => showToast(d['message'], d['type']));
  socket.on('set_commands',  (d) => updateCommands(d));
  socket.on('set_modes',     (d) => updateModes(d));
  socket.on('set_favorites', (d) => updateFavorites(d));
  socket.on('token_usage',   (n) => updateTokenCount(n));
  socket.on('window_message',(d) => onWindowMessage(d));

  // error / disconnect
  socket.onConnectError((e) => onConnectError(e));
  socket.onDisconnect((_) => onDisconnect());
}
```

---

## 6. Reconnection & Session Restore

- Store `sessionId` (UUID v4) persistently (e.g. `SharedPreferences`).
- On reconnect, pass the **same `sessionId`** in the auth object.
- The server calls `restore_existing_session()`. If found, it re-attaches the socket to the live session seamlessly. No `on_chat_start` is re-triggered.
- If the session has expired, a new session is created and `on_chat_start` fires.

---

## 7. Event Summary Table

### Client → Server

| Event                  | Payload                  |
|------------------------|--------------------------|
| `connection_successful`| _(none)_                 |
| `client_message`       | `MessagePayload`         |
| `edit_message`         | `MessagePayload`         |
| `stop`                 | _(none)_                 |
| `clear_session`        | _(none)_                 |
| `message_favorite`     | `MessagePayload`         |
| `fetch_favorites`      | _(none)_                 |
| `chat_settings_change` | `Dict<String, Any>`      |
| `window_message`       | `Any`                    |
| `audio_start`          | _(none)_                 |
| `audio_chunk`          | `InputAudioChunkPayload` |
| `audio_end`            | _(none)_                 |

### Server → Client

| Event                | Payload                  |
|----------------------|--------------------------|
| `task_start`         | `{}`                     |
| `task_end`           | `{}`                     |
| `new_message`        | `StepDict`               |
| `update_message`     | `StepDict`               |
| `delete_message`     | `StepDict`               |
| `stream_start`       | `StepDict`               |
| `stream_token`       | `{id, token, isSequence, isInput}` |
| `first_interaction`  | `{interaction, thread_id}` |
| `resume_thread`      | `ThreadDict`             |
| `resume_thread_error`| `string`                 |
| `element`            | `ElementDict`            |
| `ask`                | `{msg: StepDict, spec: AskSpec}` |
| `ask_timeout`        | `{}`                     |
| `clear_ask`          | `{}`                     |
| `call_fn`            | `{name, args}`           |
| `call_fn_timeout`    | `{}`                     |
| `clear_call_fn`      | `{}`                     |
| `audio_connection`   | `"on"` \| `"off"`        |
| `audio_chunk`        | `OutputAudioChunk`       |
| `audio_interrupt`    | `{}`                     |
| `toast`              | `{message, type}`        |
| `set_commands`       | `List<CommandDict>`      |
| `set_modes`          | `List<ModeDict>`         |
| `set_favorites`      | `List<StepDict>`         |
| `token_usage`        | `int`                    |
| `window_message`     | `Any`                    |
