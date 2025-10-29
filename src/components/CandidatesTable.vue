<template>
  <div class="candidates-table-container">
    <div class="filters">
      <div class="filter-row">
        <div class="filter-group">
          <label for="search">Search</label>
          <input
            id="search"
            v-model="search"
            type="text"
            placeholder="Search by name, email, or job title..."
            class="filter-input"
          />
        </div>
        
        <div class="filter-group">
          <label for="jobId">Job Title</label>
          <select
            id="jobId"
            v-model="jobId"
            class="filter-select"
          >
            <option value="">All Jobs</option>
            <option v-for="job in jobs" :key="job" :value="job">
              {{ job }}
            </option>
          </select>
        </div>
        
        <div class="filter-group">
          <label for="fromDate">From Date</label>
          <input
            id="fromDate"
            v-model="fromDate"
            type="date"
            class="filter-input"
          />
        </div>
        
        <div class="filter-group">
          <label for="toDate">To Date</label>
          <input
            id="toDate"
            v-model="toDate"
            type="date"
            class="filter-input"
          />
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading candidates...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="load" class="retry-button">Retry</button>
    </div>

    <div v-else class="table-container">
      <div class="table-header">
        <h2>Candidates ({{ total }} total)</h2>
        <div class="table-controls">
          <label for="limit">Per page:</label>
          <select id="limit" v-model="limit" class="limit-select">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="candidates-table">
          <thead>
            <tr>
              <th @click="sortBy('full_name')" class="sortable">
                Name
                <span class="sort-indicator" :class="getSortClass('full_name')">
                  {{ getSortSymbol('full_name') }}
                </span>
              </th>
              <th>Email</th>
              <th>Phone</th>
              <th @click="sortBy('job_title')" class="sortable">
                Job Title
                <span class="sort-indicator" :class="getSortClass('job_title')">
                  {{ getSortSymbol('job_title') }}
                </span>
              </th>
              <th>Location</th>
              <th>LinkedIn</th>
              <th>Resume</th>
              <th @click="sortBy('api_created_at')" class="sortable">
                Submitted
                <span class="sort-indicator" :class="getSortClass('api_created_at')">
                  {{ getSortSymbol('api_created_at') }}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="candidate in rows" :key="candidate.id" class="candidate-row">
              <td class="name-cell">
                <div class="candidate-name">
                  {{ candidate.full_name || 'N/A' }}
                </div>
              </td>
              <td class="email-cell">
                <a v-if="candidate.email_address" :href="`mailto:${candidate.email_address}`" class="email-link">
                  {{ candidate.email_address }}
                </a>
                <span v-else class="no-data">N/A</span>
              </td>
              <td class="phone-cell">
                <a v-if="candidate.mobile_number" :href="`tel:${candidate.mobile_number}`" class="phone-link">
                  {{ candidate.mobile_number }}
                </a>
                <span v-else class="no-data">N/A</span>
              </td>
              <td class="job-cell">
                <span class="job-title">{{ candidate.job_title || 'N/A' }}</span>
              </td>
              <td class="location-cell">
                {{ candidate.location || 'N/A' }}
              </td>
              <td class="linkedin-cell">
                <a 
                  v-if="candidate.linkedin_profile_url" 
                  :href="candidate.linkedin_profile_url" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="linkedin-link"
                >
                  LinkedIn
                </a>
                <span v-else class="no-data">N/A</span>
              </td>
              <td class="resume-cell">
                <a 
                  v-if="candidate.resume_url" 
                  :href="candidate.resume_url" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="resume-link"
                >
                  Resume
                </a>
                <span v-else class="no-data">N/A</span>
              </td>
              <td class="date-cell">
                {{ formatDate(candidate.api_created_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <div class="pagination-info">
          <span>Total: {{ total }}</span>
          <span>Page {{ page }} of {{ totalPages }}</span>
        </div>
        
        <div class="pagination-controls">
          <button 
            @click="previousPage" 
            :disabled="page <= 1"
            class="pagination-button"
          >
            Previous
          </button>
          
          <span class="page-info">
            {{ page }} / {{ totalPages }}
          </span>
          
          <button 
            @click="nextPage" 
            :disabled="page >= totalPages"
            class="pagination-button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
// Make sure this path is correct for your project structure
import { fetchJobs, fetchCandidates } from '../services/api.js'; 

// Reactive state
const jobs = ref([]);
const rows = ref([]);
const total = ref(0);
const totalPages = ref(0);
const page = ref(1);
const limit = ref(10);
const search = ref('');
const jobId = ref('');
const fromDate = ref('');
const toDate = ref('');
const sort = ref('api_created_at'); // Changed default sort
const dir = ref('desc');
const loading = ref(false);
const error = ref(null);

// Debounce timer
let debounceTimer = null;

// Methods
const load = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const params = {
      q: search.value || null,
      jobId: jobId.value || null,
      fromDate: fromDate.value || null,
      toDate: toDate.value || null,
      sort: sort.value,
      dir: dir.value,
      page: page.value,
      limit: limit.value
    };

    const result = await fetchCandidates(params);
    
    rows.value = result.data || [];
    total.value = result.pagination?.total || 0;
    totalPages.value = result.pagination?.totalPages || 0;
    page.value = result.pagination?.page || 1;
    
  } catch (err) {
    error.value = err.message || 'Failed to load candidates';
    console.error('Error loading candidates:', err);
  } finally {
    loading.value = false;
  }
};

const loadJobs = async () => {
  try {
    const jobList = await fetchJobs();
    jobs.value = jobList;
  } catch (err) {
    console.error('Error loading jobs:', err);
  }
};

const sortBy = (field) => {
  if (sort.value === field) {
    dir.value = dir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sort.value = field;
    dir.value = 'asc';
  }
  page.value = 1; // Reset to first page when sorting
  load();
};

const getSortClass = (field) => {
  if (sort.value !== field) return '';
  return dir.value === 'asc' ? 'asc' : 'desc';
};

const getSortSymbol = (field) => {
  if (sort.value !== field) return '↕';
  return dir.value === 'asc' ? '↑' : '↓';
};

const nextPage = () => {
  if (page.value < totalPages.value) {
    page.value++;
    load();
  }
};

const previousPage = () => {
  if (page.value > 1) {
    page.value--;
    load();
  }
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'N/A';
  }
};

