<template>
  <div id="app">
    <header class="header">
      <div class="container">
        <div>
        <h1>CLICKHR + CEIPAL Data Viewer</h1>
        <p>Abdul Ahad Sharif - I8IS Inc</p>
        </div>
        <div class="header-actions">
          <!-- <button 
            @click="handleSync" 
            :disabled="isSyncing"
            class="sync-button"
            :class="{ 'loading': isSyncing }"
          >
            <span v-if="!isSyncing">Sync Now</span>
            <span v-else>Syncing...</span>
          </button> -->
        </div>
      </div>
    </header>

    <main class="main">
      <div class="container">
        <CandidatesTable />
      </div>
    </main>

    <!-- Sync Status Toast -->
    <div v-if="syncMessage" class="toast" :class="syncMessage.type">
      {{ syncMessage.text }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import CandidatesTable from './components/CandidatesTable.vue';
import { triggerSync } from './services/api.js';

// Reactive state
const isSyncing = ref(false);
const syncMessage = ref(null);

// Methods
const handleSync = async () => {
  if (isSyncing.value) return;
  
  isSyncing.value = true;
  syncMessage.value = null;
  
  try {
    const result = await triggerSync();
    syncMessage.value = {
      type: 'success',
      text: `Sync completed! Imported ${result.imported} records.`
    };
  } catch (error) {
    syncMessage.value = {
      type: 'error',
      text: `Sync failed: ${error.message}`
    };
  } finally {
    isSyncing.value = false;
    
    // Auto-hide message after 5 seconds
    setTimeout(() => {
      syncMessage.value = null;
    }, 5000);
  }
};
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h1 {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
}

.sync-button {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
}

.sync-button:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.sync-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sync-button.loading {
  position: relative;
}

.sync-button.loading::after {
  content: '';
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border: 2px solid transparent;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: translateY(-50%) rotate(0deg); }
  100% { transform: translateY(-50%) rotate(360deg); }
}

.main {
  padding: 2rem 0;
  min-height: calc(100vh - 80px);
}

.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 1rem 1.5rem;
  border-radius: 6px;
  color: white;
  font-weight: 500;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

.toast.success {
  background: #10b981;
}

.toast.error {
  background: #ef4444;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
