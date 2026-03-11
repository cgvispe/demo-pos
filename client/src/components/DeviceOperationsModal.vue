<template>
  <div class="modal-backdrop" @click.self="tryClose">
    <div class="modal-box ops-modal">

      <!-- Header -->
      <div class="ops-header">
        <div>
          <h2>🔧 Device Operations</h2>
          <span class="ops-device-name">{{ device?.name }}</span>
        </div>
        <button class="ops-icon-btn" @click="tryClose">✕</button>
      </div>

      <!-- MENU -->
      <div v-if="phase === 'menu'" class="ops-menu">
        <button v-for="op in operations" :key="op.type" class="ops-menu-btn" @click="selectOperation(op)">
          <span class="ops-menu-icon">{{ op.icon }}</span>
          <div class="ops-menu-text">
            <div class="ops-menu-label">{{ op.label }}</div>
            <div class="ops-menu-desc">{{ op.desc }}</div>
          </div>
          <span class="ops-menu-arrow">›</span>
        </button>
      </div>

      <!-- DENOMINATION PICKER -->
      <template v-else-if="phase === 'denom-picker'">
        <div class="ops-section-header">
          <button class="ops-back-btn" @click="phase = 'menu'">‹ Back</button>
          <span>{{ currentOp?.label }}</span>
        </div>
        <div v-if="loadingContent" class="ops-centered">
          <div class="ops-spinner primary"></div>
          <p>Loading device contents…</p>
        </div>
        <div v-else-if="contentError" class="ops-centered">
          <p style="color:var(--color-danger)">⚠️ {{ contentError }}</p>
          <button class="ops-btn ops-btn-secondary" @click="fetchContent">Retry</button>
        </div>
        <template v-else-if="recyclerItems.length">
          <div class="ops-tabs">
            <button v-for="tab in availableTabs" :key="tab"
              class="ops-tab" :class="{ active: activeTab === tab }"
              @click="activeTab = tab">
              {{ tab === 'notes' ? '🏧 Notes' : '🪙 Coins' }}
              <span class="ops-tab-badge">{{ tabItems(tab).length }}</span>
            </button>
          </div>
          <div class="denom-list">
            <div v-for="item in tabItems(activeTab)" :key="item.key" class="denom-row">
              <div class="denom-info">
                <span class="denom-value">{{ formatDenom(item.value, item.currency) }}</span>
                <span class="denom-avail">{{ item.level }} available</span>
              </div>
              <div class="denom-controls">
                <button class="denom-btn" @click="decrement(item)" :disabled="!selectedDenoms[item.key]">−</button>
                <span class="denom-qty" :class="{ active: selectedDenoms[item.key] > 0 }">{{ selectedDenoms[item.key] || 0 }}</span>
                <button class="denom-btn" @click="increment(item)" :disabled="(selectedDenoms[item.key] || 0) >= item.level">+</button>
              </div>
            </div>
          </div>
          <div class="denom-total-bar">
            <div class="denom-total-left">
              <span class="denom-total-label">Total requested</span>
              <span class="denom-total-items">{{ selectedCount }} items</span>
            </div>
            <span class="denom-total-amount">{{ theme.formatCurrency(selectedTotal) }}</span>
          </div>
          <div class="ops-actions">
            <button class="ops-btn ops-btn-secondary" @click="phase = 'menu'">Cancel</button>
            <button class="ops-btn ops-btn-primary" @click="startDenomOperation" :disabled="selectedCount === 0">
              {{ currentOp?.type === 4 ? '💸 Dispense' : '🔄 Float' }}
            </button>
          </div>
        </template>
        <div v-else class="ops-centered">
          <p style="color:var(--color-text-3)">No items available in recycler.</p>
          <button class="ops-btn ops-btn-secondary" @click="phase = 'menu'">← Back</button>
        </div>
      </template>

      <!-- CONFIRM -->
      <template v-else-if="phase === 'confirm'">
        <div class="ops-section-header">
          <button class="ops-back-btn" @click="phase = 'menu'">‹ Back</button>
          <span>{{ currentOp?.label }}</span>
        </div>
        <div class="ops-confirm-body">
          <span class="ops-confirm-icon">{{ currentOp?.icon }}</span>
          <p>{{ currentOp?.confirmText }}</p>
        </div>
        <div class="ops-actions">
          <button class="ops-btn ops-btn-secondary" @click="phase = 'menu'">Cancel</button>
          <button class="ops-btn ops-btn-primary" @click="startSimpleOperation">Start</button>
        </div>
      </template>

      <!-- CONNECTING -->
      <div v-else-if="phase === 'connecting'" class="ops-centered ops-tall">
        <div class="ops-spinner primary large"></div>
        <p>Connecting to device…</p>
      </div>

      <!-- POLLING -->
      <div v-else-if="phase === 'polling'" class="ops-centered ops-tall">
        <div class="ops-spinner primary large"></div>
        <p class="ops-polling-label">{{ currentOp?.pollingText }}</p>
        <p class="ops-polling-sub">{{ rcStatusLabel(rcStatus) }}</p>
        <div v-if="currentOp?.manualFinish" class="ops-finish-box">
          <p>Insert cash into the recycler. Press <strong>Finish</strong> when done.</p>
          <button class="ops-btn ops-btn-primary" @click="finishOperation" :disabled="finishing">
            {{ finishing ? 'Finishing…' : '✓ Finish' }}
          </button>
        </div>
      </div>

      <!-- SUCCESS -->
      <div v-else-if="phase === 'success'" class="ops-centered ops-tall">
        <div class="ops-result success">✓</div>
        <p class="ops-success-label">{{ currentOp?.label }} completed successfully</p>
        <div v-if="resultTx" class="ops-tx-box">
          <div v-if="resultTx.totalIn"  class="ops-tx-row"><span>Total In</span><strong>{{ theme.formatCurrency(resultTx.totalIn) }}</strong></div>
          <div v-if="resultTx.totalOut" class="ops-tx-row"><span>Total Out</span><strong>{{ theme.formatCurrency(resultTx.totalOut) }}</strong></div>
        </div>
        <button class="ops-btn ops-btn-secondary" @click="phase = 'menu'">← Back to Operations</button>
      </div>

      <!-- ERROR -->
      <div v-else-if="phase === 'error'" class="ops-centered ops-tall">
        <div class="ops-result error">✕</div>
        <p class="ops-error-label">{{ cleanError(errorMessage) }}</p>
        <button class="ops-btn ops-btn-secondary" @click="phase = 'menu'">← Back</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted } from 'vue'
