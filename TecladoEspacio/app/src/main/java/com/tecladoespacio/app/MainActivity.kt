package com.tecladoespacio.app

import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.provider.Settings
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

class MainActivity : Activity() {
    private fun dp(v: Int) = (v * resources.displayMetrics.density).toInt()
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(24), dp(40), dp(24), dp(24))
            setBackgroundColor(Color.rgb(245,245,250))
        }
        fun label(value: String, size: Float, bold: Boolean = false) = TextView(this).apply {
            text = value; textSize = size; setTextColor(Color.rgb(25,25,30))
            if (bold) setTypeface(typeface, 1)
            setPadding(0, dp(6), 0, dp(12))
        }
        root.addView(label("Teclado Espacio", 30f, true))
        root.addView(label("Teclado en español con barra espaciadora y Enter grandes.", 16f))
        val enable = Button(this).apply { text = "1. Activar Teclado Espacio"; minHeight = dp(56) }
        enable.setOnClickListener { startActivity(Intent(Settings.ACTION_INPUT_METHOD_SETTINGS)) }
        root.addView(enable)
        val choose = Button(this).apply { text = "2. Elegir como teclado actual"; minHeight = dp(56) }
        choose.setOnClickListener { (getSystemService(INPUT_METHOD_SERVICE) as InputMethodManager).showInputMethodPicker() }
        root.addView(choose)
        root.addView(label("Después de instalar: activa el teclado en Ajustes y luego selecciónalo. La app no solicita permiso de Internet.", 15f))
        setContentView(root)
    }
}
