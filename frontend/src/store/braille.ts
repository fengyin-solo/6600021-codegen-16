import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { BRAILLE_MAP, textToBraille, brailleToText, dotsToUnicode } from '../utils/braille'
import type { LearnMode } from '../types'

export const useBrailleStore = defineStore('braille', () => {
  const inputText = ref('')
  const brailleOutput = ref<number[][]>([])
  const learnMode = ref<LearnMode>('charToBraille')
  const quizChar = ref('')
  const selectedDots = ref<number[]>([])
  const score = ref({ correct: 0, total: 0 })
  const history = ref<{ input: string; correct: boolean }[]>([])
  const guideActive = ref(true)
  const guideWrongDot = ref<number | null>(null)

  const correctDots = computed(() => BRAILLE_MAP[quizChar.value] || [])

  const guideCompletedSteps = computed(() => {
    const dots = correctDots.value
    let count = 0
    for (let i = 0; i < dots.length; i++) {
      if (selectedDots.value.includes(dots[i])) {
        count++
      } else {
        break
      }
    }
    return count
  })

  const guideCurrentDot = computed(() => {
    const dots = correctDots.value
    if (guideCompletedSteps.value < dots.length) {
      return dots[guideCompletedSteps.value]
    }
    return null
  })

  const guideAllComplete = computed(() =>
    correctDots.value.length > 0 && guideCompletedSteps.value >= correctDots.value.length
  )

  const brailleUnicode = computed(() =>
    brailleOutput.value.map(d => dotsToUnicode(d)).join('')
  )

  function translate() {
    brailleOutput.value = textToBraille(inputText.value)
  }

  function reverseTranslate() {
    return brailleToText(selectedDots.value)
  }

  function generateQuiz() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    quizChar.value = chars[Math.floor(Math.random() * chars.length)]
    selectedDots.value = []
    guideWrongDot.value = null
  }

  function toggleDot(dot: number) {
    const idx = selectedDots.value.indexOf(dot)
    if (idx >= 0) {
      selectedDots.value.splice(idx, 1)
    } else {
      if (guideActive.value && quizChar.value) {
        const expected = guideCurrentDot.value
        if (expected !== null && dot !== expected) {
          guideWrongDot.value = dot
          setTimeout(() => { guideWrongDot.value = null }, 800)
          return
        }
      }
      selectedDots.value.push(dot)
      guideWrongDot.value = null
    }
  }

  function checkQuizAnswer() {
    const correct = JSON.stringify([...selectedDots.value].sort()) === JSON.stringify([...(BRAILLE_MAP[quizChar.value] || [])].sort())
    score.value.total++
    if (correct) score.value.correct++
    history.value.unshift({ input: quizChar.value, correct })
    if (navigator.vibrate) navigator.vibrate(correct ? 100 : [100, 50, 100])
    generateQuiz()
  }

  function resetScore() {
    score.value = { correct: 0, total: 0 }
    history.value = []
  }

  function toggleGuide() {
    guideActive.value = !guideActive.value
  }

  function exportPDF(): string {
    const lines = inputText.value.toUpperCase().split('')
    let out = '盲文翻译输出\n\n'
    for (const ch of lines) {
      const dots = BRAILLE_MAP[ch] || []
      out += `${ch} → [${dots.join(',')}] ${dotsToUnicode(dots)}\n`
    }
    return out
  }

  return {
    inputText, brailleOutput, learnMode, quizChar, selectedDots, score, history,
    guideActive, guideWrongDot, correctDots, guideCompletedSteps, guideCurrentDot,
    guideAllComplete, brailleUnicode, translate, reverseTranslate, generateQuiz,
    toggleDot, checkQuizAnswer, resetScore, toggleGuide, exportPDF
  }
})
