package com.tecladoespacio.app

import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.inputmethodservice.InputMethodService
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.LinearLayout
import android.widget.TextView

class TecladoImeService : InputMethodService() {
    private lateinit var root: LinearLayout
    private var symbols = false
    private var shifted = false
    private val letters = listOf(
        listOf("q","w","e","r","t","y","u","i","o","p"),
        listOf("a","s","d","f","g","h","j","k","l","ñ"),
        listOf("z","x","c","v","b","n","m")
    )
    private val symbolRows = listOf(
        listOf("1","2","3","4","5","6","7","8","9","0"),
        listOf("@","#","$","%","&","-","+","(",")","/"),
        listOf("*","\"","'",":",";","!","?","_",".")
    )
    private fun dp(v:Int) = (v * resources.displayMetrics.density).toInt()
    private fun bg(color:Int, radius:Int=7) = GradientDrawable().apply { setColor(color); cornerRadius = dp(radius).toFloat() }

    override fun onCreateInputView(): View {
        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(4), dp(5), dp(4), dp(8))
            setBackgroundColor(Color.rgb(226,226,230))
        }
        rebuild()
        return root
    }

    private fun rebuild() {
        root.removeAllViews()
        val rows = if (symbols) symbolRows else letters
        rows.forEachIndexed { index, keys ->
            val row = row()
            if (!symbols && index == 2) row.addView(key(if (shifted) "⇧" else "↑", 1.35f) { shifted = !shifted; rebuild() })
            keys.forEach { k ->
                val shown = if (shifted && !symbols) k.uppercase() else k
                row.addView(key(shown) { commit(shown) })
            }
            if (index == 2) row.addView(key("⌫", 1.35f) { backspace() })
            root.addView(row)
        }
        val bottom = row()
        bottom.addView(key(if (symbols) "ABC" else "?123", 1.25f) { symbols = !symbols; shifted = false; rebuild() })
        bottom.addView(key(",", .8f) { commit(",") })
        bottom.addView(key("Espacio", 4.2f) { commit(" ") })
        bottom.addView(key("↵", 1.35f) { enter() })
        root.addView(bottom)
    }

    private fun row() = LinearLayout(this).apply {
        orientation = LinearLayout.HORIZONTAL
        gravity = Gravity.CENTER
        layoutParams = LinearLayout.LayoutParams(-1, dp(52))
    }

    private fun key(label:String, weight:Float=1f, action:()->Unit): TextView = TextView(this).apply {
        text = label
        gravity = Gravity.CENTER
        textSize = if (label.length > 2) 15f else 21f
        setTextColor(Color.rgb(25,25,28))
        typeface = Typeface.DEFAULT_BOLD
        background = bg(if (label in listOf("⌫","↑","⇧","↵","?123","ABC")) Color.rgb(203,204,220) else Color.WHITE)
        layoutParams = LinearLayout.LayoutParams(0, dp(46), weight).apply { setMargins(dp(2), dp(2), dp(2), dp(2)) }
        setOnClickListener { vibrate(); action() }
    }

    private fun commit(s:String) {
        currentInputConnection?.commitText(s, 1)
        if (shifted && !symbols) { shifted = false; rebuild() }
    }

    private fun backspace() {
        val ic = currentInputConnection ?: return
        val selected = ic.getSelectedText(0)
        if (!selected.isNullOrEmpty()) ic.commitText("", 1) else ic.deleteSurroundingText(1,0)
    }

    private fun enter() {
        val info = currentInputEditorInfo
        val action = info?.imeOptions?.and(EditorInfo.IME_MASK_ACTION) ?: EditorInfo.IME_ACTION_NONE
        val ic = currentInputConnection ?: return
        if (action != EditorInfo.IME_ACTION_NONE && action != EditorInfo.IME_ACTION_UNSPECIFIED) ic.performEditorAction(action)
        else {
            ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER))
            ic.sendKeyEvent(KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ENTER))
        }
    }

    private fun vibrate() {
        try {
            if (Build.VERSION.SDK_INT >= 31) {
                val vm = getSystemService(VibratorManager::class.java)
                vm.defaultVibrator.vibrate(VibrationEffect.createOneShot(12, 35))
            } else {
                @Suppress("DEPRECATION") val v = getSystemService(VIBRATOR_SERVICE) as Vibrator
                if (Build.VERSION.SDK_INT >= 26) v.vibrate(VibrationEffect.createOneShot(12,35)) else @Suppress("DEPRECATION") v.vibrate(12)
            }
        } catch (_: Exception) {}
    }
}
