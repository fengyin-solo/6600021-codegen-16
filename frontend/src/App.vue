<template>
  <div class="min-h-screen p-4 flex flex-col gap-4 max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold text-purple-400">盲文翻译与触觉学习器</h1>

    <div class="flex gap-2">
      <button v-for="t in tabs" :key="t.id" @click="activeTab = t.id"
        class="px-4 py-2 rounded text-sm"
        :class="activeTab === t.id ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'">
        {{ t.label }}
      </button>
    </div>

    <!-- Translate -->
    <div v-if="activeTab === 'translate'" class="grid grid-cols-2 gap-4">
      <div class="bg-gray-900 rounded-xl p-4">
        <h3 class="text-purple-300 font-bold mb-2">文本输入</h3>
        <textarea v-model="store.inputText" @input="store.translate()"
          class="w-full h-32 bg-gray-800 rounded p-3 text-white resize-none" placeholder="输入英文文本..." />
      </div>
      <div class="bg-gray-900 rounded-xl p-4">
        <h3 class="text-purple-300 font-bold mb-2">盲文输出</h3>
        <div class="text-4xl tracking-wider text-purple-300 h-16">{{ store.brailleUnicode }}</div>
        <div class="flex flex-wrap gap-2 mt-3">
          <BrailleCell v-for="(dots, i) in store.brailleOutput" :key="i" :dots="dots" :size="40" />
        </div>
      </div>
    </div>

    <!-- Learn -->
    <div v-if="activeTab === 'learn'" class="grid grid-cols-2 gap-4">
      <div class="bg-gray-900 rounded-xl p-4 flex flex-col items-center gap-4">
        <h3 class="text-purple-300 font-bold">猜盲文</h3>
        <div v-if="!store.quizChar">
          <button @click="store.generateQuiz()" class="bg-purple-500 px-6 py-3 rounded-lg text-lg hover:bg-purple-400">
            开始训练
          </button>
        </div>
        <div v-else class="flex flex-col items-center gap-3">
          <div class="text-7xl font-bold text-purple-400">{{ store.quizChar }}</div>
          <div class="text-sm text-gray-400">
            {{ store.guideActive ? '按引导顺序点击点位' : '点击下方 6 点阵选择对应盲文' }}
          </div>
          <div class="grid grid-cols-2 gap-2 p-4 bg-gray-800 rounded-xl">
            <button v-for="d in 6" :key="d" @click="store.toggleDot(d)"
              class="w-14 h-14 rounded-full border-2 transition-all relative"
              :class="getDotClass(d)">
              <span class="text-xs">{{ d }}</span>
              <span v-if="store.guideActive && store.guideCurrentDot === d"
                class="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[8px] font-bold text-white animate-bounce">
                {{ store.guideCompletedSteps + 1 }}
              </span>
            </button>
          </div>
          <div v-if="store.guideWrongDot !== null" class="text-red-400 text-sm font-medium animate-shake">
            顺序不对！请先点击点位 {{ store.guideCurrentDot }}
          </div>
          <div v-if="store.guideAllComplete" class="text-green-400 text-sm font-medium">
            所有点位已正确，请确认！
          </div>
          <button @click="store.checkQuizAnswer()" class="bg-purple-500 px-6 py-2 rounded hover:bg-purple-400">确认</button>
        </div>
      </div>
      <div class="flex flex-col gap-4">
        <GestureGuide
          :correct-dots="store.correctDots"
          :selected-dots="store.selectedDots"
          :guide-active="store.guideActive"
          @toggle-guide="store.toggleGuide()" />
        <div class="bg-gray-900 rounded-xl p-4">
          <div class="flex justify-between mb-2">
            <h3 class="text-purple-300 font-bold">统计</h3>
            <button @click="store.resetScore()" class="text-red-400 text-xs hover:underline">重置</button>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center mb-3">
            <div class="bg-gray-800 rounded p-2">
              <div class="text-2xl font-bold text-green-400">{{ store.score.correct }}</div>
              <div class="text-xs text-gray-400">正确</div>
            </div>
            <div class="bg-gray-800 rounded p-2">
              <div class="text-2xl font-bold text-red-400">{{ store.score.total - store.score.correct }}</div>
              <div class="text-xs text-gray-400">错误</div>
            </div>
            <div class="bg-gray-800 rounded p-2">
              <div class="text-2xl font-bold text-purple-400">{{ store.score.total ? Math.round(store.score.correct / store.score.total * 100) : 0 }}%</div>
              <div class="text-xs text-gray-400">正确率</div>
            </div>
          </div>
          <div class="space-y-1 max-h-48 overflow-y-auto">
            <div v-for="(h, i) in store.history.slice(0, 20)" :key="i"
              class="flex justify-between bg-gray-800 rounded p-2 text-sm"
              :class="h.correct ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'">
              <span>{{ h.input }}</span><span>{{ h.correct ? '✓' : '✗' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reference -->
    <div v-if="activeTab === 'ref'" class="bg-gray-900 rounded-xl p-4">
      <h3 class="text-purple-300 font-bold mb-3">盲文速查表</h3>
      <div class="grid grid-cols-6 md:grid-cols-9 gap-3">
        <div v-for="(dots, char) in brailleMap" :key="char" class="flex flex-col items-center">
          <div class="text-xl font-bold text-purple-400">{{ char }}</div>
          <BrailleCell :dots="dots" :size="30" />
          <div class="text-xs text-gray-500">{{ dots.join(',') }}</div>
        </div>
      </div>
    </div>

    <button @click="doExport" class="bg-green-700 px-4 py-2 rounded self-start hover:bg-green-600 text-sm">
      导出翻译文本
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBrailleStore } from './store/braille'
import { BRAILLE_MAP } from './utils/braille'
import BrailleCell from './components/BrailleCell.vue'
import GestureGuide from './components/GestureGuide.vue'

const store = useBrailleStore()
const brailleMap = BRAILLE_MAP
const tabs = [
  { id: 'translate', label: '翻译模式' },
  { id: 'learn', label: '训练模式' },
  { id: 'ref', label: '速查表' },
]
const activeTab = ref('translate')

function getDotClass(d: number): string {
  const isSelected = store.selectedDots.includes(d)
  const isWrong = store.guideWrongDot === d
  const isCurrentGuide = store.guideActive && store.guideCurrentDot === d

  if (isWrong) {
    return 'bg-red-500 border-red-400 scale-110 animate-shake'
  }
  if (isSelected) {
    return 'bg-purple-500 border-purple-400 scale-110'
  }
  if (isCurrentGuide) {
    return 'bg-gray-700 border-amber-400 hover:border-amber-300 ring-2 ring-amber-400/50'
  }
  return 'bg-gray-700 border-gray-600 hover:border-purple-400'
}

function doExport() {
  const text = store.exportPDF()
  const blob = new Blob([text], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'braille-output.txt'
  a.click()
}
</script>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
.animate-shake {
  animation: shake 0.3s ease-in-out;
}
</style>
