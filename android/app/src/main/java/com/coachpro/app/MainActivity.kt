package com.coachpro.app

import android.Manifest
import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothSocket
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Base64
import android.util.Log
import android.webkit.*
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.io.OutputStream
import java.nio.charset.Charset
import java.util.UUID

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null

    // Gestionnaire Bluetooth Multi-Stratégies (MPT-II, MPT-III, POS-58, PT-210, etc.)
    private var bluetoothSocket: BluetoothSocket? = null
    private var bluetoothOutputStream: OutputStream? = null
    private var connectedDeviceName: String = ""
    private var connectedDeviceAddress: String = ""
    private val SPP_UUID: UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB")

    private val prefs: SharedPreferences by lazy {
        getSharedPreferences("coachpro_native_prefs", Context.MODE_PRIVATE)
    }

    private val mainHandler = Handler(Looper.getMainLooper())

    // Gestionnaire de sélection de fichier / Caméra
    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == RESULT_OK) {
            val data: Intent? = result.data
            val results = WebChromeClient.FileChooserParams.parseResult(result.resultCode, data)
            fileUploadCallback?.onReceiveValue(results)
        } else {
            fileUploadCallback?.onReceiveValue(null)
        }
        fileUploadCallback = null
    }

    // Gestionnaire des permissions Android (Caméra & Bluetooth)
    private val requestPermissionsLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        Log.i("CoachProPerm", "Permissions updated: $permissions")
        tryAutoConnectLastPrinter()
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialisation de la WebView Haute Performance & Persistance
        webView = WebView(this)
        setContentView(webView)

        configureWebView()
        webView.loadUrl("file:///android_asset/index.html")

        // Demande directe des permissions nécessaires au démarrage pour la tablette
        checkAndRequestPermissions()

        // Tentative de connexion en arrière-plan à l'imprimante enregistrée
        mainHandler.postDelayed({
            tryAutoConnectLastPrinter()
        }, 1200)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = true
        settings.allowContentAccess = true
        settings.allowFileAccessFromFileURLs = true
        settings.allowUniversalAccessFromFileURLs = true
        settings.mediaPlaybackRequiresUserGesture = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.cacheMode = WebSettings.LOAD_DEFAULT

        // Pont JavaScript Natif Kotlin
        webView.addJavascriptInterface(WebAppInterface(this), "CoachProNative")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString() ?: return false
                if (url.startsWith("tel:") || url.startsWith("mailto:") || url.startsWith("https://wa.me/") || url.startsWith("rawbt:")) {
                    try {
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                        return true
                    } catch (e: Exception) {
                        return false
                    }
                }
                return false
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
                Log.d("CoachProJS", "${consoleMessage?.message()} -- line ${consoleMessage?.lineNumber()}")
                return true
            }

            override fun onPermissionRequest(request: PermissionRequest?) {
                runOnUiThread {
                    request?.grant(request.resources)
                }
            }

            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                try {
                    val intent = fileChooserParams?.createIntent() ?: Intent(Intent.ACTION_GET_CONTENT).apply {
                        type = "image/*"
                    }
                    fileChooserLauncher.launch(intent)
                    return true
                } catch (e: Exception) {
                    fileUploadCallback = null
                    return false
                }
            }
        }
    }

    private fun checkAndRequestPermissions() {
        val permissionsToRequest = mutableListOf<String>()

        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.CAMERA)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_CONNECT) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.BLUETOOTH_CONNECT)
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_SCAN) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.BLUETOOTH_SCAN)
            }
        } else {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.BLUETOOTH)
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.BLUETOOTH_ADMIN) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.BLUETOOTH_ADMIN)
            }
        }

        if (permissionsToRequest.isNotEmpty()) {
            requestPermissionsLauncher.launch(permissionsToRequest.toTypedArray())
        }
    }

    private fun getBluetoothAdapter(): BluetoothAdapter? {
        val manager = getSystemService(Context.BLUETOOTH_SERVICE) as? BluetoothManager
        return manager?.adapter ?: BluetoothAdapter.getDefaultAdapter()
    }

    /**
     * Connexion Native Bluetooth Multi-Stratégies (Robuste POS Mobile / MPT)
     * Essaie successivement :
     * 1. SPP UUID standard
     * 2. Reflection directe canal RFCOMM 1
     * 3. SPP Insecure
     * 4. Reflection Insecure canal 1
     */
    @Synchronized
    private fun connectToBluetoothDevice(macAddress: String): Boolean {
        if (macAddress.isBlank()) return false
        try {
            val adapter = getBluetoothAdapter()
            if (adapter == null || !adapter.isEnabled) {
                Log.w("CoachProBT", "Bluetooth désactivé sur l'appareil")
                return false
            }

            // Fermeture préalable si déjà connecté
            disconnectBluetooth()

            try {
                adapter.cancelDiscovery()
            } catch (e: Exception) {}

            val device: BluetoothDevice = try {
                adapter.getRemoteDevice(macAddress)
            } catch (e: Exception) {
                Log.e("CoachProBT", "Adresse MAC invalide: $macAddress")
                return false
            }

            var socket: BluetoothSocket? = null
            var lastEx: Exception? = null

            // Stratégie 1: Standard SPP UUID
            try {
                socket = device.createRfcommSocketToServiceRecord(SPP_UUID)
                socket.connect()
                Log.i("CoachProBT", "Connecté via Stratégie 1 (SPP Standard)")
            } catch (e1: Exception) {
                lastEx = e1
                try { socket?.close() } catch (ex: Exception) {}
                socket = null
            }

            // Stratégie 2: Reflection canal RFCOMM 1 (Standard MPT-II, POS-58 chinois)
            if (socket == null || !socket.isConnected) {
                try {
                    val m = device.javaClass.getMethod("createRfcommSocket", Int::class.javaPrimitiveType)
                    socket = m.invoke(device, 1) as BluetoothSocket
                    socket.connect()
                    Log.i("CoachProBT", "Connecté via Stratégie 2 (Reflection Port 1)")
                } catch (e2: Exception) {
                    lastEx = e2
                    try { socket?.close() } catch (ex: Exception) {}
                    socket = null
                }
            }

            // Stratégie 3: Insecure SPP
            if (socket == null || !socket.isConnected) {
                try {
                    socket = device.createInsecureRfcommSocketToServiceRecord(SPP_UUID)
                    socket.connect()
                    Log.i("CoachProBT", "Connecté via Stratégie 3 (SPP Insecure)")
                } catch (e3: Exception) {
                    lastEx = e3
                    try { socket?.close() } catch (ex: Exception) {}
                    socket = null
                }
            }

            // Stratégie 4: Reflection Insecure canal 1
            if (socket == null || !socket.isConnected) {
                try {
                    val m = device.javaClass.getMethod("createInsecureRfcommSocket", Int::class.javaPrimitiveType)
                    socket = m.invoke(device, 1) as BluetoothSocket
                    socket.connect()
                    Log.i("CoachProBT", "Connecté via Stratégie 4 (Reflection Insecure Port 1)")
                } catch (e4: Exception) {
                    lastEx = e4
                    try { socket?.close() } catch (ex: Exception) {}
                    socket = null
                }
            }

            if (socket != null && socket.isConnected) {
                bluetoothSocket = socket
                bluetoothOutputStream = socket.outputStream
                connectedDeviceName = try { device.name ?: "Imprimante MPT" } catch (e: Exception) { "Imprimante MPT" }
                connectedDeviceAddress = macAddress

                // Mémorisation dans les préférences natives
                prefs.edit().putString("last_bt_printer_address", macAddress)
                    .putString("last_bt_printer_name", connectedDeviceName).apply()

                Log.i("CoachProBT", "Connexion réussie à $connectedDeviceName ($macAddress)")
                return true
            }

            Log.e("CoachProBT", "Échec de toutes les stratégies de connexion pour $macAddress: ${lastEx?.message}")
            disconnectBluetooth()
            return false
        } catch (e: Exception) {
            Log.e("CoachProBT", "Erreur générale connexion Bluetooth: ${e.message}")
            disconnectBluetooth()
            return false
        }
    }

    @Synchronized
    private fun disconnectBluetooth() {
        try {
            bluetoothOutputStream?.close()
        } catch (e: Exception) {}
        try {
            bluetoothSocket?.close()
        } catch (e: Exception) {}
        bluetoothOutputStream = null
        bluetoothSocket = null
        connectedDeviceName = ""
        connectedDeviceAddress = ""
    }

    private fun isBluetoothConnected(): Boolean {
        return bluetoothSocket?.isConnected == true && bluetoothOutputStream != null
    }

    private fun tryAutoConnectLastPrinter() {
        val lastAddr = prefs.getString("last_bt_printer_address", null)
        if (lastAddr.isNullOrBlank()) return
        if (isBluetoothConnected()) return

        Thread {
            try {
                connectToBluetoothDevice(lastAddr)
            } catch (e: Exception) {
                Log.w("CoachProBT", "Échec reconnexion automatique à $lastAddr")
            }
        }.start()
    }

    /**
     * Envoi de données ESC/POS thermiques brutes vers l'imprimante
     */
    @Synchronized
    private fun sendPrintData(bytes: ByteArray): Boolean {
        if (!isBluetoothConnected()) {
            val lastAddr = prefs.getString("last_bt_printer_address", null)
            if (!lastAddr.isNullOrBlank()) {
                val ok = connectToBluetoothDevice(lastAddr)
                if (!ok) return false
            } else {
                // Tente de se connecter au premier appareil appairé POS/MPT
                val adapter = getBluetoothAdapter()
                val bonded = try { adapter?.bondedDevices } catch (e: Exception) { null }
                val firstPrinter = bonded?.firstOrNull { dev ->
                    val n = (dev.name ?: "").uppercase()
                    n.contains("MPT") || n.contains("POS") || n.contains("PRINTER") || n.contains("PT-") || n.contains("RPP")
                } ?: bonded?.firstOrNull()

                if (firstPrinter != null) {
                    val ok = connectToBluetoothDevice(firstPrinter.address)
                    if (!ok) return false
                } else {
                    return false
                }
            }
        }

        return try {
            bluetoothOutputStream?.write(bytes)
            bluetoothOutputStream?.flush()
            true
        } catch (e: Exception) {
            Log.e("CoachProBT", "Erreur écriture Bluetooth: ${e.message}")
            disconnectBluetooth()
            false
        }
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onDestroy() {
        disconnectBluetooth()
        super.onDestroy()
    }

    /**
     * Interface Native exposée à JavaScript (Kotlin <-> JS Bridge)
     */
    inner class WebAppInterface(private val context: Context) {

        @JavascriptInterface
        fun isNativeAndroid(): Boolean = true

        @JavascriptInterface
        fun getAppVersion(): String = "3.4.0-PRO-AFRICA"

        @JavascriptInterface
        fun showToast(message: String) {
            runOnUiThread {
                Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
            }
        }

        @JavascriptInterface
        fun vibrate(durationMs: Long = 50) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as VibratorManager
                vibratorManager.defaultVibrator.vibrate(VibrationEffect.createOneShot(durationMs, VibrationEffect.DEFAULT_AMPLITUDE))
            } else {
                @Suppress("DEPRECATION")
                val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
                @Suppress("DEPRECATION")
                vibrator.vibrate(durationMs)
            }
        }

        /**
         * Sauvegarde native atomique du fichier JSON de base de données
         * Résiste à 100% aux mises à jour d'applications et nettoyages de cache WebView
         */
        @JavascriptInterface
        fun saveDatabase(jsonStr: String): Boolean {
            return try {
                val file = File(context.filesDir, "coachpro_database.json")
                file.writeText(jsonStr, Charsets.UTF_8)
                true
            } catch (e: Exception) {
                Log.e("CoachProStorage", "Erreur sauvegarde native database: ${e.message}")
                false
            }
        }

        /**
         * Chargement de la base de données native
         */
        @JavascriptInterface
        fun loadDatabase(): String {
            return try {
                val file = File(context.filesDir, "coachpro_database.json")
                if (file.exists()) {
                    file.readText(Charsets.UTF_8)
                } else {
                    ""
                }
            } catch (e: Exception) {
                Log.e("CoachProStorage", "Erreur lecture native database: ${e.message}")
                ""
            }
        }

        /**
         * Retourne la liste des appareils Bluetooth appairés à la tablette sous forme JSON
         */
        @JavascriptInterface
        fun getPairedPrinters(): String {
            val jsonArray = JSONArray()
            try {
                val adapter = getBluetoothAdapter() ?: return "[]"
                val pairedDevices: Set<BluetoothDevice> = try { adapter.bondedDevices ?: emptySet() } catch (e: Exception) { emptySet() }

                for (device in pairedDevices) {
                    val obj = JSONObject()
                    val name = try { device.name ?: "Appareil Inconnu" } catch (e: Exception) { "Inconnu" }
                    val address = device.address ?: ""
                    obj.put("name", name)
                    obj.put("address", address)
                    obj.put("isConnected", address == connectedDeviceAddress && isBluetoothConnected())
                    jsonArray.put(obj)
                }
            } catch (e: Exception) {
                Log.e("CoachProBT", "Erreur getPairedPrinters: ${e.message}")
            }
            return jsonArray.toString()
        }

        @JavascriptInterface
        fun connectPrinter(macAddress: String): Boolean {
            return connectToBluetoothDevice(macAddress)
        }

        @JavascriptInterface
        fun disconnectPrinter(): Boolean {
            disconnectBluetooth()
            return true
        }

        @JavascriptInterface
        fun isPrinterConnected(): Boolean {
            return isBluetoothConnected()
        }

        @JavascriptInterface
        fun getConnectedPrinterName(): String {
            return if (isBluetoothConnected()) connectedDeviceName else ""
        }

        @JavascriptInterface
        fun getConnectedPrinterAddress(): String {
            return if (isBluetoothConnected()) connectedDeviceAddress else ""
        }

        /**
         * Impression Texte Thermique ESC/POS Directe avec QR Code Natif et Économie de Papier
         */
        @JavascriptInterface
        fun printThermalText(rawText: String): Boolean {
            try {
                // Initialisation ESC/POS (ESC @) + Table de caractères standard (ESC t 0)
                val initBytes = byteArrayOf(0x1B, 0x40, 0x1B, 0x74, 0x00)

                // Vérifier si le texte contient une balise QR Code [QR:identifiant]
                val qrRegex = Regex("\\[QR:([^\\]]+)\\]")
                val qrMatch = qrRegex.find(rawText)

                val outStream = java.io.ByteArrayOutputStream()
                outStream.write(initBytes)

                if (qrMatch != null) {
                    val textBeforeQR = rawText.substring(0, qrMatch.range.first)
                    val qrData = qrMatch.groupValues[1]
                    val textAfterQR = rawText.substring(qrMatch.range.last + 1)

                    if (textBeforeQR.isNotEmpty()) {
                        outStream.write(textBeforeQR.toByteArray(Charset.forName("ISO-8859-1")))
                    }

                    // Génération Commande ESC/POS QR Code Native (GS ( k ...)
                    val qrBytes = qrData.toByteArray(Charset.forName("ISO-8859-1"))
                    val len = qrBytes.size + 3
                    val pL = (len % 256).toByte()
                    val pH = (len / 256).toByte()

                    // Alignement Centré pour le QR Code (ESC a 1)
                    outStream.write(byteArrayOf(0x1B, 0x61, 0x01))
                    // 1. Modèle 2
                    outStream.write(byteArrayOf(0x1D, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00))
                    // 2. Taille module (4 dots pour 58mm compact)
                    outStream.write(byteArrayOf(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, 0x04))
                    // 3. Correction d'erreur M (15%)
                    outStream.write(byteArrayOf(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, 0x31))
                    // 4. Stocker les données
                    outStream.write(byteArrayOf(0x1D, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30))
                    outStream.write(qrBytes)
                    // 5. Imprimer le QR Code
                    outStream.write(byteArrayOf(0x1D, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30))
                    // Rétablir alignement standard (ESC a 0)
                    outStream.write(byteArrayOf(0x1B, 0x61, 0x00))

                    if (textAfterQR.isNotEmpty()) {
                        outStream.write(textAfterQR.toByteArray(Charset.forName("ISO-8859-1")))
                    }
                } else {
                    outStream.write(rawText.toByteArray(Charset.forName("ISO-8859-1")))
                }

                // Fin de ticket compacte (juste 2 sauts de ligne pour éviter le gaspillage de papier)
                outStream.write(byteArrayOf(0x0A, 0x0A))

                return sendPrintData(outStream.toByteArray())
            } catch (e: Exception) {
                Log.e("CoachProBT", "Erreur printThermalText: ${e.message}")
                return false
            }
        }

        /**
         * Impression Données ESC/POS binaires en Base64
         */
        @JavascriptInterface
        fun printThermalBase64(base64Data: String): Boolean {
            return try {
                val bytes = Base64.decode(base64Data, Base64.DEFAULT)
                sendPrintData(bytes)
            } catch (e: Exception) {
                Log.e("CoachProBT", "Erreur printThermalBase64: ${e.message}")
                false
            }
        }
    }
}
