/**
 * API Throttle utility to prevent overwhelming the backend with too many concurrent requests
 */

interface QueuedRequest {
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class ApiThrottle {
  private queue: QueuedRequest[] = [];
  private activeRequests = 0;
  private readonly maxConcurrent: number;
  private readonly delayBetweenBatches: number;
  
  constructor(maxConcurrent = 5, delayBetweenBatches = 100) {
    this.maxConcurrent = maxConcurrent;
    this.delayBetweenBatches = delayBetweenBatches;
  }
  
  async throttle<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        execute: requestFn,
        resolve,
        reject
      });
      this.processQueue();
    });
  }
  
  private async processQueue() {
    if (this.activeRequests >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }
    
    const request = this.queue.shift();
    if (!request) return;
    
    this.activeRequests++;
    
    try {
      const result = await request.execute();
      request.resolve(result);
    } catch (error) {
      request.reject(error);
    } finally {
      this.activeRequests--;
      
      // Add a small delay before processing the next request
      if (this.queue.length > 0) {
        setTimeout(() => this.processQueue(), this.delayBetweenBatches);
      }
    }
  }
  
  // Reset the throttle (useful for cleanup)
  reset() {
    this.queue = [];
    this.activeRequests = 0;
  }
  
  // Get current queue status
  getStatus() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      maxConcurrent: this.maxConcurrent
    };
  }
}

// Create a singleton instance for inventory requests
export const inventoryThrottle = new ApiThrottle(3, 200); // Max 3 concurrent, 200ms between batches

// Create a general API throttle
export const apiThrottle = new ApiThrottle(5, 100); // Max 5 concurrent, 100ms between batches

export default ApiThrottle;