import { useThemeStore } from '../stores/theme'
import api from '../api'

const props = defineProps({ device: Object })
const emit  = defineEmits(['close'])
const theme = useThemeStore()

const operations = [
  { type: 2,  label: 'Load',                icon: '📥', desc: 'Accept cash into recycler cassettes', confirmText: 'The RC5000 will enter acceptance mode. Insert cash, then press Finish when done.', manualFinish: true, pollingText: 'Waiting for cash insertion…', saveTx: true },
  { type: 4,  label: 'Payout Denomination', icon: '💸', desc: 'Dispense selected denominations from recycler', needsContent: true, pollingText: 'Dispensing cash…', saveTx: true },
  { type: 8,  label: 'Float Denomination',  icon: '🔄', desc: 'Move selected denominations to float cassette', needsContent: true, pollingText: 'Moving to float cassette…', saveTx: false },
  { type: 11, label: 'Float Excess',        icon: '📤', desc: 'Move excess cash to float cassette automatically', confirmText: 'The RC5000 will automatically move excess cash to the float cassette.', pollingText: 'Moving excess to float…', saveTx: false },
  { type: 15, label: 'Empty',               icon: '🗑️', desc: 'Empty all cassettes to deposit', confirmText: 'The RC5000 will empty all cassettes to the deposit. This cannot be undone.', pollingText: 'Emptying cassettes…', saveTx: false }
]

const phase        = ref('menu')
const currentOp    = ref(null)
const operationId  = ref(null)
const rcStatus     = ref(0)
const lastPollTotals = ref({ totalIn: 0, totalOut: 0, rcStatus: 0 })
const finishing    = ref(false)
const errorMessage = ref('')
const resultTx     = ref(null)
const loadingContent = ref(false)
const contentError   = ref('')
const contentData    = ref(null)
const activeTab      = ref('notes')
const selectedDenoms = reactive({})
let pollTimer = null

// Only recycler — deposit cannot be dispensed or floated
const recyclerItems = computed(() => {
  if (!contentData.value) return []
  const items = []
  for (const type of ['notes', 'coins']) {
    for (const item of contentData.value.recycler?.[type] || []) {
      if (item.level > 0) items.push({ ...item, denomType: type, key: `${type}_${item.value}_${item.currency}` })
    }
  }
  return items.sort((a, b) => b.value - a.value)
})

