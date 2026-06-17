<template>
  <div class="gesture-guide">
    <div class="guide-header">
      <span class="guide-title">手势引导</span>
      <button @click="$emit('toggleGuide')" class="guide-toggle">
        {{ guideActive ? '关闭引导' : '开启引导' }}
      </button>
    </div>

    <div v-if="guideActive && correctDots.length > 0" class="guide-content">
      <div class="guide-hint">
        <span v-if="completedSteps === correctDots.length" class="hint-done">全部完成!</span>
        <span v-else>第 {{ completedSteps + 1 }} 步：点击点位 {{ correctDots[completedSteps] }}</span>
      </div>

      <svg :width="svgSize" :height="svgSize * 1.5" :viewBox="`0 0 ${svgSize} ${svgSize * 1.5}`" class="guide-svg">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="pulse-glow">
            <feGaussianBlur stdDeviation="5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <line v-for="(dot, idx) in correctDots.slice(0, -1)" :key="'line-' + idx"
          :x1="dotPos[dot][0] * svgSize * 0.45 + svgSize * 0.2"
          :y1="dotPos[dot][1] * svgSize * 0.45 + svgSize * 0.15 + radius"
          :x2="dotPos[correctDots[idx + 1]][0] * svgSize * 0.45 + svgSize * 0.2"
          :y2="dotPos[correctDots[idx + 1]][1] * svgSize * 0.45 + svgSize * 0.15 + radius"
          :stroke="idx < completedSteps ? '#a855f7' : '#4b5563'"
          :stroke-width="idx < completedSteps ? 3 : 2"
          :stroke-dasharray="idx < completedSteps ? 'none' : '6 4'"
          stroke-linecap="round"
          :opacity="idx < completedSteps ? 0.8 : 0.4" />

        <g v-for="d in 6" :key="d">
          <circle
            :cx="dotPos[d][0] * svgSize * 0.45 + svgSize * 0.2"
            :cy="dotPos[d][1] * svgSize * 0.45 + svgSize * 0.15 + radius"
            :r="radius"
            :fill="getDotFill(d)"
            :stroke="getDotStroke(d)"
            :stroke-width="getDotStrokeWidth(d)"
            :filter="isCurrentStep(d) ? 'url(#pulse-glow)' : isCompletedDot(d) ? 'url(#glow)' : 'none'"
            :class="{ 'dot-pulse': isCurrentStep(d) }" />

          <text
            :x="dotPos[d][0] * svgSize * 0.45 + svgSize * 0.2"
            :y="dotPos[d][1] * svgSize * 0.45 + svgSize * 0.15 + radius + 4"
            text-anchor="middle"
            :fill="correctDots.includes(d) ? 'white' : '#9ca3af'"
            :font-size="radius * 0.7"
            font-weight="bold">
            {{ d }}
          </text>

          <g v-if="getStepNumber(d) > 0">
            <circle
              :cx="dotPos[d][0] * svgSize * 0.45 + svgSize * 0.2 + radius * 0.9"
              :cy="dotPos[d][1] * svgSize * 0.45 + svgSize * 0.15 + radius - radius * 0.9"
              :r="radius * 0.45"
              :fill="isCompletedDot(d) ? '#22c55e' : isCurrentStep(d) ? '#f59e0b' : '#6b7280'" />
            <text
              :x="dotPos[d][0] * svgSize * 0.45 + svgSize * 0.2 + radius * 0.9"
              :y="dotPos[d][1] * svgSize * 0.45 + svgSize * 0.15 + radius - radius * 0.9 + 3"
              text-anchor="middle"
              fill="white"
              :font-size="radius * 0.5"
              font-weight="bold">
              {{ getStepNumber(d) }}
            </text>
          </g>

          <g v-if="isCurrentStep(d)" class="finger-indicator">
            <circle
              :cx="dotPos[d][0] * svgSize * 0.45 + svgSize * 0.2"
              :cy="dotPos[d][1] * svgSize * 0.45 + svgSize * 0.15 + radius"
              :r="radius * 1.6"
              fill="none"
              stroke="#f59e0b"
              stroke-width="2"
              opacity="0.6"
              class="ripple-ring" />
            <circle
              :cx="dotPos[d][0] * svgSize * 0.45 + svgSize * 0.2"
              :cy="dotPos[d][1] * svgSize * 0.45 + svgSize * 0.15 + radius"
              :r="radius * 2.2"
              fill="none"
              stroke="#f59e0b"
              stroke-width="1.5"
              opacity="0.3"
              class="ripple-ring ripple-delay" />
          </g>
        </g>
      </svg>

      <div class="step-progress">
        <div v-for="(dot, idx) in correctDots" :key="'step-' + idx"
          class="step-item"
          :class="{
            'step-completed': idx < completedSteps,
            'step-current': idx === completedSteps,
            'step-pending': idx > completedSteps
          }">
          <span class="step-dot">{{ idx + 1 }}</span>
          <span class="step-label">点{{ dot }}</span>
        </div>
      </div>
    </div>

    <div v-else-if="guideActive && correctDots.length === 0" class="guide-content">
      <p class="text-gray-500 text-sm">空格字符无需点选</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  correctDots: number[]
  selectedDots: number[]
  guideActive: boolean
}>()