// Debounced search
const debouncedLoad = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    page.value = 1; // Reset to first page when searching
    load();
  }, 300);
};

// Watchers
watch(search, debouncedLoad);
watch(jobId, () => {
  page.value = 1;
  load();
});
watch(fromDate, () => {
  page.value = 1;
  load();
});
watch(toDate, () => {
  page.value = 1;
  load();
});
watch(limit, () => {
  page.value = 1;
  load();
});

// Lifecycle
onMounted(async () => {
  await loadJobs();
  await load();
});
</script>

<style scoped>
.candidates-table-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
}

.filters {
  padding: 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.filter-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 1rem;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.filter-input,
.filter-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.loading-state,
.error-state {
  padding: 3rem;
  text-align: center;
  color: #6b7280;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-button {
  background: #667eea;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
}

.table-container {
  padding: 0;
}

.table-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header h2 {
  margin: 0;
  color: #1f2937;
  font-size: 1.25rem;
}

.table-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.limit-select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
}

.table-wrapper {
  overflow-x: auto;
}

.candidates-table {
  width: 100%;
  border-collapse: collapse;
}

.candidates-table th {
  background: #f8fafc;
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e2e8f0;
  white-space: nowrap;
}

.candidates-table th.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.candidates-table th.sortable:hover {
  background: #f1f5f9;
}

.sort-indicator {
  margin-left: 0.5rem;
  font-size: 0.75rem;
  opacity: 0.5;
}

.sort-indicator.asc,
.sort-indicator.desc {
  opacity: 1;
  color: #667eea;
}

.candidates-table td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: top;
  white-space: nowrap;
}

.candidate-row:hover {
  background: #f8fafc;
}

.candidate-name {
  font-weight: 500;
  color: #1f2937;
}

.email-link,
.phone-link {
  color: #667eea;
  text-decoration: none;
}

.email-link:hover,
.phone-link:hover {
  text-decoration: underline;
}

.linkedin-link {
  color: #0077b5;
  text-decoration: none;
  font-weight: 500;
}

.linkedin-link:hover {
  text-decoration: underline;
}

.resume-link {
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
}

.resume-link:hover {
  text-decoration: underline;
}

.job-title {
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: normal;
  display: inline-block;
  max-width: 250px;
}

.no-data {
  color: #9ca3af;
  font-style: italic;
}

.pagination {
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
}

.pagination-info {
  display: flex;
  gap: 1rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pagination-button {
  background: white;
  border: 1px solid #d1d5db;
  color: #374151;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.pagination-button:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #9ca3af;
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
}

@media (max-width: 1024px) {
  .filter-row {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 768px) {
  .filter-row {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .table-header {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .pagination {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
  
  .pagination-controls {
    justify-content: center;
  }

  .candidates-table td {
    white-space: normal;
  }

  .candidates-table td.job-cell {
    min-width: 200px;
  }
}
</style>