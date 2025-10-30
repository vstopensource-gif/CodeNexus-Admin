// Pagination manager to reduce Firestore reads
const ITEMS_PER_PAGE = 50; // Load 50 items at a time

export class PaginationManager {
  constructor(cacheKey, fetchFn, renderFn) {
    this.cacheKey = cacheKey;
    this.fetchFn = fetchFn; // Function that fetches all data
    this.renderFn = renderFn; // Function that renders data
    this.allItems = [];
    this.currentPage = 1;
    this.filteredItems = [];
    this.currentFilter = '';
  }

  async loadInitial() {
    // Check if we have cached full data
    const cached = localStorage.getItem(this.cacheKey);
    if (cached) {
      try {
        const { data } = JSON.parse(cached);
        if (data && data.length > 0) {
          console.log(`[Pagination] Using cached data: ${data.length} items`);
          this.allItems = data;
          this.filteredItems = data;
          this.renderPage(1);
          return true;
        }
      } catch (e) {
        console.warn('[Pagination] Cache parse error:', e);
      }
    }

    // Fetch from Firebase
    console.log(`[Pagination] Fetching from Firebase...`);
    this.allItems = await this.fetchFn();
    this.filteredItems = [...this.allItems];
    
    // Cache the data
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify({
        data: this.allItems,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('[Pagination] Could not cache:', e);
    }

    this.renderPage(1);
    return false; // Indicates we fetched from Firebase
  }

  filter(query) {
    this.currentFilter = query.toLowerCase().trim();
    if (!this.currentFilter) {
      this.filteredItems = [...this.allItems];
    } else {
      // Override in child classes with specific filter logic
      this.filteredItems = this.allItems.filter(item => this.matchesFilter(item, this.currentFilter));
    }
    this.currentPage = 1;
    this.renderPage(1);
  }

  matchesFilter(item, query) {
    // Override in child classes
    return true;
  }

  renderPage(page, append = false) {
    this.currentPage = page;
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = this.filteredItems.slice(start, end);
    
    this.renderFn(pageItems, start, append);
    this.updateLoadMoreButton();
  }

  loadMore() {
    const totalPages = Math.ceil(this.filteredItems.length / ITEMS_PER_PAGE);
    if (this.currentPage < totalPages) {
      this.renderPage(this.currentPage + 1, true); // true = append
    }
  }

  updateLoadMoreButton() {
    const totalPages = Math.ceil(this.filteredItems.length / ITEMS_PER_PAGE);
    // Try to find load more button - can be overridden by specific IDs
    const loadMoreBtn = document.getElementById('load-more-btn') || 
                       document.getElementById('load-more-users') ||
                       document.getElementById('load-more-registrations');
    
    if (loadMoreBtn) {
      if (this.currentPage >= totalPages) {
        loadMoreBtn.style.display = 'none';
      } else {
        loadMoreBtn.style.display = 'block';
        const remaining = this.filteredItems.length - (this.currentPage * ITEMS_PER_PAGE);
        loadMoreBtn.textContent = `Load More (${remaining} remaining)`;
      }
    }
  }

  getTotalCount() {
    return this.filteredItems.length;
  }

  getAllItems() {
    return this.allItems;
  }

  clear() {
    this.allItems = [];
    this.filteredItems = [];
    this.currentPage = 1;
    this.currentFilter = '';
  }
}

export { ITEMS_PER_PAGE };