const availableTabs = computed(() => {
  const tabs = []
  if (recyclerItems.value.some(i => i.denomType === 'notes')) tabs.push('notes')
  if (recyclerItems.value.some(i => i.denomType === 'coins')) tabs.push('coins')
  return tabs
})

function tabItems(tab) { return recyclerItems.value.filter(i => i.denomType === tab) }

const selectedCount = computed(() => Object.values(selectedDenoms).reduce((s, v) => s + (v || 0), 0))
const selectedTotal = computed(() => recyclerItems.value.reduce((sum, item) => sum + ((selectedDenoms[item.key] || 0) * item.value) / 100, 0))

function rcStatusLabel(s) {
  return { 1:'Started', 2:'Processing', 4:'Finished', 5:'Finished by system', 6:'Error', 7:'Amount not available', 8:'Incomplete', 9:'Cancelled' }[s] || `Status ${s}`
}
function formatDenom(valueCents, currency) {
  return new Intl.NumberFormat(theme.locale, { style: 'currency', currency: currency || theme.currency, minimumFractionDigits: (valueCents / 100) % 1 === 0 ? 0 : 2 }).format(valueCents / 100)
}
function cleanError(msg) {
  if (!msg) return 'Unknown error'
  try {
    const m = msg.match(/\{.*\}/s)
    if (m) {
      const o = JSON.parse(m[0])
      // RC5000 formats: { error: { message } } or { message } or { error: "string" }
      return o?.error?.message || o?.message || (typeof o?.error === 'string' ? o.error : null) || msg
    }
  } catch {}
  return msg.length > 140 ? msg.slice(0, 140) + '…' : msg
}
function buildDenominations() {
  return recyclerItems.value.filter(item => (selectedDenoms[item.key] || 0) > 0).map(item => ({ value: item.value, level: selectedDenoms[item.key], currency: item.currency, denomType: item.denomType }))
}

async function selectOperation(op) {
  currentOp.value = op; resultTx.value = null; errorMessage.value = ''
  if (op.needsContent) {
    Object.keys(selectedDenoms).forEach(k => delete selectedDenoms[k])
    contentData.value = null; contentError.value = ''
    phase.value = 'denom-picker'
    await fetchContent()
    if (availableTabs.value.length) activeTab.value = availableTabs.value[0]
  } else {
    phase.value = 'confirm'
  }
}

async function fetchContent() {
  loadingContent.value = true; contentError.value = ''
  try {
    const res = await api.get(`/sesami/content/${props.device.id}`)
    contentData.value = res.data.levels
    if (availableTabs.value.length) activeTab.value = availableTabs.value[0]
  } catch (e) {
    contentError.value = e.response?.data?.detail || e.response?.data?.error || e.message
  } finally { loadingContent.value = false }
}

function increment(item) { selectedDenoms[item.key] = Math.min((selectedDenoms[item.key] || 0) + 1, item.level) }
function decrement(item) { selectedDenoms[item.key] = Math.max((selectedDenoms[item.key] || 0) - 1, 0) }

async function startDenomOperation() { const d = buildDenominations(); if (d.length) await launchOperation(d) }
async function startSimpleOperation() { await launchOperation(null) }

async function launchOperation(denominations) {
  phase.value = 'connecting'
  try {
    const res = await api.post('/sesami/backoffice/start', { deviceId: props.device.id, type: currentOp.value.type, denominations: denominations || undefined })
    operationId.value = res.data.operationId
    phase.value = 'polling'; startPolling()
  } catch (e) {
    errorMessage.value = e.response?.data?.detail || e.response?.data?.error || e.message
    phase.value = 'error'
  }
}

function startPolling() { stopPolling(); pollTimer = setInterval(pollStatus, 1500) }
function stopPolling()  { if (pollTimer) { clearInterval(pollTimer); pollTimer = null } }

async function pollStatus() {
  try {
    const res = await api.get(`/sesami/operation/${props.device.id}/${operationId.value}`)
    rcStatus.value = res.data.status
    if (res.data.totalIn  != null) lastPollTotals.value.totalIn  = res.data.totalIn
    if (res.data.totalOut != null) lastPollTotals.value.totalOut = res.data.totalOut
    lastPollTotals.value.rcStatus = res.data.status
    if ([1, 2].includes(res.data.status)) return
    stopPolling()
    if ([4, 5, 8].includes(res.data.status)) {
      if (!currentOp.value.manualFinish) await finishOperation()
    } else if (res.data.status === 7) {
      await finishOperation()
    } else {
      errorMessage.value = `Operation ended with status: ${rcStatusLabel(res.data.status)}`
      phase.value = 'error'
      try { await api.post('/sesami/logout', { deviceId: props.device.id }) } catch {}
    }
  } catch (e) { stopPolling(); errorMessage.value = e.response?.data?.error || e.message; phase.value = 'error' }
}

