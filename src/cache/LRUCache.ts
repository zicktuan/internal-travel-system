class LRUCache<K, V> {
    private cache = new Map<K, V>();
    private readonly maxSize: number;

    constructor(maxSize: number = 1000) {
        this.maxSize = maxSize;
    }

    get(key: K): V | undefined {
        if (!this.cache.has(key)) return undefined;
        
        const value = this.cache.get(key)!;
        // Move to end (most recently used)
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
    }

    set(key: K, value: V): void {
        if (this.cache.has(key)) {
            this.cache.delete(key);
        } else if (this.cache.size >= this.maxSize) {
            const firstKey = this.getFirstKey();
            if (firstKey !== undefined) {
                this.cache.delete(firstKey);
            }
        }
        this.cache.set(key, value);
    }

    delete(key: K): boolean {
        return this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }

    private getFirstKey(): K | undefined {
    return this.cache.keys().next().value;
}
}

export default LRUCache;