defineEmits<{ toggleGuide: [] }>()

const svgSize = 160
const radius = svgSize * 0.12

const dotPos: Record<number, [number, number]> = {
  1: [0, 0], 2: [0, 1], 3: [0, 2],
  4: [1, 0], 5: [1, 1], 6: [1, 2],
}

const completedSteps = computed(() => {
  let count = 0
  for (let i = 0; i < props.correctDots.length; i++) {
    if (props.selectedDots.includes(props.correctDots[i])) {
      count++
    } else {
      break
    }
  }
  return count
})

function getStepNumber(d: number): number {
  const idx = props.correctDots.indexOf(d)
  return idx >= 0 ? idx + 1 : 0
}

function isCompletedDot(d: number): boolean {
  const idx = props.correctDots.indexOf(d)
  return idx >= 0 && idx < completedSteps.value
}

function isCurrentStep(d: number): boolean {
  return props.correctDots[completedSteps.value] === d
}

function getDotFill(d: number): string {
  if (isCompletedDot(d)) return '#a855f7'
  if (isCurrentStep(d)) return '#7c3aed'
  if (props.correctDots.includes(d)) return '#4c1d95'
  return '#1f2937'
}

function getDotStroke(d: number): string {
  if (isCurrentStep(d)) return '#f59e0b'
  if (isCompletedDot(d)) return '#a855f7'
  if (props.correctDots.includes(d)) return '#6d28d9'
  return '#374151'
}

function getDotStrokeWidth(d: number): number {
  if (isCurrentStep(d)) return 3
  if (isCompletedDot(d)) return 2.5
  if (props.correctDots.includes(d)) return 2
  return 1.5
}
</script>

<style scoped>
.gesture-guide {
  background: #111827;
  border-radius: 0.75rem;
  padding: 1rem;
  border: 1px solid #1f2937;
}

.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.guide-title {
  font-weight: 700;
  color: #c084fc;
  font-size: 0.95rem;
}

.guide-toggle {
  background: #374151;
  color: #d1d5db;
  border: none;
  padding: 0.3rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.guide-toggle:hover {
  background: #4b5563;
  color: white;
}

.guide-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.guide-hint {
  font-size: 0.875rem;
  color: #d1d5db;
  text-align: center;
  padding: 0.5rem;
  background: #1f2937;
  border-radius: 0.5rem;
  width: 100%;
}

.hint-done {
  color: #22c55e;
  font-weight: 600;
}

.guide-svg {
  display: block;
}

.dot-pulse {
  animation: dotPulse 1.5s ease-in-out infinite;
}

@keyframes dotPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.ripple-ring {
  animation: ripple 2s ease-out infinite;
  transform-origin: center;
}

.ripple-delay {
  animation-delay: 0.5s;
}

@keyframes ripple {
  0% {
    transform: scale(0.8);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.3);
    opacity: 0;
  }
}

.step-progress {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  transition: all 0.3s;
}

.step-completed {
  background: #065f46;
  color: #6ee7b7;
}

.step-current {
  background: #78350f;
  color: #fbbf24;
  animation: stepBounce 1s ease-in-out infinite;
}

.step-pending {
  background: #1f2937;
  color: #6b7280;
}

.step-dot {
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.65rem;
}

.step-completed .step-dot {
  background: #059669;
}

.step-current .step-dot {
  background: #d97706;
}

.step-pending .step-dot {
  background: #374151;
}

.step-label {
  font-size: 0.7rem;
}

@keyframes stepBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.finger-indicator {
  pointer-events: none;
}
</style>