async function finishOperation() {
  if (finishing.value) return
  finishing.value = true; stopPolling()
  try {
    const res = await api.post('/sesami/backoffice/finish', { deviceId: props.device.id, operationId: operationId.value, type: currentOp.value.type, saveTx: currentOp.value.saveTx, totalIn: lastPollTotals.value.totalIn, totalOut: lastPollTotals.value.totalOut, rcStatus: lastPollTotals.value.rcStatus, denominations: currentOp.value.needsContent ? buildDenominations() : undefined })
    resultTx.value = res.data.transaction || null; phase.value = 'success'
  } catch (e) {
    errorMessage.value = e.response?.data?.detail || e.response?.data?.error || e.message; phase.value = 'error'
  } finally { finishing.value = false }
}

function tryClose() { stopPolling(); emit('close') }
onUnmounted(() => stopPolling())
</script>

<style scoped>
.ops-btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; padding:9px 20px; border-radius:var(--radius-sm); font-size:14px; font-weight:600; cursor:pointer; border:1px solid transparent; transition:opacity 0.15s,transform 0.1s; white-space:nowrap; }
.ops-btn:disabled { opacity:0.4; cursor:not-allowed; }
.ops-btn:not(:disabled):hover  { opacity:0.85; }
.ops-btn:not(:disabled):active { transform:scale(0.97); }
.ops-btn-primary   { background:var(--color-primary); color:#000; }
.ops-btn-secondary { background:var(--color-surface-2); color:var(--color-text-2); border-color:var(--color-border); }

.ops-modal { max-width:520px; width:96vw; max-height:90vh; display:flex; flex-direction:column; padding:0; overflow:hidden; }
.ops-header { display:flex; align-items:flex-start; justify-content:space-between; padding:20px 24px 14px; border-bottom:1px solid var(--color-border); flex-shrink:0; }
.ops-header h2 { margin:0 0 2px; font-size:18px; }
.ops-device-name { font-size:13px; color:var(--color-text-3); }
.ops-icon-btn { background:none; border:none; color:var(--color-text-3); font-size:18px; cursor:pointer; padding:4px 8px; line-height:1; }
.ops-icon-btn:hover { color:var(--color-text); }

.ops-menu { padding:12px; display:flex; flex-direction:column; gap:6px; overflow-y:auto; }
.ops-menu-btn { display:flex; align-items:center; gap:14px; background:var(--color-surface-2); border:1px solid var(--color-border); border-radius:var(--radius-md); padding:14px 16px; cursor:pointer; text-align:left; transition:border-color 0.15s,background 0.15s; width:100%; }
.ops-menu-btn:hover { border-color:var(--color-primary); background:rgba(0,196,179,0.05); }
.ops-menu-icon  { font-size:22px; flex-shrink:0; }
.ops-menu-text  { flex:1; min-width:0; }
.ops-menu-label { font-size:14px; font-weight:600; color:var(--color-text); }
.ops-menu-desc  { font-size:12px; color:var(--color-text-3); margin-top:2px; }
.ops-menu-arrow { color:var(--color-text-3); font-size:20px; flex-shrink:0; }

.ops-section-header { display:flex; align-items:center; gap:12px; padding:10px 20px; border-bottom:1px solid var(--color-border); font-weight:600; font-size:15px; flex-shrink:0; }
.ops-back-btn { background:none; border:none; color:var(--color-primary); cursor:pointer; font-size:20px; padding:0 4px; line-height:1; }

.ops-tabs { display:flex; border-bottom:1px solid var(--color-border); flex-shrink:0; }
.ops-tab { flex:1; padding:10px; background:none; border:none; border-bottom:2px solid transparent; cursor:pointer; font-size:13px; font-weight:600; color:var(--color-text-3); display:flex; align-items:center; justify-content:center; gap:6px; transition:color 0.15s,border-color 0.15s; }
.ops-tab:hover { color:var(--color-text); }
.ops-tab.active { color:var(--color-primary); border-bottom-color:var(--color-primary); }
.ops-tab-badge { background:var(--color-surface-2); border:1px solid var(--color-border); border-radius:10px; padding:1px 7px; font-size:11px; color:var(--color-text-3); }
.ops-tab.active .ops-tab-badge { background:rgba(0,196,179,0.15); border-color:rgba(0,196,179,0.3); color:var(--color-primary); }

.denom-list { overflow-y:auto; flex:1; padding:8px 16px; display:flex; flex-direction:column; gap:6px; }
.denom-row { display:flex; align-items:center; justify-content:space-between; background:var(--color-surface-2); border:1px solid var(--color-border); border-radius:var(--radius-sm); padding:10px 14px; transition:border-color 0.15s; }
.denom-info { display:flex; flex-direction:column; gap:2px; }
.denom-value { font-size:16px; font-weight:600; color:var(--color-text); }
.denom-avail { font-size:11px; color:var(--color-text-3); }
.denom-controls { display:flex; align-items:center; gap:10px; }
.denom-btn { width:32px; height:32px; border-radius:50%; background:var(--color-surface); border:1px solid var(--color-border); color:var(--color-text); font-size:20px; cursor:pointer; line-height:1; display:flex; align-items:center; justify-content:center; transition:border-color 0.15s,color 0.15s; }
.denom-btn:hover:not(:disabled) { border-color:var(--color-primary); color:var(--color-primary); }
.denom-btn:disabled { opacity:0.25; cursor:default; }
.denom-qty { font-size:17px; font-weight:700; min-width:26px; text-align:center; color:var(--color-text-3); }
.denom-qty.active { color:var(--color-primary); }

.denom-total-bar { display:flex; align-items:center; justify-content:space-between; padding:12px 20px; border-top:1px solid var(--color-border); background:rgba(0,196,179,0.06); flex-shrink:0; }
.denom-total-left { display:flex; flex-direction:column; gap:2px; }
.denom-total-label { font-size:11px; color:var(--color-text-3); text-transform:uppercase; letter-spacing:0.05em; }
.denom-total-items { font-size:12px; color:var(--color-text-3); }
.denom-total-amount { font-size:22px; font-weight:700; color:var(--color-primary); }

.ops-actions { display:flex; justify-content:flex-end; gap:10px; padding:14px 20px; border-top:1px solid var(--color-border); flex-shrink:0; }

.ops-confirm-body { text-align:center; padding:32px 28px 12px; }
.ops-confirm-icon { font-size:48px; display:block; margin-bottom:16px; }
.ops-confirm-body p { color:var(--color-text-2); font-size:14px; line-height:1.6; margin:0; }

.ops-centered { display:flex; flex-direction:column; align-items:center; padding:32px 24px; gap:14px; text-align:center; }
.ops-centered p { color:var(--color-text-2); font-size:14px; margin:0; }
.ops-tall { padding:48px 24px; }
.ops-polling-label { font-size:16px; font-weight:600; color:var(--color-text) !important; }
.ops-polling-sub   { font-size:13px; color:var(--color-text-3) !important; }

.ops-spinner { width:32px; height:32px; border-radius:50%; border:3px solid var(--color-border); border-top-color:var(--color-text-3); animation:ops-spin 0.8s linear infinite; flex-shrink:0; }
.ops-spinner.large   { width:48px; height:48px; }
.ops-spinner.primary { border-top-color:var(--color-primary); }
@keyframes ops-spin { to { transform:rotate(360deg); } }

.ops-finish-box { background:rgba(0,196,179,0.08); border:1px solid rgba(0,196,179,0.3); border-radius:var(--radius-md); padding:20px 24px; text-align:center; width:100%; max-width:340px; }
.ops-finish-box p { color:var(--color-text-2); font-size:14px; margin:0 0 14px; }

.ops-result { width:64px; height:64px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:26px; font-weight:700; }
.ops-result.success { background:rgba(0,196,179,0.15); color:var(--color-primary); border:2px solid var(--color-primary); }
.ops-result.error   { background:rgba(239,68,68,0.15);  color:var(--color-danger);  border:2px solid var(--color-danger); }
.ops-success-label { font-size:15px; font-weight:600; color:var(--color-text); margin:0; }
.ops-error-label   { font-size:13px; color:var(--color-danger); margin:0; max-width:360px; }

.ops-tx-box { background:var(--color-surface-2); border:1px solid var(--color-border); border-radius:var(--radius-sm); padding:12px 20px; width:100%; max-width:280px; }
.ops-tx-row { display:flex; justify-content:space-between; font-size:14px; padding:4px 0; color:var(--color-text-2); }
.ops-tx-row strong { color:var(--color-text); }
</style>
